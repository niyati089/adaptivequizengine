"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { logProctoringEvent, getSessionLockStatus } from '@/services/proctoringService';

export type ViolationType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'FULLSCREEN_EXIT';

export interface ViolationEvent {
  type: ViolationType;
  message: string;
  timestamp: string;
}

export interface BrowserMonitoringState {
  warningsCount: number;
  maxWarnings: number;
  isLocked: boolean;
  isFullscreen: boolean;
  showWarningModal: boolean;
  lastViolation: ViolationEvent | null;
  violationLog: ViolationEvent[];
  /** True while seeding initial violation count from the backend on quiz start */
  isRestoringSession: boolean;
}

interface UseBrowserMonitoringOptions {
  maxWarnings?: number;
  sessionId?: string;
  onAutoLock?: () => void;
  enabled?: boolean;
}

export function useBrowserMonitoring({
  maxWarnings = 2,
  sessionId = 'session_default',
  onAutoLock,
  enabled = false,
}: UseBrowserMonitoringOptions = {}) {

  // ─── ALL mutable state lives in refs — no setState for counters ──────────────
  // This is the core fix: event listeners capture these refs directly,
  // so they never go stale and the useEffect NEVER re-runs due to them changing.
  const isLockedRef        = useRef(false);
  const warningsCountRef   = useRef(0);
  const inGracePeriodRef   = useRef(true);
  const wasFullscreenRef   = useRef(false);
  const lastLogTimeRef     = useRef<Record<string, number>>({});
  const maxWarningsRef     = useRef(maxWarnings);
  const sessionIdRef       = useRef(sessionId);
  const onAutoLockRef      = useRef(onAutoLock);

  // Keep option refs in sync with latest props without re-running the effect
  useEffect(() => { maxWarningsRef.current = maxWarnings; }, [maxWarnings]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { onAutoLockRef.current = onAutoLock; }, [onAutoLock]);

  // React state only for UI rendering
  const [state, setState] = useState<BrowserMonitoringState>({
    warningsCount: 0,
    maxWarnings,
    isLocked: false,
    isFullscreen: false,
    showWarningModal: false,
    lastViolation: null,
    violationLog: [],
    isRestoringSession: false,
  });

  // ─── Core violation recorder — uses refs only, never causes re-render loop ───
  // Defined outside useEffect so it can also be used by copyPreventionHandlers
  const recordViolationRef = useRef((type: ViolationType, message: string) => {
    if (isLockedRef.current) return;
    if (inGracePeriodRef.current) return;

    // Rate-limit backend logging per event type (3 second cooldown)
    const now = Date.now();
    const lastTime = lastLogTimeRef.current[type] || 0;
    if (now - lastTime > 3000) {
      lastLogTimeRef.current[type] = now;
      logProctoringEvent({
        session_id: sessionIdRef.current,
        event_type: type,
        details: `${message} at ${new Date().toLocaleTimeString()}`
      });
    }

    // Increment synchronously in ref — no batching issues
    warningsCountRef.current += 1;
    const newCount = warningsCountRef.current;
    const locked = newCount >= maxWarningsRef.current;

    if (locked) {
      isLockedRef.current = true;
    }

    const event: ViolationEvent = {
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    // Update React UI state
    setState(prev => ({
      ...prev,
      warningsCount: newCount,
      isLocked: locked,
      showWarningModal: true,
      lastViolation: event,
      violationLog: [...prev.violationLog, event],
    }));

    if (locked) {
      // Small delay so the locked modal renders before redirect
      setTimeout(() => onAutoLockRef.current?.(), 200);
    }
  });

  // Stable callback wrapper for JSX handlers
  const recordViolation = useCallback((type: ViolationType, message: string) => {
    recordViolationRef.current(type, message);
  }, []); // [] — never changes reference, never triggers effect re-run

  // ─── Dismiss warning modal ───────────────────────────────────────────────────
  const dismissWarning = useCallback(() => {
    setState(prev => ({ ...prev, showWarningModal: false }));
  }, []);

  // ─── Fullscreen management ────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        console.warn('[BrowserMonitoring] Fullscreen request denied');
      }
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* ignore */ }
    }
  }, []);

  // ─── Copy/Cut/Paste prevention handlers (spread onto question container) ─────
  const copyPreventionHandlers = {
    onCopy: (e: React.ClipboardEvent) => {
      e.preventDefault();
      recordViolation('COPY_ATTEMPT', 'Student attempted to copy quiz content');
    },
    onCut: (e: React.ClipboardEvent) => {
      e.preventDefault();
      recordViolation('COPY_ATTEMPT', 'Student attempted to cut quiz content');
    },
    onPaste: (e: React.ClipboardEvent) => {
      e.preventDefault();
      recordViolation('PASTE_ATTEMPT', 'Student attempted to paste into quiz');
    },
  };

  // ─── Main effect: attach/detach listeners — runs ONLY when enabled changes ───
  // CRITICAL: No function deps here. All handlers use refs so they're always fresh.
  useEffect(() => {
    if (!enabled) {
      // Clean up refs when quiz ends
      isLockedRef.current = false;
      warningsCountRef.current = 0;
      inGracePeriodRef.current = true;
      wasFullscreenRef.current = false;
      return;
    }

    // ── Fix 1: Restore session state from backend on quiz start ─────────────────
    // If the user reloads the page, warningsCountRef resets to 0. We seed it from
    // the backend so they cannot bypass the violation counter with a reload.
    let isEffectActive = true; // Prevent state updates after unmount

    const restoreAndStart = async () => {
      // Show restoring indicator
      setState(prev => ({ ...prev, isRestoringSession: true }));

      let seededCount = 0;
      let alreadyLocked = false;

      try {
        const lockStatus = await getSessionLockStatus(sessionIdRef.current);
        if (lockStatus) {
          seededCount = lockStatus.violation_count;
          alreadyLocked = lockStatus.is_locked;
          console.log(
            `[BrowserMonitoring] Session restored: ${seededCount} violations, locked=${alreadyLocked}`
          );
        }
      } catch {
        // Fail-open: if backend is unavailable, start from 0
        console.warn('[BrowserMonitoring] Could not restore session state, starting fresh');
      }

      if (!isEffectActive) return;

      // Seed refs with restored counts
      warningsCountRef.current = seededCount;
      isLockedRef.current = alreadyLocked;
      wasFullscreenRef.current = false;

      setState({
        warningsCount: seededCount,
        maxWarnings: maxWarningsRef.current,
        isLocked: alreadyLocked,
        isFullscreen: false,
        showWarningModal: alreadyLocked, // immediately show lock modal if already locked
        lastViolation: alreadyLocked
          ? {
              type: 'TAB_SWITCH',
              message: 'Session was previously locked due to integrity violations.',
              timestamp: new Date().toISOString(),
            }
          : null,
        violationLog: [],
        isRestoringSession: false,
      });

      // If already locked on reload, fire the callback immediately
      if (alreadyLocked) {
        setTimeout(() => onAutoLockRef.current?.(), 200);
        return; // Don't attach listeners — session is done
      }

      // Short grace period so page focus/camera permission dialogs don't trigger violations
      inGracePeriodRef.current = true;
      const graceTimer = setTimeout(() => {
        if (!isEffectActive) return;
        inGracePeriodRef.current = false;
        console.log('[BrowserMonitoring] Grace period over — violations now active');
      }, 3000);

      // ── Visibility / tab switch ──
      const handleVisibilityChange = () => {
        if (document.hidden || document.visibilityState === 'hidden') {
          recordViolationRef.current('TAB_SWITCH', 'Student switched tab or minimized window');
        }
      };

      // ── Fullscreen exit ──
      const handleFullscreenChange = () => {
        const isNowFullscreen = !!document.fullscreenElement;
        setState(prev => ({ ...prev, isFullscreen: isNowFullscreen }));

        if (isNowFullscreen) {
          wasFullscreenRef.current = true;
        } else if (wasFullscreenRef.current && !inGracePeriodRef.current) {
          wasFullscreenRef.current = false;
          recordViolationRef.current('FULLSCREEN_EXIT', 'Student exited fullscreen mode');
        }
      };

      // ── Keyboard shortcuts (Ctrl+C/X/V) ──
      const handleKeyDown = (e: KeyboardEvent) => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && (e.key === 'c' || e.key === 'x')) {
          recordViolationRef.current('COPY_ATTEMPT', `Keyboard shortcut: ${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key.toUpperCase()}`);
        }
        if (ctrl && e.key === 'v') {
          recordViolationRef.current('PASTE_ATTEMPT', `Keyboard shortcut: ${e.ctrlKey ? 'Ctrl' : 'Cmd'}+V`);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('keydown', handleKeyDown);

      // Cleanup closure captures these locals
      const cleanup = () => {
        clearTimeout(graceTimer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('keydown', handleKeyDown);
      };

      // Store cleanup for the effect teardown
      cleanupRef.current = cleanup;
    };

    const cleanupRef = { current: () => {} };

    restoreAndStart();

    return () => {
      isEffectActive = false;
      cleanupRef.current();
    };
  }, [enabled]); // ← ONLY enabled. No function deps that change on every render.

  return {
    ...state,
    dismissWarning,
    enterFullscreen,
    exitFullscreen,
    copyPreventionHandlers,
  };
}
