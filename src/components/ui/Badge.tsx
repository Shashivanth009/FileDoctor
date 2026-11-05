import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
  color?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  color,
}) => {
  const variants: Record<string, string> = {
    default: 'bg-elevated-navy text-muted-white border-border-color',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-amber/10 text-amber border-amber/20',
    error: 'bg-coral/10 text-coral border-coral/20',
    info: 'bg-electric-blue/10 text-electric-blue border-electric-blue/20',
    accent: 'bg-arctic-mint/10 text-arctic-mint border-arctic-mint/20',
  };

  const sizes: Record<string, string> = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const style = color
    ? { backgroundColor: `${color}15`, color, borderColor: `${color}30` }
    : undefined;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[color ? 'default' : variant]} ${sizes[size]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

