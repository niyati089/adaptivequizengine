import React from 'react';

interface QuestionCardProps {
  question: string;
  options: string[];
  onSelect: (option: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, options, onSelect }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl mb-4">{question}</h2>
      {/* TODO: Implement options rendering */}
    </div>
  );
};
