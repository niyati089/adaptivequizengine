from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.api import router
from app.database.connection import engine
from app.database.session import get_db
from app.misconceptions.seed_tags import seed_misconception_tags
from app.models import Base


def _ensure_columns(table_name: str, column_defs: dict) -> None:
    """Lightweight, idempotent migration: adds any missing columns to an
    existing table (SQLite/simple Postgres setups have no migration tool
    wired up yet, so this keeps existing DBs in sync with the models).

    `column_defs` maps column name -> SQL type/default fragment, e.g.
    {"enable_proctoring": "BOOLEAN DEFAULT FALSE"}.
    """
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns(table_name)}
    with engine.begin() as connection:
        for column_name, ddl_fragment in column_defs.items():
            if column_name not in existing:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl_fragment}"))


def _rename_column(table_name: str, old_name: str, new_name: str) -> None:
    """Rename a column in a table (PostgreSQL-compatible approach)."""
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return
    
    existing_columns = {col["name"]: col for col in inspector.get_columns(table_name)}
    if old_name not in existing_columns or new_name in existing_columns:
        return  # Old column doesn't exist or new column already exists
    
    # PostgreSQL supports ALTER COLUMN directly
    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} RENAME COLUMN {old_name} TO {new_name}"))


def _run_lightweight_migrations() -> None:
    _ensure_columns("question_attempts", {
        "classroom_id": "INTEGER",
        "classroom_quiz_id": "INTEGER",
        "answer_options": "TEXT",
        "explanation": "TEXT",
        "bloom_level": "VARCHAR(50)",
        "difficulty": "FLOAT",
    })
    _ensure_columns("classroom_quizzes", {
        "enable_anti_cheating": "BOOLEAN DEFAULT FALSE",
        "enable_proctoring": "BOOLEAN DEFAULT FALSE",
        "max_proctoring_warnings": "INTEGER DEFAULT 3",
        "num_questions": "INTEGER DEFAULT 10",
    })
    
    # Proctoring events migration
    _ensure_columns("proctoring_events", {
        "classroom_quiz_id": "INTEGER",
        "attempt_id": "INTEGER", 
        "severity": "VARCHAR(20) DEFAULT 'medium'",
        "confidence": "INTEGER",
        "is_false_positive": "BOOLEAN DEFAULT FALSE",
        "session_token": "VARCHAR(255)",
    })
    
    # Rename columns to match model
    _rename_column("proctoring_events", "details", "event_data")
    
    # Clean up orphaned proctoring events (NULL classroom_quiz_id)
    # These cannot be displayed in the dashboard and cause 500 errors
    with engine.begin() as connection:
        result = connection.execute(text("""
            DELETE FROM proctoring_events 
            WHERE classroom_quiz_id IS NULL
        """))
        if result.rowcount > 0:
            print(f"Cleaned up {result.rowcount} orphaned proctoring events with NULL classroom_quiz_id")
    
    # Note: session_id column is kept for backward compatibility but is no longer used
    # New code should use attempt_id instead. The session_id column can be removed later
    # using the cleanup_legacy_session_id.py script after confirming everything works.
    
    # Add foreign key constraints (PostgreSQL)
    try:
        with engine.begin() as connection:
            connection.execute(text("""
                ALTER TABLE proctoring_events
                ADD CONSTRAINT fk_proctoring_events_classroom_quiz
                FOREIGN KEY (classroom_quiz_id) REFERENCES classroom_quizzes(id)
            """))
    except Exception:
        pass  # Constraint might already exist
    
    try:
        with engine.begin() as connection:
            connection.execute(text("""
                ALTER TABLE proctoring_events
                ADD CONSTRAINT fk_proctoring_events_attempt
                FOREIGN KEY (attempt_id) REFERENCES question_attempts(id) ON DELETE SET NULL
            """))
    except Exception:
        pass  # Constraint might already exist
    
    # Create indexes
    with engine.begin() as connection:
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_proctoring_events_classroom_quiz_id ON proctoring_events(classroom_quiz_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_proctoring_events_attempt_id ON proctoring_events(attempt_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_proctoring_events_severity ON proctoring_events(severity)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_proctoring_events_is_false_positive ON proctoring_events(is_false_positive)"))
    
    # Update existing records with severity based on event type
    with engine.begin() as connection:
        connection.execute(text("""
            UPDATE proctoring_events
            SET severity = CASE
                WHEN event_type IN ('tab_switch', 'window_blur', 'looking_away') THEN 'low'
                WHEN event_type IN ('copy', 'paste', 'context_menu') THEN 'medium'
                WHEN event_type IN ('no_face_detected', 'phone_detected', 'paper_detected') THEN 'high'
                WHEN event_type = 'multiple_people' THEN 'critical'
                ELSE 'medium'
            END
            WHERE severity = 'medium'
        """))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _run_lightweight_migrations()
    db = next(get_db())
    try:
        seed_misconception_tags(db)
    finally:
        db.close()
    yield


app = FastAPI(title="AdaptiveTutor Backend", version="1.0.0", lifespan=lifespan)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router.api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to AdaptiveTutor API"}
