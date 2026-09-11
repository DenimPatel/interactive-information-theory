import React from 'react';

interface CalloutProps {
  title?: React.ReactNode;
  tone?: 'info' | 'warn';
  children: React.ReactNode;
}

const Callout: React.FC<CalloutProps> = ({ title, tone = 'info', children }) => (
  <div className="it-callout" data-tone={tone}>
    <div>
      {title ? <span className="it-callout-title">{title}</span> : null}
      {children}
    </div>
  </div>
);

export default Callout;
