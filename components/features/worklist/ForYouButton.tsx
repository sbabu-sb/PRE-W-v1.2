import React from 'react';
import { User } from 'lucide-react';

interface ForYouButtonProps {
  count: number;
  onClick: () => void;
}

const ForYouButton: React.FC<ForYouButtonProps> = ({ count, onClick }) => {
  return (
    <button onClick={onClick} className="relative text-gray-500 hover:text-gray-700" title="For You">
      <User className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-2 flex h-4 w-4">
          <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-blue-500 text-white text-[10px] font-bold">
            {count > 9 ? '9+' : count}
          </span>
        </span>
      )}
    </button>
  );
};

export default ForYouButton;
