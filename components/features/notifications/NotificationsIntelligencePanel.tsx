import React, { useState, useMemo, useEffect } from 'react';
import { X, MoreVertical } from 'lucide-react';
import { Notification, NotificationsIntelligencePanelProps, ActiveNotificationTab } from '../../../types';
import NotificationItem from './NotificationItem';

const NotificationsIntelligencePanel: React.FC<NotificationsIntelligencePanelProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveNotificationTab>('direct');
  const [showUnreadOnly, setShowUnreadOnly] = useState(true);

  useEffect(() => {
    if (isOpen) {
        const findMostRecent = (arr: Notification[]) => {
            if (!arr || arr.length === 0) return null;
            return arr.reduce((latest, current) => 
                new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
            );
        };

        const mostRecentDirect = findMostRecent(notifications.direct.filter(n => !n.isRead));
        const mostRecentWatching = findMostRecent(notifications.watching.filter(n => !n.isRead));

        if (!mostRecentDirect && mostRecentWatching) {
            setActiveTab('watching');
        } else if (mostRecentDirect && mostRecentWatching) {
            if (new Date(mostRecentWatching.timestamp) > new Date(mostRecentDirect.timestamp)) {
                setActiveTab('watching');
            } else {
                setActiveTab('direct');
            }
        } else {
            // Default to 'direct' if only it has items, or if both are empty
            setActiveTab('direct');
        }
    }
  }, [isOpen, notifications]);


  const displayedNotifications = useMemo(() => {
    let items = notifications[activeTab] || [];
    if (showUnreadOnly) {
      return items.filter(n => !n.isRead);
    }
    return items;
  }, [notifications, activeTab, showUnreadOnly]);

  const topItems = useMemo(() => displayedNotifications.filter(n => n.layout === 'top'), [displayedNotifications]);
  const secondaryItems = useMemo(() => displayedNotifications.filter(n => n.layout === 'secondary'), [displayedNotifications]);
  const bundleItems = useMemo(() => displayedNotifications.filter(n => n.layout === 'bundle'), [displayedNotifications]);

  const renderSection = (title: string, items: Notification[]) => {
      if (items.length === 0) return null;
      return (
          <div className="pt-4">
              <h3 className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
              <ul className="divide-y divide-gray-200">
                  {items.map(notification => (
                      <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={() => onMarkAsRead(notification.id)}
                          onDismiss={() => onDismiss(notification.id)}
                      />
                  ))}
              </ul>
          </div>
      );
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 pt-16 bg-slate-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: 'clamp(320px, 20vw, 480px)' }}
      >
        {/* Header */}
        <header className="flex-shrink-0 bg-white p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 id="notifications-title" className="text-lg font-bold text-gray-900">Notifications</h2>
            <div className="flex items-center gap-2">
              <button onClick={onMarkAllAsRead} className="text-xs font-semibold text-blue-600 hover:underline">Mark all read</button>
              <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"><MoreVertical className="h-5 w-5" /></button>
              <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800" aria-label="Close notifications panel"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4 border-b w-full">
                <TabButton name="Direct" isActive={activeTab === 'direct'} onClick={() => setActiveTab('direct')} />
                <TabButton name="Watching" isActive={activeTab === 'watching'} onClick={() => setActiveTab('watching')} />
                <TabButton name="AI Boost" isActive={activeTab === 'ai_boost'} onClick={() => setActiveTab('ai_boost')} />
            </div>
            <div className="flex-shrink-0 ml-4">
                <label className="flex items-center cursor-pointer">
                    <span className="text-sm font-medium text-gray-600 mr-2">Unread only</span>
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={showUnreadOnly} onChange={() => setShowUnreadOnly(!showUnreadOnly)} />
                        <div className={`block w-10 h-6 rounded-full transition ${showUnreadOnly ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showUnreadOnly ? 'translate-x-4' : ''}`}></div>
                    </div>
                </label>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
            {displayedNotifications.length > 0 ? (
                <div>
                    {renderSection('Top Priority', topItems)}
                    {renderSection('Next Up', secondaryItems)}
                    {renderSection('Recent Activity', bundleItems)}
                </div>
            ) : (
                 <div className="text-center py-16 px-6">
                    <p className="font-semibold text-gray-700">
                        {activeTab === 'ai_boost' ? 'Gemini is watching your worklist.' : 'All caught up!'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeTab === 'ai_boost' ? 'No high-impact items yet.' : 'There are no new notifications.'}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{name: string, isActive: boolean, onClick: () => void}> = ({ name, isActive, onClick }) => (
    <button onClick={onClick} className={`py-2 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
        {name}
    </button>
);


export default NotificationsIntelligencePanel;