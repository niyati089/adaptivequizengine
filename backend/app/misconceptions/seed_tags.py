from sqlalchemy.orm import Session

from app.models.misconception import MisconceptionTag

DEFAULT_TAGS = [
    ("sign_error", "Sign / Direction Error", "Confuses positive/negative, increase/decrease, or inequality direction."),
    ("off_by_one", "Off-by-One / Boundary Error", "Miscounts edges, indices, or boundary conditions."),
    ("concept_confusion", "Concept Confusion", "Confuses two related but distinct concepts or terms."),
    ("overgeneralization", "Overgeneralization", "Applies a rule correctly learned in one context to a context where it doesn't hold."),
    ("calculation_error", "Calculation / Procedural Slip", "Understands the concept but makes an arithmetic or procedural execution error."),
    ("unit_scope_error", "Unit / Scope Error", "Mixes up units, scale, or the scope of what's being measured."),
    ("misread_question", "Misread Question", "Answer suggests the question/constraint itself was misunderstood, not the underlying concept."),
    ("incomplete_reasoning", "Incomplete Reasoning", "Applies only part of a multi-step process and stops short."),
]


def seed_misconception_tags(db: Session) -> None:
    """Insert canonical misconception tags if they are missing."""
    existing = {row.tag for row in db.query(MisconceptionTag.tag).all()}
    for tag, label, description in DEFAULT_TAGS:
        if tag not in existing:
            db.add(MisconceptionTag(tag=tag, label=label, description=description))
    db.commit()
