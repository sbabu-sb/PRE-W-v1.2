import React, { useState } from 'react';
import { CaseReminder } from '../../../../../types';
import InputField from '../../../../common/InputField';
import SelectField from '../../../../common/SelectField';
import { mentionableUsers } from '../../../../../data/collaborationData';

interface ReminderFormProps {
  onSave: (data: Omit<CaseReminder, 'id' | 'caseId' | 'createdAt' | 'createdById' | 'createdByName' | 'status' | 'auditTrail'>) => void;
  onCancel: () => void;
  relatedNoteId?: string;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ onSave, onCancel, relatedNoteId }) => {
  const [title, setTitle] = useState('');
  const [dueAtDate, setDueAtDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueAtTime, setDueAtTime] = useState('09:00');
  const [assignedToName, setAssignedToName] = useState('Maria Garcia'); // Default to 'Me'
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueAtDate || !dueAtTime) {
      alert('Please fill out all fields.');
      return;
    }
    const dueAt = new Date(`${dueAtDate}T${dueAtTime}`).toISOString();
    onSave({
      relatedNoteId,
      title,
      dueAt,
      assignedToName,
      priority,
      source: 'action_menu',
      visibility: 'team',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
      <InputField
        label="What needs to be done?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="e.g., Call payer for auth status"
        required
        autoFocus
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Due Date"
          type="date"
          value={dueAtDate}
          onChange={e => setDueAtDate(e.target.value)}
          required
        />
        <InputField
          label="Due Time"
          type="time"
          value={dueAtTime}
          onChange={e => setDueAtTime(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Assign To"
          value={assignedToName}
          onChange={e => setAssignedToName(e.target.value)}
        >
          {mentionableUsers.map(user => (
            <option key={user.id} value={user.name}>{user.name}</option>
          ))}
        </SelectField>
        <SelectField
          label="Priority"
          value={priority}
          onChange={e => setPriority(e.target.value as any)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </SelectField>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-gray-200">
          Cancel
        </button>
        <button type="submit" className="px-3 py-1.5 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700">
          Save Reminder
        </button>
      </div>
    </form>
  );
};

export default ReminderForm;