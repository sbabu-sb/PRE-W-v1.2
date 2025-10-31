import React from 'react';
import { RankedCase } from '../../../../../types';
import Chip from '../../../../common/Chip';
import { Bell, Clock, BrainCircuit, Sparkles } from 'lucide-react';

interface ForYouCaseItemProps {
  item: RankedCase;
  onOpenCase: (caseId: string) => void;
}

const PersonalizationChip: React.FC<{ signal: string }> = ({ signal }) => {
    let icon = <Sparkles className="h-3 w-3" />;
    let text = signal;
    let tone: 'info' | 'warn' | 'success' | 'danger' | 'neutral' = 'info';

    if (signal.includes('role')) {
        icon = <BrainCircuit className="h-3 w-3" />;
        text = signal.replace('-focus role', '');
        tone = 'success';
    } else if (signal.includes('Matches recent work')) {
        text = signal.replace('Matches recent work (', '').replace(')', '');
        tone = 'neutral';
    }

    return (
        <Chip tone={tone}>
            {icon}
            <span className="capitalize">{text}</span>
        </Chip>
    );
};


const ForYouCaseItem: React.FC<ForYouCaseItemProps> = ({ item, onOpenCase }) => {
    const personalizationSignal = item.personalizationSignals?.[0];
    const primaryReason = item.explanation.find(e => e !== 'You touched') || 'Uncategorized';
    const hasActivity = item.explanation.includes('You touched');
  
    const getChipTone = (reason: string) => {
        if (reason.includes('DOS') || reason.includes('Auth')) return 'danger';
        if (reason.includes('Value') || reason.includes('Blocked')) return 'warn';
        return 'info';
    }

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
            <div className="flex items-center gap-2">
                {personalizationSignal ? (
                    <PersonalizationChip signal={personalizationSignal} />
                ) : (
                    <Chip tone={getChipTone(primaryReason)}>{primaryReason}</Chip>
                )}
            </div>
        </div>
        {(hasActivity || item.isNotified || item.isReminder) && (
            <div className="mt-2 flex items-center justify-end gap-3">
                {hasActivity && <Chip tone="neutral">You touched</Chip>}
                <div className="flex items-center gap-2 text-gray-400">
                    {item.isNotified && <Bell className="h-4 w-4 text-yellow-600" title="Also has a critical notification" />}
                    {item.isReminder && <Clock className="h-4 w-4 text-indigo-600" title="Has an active reminder" />}
                </div>
            </div>
        )}
        </div>
    );
};

export default ForYouCaseItem;