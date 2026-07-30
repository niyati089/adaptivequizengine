"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { logProctoringEvent } from '@/services/proctoringService';

export interface ProctoringState {
  isProctoring: boolean;
  permissionGranted: boolean;
  cameraError: string | null;
  faceDetected: boolean;
  violations: {
    noFaceCount: number;
    tabSwitchCount: number;
    total: number;
  };
  lastViolationMessage: string | null;
}

// Internal helper: attach stream to video element safely
function attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream) {
  video.muted = true;
  video.srcObject = stream;
  video.play().catch((e) => {
    if (e.name !== 'AbortError') {
      console.warn('[Proctoring] video.play() error:', e.name, e.message);
    }
  });
}

export function useProctoring(
  enabled: boolean = false,
  sessionId: string = 'session_default'
) {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastLogTimeRef = useRef<Record<string, number>>({});
  const noFaceConsecutiveRef = useRef(0);

  // ── Web Worker for face detection ─────────────────────────────────────────
  const faceWorkerRef = useRef<Worker | null>(null);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraWarmingUpRef = useRef(true);
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<ProctoringState>({
    isProctoring: false,
    permissionGranted: false,
    cameraError: null,
    faceDetected: true,
    violations: {
      noFaceCount: 0,
      tabSwitchCount: 0,
      total: 0,
    },
    lastViolationMessage: null,
  });

  // ── Rate-limited backend logging ───────────────────────────────────────────
  const logThrottledEvent = useCallback((
    eventType: 'NO_FACE_DETECTED' | 'TAB_SWITCH',
    details?: string
  ) => {
    const now = Date.now();
    const lastTime = lastLogTimeRef.current[eventType] || 0;
    if (now - lastTime > 5000) {
      lastLogTimeRef.current[eventType] = now;
      logProctoringEvent({
        session_id: sessionId,
        event_type: eventType,
        details: details ?? `Violation at ${new Date().toLocaleTimeString()}`
      });
    }
  }, [sessionId]);

  // ── Callback ref: fires when video DOM element mounts/unmounts ─────────────
  const videoRef = useCallback((element: HTMLVideoElement | null) => {
    videoElementRef.current = element;
    if (element && streamRef.current) {
      attachStreamToVideo(element, streamRef.current);
    }
  }, []);

  // ── Web Worker face analysis ───────────────────────────────────────────────
  const startFaceDetectionWorker = useCallback(() => {
    if (faceWorkerRef.current) {
      faceWorkerRef.current.terminate();
      faceWorkerRef.current = null;
    }
    if (typeof window === 'undefined') return;

    try {
      const worker = new Worker(
        new URL('../workers/faceWorker.ts', import.meta.url)
      );
      faceWorkerRef.current = worker;

      worker.onmessage = (event: MessageEvent<{
        hasFace: boolean;
        skinRatio: number;
        avgBrightness: number;
      }>) => {
        if (cameraWarmingUpRef.current) return;

        const { hasFace, skinRatio, avgBrightness } = event.data;

        if (!hasFace) {
          noFaceConsecutiveRef.current += 1;
        } else {
          noFaceConsecutiveRef.current = 0;
        }

        // Require 2 consecutive bad frames before flagging (debounce)
        const confirmed = noFaceConsecutiveRef.current >= 2;

        setState(prev => {
          if (confirmed && prev.faceDetected) {
            logThrottledEvent('NO_FACE_DETECTED',
              `brightness=${avgBrightness.toFixed(1)} skin=${(skinRatio * 100).toFixed(1)}%`);
            return {
              ...prev,
              faceDetected: false,
              violations: {
                ...prev.violations,
                noFaceCount: prev.violations.noFaceCount + 1,
                total: prev.violations.total + 1
              },
              lastViolationMessage: avgBrightness < 15
                ? 'Camera appears to be covered or blocked!'
                : 'No face detected in camera frame!'
            };
          }
          if (!confirmed && !prev.faceDetected) {
            return { ...prev, faceDetected: true };
          }
          return prev;
        });
      };

      worker.onerror = (err) => {
        console.warn('[Proctoring] Face worker error:', err.message);
      };

      // Send a canvas frame to the worker every 1500ms
      faceIntervalRef.current = setInterval(() => {
        const video = videoElementRef.current;
        if (!video || !streamRef.current) return;
        if (video.readyState < 2 || video.paused) return;
        if (cameraWarmingUpRef.current) return;

        try {
          const canvas = document.createElement('canvas');
          canvas.width = 80;
          canvas.height = 60;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, 80, 60);
          const imageData = ctx.getImageData(0, 0, 80, 60);
          // Zero-copy transfer of pixel buffer to worker
          faceWorkerRef.current?.postMessage({ imageData }, [imageData.data.buffer]);
        } catch {
          // Swallow canvas security errors (cross-origin etc.)
        }
      }, 1500);
    } catch (err) {
      console.warn('[Proctoring] Could not create face detection worker:', err);
    }
  }, [logThrottledEvent]);

  // ── START PROCTORING (video only) ──────────────────────────────────────────
  const startProctoring = useCallback(async () => {
    let mediaStream: MediaStream | null = null;

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 15 },
        audio: false,
      });
    } catch (videoErr) {
      const msg = videoErr instanceof Error ? videoErr.message : String(videoErr);
      console.warn('[Proctoring] getUserMedia failed:', msg);
      setState(prev => ({
        ...prev,
        cameraError: 'Camera access denied or unavailable.',
        permissionGranted: false,
        isProctoring: false,
      }));
      return;
    }

    if (!mediaStream) return;

    streamRef.current = mediaStream;

    if (videoElementRef.current) {
      attachStreamToVideo(videoElementRef.current, mediaStream);
    }

    noFaceConsecutiveRef.current = 0;

    setState({
      isProctoring: true,
      permissionGranted: true,
      cameraError: null,
      faceDetected: true,
      violations: {
        noFaceCount: 0,
        tabSwitchCount: 0,
        total: 0,
      },
      lastViolationMessage: null,
    });

    // Camera warmup: ignore dark frames for 4s while webcam initializes
    cameraWarmingUpRef.current = true;
    if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
    warmupTimerRef.current = setTimeout(() => {
      cameraWarmingUpRef.current = false;
    }, 4000);

    startFaceDetectionWorker();
  }, [startFaceDetectionWorker]);

  // ── STOP PROCTORING ────────────────────────────────────────────────────────
  const stopProctoring = useCallback(() => {
    if (warmupTimerRef.current) { clearTimeout(warmupTimerRef.current); warmupTimerRef.current = null; }
    if (faceIntervalRef.current) { clearInterval(faceIntervalRef.current); faceIntervalRef.current = null; }

    if (faceWorkerRef.current) {
      faceWorkerRef.current.terminate();
      faceWorkerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }

    noFaceConsecutiveRef.current = 0;
    setState(prev => ({
      ...prev,
      isProctoring: false,
    }));
  }, []);

  // ── AUTO START / STOP ──────────────────────────────────────────────────────
  useEffect(() => {
    if (enabled) {
      startProctoring();
    } else {
      stopProctoring();
    }
    return () => { stopProctoring(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    videoRef,
    ...state,
    startProctoring,
    stopProctoring,
  };
}
