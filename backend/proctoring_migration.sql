-- Enhanced Proctoring Migration
-- Adds new fields to proctoring_events table for AI vision detection

-- Add severity column (low, medium, high, critical)
ALTER TABLE proctoring_events
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'medium' NOT NULL;

-- Add confidence score column (0-100 for AI detections)
ALTER TABLE proctoring_events
ADD COLUMN IF NOT EXISTS confidence INTEGER;

-- Add false positive flag (teachers can mark after review)
ALTER TABLE proctoring_events
ADD COLUMN IF NOT EXISTS is_false_positive BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index on severity for filtering
CREATE INDEX IF NOT EXISTS ix_proctoring_events_severity
ON proctoring_events(severity);

-- Create index on is_false_positive for filtering
CREATE INDEX IF NOT EXISTS ix_proctoring_events_false_positive
ON proctoring_events(is_false_positive);

-- Update existing records to have default severity
UPDATE proctoring_events
SET severity = CASE
    WHEN event_type IN ('tab_switch', 'window_blur', 'looking_away') THEN 'low'
    WHEN event_type IN ('copy', 'paste', 'context_menu') THEN 'medium'
    WHEN event_type IN ('no_face_detected', 'phone_detected', 'paper_detected') THEN 'high'
    WHEN event_type = 'multiple_people' THEN 'critical'
    ELSE 'medium'
END
WHERE severity = 'medium';  -- Only update defaults

COMMENT ON COLUMN proctoring_events.severity IS 'Violation severity: low, medium, high, critical';
COMMENT ON COLUMN proctoring_events.confidence IS 'AI detection confidence (0-100), null for non-AI events';
COMMENT ON COLUMN proctoring_events.is_false_positive IS 'Teacher can mark violations as false positives after review';
