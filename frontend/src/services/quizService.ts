import { api } from './api';

export const submitAnswer = async (questionId: number, answer: str) => {
  // TODO: Implement API call
  return api.post('/quiz/submit', { questionId, answer });
};
