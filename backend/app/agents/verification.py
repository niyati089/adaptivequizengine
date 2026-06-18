from app.core.groq_client import get_groq_client
from app.core.config import config

class VerificationAgent:
    """
    Verifies LLM outputs for correctness and safety using Groq LLM.
    """
    def __init__(self):
        self.client = get_groq_client()

    async def verify(self, content: str) -> bool:
        prompt = f"""
Analyze the following content and determine if it is factually correct, safe, and appropriate for an educational platform.
Content: "{content}"
Respond with strictly 'True' or 'False'.
"""
        response = await self.client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a content verification agent."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0
        )
        result = response.choices[0].message.content.strip().lower()
        return result == 'true'
