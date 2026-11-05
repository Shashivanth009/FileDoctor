import React from 'react';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  showValue?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  unit = '',
  showValue = true,
}) => (
  <div className="space-y-2">
    {(label || showValue) && (
      <div className="flex items-center justify-between">
        {label && <label className="text-xs font-medium text-muted-white">{label}</label>}
        {showValue && (
          <span className="text-xs font-mono text-main-white">
            {value}{unit}
          </span>
        )}
      </div>
    )}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-elevated-navy rounded-full appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-electric-blue
        [&::-webkit-slider-thumb]:hover:bg-bright-blue [&::-webkit-slider-thumb]:transition-colors
        [&::-webkit-slider-thumb]:shadow-md"
    />
  </div>
);

