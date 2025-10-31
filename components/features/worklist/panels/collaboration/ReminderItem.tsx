import React, { useMemo } from 'react';
import { CaseReminder, ReminderStatus } from '../../../../../types';
import { formatRelativeTime } from '../../../../../utils/formatters';
import { User, Clock } from 'lucide-react';

interface ReminderItemProps {
    reminder: CaseReminder;
    onUpdateStatus: (reminderId: string, status: ReminderStatus) => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onUpdateStatus }) => {

    const { sla, slaStyle } = useMemo(() => {
        if (reminder.status === 'completed') {
            return { sla: 'Completed', slaStyle: 'text-gray-500 bg-gray-100 border-gray-300' };
        }
        const now = new Date().getTime();
        const due = new Date(reminder.dueAt).getTime();
        const diffHours = (due - now) / (1000 * 60 * 60);

        if (diffHours < 0) {
            return { sla: 'Overdue', slaStyle: 'text-red-700 bg-red-50 border-red-400' };
        }
        if (diffHours <= 4) {
            return { sla: 'Due very soon', slaStyle: 'text-orange-700 bg-orange-50 border-orange-400' };
        }
        if (diffHours <= 24) {
            return { sla: 'Due soon', slaStyle: 'text-yellow-700 bg-yellow-50 border-yellow-400' };
        }
        return { sla: `Due in ${Math.floor(diffHours / 24)}d`, slaStyle: 'text-gray-700 bg-gray-100 border-gray-300' };
    }, [reminder.status, reminder.dueAt]);

    const handleToggleComplete = () => {
        onUpdateStatus(reminder.id, reminder.status === 'completed' ? 'pending' : 'completed');
    };

    const priorityStyles = {
        low: 'border-gray-300',
        medium: 'border-yellow-400',
        high: 'border-orange-500',
        critical: 'border-red-500'
    };
    
    const getSlaColorClass = () => {
        if (reminder.status === 'completed') return 'border-l-gray-300 bg-gray-50/50';
        const now = new Date().getTime();
        const due = new Date(reminder.dueAt).getTime();
        const diffHours = (due - now) / (1000 * 60 * 60);

        if (diffHours < 0) return 'border-l-red-500 bg-red-50/30';
        if (diffHours <= 4) return 'border-l-orange-500 bg-orange-50/30';
        if (diffHours <= 24) return 'border-l-yellow-400 bg-yellow-50/30';
        return 'border-l-gray-300 bg-white';
    };


    return (
        <div className={`flex items-start gap-3 p-3 rounded-md border border-l-4 ${getSlaColorClass()}`}>
            <input
                type="checkbox"
                checked={reminder.status === 'completed'}
                onChange={handleToggleComplete}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
                <p className={`text-sm font-semibold text-gray-800 ${reminder.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {reminder.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(reminder.dueAt).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {reminder.assignedToName || 'Unassigned'}</span>
                </div>
                <div className="mt-2">
                     <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${slaStyle}`}>
                        {sla}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ReminderItem;