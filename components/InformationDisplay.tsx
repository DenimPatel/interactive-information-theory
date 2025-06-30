
import React, { useState } from 'react';
import type { InfoMetrics } from '../types';
import Card from './Card';
import MetricCalculationModal from './MetricCalculationModal'; // Import the new modal

interface InformationDisplayProps {
  metrics: InfoMetrics;
}

interface MetricItemProps {
  label: string;
  metricKey: 'pHeads' | 'pTails' | 'iHeads' | 'iTails' | 'entropy'; // Define specific keys
  value: string | number;
  unit?: string;
  description?: string;
  onShowDetail: (metricKey: MetricItemProps['metricKey']) => void;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, metricKey, value, unit, description, onShowDetail }) => (
  <div className="py-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-slate-600">{label}:</span>
      <div className="flex items-center">
        <span className="text-lg font-semibold text-sky-600">
          {typeof value === 'number' ? value.toFixed(3) : value}
          {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
        </span>
        <button
          onClick={() => onShowDetail(metricKey)}
          className="ml-2 text-sky-500 hover:text-sky-700 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-sky-400"
          aria-label={`Show calculation detail for ${label}`}
          title={`Show calculation for ${label}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
        </button>
      </div>
    </div>
    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
  </div>
);

const InformationDisplay: React.FC<InformationDisplayProps> = ({ metrics }) => {
  const [selectedMetricKey, setSelectedMetricKey] = useState<MetricItemProps['metricKey'] | null>(null);

  const handleShowDetail = (metricKey: MetricItemProps['metricKey']) => {
    setSelectedMetricKey(metricKey);
  };

  const handleCloseModal = () => {
    setSelectedMetricKey(null);
  };

  return (
    <>
      <Card title="Coin Metrics" className="bg-slate-50">
        <div className="space-y-1 divide-y divide-slate-200">
          <MetricItem 
            label="P(Heads)" 
            metricKey="pHeads"
            value={metrics.pHeads}
            description="Probability of observing Heads"
            onShowDetail={handleShowDetail}
          />
          <MetricItem 
            label="P(Tails)" 
            metricKey="pTails"
            value={metrics.pTails}
            description="Probability of observing Tails"
            onShowDetail={handleShowDetail}
          />
          <MetricItem 
            label="I(Heads)" 
            metricKey="iHeads"
            value={metrics.iHeads} 
            unit="bits"
            description="Information content if Heads occurs"
            onShowDetail={handleShowDetail}
          />
          <MetricItem 
            label="I(Tails)" 
            metricKey="iTails"
            value={metrics.iTails} 
            unit="bits"
            description="Information content if Tails occurs"
            onShowDetail={handleShowDetail}
          />
          <MetricItem 
            label="Entropy H(Coin)" 
            metricKey="entropy"
            value={metrics.entropy} 
            unit="bits"
            description="Average uncertainty / information per flip"
            onShowDetail={handleShowDetail}
          />
        </div>
      </Card>
      {selectedMetricKey && (
        <MetricCalculationModal
          metricKey={selectedMetricKey}
          pHeadsValue={metrics.pHeads}
          metrics={metrics}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default InformationDisplay;
