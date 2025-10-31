import React from 'react';
import { Save, Sparkles } from 'lucide-react';
import { SmartSaveMode, SmartSaveScope } from '../../../../types';

interface SmartSaveButtonProps {
  onClick: () => void;
  mode: SmartSaveMode;
  scope: SmartSaveScope;
  hasUnsavedChanges: boolean;
}

const SmartSaveButton: React.FC<SmartSaveButtonProps> = ({ onClick, mode, scope, hasUnsavedChanges }) => {
  const getStatus = () => {
    if (hasUnsavedChanges) {
      return { text: 'Unsaved', color: 'bg-yellow-400 text-yellow-900' };
    }
    if (mode === 'manual') {
      return { text: 'Manual', color: 'bg-gray-200 text-gray-700' };
    }
    if (scope === 'org') {
      return { text: 'Org Default', color: 'bg-indigo-200 text-indigo-800' };
    }
    if (scope === 'team') {
      return { text: 'Team', color: 'bg-blue-200 text-blue-800' };
    }
    return { text: 'Personal', color: 'bg-green-200 text-green-800' };
  };

  const status = getStatus();

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="flex items-center space-x-2 text-sm font-semibold text-gray-700 h-10 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
      >
        <div className="relative">
            <Save className="h-4 w-4 text-gray-500" />
            <Sparkles className="h-2 w-2 text-yellow-400 fill-current absolute -top-0.5 -right-0.5" />
        </div>
        <span>SmartSave</span>
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${status.color}`}>
          {status.text}
        </span>
      </button>
    </div>
  );
};

export default SmartSaveButton;
