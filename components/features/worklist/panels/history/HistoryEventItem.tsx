import React from 'react';
import { TemporalEvent } from '../../../../../types';
import { formatRelativeTime } from '../../../../../utils/formatters';
import {
  MessageSquare, Paperclip, Edit, BellRing, UserPlus, CheckSquare, Activity,
  ShieldCheck, FileBadge, FileText, GitBranch, Filter, Layers, Wand2
} from 'lucide-react';

interface HistoryEventItemProps {
  event: TemporalEvent;
  isChild?: boolean;
  isLastInGroup?: boolean;
}

const HistoryEventItem: React.FC<HistoryEventItemProps> = ({ event, isChild = false, isLastInGroup = false }) => {
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
    if (type.includes('filter')) return <Filter className={iconClass} />;
    if (type.includes('group')) return <Layers className={iconClass} />;
    
    return <Activity className={iconClass} />;
  };

  const getIconBgColor = () => {
    const type = event.eventType;
    if (type.includes('disposition') || type.includes('complete')) return 'bg-green-500';
    if (type.includes('auth_status_change') && event.details?.newValue === 'Denied') return 'bg-red-500';
    if (type.includes('eligibility') && event.details?.newValue === 'Inactive') return 'bg-red-500';
    if (type.includes('note') || type.includes('attachment')) return 'bg-blue-500';
    if (type.includes('reminder')) return 'bg-indigo-500';
    if (type.includes('ai')) return 'bg-purple-500';
    if (type.includes('assign') || type.includes('status')) return 'bg-yellow-500';

    return 'bg-gray-400';
  };

  return (
    <div className="relative pb-8">
      {!isLastInGroup && !isChild && <div className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />}
      <div className={`relative flex items-start gap-3 ${isChild ? 'ml-6' : ''}`}>
        {isChild && (
             <>
                {/* Horizontal line pointing to icon */}
                <div className="absolute left-[-1.5rem] top-4 h-px w-6 bg-gray-200" />
                {/* Vertical line connecting children */}
                {!isLastInGroup && <div className="absolute left-[-1.5rem] top-4 h-full w-px bg-gray-200" />}
             </>
        )}
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
          <div className="mt-1 text-xs text-gray-400">
            <span>{formatRelativeTime(event.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryEventItem;