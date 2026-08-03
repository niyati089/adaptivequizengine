import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

let faceDetector: FaceDetector | null = null;
let isInitialized = false;

interface DetectionResult {
  faceDetected: boolean;
  faceCount: number;
  multiplePeople: boolean;
  phoneDetected: boolean;
  paperDetected: boolean;
  lookingAway: boolean;
}

async function initialize() {
  try {
    console.log('Initializing face detector...');
    
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
    console.log('Face detector initialized successfully');
    
    self.postMessage({ type: 'INITIALIZED', success: true });
  } catch (error) {
    console.error('Failed to initialize:', error);
    self.postMessage({ 
      type: 'ERROR', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

function detect(imageData: ImageData): DetectionResult {
  if (!faceDetector || !isInitialized) {
    throw new Error('Detector not initialized');
  }

  try {
    const result = faceDetector.detect(imageData);
    const detections = result?.detections || [];
    const faceCount = detections.length;
    
    const faceDetected = faceCount > 0;
    const multiplePeople = faceCount > 1;
    
    // Simple heuristic for looking away - if face is off-center
    let lookingAway = false;
    if (faceCount > 0) {
      const face = detections[0];
      const bbox = face.boundingBox;
      if (bbox) {
        const centerX = (bbox.originX || 0) + (bbox.width || 0) / 2;
        const centerY = (bbox.originY || 0) + (bbox.height || 0) / 2;
        const imgWidth = imageData.width;
        const imgHeight = imageData.height;
        
        const xRatio = Math.abs(centerX - imgWidth / 2) / (imgWidth / 2);
        const yRatio = Math.abs(centerY - imgHeight / 2) / (imgHeight / 2);
        
        lookingAway = xRatio > 0.5 || yRatio > 0.5;
      }
    }

    return {
      faceDetected,
      faceCount,
      multiplePeople,
      phoneDetected: false, // Disabled for now - needs TensorFlow
      paperDetected: false, // Disabled for now - needs TensorFlow
      lookingAway
    };
  } catch (error) {
    console.error('Detection error:', error);
    throw error;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case 'INITIALIZE':
      await initialize();
      break;
    
    case 'DETECT':
      try {
        const result = detect(data.imageData);
        self.postMessage({ type: 'DETECTION_RESULT', result });
      } catch (error) {
        self.postMessage({ 
          type: 'ERROR', 
          error: error instanceof Error ? error.message : 'Detection failed' 
        });
      }
      break;
    
    case 'TERMINATE':
      if (faceDetector) {
        faceDetector.close();
        faceDetector = null;
      }
      isInitialized = false;
      break;
    
    default:
      console.warn('Unknown message type:', type);
  }
};

export {};
