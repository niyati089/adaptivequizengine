import { api } from './api';

export interface QuestionRequest {
  topic: string;
  subtopic: string;
  difficulty: number;
  bloom_level: string;
  previous_questions?: string[];
}

export interface AnswerRequest {
  theta: number;
  difficulty: number;
  selected_option: string;
  correct_answer: string;
  topic: string;
  subtopic: string;
  question: string;
}

export const generateQuestion = async (params: QuestionRequest) => {
  const response = await api.post('/quiz/generate', params);
  return response.data;
};

export const submitAnswer = async (params: AnswerRequest) => {
  const response = await api.post('/quiz/submit', params);
  return response.data;
};

export interface SocraticRequest {
  question: string;
  user_answer: string;
  correct_answer: string;
  confidence: number;
}

export const getSocraticHint = async (params: SocraticRequest) => {
  const response = await api.post('/socratic/', params);
  return response.data;
};

export interface ExplanationRequest {
  question: string;
  correct_answer: string;
  difficulty: string;
}

export const getExplanation = async (params: ExplanationRequest) => {
  const response = await api.post('/explanation/', params);
  return response.data;
};

export interface ReviewRequest {
  topic_id: string;
  quality: number;
}

export const scheduleReview = async (params: ReviewRequest) => {
  const response = await api.post('/review/schedule', params);
  return response.data;
};
