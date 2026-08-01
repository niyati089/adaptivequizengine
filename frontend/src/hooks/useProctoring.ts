import { useEffect, useRef, useState, useCallback } from 'react';

interface DetectionResult {
  faceDetected: boolean;
  faceCount: number;
  multiplePeople: boolean;
  phoneDetected: boolean;
  paperDetected: boolean;
  lookingAway: boolean;
}

interface UseProctoringReturn {
  enabled: boolean;
  ready: boolean;
  error: string | null;
  detection: DetectionResult;
  start: () => Promise<void>;
  stop: () => void;
  stream: MediaStream | null;
}

export function useProctoring(enabled: boolean): UseProctoringReturn {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<DetectionResult>({
    faceDetected: true,
    faceCount: 0,
    multiplePeople: false,
    phoneDetected: false,
    paperDetected: false,
    lookingAway: false
  });
  const [stream, setStream] = useState<MediaStream | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize worker
  useEffect(() => {
    if (!enabled) return;

    try {
      const worker = new Worker(new URL('../workers/proctoringWorker.ts', import.meta.url));
      
      worker.onmessage = (e) => {
        const { type, result, error: workerError } = e.data;
        
        if (type === 'INITIALIZED') {
          console.log('[Proctoring Hook] Worker initialized');
          setReady(true);
        } else if (type === 'DETECTION_RESULT') {
          console.log('[Proctoring Hook] Detection result:', result);
          setDetection(result);
        } else if (type === 'ERROR') {
          console.error('[Proctoring Hook] Worker error:', workerError);
          setError(workerError);
        }
      };

      worker.postMessage({ type: 'INITIALIZE' });
      workerRef.current = worker;

      return () => {
        worker.postMessage({ type: 'TERMINATE' });
        worker.terminate();
      };
    } catch (err) {
      console.error('Failed to create worker:', err);
      setError('Failed to initialize proctoring system');
    }
  }, [enabled]);

  const start = useCallback(async () => {
    try {
      setError(null);

      // Get camera stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });

      setStream(mediaStream);

      // Create video element
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = mediaStream;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await video.play();

      videoRef.current = video;

      // Start frame processing
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Failed to get canvas context');

      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !workerRef.current) return;
        
        if (video.readyState < 2) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        workerRef.current.postMessage({
          type: 'DETECT',
          data: { imageData }
        });
      }, 1000); // 1 FPS

    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to access camera');
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }

    setReady(false);
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    enabled,
    ready,
    error,
    detection,
    start,
    stop,
    stream
  };
}
