import React from 'react';
import { usePlot } from './Plot';

// ─── Curve ─────────────────────────────────────────────────────────────────

interface CurvedPoint {
  x: number;
  y: number;
}

interface CurveProps {
  points: CurvedPoint[];
  color?: string;
  dashed?: boolean;
  width?: number;
}

/** A polyline in data coordinates. Non-finite points break the path. */
export const Curve: React.FC<CurveProps> = ({ points, color, dashed, width = 2 }) => {
  const plot = usePlot();
  let d = '';
  let started = false;
  for (const point of points) {
    const px = plot.x(point.x);
    const py = plot.y(point.y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) {
      started = false;
      continue;
    }
    d += `${started ? 'L' : 'M'} ${px.toFixed(2)} ${py.toFixed(2)} `;
    started = true;
  }

  return (
    <path
      d={d.trim()}
      fill="none"
      stroke={color ?? 'var(--color-accent-700)'}
      strokeWidth={width}
      strokeDasharray={dashed ? '5 4' : undefined}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
};

// ─── Marker ────────────────────────────────────────────────────────────────

interface MarkerProps {
  x: number;
  y: number;
  color?: string;
  label?: React.ReactNode;
  labelDx?: number;
  labelDy?: number;
  radius?: number;
}

/** A single emphasised data point, optionally labelled. */
export const Marker: React.FC<MarkerProps> = ({
  x,
  y,
  color,
  label,
  labelDx = 8,
  labelDy = -8,
  radius = 5,
}) => {
  const plot = usePlot();
  const px = plot.x(x);
  const py = plot.y(y);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;

  return (
    <g>
      <circle cx={px} cy={py} r={radius} fill={color ?? 'var(--color-accent-2-600)'} stroke="var(--color-bg)" strokeWidth={2} />
      {label ? (
        <text x={px + labelDx} y={py + labelDy} fontSize={11} aria-hidden="true">
          {label}
        </text>
      ) : null}
    </g>
  );
};

// ─── RuleY ─────────────────────────────────────────────────────────────────

interface RuleYProps {
  y: number;
  color?: string;
  label?: React.ReactNode;
  dashed?: boolean;
}

/** A horizontal reference line at a y value. */
export const RuleY: React.FC<RuleYProps> = ({ y, color, label, dashed = true }) => {
  const plot = usePlot();
  const py = plot.y(y);
  if (!Number.isFinite(py)) return null;

  return (
    <g>
      <line
        x1={plot.left}
        y1={py}
        x2={plot.left + plot.innerWidth}
        y2={py}
        stroke={color ?? 'var(--color-neutral-500)'}
        strokeWidth={1}
        strokeDasharray={dashed ? '4 4' : undefined}
      />
      {label ? (
        <text x={plot.left + plot.innerWidth - 2} y={py - 4} fontSize={10} textAnchor="end" opacity={0.7}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

// ─── BarSeries ─────────────────────────────────────────────────────────────

export interface Bar {
  x: number;
  y: number;
  width: number;
}

interface BarSeriesProps {
  bars: Bar[];
  color?: string;
  baseline?: number;
  opacity?: number;
}

/** Rectangles in data coordinates — histograms, PMFs, block plots. */
export const BarSeries: React.FC<BarSeriesProps> = ({
  bars,
  color,
  baseline = 0,
  opacity = 0.85,
}) => {
  const plot = usePlot();
  const basePx = plot.y(baseline);

  return (
    <g>
      {bars.map((bar, index) => {
        const x0 = plot.x(bar.x);
        const x1 = plot.x(bar.x + bar.width);
        const yTop = plot.y(bar.y);
        const top = Math.min(yTop, basePx);
        const height = Math.abs(basePx - yTop);
        if (![x0, x1, top, height].every(Number.isFinite)) return null;
        return (
          <rect
            key={index}
            x={Math.min(x0, x1)}
            y={top}
            width={Math.abs(x1 - x0)}
            height={height}
            fill={color ?? 'var(--color-accent-700)'}
            opacity={opacity}
          />
        );
      })}
    </g>
  );
};

// ─── Heatmap ───────────────────────────────────────────────────────────────

interface HeatmapProps {
  /** data[row][col], row 0 at the top of the plot. */
  data: number[][];
  max?: number;
  colorFor?: (t: number) => string;
}

/** A grid of shaded cells over the current plot domain. */
export const Heatmap: React.FC<HeatmapProps> = ({ data, max, colorFor }) => {
  const plot = usePlot();
  const rows = data.length;
  const cols = rows > 0 ? data[0].length : 0;
  if (rows === 0 || cols === 0) return null;

  const [x0, x1] = plot.xDomain;
  const [y0, y1] = plot.yDomain;
  const dx = (x1 - x0) / cols;
  const dy = (y1 - y0) / rows;
  const peak = max ?? Math.max(...data.flat(), 0);
  const paint = colorFor ?? defaultHeatColor;

  return (
    <g>
      {data.map((row, r) =>
        row.map((value, c) => {
          const left = plot.x(x0 + c * dx);
          const right = plot.x(x0 + (c + 1) * dx);
          const top = plot.y(y1 - r * dy);
          const bottom = plot.y(y1 - (r + 1) * dy);
          const t = peak > 0 ? Math.max(0, Math.min(1, value / peak)) : 0;
          return (
            <rect
              key={`${r}-${c}`}
              x={Math.min(left, right)}
              y={Math.min(top, bottom)}
              width={Math.abs(right - left)}
              height={Math.abs(bottom - top)}
              fill={paint(t)}
            />
          );
        }),
      )}
    </g>
  );
};

export const defaultHeatColor = (t: number): string =>
  `color-mix(in srgb, var(--color-accent-700) ${Math.round(4 + t * 96)}%, var(--color-bg))`;

// ─── Legend ────────────────────────────────────────────────────────────────

export interface LegendItem {
  label: React.ReactNode;
  color: string;
  dashed?: boolean;
}

/** An HTML legend, placed after a `<Plot>`; series stay distinguishable by more than colour. */
export const Legend: React.FC<{ items: LegendItem[] }> = ({ items }) => (
  <div className="it-legend">
    {items.map((item, index) => (
      <span className="it-legend-item" key={index}>
        <span
          className={`it-legend-swatch${item.dashed ? ' it-dashed' : ''}`}
          style={{ borderTopColor: item.color }}
        />
        {item.label}
      </span>
    ))}
  </div>
);
