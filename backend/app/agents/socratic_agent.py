from app.core.groq_client import get_groq_client
from app.core.config import config

class SocraticAgent:
    def __init__(self):
        self.client = get_groq_client()

    async def generate_hint(self, question: str, user_answer: str, correct_answer: str, hint_level: int = 1) -> str:
        if hint_level == 2:
            prompt = f"""
You are a helpful Socratic tutor. A student has answered a question incorrectly and is still stuck after receiving a first hint.
Provide a second, more specific guiding hint that breaks down the problem or points out a specific error in their reasoning, without giving away the final correct answer.

Question: {question}
Correct Answer: {correct_answer}
Student's Answer: {user_answer}

Provide a more specific Socratic hint:
"""
        else:
            prompt = f"""
You are a helpful Socratic tutor. A student has answered a question incorrectly.
Provide a subtle, high-level guiding question or hint that helps them realize their mistake, without giving away the final correct answer.

Question: {question}
Correct Answer: {correct_answer}
Student's Answer: {user_answer}

Provide a subtle Socratic hint:
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
