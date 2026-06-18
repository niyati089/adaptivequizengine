from app.core.groq_client import get_groq_client
from app.core.config import config

class SocraticAgent:
    def __init__(self):
        self.client = get_groq_client()

    async def generate_hint(self, question: str, user_answer: str, correct_answer: str) -> str:
        prompt = f"""
You are a helpful Socratic tutor. A student has answered a question incorrectly.
Instead of giving the direct answer, provide a hint or a guiding question that helps them realize their mistake.

Question: {question}
Correct Answer: {correct_answer}
Student's Answer: {user_answer}

Provide a Socratic hint:
"""
        response = await self.client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a Socratic tutor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
