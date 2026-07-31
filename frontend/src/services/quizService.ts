// Import auth context to get the properly configured API instance
import { useAuth } from '@/context/AuthContext';

export interface QuestionRequest {
  topic: string;
  subtopic: string;
  difficulty: number;
  bloom_level: string;
  previous_questions?: string[];
  enable_anti_cheating?: boolean;
  session_id?: string; // Required for backend lock enforcement (Fix 2)
}

export interface AnswerRequest {
  theta: number;
  difficulty: number;
  selected_option: string;
  correct_answer: string;
  topic: string;
  subtopic: string;
  question: string;
  misconception?: string | null;
  // New fields for complete question data storage
  question_options?: Record<string, string>;
  explanation?: string;
  bloom_level?: string;
}

// Helper to get the API instance from context (this will be called from components)
const getAuthenticatedApi = () => {
  // This will be injected by the calling component via useAuth hook
  return null; // Will be replaced by the component
};

export const generateQuestion = async (params: QuestionRequest, apiInstance?: any) => {
  if (!apiInstance) {
    throw new Error('API instance required. Pass apiInstance from useAuth context.');
  }
  console.log('[quizService] generateQuestion - Authorization header:', apiInstance.defaults.headers.common.Authorization?.substring(0, 30) + '...');
  const response = await apiInstance.post('/quiz/generate', params);
  return response.data;
};

export const submitAnswer = async (params: AnswerRequest, apiInstance?: any) => {
  if (!apiInstance) {
    throw new Error('API instance required. Pass apiInstance from useAuth context.');
  }
  const response = await apiInstance.post('/quiz/submit', params);
  return response.data;
};

export interface SocraticRequest {
  question: string;
  user_answer: string;
  correct_answer: string;
  confidence: number;
}

export const getSocraticHint = async (params: SocraticRequest, apiInstance?: any) => {
  if (!apiInstance) {
    throw new Error('API instance required. Pass apiInstance from useAuth context.');
  }
  const response = await apiInstance.post('/socratic/', params);
  return response.data;
};

export interface ExplanationRequest {
  question: string;
  correct_answer: string;
  difficulty: string;
}

export const getExplanation = async (params: ExplanationRequest, apiInstance?: any) => {
  if (!apiInstance) {
    throw new Error('API instance required. Pass apiInstance from useAuth context.');
  }
  const response = await apiInstance.post('/explanation/', params);
  return response.data;
};

export interface ReviewRequest {
  topic_id: string;
  quality: number;
}

export const scheduleReview = async (params: ReviewRequest, apiInstance?: any) => {
  if (!apiInstance) {
    throw new Error('API instance required. Pass apiInstance from useAuth context.');
  }
  const response = await apiInstance.post('/review/schedule', params);
  return response.data;
};

export const generateTopicDag = async (topic: string, apiInstance?: any) => {
  if (!apiInstance) {
    throw new Error('API instance required. Pass apiInstance from useAuth context.');
  }
  const response = await apiInstance.get(`/dag/generate?topic=${encodeURIComponent(topic)}`);
  return response.data;
};

export const getEducatorDashboard = async (topic: string, apiInstance?: any) => {
  if (!apiInstance) {
    throw new Error('API instance required. Pass apiInstance from useAuth context.');
  }
  const response = await apiInstance.get(`/educators/dashboard?topic=${encodeURIComponent(topic)}`);
  return response.data;
};

export const getReTeachingRecommendations = async (topic: string, apiInstance?: any) => {
  if (!apiInstance) {
    throw new Error('API instance required. Pass apiInstance from useAuth context.');
  }
  const response = await apiInstance.get(`/educators/re-teaching?topic=${encodeURIComponent(topic)}`);
  return response.data;
};

export const getQuizHistory = async (apiInstance?: any) => {
  if (!apiInstance) {
    throw new Error('API instance required. Pass apiInstance from useAuth context.');
  }
  const response = await apiInstance.get('/quiz/history');
  return response.data;
};
