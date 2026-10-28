import { motion } from 'framer-motion';

type Props = {
  progress: number; // 0-100, or -1 for indeterminate
  label?: string;
  className?: string;
};

export function ProgressBar({ progress, label, className = '' }: Props) {
  const isIndeterminate = progress < 0;

  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={isIndeterminate ? undefined : progress} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Processing'}>
      {label && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        {isIndeterminate ? (
          <motion.div
            className="h-full w-1/3 bg-brand-500 rounded-full"
            animate={{ x: ['0%', '300%', '0%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          <motion.div
            className="h-full bg-brand-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
      {!isIndeterminate && (
        <p className="text-xs text-gray-400 mt-1 text-right">{progress}%</p>
      )}
    </div>
  );
}
