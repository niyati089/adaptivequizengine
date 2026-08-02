from datetime import datetime
from typing import List, Optional
from app.core.groq_client import get_groq_client
from app.core.config import config
import json


class SocraticLevel:
    """Enum for Socratic hint intensity levels"""
    MINIMAL = 1        # Smallest nudge / minimal guidance
    PROBING = 2        # Ask clarifying question
    GUIDING = 3        # Point to concept
    SCAFFOLDING = 4    # Break into steps
    REVEALING = 5      # Close to answer / detailed explanation

    @staticmethod
    def get_label(level: int) -> str:
        labels = {
            1: "minimal",
            2: "probing",
            3: "guiding",
            4: "scaffolding",
            5: "revealing"
        }
        return labels.get(level, "unknown")


class AdvancedSocraticAgent:
    """
    Multi-level Socratic learning with misconception detection,
    dialogue history, and effectiveness tracking.

    Features:
    - 5-level hint progression from minimal to revealing
    - Ability-aware hint calibration (theta-based)
    - Misconception detection and tagging
    - Dialogue history tracking
    - Hint effectiveness metrics
    """

    def __init__(self):
        self.client = get_groq_client()
        self.dialogue_history = []

    async def get_adaptive_hint(
        self,
        question: str,
        user_answer: str,
        correct_answer: str,
        learner_theta: float,              # Ability [-3, 3]
        confidence: float,                  # User confidence [0, 5]
        previous_hints: List[str] = None,
        misconception_tag: str = None,
        question_options: Optional[dict] = None
    ) -> dict:
        """
        Generate adaptive Socratic hint based on:
        1. Learner ability (IRT theta)
        2. Confidence level
        3. Previous hints given
        4. Known misconceptions

        Args:
            question: The question text
            user_answer: What the learner answered
            correct_answer: The correct answer
            learner_theta: Learner ability [-3, 3] from IRT
            confidence: Confidence 0-5 scale
            previous_hints: List of previously given hints
            misconception_tag: Known misconception to address
            question_options: Multiple choice options dict

        Returns:
            dict with hint, level, type, misconception addressed, dialogue turn
        """

        # 1. DETERMINE HINT LEVEL
        hint_level = self._determine_hint_level(
            theta=learner_theta,
            confidence=confidence,
            previous_hints_count=len(previous_hints or [])
        )

        # 2. BUILD CONTEXT-AWARE PROMPT
        prompt = self._build_socratic_prompt(
            question=question,
            user_answer=user_answer,
            correct_answer=correct_answer,
            hint_level=hint_level,
            misconception=misconception_tag,
            previous_hints=previous_hints or [],
            question_options=question_options
        )

        # 3. GENERATE HINT VIA LLM
        try:
            response = await self.client.chat.completions.create(
                model=config.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": self._get_socratic_system_prompt(hint_level)},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )

            hint_text = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error generating hint: {e}")
            hint_text = self._get_fallback_hint(hint_level, question, misconception_tag)

        # 4. TRACK HINT IN DIALOGUE HISTORY
        dialogue_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "question": question,
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "hint_level": hint_level,
            "hint_text": hint_text,
            "misconception": misconception_tag,
            "theta": learner_theta,
            "confidence": confidence
        }
        self.dialogue_history.append(dialogue_entry)

        return {
            "hint": hint_text,
            "level": hint_level,
            "level_label": SocraticLevel.get_label(hint_level),
            "hint_type": self._get_hint_type(hint_level),
            "next_level_suggestion": min(hint_level + 1, SocraticLevel.REVEALING),
            "misconception_addressed": misconception_tag,
            "dialogue_turn": len(self.dialogue_history),
            "can_escalate": hint_level < SocraticLevel.REVEALING
        }

    def _determine_hint_level(
        self,
        theta: float,
        confidence: float,
        previous_hints_count: int
    ) -> int:
        """
        Determine appropriate Socratic level based on:
        - Ability-confidence mismatch
        - Number of previous hints tried

        Logic:
        - High confidence + Low ability = Start gentle (level 1-2)
        - High confidence + High ability = Direct (level 3)
        - Low confidence = More scaffolding (level 3-4)
        - Multiple hints tried = Escalate (level += 1)
        """

        # Base level from ability-confidence mismatch
        if confidence >= 4:  # High confidence
            # Overconfidence detection: high confidence but low ability
            if theta < -1.0:
                # Learner is overconfident, start with gentle nudge
                base_level = SocraticLevel.MINIMAL
            elif theta < 0:
                # Below average ability, medium confidence
                base_level = SocraticLevel.PROBING
            else:
                # Good ability, can be more direct
                base_level = SocraticLevel.GUIDING
        elif confidence >= 3:  # Medium confidence - start with MINIMAL for first hint
            if theta < -1.0:
                # Overconfident but struggling, start very gentle
                base_level = SocraticLevel.MINIMAL
            else:
                # Normal confidence, start with gentle nudge
                base_level = SocraticLevel.MINIMAL
        elif confidence >= 1:  # Low confidence
            # Learner knows they don't know - still start gentle, escalate as needed
            base_level = SocraticLevel.MINIMAL
        else:  # Very low/no confidence
            base_level = SocraticLevel.MINIMAL

        # Escalate if already tried hints (avoid repetition)
        # For first hint (previous_hints_count == 0), don't escalate
        escalation = previous_hints_count  # +1 level for each previous hint
        escalation = min(escalation, 4)  # Cap at +4 so we can reach level 5
        final_level = min(base_level + escalation, SocraticLevel.REVEALING)

        return final_level

    def _build_socratic_prompt(
        self,
        question: str,
        user_answer: str,
        correct_answer: str,
        hint_level: int,
        misconception: str = None,
        previous_hints: List[str] = None,
        question_options: Optional[dict] = None
    ) -> str:
        """Build context-aware Socratic prompt for LLM"""

        level_descriptions = {
            SocraticLevel.MINIMAL: "Ask ONE simple clarifying question in one sentence",
            SocraticLevel.PROBING: "Ask a probing question to help them check their understanding",
            SocraticLevel.GUIDING: "Guide them to think about a related concept or principle",
            SocraticLevel.SCAFFOLDING: "Break down the problem into 2-3 simpler steps they can follow",
            SocraticLevel.REVEALING: "Explain the key concept clearly without revealing the exact answer"
        }

        prompt = f"""You are a Socratic tutor helping a learner who answered incorrectly.
Your goal is to guide them to the correct answer through questioning and guidance, NOT by directly telling them the answer.

Question: "{question}"
Learner's Answer: "{user_answer}"
Correct Answer: "{correct_answer}"

Hint Style ({SocraticLevel.get_label(hint_level)}): {level_descriptions[hint_level]}

Keep your response concise (1-3 sentences for level 1-2, up to 2 paragraphs for level 3-5).
Focus on helping them think, not on giving away the answer.
"""

        if question_options:
            prompt += f"\nMultiple Choice Options:\n"
            for key, option in question_options.items():
                marker = " <- Learner chose this" if key == user_answer else ""
                prompt += f"  {key}. {option}{marker}\n"

        if misconception:
            prompt += f"\nCommon Misconception: {misconception}"
            prompt += f"\nDirect your hint to help them overcome this specific misconception.\n"

        if previous_hints:
            prompt += f"\nAvoid repeating these previous hints:\n"
            for i, hint in enumerate(previous_hints, 1):
                prompt += f"  {i}. {hint}\n"
            prompt += "\nProvide a NEW hint that approaches the problem differently.\n"

        prompt += "\nNow provide your Socratic hint:"
        return prompt

    def _get_socratic_system_prompt(self, level: int) -> str:
        """Get system prompt calibrated to hint level"""

        base = (
            "You are a Socratic tutor who uses questioning and guided reasoning to help learners discover answers themselves. "
            "Never directly give away the answer. Guide them through thinking."
        )

        levels = {
            SocraticLevel.MINIMAL: (
                base + " Ask ONE minimal question to nudge their thinking. Keep it short - one sentence only. "
                "Example: 'What does [key term] mean?'"
            ),
            SocraticLevel.PROBING: (
                base + " Probe their understanding with targeted questions. "
                "Example: 'Have you considered what happens if...?'"
            ),
            SocraticLevel.GUIDING: (
                base + " Gently guide them toward the relevant concept or principle. "
                "Example: 'Think about the relationship between X and Y...'"
            ),
            SocraticLevel.SCAFFOLDING: (
                base + " Break the concept into manageable steps and guide through each. "
                "Provide structure: 'First consider..., Then think about..., Finally...'"
            ),
            SocraticLevel.REVEALING: (
                base + " Explain the underlying concept and reasoning clearly, leaving only the final synthesis to them. "
                "Show your thinking but let them reach the conclusion."
            )
        }

        return levels.get(level, base)

    def _get_hint_type(self, level: int) -> str:
        """Get human-readable hint type for UI"""
        types = {
            SocraticLevel.MINIMAL: "nudge",
            SocraticLevel.PROBING: "probe",
            SocraticLevel.GUIDING: "guidance",
            SocraticLevel.SCAFFOLDING: "step-by-step",
            SocraticLevel.REVEALING: "explanation"
        }
        return types.get(level, "hint")

    def _get_fallback_hint(self, level: int, question: str, misconception: str = None) -> str:
        """Provide fallback hint if LLM call fails"""
        fallbacks = {
            SocraticLevel.MINIMAL: "Think about the key terms in the question.",
            SocraticLevel.PROBING: "What do you know about the core concept here?",
            SocraticLevel.GUIDING: "Consider how the different parts of this problem relate to each other.",
            SocraticLevel.SCAFFOLDING: "Break this down: First identify what you know, then what you need to find.",
            SocraticLevel.REVEALING: "Review the fundamental principles that apply here, then reconsider the question."
        }
        return fallbacks.get(level, "Think carefully about this problem.")

    async def detect_misconception(
        self,
        question: str,
        user_answer: str,
        correct_answer: str,
        question_options: Optional[dict] = None
    ) -> Optional[str]:
        """
        Detect likely misconception from wrong answer using LLM.

        Args:
            question: The question
            user_answer: What learner chose
            correct_answer: The right answer
            question_options: Answer options

        Returns:
            Description of likely misconception or None
        """

        if user_answer == correct_answer:
            return None  # Not a misconception if correct

        prompt = f"""Analyze why a learner chose the wrong answer to understand their misconception.

Question: "{question}"
Learner's Answer: "{user_answer}"
Correct Answer: "{correct_answer}"
"""

        if question_options:
            prompt += f"\nOptions:\n"
            for key, option in question_options.items():
                prompt += f"  {key}. {option}\n"

        prompt += """
What is the likely misconception causing this wrong answer? Be specific and concise (one sentence).
Example: "Confusing additive and multiplicative relationships" or "Misunderstanding negative numbers"

Respond with ONLY the misconception, no explanation."""

        try:
            response = await self.client.chat.completions.create(
                model=config.GROQ_MODEL,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=100
            )
            misconception = response.choices[0].message.content.strip()
            if misconception and len(misconception) > 5:
                return misconception
        except Exception as e:
            print(f"Error detecting misconception: {e}")

        return None

    async def track_hint_effectiveness(
        self,
        hint_id: str,
        learner_id: int,
        did_improve: bool,
        time_to_understand: int,
        hint_level: int = None
    ) -> dict:
        """
        Track if hint was effective and how long learner took.
        Use this data to personalize future hints.

        Args:
            hint_id: Unique hint identifier
            learner_id: ID of learner
            did_improve: Whether hint helped
            time_to_understand: Seconds to understand
            hint_level: Level of hint that was given

        Returns:
            Tracking record
        """
        return {
            "hint_id": hint_id,
            "learner_id": learner_id,
            "effective": did_improve,
            "time_to_understand": time_to_understand,
            "hint_level": hint_level,
            "tracked_at": datetime.utcnow().isoformat(),
            "efficiency_score": self._calculate_efficiency(
                did_improve, time_to_understand, hint_level
            )
        }

    def _calculate_efficiency(
        self,
        did_improve: bool,
        time_seconds: int,
        hint_level: int = None
    ) -> float:
        """
        Calculate efficiency score 0-100:
        - Did improve: +50 base points
        - Fast understanding: +up to 30 points
        - Lower level hint: +up to 20 points
        """
        score = 0.0

        if did_improve:
            score += 50

        # Fast understanding (within 30 seconds = full points)
        if time_seconds > 0:
            speed_score = max(0, 30 - time_seconds) / 30 * 30
            score += speed_score

        # Reward simpler hints
        if hint_level:
            simplicity_bonus = (5 - hint_level) / 5 * 20
            score += simplicity_bonus

        return min(100, score)

    def get_dialogue_history(self) -> list:
        """Get full dialogue history for this session"""
        return self.dialogue_history

    def clear_dialogue_history(self):
        """Clear dialogue history (e.g., between topics)"""
        self.dialogue_history = []

    def get_session_metrics(self) -> dict:
        """Get session-level metrics from dialogue history"""
        if not self.dialogue_history:
            return {
                "total_hints": 0,
                "avg_level": 0,
                "misconceptions_addressed": 0,
                "unique_misconceptions": []
            }

        levels = [h["hint_level"] for h in self.dialogue_history]
        misconceptions = [h["misconception"] for h in self.dialogue_history if h["misconception"]]

        return {
            "total_hints": len(self.dialogue_history),
            "avg_level": sum(levels) / len(levels) if levels else 0,
            "misconceptions_addressed": len(misconceptions),
            "unique_misconceptions": list(set(misconceptions)),
            "avg_confidence": sum(h["confidence"] for h in self.dialogue_history) / len(self.dialogue_history),
            "avg_theta": sum(h["theta"] for h in self.dialogue_history) / len(self.dialogue_history)
        }
