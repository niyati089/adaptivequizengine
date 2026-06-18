import React from 'react';
import { cn } from '@/lib/utils';

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const GradientText: React.FC<GradientTextProps> = ({ children, className, variant = 'primary', ...props }) => {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent",
        variant === 'primary' ? "bg-gradient-to-r from-primary to-primary-indigo" : "bg-gradient-to-r from-secondary to-secondary-pink",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
