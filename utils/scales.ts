/** A callable linear scale with an inverse. */
export interface Scale {
  (value: number): number;
  invert(pixel: number): number;
}

/**
 * Maps a data domain onto a pixel range. The returned function is callable and
 * carries `.invert` for pointer-to-data conversion. Degenerate domains collapse
 * to the range's start rather than producing NaN.
 */
export const linearScale = (domain: [number, number], range: [number, number]): Scale => {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const domainSpan = d1 - d0;
  const rangeSpan = r1 - r0;

  const scale = ((value: number) =>
    domainSpan === 0 ? r0 : r0 + ((value - d0) / domainSpan) * rangeSpan) as Scale;

  scale.invert = (pixel: number) =>
    rangeSpan === 0 ? d0 : d0 + ((pixel - r0) / rangeSpan) * domainSpan;

  return scale;
};

export interface TickOptions {
  /** Approximate number of intervals wanted (result may differ). */
  count?: number;
  /** Pad the domain outward to the nearest tick. */
  nice?: boolean;
}

/**
 * Human-friendly ticks on a 1/2/5×10^k grid. Always ascending and bounded by
 * the (optionally padded) range.
 */
export const niceTicks = (min: number, max: number, count = 5): number[] => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return [];
  if (min === max) return [min];

  const span = max - min;
  const rawStep = span / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  // Snap to the nearest 1/2/5/10 on the decade, so a residual of 8 lands on 10
  // rather than under-counting on 5.
  const mantissa = residual < 1.5 ? 1 : residual < 3 ? 2 : residual < 7 ? 5 : 10;
  const step = magnitude * mantissa;

  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step * 1e-9; value += step) {
    const rounded = Math.abs(value) < step * 1e-9 ? 0 : Number(value.toFixed(10));
    if (rounded <= max + step * 1e-9) ticks.push(rounded);
  }
  return ticks;
};
