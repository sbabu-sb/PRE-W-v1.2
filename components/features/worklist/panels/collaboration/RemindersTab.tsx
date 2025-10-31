import React, { useState, useMemo } from 'react';
import { CaseReminder, ReminderStatus } from '../../../../../types';
import { PlusCircle } from 'lucide-react';
import ReminderForm from './ReminderForm';
import ReminderItem from './ReminderItem';

interface RemindersTabProps {
  reminders: CaseReminder[];
  onAddReminder: (data: Omit<CaseReminder, 'id' | 'caseId' | 'createdAt' | 'createdById' | 'createdByName' | 'status' | 'auditTrail'>) => void;
  onUpdateReminderStatus: (reminderId: string, status: ReminderStatus) => void;
}

type ReminderFilter = 'all' | 'mine' | 'overdue' | 'completed';

const FilterButton: React.FC<{
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-2.5 py-1 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
            isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
    >
        {label}
        {count > 0 && <span className={`text-xs rounded-full px-1.5 py-0.5 ${isActive ? 'bg-blue-400' : 'bg-gray-300'}`}>{count}</span>}
    </button>
);


const RemindersTab: React.FC<RemindersTabProps> = ({ reminders, onAddReminder, onUpdateReminderStatus }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<ReminderFilter>('all');
  
  const handleSave = (data: Omit<CaseReminder, 'id' | 'caseId' | 'createdAt' | 'createdById' | 'createdByName' | 'status' | 'auditTrail'>) => {
    onAddReminder(data);
    setIsAdding(false);
  };
  
  const filteredReminders = useMemo(() => {
      const now = new Date().getTime();
      return reminders.filter(r => {
          switch (filter) {
              case 'mine':
                  return r.assignedToName === 'Maria Garcia'; // Assume current user
              case 'overdue':
                  return r.status !== 'completed' && new Date(r.dueAt).getTime() < now;
              case 'completed':
                  return r.status === 'completed';
              case 'all':
              default:
                  return true;
          }
      });
  }, [reminders, filter]);

  const counts = useMemo(() => {
    const now = new Date().getTime();
    return {
        all: reminders.length,
        mine: reminders.filter(r => r.assignedToName === 'Maria Garcia').length,
        overdue: reminders.filter(r => r.status !== 'completed' && new Date(r.dueAt).getTime() < now).length,
        completed: reminders.filter(r => r.status === 'completed').length,
    }
  }, [reminders]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="font-semibold">Add Reminder</span>
          </button>
        )}
        {isAdding && (
          <ReminderForm onSave={handleSave} onCancel={() => setIsAdding(false)} />
        )}

        <div className="flex flex-wrap gap-2">
            <FilterButton label="All" count={counts.all} isActive={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterButton label="Mine" count={counts.mine} isActive={filter === 'mine'} onClick={() => setFilter('mine')} />
            <FilterButton label="Overdue" count={counts.overdue} isActive={filter === 'overdue'} onClick={() => setFilter('overdue')} />
            <FilterButton label="Completed" count={counts.completed} isActive={filter === 'completed'} onClick={() => setFilter('completed')} />
        </div>

        {filteredReminders.length > 0 ? (
          <div className="space-y-2">
              {filteredReminders.map(reminder => (
                <ReminderItem key={reminder.id} reminder={reminder} onUpdateStatus={onUpdateReminderStatus} />
              ))}
          </div>
        ) : (
             <p className="text-center text-gray-500 pt-8">
                {reminders.length === 0 ? 'No reminders for this case yet.' : 'No reminders match the current filter.'}
            </p>
        )}
      </div>
    </div>
  );
};

export default RemindersTab;