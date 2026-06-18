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
  const response = await api.post('/generate-question', params);
  return response.data;
};

export const submitAnswer = async (params: AnswerRequest) => {
  const response = await api.post('/submit-answer', params);
  return response.data;
};
