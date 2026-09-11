import React, { createContext, useContext, useId } from 'react';
import { linearScale, type Scale } from '../../utils/scales';

const SERIES_COLORS = [
  'var(--color-accent-700)',
  'var(--color-accent-2-700)',
  'var(--color-neutral-700)',
  'var(--color-accent-500)',
];

export const seriesColor = (index: number): string =>
  SERIES_COLORS[((index % SERIES_COLORS.length) + SERIES_COLORS.length) % SERIES_COLORS.length];

export interface PlotContextValue {
  x: Scale;
  y: Scale;
  xDomain: [number, number];
  yDomain: [number, number];
  left: number;
  top: number;
  innerWidth: number;
  innerHeight: number;
  width: number;
  height: number;
}

const PlotContext = createContext<PlotContextValue | null>(null);

/** Access the active plot's scales and inner geometry from any mark. */
export const usePlot = (): PlotContextValue => {
  const context = useContext(PlotContext);
  if (!context) throw new Error('Chart marks must be rendered inside <Plot>');
  return context;
};

interface PlotProps {
  xDomain: [number, number];
  yDomain: [number, number];
  /** Required: becomes the SVG `<title>` and the visible caption. */
  title: string;
  desc?: string;
  /** Optional longer caption shown under the plot. */
  caption?: React.ReactNode;
  height?: number;
  width?: number;
  children: React.ReactNode;
}

// Shared margins; every mark maps through the same scales, so the pixel
// constants that used to drift between pages live in exactly one place.
const MARGIN = { left: 46, right: 16, top: 14, bottom: 40 };

/**
 * A coordinate system for a chart. Marks (`Axis`, `Curve`, `Marker`, ...) read
 * the scales from context, so page bodies stay flat JSX. Always renders a
 * `<title>` / `<desc>` and labels the figure.
 */
const Plot: React.FC<PlotProps> = ({
  xDomain,
  yDomain,
  title,
  desc,
  caption,
  height = 360,
  width = 640,
  children,
}) => {
  const titleId = useId();
  const descId = useId();

  const left = MARGIN.left;
  const top = MARGIN.top;
  const innerWidth = Math.max(1, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(1, height - MARGIN.top - MARGIN.bottom);

  const value: PlotContextValue = {
    x: linearScale(xDomain, [left, left + innerWidth]),
    y: linearScale(yDomain, [top + innerHeight, top]),
    xDomain,
    yDomain,
    left,
    top,
    innerWidth,
    innerHeight,
    width,
    height,
  };

  return (
    <figure style={{ margin: 'var(--space-4) 0' }}>
      <figcaption className="it-plot-title">{title}</figcaption>
      <svg
        className="it-plot"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={titleId}
        aria-describedby={desc ? descId : undefined}
      >
        <title id={titleId}>{title}</title>
        {desc ? <desc id={descId}>{desc}</desc> : null}
        <PlotContext.Provider value={value}>{children}</PlotContext.Provider>
      </svg>
      {caption ? <p className="it-plot-caption">{caption}</p> : null}
    </figure>
  );
};

export default Plot;
