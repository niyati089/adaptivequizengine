from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
from app.database.connection import engine
from app.models import Base
from sqlalchemy import text, inspect

# Create tables at startup
Base.metadata.create_all(bind=engine)

# Initialize schema for quiz history
def initialize_quiz_history_schema():
    """Ensure quiz history columns exist"""
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns('question_attempts')
        existing_columns = {col['name'] for col in columns}
        
        migrations = [
            ('question_options', 'ALTER TABLE question_attempts ADD COLUMN question_options JSONB'),
            ('explanation', 'ALTER TABLE question_attempts ADD COLUMN explanation TEXT'),
            ('bloom_level', 'ALTER TABLE question_attempts ADD COLUMN bloom_level VARCHAR(50)')
        ]
        
        with engine.begin() as connection:
            for col_name, sql in migrations:
                if col_name not in existing_columns:
                    try:
                        connection.execute(text(sql))
                        print(f"✓ Added column: {col_name}")
                    except Exception as e:
                        if 'already exists' not in str(e).lower():
                            print(f"⚠ Could not add {col_name}: {str(e)}")
    except Exception as e:
        print(f"⚠ Schema initialization warning: {str(e)}")

# Call initialization
initialize_quiz_history_schema()

app = FastAPI(title="AdaptiveTutor Backend", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router.api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to AdaptiveTutor API"}

