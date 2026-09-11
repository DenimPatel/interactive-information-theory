import React, { useEffect, useId, useState } from 'react';

interface NumberInputProps {
  label: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: React.ReactNode;
  width?: number;
}

const format = (value: number): string =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));

/**
 * Numeric field with local string state, so typing `0.` or `-` does not fight
 * the parser. Commits on blur or Enter and clamps to [min, max].
 */
const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  width = 180,
}) => {
  const id = useId();
  const [text, setText] = useState(() => format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(format(value));
  }, [value, focused]);

  const commit = (): void => {
    const parsed = Number(text);
    if (!Number.isFinite(parsed)) {
      setText(format(value));
      return;
    }
    const clamped = Math.min(max ?? parsed, Math.max(min ?? parsed, parsed));
    onChange(clamped);
    setText(format(clamped));
  };

  return (
    <div className="field" style={{ maxWidth: width }}>
      <label htmlFor={id}>{label}</label>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          id={id}
          className="input"
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            commit();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
          }}
          data-step={step}
        />
        {suffix ? <span className="text-muted" style={{ fontSize: 13 }}>{suffix}</span> : null}
      </span>
    </div>
  );
};

export default NumberInput;
