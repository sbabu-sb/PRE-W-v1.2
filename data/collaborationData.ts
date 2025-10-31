import { CaseNote, CaseAttachment, CaseActivity, WorklistPatient, AISummary, CaseReminder, ReminderStatus } from '../types';
import { worklistData } from './worklistData';
import { fetchAiCaseSummary as fetchAiCaseSummaryFromService } from '../services/geminiService';
import { addHistoryEvent } from './historyData';
import { logUserActivity } from './userActivityData';

// --- Phase 5.2 additions ---
export const mentionableUsers = [
    { id: 'user1', name: 'Maria Garcia', role: 'Billing Specialist' },
    { id: 'user2', name: 'David Chen', role: 'Auth Coordinator' },
    { id: 'user3', name: 'J. Smith', role: 'Supervisor' },
    { id: 'role1', name: 'Auth Team', isRole: true },
    { id: 'role2', name: 'Eligibility Team', isRole: true },
];
// --- End Phase 5.2 additions ---

// Initial mock data
const initialNotes: CaseNote[] = [
    // Case 1 Thread
    {
        id: 'note_1',
        caseId: worklistData[0].id,
        authorName: 'Maria Garcia',
        authorId: 'user1',
        avatarUrl: 'https://i.pravatar.cc/150?u=mariagarcia',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        content: 'Called payer to confirm benefits. Deductible is $1500, with $500 met. #eligibility',
        tags: ['eligibility'],
    },
    {
        id: 'note_2',
        caseId: worklistData[0].id,
        authorName: 'David Chen',
        authorId: 'user2',
        avatarUrl: 'https://i.pravatar.cc/150?u=davidchen',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        content: "Auth is required for the primary CPT. @Maria Garcia can you request clinicals from Dr. Ewing's office? #auth",
        parentNoteId: 'note_1',
        mentions: [{ userId: 'user1', userName: 'Maria Garcia' }],
        tags: ['auth'],
        requiresFollowUp: true,
    },
    {
        id: 'note_3',
        caseId: worklistData[0].id,
        authorName: 'Maria Garcia',
        authorId: 'user1',
        avatarUrl: 'https://i.pravatar.cc/150?u=mariagarcia',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        content: '@David Chen On it. Sent the request just now.',
        parentNoteId: 'note_2',
        mentions: [{ userId: 'user2', userName: 'David Chen' }],
    },
    // Case 3 (single note)
    {
        id: 'note_4',
        caseId: worklistData[2].id,
        authorName: 'Maria Garcia',
        authorId: 'user1',
        avatarUrl: 'https://i.pravatar.cc/150?u=mariagarcia',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        content: 'Patient called to ask about the estimate. Informed them it is in progress. #patient_comm'
    },
     // Case 5 (new note)
    {
        id: 'note_5',
        caseId: worklistData[4].id,
        authorName: 'David Chen',
        authorId: 'user2',
        avatarUrl: 'https://i.pravatar.cc/150?u=davidchen',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        content: 'Secondary eligibility check failed. @Eligibility Team please re-verify. #eligibility #blocked',
        tags: ['eligibility', 'blocked'],
        mentions: [{ userId: 'role2', userName: 'Eligibility Team', role: 'Eligibility Team' }],
        requiresFollowUp: true,
    }
];

const initialAttachments: CaseAttachment[] = [
    {
        id: 'attach_1',
        caseId: worklistData[0].id,
        fileName: 'Clinical_Notes_Ewing.pdf',
        fileType: 'application/pdf',
        fileSize: 123456, // 123 KB
        uploadUrl: '#',
        uploadedBy: 'Maria Garcia',
        uploadedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        category: 'clinical',
    },
    {
        id: 'attach_2',
        caseId: worklistData[0].id,
        fileName: 'Auth_Approval_Aetna.png',
        fileType: 'image/png',
        fileSize: 204800, // 200 KB
        uploadUrl: '#',
        uploadedBy: 'David Chen',
        uploadedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        category: 'auth',
    },
];

const initialReminders: CaseReminder[] = [
    {
        id: 'rem_1', caseId: worklistData[0].id, relatedNoteId: 'note_2',
        title: 'Call Aetna with clinicals', dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), createdById: 'user2', createdByName: 'David Chen',
        assignedToName: 'Maria Garcia', priority: 'high', status: 'pending', source: 'note', visibility: 'team', auditTrail: []
    },
    {
        id: 'rem_2', caseId: worklistData[0].id,
        title: 'Verify secondary eligibility again', dueAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), createdById: 'user3', createdByName: 'J. Smith',
        assignedToName: 'Eligibility Team', priority: 'medium', status: 'pending', source: 'action_menu', visibility: 'team', auditTrail: []
    },
    {
        id: 'rem_3', caseId: worklistData[2].id,
        title: 'Send estimate to patient', dueAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), createdById: 'user1', createdByName: 'Maria Garcia',
        assignedToName: 'Maria Garcia', priority: 'low', status: 'pending', source: 'action_menu', visibility: 'team', auditTrail: []
    },
     {
        id: 'rem_4', caseId: worklistData[2].id,
        title: 'Confirm appointment with patient', dueAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), createdById: 'user1', createdByName: 'Maria Garcia',
        assignedToName: 'Maria Garcia', priority: 'low', status: 'completed', source: 'action_menu', visibility: 'team', auditTrail: []
    }
];

let notesStore: CaseNote[] = [...initialNotes];
let attachmentsStore: CaseAttachment[] = [...initialAttachments];
let remindersStore: CaseReminder[] = [...initialReminders];

let activityStore: CaseActivity[] = [
    ...initialNotes.map(note => ({
        id: `activity_for_${note.id}`,
        caseId: note.caseId,
        type: 'note_created' as const,
        actorId: note.authorId,
        actorName: note.authorName,
        occurredAt: note.createdAt,
        details: { noteId: note.id, noteContent: note.content.substring(0, 50) + '...' }
    })),
    ...initialAttachments.map(attach => ({
        id: `activity_for_${attach.id}`,
        caseId: attach.caseId,
        type: 'attachment_added' as const,
        actorId: 'system',
        actorName: attach.uploadedBy,
        occurredAt: attach.uploadedAt,
        details: { attachmentId: attach.id, fileName: attach.fileName }
    })),
     ...initialReminders.map(rem => ({
        id: `activity_for_${rem.id}`,
        caseId: rem.caseId,
        type: (rem.status === 'completed' ? 'reminder_completed' : 'reminder_created') as 'reminder_created' | 'reminder_completed',
        actorId: rem.createdById,
        actorName: rem.createdByName,
        occurredAt: rem.createdAt,
        details: { reminderId: rem.id, title: rem.title, dueAt: rem.dueAt }
    })),
];

let aiSummariesStore: Record<string, AISummary> = {
  [worklistData[0].id]: {
    caseId: worklistData[0].id,
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    summary: "Case is pending clinicals for auth. David Chen is following up. Secondary eligibility was confirmed.",
    actions: [{ label: "Request clinicals from Dr. Ewing's office", owner: "Maria Garcia", confidence: 0.95 }],
    sentiment: 'blocked',
    sourceItemIds: ['note_1', 'note_2', 'note_3'],
    rationale: 'Generated from initial notes thread regarding auth requirement.'
  }
};


// --- Notes Service ---
export const getNotesForCase = (caseId: string): CaseNote[] => {
    return notesStore.filter(note => note.caseId === caseId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const addNoteForCase = (caseId: string, content: string, parentNoteId?: string): CaseNote => {
    const newNote: CaseNote = {
        id: crypto.randomUUID(),
        caseId,
        authorName: 'Maria Garcia', // Assuming current user
        authorId: 'user1',
        avatarUrl: 'https://i.pravatar.cc/150?u=mariagarcia',
        createdAt: new Date().toISOString(),
        content,
        parentNoteId,
    };
    
    const mentions = content.match(/@([\w\s]+)/g)?.map(m => m.substring(1).trim());
    if (mentions) {
        newNote.mentions = mentions.map(name => {
            const user = mentionableUsers.find(u => u.name === name);
            return { userId: user?.id || 'unknown', userName: name, role: user?.role };
        });
    }
    const tags = content.match(/#(\w+)/g)?.map(t => t.substring(1));
    if (tags) newNote.tags = tags;
    if (content.toLowerCase().includes('follow up') || content.toLowerCase().includes('please')) newNote.requiresFollowUp = true;

    notesStore = [...notesStore, newNote];
    // Create activity log
    const newActivity: CaseActivity = {
        id: crypto.randomUUID(), caseId, type: 'note_created',
        actorId: newNote.authorId, actorName: newNote.authorName, occurredAt: newNote.createdAt,
        details: { noteId: newNote.id, noteContent: content.substring(0, 50) + '...' }
    };
    activityStore = [...activityStore, newActivity];
    
    const patientContext = worklistData.find(p => p.id === caseId);
    if(patientContext) {
        addHistoryEvent({
            caseId,
            patientName: patientContext.metaData.patient.name,
            actorId: newNote.authorId,
            actorName: newNote.authorName,
            eventType: 'note_added',
            description: `added a note: "${content.substring(0, 50)}..."`,
            details: { noteId: newNote.id },
            source: 'user',
        }, patientContext);
    }


    logUserActivity(newNote.authorId, caseId, 'commented', 'You added a note');
    
    return newNote;
};

export const getNotesCountForCase = (caseId: string): number => notesStore.filter(note => note.caseId === caseId).length;


// --- Attachments Service ---
export const getAttachmentsForCase = (caseId: string): CaseAttachment[] => {
    return attachmentsStore.filter(a => a.caseId === caseId).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
};

export const addAttachmentForCase = (caseId: string, file: File): CaseAttachment => {
    const newAttachment: CaseAttachment = {
        id: crypto.randomUUID(), caseId,
        fileName: file.name, fileType: file.type, fileSize: file.size,
        uploadUrl: '#', uploadedBy: 'Maria Garcia', // Assuming current user
        uploadedAt: new Date().toISOString(), category: 'other'
    };
    attachmentsStore = [...attachmentsStore, newAttachment];
    
    const newActivity: CaseActivity = {
        id: crypto.randomUUID(), caseId, type: 'attachment_added',
        actorId: 'user1', actorName: 'Maria Garcia', occurredAt: newAttachment.uploadedAt,
        details: { attachmentId: newAttachment.id, fileName: newAttachment.fileName }
    };
    activityStore = [...activityStore, newActivity];

    const patientContext = worklistData.find(p => p.id === caseId);
    if(patientContext) {
        addHistoryEvent({
            caseId,
            patientName: patientContext.metaData.patient.name,
            actorId: 'user1', // assumed
            actorName: newAttachment.uploadedBy,
            eventType: 'attachment_uploaded',
            description: `uploaded attachment: "${newAttachment.fileName}"`,
            details: { attachmentId: newAttachment.id, fileName: newAttachment.fileName },
            source: 'user',
        }, patientContext);
    }


    logUserActivity('user1', caseId, 'attachment_added', `You uploaded "${file.name}"`);
    
    return newAttachment;
};

export const getAttachmentsCountForCase = (caseId: string): number => attachmentsStore.filter(a => a.caseId === caseId).length;

// --- Reminders Service (Phase 5.1) ---
export const getRemindersForCase = (caseId: string): CaseReminder[] => {
    return remindersStore.filter(r => r.caseId === caseId).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
};

export const addReminderForCase = (caseId: string, reminderData: Omit<CaseReminder, 'id' | 'caseId' | 'createdAt' | 'createdById' | 'createdByName' | 'status' | 'auditTrail'>): CaseReminder => {
    const newReminder: CaseReminder = {
        id: `rem_${crypto.randomUUID()}`,
        caseId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdById: 'user1', // Assume current user
        createdByName: 'Maria Garcia',
        auditTrail: [],
        ...reminderData
    };
    newReminder.auditTrail.push({ at: newReminder.createdAt, actorId: newReminder.createdById, action: 'created' });
    remindersStore = [...remindersStore, newReminder];
    
    activityStore = [...activityStore, {
        id: crypto.randomUUID(), caseId, type: 'reminder_created',
        actorId: newReminder.createdById, actorName: newReminder.createdByName, occurredAt: newReminder.createdAt,
        details: { reminderId: newReminder.id, title: newReminder.title, dueAt: newReminder.dueAt }
    }];

    const patientContext = worklistData.find(p => p.id === caseId);
    if (patientContext) {
        addHistoryEvent({
            caseId,
            patientName: patientContext.metaData.patient.name,
            actorId: newReminder.createdById,
            actorName: newReminder.createdByName,
            eventType: 'reminder_created',
            description: `set a reminder: "${newReminder.title}"`,
            details: { reminderId: newReminder.id, title: newReminder.title, dueAt: newReminder.dueAt },
            source: 'user',
        }, patientContext);
    }

    return newReminder;
};

export const updateReminderStatusForCase = (reminderId: string, status: ReminderStatus): CaseReminder | undefined => {
    let updatedReminder: CaseReminder | undefined;
    remindersStore = remindersStore.map(r => {
        if (r.id === reminderId) {
            updatedReminder = { ...r, status };
            return updatedReminder;
        }
        return r;
    });

    if (updatedReminder && status === 'completed') {
        const now = new Date().toISOString();
        activityStore = [...activityStore, {
            id: crypto.randomUUID(), caseId: updatedReminder.caseId, type: 'reminder_completed',
            actorId: 'user1', actorName: 'Maria Garcia', occurredAt: now,
            details: { reminderId: updatedReminder.id, title: updatedReminder.title }
        }];
        
        const patientContext = worklistData.find(p => p.id === updatedReminder!.caseId);
        if(patientContext) {
            addHistoryEvent({
                caseId: updatedReminder.caseId,
                patientName: patientContext.metaData.patient.name,
                actorId: 'user1', // assume current user
                actorName: 'Maria Garcia',
                eventType: 'reminder_completed',
                description: `completed reminder: "${updatedReminder.title}"`,
                details: { reminderId: updatedReminder.id, title: updatedReminder.title, newStatus: status },
                source: 'user',
            }, patientContext);
        }
    }
    return updatedReminder;
};


// --- Activity Service ---
export const getActivitiesForCase = (caseId: string): CaseActivity[] => {
    return activityStore.filter(act => act.caseId === caseId).sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
};

// --- AI Summary Service ---
export const getAiSummaryForCase = (caseId: string): AISummary | undefined => {
    return aiSummariesStore[caseId];
};

export const regenerateAiSummaryForCase = async (caseId: string) => {
    const notes = getNotesForCase(caseId);
    const attachments = getAttachmentsForCase(caseId);
    const result = await fetchAiCaseSummaryFromService(caseId, notes, attachments);
    if (result.success && result.data) {
        aiSummariesStore[caseId] = result.data;
    }
    return result;
};


// --- Global Feed Service ---
export const getAggregatedFeedData = () => {
    const allActivities: (CaseNote | CaseAttachment | CaseReminder)[] = [...notesStore, ...attachmentsStore, ...remindersStore];
    
    const getTimestamp = (item: CaseNote | CaseAttachment | CaseReminder): string => {
        if ('createdAt' in item) return item.createdAt;
        if ('uploadedAt' in item) return item.uploadedAt;
        return new Date(0).toISOString();
    };

    allActivities.sort((a, b) => new Date(getTimestamp(b)).getTime() - new Date(getTimestamp(a)).getTime());

    const groupedByCase = allActivities.reduce((acc, item) => {
        const caseId = item.caseId;
        if (!acc[caseId]) {
            const patient = worklistData.find(p => p.id === caseId);
            if (patient) {
                acc[caseId] = { patient, activities: [] };
            }
        }
        if (acc[caseId]) {
            acc[caseId].activities.push(item);
        }
        return acc;
    }, {} as Record<string, { patient: WorklistPatient; activities: (CaseNote | CaseAttachment | CaseReminder)[] }>);

    return Object.values(groupedByCase).sort((a, b) => {
        const lastActivityA = new Date(getTimestamp(a.activities[0])).getTime();
        const lastActivityB = new Date(getTimestamp(b.activities[0])).getTime();
        return lastActivityB - lastActivityA;
    });
};

export const getRemindersForUser = (userId: string): CaseReminder[] => {
    // In a real app, this would use the userId. For now, we mock for the current user.
    const currentUserName = 'Maria Garcia';
    return remindersStore.filter(r => r.assignedToName === currentUserName || r.createdByName === currentUserName);
};