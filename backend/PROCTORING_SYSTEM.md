# Proctoring System Documentation

## Overview

The proctoring system provides AI-powered exam integrity monitoring for classroom quizzes. It combines browser-based monitoring with computer vision to detect suspicious behavior during quiz attempts.

## System Architecture

### Backend Components

**Model: `ProctoringEvent`** (`backend/app/models/proctoring.py`)
- Stores proctoring violations and events
- Tracks both browser events and AI vision detections
- Supports severity levels and false positive marking

**API Endpoints** (`backend/app/api/endpoints/proctoring.py`)
- `POST /api/proctoring/event` - Record a proctoring event
- `PATCH /api/proctoring/event/{event_id}/mark-false-positive` - Mark events as false positives
- `GET /api/proctoring/quiz/{quiz_id}/events` - Get all events for a quiz (teacher view)
- `GET /api/proctoring/student/{student_id}/flagged` - Get flagged attempts for a student

### Frontend Components

**Proctoring Components** (`frontend/src/components/proctoring/`)
- `CameraPreview.tsx` - Basic camera feed with face detection status
- `ProctoringPreview.tsx` - Advanced preview with violation indicators

**Educator Dashboard** (`frontend/src/components/educator/`)
- `ProctoringDashboard.tsx` - Teacher interface for reviewing proctoring events

## Event Types

### Browser Events
- `tab_switch` - User switched browser tabs (low severity)
- `copy` - User copied content (medium severity)
- `paste` - User pasted content (medium severity)
- `context_menu` - User opened context menu (medium severity)
- `window_blur` - User lost focus on quiz window (low severity)

### AI Vision Events
- `no_face_detected` - No face visible in camera (high severity)
- `multiple_people` - Multiple faces detected (critical severity)
- `phone_detected` - Phone detected in frame (high severity)
- `paper_detected` - Notes/paper detected in frame (high severity)
- `looking_away` - User looking away from screen (low severity)

## Database Schema

### Current Schema (PostgreSQL)

```sql
CREATE TABLE proctoring_events (
    id INTEGER PRIMARY KEY,
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
```

### Key Fields

- `user_id` - Student who triggered the event
- `classroom_quiz_id` - Quiz being proctored
- `attempt_id` - Specific question attempt (nullable)
- `event_type` - Type of violation (see Event Types above)
- `event_data` - Additional context about the event
- `severity` - "low", "medium", "high", or "critical"
- `confidence` - AI confidence score (0-100) for vision-based events
- `is_false_positive` - Teacher can mark as false positive after review
- `timestamp` - When the event occurred

## Migration History

### Migration 002: Proctoring Schema Update (August 2026)

**Problem**: The existing `proctoring_events` table schema didn't match the `ProctoringEvent` model. The database had legacy columns (`session_id`, `details`) and was missing new AI proctoring fields.

**Solution**: Implemented a PostgreSQL migration to:
1. Add new columns: `classroom_quiz_id`, `attempt_id`, `severity`, `confidence`, `is_false_positive`
2. Rename `details` → `event_data`
3. Add foreign key constraints
4. Create appropriate indexes
5. Update existing records with severity based on event type
6. Keep `session_id` for backward compatibility (can be removed later)

**Legacy Column**: `session_id` (VARCHAR) - kept for compatibility but no longer used. New code should use `attempt_id` (INTEGER) instead.

**Migration Script**: `backend/scripts/run_proctoring_migration_postgres.py`

**Cleanup Script**: `backend/scripts/cleanup_legacy_session_id.py` (optional, for removing session_id later)

## Integration with Classroom Quizzes

Proctoring is enabled per-quiz via the `ClassroomQuiz` model:
- `enable_proctoring` (BOOLEAN) - Whether proctoring is enabled
- `max_proctoring_warnings` (INTEGER) - Maximum violations before flagging (default: 3)

When proctoring is enabled:
1. Students must grant camera permission
2. Browser events are monitored
3. AI vision analyzes the camera feed
4. Events are recorded in real-time
5. Warning count is tracked per student
6. Quiz can be auto-terminated if threshold exceeded

## Testing

Run proctoring tests with:
```bash
cd backend
python -m pytest tests/test_proctoring.py -v
```

Test coverage includes:
- Event recording and validation
- Warning count tracking
- Teacher dashboard views
- False positive marking
- Permission checks (student vs teacher)
- Integration workflows

## AI Vision Integration

The system uses:
- **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`) for face detection
- **TensorFlow.js** (`@tensorflow/tfjs`, `@tensorflow-models/coco-ssd`) for object detection
- **Blaze Face** model for face detection (`blaze_face_short_range.tflite`)

Vision features are client-side only to protect privacy - video frames are processed locally and only event metadata is sent to the server.

## Teacher Review Workflow

1. Teachers access proctoring dashboard via educator interface
2. View events grouped by student with severity indicators
3. Filter by student, severity, or event type
4. Review specific events with timestamps and confidence scores
5. Mark false positives to exclude from warning counts
6. Identify students who exceeded warning thresholds
7. Take appropriate action (review attempt, discuss with student, etc.)

## Security Considerations

- All proctoring endpoints require authentication
- Students can only record events for their own quizzes
- Teachers can only view events for their own classrooms
- Video processing is client-side for privacy
- No video data is stored on the server
- Only event metadata (type, severity, confidence) is transmitted

## Future Enhancements

Potential improvements:
- Gaze tracking (eye movement analysis)
- Audio monitoring (background noise detection)
- Screen sharing detection
- Network behavior analysis
- Machine learning for pattern recognition
- Automated severity scoring based on context
