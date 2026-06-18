export interface Question {
  id: number;
  content: string;
  options: string[];
}

export interface QuizResult {
  score: number;
  theta: number;
}
