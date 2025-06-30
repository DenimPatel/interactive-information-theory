
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className, titleClassName }) => {
  return (
    <div className={`bg-white shadow-xl rounded-lg ${className || ''}`}>
      {title && (
        <div className={`p-4 sm:p-6 border-b border-slate-200 ${titleClassName || ''}`}>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-700">{title}</h2>
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
