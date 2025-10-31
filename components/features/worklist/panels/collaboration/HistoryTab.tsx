import React, { useMemo } from 'react';
import { TemporalEvent } from '../../../../../types';
import HistoryEventItem from '../history/HistoryEventItem';
import HistoryThreadItem from '../history/HistoryThreadItem';

interface HistoryTabProps {
  history: TemporalEvent[];
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const groupedHistory = useMemo(() => {
    if (!history) return [];

    return history.reduce((acc, event) => {
      const eventDate = new Date(event.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupName = eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (eventDate.toDateString() === today.toDateString()) {
        groupName = 'Today';
      } else if (eventDate.toDateString() === yesterday.toDateString()) {
        groupName = 'Yesterday';
      }

      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(event);
      return acc;
    }, {} as Record<string, TemporalEvent[]>);
  }, [history]);

  const orderedGroups = Object.keys(groupedHistory).sort((a, b) => {
    const dateA = a === 'Today' ? new Date() : a === 'Yesterday' ? new Date(Date.now() - 86400000) : new Date(a);
    const dateB = b === 'Today' ? new Date() : b === 'Yesterday' ? new Date(Date.now() - 86400000) : new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="h-full overflow-y-auto pr-2">
      {history.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No history recorded for this case.</p>
      ) : (
        <div className="space-y-6">
          {orderedGroups.map(groupName => (
            <div key={groupName}>
              <h4 className="font-semibold text-sm text-gray-500 mb-3">{groupName}</h4>
              <div className="flow-root">
                <ul className="-mb-8">
                  {groupedHistory[groupName].map((event, index) => (
                    <li key={event.id}>
                      {event.eventType === 'thread_summary' ? (
                        <HistoryThreadItem event={event} isLastInGroup={index === groupedHistory[groupName].length - 1} />
                      ) : (
                        <HistoryEventItem event={event} isLastInGroup={index === groupedHistory[groupName].length - 1} />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
