
import React from 'react';
import { JourneyGap } from '../../../types';
import { Hourglass } from 'lucide-react';

interface JourneyGapCardProps {
    gap: JourneyGap;
}

const JourneyGapCard: React.FC<JourneyGapCardProps> = ({ gap }) => {
    return (
        <div className="relative flex items-start gap-4">
            <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full z-10 bg-yellow-100 text-yellow-600">
                <Hourglass className="h-5 w-5" />
            </div>
            <div className="ml-12 w-full">
                <div className="p-4 rounded-lg border border-dashed border-yellow-400 bg-yellow-50">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800">
                                Journey Gap
                            </span>
                            <p className="text-sm font-semibold text-yellow-900 mt-1">{gap.description}</p>
                        </div>
                        <span className="text-sm font-bold text-yellow-700 flex-shrink-0 ml-4">{gap.durationHours} hours</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JourneyGapCard;
