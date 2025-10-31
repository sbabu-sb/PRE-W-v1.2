import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Paperclip, List, BellRing, History } from 'lucide-react';
import { WorklistPatient, CaseNote, CaseAttachment, CaseActivity, AISummary, CaseReminder, ReminderStatus, TemporalEvent } from '../../../../types';
import NotesTab from './collaboration/NotesTab';
import AttachmentsTab from './collaboration/AttachmentsTab';
import ActivityTab from './collaboration/ActivityTab';
import AISummaryDisplay from './collaboration/AISummaryDisplay';
import RemindersTab from './collaboration/RemindersTab';
import HistoryTab from './collaboration/HistoryTab';

export type ActiveCollaborationTab = 'notes' | 'attachments' | 'activity' | 'reminders' | 'history';

interface CaseCollaborationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient: WorklistPatient | null;
  notes: CaseNote[];
  attachments: CaseAttachment[];
  activities: CaseActivity[];
  reminders: CaseReminder[];
  history: TemporalEvent[];
  onAddNote: (caseId: string, content: string, parentNoteId?: string) => CaseNote | undefined;
  onAddAttachment: (caseId: string, file: File) => void;
  onAddReminder: (caseId: string, reminder: Omit<CaseReminder, 'id' | 'caseId' | 'createdAt' | 'createdById' | 'createdByName' | 'status' | 'auditTrail'>) => void;
  onUpdateReminderStatus: (reminderId: string, status: ReminderStatus) => void;
  aiSummary: AISummary | null;
  isAiSummaryLoading: boolean;
  onRegenerateSummary: () => void;
  initialTab?: ActiveCollaborationTab;
}

const CaseCollaborationDrawer: React.FC<CaseCollaborationDrawerProps> = ({
  isOpen, onClose, patient, notes, attachments, activities, reminders, history, onAddNote, onAddAttachment, onAddReminder, onUpdateReminderStatus, aiSummary, isAiSummaryLoading, onRegenerateSummary, initialTab
}) => {
  const [activeTab, setActiveTab] = useState<ActiveCollaborationTab>(initialTab || 'notes');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'notes'); // Reset to notes tab whenever a new case is opened
    }
  }, [isOpen, patient, initialTab]);


  if (!isOpen || !patient) return null;

  const TabButton: React.FC<{ tabId: ActiveCollaborationTab, icon: React.ReactNode, label: string }> = ({ tabId, icon, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
        activeTab === tabId ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 z-[1050] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div
        className={`fixed inset-y-0 right-0 pt-16 bg-white shadow-2xl flex flex-col z-[1100] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: 'clamp(320px, 20vw, 480px)' }}
        role="dialog"
      >
        <header className="flex-shrink-0 p-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Case Collaboration</h2>
              <p className="text-sm text-gray-500">{patient.id} - {patient.metaData.patient.name}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-4">
            <AISummaryDisplay summary={aiSummary} isLoading={isAiSummaryLoading} onRegenerate={onRegenerateSummary} />
          </div>
          <nav className="mt-4 flex gap-2 flex-wrap">
            <TabButton tabId="notes" icon={<MessageSquare className="h-4 w-4" />} label="Notes" />
            <TabButton tabId="reminders" icon={<BellRing className="h-4 w-4" />} label="Reminders" />
            <TabButton tabId="attachments" icon={<Paperclip className="h-4 w-4" />} label="Attachments" />
            <TabButton tabId="activity" icon={<List className="h-4 w-4" />} label="Activity" />
            <TabButton tabId="history" icon={<History className="h-4 w-4" />} label="History" />
          </nav>
        </header>
        <main className="flex-1 overflow-hidden p-4">
          {activeTab === 'notes' && <NotesTab notes={notes} reminders={reminders} onAddNote={(content, parentId) => onAddNote(patient.id, content, parentId)} onAddReminder={(data) => onAddReminder(patient.id, data)} onUpdateReminderStatus={onUpdateReminderStatus} />}
          {activeTab === 'reminders' && <RemindersTab reminders={reminders} onAddReminder={(data) => onAddReminder(patient.id, data)} onUpdateReminderStatus={onUpdateReminderStatus} />}
          {activeTab === 'attachments' && <AttachmentsTab attachments={attachments} onAddAttachment={(file) => onAddAttachment(patient.id, file)} />}
          {activeTab === 'activity' && <ActivityTab activities={activities} />}
          {activeTab === 'history' && <HistoryTab history={history} />}
        </main>
      </div>
    </>
  );
};

export default CaseCollaborationDrawer;