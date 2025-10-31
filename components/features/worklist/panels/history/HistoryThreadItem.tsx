import React, { useState } from 'react';
import { TemporalEvent } from '../../../../../types';
import { ChevronDown, ChevronRight, GitBranch } from 'lucide-react';
import HistoryEventItem from './HistoryEventItem';

interface HistoryThreadItemProps {
    event: TemporalEvent;
    isLastInGroup: boolean;
}

const HistoryThreadItem: React.FC<HistoryThreadItemProps> = ({ event, isLastInGroup }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!event.childEvents || event.childEvents.length === 0) {
        return <HistoryEventItem event={event} isLastInGroup={isLastInGroup} />;
    }

    return (
        <div className="relative pb-8">
             {/* Main timeline line */}
            {!isLastInGroup && <div className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />}
            
            {/* Main summary item */}
            <div className="relative flex items-start gap-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full z-10 bg-blue-500">
                    <GitBranch className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm">
                        <p className="m-0 font-semibold text-gray-900">{event.description}</p>
                    </div>
                    <div className="mt-1 text-xs text-blue-600 font-semibold flex items-center">
                        {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                    </div>
                </div>
            </div>

            {/* Expanded child items */}
            {isExpanded && (
                <div className="mt-4 pl-6 space-y-0 animate-fade-in">
                    {event.childEvents.map((childEvent, index) => (
                         <HistoryEventItem
                            key={childEvent.id}
                            event={childEvent}
                            isChild={true}
                            isLastInGroup={index === event.childEvents!.length - 1}
                         />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryThreadItem;
