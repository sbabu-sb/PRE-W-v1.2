import React from 'react';
import { Notification } from '../../../types';
import { formatRelativeTime } from '../../../utils/formatters';
import { ShieldAlert, BarChart2, FileWarning, AlertTriangle, Wand2, Archive, X, Info, ChevronRight } from 'lucide-react';
import Chip from '../../common/Chip';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDismiss: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onDismiss }) => {
  const getIcon = () => {
    const iconClass = "h-5 w-5 flex-shrink-0";
    if (notification.isBundled) return <Archive className={`${iconClass} text-blue-500`} />;
    switch (notification.type) {
      case 'eligibility_change': return <ShieldAlert className={`${iconClass} text-blue-500`} />;
      case 'auth_expired':
      case 'auth_expiring':
      case 'auth_missing': return <FileWarning className={`${iconClass} text-orange-500`} />;
      case 'high_denial_risk': return <BarChart2 className={`${iconClass} text-red-500`} />;
      case 'submission_failed': return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
      case 'ai_recommendation': return <Wand2 className={`${iconClass} text-purple-500`} />;
      default: return <AlertTriangle className={`${iconClass} text-gray-500`} />;
    }
  };

  const priorityStyles = {
    critical: 'border-l-4 border-red-500',
    high: 'border-l-4 border-orange-500',
    medium: 'border-l-4 border-yellow-500',
    low: 'border-l-4 border-gray-300',
  };

  const isDetailed = notification.layout === 'top' || notification.ai?.explanation;

  return (
    <li
      onClick={onMarkAsRead}
      className={`group relative bg-white hover:bg-gray-50/70 transition-colors cursor-pointer flex gap-4 ${notification.isRead ? 'opacity-70' : ''} ${priorityStyles[notification.priority]}`}
    >
      <div className="p-4 flex gap-4 flex-1">
        <div className="mt-1">{getIcon()}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm text-gray-800 pr-8">{notification.title}</h4>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatRelativeTime(notification.timestamp)}</span>
          </div>
          
          <p className={`text-sm text-gray-600 mt-1 ${!isDetailed ? 'truncate' : ''}`}>
            {notification.description}
          </p>
          
          {notification.metadata.synthetic && <Chip tone='info'>Simulated</Chip>}

          {notification.isBundled && notification.bundledItems && (
              <div className="mt-2 text-xs text-gray-500 border-l-2 border-gray-200 pl-2 space-y-0.5">
                  {notification.bundledItems.slice(0, 3).map(item => (
                      <p key={item.id} className="truncate"> - {item.patientName} ({item.caseId})</p>
                  ))}
                  {notification.bundledItems.length > 3 && <p>...and {notification.bundledItems.length - 3} more.</p>}
              </div>
          )}

          {isDetailed && notification.ai?.explanation && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                <h5 className="flex items-center text-xs font-bold text-purple-800">
                    <Wand2 className="h-4 w-4 mr-1.5" />
                    GEMINI INSIGHT
                </h5>
                <p className="text-xs text-purple-900 mt-1">{notification.ai.explanation}</p>
            </div>
          )}
          
          <div className="mt-3 flex flex-wrap gap-2">
              {notification.actions.map(action => (
                  <button 
                      key={action.label} 
                      onClick={(e) => { e.stopPropagation(); alert(`Action: ${action.label}`); }}
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition ${action.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                      {action.label}
                      {action.primary && <ChevronRight className="h-3 w-3"/>}
                  </button>
              ))}
          </div>
        </div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
};

export default NotificationItem;