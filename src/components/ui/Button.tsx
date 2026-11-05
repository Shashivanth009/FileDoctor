import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-electric-blue/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants: Record<string, string> = {
    primary: 'bg-electric-blue text-white hover:bg-bright-blue focus:ring-offset-ink-navy',
    secondary: 'bg-surface-navy text-main-white border border-border-color hover:bg-elevated-navy focus:ring-offset-ink-navy',
    ghost: 'text-muted-white hover:bg-surface-navy/60 hover:text-main-white focus:ring-offset-ink-navy',
    danger: 'bg-coral/10 text-coral border border-coral/20 hover:bg-coral/20 focus:ring-offset-ink-navy',
  };

  const sizes: Record<string, string> = {
    sm: 'text-xs px-3 py-1.5 rounded-md',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3 rounded-xl',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? undefined : { scale: 1.015 }}
      whileTap={disabled || loading ? undefined : { scale: 0.985 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </motion.button>
  );
};

