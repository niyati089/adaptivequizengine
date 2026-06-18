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
