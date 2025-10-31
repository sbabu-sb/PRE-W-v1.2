import React, { useMemo } from 'react';
import { RankedCase } from '../../../../types';
import DrawerPanel from '../../../common/DrawerPanel';
import ForYouCaseItem from './discovery/ForYouCaseItem';
import { ChevronDown } from 'lucide-react';

interface ForYouPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rankedCases: RankedCase[];
  onOpenCase: (caseId: string) => void;
}

const ForYouPanel: React.FC<ForYouPanelProps> = ({ isOpen, onClose, rankedCases, onOpenCase }) => {
  const { highPriorityCases, maybeLaterCases } = useMemo(() => {
    const highPriority: RankedCase[] = [];
    const maybeLater: RankedCase[] = [];

    rankedCases.forEach(item => {
      if (item.relevanceScore >= 40) {
        highPriority.push(item);
      } else {
        maybeLater.push(item);
      }
    });

    return { highPriorityCases: highPriority, maybeLaterCases: maybeLater };
  }, [rankedCases]);

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title="For You"
      subtitle="Ranked by urgency, SLA, and your role"
    >
      {rankedCases.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No active work assigned to you.</p>
      ) : (
        <div className="space-y-6">
          {highPriorityCases.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-500 mb-2">Ranked by urgency</h4>
              <div className="space-y-2">
                {highPriorityCases.map(item => (
                  <ForYouCaseItem key={item.caseId} item={item} onOpenCase={onOpenCase} />
                ))}
              </div>
            </div>
          )}
          
          {maybeLaterCases.length > 0 && (
            <details className="group">
              <summary className="list-none flex items-center justify-between cursor-pointer">
                <h4 className="font-semibold text-sm text-gray-500">Maybe Later</h4>
                <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-2 space-y-2">
                {maybeLaterCases.map(item => (
                  <ForYouCaseItem key={item.caseId} item={item} onOpenCase={onOpenCase} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </DrawerPanel>
  );
};

export default ForYouPanel;