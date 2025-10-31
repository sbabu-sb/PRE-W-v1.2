import React from 'react';
import { Filter } from 'lucide-react';

interface FilterButtonProps {
  activeCount: number;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ activeCount, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center space-x-2 text-sm font-semibold text-gray-700 h-10 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50 relative"
    title="Filter this view"
  >
    <Filter className="h-4 w-4 text-gray-500" />
    <span>Filter</span>
    {activeCount > 0 && (
      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">
        {activeCount}
      </span>
    )}
  </button>
);

export default FilterButton;
