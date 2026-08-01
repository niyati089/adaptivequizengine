from concurrent.futures import ThreadPoolExecutor, TimeoutError

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.misconceptions.seed_tags import DEFAULT_TAGS, seed_misconception_tags
from app.models.attempt import QuestionAttempt
from app.models.misconception import MisconceptionEvent, MisconceptionTag

KEYWORD_RULES = {
    "sign_error": ["sign", "negative", "positive", "direction", "increase", "decrease", "opposite"],
    "off_by_one": ["off by one", "boundary", "index", "edge case", "inclusive", "exclusive"],
    "unit_scope_error": ["unit", "scale", "per ", "convert", "scope"],
    "calculation_error": ["arithmetic", "calculation", "miscalculat", "computed incorrectly", "adding error"],
    "misread_question": ["misread", "misunderstood the question", "constraint"],
    "overgeneralization": ["assumes", "generaliz", "always applies", "in this case, however"],
    "incomplete_reasoning": ["only considered", "stops short", "partial", "missed a step"],
}

VALID_TAGS = {tag for tag, _, _ in DEFAULT_TAGS}


class MisconceptionAnalyzer:
    """Classifies wrong-answer explanations into canonical misconception tags."""

    def __init__(self, db: Session = None, groq_client=None, llm_timeout_seconds: int = 3):
        self.db = db
        self.groq_client = groq_client
        self.llm_timeout_seconds = llm_timeout_seconds
        # NOTE: seed_misconception_tags is intentionally NOT called here.
        # It runs once at application startup in main.py lifespan to avoid
        # opening a transaction on every request via the Supabase pooler.

    def classify(self, misconception_text: str, topic: str = "", subtopic: str = "") -> str:
        text = (misconception_text or "").lower()
        for tag, keywords in KEYWORD_RULES.items():
            if any(keyword in text for keyword in keywords):
                return tag

        if self.groq_client:
            return self._llm_classify(misconception_text, topic, subtopic)

        return "concept_confusion"

    def _llm_classify(self, misconception_text: str, topic: str, subtopic: str) -> str:
        def call_llm() -> str:
            tag_list = ", ".join(tag for tag, _, _ in DEFAULT_TAGS)
            prompt = (
                f"Classify this misconception into exactly one tag from this list: {tag_list}.\n"
                f"Topic: {topic}\n"
                f"Subtopic: {subtopic}\n"
                f'Misconception: "{misconception_text}"\n'
                "Reply with ONLY the tag, nothing else."
            )
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=10,
                temperature=0,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content.strip().lower()

        executor = ThreadPoolExecutor(max_workers=1)
        try:
            future = executor.submit(call_llm)
            tag = future.result(timeout=self.llm_timeout_seconds)
        except (TimeoutError, Exception):
            return "concept_confusion"
        finally:
            executor.shutdown(wait=False, cancel_futures=True)

        return tag if tag in VALID_TAGS else "concept_confusion"

    def record(
        self,
        user_id: int,
        topic: str,
        subtopic: str,
        tag: str,
        raw_text: str,
        question_snippet: str,
        selected_option: str,
    ) -> MisconceptionEvent:
        db_tag = self.db.query(MisconceptionTag).filter_by(tag=tag).first()
        event = MisconceptionEvent(
            user_id=user_id,
            topic=topic,
            subtopic=subtopic,
            tag_id=db_tag.id if db_tag else None,
            raw_misconception_text=raw_text,
            question_snippet=(question_snippet or "")[:150],
            selected_option=selected_option,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def watchlist(self, user_id: int, limit: int = 5) -> list[dict]:
        if self.db is None:
            raise ValueError("MisconceptionAnalyzer.watchlist requires a database session")

        rows = (
            self.db.query(
                MisconceptionTag.id,
                MisconceptionTag.tag,
                MisconceptionTag.label,
                MisconceptionTag.description,
                func.count(MisconceptionEvent.id).label("count"),
                func.max(MisconceptionEvent.created_at).label("last_seen"),
            )
            .join(MisconceptionEvent, MisconceptionEvent.tag_id == MisconceptionTag.id)
            .filter(MisconceptionEvent.user_id == user_id)
            .group_by(
                MisconceptionTag.id,
                MisconceptionTag.tag,
                MisconceptionTag.label,
                MisconceptionTag.description,
            )
            .order_by(func.count(MisconceptionEvent.id).desc(), func.max(MisconceptionEvent.created_at).desc())
            .limit(limit)
            .all()
        )

        items = []
        for row in rows:
            topics = (
                self.db.query(MisconceptionEvent.topic)
                .filter(MisconceptionEvent.user_id == user_id, MisconceptionEvent.tag_id == row.id)
                .distinct()
                .all()
            )
            items.append(
                {
                    "tag": row.tag,
                    "label": row.label,
                    "description": row.description,
                    "count": row.count,
                    "last_seen": row.last_seen.isoformat() if row.last_seen else None,
                    "topics": [topic for (topic,) in topics],
                }
            )

        return items

    def analyze_class_misconceptions(self, topic: str, db: Session = None) -> list[dict]:
        """Legacy educator dashboard aggregation over raw attempt misconception text."""
        session = db or self.db or SessionLocal()
        created_session = db is None and self.db is None

        try:
            total_incorrect = (
                session.query(QuestionAttempt)
                .filter(
                    QuestionAttempt.topic == topic,
                    QuestionAttempt.is_correct == False,
                    QuestionAttempt.misconception.isnot(None),
                    QuestionAttempt.misconception != "",
                )
                .count()
            )

            if total_incorrect == 0:
                return []

            rows = (
                session.query(QuestionAttempt.misconception, func.count(QuestionAttempt.id).label("count"))
                .filter(
                    QuestionAttempt.topic == topic,
                    QuestionAttempt.is_correct == False,
                    QuestionAttempt.misconception.isnot(None),
                    QuestionAttempt.misconception != "",
                )
                .group_by(QuestionAttempt.misconception)
                .order_by(func.count(QuestionAttempt.id).desc())
                .all()
            )

            items = []
            for misc_text, count in rows:
                pct = int(round((count / total_incorrect) * 100))
                if pct >= 35:
                    severity = "high"
                elif pct >= 20:
                    severity = "medium"
                else:
                    severity = "low"

                items.append({"issue": misc_text, "pct": pct, "severity": severity})

            return items
        except Exception:
            # Return empty list instead of crashing the worker if the DB connection drops
            return []
        finally:
            if created_session:
                session.close()
