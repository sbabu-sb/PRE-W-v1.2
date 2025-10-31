import { TemporalEvent, JourneyEvent, JourneyPhase, JourneyEventType, JourneyGraph, JourneyGap, JourneyPersona, PredictiveNextStep } from '../types';
import { getHistoryForCase } from '../data/historyData';

const getPhase = (eventType: TemporalEvent['eventType']): JourneyPhase => {
    switch (eventType) {
        case 'case_created':
        case 'eligibility_rerun':
        case 'assignment_changed':
            return 'pre_service';
        case 'auth_status_changed':
        case 'estimate_regenerated':
            return 'financial_clearance';
        case 'case_dispositioned':
            return 'resolution';
        case 'note_added':
        case 'attachment_uploaded':
            return 'clinical';
        default:
            return 'pre_service';
    }
};

const getJourneyEventType = (event: TemporalEvent): JourneyEventType | null => {
    switch (event.eventType) {
        case 'case_created': return 'case_created';
        case 'eligibility_rerun': return 'eligibility_run';
        case 'auth_status_changed':
            if (event.details?.newValue === 'Approved') return 'auth_approved';
            if (event.details?.newValue === 'Denied') return 'auth_denied';
            return 'auth_submitted';
        case 'estimate_regenerated': return 'estimate_revised';
        case 'case_dispositioned': return 'closed';
        case 'attachment_uploaded':
            if (event.details?.category === 'clinical') return 'doc_received';
            return null;
        case 'note_added': return 'note_added';
        case 'assignment_changed': return 'assignment_changed';
        default: 
            return null;
    }
};

const upliftTemporalToJourney = (event: TemporalEvent): JourneyEvent | null => {
    if (event.eventType === 'thread_summary' && event.childEvents) {
        return null;
    }
    const journeyEventType = getJourneyEventType(event);
    if (!journeyEventType) return null;

    return {
        id: event.id,
        caseId: event.caseId,
        patientName: event.patientName,
        phase: getPhase(event.eventType),
        type: journeyEventType,
        timestamp: event.timestamp,
        actorName: event.actorName,
        description: event.description,
        rawRefId: event.id,
        source: event.source,
        financialImpact: event.eventType === 'auth_status_changed' && event.details?.newValue === 'Denied' ? -1 : 0,
    };
};

const injectCounterfactuals = (events: JourneyEvent[]): JourneyEvent[] => {
    const newEvents = [...events];
    
    const authDenial = events.find(e => e.type === 'auth_denied');
    if (authDenial) {
        const clinicalsUploaded = events.some(e => 
            e.type === 'doc_received' && new Date(e.timestamp) < new Date(authDenial.timestamp)
        );
        if (!clinicalsUploaded) {
            const ghostEvent: JourneyEvent = {
                id: `ghost_clinicals_${authDenial.id}`,
                caseId: authDenial.caseId,
                phase: 'clinical',
                type: 'doc_requested',
                timestamp: new Date(new Date(authDenial.timestamp).getTime() - 24 * 60 * 60 * 1000).toISOString(),
                description: 'Clinical documentation was not received from the provider before denial.',
                isCounterfactual: true,
                source: 'ai',
                actorName: 'AI Analyst',
            };
            newEvents.push(ghostEvent);
        }
    }

    return newEvents;
};

const generatePredictiveNextStep = (lastEvent: JourneyEvent | undefined): PredictiveNextStep | null => {
    if (!lastEvent) return null;

    switch (lastEvent.type) {
        case 'auth_denied':
            return {
                action: 'Submit Appeal',
                rationale: 'The prior authorization was denied. The next logical step is to appeal the payer\'s decision with additional documentation.',
                confidence: 0.95,
                source: 'ai',
            };
        case 'auth_approved':
            return {
                action: 'Finalize Patient Estimate',
                rationale: 'With authorization secured, the patient\'s financial responsibility should be calculated and confirmed.',
                confidence: 0.98,
                source: 'ai',
            };
        case 'eligibility_run':
            return {
                action: 'Submit Authorization Request',
                rationale: 'Eligibility is confirmed. If authorization is required for the planned procedures, it should be submitted now to avoid delays.',
                confidence: 0.90,
                source: 'ai',
            };
        case 'closed':
            return {
                action: 'No further action needed',
                rationale: 'This case has been financially cleared and is ready for service.',
                confidence: 1.0,
                source: 'ai',
            };
        default:
            return null;
    }
};


const buildJourneyGraph = (events: JourneyEvent[]): JourneyGraph => {
    const sortedEvents = [...events].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const nodes: JourneyGraph['nodes'] = sortedEvents.map(e => ({
        id: e.id,
        label: e.type.replace(/_/g, ' '),
        phase: e.phase,
        timestamp: e.timestamp,
    }));
    const edges: JourneyGraph['edges'] = [];
    for (let i = 0; i < sortedEvents.length - 1; i++) {
        const fromNode = sortedEvents[i];
        const toNode = sortedEvents[i+1];
        const durationMins = Math.round((new Date(toNode.timestamp).getTime() - new Date(fromNode.timestamp).getTime()) / (1000 * 60));
        edges.push({ from: fromNode.id, to: toNode.id, durationMins });
    }
    return { nodes, edges };
};

const detectJourneyGaps = (events: JourneyEvent[]): JourneyGap[] => {
    const gaps: JourneyGap[] = [];
    const sortedEvents = [...events].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const gapChecks: { from: JourneyEventType, to: JourneyEventType, thresholdHours: number }[] = [
        { from: 'eligibility_run', to: 'auth_submitted', thresholdHours: 24 },
        { from: 'auth_approved', to: 'estimate_revised', thresholdHours: 24 },
    ];
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
        const fromEvent = sortedEvents[i];
        const toEvent = sortedEvents[i+1];

        for (const check of gapChecks) {
            // Find the latest 'from' event and the earliest 'to' event
            const potentialFrom = sortedEvents.slice(0, i + 1).reverse().find(e => e.type === check.from);
            const potentialTo = sortedEvents.slice(i + 1).find(e => e.type === check.to);

            if(potentialFrom && potentialTo) {
                const durationHours = (new Date(potentialTo.timestamp).getTime() - new Date(potentialFrom.timestamp).getTime()) / (1000 * 3600);
                if (durationHours > check.thresholdHours) {
                    const gapId = `gap_${potentialFrom.id}_${potentialTo.id}`;
                    if(!gaps.some(g => g.id === gapId)) {
                        gaps.push({
                            id: gapId,
                            caseId: fromEvent.caseId,
                            type: 'journey_gap',
                            startTimestamp: potentialFrom.timestamp,
                            endTimestamp: potentialTo.timestamp,
                            durationHours: Math.round(durationHours),
                            description: `Delay between ${potentialFrom.type.replace(/_/g, ' ')} and ${potentialTo.type.replace(/_/g, ' ')}.`
                        });
                    }
                }
            }
        }
    }
    return gaps;
};

const calculateConformanceScore = (events: JourneyEvent[]): number => {
    const idealPath = ['case_created', 'eligibility_run', 'auth_submitted', 'auth_approved', 'estimate_revised', 'closed'];
    const actualPath = events.map(e => e.type);
    let deviations = 0;
    
    // Simple deviation check
    if (actualPath.includes('auth_denied')) deviations += 1;
    if (actualPath.filter(p => p === 'eligibility_run').length > 1) deviations += 1;

    const conformance = 1 - (deviations / idealPath.length);
    return Math.round(Math.max(0, conformance * 100));
};

const filterJourneyForPersona = (events: JourneyEvent[], persona: JourneyPersona): JourneyEvent[] => {
    if (persona === 'ops') {
        return events;
    }

    return events
        .map((event): JourneyEvent | null => {
            let newDescription = event.description;
            let includeEvent = true;
            
            if (persona === 'provider') {
                switch(event.type) {
                    case 'case_created': newDescription = `Case created for patient.`; break;
                    case 'eligibility_run': newDescription = 'Patient eligibility verified.'; break;
                    case 'auth_submitted': newDescription = `Authorization submitted to payer.`; break;
                    case 'auth_denied': newDescription = `Authorization DENIED by payer.`; break;
                    case 'auth_approved': newDescription = `Authorization APPROVED by payer.`; break;
                    case 'estimate_revised': newDescription = `Patient estimate updated based on auth status.`; break;
                    case 'doc_received': newDescription = `Clinical documentation received.`; break;
                    case 'note_added': newDescription = `A new clinical note was added.`; break;
                    case 'closed': newDescription = `Pre-service financial clearance complete.`; break;
                    default: includeEvent = false;
                }
            } else if (persona === 'patient') {
                switch(event.type) {
                    case 'case_created': newDescription = `We started preparing for your upcoming service.`; break;
                    case 'eligibility_run': newDescription = `We successfully verified your insurance coverage.`; break;
                    case 'auth_submitted': newDescription = `We submitted a request for approval to your insurance plan.`; break;
                    case 'auth_denied': newDescription = `Your insurance plan did not approve the service. We are working to resolve this.`; break;
                    case 'auth_approved': newDescription = `Your insurance plan approved the service.`; break;
                    case 'estimate_revised': newDescription = `Your good faith estimate has been updated.`; break;
                    case 'closed': newDescription = `Your financial clearance is complete.`; break;
                    default: includeEvent = false;
                }
            }

            if (!includeEvent) return null;
            return { ...event, description: newDescription, actorName: persona === 'patient' ? 'Our Team' : event.actorName };
        })
        .filter((e): e is JourneyEvent => e !== null);
};


export const getCuratedJourneyForCase = (caseId: string, persona: JourneyPersona): { 
    events: (JourneyEvent | JourneyGap)[], 
    graph: JourneyGraph,
    summary: { duration: string; denials: number; conformanceScore: number },
    predictiveNextStep: PredictiveNextStep | null 
} => {
    const history = getHistoryForCase(caseId).flatMap(e => e.eventType === 'thread_summary' && e.childEvents ? e.childEvents : e);

    const upliftedEvents = history
        .map(upliftTemporalToJourney)
        .filter((e): e is JourneyEvent => e !== null);

    const eventsWithCounterfactuals = injectCounterfactuals(upliftedEvents);
    
    const curatedEvents = eventsWithCounterfactuals;
    curatedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const personaFilteredEvents = filterJourneyForPersona(curatedEvents, persona);

    const graph = buildJourneyGraph(personaFilteredEvents);
    const gaps = persona === 'ops' ? detectJourneyGaps(curatedEvents) : []; 

    const lastChronologicalEvent = curatedEvents.length > 0 ? curatedEvents[curatedEvents.length - 1] : undefined;
    const predictiveNextStep = generatePredictiveNextStep(lastChronologicalEvent);
    
    let duration = 'N/A';
    if (curatedEvents.length > 1) {
        const firstEventTime = new Date(curatedEvents[0].timestamp).getTime();
        const lastEventTime = new Date(curatedEvents[curatedEvents.length - 1].timestamp).getTime();
        const diffHours = (lastEventTime - firstEventTime) / (1000 * 60 * 60);
        if (diffHours < 24) { duration = `${Math.round(diffHours)} hours`; } 
        else { duration = `${Math.round(diffHours / 24)} days`; }
    }
    const denials = curatedEvents.filter(e => e.type === 'auth_denied').length;
    const conformanceScore = calculateConformanceScore(curatedEvents);

    const combinedTimelineItems = [...personaFilteredEvents, ...gaps]
        .sort((a, b) => {
            const timeA = new Date('startTimestamp' in a ? a.startTimestamp : a.timestamp).getTime();
            const timeB = new Date('startTimestamp' in b ? b.startTimestamp : b.timestamp).getTime();
            return timeB - timeA;
        });

    return {
        events: combinedTimelineItems,
        graph,
        summary: { duration, denials, conformanceScore },
        predictiveNextStep
    };
};