import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  style,
  ...props 
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-full)',
    fontWeight: 'var(--font-extrabold)',
    lineHeight: 1,
    textDecoration: 'none',
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    ...(fullWidth && { width: '100%' }),
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: 'var(--space-2) var(--space-3)',
      fontSize: 'var(--text-xs)',
    },
    md: {
      padding: 'var(--space-3) var(--space-5)',
      fontSize: 'var(--text-sm)',
    },
    lg: {
      padding: 'var(--space-4) var(--space-6)',
      fontSize: 'var(--text-base)',
    },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--navy)',
      color: 'white',
      boxShadow: '0 12px 24px rgba(18, 24, 38, 0.14)',
    },
    secondary: {
      background: 'var(--surface)',
      border: '1px solid var(--outline)',
      color: 'var(--navy)',
    },
    outline: {
      background: 'transparent',
      border: '1px solid var(--outline)',
      color: 'var(--navy)',
    },
  };

  const hoverStyles: React.CSSProperties = {
    transform: 'translateY(-2px)',
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, { transform: 'translateY(0)' });
      }}
      {...props}
    >
      {children}
    </button>
  );
};
