import React from 'react';
import { X, Edit2 } from 'lucide-react';
import { FilterObject } from '../../../../types';

interface ActiveFilterItemProps {
  filter: FilterObject;
  onEdit: () => void;
  onRemove: () => void;
}

const ActiveFilterItem: React.FC<ActiveFilterItemProps> = ({ filter, onEdit, onRemove }) => {
    // A function to create a readable summary of the filter
    const getFilterSummary = () => {
        const conditionText = filter.condition.replace(/-/g, ' ');
        let valueText = '';
        if (filter.values && filter.values.length > 0) {
            valueText = filter.values.length > 1 ? `[${filter.values.length} items]` : `"${filter.values[0]}"`;
        } else if (filter.condition === 'between') {
            valueText = `${filter.value} and ${filter.value2}`;
        } else if (filter.value){
            valueText = `"${filter.value}"`;
        }

        if (['is-empty', 'is-not-empty'].includes(filter.condition)) {
            return `${conditionText}`;
        }
        return `${conditionText} ${valueText}`;
    };

    return (
        <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500">{filter.fieldName}</span>
                <span className="text-sm text-gray-800">{getFilterSummary()}</span>
            </div>
            <div className="flex items-center space-x-1">
                <button onClick={onEdit} className="p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-800" title="Edit Filter"><Edit2 className="h-3 w-3" /></button>
                <button onClick={onRemove} className="p-1.5 rounded text-gray-500 hover:bg-red-100 hover:text-red-600" title="Remove Filter"><X className="h-4 w-4" /></button>
            </div>
        </div>
    );
};
export default ActiveFilterItem;
