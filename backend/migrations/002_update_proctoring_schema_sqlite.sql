-- Migration: Update proctoring_events table to match ProctoringEvent model (SQLite version)
-- SQLite doesn't support ALTER COLUMN or ADD CONSTRAINT directly, so we recreate the table

-- Step 1: Create new table with correct schema
CREATE TABLE IF NOT EXISTS proctoring_events_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    classroom_quiz_id INTEGER,
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

-- Step 2: Migrate data from old table to new table
INSERT INTO proctoring_events_new (
    id, user_id, event_type, timestamp, event_data, 
    attempt_id, severity, confidence, is_false_positive
)
SELECT 
    id, 
    user_id, 
    event_type, 
    timestamp, 
    details as event_data,
    session_id as attempt_id,
    CASE
        WHEN event_type IN ('tab_switch', 'window_blur', 'looking_away') THEN 'low'
        WHEN event_type IN ('copy', 'paste', 'context_menu') THEN 'medium'
        WHEN event_type IN ('no_face_detected', 'phone_detected', 'paper_detected') THEN 'high'
        WHEN event_type = 'multiple_people' THEN 'critical'
        ELSE 'medium'
    END as severity,
    NULL as confidence,
    FALSE as is_false_positive
FROM proctoring_events;

-- Step 3: Drop old table
DROP TABLE proctoring_events;

-- Step 4: Rename new table to original name
ALTER TABLE proctoring_events_new RENAME TO proctoring_events;

-- Step 5: Create indexes
CREATE INDEX ix_proctoring_events_id ON proctoring_events(id);
CREATE INDEX ix_proctoring_events_user_id ON proctoring_events(user_id);
CREATE INDEX ix_proctoring_events_classroom_quiz_id ON proctoring_events(classroom_quiz_id);
CREATE INDEX ix_proctoring_events_attempt_id ON proctoring_events(attempt_id);
CREATE INDEX ix_proctoring_events_event_type ON proctoring_events(event_type);
CREATE INDEX ix_proctoring_events_timestamp ON proctoring_events(timestamp);
CREATE INDEX ix_proctoring_events_severity ON proctoring_events(severity);
CREATE INDEX ix_proctoring_events_is_false_positive ON proctoring_events(is_false_positive);

-- Note: classroom_quiz_id will be NULL for existing records since it didn't exist in the old schema
-- New records will populate this field correctly
