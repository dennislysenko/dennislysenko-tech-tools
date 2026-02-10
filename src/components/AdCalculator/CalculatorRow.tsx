import { useState, useEffect, useRef } from 'react';
import type { NumericField } from './types';

interface Props {
  label: string;
  field: NumericField;
  value: number;
  unit: '$' | '%' | '×';
  onChange: (field: NumericField, value: number) => void;
  onToggleLock: (field: NumericField) => void;
  isLocked: boolean;
  derivedFrom?: string;
  description?: string;
  visible?: boolean;
}

function formatDisplay(value: number, unit: '$' | '%' | '×'): string {
  if (unit === '%') {
    return (value * 100).toFixed(2).replace(/\.?0+$/, '');
  }
  return value.toFixed(2);
}

export function CalculatorRow({
  label,
  field,
  value,
  unit,
  onChange,
  onToggleLock,
  isLocked,
  derivedFrom,
  description,
  visible = true,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formatDisplay(value, unit));
    }
  }, [value, unit, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(formatDisplay(value, unit));
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      const converted = unit === '%' ? num / 100 : num;
      if (converted !== value) {
        onChange(field, converted);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === '.' || /^-?\d*\.?\d*$/.test(raw)) {
      setLocalValue(raw);
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        const converted = unit === '%' ? parsed / 100 : parsed;
        onChange(field, converted);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  if (!visible) return null;

  return (
    <div className={`calc-row ${derivedFrom && !isLocked ? 'calc-row--derived' : ''}`}>
      <div className="calc-row-label">
        <div className="calc-row-label-top">
          <span className="calc-row-label-text">{label}</span>
          {derivedFrom && (
            <span className="calc-row-derived-label">
              {derivedFrom}
            </span>
          )}
        </div>
        {description && (
          <p className="calc-row-description">{description}</p>
        )}
      </div>
      <div className="calc-row-input-wrap">
        {unit === '$' && <span className="calc-row-unit-prefix">$</span>}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className={`calc-input ${unit === '$' ? 'calc-input--dollar' : 'calc-input--percent'}`}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {unit === '%' && <span className="calc-row-unit-suffix">%</span>}
        {unit === '×' && <span className="calc-row-unit-suffix">×</span>}
        <button
          type="button"
          className={`calc-lock-btn ${isLocked ? 'calc-lock-btn--locked' : ''}`}
          onClick={() => onToggleLock(field)}
          title={isLocked ? 'Unlock (allow recalculation)' : 'Lock (keep this value fixed)'}
        >
          {isLocked ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
