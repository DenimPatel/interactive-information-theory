import React from 'react';
import { usePlot } from './Plot';
import { niceTicks } from '../../utils/scales';

export const formatTick = (value: number): string => {
  if (!Number.isFinite(value)) return '';
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  if (magnitude >= 10000 || magnitude < 0.001) return value.toExponential(1);
  return String(Number(value.toPrecision(3)));
};

interface AxisProps {
  orient?: 'left' | 'bottom';
  label?: React.ReactNode;
  /** Explicit ticks; defaults to niceTicks over the plot domain. */
  ticks?: number[];
}

/** A single axis with ticks. Tick text is `aria-hidden`; the figure title carries the meaning. */
const Axis: React.FC<AxisProps> = ({ orient = 'left', label, ticks }) => {
  const plot = usePlot();
  const { left, top, innerWidth, innerHeight, height, x, y, xDomain, yDomain } = plot;

  if (orient === 'bottom') {
    const values = ticks ?? niceTicks(xDomain[0], xDomain[1], 6);
    const axisY = top + innerHeight;
    return (
      <g aria-hidden="true">
        <line className="it-axis-line" x1={left} y1={axisY} x2={left + innerWidth} y2={axisY} />
        {values.map((value) => {
          const px = x(value);
          if (px < left - 0.5 || px > left + innerWidth + 0.5) return null;
          return (
            <g key={value}>
              <line className="it-axis-line" x1={px} y1={axisY} x2={px} y2={axisY + 4} />
              <text className="it-tick-label" x={px} y={axisY + 16} textAnchor="middle">
                {formatTick(value)}
              </text>
            </g>
          );
        })}
        {label ? (
          <text className="it-axis-label" x={left + innerWidth / 2} y={height - 4} textAnchor="middle">
            {label}
          </text>
        ) : null}
      </g>
    );
  }

  const values = ticks ?? niceTicks(yDomain[0], yDomain[1], 5);
  return (
    <g aria-hidden="true">
      <line className="it-axis-line" x1={left} y1={top} x2={left} y2={top + innerHeight} />
      {values.map((value) => {
        const py = y(value);
        if (py < top - 0.5 || py > top + innerHeight + 0.5) return null;
        return (
          <g key={value}>
            <line className="it-axis-line" x1={left - 4} y1={py} x2={left} y2={py} />
            <text className="it-tick-label" x={left - 8} y={py + 3} textAnchor="end">
              {formatTick(value)}
            </text>
          </g>
        );
      })}
      {label ? (
        <text
          className="it-axis-label"
          x={13}
          y={top + innerHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90 13 ${top + innerHeight / 2})`}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

export default Axis;
