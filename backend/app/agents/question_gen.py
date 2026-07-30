import json
from app.core.groq_client import get_groq_client
from app.core.config import config

class QuestionGenerationAgent:
    """
    Generates new questions using Groq LLM.
    """
    def __init__(self):
        self.client = get_groq_client()

    async def generate(self, topic: str, difficulty: float) -> dict:
        prompt = f"""
Generate a multiple-choice question about '{topic}' with a difficulty level of {difficulty} out of 10.
Respond strictly in JSON format with the following structure:
{{
  "question": "The question text here",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "correct_answer": "option 1"
}}
"""
        response = await self.client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert question generator."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content.strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {
                "question": "Failed to generate question.",
                "options": [],
                "correct_answer": ""
            }

    async def generate_variant(self, base_question: dict) -> dict:
        """
        Generates a semantically equivalent variant of a base question.
        """
        prompt = f"""
You are an expert educational content writer. Your task is to generate a semantically equivalent variant of the following multiple-choice question to prevent cheating and answer copying.

A semantically equivalent variant must:
1. Test the exact same concept and logic at the exact same difficulty level and Bloom's Taxonomy level.
2. Change the scenario, cover story, names, variables, and numerical values (if math/science). For example, if the base question is about a train traveling between two cities, change it to a boat traveling between two islands, or a runner on a track.
3. Shuffle the correct answer option position (A, B, C, D) randomly so that the correct letter is different from the base question, if possible.
4. Update the explanations and misconceptions to match the new scenario, names, and variables.

Base Question JSON:
{json.dumps(base_question, indent=2)}

Respond strictly in valid JSON format (no markdown, no backticks):
{{
  "question": "The new question text with changed scenario/numbers",
  "options": {{
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  }},
  "correct_answer": "The new correct option letter (A, B, C, or D)",
  "explanation": "Updated explanation matching the new scenario",
  "difficulty": {base_question.get('difficulty', 0.5)},
  "bloom_level": "{base_question.get('bloom_level', 'Apply')}",
  "misconceptions": {{
    "A": "Misconception for Option A (if incorrect)",
    "B": "Misconception for Option B (if incorrect)",
    "C": "Misconception for Option C (if incorrect)",
    "D": "Misconception for Option D (if incorrect)"
  }}
}}
"""
        response = await self.client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a question mutation specialist."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content.strip()
        try:
            data = json.loads(content)
            data["is_variant"] = True
            return data
        except json.JSONDecodeError:
            # Fallback to base question if variant generation fails
            base_copy = dict(base_question)
            base_copy["is_variant"] = False
            return base_copy

