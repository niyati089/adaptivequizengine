import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <div
      className={`glass-card ${hoverEffect ? 'hover:shadow-2xl' : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};
