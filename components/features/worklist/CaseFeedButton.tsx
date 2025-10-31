import React from 'react';
import { Newspaper } from 'lucide-react';

interface CaseFeedButtonProps {
  badgeCount: number;
  onClick: () => void;
}

const CaseFeedButton: React.FC<CaseFeedButtonProps> = ({ badgeCount, onClick }) => {
  return (
    <button onClick={onClick} className="relative text-gray-500 hover:text-gray-700" title="Open Global Case Feed">
      <Newspaper className="h-6 w-6" />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        </span>
      )}
    </button>
  );
};

export default CaseFeedButton;
