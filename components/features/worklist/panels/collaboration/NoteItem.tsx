import React, { useState, useMemo } from 'react';
import { CaseNote, CaseReminder, ReminderStatus } from '../../../../../types';
import { formatRelativeTime } from '../../../../../utils/formatters';
import { Reply, Flag, Send, PlusCircle } from 'lucide-react';
import Textarea from '../../../../common/Textarea';
import ReminderForm from './ReminderForm';
import ReminderItem from './ReminderItem';

interface NoteItemProps {
    note: CaseNote;
    reminders: CaseReminder[];
    allRepliesMap: Map<string, CaseNote[]>;
    onAddReply: (content: string, parentNoteId: string) => void;
    onAddReminder: (data: Omit<CaseReminder, 'id' | 'caseId' | 'createdAt' | 'createdById' | 'createdByName' | 'status' | 'auditTrail'>) => void;
    onUpdateReminderStatus: (reminderId: string, status: ReminderStatus) => void;
}

const NoteContent: React.FC<{ content: string, mentions?: CaseNote['mentions'], tags?: CaseNote['tags'] }> = ({ content, mentions, tags }) => {
    // Simple parser to highlight mentions and tags
    const parts = content.split(/(@[\w\s]+|#\w+)/g);
    return (
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
            {parts.map((part, i) => {
                if (part.startsWith('@')) {
                    const mentionName = part.substring(1).trim();
                    const mention = mentions?.find(m => m.userName.trim() === mentionName);
                    return <strong key={i} className="text-blue-600 bg-blue-100 px-1 rounded-sm">{part}</strong>;
                }
                if (part.startsWith('#')) {
                    return <strong key={i} className="text-purple-600 bg-purple-100 px-1 rounded-sm">{part}</strong>;
                }
                return part;
            })}
        </p>
    );
};

const NoteItem: React.FC<NoteItemProps> = ({ note, reminders, allRepliesMap, onAddReply, onAddReminder, onUpdateReminderStatus }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [isSettingReminder, setIsSettingReminder] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const directReplies = allRepliesMap.get(note.id) || [];
    
    const relatedReminder = useMemo(() => reminders.find(r => r.relatedNoteId === note.id), [reminders, note.id]);

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyContent.trim()) {
            onAddReply(replyContent.trim(), note.id);
            setReplyContent('');
            setIsReplying(false);
        }
    };
    
    const handleSaveReminder = (data: Omit<CaseReminder, 'id' | 'caseId' | 'createdAt' | 'createdById' | 'createdByName' | 'status' | 'auditTrail'>) => {
        onAddReminder(data);
        setIsSettingReminder(false);
    };

    return (
        <div className="flex gap-3">
            <img src={note.avatarUrl} alt={note.authorName} className="h-8 w-8 rounded-full bg-gray-200 mt-1 flex-shrink-0" />
            <div className="flex-1">
                <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-gray-800">{note.authorName}</span>
                        <span className="text-xs text-gray-500">{formatRelativeTime(note.createdAt)}</span>
                    </div>
                    <NoteContent content={note.content} mentions={note.mentions} tags={note.tags} />
                </div>
                <div className="mt-1 flex items-center space-x-3 pl-2">
                    <button onClick={() => setIsReplying(!isReplying)} className="flex items-center text-xs text-gray-500 hover:text-gray-800 font-medium">
                        <Reply className="h-3 w-3 mr-1" /> Reply
                    </button>
                    {!relatedReminder && (
                        <button onClick={() => setIsSettingReminder(!isSettingReminder)} className="flex items-center text-xs text-gray-500 hover:text-gray-800 font-medium">
                            <PlusCircle className="h-3 w-3 mr-1" /> Set follow-up
                        </button>
                    )}
                    {note.requiresFollowUp && !relatedReminder && (
                        <span className="flex items-center text-xs text-yellow-600 font-semibold" title="Requires follow-up">
                            <Flag className="h-3 w-3 mr-1 fill-current" /> Follow-up
                        </span>
                    )}
                </div>

                {isReplying && (
                    <form onSubmit={handleReplySubmit} className="relative mt-2">
                        <Textarea
                            label=""
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            placeholder={`Replying to ${note.authorName}...`}
                            autoFocus
                        />
                        <button type="submit" className="absolute bottom-2 right-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400" disabled={!replyContent.trim()}>
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                )}
                
                {isSettingReminder && (
                    <div className="mt-2">
                        <ReminderForm 
                            onSave={handleSaveReminder} 
                            onCancel={() => setIsSettingReminder(false)}
                            relatedNoteId={note.id}
                        />
                    </div>
                )}
                
                {relatedReminder && (
                    <div className="mt-2">
                         <ReminderItem reminder={relatedReminder} onUpdateStatus={onUpdateReminderStatus} />
                    </div>
                )}

                {directReplies.length > 0 && (
                    <div className="mt-3 space-y-4 border-l-2 border-gray-200 pl-4">
                        {directReplies.map(reply => (
                            <NoteItem key={reply.id} note={reply} reminders={reminders} allRepliesMap={allRepliesMap} onAddReply={onAddReply} onAddReminder={onAddReminder} onUpdateReminderStatus={onUpdateReminderStatus} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoteItem;