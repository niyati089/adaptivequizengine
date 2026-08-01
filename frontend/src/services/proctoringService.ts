import { api } from './api';

export interface ProctoringLogPayload {
  user_id?: number;
  session_id?: string;
  event_type: 'NO_FACE_DETECTED' | 'MULTIPLE_FACES_DETECTED' | 'AUDIO_SPIKE' | 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT';
  timestamp?: string;
  details?: string;
}

export interface SessionLockStatus {
  session_id: string;
  violation_count: number;
  is_locked: boolean;
}

export const logProctoringEvent = async (payload: ProctoringLogPayload) => {
  try {
    const response = await api.post('/proctoring/log', {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.warn('Failed to log proctoring event to backend:', error);
    return { status: 'logged_locally_only' };
  }
};

export const getProctoringSummary = async (sessionId: string) => {
  const response = await api.get(`/proctoring/summary/${encodeURIComponent(sessionId)}`);
  return response.data;
};

/**
 * Fast server-side check: has this session been locked due to integrity violations?
 * Used on quiz start to restore persisted state after a page reload.
 * Returns null on network failure (fail-open — local state takes precedence).
 */
export const getSessionLockStatus = async (sessionId: string): Promise<SessionLockStatus | null> => {
  try {
    const response = await api.get(`/proctoring/is-locked/${encodeURIComponent(sessionId)}`);
    return response.data as SessionLockStatus;
  } catch (error) {
    console.warn('[Proctoring] Could not fetch session lock status:', error);
    return null;
  }
};

/**
 * Clear all proctoring events for a student's session to unlock their quiz.
 * Authorized as educator/teacher only.
 */
export const resetSessionProctoring = async (sessionId: string) => {
  const response = await api.delete(`/proctoring/reset/${encodeURIComponent(sessionId)}`);
  return response.data;
};

/**
 * Fetch educator dashboard metrics and student list with active locked sessions.
 */
export const getEducatorDashboardData = async () => {
  const response = await api.get('/educators/dashboard');
  return response.data;
};

