# Proctoring System Deep Dive - Issues and Fixes

## Executive Summary

The proctoring system has **critical architectural issues** that prevent it from working correctly. The main problems are hook conflicts, duplicate event recording, and poor error handling.

---

## 🔴 CRITICAL ISSUES

### 1. **Hook Conflict & Duplication**
**Problem**: Two separate hooks doing the same job
- `useFaceDetection.ts` - Currently used in quiz page
- `useProctoring.ts` - NOT used but has similar functionality

**Impact**: 
- Both hooks try to initialize workers and record events
- Causes conflicts and race conditions
- Wastes resources

**Fix**: Remove `useProctoring.ts` and consolidate everything into `useFaceDetection.ts`

---

### 2. **Duplicate Event Recording**
**Problem**: Multiple places recording the same events
- `useFaceDetection` hook records events internally (lines 162-249)
- Quiz page monitoring system also records events (lines 276-300 in page.tsx)

**Impact**:
- Duplicate API calls to backend
- Conflicting warning counts
- User gets multiple warnings for same violation

**Fix**: Remove event recording from `useFaceDetection` hook, only do it in quiz page

---

### 3. **Model Loading Issues**
**Problem**: Worker tries to load heavy AI models without proper error handling
- MediaPipe Face Detector (blaze_face_short_range.tflite)
- TensorFlow.js COCO-SSD (loaded from CDN)

**Impact**:
- Models may fail to load silently
- No fallback mechanism
- Worker fails but UI shows "camera ready"

**Fix**: 
- Add proper error handling in worker
- Show loading state to user
- Add fallback if models fail
- Log model loading errors to console

---

### 4. **Detection Status Not Updating UI**
**Problem**: Detection status updates but UI doesn't reflect changes
- `detectionStatus` state updates correctly
- But monitoring system uses refs that may not sync
- Cooldown mechanism may prevent valid warnings

**Impact**:
- No warnings shown for multiple people, phone, paper detection
- User thinks system isn't working

**Fix**: Simplify monitoring logic, remove complex ref-based cooldown

---

### 5. **Missing Error UI**
**Problem**: Camera/detection errors exist but aren't shown
- `cameraError` state is set but never displayed
- User has no idea why proctoring isn't working

**Impact**:
- Poor user experience
- Hard to debug issues

**Fix**: Add error display component in quiz page

---

## 🟡 MODERATE ISSUES

### 6. **Worker Message Handling**
**Problem**: Worker may send messages before UI is ready
- No synchronization between worker init and UI state
- Detection results may be lost

**Fix**: Add ready state check before processing detection results

### 7. **Frame Processing Inefficiency**
**Problem**: Frame processing runs on fixed interval regardless of need
- Processes frames even when camera isn't ready
- Wastes CPU cycles

**Fix**: Only process frames when camera is ready and worker is initialized

---

## 🔧 REQUIRED FIXES

### Fix 1: Remove Duplicate Hook
Delete `frontend/src/hooks/useProctoring.ts` - it's unused and conflicts with `useFaceDetection`

### Fix 2: Clean up useFaceDetection Hook
Remove event recording from `useFaceDetection.ts` (lines 162-249). The hook should ONLY:
- Initialize camera
- Run detection worker
- Return detection status
- Let the quiz page handle event recording

### Fix 3: Improve Worker Error Handling
Update `frontend/src/workers/proctoringWorker.ts`:
- Add try-catch around model loading
- Send initialization status to UI
- Add fallback for failed models
- Log specific error messages

### Fix 4: Simplify Quiz Page Monitoring
Update `frontend/src/app/quiz/page.tsx`:
- Remove complex ref-based cooldown (lines 267-313)
- Use simple state-based approach
- Add error display for cameraError
- Ensure detectionStatus triggers warnings correctly

### Fix 5: Add Model Loading UI
Add loading state while models initialize:
- Show "Initializing AI detection..." message
- Display progress if possible
- Show error if models fail to load

---

## 📋 TESTING CHECKLIST

After fixes, test:
- [ ] Camera initializes without errors
- [ ] Face detection shows "Face Detected" status
- [ ] Multiple people triggers "multiple people detected" warning
- [ ] Phone in frame triggers "phone detected" warning  
- [ ] Paper/notes triggers "paper/notes detected" warning
- [ ] Looking away triggers "looking away" warning
- [ ] No face triggers "no face detected" warning
- [ ] Warnings appear in UI as red banners
- [ ] Warning count increments correctly
- [ ] Backend receives correct event types
- [ ] Console shows no worker errors
- [ ] Models load successfully (check console)

---

## 🎯 ROOT CAUSE

The proctoring system was implemented in phases:
1. Initial `useProctoring` hook with basic functionality
2. Enhanced `useFaceDetection` hook with AI detection
3. Frontend fixes that added monitoring to quiz page

But the old `useProctoring` hook was never removed, and the new `useFaceDetection` hook still tries to record events internally, creating the conflicts.

---

## 🚀 QUICK FIX PLAN

1. **Delete** `frontend/src/hooks/useProctoring.ts`
2. **Edit** `frontend/src/hooks/useFaceDetection.ts` - remove event recording code
3. **Edit** `frontend/src/workers/proctoringWorker.ts` - add better error handling
4. **Edit** `frontend/src/app/quiz/page.tsx` - add error display, simplify monitoring
5. **Test** all detection scenarios

This should resolve the core issues and get the proctoring system working properly.
