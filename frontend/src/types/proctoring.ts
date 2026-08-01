// Proctoring Types for Enhanced AI Detection System

export type ProctoringEventType =
  // Browser-based events
  | 'tab_switch'
  | 'copy'
  | 'paste'
  | 'context_menu'
  | 'window_blur'
  // AI vision-based events
  | 'no_face_detected'
  | 'multiple_people'
  | 'phone_detected'
  | 'paper_detected'
  | 'looking_away';

export type ProctoringEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ProctoringEvent {
  classroom_quiz_id: number;
  event_type: ProctoringEventType;
  event_data?: string;
  attempt_id?: number;
  severity?: ProctoringEventSeverity;
  confidence?: number; // 0-100 for AI detections
}

export interface ProctoringEventResponse {
  event_id: number;
  warning_count: number;
  max_warnings: number;
  exceeded: boolean;
  severity: ProctoringEventSeverity;
  confidence?: number;
}

export interface DetectionStatus {
  faceDetected: boolean;
  faceCount: number;
  faceConfidence: number;
  multiplePeople: boolean;
  phoneDetected: boolean;
  paperDetected: boolean;
  bookDetected: boolean;
  lookingAway: boolean;
  detectedObjects: string[];
  violations: string[];
}

export interface ProctoringStats {
  total_events: number;
  events_by_type: Record<ProctoringEventType, number>;
  events_by_severity: Record<ProctoringEventSeverity, number>;
  critical_count: number;
  high_count: number;
}
