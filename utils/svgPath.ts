export interface PathPoint {
  x: number;
  y: number;
}

/**
 * Builds an SVG path `d` string for a polyline, linearly mapping data-space
 * points [xMin,xMax] x [yMin,yMax] into pixel-space [x0,x1] x [y0,y1].
 * y0 is the pixel row for yMin (typically the chart's bottom), y1 for yMax.
 */
export const buildSvgPath = (
  points: PathPoint[],
  xMin: number, xMax: number, yMin: number, yMax: number,
  x0: number, x1: number, y0: number, y1: number
): string => {
  let d = '';
  points.forEach((p, i) => {
    const px = x0 + ((p.x - xMin) / (xMax - xMin)) * (x1 - x0);
    const py = y0 - ((p.y - yMin) / (yMax - yMin)) * (y0 - y1);
    d += (i === 0 ? 'M ' : 'L ') + px.toFixed(2) + ',' + py.toFixed(2) + ' ';
  });
  return d.trim();
};
