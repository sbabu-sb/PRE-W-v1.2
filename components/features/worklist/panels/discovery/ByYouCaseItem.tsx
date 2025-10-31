import React from 'react';
import { RankedCase } from '../../../../../types';
import { formatRelativeTime } from '../../../../../utils/formatters';

interface ByYouCaseItemProps {
  item: RankedCase;
  onOpenCase: (caseId: string) => void;
}

const ByYouCaseItem: React.FC<ByYouCaseItemProps> = ({ item, onOpenCase }) => {
  return (
    <div
      onClick={() => onOpenCase(item.caseId)}
      className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-800">{item.patientName}</p>
          <p className="text-xs text-gray-500">{item.caseId}</p>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            {formatRelativeTime(item.lastInteraction!)}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{item.lastAction}</p>
    </div>
  );
};

export default ByYouCaseItem;
