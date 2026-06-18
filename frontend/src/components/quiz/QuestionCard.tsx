"use client";

import React, { useState } from 'react';
import { GlassCard } from '@/components/shared/GlassCard';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  question: string;
  options: string[];
  difficulty: number;
  topic: string;
  onSelect: (option: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, options, difficulty, topic, onSelect }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
    // Simulate delay for animation before submitting
    setTimeout(() => {
      onSelect(option);
    }, 400);
  };

  return (
    <GlassCard className="max-w-3xl mx-auto w-full relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8 z-0"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            {topic}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Difficulty (θ):</span>
            <span className="bg-primary/20 text-primary-indigo px-2 py-0.5 rounded text-sm font-bold">
              {difficulty > 0 ? `+${difficulty}` : difficulty}
            </span>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-foreground leading-tight">
          {question}
        </h2>

        <div className="space-y-3">
          {options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                selected === option 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-muted hover:border-primary/50 bg-white'
              }`}
            >
              <div className="flex items-center">
                <span className={`flex items-center justify-center w-8 h-8 rounded-lg mr-4 font-bold text-sm ${
                  selected === option ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className={`text-lg ${selected === option ? 'font-medium text-primary-indigo' : 'text-foreground'}`}>
                  {option}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};
