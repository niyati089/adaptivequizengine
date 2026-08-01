"""
Standalone script to run the proctoring events table migration.
This can be run manually if the automatic migration in main.py fails.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.database.connection import engine


def rename_column(table_name: str, old_name: str, new_name: str) -> None:
    """Rename a column in a table (SQLite-compatible approach)."""
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
    
    # SQLite doesn't support ALTER COLUMN directly, so we recreate the table
    with engine.begin() as connection:
        # Get current table structure
        columns_info = inspector.get_columns(table_name)
        column_defs = []
        for col in columns_info:
            col_name = col["name"]
            col_type = col["type"].__str__()
            nullable = "NULL" if col["nullable"] else "NOT NULL"
            default = f"DEFAULT {col['default']}" if col['default'] is not None else ""
            
            # Use new name if this is the column to rename
            final_name = new_name if col_name == old_name else col_name
            column_defs.append(f"{final_name} {col_type} {nullable} {default}".strip())
        
        # Create new table
        temp_table = f"{table_name}_temp"
        connection.execute(text(f"CREATE TABLE {temp_table} ({', '.join(column_defs)})"))
        
        # Copy data (renaming column in the process)
        old_columns = [col["name"] for col in columns_info]
        new_columns = [new_name if col == old_name else col for col in old_columns]
        connection.execute(text(
            f"INSERT INTO {temp_table} ({', '.join(new_columns)}) "
            f"SELECT {', '.join(old_columns)} FROM {table_name}"
        ))
        
        # Drop old table and rename new one
        connection.execute(text(f"DROP TABLE {table_name}"))
        connection.execute(text(f"ALTER TABLE {temp_table} RENAME TO {table_name}"))
        
        # Recreate indexes
        for col in columns_info:
            col_name = col["name"]
            final_name = new_name if col_name == old_name else col_name
            if col.get("primary_key"):
                continue  # Skip primary key
            connection.execute(text(
                f"CREATE INDEX IF NOT EXISTS ix_{table_name}_{final_name} ON {table_name}({final_name})"
            ))


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
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl_fragment}"))
            else:
                print(f"Column {column_name} already exists in {table_name}")


def run_migration():
    """Run the complete proctoring events migration."""
    print("Starting proctoring events table migration...")
    
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
    
    # Step 3: Update existing records with severity based on event type
    print("\nStep 3: Updating existing records with severity...")
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
        print(f"Updated {result.rowcount} records")
    
    # Step 4: Verify migration
    print("\nStep 4: Verifying migration...")
    inspector = inspect(engine)
    columns = [col["name"] for col in inspector.get_columns("proctoring_events")]
    print(f"Current columns in proctoring_events: {columns}")
    
    expected_columns = [
        'id', 'user_id', 'classroom_quiz_id', 'attempt_id', 
        'event_type', 'event_data', 'severity', 'confidence', 
        'is_false_positive', 'timestamp'
    ]
    
    missing = set(expected_columns) - set(columns)
    if missing:
        print(f"ERROR: Missing expected columns: {missing}")
        return False
    
    print("✅ Migration completed successfully!")
    return True


if __name__ == "__main__":
    try:
        success = run_migration()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Migration failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
