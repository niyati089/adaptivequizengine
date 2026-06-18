import { create } from 'zustand';

interface QuizState {
  currentQuestion: any | null;
  score: number;
  setQuestion: (q: any) => void;
  // TODO: Add more state
}

export const useQuizStore = create<QuizState>((set) => ({
  currentQuestion: null,
  score: 0,
  setQuestion: (q) => set({ currentQuestion: q }),
}));
