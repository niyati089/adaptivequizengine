"""
Optional cleanup script to remove the legacy session_id column from proctoring_events.
Run this only after you've confirmed that the new attempt_id column is working correctly
and you no longer need the session_id data.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.database.connection import engine


def cleanup_session_id_column():
    """Remove the legacy session_id column from proctoring_events table."""
    print("Checking proctoring_events table structure...")
    
    inspector = inspect(engine)
    columns_info = {col["name"]: col for col in inspector.get_columns("proctoring_events")}
    
    if "session_id" not in columns_info:
        print("session_id column does not exist - nothing to clean up")
        return True
    
    print(f"Found session_id column (type: {columns_info['session_id']['type']})")
    print("WARNING: This operation cannot be undone!")
    print("Make sure attempt_id is working correctly before proceeding.")
    
    # Check if there's any data in session_id that's not in attempt_id
    with engine.begin() as connection:
        result = connection.execute(text("""
            SELECT COUNT(*) as count
            FROM proctoring_events
            WHERE session_id IS NOT NULL AND attempt_id IS NULL
        """))
        orphaned_records = result.fetchone()[0]
        
        if orphaned_records > 0:
            print(f"WARNING: {orphaned_records} records have session_id but no attempt_id")
            print("These records will lose their session reference if you proceed.")
            response = input("Do you want to continue anyway? (yes/no): ")
            if response.lower() != 'yes':
                print("Cleanup cancelled")
                return False
    
    print("\nDropping session_id column...")
    try:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE proctoring_events DROP COLUMN session_id"))
        print("✅ Successfully dropped session_id column")
        
        # Verify
        columns = [col["name"] for col in inspector.get_columns("proctoring_events")]
        print(f"Current columns: {columns}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to drop session_id column: {e}")
        return False


if __name__ == "__main__":
    try:
        success = cleanup_session_id_column()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Cleanup failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
