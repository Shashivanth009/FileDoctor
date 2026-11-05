import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  indeterminate?: boolean;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  indeterminate = false,
  color = '#496BFF',
  showLabel = true,
  size = 'md',
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      <div className={`w-full bg-elevated-navy rounded-full overflow-hidden ${h}`}>
        {indeterminate ? (
          <motion.div
            className={`${h} rounded-full`}
            style={{ backgroundColor: color, width: '30%' }}
            animate={{ x: ['0%', '230%', '0%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          <motion.div
            className={`${h} rounded-full`}
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
      {showLabel && !indeterminate && (
        <p className="text-xs text-muted-white mt-1 text-right">{Math.round(pct)}%</p>
      )}
    </div>
  );
};

