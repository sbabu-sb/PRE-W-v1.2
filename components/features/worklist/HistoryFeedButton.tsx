import React from 'react';
import { Library } from 'lucide-react';

interface HistoryFeedButtonProps {
  badgeCount: number;
  onClick: () => void;
}

const HistoryFeedButton: React.FC<HistoryFeedButtonProps> = ({ badgeCount, onClick }) => {
  return (
    <button onClick={onClick} className="relative text-gray-500 hover:text-gray-700" title="Open Global History Feed">
      <Library className="h-6 w-6" />
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

export default HistoryFeedButton;
