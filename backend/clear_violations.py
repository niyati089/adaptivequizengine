"""Clear proctoring violations for testing"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.database.session import SessionLocal
from app.models.proctoring_event import ProctoringEvent

db = SessionLocal()

# Clear all violations
db.query(ProctoringEvent).delete()
db.commit()

print("✓ All proctoring violations cleared")
db.close()
