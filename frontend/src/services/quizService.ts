import type { ProctoringEvent, ProctoringEventResponse } from '@/types/proctoring';
import { api } from './api';

export interface QuestionRequest {
  topic: string;
  subtopic: string;
  difficulty: number;
  bloom_level: string;
  previous_questions?: string[];
  classroom_quiz_id?: number;
}

export interface AnswerRequest {
  user_id?: number;
  classroom_id?: number;
  classroom_quiz_id?: number;
  theta: number;
  difficulty: number;
  selected_option: string;
  correct_answer: string;
  topic: string;
  subtopic: string;
  question: string;
  question_index: number;
  misconception?: string | null;
  misconceptions?: Record<string, string> | null;
  answer_options?: Record<string, string> | null;
  explanation?: string | null;
  bloom_level?: string | null;
}

export const generateQuestion = async (params: QuestionRequest) => {
  const response = await api.post('/quiz/generate', params);
  return response.data;
};

export const submitAnswer = async (params: AnswerRequest) => {
  const response = await api.post('/quiz/submit', params);
  return response.data;
};

export const getMisconceptionWatchlist = async () => {
  const response = await api.get('/misconceptions/watchlist');
  return response.data;
};

export interface SocraticRequest {
  question: string;
  user_answer: string;
  correct_answer: string;
  confidence: number;
  hint_level?: number;
}

export const getSocraticHint = async (params: SocraticRequest) => {
  const response = await api.post('/socratic', params);
  return response.data;
};

export interface ExplanationRequest {
  question: string;
  correct_answer: string;
  difficulty: string;
}

export interface ExplanationResponse {
  explanation: string;
  key_takeaway: string;
  example?: string | null;
  common_mistake?: string | null;
  mermaid_diagram?: string | null;
  diagram_url?: string | null;
}

export const getExplanation = async (params: ExplanationRequest): Promise<ExplanationResponse> => {
  const response = await api.post('/explanation', params);
  return response.data;
};

export interface ReviewRequest {
  user_id?: number;
  topic_id: string;
  quality: number;
}

export const scheduleReview = async (params: ReviewRequest) => {
  const response = await api.post('/review/schedule', params);
  return response.data;
};

export const generateTopicDag = async (topic: string) => {
  const response = await api.get(`/dag/generate?topic=${encodeURIComponent(topic)}`);
  return response.data;
};

export const getEducatorDashboard = async (topic: string) => {
  const response = await api.get(`/educators/dashboard?topic=${encodeURIComponent(topic)}`);
  return response.data;
};

export const getReTeachingRecommendations = async (topic: string) => {
  const response = await api.get(`/educators/re-teaching?topic=${encodeURIComponent(topic)}`);
  return response.data;
};

export const getUserAnalytics = async () => {
  const response = await api.get('/analytics/me');
  return response.data;
};

export const getStudentAnalytics = async (studentId: number) => {
  const response = await api.get(`/analytics/students/${studentId}`);
  return response.data;
};

export const getTeacherAnalytics = async () => {
  const response = await api.get('/analytics/teacher');
  return response.data;
};

export const getClasses = async () => {
  const response = await api.get('/classes');
  return response.data;
};

export const getMyClasses = async () => {
  const response = await api.get('/classes/mine');
  return response.data;
};

export const createClassroom = async (params: { name: string; subject?: string; description?: string }) => {
  const response = await api.post('/classes', params);
  return response.data;
};

export const updateClassroom = async (id: number, params: { name?: string; subject?: string; description?: string }) => {
  const response = await api.put(`/classes/${id}`, params);
  return response.data;
};

export const deleteClassroom = async (id: number) => {
  const response = await api.delete(`/classes/${id}`);
  return response.data;
};

export const requestClassEnrollment = async (id: number) => {
  const response = await api.post(`/classes/${id}/request`);
  return response.data;
};

export const decideClassRequest = async (classroomId: number, enrollmentId: number, decision: 'approve' | 'reject') => {
  const response = await api.post(`/classes/${classroomId}/requests/${enrollmentId}/${decision}`);
  return response.data;
};

export const removeClassStudent = async (classroomId: number, enrollmentId: number) => {
  const response = await api.delete(`/classes/${classroomId}/students/${enrollmentId}`);
  return response.data;
};

export const createClassQuiz = async (classroomId: number, params: {
  title: string;
  topic: string;
  subtopic?: string;
  bloom_level?: string;
  starting_difficulty?: number;
  enable_anti_cheating?: boolean;
  enable_proctoring?: boolean;
  max_proctoring_warnings?: number;
}) => {
  const response = await api.post(`/classes/${classroomId}/quizzes`, params);
  return response.data;
};

export const updateClassQuiz = async (classroomId: number, quizId: number, params: {
  title?: string;
  topic?: string;
  subtopic?: string;
  bloom_level?: string;
  starting_difficulty?: number;
  enable_anti_cheating?: boolean;
  enable_proctoring?: boolean;
  max_proctoring_warnings?: number;
}) => {
  const response = await api.put(`/classes/${classroomId}/quizzes/${quizId}`, params);
  return response.data;
};

export const deleteClassQuiz = async (classroomId: number, quizId: number) => {
  const response = await api.delete(`/classes/${classroomId}/quizzes/${quizId}`);
  return response.data;
};

export const getClassQuiz = async (quizId: number) => {
  const response = await api.get(`/classes/quizzes/${quizId}`);
  return response.data;
};

export const recordProctoringEvent = async (event: ProctoringEvent): Promise<ProctoringEventResponse> => {
  const response = await api.post('/proctoring/event', event);
  return response.data;
};

export const getQuizProctoringEvents = async (quizId: number, studentId?: number) => {
  const url = studentId 
    ? `/proctoring/quiz/${quizId}/events?student_id=${studentId}`
    : `/proctoring/quiz/${quizId}/events`;
  const response = await api.get(url);
  return response.data;
};

export const getStudentFlaggedAttempts = async (studentId: number) => {
  const response = await api.get(`/proctoring/student/${studentId}/flagged`);
  return response.data;
};

export const getQuizHistory = async () => {
  const response = await api.get('/quiz/history');
  return response.data;
};
