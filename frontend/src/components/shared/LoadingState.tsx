import React from 'react';
import { DancingSquares } from './DancingSquares';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  inline = false,
}) => {
  if (inline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <DancingSquares size={size} inline />
        <span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
          {message}
        </span>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        display: 'grid', 
        placeItems: 'center', 
        padding: 'var(--space-12)',
        minHeight: '60vh' 
      }}
    >
      <DancingSquares size={size} label={message} />
    </div>
  );
};
