"""Anti-cheat question variant generator.

Generates a semantically equivalent but surface-different variant of a base
question (different names / numbers / scenario, same concept + difficulty +
Bloom level).  Falls back to the base question when the LLM produces
invalid JSON or a structurally invalid variant.
"""
from __future__ import annotations

import json
import random
from typing import Optional
import httpx

from groq import Groq

from app.misconceptions.seed_tags import DEFAULT_TAGS


def _shuffle_options(data: dict) -> dict:
    """Re-label A/B/C/D with a fresh random permutation so the correct
    answer letter changes between the base question and the variant."""
    old_options: dict[str, str] = data["options"]
    old_correct: str = data["correct_answer"]

    keys = list(old_options.keys())
    shuffled_keys = keys[:]
    random.shuffle(shuffled_keys)

    new_options: dict[str, str] = {}
    new_correct = old_correct
    new_misconceptions: dict[str, str] = {}

    old_misconceptions: dict[str, str] = data.get("misconceptions") or {}

    for new_key, old_key in zip(keys, shuffled_keys):
        new_options[new_key] = old_options[old_key]
        if old_key == old_correct:
            new_correct = new_key
        if old_key in old_misconceptions:
            new_misconceptions[new_key] = old_misconceptions[old_key]

    return {
        **data,
        "options": new_options,
        "correct_answer": new_correct,
        "misconceptions": new_misconceptions,
        "is_variant": True,
    }


def _validate_variant(data: dict) -> bool:
    """Return True iff the variant has the required structure."""
    required_keys = {"A", "B", "C", "D"}
    opts = data.get("options")
    if not isinstance(opts, dict):
        return False
    if set(opts.keys()) != required_keys:
        return False
    if data.get("correct_answer") not in required_keys:
        return False
    if not data.get("question"):
        return False
    return True


def generate_variant(base_question: dict, api_key: str) -> dict:
    """Return a variant of *base_question* or the base itself on failure.

    The returned dict always includes ``is_variant: bool`` so callers can
    tell at a glance whether the LLM rewrite succeeded.
    """
    # Build a human-readable tag list for the prompt so the LLM keeps
    # wrong-option misconception text anchored to recognizable categories.
    tag_descriptions = "\n".join(
        f"- {tag}: {label} — {desc}" for tag, label, desc in DEFAULT_TAGS
    )

    prompt = f"""You are an adaptive quiz engine. Your job is to rewrite the
question below so that it tests the SAME concept, at the SAME difficulty and
Bloom's level, but uses DIFFERENT surface details (different character names,
numbers, code snippets, or real-world scenario).

Rules:
1. Keep the concept, Bloom's level, and difficulty IDENTICAL.
2. Change names, numbers, or scenarios enough that the wording is clearly different.
3. Maintain four options labelled A, B, C, D.
4. The correct answer must still be correct for the rewritten question.
5. For each WRONG option, write a misconception description that maps to one
   of these canonical misconception categories (keep the mapping recognizable):
{tag_descriptions}
6. Do NOT copy the original wording verbatim.

Original question:
{json.dumps(base_question, indent=2)}

Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "question": "Rewritten question text",
  "options": {{
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D"
  }},
  "correct_answer": "A",
  "explanation": "Why the correct answer is correct",
  "difficulty": {base_question.get("difficulty", 0.0)},
  "bloom_level": "{base_question.get("bloom_level", "Remembering")}",
  "misconceptions": {{
    "B": "Misconception for B",
    "C": "Misconception for C",
    "D": "Misconception for D"
  }},
  "hint": "A subtle hint without giving away the answer"
}}"""

    try:
        client = Groq(
            api_key=api_key,
            http_client=httpx.Client(verify=False)
        )
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content.strip()

        # Strip accidental code fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        variant = json.loads(raw, strict=False)
    except Exception:
        # Any network/parse error → graceful fallback
        return {**base_question, "is_variant": False}

    if not _validate_variant(variant):
        return {**base_question, "is_variant": False}

    variant["is_variant"] = True
    # Preserve concept and hint from the original question (Gayatri: Added prerequisite quizes)
    if "concept" in base_question:
        variant["concept"] = base_question["concept"]
    if "hint" in base_question:
        variant["hint"] = base_question["hint"]

    # Shuffle the option letters so even the correct-answer letter differs
    return _shuffle_options(variant)
