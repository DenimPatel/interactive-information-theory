import React from 'react';

interface MetricRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  valueColor?: string;
  width?: number;
}

/** A "label ... bold value" row, flush left/right, used throughout the metric lists. */
const MetricRow: React.FC<MetricRowProps> = ({ label, value, valueColor, width }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', width }}>
    <span>{label}</span>
    <b style={{ color: valueColor }}>{value}</b>
  </div>
);

export default MetricRow;
