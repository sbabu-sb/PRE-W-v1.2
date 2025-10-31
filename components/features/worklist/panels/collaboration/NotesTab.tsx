import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CaseNote, CaseReminder, AIReminderSuggestion, ReminderStatus } from '../../../../../types';
import Textarea from '../../../../common/Textarea';
import { Send, User, Wand2 } from 'lucide-react';
import NoteItem from './NoteItem';
import { mentionableUsers } from '../../../../../data/collaborationData';
import { suggestReminderFromNote } from '../../../../../services/geminiService';

interface NotesTabProps {
  notes: CaseNote[];
  reminders: CaseReminder[];
  onAddNote: (content: string, parentNoteId?: string) => CaseNote | undefined;
  onAddReminder: (data: Omit<CaseReminder, 'id' | 'caseId' | 'createdAt' | 'createdById' | 'createdByName' | 'status' | 'auditTrail'>) => void;
  onUpdateReminderStatus: (reminderId: string, status: ReminderStatus) => void;
}

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const NotesTab: React.FC<NotesTabProps> = ({ notes, reminders, onAddNote, onAddReminder, onUpdateReminderStatus }) => {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIReminderSuggestion | null>(null);

  const debouncedNoteContent = useDebounce(newNoteContent, 1000);

  useEffect(() => {
      if (debouncedNoteContent.length < 20) {
          setAiSuggestion(null);
          return;
      }
      
      let isMounted = true;
      const fetchSuggestion = async () => {
          const result = await suggestReminderFromNote(debouncedNoteContent);
          if (isMounted && result.success && result.data) {
              setAiSuggestion(result.data);
          } else {
              setAiSuggestion(null);
          }
      };
      
      fetchSuggestion();
      return () => { isMounted = false; };
  }, [debouncedNoteContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteContent.trim()) {
      onAddNote(newNoteContent.trim());
      setNewNoteContent('');
      setAiSuggestion(null);
    }
  };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setNewNoteContent(text);
      setAiSuggestion(null); // Clear suggestion on new input
      const atIndex = text.lastIndexOf('@');
      // Show mention box if '@' is present and there's no space after it
      if (atIndex > -1 && !/\s/.test(text.substring(atIndex + 1))) {
          setMentionQuery(text.substring(atIndex + 1));
          setShowMentions(true);
      } else {
          setShowMentions(false);
      }
  };
  
  const handleMentionSelect = (name: string) => {
      const atIndex = newNoteContent.lastIndexOf('@');
      setNewNoteContent(newNoteContent.substring(0, atIndex) + `@${name} `);
      setShowMentions(false);
  };
  
  const handleAcceptAiSuggestion = () => {
      if (!aiSuggestion) return;
      
      // First, create the note.
      const newNote = onAddNote(newNoteContent.trim());
      
      // If the note was created successfully and we have its ID, create the reminder.
      if (newNote && newNote.id) {
          onAddReminder({
              relatedNoteId: newNote.id,
              title: aiSuggestion.title,
              dueAt: aiSuggestion.dueAt,
              assignedToName: 'Maria Garcia', // Default to current user
              priority: 'medium',
              source: 'ai',
              visibility: 'team',
          });
      }
      
      // Clear the form.
      setNewNoteContent('');
      setAiSuggestion(null);
  };
  
  const filteredMentions = useMemo(() => 
      mentionableUsers.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase())),
      [mentionQuery]
  );

  const { rootNotes, repliesMap } = useMemo(() => {
    const rootNotes: CaseNote[] = [];
    const repliesMap = new Map<string, CaseNote[]>();
    const notesById = new Map<string, CaseNote>(notes.map(note => [note.id, note]));

    notes.forEach(note => {
      if (note.parentNoteId && notesById.has(note.parentNoteId)) {
        const parentReplies = repliesMap.get(note.parentNoteId) || [];
        parentReplies.push(note);
        repliesMap.set(note.parentNoteId, parentReplies);
      } else {
        rootNotes.push(note);
      }
    });
    
    // Sort root notes by newest first for display
    rootNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return { rootNotes, repliesMap };
  }, [notes]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {notes.length === 0 ? (
          <p className="text-center text-gray-500 pt-8">No notes for this case yet.</p>
        ) : (
          rootNotes.map(note => (
            <NoteItem key={note.id} note={note} reminders={reminders} allRepliesMap={repliesMap} onAddReply={onAddNote} onAddReminder={onAddReminder} onUpdateReminderStatus={onUpdateReminderStatus} />
          ))
        )}
      </div>
      <div className="flex-shrink-0 pt-4 mt-4 border-t">
        <form onSubmit={handleSubmit} className="relative">
           {showMentions && filteredMentions.length > 0 && (
              <div className="absolute bottom-full mb-1 w-full bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                  {filteredMentions.map(user => (
                      <div key={user.id} onClick={() => handleMentionSelect(user.name)} className="p-2 hover:bg-blue-50 cursor-pointer text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500"/> {user.name}
                      </div>
                  ))}
              </div>
          )}
          <Textarea 
            label="Add a new note"
            value={newNoteContent}
            onChange={handleTextChange}
            placeholder="Type your note here... Use @ to mention a user or # to add a tag."
          />
          {aiSuggestion && (
            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-md flex items-center justify-between animate-fade-in">
                <div className="text-sm text-purple-800">
                    <p className="font-semibold flex items-center gap-1.5"><Wand2 className="h-4 w-4" /> AI Suggestion</p>
                    <p className="text-xs mt-1">{aiSuggestion.rationale}</p>
                </div>
                <button type="button" onClick={handleAcceptAiSuggestion} className="px-3 py-1 text-sm font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700">Accept</button>
            </div>
           )}
          <button type="submit" className="absolute bottom-2 right-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400" disabled={!newNoteContent.trim()}>
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotesTab;