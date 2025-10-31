import { TemporalEvent, WorklistPatient } from '../types';
import { worklistData } from './worklistData';
import { calculateGtsaScore } from '../services/gtsaService';

let historyStore: TemporalEvent[] = [
    // Initial seed data for the first case
    {
        id: crypto.randomUUID(),
        caseId: worklistData[0].id,
        patientName: worklistData[0].metaData.patient.name,
        actorId: 'system',
        actorName: 'System',
        eventType: 'case_created',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        description: `Case created for patient ${worklistData[0].metaData.patient.name}.`,
        source: 'system',
        gtasScore: 12,
        integrityHash: 'mock_hash_1'
    },
    {
        id: crypto.randomUUID(),
        caseId: worklistData[0].id,
        patientName: worklistData[0].metaData.patient.name,
        actorId: 'user1',
        actorName: 'Maria Garcia',
        eventType: 'assignment_changed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: `Case assigned to Maria Garcia.`,
        details: { newValue: 'Maria Garcia' },
        source: 'user',
        gtasScore: 45,
        integrityHash: 'mock_hash_2'
    },
    // Seed for another case
    {
        id: crypto.randomUUID(),
        caseId: worklistData[1].id,
        patientName: worklistData[1].metaData.patient.name,
        actorId: 'system',
        actorName: 'System',
        eventType: 'case_created',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: `Case created for patient ${worklistData[1].metaData.patient.name}.`,
        source: 'system',
        gtasScore: 10,
        integrityHash: 'mock_hash_3'
    },
    {
        id: crypto.randomUUID(),
        caseId: worklistData[1].id,
        patientName: worklistData[1].metaData.patient.name,
        actorId: 'patient_portal',
        actorName: 'Patient Portal',
        eventType: 'note_added', // Could be a custom event type in a real app
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: `received a message from patient: "Just checking on the status of my appointment."`,
        details: { noteContent: "Just checking on the status of my appointment." },
        source: 'patient', // New source
        gtasScore: 35,
        integrityHash: 'mock_hash_patient_1'
    },
];

// FIX: Universal Journey Data Seeding
const seedHistoryForAllCases = () => {
    const casesWithHistory = new Set(historyStore.map(e => e.caseId));
    worklistData.forEach(patient => {
        if (!casesWithHistory.has(patient.id)) {
            const creationEvent: TemporalEvent = {
                id: crypto.randomUUID(),
                caseId: patient.id,
                patientName: patient.metaData.patient.name,
                actorId: 'system',
                actorName: 'System',
                eventType: 'case_created',
                timestamp: patient.events[0]?.at || new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                description: `Case created for patient ${patient.metaData.patient.name}.`,
                source: 'system',
                gtasScore: 10,
                integrityHash: `mock_hash_${crypto.randomUUID()}`
            };
            historyStore.push(creationEvent);
        }
    });
};
seedHistoryForAllCases();


export const getHistoryForCase = (caseId: string): TemporalEvent[] => {
    const caseEvents = historyStore
        .filter(event => event.caseId === caseId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const threads = new Map<string, TemporalEvent[]>();
    const nonThreadedEvents: TemporalEvent[] = [];

    caseEvents.forEach(event => {
        if (event.threadId) {
            if (!threads.has(event.threadId)) {
                threads.set(event.threadId, []);
            }
            threads.get(event.threadId)!.push(event);
        } else {
            nonThreadedEvents.push(event);
        }
    });

    const processedEvents: TemporalEvent[] = [...nonThreadedEvents];

    threads.forEach((threadEvents) => {
        if (threadEvents.length > 2) {
            // Create a summary event
            let summary = `A sequence of ${threadEvents.length} related events occurred.`;
            if (threadEvents.some(e => e.eventType === 'eligibility_rerun' || e.eventType === 'attachment_uploaded')) {
                summary = `Coverage issue resolved — ${threadEvents.length} related events`;
            } else if (threadEvents.some(e => e.eventType === 'reminder_created')) {
                summary = `Follow-up sequence initiated — ${threadEvents.length} related events`;
            }
            
            const summaryEvent: TemporalEvent = {
                ...threadEvents[threadEvents.length - 1], // Use the latest event as the base
                id: `thread_${threadEvents[0].threadId}`,
                eventType: 'thread_summary',
                description: summary,
                threadSummary: summary,
                childEvents: threadEvents,
            };
            processedEvents.push(summaryEvent);
        } else {
            // Add individual events for small threads
            processedEvents.push(...threadEvents);
        }
    });

    // Final sort: newest first for display
    return processedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getGlobalHistory = (): TemporalEvent[] => {
    return [...historyStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addHistoryEvent = (
    eventData: Omit<TemporalEvent, 'id' | 'timestamp' | 'gtasScore' | 'integrityHash' | 'explanation' | 'impactCategory'>,
    patientContext?: WorklistPatient
) => {
    const { score, explanation, impactCategory } = calculateGtsaScore(eventData, patientContext);

    const THREAD_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const now = new Date().getTime();

    // Find the most recent event that could be part of the same thread
    const potentialThreadParent = historyStore
        .filter(e =>
            e.caseId === eventData.caseId &&
            e.actorId === eventData.actorId &&
            (now - new Date(e.timestamp).getTime()) < THREAD_WINDOW_MS
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const threadId = potentialThreadParent?.threadId || crypto.randomUUID();

    const newEvent: TemporalEvent = {
        ...eventData,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        gtasScore: score,
        explanation,
        impactCategory,
        integrityHash: `mock_hash_${crypto.randomUUID()}`,
        threadId,
    };
    historyStore = [newEvent, ...historyStore];
    console.log("History Event Added:", newEvent);
};