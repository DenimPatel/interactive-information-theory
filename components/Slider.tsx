import React from 'react';

interface SliderProps {
  label: React.ReactNode;
  valueLabel: React.ReactNode;
  valueColor?: string;
  valueItalic?: boolean;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  accentColor?: string;
  style?: React.CSSProperties;
}

/** A labeled range input matching the Broadsheet `.field` pattern. */
const Slider: React.FC<SliderProps> = ({
  label, valueLabel, valueColor, valueItalic, value, min, max, step, onChange, accentColor, style,
}) => (
  <div className="field" style={style}>
    <label>
      {label} &mdash;{' '}
      <b style={{ color: valueColor || 'var(--color-accent-700)', fontStyle: valueItalic ? 'italic' : undefined }}>
        {valueLabel}
      </b>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: '100%', accentColor: accentColor || 'var(--color-accent)' }}
    />
  </div>
);

export default Slider;
