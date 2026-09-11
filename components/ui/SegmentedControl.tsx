import React from 'react';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedControlProps<T extends string | number> {
  label?: React.ReactNode;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  name: string;
}

/**
 * Radio group over the Broadsheet `.seg` / `.seg-opt` markup. The markup is
 * fiddly enough that pages avoided it; this makes the right pattern the easy
 * one.
 */
function SegmentedControl<T extends string | number>({
  label,
  value,
  onChange,
  options,
  name,
}: SegmentedControlProps<T>): React.ReactElement {
  return (
    <div>
      {label ? (
        <div className="it-controls-label" style={{ marginBottom: 5 }}>
          {label}
        </div>
      ) : null}
      <div className="seg">
        {options.map((option) => (
          <label className="seg-opt" key={String(option.value)}>
            <input
              type="radio"
              name={name}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default SegmentedControl;
