-- Migration: Fix proctoring_events table schema
-- This migration aligns the database with the ProctoringEvent model

-- First, check if we need to migrate from old schema
-- If session_id exists, we're on old schema

-- Drop old table if it exists with wrong schema
DROP TABLE IF EXISTS proctoring_events_old;

-- Rename current table as backup
ALTER TABLE proctoring_events RENAME TO proctoring_events_old;

-- Create new table with correct schema
CREATE TABLE proctoring_events (
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

-- Create indexes
CREATE INDEX ix_proctoring_events_id ON proctoring_events(id);
CREATE INDEX ix_proctoring_events_user_id ON proctoring_events(user_id);
CREATE INDEX ix_proctoring_events_classroom_quiz_id ON proctoring_events(classroom_quiz_id);
CREATE INDEX ix_proctoring_events_attempt_id ON proctoring_events(attempt_id);
CREATE INDEX ix_proctoring_events_event_type ON proctoring_events(event_type);
CREATE INDEX ix_proctoring_events_timestamp ON proctoring_events(timestamp);
CREATE INDEX ix_proctoring_events_severity ON proctoring_events(severity);
CREATE INDEX ix_proctoring_events_is_false_positive ON proctoring_events(is_false_positive);

-- Try to migrate old data if possible (this is a best-effort migration)
-- INSERT INTO proctoring_events (user_id, event_type, timestamp, event_data, severity)
-- SELECT user_id, event_type, timestamp, details, 'medium'
-- FROM proctoring_events_old;

-- Note: classroom_quiz_id cannot be migrated from old schema as it didn't exist
-- Old data is preserved in proctoring_events_old table and can be manually reviewed if needed
