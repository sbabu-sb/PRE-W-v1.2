import React, { useMemo, useState } from 'react';
import { TemporalEvent } from '../../../../types';
import DrawerPanel from '../../../common/DrawerPanel';
import GlobalHistoryEventItem from './history/GlobalHistoryEventItem';
import { Loader } from 'lucide-react';

interface GlobalHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: TemporalEvent[];
}

const GlobalHistoryPanel: React.FC<GlobalHistoryPanelProps> = ({ isOpen, onClose, history }) => {
  const [highSignalOnly, setHighSignalOnly] = useState(true);

  const { highSignalItems, recentActivityItems } = useMemo(() => {
    const highSignal: TemporalEvent[] = [];
    const recent: TemporalEvent[] = [];
    history.forEach(event => {
      if ((event.gtasScore ?? 0) >= 80) {
        highSignal.push(event);
      } else {
        recent.push(event);
      }
    });
    return { highSignalItems: highSignal, recentActivityItems: recent };
  }, [history]);

  const displayedRecentActivity = highSignalOnly ? [] : recentActivityItems;

  const renderSection = (title: string, items: TemporalEvent[]) => {
      if (items.length === 0) return null;
      return (
          <div className="pt-4">
              <h3 className="px-1 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
              <div className="space-y-1 bg-white p-2 rounded-md border">
                  {items.map(event => (
                      <GlobalHistoryEventItem key={event.id} event={event} />
                  ))}
              </div>
          </div>
      );
  };

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title="Global History Feed" subtitle="Real-time events across all cases">
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <label className="flex items-center cursor-pointer">
                <span className="text-sm font-medium text-gray-600 mr-2">High-signal only</span>
                <div className="relative">
                    <input type="checkbox" className="sr-only" checked={highSignalOnly} onChange={() => setHighSignalOnly(!highSignalOnly)} />
                    <div className={`block w-10 h-6 rounded-full transition ${highSignalOnly ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${highSignalOnly ? 'translate-x-4' : ''}`}></div>
                </div>
            </label>
            {/* TODO: Add Search, Filter, Sort controls */}
        </div>

      {history.length === 0 ? (
        <div className="text-center py-16 px-6">
            <Loader className="h-8 w-8 mx-auto animate-spin text-gray-400" />
            <p className="font-semibold text-gray-700 mt-4">Listening for events...</p>
            <p className="text-sm text-gray-500 mt-1">
                As actions are taken across the worklist, they will appear here in real-time.
            </p>
        </div>
      ) : (
        <div className="space-y-6">
            {renderSection('High-Signal Events', highSignalItems)}
            {renderSection('Recent Activity', displayedRecentActivity)}
            {highSignalOnly && recentActivityItems.length > 0 && (
                <div className="text-center mt-6">
                    <button onClick={() => setHighSignalOnly(false)} className="text-sm font-semibold text-blue-600 hover:underline">
                        Show {recentActivityItems.length} lower-signal events
                    </button>
                </div>
            )}
            {(highSignalItems.length === 0 && displayedRecentActivity.length === 0) && (
                <p className="text-center text-gray-500 py-8">No events match the current filter.</p>
            )}
        </>
      )}
    </DrawerPanel>
  );
};

export default GlobalHistoryPanel;