import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-muted-white">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-muted-white pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-elevated-navy border ${
            error ? 'border-coral ring-1 ring-coral/50' : 'border-border-color focus:border-electric-blue focus:ring-1 focus:ring-electric-blue'
          } rounded-lg px-3 py-2 text-sm text-main-white placeholder-muted-white/50 outline-none transition-all ${
            icon ? 'pl-9' : ''
          } ${rightElement ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-coral mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-white/70 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

