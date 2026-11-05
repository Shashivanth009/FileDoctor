import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accent?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick,
  padding = 'md',
  accent,
}) => {
  const pads: Record<string, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  const inner = (
    <>
      {accent && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ backgroundColor: accent }} />
      )}
      {children}
    </>
  );

  if (hoverable) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={`relative bg-surface-navy border border-border-color rounded-xl ${pads[padding]} cursor-pointer ${className}`}
        onClick={onClick}
      >
        {inner}
      </motion.div>
    );
  }

  return (
    <div
      className={`relative bg-surface-navy border border-border-color rounded-xl ${pads[padding]} ${className}`}
      onClick={onClick}
    >
      {inner}
    </div>
  );
};

