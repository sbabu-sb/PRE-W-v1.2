import { WorklistPatient, RankedCase, UserActivity, Notification, CaseReminder, CaseStatus } from "../types";

// In a real app, this would be dynamically determined.
const CURRENT_USER_NAME = 'Maria Garcia';
type UserRole = 'Auth Specialist' | 'Financial Counselor' | 'Generalist';

/**
 * Work Relevance Ranker (WRR) v1.2 - Self-Learning Simulation
 * Calculates a relevance score for a case based on critical RCM signals,
 * cross-signal context, and simulated personalization.
 */
const calculateWorkRelevanceScore = (
    patient: WorklistPatient,
    context: {
        isNotified?: boolean;
        hasActivity?: boolean;
        activeCaseCount?: number;
        userRole: UserRole;
        userActivities: UserActivity[];
    }
): { score: number; explanation: string[]; personalizationSignals: string[] } => {
    let score = 0;
    const explanation: { text: string; priority: number }[] = [];
    const personalizationSignals: string[] = [];

    // 1. Time Criticality (DOS Proximity)
    const serviceDate = new Date(patient.metaData.service.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilService = (serviceDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

    if (daysUntilService < 1) { score += 50; explanation.push({ text: 'DOS Today', priority: 100 }); }
    else if (daysUntilService < 3) { score += 30; explanation.push({ text: `DOS in ${Math.ceil(daysUntilService)} days`, priority: 90 }); }

    // 2. Authorization Risk
    if (patient.authStatus === 'Required' || patient.authStatus === 'Denied') { score += 40; explanation.push({ text: `Auth ${patient.authStatus}`, priority: 95 }); }

    // 3. Financial Impact
    const value = patient.estimatedResponsibility ?? 0;
    if (value > 10000) { score += 35; explanation.push({ text: 'High Value', priority: 80 }); }
    else if (value > 2000) { score += 15; explanation.push({ text: 'Med Value', priority: 40 }); }

    // 4. Workload Blockers
    if (patient.financialClearance === 'Blocked') { score += 25; explanation.push({ text: 'Blocked', priority: 85 }); }
    
    // --- Phase 9.4: Self-Learning Simulation ---
    
    // 4.1. Simulated Role-Based LTR
    if (context.userRole === 'Auth Specialist' && (patient.authStatus === 'Required' || patient.authStatus === 'Denied')) {
        score += 20; // Role-specific boost for auth issues
        personalizationSignals.push('Auth-focus role');
    }
    if (context.userRole === 'Financial Counselor' && value > 5000) {
        score += 15; // Role-specific boost for high value cases
        personalizationSignals.push('Financial-focus role');
    }

    // 4.2. Simulated User-Activity Embeddings (Payer Focus)
    if (context.userActivities.length > 2) {
        const payerCounts = context.userActivities.reduce((acc, act) => {
            const p = allPatients.find(p => p.id === act.caseId);
            if (p) {
                const payerName = p.payers[0]?.insurance.name;
                if (payerName) {
                    acc[payerName] = (acc[payerName] || 0) + 1;
                }
            }
            return acc;
        }, {} as Record<string, number>);

        const recentPayers = Object.entries(payerCounts).sort((a, b) => b[1] - a[1]);
        if (recentPayers.length > 0) {
            const topPayer = recentPayers[0][0];
            if (patient.payers[0]?.insurance.name === topPayer) {
                score += 10; // Personalization boost for matching recent work
                personalizationSignals.push(`Matches recent work (${topPayer})`);
            }
        }
    }
    
    // --- End Phase 9.4 ---


    // 5. Cross-Signal De-duplication (Score Modifier)
    if (context.isNotified) { score *= 0.9; }

    // 6. Workload Shaping (Score Modifier)
    if ((context.activeCaseCount || 0) > 15 && score < 40) { score *= 0.8; }

    // 7. Add activity explanation
    if (context.hasActivity) { explanation.push({ text: 'You touched', priority: 5 }); }

    // 8. Default "Assigned to you" explanation if no other high-priority signals
    if (explanation.filter(e => e.text !== 'You touched').length === 0) { explanation.push({ text: 'Assigned to you', priority: 10 }); }

    const sortedExplanations = explanation.sort((a, b) => b.priority - a.priority).map(e => e.text);

    return { score, explanation: sortedExplanations, personalizationSignals };
};

// Dummy reference to allPatients for the simulation logic
let allPatients: WorklistPatient[] = [];

/**
 * Gets cases for the "For You" feed.
 * Phase 9.4: Uses the WRR to score and rank assigned cases, incorporating cross-signal context and personalization.
 */
export const getForYouCases = (
    _allPatients: WorklistPatient[],
    notifications: Notification[],
    reminders: CaseReminder[],
    userActivities: UserActivity[],
    userRole: UserRole
): RankedCase[] => {
    allPatients = _allPatients; // Update the reference
    const notifiedCaseIds = new Set(notifications.filter(n => n.priority === 'critical' && !n.isRead).map(n => n.caseId));
    const reminderCaseIds = new Set(reminders.filter(r => r.status !== 'completed').map(r => r.caseId));
    const activityCaseIds = new Set(userActivities.map(a => a.caseId));
    const activeCaseCount = allPatients.filter(p => p.assignedTo.name === CURRENT_USER_NAME && p.status === CaseStatus.ACTIVE).length;

    return allPatients
        .filter(p => p.assignedTo.name === CURRENT_USER_NAME)
        .map(p => {
            const context = {
                isNotified: notifiedCaseIds.has(p.id),
                isReminder: reminderCaseIds.has(p.id),
                hasActivity: activityCaseIds.has(p.id),
                activeCaseCount,
                userRole,
                userActivities,
            };
            const { score, explanation, personalizationSignals } = calculateWorkRelevanceScore(p, context);
            
            return {
                caseId: p.id,
                patientName: p.metaData.patient.name,
                relevanceScore: score,
                explanation,
                personalizationSignals,
                isNotified: context.isNotified,
                isReminder: context.isReminder,
            };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

/**
 * Gets cases for the "By You" feed.
 * Phase 9.2: Uses a recency-weighted score for ranking.
 */
export const getByYouCases = (
    _allPatients: WorklistPatient[],
    userActivities: UserActivity[]
): RankedCase[] => {
    const patientMap = new Map<string, WorklistPatient>(_allPatients.map(p => [p.id, p]));

    return userActivities
        .map((activity): RankedCase | null => {
            const patient = patientMap.get(activity.caseId);
            if (!patient) return null;

            // Simple recency score: more recent = higher score
            const hoursAgo = (new Date().getTime() - new Date(activity.lastInteraction).getTime()) / (1000 * 60 * 60);
            const relevanceScore = Math.max(0, 100 - hoursAgo); 

            return {
                caseId: patient.id,
                patientName: patient.metaData.patient.name,
                relevanceScore: relevanceScore,
                explanation: activity.interactionTypes as string[],
                lastAction: activity.lastAction,
                lastInteraction: activity.lastInteraction,
            };
        })
        .filter((c): c is RankedCase => c !== null)
        .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by recency score
};