from typing import Optional
from sqlalchemy.orm import Session
from app.agents.advanced_socratic_agent import AdvancedSocraticAgent, SocraticLevel
from app.schemas.socratic import SocraticRequest, SocraticResponse
from app.misconceptions.analyzer import MisconceptionAnalyzer
import uuid


class AdvancedSocraticService:
    """
    Service layer for multi-level Socratic learning.
    Orchestrates misconception detection, hint generation, and effectiveness tracking.
    """

    def __init__(self):
        self.agent = AdvancedSocraticAgent()
        self.misconception_analyzer = MisconceptionAnalyzer()
        self.hint_sessions = {}  # Track hint sessions in memory (would use DB in production)

    async def get_adaptive_hint(
        self,
        request: SocraticRequest,
        db: Session = None
    ) -> SocraticResponse:
        """
        Get adaptive Socratic hint with misconception detection.

        Args:
            request: SocraticRequest with question, answers, confidence, theta, etc.
            db: Optional database session

        Returns:
            SocraticResponse with hint, level, and metadata
        """

        # Validate request
        if not request.question or not request.correct_answer:
            raise ValueError("Question and correct_answer are required")

        # 1. DETECT MISCONCEPTION (if answer is wrong)
        misconception = None
        if request.user_answer != request.correct_answer:
            try:
                misconception = await self.agent.detect_misconception(
                    question=request.question,
                    user_answer=request.user_answer,
                    correct_answer=request.correct_answer,
                    question_options=request.question_options
                )
            except Exception as e:
                print(f"Warning: Misconception detection failed: {e}")

        # 2. CHECK FOR PREVIOUS HINTS IN SESSION
        session_id = request.session_id or str(uuid.uuid4())
        previous_hints = []
        hint_level_override = None

        if session_id in self.hint_sessions:
            session_data = self.hint_sessions[session_id]
            previous_hints = session_data.get("hints", [])
            hint_level_override = session_data.get("next_suggested_level")

        # 3. GET ADAPTIVE HINT
        hint_response = await self.agent.get_adaptive_hint(
            question=request.question,
            user_answer=request.user_answer,
            correct_answer=request.correct_answer,
            learner_theta=request.theta,
            confidence=request.confidence,
            previous_hints=previous_hints,
            misconception_tag=misconception,
            question_options=request.question_options
        )

        # 4. STORE SESSION STATE
        hint_id = str(uuid.uuid4())
        self.hint_sessions[session_id] = {
            "hints": previous_hints + [hint_response["hint"]],
            "hint_ids": self.hint_sessions.get(session_id, {}).get("hint_ids", []) + [hint_id],
            "misconception": misconception,
            "next_suggested_level": hint_response["next_level_suggestion"],
            "user_id": request.user_id,
            "question": request.question
        }

        # 5. BUILD RESPONSE
        response = SocraticResponse(
            mode="socratic_adaptive",
            hint=hint_response["hint"],
            hint_id=hint_id,
            hint_level=hint_response["level"],
            hint_level_label=hint_response["level_label"],
            hint_type=hint_response["hint_type"],
            misconception=misconception,
            next_level_available=hint_response["can_escalate"],
            dialogue_turn=hint_response["dialogue_turn"],
            learner_theta=request.theta,
            confidence=request.confidence
        )

        print(f"Socratic hint #{hint_response['dialogue_turn']} (level {hint_response['level_label']}) for {request.user_id}")
        if misconception:
            print(f"  Misconception: {misconception}")

        return response

    async def get_next_level_hint(
        self,
        session_id: str,
        request: SocraticRequest,
        db: Session = None
    ) -> SocraticResponse:
        """
        Escalate to next hint level without getting stuck.

        Args:
            session_id: ID of hint session
            request: Updated SocraticRequest
            db: Optional database session

        Returns:
            SocraticResponse with escalated hint
        """

        if session_id not in self.hint_sessions:
            # No previous hints in this session, start fresh
            return await self.get_adaptive_hint(request, db)

        session_data = self.hint_sessions[session_id]

        # Check if we can escalate further
        if not session_data.get("next_suggested_level"):
            # Already at max level
            return SocraticResponse(
                mode="hint_maxed",
                hint="The answer is: " + request.correct_answer,
                misconception=session_data.get("misconception")
            )

        # Request with updated session info
        request.session_id = session_id
        return await self.get_adaptive_hint(request, db)

    async def track_hint_outcome(
        self,
        hint_id: str,
        learner_id: int,
        did_help: bool,
        time_to_understand: int = None,
        hint_level: int = None
    ) -> dict:
        """
        Track whether hint was effective.
        Use to improve future hint personalization.

        Args:
            hint_id: ID of hint that was given
            learner_id: ID of learner
            did_help: Whether hint helped them understand
            time_to_understand: Seconds to understand
            hint_level: Level of hint that was given

        Returns:
            Tracking record with efficiency score
        """

        result = await self.agent.track_hint_effectiveness(
            hint_id=hint_id,
            learner_id=learner_id,
            did_improve=did_help,
            time_to_understand=time_to_understand or 0,
            hint_level=hint_level
        )

        print(f"Tracked hint outcome: effective={did_help}, efficiency={result['efficiency_score']:.1f}")

        return result

    def get_session_summary(self, session_id: str) -> dict:
        """
        Get summary of a hint session.

        Args:
            session_id: ID of session

        Returns:
            Summary dict with metrics
        """

        if session_id not in self.hint_sessions:
            return {"error": "Session not found"}

        session_data = self.hint_sessions[session_id]
        hints = session_data.get("hints", [])

        return {
            "session_id": session_id,
            "total_hints": len(hints),
            "misconception": session_data.get("misconception"),
            "user_id": session_data.get("user_id"),
            "hints_given": hints,
            "hint_ids": session_data.get("hint_ids", [])
        }

    def clear_session(self, session_id: str) -> bool:
        """Clear hint session data"""
        if session_id in self.hint_sessions:
            del self.hint_sessions[session_id]
            return True
        return False

    def get_agent_metrics(self) -> dict:
        """Get metrics from the Socratic agent"""
        return self.agent.get_session_metrics()

    def get_dialogue_history(self) -> list:
        """Get full dialogue history"""
        return self.agent.get_dialogue_history()

    async def analyze_misconception_patterns(
        self,
        topic: str,
        db: Session
    ) -> list[dict]:
        """
        Analyze class-level misconception patterns from attempts.

        Args:
            topic: Topic to analyze
            db: Database session

        Returns:
            List of misconceptions with frequency and severity
        """
        return self.misconception_analyzer.analyze_class_misconceptions(topic, db)
