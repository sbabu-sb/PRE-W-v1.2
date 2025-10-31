import React from 'react';
import { TemporalEvent } from '../../../../../types';
import { formatRelativeTime } from '../../../../../utils/formatters';
import {
  MessageSquare, Paperclip, Edit, BellRing, UserPlus, CheckSquare, Activity,
  ShieldCheck, FileBadge, FileText, Wand2, TrendingUp, Lightbulb
} from 'lucide-react';
import Chip from '../../../../common/Chip';

interface GlobalHistoryEventItemProps {
  event: TemporalEvent;
}

const GlobalHistoryEventItem: React.FC<GlobalHistoryEventItemProps> = ({ event }) => {
  const isHighSignal = (event.gtasScore ?? 0) >= 80;

  const getIcon = () => {
    const iconClass = "h-4 w-4 text-white";
    const type = event.eventType;

    if (type.includes('note')) return <MessageSquare className={iconClass} />;
    if (type.includes('attachment')) return <Paperclip className={iconClass} />;
    if (type.includes('reminder')) return <BellRing className={iconClass} />;
    if (type.includes('assign')) return <UserPlus className={iconClass} />;
    if (type.includes('disposition') || type.includes('status_change')) return <CheckSquare className={iconClass} />;
    if (type.includes('eligibility')) return <ShieldCheck className={iconClass} />;
    if (type.includes('auth')) return <FileBadge className={iconClass} />;
    if (type.includes('estimate')) return <FileText className={iconClass} />;
    if (type.includes('field_edit')) return <Edit className={iconClass} />;
    if (type.includes('ai')) return <Wand2 className={iconClass} />;
    
    return <Activity className={iconClass} />;
  };

  const getIconBgColor = () => {
    if (isHighSignal) return 'bg-red-500';
    const type = event.eventType;
    if (type.includes('note') || type.includes('attachment')) return 'bg-blue-500';
    if (type.includes('reminder')) return 'bg-indigo-500';
    if (type.includes('assign') || type.includes('status')) return 'bg-yellow-500';

    return 'bg-gray-400';
  };

  return (
    <div className={`relative flex items-start gap-4 p-3 hover:bg-slate-100 rounded-md ${isHighSignal ? 'bg-red-50/50' : ''}`}>
      <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full z-10" style={{ backgroundColor: getIconBgColor() }}>
        {getIcon()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm">
          <p className="m-0">
            <span className="font-semibold text-gray-900">{event.actorName}</span>
            <span className="text-gray-600"> {event.description}</span>
          </p>
        </div>
        <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>Case: <span className="font-medium text-gray-700">{event.caseId}</span> ({event.patientName})</span>
            <span className="text-gray-300">|</span>
            <span>{formatRelativeTime(event.timestamp)}</span>
            {event.gtasScore && (
                <>
                    <span className="text-gray-300">|</span>
                    <Chip tone={isHighSignal ? 'danger' : 'neutral'}>
                        <TrendingUp className="h-3 w-3" />
                        GTSA Score: {event.gtasScore}
                    </Chip>
                </>
            )}
        </div>
         {isHighSignal && event.explanation && (
            <div className="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 text-xs text-yellow-800 rounded-r-md">
                <p className="font-semibold flex items-center gap-1.5"><Lightbulb className="h-3 w-3" />Why this matters:</p>
                <p>{event.explanation}</p>
                {event.impactCategory && <Chip tone="warn">{event.impactCategory}</Chip>}
            </div>
        )}
      </div>
    </div>
  );
};

export default GlobalHistoryEventItem;