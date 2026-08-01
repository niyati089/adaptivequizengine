# Proctoring System - Clean Rewrite

## Overview
Complete rewrite of the proctoring system with a simple, clean architecture. The backend schema and API remain unchanged.

## Architecture

### Frontend Components

#### 1. `useProctoring` Hook (`frontend/src/hooks/useProctoring.ts`)
Simple hook that manages:
- Camera initialization and cleanup
- Worker lifecycle
- Detection results
- Error handling

**Key Features:**
- Single responsibility: camera + detection coordination
- Clean state management
- Proper cleanup on unmount
- Simple error handling

**API:**
```typescript
const proctoring = useProctoring(enabled: boolean);

// Returns:
{
  enabled: boolean;
  ready: boolean;           // Worker initialized and ready
  error: string | null;    // Any errors
  detection: {             // Current detection results
    faceDetected: boolean;
    faceCount: number;
    multiplePeople: boolean;
    phoneDetected: boolean;
    paperDetected: boolean;
    lookingAway: boolean;
  };
  start: () => Promise<void>;   // Start camera and detection
  stop: () => void;            // Stop camera and detection
  stream: MediaStream | null;  // Camera stream for preview
}
```

#### 2. Proctoring Worker (`frontend/src/workers/proctoringWorker.ts`)
Simple Web Worker that:
- Initializes MediaPipe Face Detector
- Processes video frames
- Returns detection results

**Key Features:**
- Only uses MediaPipe Face Detector (removed TensorFlow dependency for simplicity)
- Simple message-based communication
- Proper cleanup
- Basic gaze detection (face position heuristics)

**Detection Capabilities:**
- Face detection (MediaPipe Blaze Face)
- Multiple people detection (face count > 1)
- Looking away detection (face position off-center)
- Phone/paper detection (disabled for now - needs TensorFlow)

#### 3. Quiz Page Integration (`frontend/src/app/quiz/page.tsx`)
Simple integration:
- Uses `useProctoring` hook
- Monitors detection results
- Records events via existing API
- Shows warnings in UI

**Monitoring Logic:**
- Checks detection every 1 second
- 5-second cooldown between same event types
- Records events to backend via `recordProctoringEvent`
- Shows warning banners in UI

## Backend (Unchanged)

### API Endpoints (`backend/app/api/endpoints/proctoring.py`)
- `POST /api/proctoring/event` - Record proctoring event
- `PATCH /api/proctoring/event/{event_id}/mark-false-positive` - Mark false positive
- `GET /api/proctoring/quiz/{quiz_id}/events` - Get quiz events
- `GET /api/proctoring/student/{student_id}/flagged` - Get flagged attempts

### Database Schema (`backend/app/models/proctoring.py`)
- `ProctoringEvent` model with all required fields
- Supports both browser and AI events
- Severity levels and confidence scores

## Testing Checklist

Test each scenario:

1. **Camera Initialization**
   - [ ] Camera permission prompt appears
   - [ ] Camera initializes without errors
   - [ ] "Initializing AI Detection" banner shows
   - [ ] Banner disappears when ready
   - [ ] Camera preview appears in corner

2. **Face Detection**
   - [ ] Green border when face detected
   - [ ] "Face Detected" status in preview
   - [ ] Red border when no face
   - [ ] "No Face" status in preview
   - [ ] Warning appears after no face for 2+ seconds

3. **Multiple People**
   - [ ] Warning appears when 2+ faces detected
   - [ ] Critical severity (red banner)
   - [ ] Shows face count in message

4. **Looking Away**
   - [ ] Warning appears when face off-center
   - [ ] Low severity (yellow banner)
   - [ ] Cooldown prevents spam

5. **Error Handling**
   - [ ] Camera denied shows permission error
   - [ ] No camera shows appropriate error
   - [ ] Worker initialization shows error

6. **Event Recording**
   - [ ] Events appear in backend database
   - [ ] Warning count increments
   - [ ] Backend receives correct event types

## Key Improvements from Old System

1. **Single Hook** - Removed duplicate `useFaceDetection` hook
2. **Simplified Worker** - Removed complex TensorFlow dependency
3. **Clean State Management** - No complex ref-based cooldowns
4. **Better Error Handling** - Clear error messages to users
5. **Proper Cleanup** - Always stops camera on unmount
6. **Debugging** - Console logging for troubleshooting

## Future Enhancements

1. **Add TensorFlow.js** - Re-enable phone/paper detection
2. **Improve Gaze Detection** - Add eye tracking
3. **Add Audio Detection** - Background noise monitoring
4. **Performance** - Optimize frame processing rate
5. **Testing** - Add automated tests for detection

## Troubleshooting

**Camera not working:**
- Check browser console for errors
- Verify camera permissions
- Check if another app is using camera

**Detection not working:**
- Check console for "Proctoring worker initialized"
- Check console for "Detection result received"
- Verify MediaPipe model loads correctly

**Events not recording:**
- Check backend is running
- Verify API endpoint is accessible
- Check network tab for failed requests
