import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: 'var(--space-12)',
    gap: 'var(--space-4)',
  };

  const iconStyles: React.CSSProperties = {
    color: 'var(--muted)',
    marginBottom: 'var(--space-4)',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-extrabold)',
    color: 'var(--ink)',
    margin: 0,
  };

  const descriptionStyles: React.CSSProperties = {
    color: 'var(--muted)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--leading-normal)',
    margin: 0,
    maxWidth: '32rem',
  };

  const actionButtonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-full)',
    padding: 'var(--space-3) var(--space-6)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-extrabold)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
    marginTop: 'var(--space-4)',
  };

  return (
    <div style={containerStyles}>
      {Icon && <Icon size={48} style={iconStyles} />}
      <h3 style={titleStyles}>{title}</h3>
      {description && <p style={descriptionStyles}>{description}</p>}
      {action && (
        <button
          style={actionButtonStyles}
          onClick={action.onClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
