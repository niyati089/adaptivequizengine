from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from groq import Groq
from dotenv import load_dotenv
import json
import math
import os

load_dotenv()

app = FastAPI(title="Adaptive Quiz Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.irt.theta_estimator import ThetaEstimator
from app.dag.topic_dag import TopicDAGEngine

# ─── Request / Response Models ────────────────────────────────────────────────

class NotesRequest(BaseModel):
    topic: str
    api_key: Optional[str] = None

class QuestionRequest(BaseModel):
    topic: str
    subtopic: str
    difficulty: float
    bloom_level: str
    previous_questions: list[str] = []
    api_key: Optional[str] = None

class AnswerRequest(BaseModel):
    theta: float
    difficulty: float
    selected_option: str
    correct_answer: str
    topic: str
    subtopic: str
    question: str
    api_key: Optional[str] = None

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/generate-notes")
async def generate_notes(req: NotesRequest):
    """
    Generate structured notes + Topic DAG for a given topic.
    Returns: { dag, notes, subtopics }
    """
    api_key = req.api_key or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key required")

    try:
        engine = TopicDAGEngine(api_key=api_key)
        data = engine.generate_dag_and_notes(req.topic)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON parse error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating notes: {e}")

    return data


@app.post("/api/generate-question")
async def generate_question(req: QuestionRequest):
    """
    Generate a single MCQ calibrated to given IRT difficulty + Bloom level.
    Returns: { question, options, correct_answer, explanation, difficulty, bloom_level }
    """
    api_key = req.api_key or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key required")

    client = Groq(api_key=api_key)

    difficulty_label = ThetaEstimator.theta_to_label(req.difficulty)
    avoid = "\n".join(f"- {q}" for q in req.previous_questions[-5:]) if req.previous_questions else "None"

    prompt = f"""Generate a single multiple-choice question for adaptive learning.

Topic: {req.topic}
Subtopic: {req.subtopic}
Difficulty level: {difficulty_label} (IRT b-parameter: {req.difficulty})
Bloom's Taxonomy level: {req.bloom_level}

Previously asked questions (DO NOT repeat these):
{avoid}

Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "question": "The question text",
  "options": {{
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  }},
  "correct_answer": "A",
  "explanation": "Why this answer is correct, and what misconception each wrong answer represents",
  "difficulty": {req.difficulty},
  "bloom_level": "{req.bloom_level}",
  "misconceptions": {{
    "B": "What misunderstanding leads to choosing B",
    "C": "What misunderstanding leads to choosing C",
    "D": "What misunderstanding leads to choosing D"
  }}
}}

Calibration guide:
- Beginner (-3 to -1.5): recall definitions, identify basic concepts
- Elementary (-1.5 to -0.5): understand relationships, simple applications
- Intermediate (-0.5 to 0.5): apply concepts to new situations
- Advanced (0.5 to 1.5): analyze, compare, debug complex scenarios
- Expert (1.5 to 3): evaluate tradeoffs, synthesize, create solutions"""

    message = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    raw = message.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        data = json.loads(raw, strict=False)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON parse error: {e}")

    return data


@app.post("/api/submit-answer")
async def submit_answer(req: AnswerRequest):
    """
    Process answer, update theta, return feedback + next question params.
    Returns: { correct, new_theta, theta_label, explanation, misconception, next_difficulty, next_bloom }
    """
    correct = req.selected_option == req.correct_answer
    new_theta = ThetaEstimator.update_theta(req.theta, correct, req.difficulty)
    next_difficulty = ThetaEstimator.select_next_difficulty(new_theta)

    bloom_order = ["remember", "understand", "apply", "analyze", "evaluate", "create"]
    current_bloom_idx = bloom_order.index(req.subtopic) if req.subtopic in bloom_order else 1

    if correct and new_theta > req.theta + 0.1:
        next_bloom_idx = min(current_bloom_idx + 1, len(bloom_order) - 1)
    elif not correct and new_theta < req.theta - 0.1:
        next_bloom_idx = max(current_bloom_idx - 1, 0)
    else:
        next_bloom_idx = current_bloom_idx

    return {
        "correct": correct,
        "new_theta": new_theta,
        "theta_label": ThetaEstimator.theta_to_label(new_theta),
        "next_difficulty": next_difficulty,
        "next_bloom": bloom_order[next_bloom_idx],
        "probability_correct": round(ThetaEstimator.irt_probability(req.theta, req.difficulty), 3),
    }


@app.get("/health")
async def health():
    return {"status": "ok"}