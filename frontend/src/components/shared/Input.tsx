import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  fullWidth = false,
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    padding: 'var(--space-3)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface-low)',
    outline: 'none',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    fontFamily: 'inherit',
  };

  const errorStyles: React.CSSProperties = {
    borderColor: 'var(--error)',
  };

  const focusStyles: React.CSSProperties = {
    borderColor: 'var(--primary)',
    boxShadow: '0 0 0 3px rgba(107, 56, 212, 0.1)',
  };

  const labelStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    fontWeight: 'var(--font-extrabold)',
    textTransform: 'uppercase',
    fontSize: 'var(--text-xs)',
  };

  const iconWrapperStyles: React.CSSProperties = {
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
  };

  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    left: 'var(--space-3)',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--muted)',
    pointerEvents: 'none',
  };

  const inputWithIconStyles: React.CSSProperties = {
    paddingLeft: '2.5rem',
  };

  const errorTextStyles: React.CSSProperties = {
    color: 'var(--error)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    marginTop: 'var(--space-1)',
  };

  const inputElement = (
    <input
      style={{
        ...baseStyles,
        ...(error && errorStyles),
        ...style,
      }}
      onFocus={(e) => {
        Object.assign(e.currentTarget.style, focusStyles);
      }}
      onBlur={(e) => {
        Object.assign(e.currentTarget.style, { 
          borderColor: error ? 'var(--error)' : 'var(--outline)',
          boxShadow: 'none',
        });
      }}
      {...props}
    />
  );

  if (label) {
    return (
      <label style={labelStyles}>
        {label}
        {icon ? (
          <div style={iconWrapperStyles}>
            <div style={iconStyles}>{icon}</div>
            <input
              style={{
                ...baseStyles,
                ...(error && errorStyles),
                ...inputWithIconStyles,
                ...style,
              }}
              onFocus={(e) => {
                Object.assign(e.currentTarget.style, focusStyles);
              }}
              onBlur={(e) => {
                Object.assign(e.currentTarget.style, { 
                  borderColor: error ? 'var(--error)' : 'var(--outline)',
                  boxShadow: 'none',
                });
              }}
              {...props}
            />
          </div>
        ) : (
          inputElement
        )}
        {error && <span style={errorTextStyles}>{error}</span>}
      </label>
    );
  }

  if (icon) {
    return (
      <div style={iconWrapperStyles}>
        <div style={iconStyles}>{icon}</div>
        <input
          style={{
            ...baseStyles,
            ...(error && errorStyles),
            ...inputWithIconStyles,
            ...style,
          }}
          onFocus={(e) => {
            Object.assign(e.currentTarget.style, focusStyles);
          }}
          onBlur={(e) => {
            Object.assign(e.currentTarget.style, { 
              borderColor: error ? 'var(--error)' : 'var(--outline)',
              boxShadow: 'none',
            });
          }}
          {...props}
        />
        {error && <span style={errorTextStyles}>{error}</span>}
      </div>
    );
  }

  return (
    <>
      {inputElement}
      {error && <span style={errorTextStyles}>{error}</span>}
    </>
  );
};
