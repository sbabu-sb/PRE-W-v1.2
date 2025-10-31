import React from 'react';
import { Edit3 } from 'lucide-react';

interface ByYouButtonProps {
  count: number;
  onClick: () => void;
}

const ByYouButton: React.FC<ByYouButtonProps> = ({ count, onClick }) => {
  return (
    <button onClick={onClick} className="relative text-gray-500 hover:text-gray-700" title="By You">
      <Edit3 className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-2 flex h-4 w-4">
          <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-gray-400 text-white text-[10px] font-bold">
            {count > 9 ? '9+' : count}
          </span>
        </span>
      )}
    </button>
  );
};

export default ByYouButton;
