-- Migration: Make classroom_quiz_id NOT NULL after cleanup
-- This migration should only be run after cleanup_orphaned_proctoring_events.py
-- has removed all records with NULL classroom_quiz_id

-- For SQLite, we need to recreate the table to add NOT NULL constraint
-- First verify no NULL values exist
-- SELECT COUNT(*) FROM proctoring_events WHERE classroom_quiz_id IS NULL;
-- Should return 0 before proceeding

-- Step 1: Create new table with NOT NULL constraint
CREATE TABLE IF NOT EXISTS proctoring_events_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    classroom_quiz_id INTEGER NOT NULL,
    attempt_id INTEGER,
    event_type VARCHAR NOT NULL,
    event_data TEXT,
    severity VARCHAR(20) DEFAULT 'medium' NOT NULL,
    confidence INTEGER,
    is_false_positive BOOLEAN DEFAULT FALSE NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (classroom_quiz_id) REFERENCES classroom_quizzes(id),
    FOREIGN KEY (attempt_id) REFERENCES question_attempts(id) ON DELETE SET NULL
);

-- Step 2: Migrate data (will fail if any NULL classroom_quiz_id exists)
INSERT INTO proctoring_events_new 
SELECT * FROM proctoring_events;

-- Step 3: Drop old table
DROP TABLE proctoring_events;

-- Step 4: Rename new table
ALTER TABLE proctoring_events_new RENAME TO proctoring_events;

-- Step 5: Recreate indexes
CREATE INDEX ix_proctoring_events_id ON proctoring_events(id);
CREATE INDEX ix_proctoring_events_user_id ON proctoring_events(user_id);
CREATE INDEX ix_proctoring_events_classroom_quiz_id ON proctoring_events(classroom_quiz_id);
CREATE INDEX ix_proctoring_events_attempt_id ON proctoring_events(attempt_id);
CREATE INDEX ix_proctoring_events_event_type ON proctoring_events(event_type);
CREATE INDEX ix_proctoring_events_timestamp ON proctoring_events(timestamp);
CREATE INDEX ix_proctoring_events_severity ON proctoring_events(severity);
CREATE INDEX ix_proctoring_events_is_false_positive ON proctoring_events(is_false_positive);
