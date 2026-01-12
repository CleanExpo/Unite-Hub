/**
 * Slider Component - Phase 2 UI Library
 * Range input slider for numeric values
 */

import React from 'react';

export interface SliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export default function Slider({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  disabled = false,
}: SliderProps) {
  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onChange?.(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`w-full h-2 bg-bg-hover rounded-lg appearance-none cursor-pointer dark:bg-bg-raised ${className}`}
    />
  );
}

// Named export for compatibility
export { Slider };
