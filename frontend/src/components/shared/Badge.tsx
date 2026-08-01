import React from 'react';

interface BadgeProps {
  variant?: 'purple' | 'green' | 'amber' | 'red' | 'blue';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'purple', 
  children,
  icon 
}) => {
  const variantClasses: Record<string, string> = {
    purple: 'badge-purple',
    green: 'badge-green',
    amber: 'badge-amber',
    red: 'badge-red',
    blue: 'badge-blue',
  };

  return (
    <span className={`badge ${variantClasses[variant]}`}>
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
