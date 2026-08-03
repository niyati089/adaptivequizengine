import hashlib
import json
from collections import OrderedDict

from app.agents.mermaid_utils import sanitize_mermaid
from app.core.groq_client import get_groq_client
from app.core.config import config

# Small in-process cache so repeated practice on the same question doesn't
# re-hit the LLM every time. Per-worker-process only (not shared across
# multiple uvicorn workers) -- a reasonable first pass; can graduate to a
# persistent/shared cache later if it proves valuable.
_CACHE_MAX_SIZE = 256
_explanation_cache: "OrderedDict[str, dict]" = OrderedDict()


def _cache_key(question: str, correct_answer: str, difficulty: str) -> str:
    raw = f"{question}\x00{correct_answer}\x00{difficulty}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class ExplanationAgent:
    def __init__(self):
        self.client = get_groq_client()

    async def generate_explanation(self, question: str, correct_answer: str, difficulty: str) -> dict:
        cache_key = _cache_key(question, correct_answer, difficulty)
        cached = _explanation_cache.get(cache_key)
        if cached is not None:
            _explanation_cache.move_to_end(cache_key)
            return cached

        prompt = f"""
You are an expert tutor. Provide a learner-friendly explanation for the following question and answer.
Adjust your explanation depth based on the provided difficulty level: {difficulty}.

Question: {question}
Correct Answer: {correct_answer}

Respond strictly in JSON format with the following keys:
- "explanation": A detailed explanation tailored to the difficulty.
- "key_takeaway": A short, memorable summary or key takeaway.
- "example": A concrete, real-world example illustrating the concept.
- "common_mistake": A common pitfall or mistake learners make on this topic and how to avoid it.
- "mermaid_diagram": (Optional) Valid Mermaid.js flowchart or graph syntax (TD or LR) representing the visual workflow, process, or relationship described in the explanation. Set this to null if the question is simple recall, factual trivia, or if a diagram does not add genuine educational value (e.g. "What is the capital of India?").

Strict Mermaid Syntax Rules (Crucial!):
1. Every node ID must be a simple alphanumeric word (e.g., A, B, C).
2. You MUST enclose ALL node labels in double quotes inside the shape brackets. For example: A["Label text here"] or B("Another label"). NEVER omit the double quotes for labels.
3. Always use double-dashes `-->` for connections. NEVER use single-dash `->`.
4. Do not include markdown code block backticks (```mermaid) inside the JSON value.
5. Every statement must be on a new line. Do NOT use commas (,) to separate statements or end lines.
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
            data = json.loads(content)
            raw_diagram = data.get("mermaid_diagram")
            sanitized = sanitize_mermaid(raw_diagram) if isinstance(raw_diagram, str) else ""
            data["mermaid_diagram"] = sanitized or None
        except json.JSONDecodeError:
            data = {
                "explanation": content,
                "key_takeaway": "Always review the core concepts carefully.",
                "example": "Reviewing core principles helps contextualize learning.",
                "common_mistake": "Skipping basic conceptual details or misinterpreting the problem definition.",
                "mermaid_diagram": None,
            }

        self._store_in_cache(cache_key, data)
        return data

    @staticmethod
    def _store_in_cache(key: str, value: dict) -> None:
        _explanation_cache[key] = value
        _explanation_cache.move_to_end(key)
        while len(_explanation_cache) > _CACHE_MAX_SIZE:
            _explanation_cache.popitem(last=False)
