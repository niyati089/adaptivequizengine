import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  variant?: 'warning' | 'error';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  variant = 'error',
}) => {
  const containerStyles: React.CSSProperties = {
    background: variant === 'error' ? 'var(--error-soft)' : 'var(--warning-soft)',
    border: `1px solid ${variant === 'error' ? '#fca5a5' : '#fcd34d'}`,
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-6)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-6)',
  };

  const iconStyles: React.CSSProperties = {
    color: variant === 'error' ? 'var(--error)' : 'var(--warning)',
    flexShrink: 0,
  };

  const messageStyles: React.CSSProperties = {
    color: variant === 'error' ? '#991b1b' : '#92400e',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    margin: 0,
    flex: 1,
  };

  const retryButtonStyles: React.CSSProperties = {
    background: variant === 'error' ? 'var(--error)' : 'var(--warning)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-extrabold)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    transition: 'transform var(--transition-fast)',
  };

  return (
    <div style={containerStyles}>
      <AlertTriangle size={18} style={iconStyles} />
      <p style={messageStyles}>{message}</p>
      {onRetry && (
        <button
          style={retryButtonStyles}
          onClick={onRetry}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
};
