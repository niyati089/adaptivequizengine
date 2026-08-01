import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

let faceDetector: FaceDetector | null = null;
let isInitialized = false;

interface DetectionResult {
  faceDetected: boolean;
  confidence: number;
  faceCount: number;
}

async function initializeDetector() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/models/blaze_face_short_range.tflite',
        delegate: 'GPU'
      },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.5
    });

    isInitialized = true;
    self.postMessage({ type: 'INITIALIZED', success: true });
  } catch (error) {
    console.error('Failed to initialize face detector:', error);
    self.postMessage({
      type: 'ERROR',
      error: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

async function detectFace(imageData: ImageData): Promise<DetectionResult> {
  if (!faceDetector || !isInitialized) {
    throw new Error('Face detector not initialized');
  }

  try {
    const detections = faceDetector.detect(imageData);

    if (!detections || !detections.detections || detections.detections.length === 0) {
      return {
        faceDetected: false,
        confidence: 0,
        faceCount: 0
      };
    }

    const bestDetection = detections.detections.reduce((best, current) => {
      const currentConfidence = current.categories?.[0]?.score || 0;
      const bestConfidence = best.categories?.[0]?.score || 0;
      return currentConfidence > bestConfidence ? current : best;
    });

    const confidence = bestDetection.categories?.[0]?.score || 0;

    return {
      faceDetected: confidence >= 0.5,
      confidence: confidence,
      faceCount: detections.detections.length
    };
  } catch (error) {
    console.error('Detection error:', error);
    throw error;
  }
}

self.onmessage = async (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'INITIALIZE':
      await initializeDetector();
      break;

    case 'DETECT':
      try {
        const result = await detectFace(data.imageData);
        self.postMessage({
          type: 'DETECTION_RESULT',
          result,
          frameId: data.frameId
        });
      } catch (error) {
        self.postMessage({
          type: 'DETECTION_ERROR',
          error: error instanceof Error ? error.message : 'Detection failed',
          frameId: data.frameId
        });
      }
      break;

    case 'TERMINATE':
      if (faceDetector) {
        faceDetector.close();
        faceDetector = null;
      }
      isInitialized = false;
      self.postMessage({ type: 'TERMINATED' });
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

export {};
