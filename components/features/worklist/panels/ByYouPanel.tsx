import React, { useMemo } from 'react';
import { RankedCase } from '../../../../types';
import DrawerPanel from '../../../common/DrawerPanel';
import ByYouCaseItem from './discovery/ByYouCaseItem';

interface ByYouPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activityCases: RankedCase[];
  onOpenCase: (caseId: string) => void;
}

const ByYouPanel: React.FC<ByYouPanelProps> = ({ isOpen, onClose, activityCases, onOpenCase }) => {
  const groupedCases = useMemo(() => {
    const groups: Record<string, RankedCase[]> = {
      Today: [],
      'This Week': [],
      'Last 30 Days': [],
      'Older': [],
    };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    activityCases.forEach(item => {
      const interactionDate = new Date(item.lastInteraction!);
      if (interactionDate >= today) {
        groups.Today.push(item);
      } else if (interactionDate >= lastWeek) {
        groups['This Week'].push(item);
      } else if (interactionDate >= lastMonth) {
        groups['Last 30 Days'].push(item);
      } else {
        groups['Older'].push(item);
      }
    });
    return groups;
  }, [activityCases]);

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title="By You"
      subtitle="Cases you touched, created, or were tagged in"
    >
      {activityCases.length === 0 ? (
        <p className="text-center text-gray-500 py-8">You haven't interacted with any cases yet.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCases).map(([groupName, items]: [string, RankedCase[]]) =>
            // FIX: Explicitly typed `items` as `RankedCase[]` to resolve 'unknown' type error.
            items.length > 0 ? (
              <div key={groupName}>
                <h4 className="font-semibold text-sm text-gray-500 mb-2">{groupName}</h4>
                <div className="space-y-2">
                  {/* FIX: `items` is now correctly typed, allowing `.map` to be called. */}
                  {items.map(item => (
                    <ByYouCaseItem key={item.caseId} item={item} onOpenCase={onOpenCase} />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </DrawerPanel>
  );
};

export default ByYouPanel;