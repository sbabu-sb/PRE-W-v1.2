import React from 'react';
import { CaseActivity } from '../../../../../types';
import { formatRelativeTime } from '../../../../../utils/formatters';
import { MessageSquare, Paperclip, Edit, BellRing } from 'lucide-react';

interface ActivityItemProps {
  activity: CaseActivity;
  isLastItem: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, isLastItem }) => {
  const getIcon = () => {
    const iconClass = "h-5 w-5 text-white";
    switch (activity.type) {
      case 'note_created':
        return <MessageSquare className={iconClass} />;
      case 'attachment_added':
        return <Paperclip className={iconClass} />;
      case 'note_edited':
        return <Edit className={iconClass} />;
      case 'reminder_created':
      case 'reminder_completed':
        return <BellRing className={iconClass} />;
      default:
        return <MessageSquare className={iconClass} />;
    }
  };

  const getIconBgColor = () => {
    switch (activity.type) {
      case 'note_created': return 'bg-blue-500';
      case 'attachment_added': return 'bg-green-500';
      case 'note_edited': return 'bg-yellow-500';
      case 'reminder_created': return 'bg-indigo-500';
      case 'reminder_completed': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const renderDetails = () => {
    switch (activity.type) {
      case 'note_created':
        return `added a note: "${activity.details.noteContent}"`;
      case 'attachment_added':
        return `added an attachment: "${activity.details.fileName}"`;
       case 'reminder_created':
        return `set a reminder: "${activity.details.title}" due on ${new Date(activity.details.dueAt).toLocaleDateString()}`;
       case 'reminder_completed':
        return `completed a reminder: "${activity.details.title}"`;
      default:
        return `performed an action.`;
    }
  };

  return (
    <li>
      <div className="relative pb-8">
        {!isLastItem ? (
          <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
        ) : null}
        <div className="relative flex items-start space-x-3">
          <div>
            <span className={`h-8 w-8 rounded-full flex items-center justify-center ${getIconBgColor()}`}>
              {getIcon()}
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-1.5">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{activity.actorName}</span>{' '}
              {renderDetails()}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {formatRelativeTime(activity.occurredAt)}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
};

export default ActivityItem;