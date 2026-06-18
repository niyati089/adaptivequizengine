import json
from app.core.groq_client import get_groq_client
from app.core.config import config

class ExplanationAgent:
    def __init__(self):
        self.client = get_groq_client()

    async def generate_explanation(self, question: str, correct_answer: str, difficulty: str) -> dict:
        prompt = f"""
You are an expert tutor. Provide a learner-friendly explanation for the following question and answer.
Adjust your explanation depth based on the provided difficulty level: {difficulty}.

Question: {question}
Correct Answer: {correct_answer}

Respond strictly in JSON format with the following keys:
- "explanation": A detailed explanation tailored to the difficulty.
- "key_takeaway": A short, memorable summary or key takeaway.
"""
        response = await self.client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful tutor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content.strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {
                "explanation": content,
                "key_takeaway": "Always review the core concepts carefully."
            }
