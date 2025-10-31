import React from 'react';

interface ChipProps {
    tone?: 'neutral' | 'info' | 'success' | 'warn' | 'danger';
    children: React.ReactNode;
}

const Chip: React.FC<ChipProps> = ({ tone = "neutral", children }) => {
  const tones = {
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
    success: "bg-green-100 text-green-700 border-green-200",
    warn: "bg-yellow-100 text-yellow-700 border-yellow-200",
    danger: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default Chip;
