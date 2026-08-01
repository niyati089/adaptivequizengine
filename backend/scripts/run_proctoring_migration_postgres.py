"""
Standalone script to run the proctoring events table migration for PostgreSQL.
This can be run manually if the automatic migration in main.py fails.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.database.connection import engine


def ensure_columns(table_name: str, column_defs: dict) -> None:
    """Add missing columns to a table."""
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        print(f"Table {table_name} not found, skipping column addition")
        return

    existing = {column["name"] for column in inspector.get_columns(table_name)}
    with engine.begin() as connection:
        for column_name, ddl_fragment in column_defs.items():
            if column_name not in existing:
                print(f"Adding column {column_name} to {table_name}")
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {ddl_fragment}"))
            else:
                print(f"Column {column_name} already exists in {table_name}")


def rename_column(table_name: str, old_name: str, new_name: str) -> None:
    """Rename a column in a table (PostgreSQL supports ALTER COLUMN directly)."""
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        print(f"Table {table_name} not found, skipping column rename")
        return
    
    existing_columns = {col["name"]: col for col in inspector.get_columns(table_name)}
    if old_name not in existing_columns:
        print(f"Column {old_name} not found in {table_name}, skipping rename")
        return
    if new_name in existing_columns:
        print(f"Column {new_name} already exists in {table_name}, skipping rename")
        return
    
    print(f"Renaming column {old_name} to {new_name} in {table_name}")
    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} RENAME COLUMN {old_name} TO {new_name}"))


def create_indexes(table_name: str, indexes: dict) -> None:
    """Create indexes for a table."""
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        print(f"Table {table_name} not found, skipping index creation")
        return
    
    existing_indexes = {idx["name"]: idx for idx in inspector.get_indexes(table_name)}
    
    with engine.begin() as connection:
        for index_name, column_name in indexes.items():
            if index_name not in existing_indexes:
                print(f"Creating index {index_name} on {column_name}")
                connection.execute(text(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({column_name})"))
            else:
                print(f"Index {index_name} already exists")


def run_migration():
    """Run the complete proctoring events migration for PostgreSQL."""
    print("Starting proctoring events table migration (PostgreSQL)...")
    
    # Step 1: Add new columns
    print("\nStep 1: Adding new columns...")
    ensure_columns("proctoring_events", {
        "classroom_quiz_id": "INTEGER",
        "attempt_id": "INTEGER", 
        "severity": "VARCHAR(20) DEFAULT 'medium'",
        "confidence": "INTEGER",
        "is_false_positive": "BOOLEAN DEFAULT FALSE",
    })
    
    # Step 2: Rename columns
    print("\nStep 2: Renaming columns...")
    rename_column("proctoring_events", "details", "event_data")
    
    # Step 3: Migrate data from session_id to attempt_id if needed
    print("\nStep 3: Checking session_id to attempt_id migration...")
    inspector = inspect(engine)
    columns_info = {col["name"]: col for col in inspector.get_columns("proctoring_events")}
    
    # Check if session_id exists and its type
    if "session_id" in columns_info:
        session_id_type = str(columns_info["session_id"]["type"])
        attempt_id_type = str(columns_info["attempt_id"]["type"])
        print(f"session_id type: {session_id_type}, attempt_id type: {attempt_id_type}")
        
        # Only migrate if types are compatible
        if "INTEGER" in session_id_type.upper() or "INT" in session_id_type.upper():
            with engine.begin() as connection:
                result = connection.execute(text("""
                    UPDATE proctoring_events
                    SET attempt_id = CAST(session_id AS INTEGER)
                    WHERE session_id IS NOT NULL AND attempt_id IS NULL
                """))
                print(f"Migrated {result.rowcount} records from session_id to attempt_id")
        else:
            print("session_id is not a compatible integer type, skipping migration")
            print("session_id column can be dropped later if no longer needed")
    else:
        print("session_id column does not exist, skipping migration")
    
    # Step 4: Add foreign key constraints
    print("\nStep 4: Adding foreign key constraints...")
    with engine.begin() as connection:
        try:
            connection.execute(text("""
                ALTER TABLE proctoring_events
                ADD CONSTRAINT fk_proctoring_events_classroom_quiz
                FOREIGN KEY (classroom_quiz_id) REFERENCES classroom_quizzes(id)
            """))
            print("Added foreign key constraint for classroom_quiz_id")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("Foreign key constraint for classroom_quiz_id already exists")
            else:
                print(f"Warning: Could not add foreign key for classroom_quiz_id: {e}")
        
        try:
            connection.execute(text("""
                ALTER TABLE proctoring_events
                ADD CONSTRAINT fk_proctoring_events_attempt
                FOREIGN KEY (attempt_id) REFERENCES question_attempts(id) ON DELETE SET NULL
            """))
            print("Added foreign key constraint for attempt_id")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("Foreign key constraint for attempt_id already exists")
            else:
                print(f"Warning: Could not add foreign key for attempt_id: {e}")
    
    # Step 5: Create indexes
    print("\nStep 5: Creating indexes...")
    create_indexes("proctoring_events", {
        "ix_proctoring_events_classroom_quiz_id": "classroom_quiz_id",
        "ix_proctoring_events_attempt_id": "attempt_id",
        "ix_proctoring_events_severity": "severity",
        "ix_proctoring_events_is_false_positive": "is_false_positive",
    })
    
    # Step 6: Update existing records with severity based on event type
    print("\nStep 6: Updating existing records with severity...")
    with engine.begin() as connection:
        result = connection.execute(text("""
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
        print(f"Updated {result.rowcount} records with severity")
    
    # Step 7: Verify migration
    print("\nStep 7: Verifying migration...")
    inspector = inspect(engine)
    columns = [col["name"] for col in inspector.get_columns("proctoring_events")]
    print(f"Current columns in proctoring_events: {columns}")
    
    expected_columns = [
        'id', 'user_id', 'classroom_quiz_id', 'attempt_id', 
        'event_type', 'event_data', 'severity', 'confidence', 
        'is_false_positive', 'timestamp'
    ]
    
    # Also check for old columns that should be gone
    unexpected_columns = set(columns) - set(expected_columns + ['session_id'])  # session_id might still exist
    
    missing = set(expected_columns) - set(columns)
    if missing:
        print(f"ERROR: Missing expected columns: {missing}")
        return False
    
    if unexpected_columns:
        print(f"WARNING: Found unexpected columns: {unexpected_columns}")
        print("These might be legacy columns that can be removed later")
    
    print("Migration completed successfully!")
    return True


if __name__ == "__main__":
    try:
        success = run_migration()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Migration failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
