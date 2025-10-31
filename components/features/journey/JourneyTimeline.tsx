import React from 'react';
import { JourneyEvent, JourneyGap } from '../../../types';
import JourneyEventCard from './JourneyEventCard';
import JourneyGapCard from './JourneyGapCard';

interface JourneyTimelineProps {
  items: (JourneyEvent | JourneyGap)[];
}

const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* The timeline spine */}
      <div className="absolute left-4 top-4 h-full w-0.5 bg-slate-300" />
      
      <div className="space-y-8">
        {items.map((item) => {
            if ('durationHours' in item) {
                return <JourneyGapCard key={item.id} gap={item as JourneyGap} />;
            }
            return <JourneyEventCard key={(item as JourneyEvent).id} event={item as JourneyEvent} />;
        })}
      </div>
    </div>
  );
};

export default JourneyTimeline;
