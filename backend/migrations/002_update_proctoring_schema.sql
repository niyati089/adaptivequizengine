-- Migration: Update proctoring_events table to match ProctoringEvent model
-- This migration transforms the existing schema to support AI proctoring features

-- Step 1: Add new columns that don't exist
ALTER TABLE proctoring_events
ADD COLUMN IF NOT EXISTS classroom_quiz_id INTEGER;

ALTER TABLE proctoring_events
ADD COLUMN IF NOT EXISTS attempt_id INTEGER;

ALTER TABLE proctoring_events
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'medium' NOT NULL;

ALTER TABLE proctoring_events
ADD COLUMN IF NOT EXISTS confidence INTEGER;

ALTER TABLE proctoring_events
ADD COLUMN IF NOT EXISTS is_false_positive BOOLEAN DEFAULT FALSE NOT NULL;

-- Step 2: Rename existing columns to match model
-- Note: SQLite doesn't support ALTER TABLE RENAME COLUMN directly
-- We'll need to recreate the table for SQLite, but for PostgreSQL we can use ALTER COLUMN

-- For PostgreSQL (if you're using Postgres/Supabase):
ALTER TABLE proctoring_events RENAME COLUMN details TO event_data;

-- For SQLite, you would need to recreate the table (see alternative script below)

-- Step 3: Migrate data from session_id to attempt_id if needed
-- This assumes session_id was being used to store attempt_id
UPDATE proctoring_events
SET attempt_id = session_id
WHERE session_id IS NOT NULL;

-- Step 4: Add foreign key constraints
ALTER TABLE proctoring_events
ADD CONSTRAINT fk_proctoring_events_classroom_quiz
FOREIGN KEY (classroom_quiz_id) REFERENCES classroom_quizzes(id);

ALTER TABLE proctoring_events
ADD CONSTRAINT fk_proctoring_events_attempt
FOREIGN KEY (attempt_id) REFERENCES question_attempts(id) ON DELETE SET NULL;

-- Step 5: Create new indexes
CREATE INDEX IF NOT EXISTS ix_proctoring_events_classroom_quiz_id 
ON proctoring_events(classroom_quiz_id);

CREATE INDEX IF NOT EXISTS ix_proctoring_events_attempt_id 
ON proctoring_events(attempt_id);

CREATE INDEX IF NOT EXISTS ix_proctoring_events_severity 
ON proctoring_events(severity);

CREATE INDEX IF NOT EXISTS ix_proctoring_events_is_false_positive 
ON proctoring_events(is_false_positive);

-- Step 6: Update existing records with default severity based on event type
UPDATE proctoring_events
SET severity = CASE
    WHEN event_type IN ('tab_switch', 'window_blur', 'looking_away') THEN 'low'
    WHEN event_type IN ('copy', 'paste', 'context_menu') THEN 'medium'
    WHEN event_type IN ('no_face_detected', 'phone_detected', 'paper_detected') THEN 'high'
    WHEN event_type = 'multiple_people' THEN 'critical'
    ELSE 'medium'
END
WHERE severity = 'medium';

-- Step 7: Drop old session_id column after migration (optional, once confirmed working)
-- ALTER TABLE proctoring_events DROP COLUMN session_id;

-- Comments for documentation
COMMENT ON COLUMN proctoring_events.classroom_quiz_id IS 'Reference to the classroom quiz being proctored';
COMMENT ON COLUMN proctoring_events.attempt_id IS 'Reference to the specific question attempt';
COMMENT ON COLUMN proctoring_events.event_data IS 'Additional context about the proctoring event';
COMMENT ON COLUMN proctoring_events.severity IS 'Violation severity: low, medium, high, critical';
COMMENT ON COLUMN proctoring_events.confidence IS 'AI detection confidence (0-100), null for non-AI events';
COMMENT ON COLUMN proctoring_events.is_false_positive IS 'Teacher can mark violations as false positives after review';
