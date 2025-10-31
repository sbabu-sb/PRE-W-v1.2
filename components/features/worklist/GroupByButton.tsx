import React from 'react';
import { Layers, X } from 'lucide-react';
import { SortKey } from '../../../types';
import { worklistColumnMetadata } from '../../../data/columnMetadata';

interface GroupByButtonProps {
    groupingPath: SortKey[];
    onClick: () => void;
    onClear: () => void;
}

const GroupByButton: React.FC<GroupByButtonProps> = ({ groupingPath, onClick, onClear }) => {
    const hasGrouping = groupingPath.length > 0;

    const getPathName = () => {
        return groupingPath
            .map(key => worklistColumnMetadata.find(c => c.id === key)?.name || key)
            .join(' → ');
    };

    return (
        <div className="relative">
            <button
                onClick={onClick}
                className={`flex items-center space-x-2 text-sm font-semibold h-10 px-4 rounded-md border transition-colors ${
                    hasGrouping 
                        ? 'bg-blue-50 border-blue-300 text-blue-700 pr-10' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
                <Layers className="h-4 w-4 text-gray-500" />
                <span>{hasGrouping ? `Group by: ${getPathName()}` : 'Group by +'}</span>
            </button>
            {hasGrouping && (
                <button
                    onClick={(e) => { e.stopPropagation(); onClear(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-blue-600 hover:bg-blue-200"
                    title="Clear grouping"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default GroupByButton;
