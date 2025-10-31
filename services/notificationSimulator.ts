import { Notification } from '../types';
import { INSURANCE_PAYERS } from '../constants';

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const firstNames = ['Eleanor', 'David', 'Maria', 'Thomas', 'Sophia', 'James'];
const lastNames = ['Vance', 'Chen', 'Garcia', 'Anderson', 'Smith', 'Jones'];

const syntheticSources = [
  { type: 'auth_expired', weight: 0.4 },
  { type: 'eligibility_change', weight: 0.25 },
  { type: 'submission_failed', weight: 0.2 },
  { type: 'estimate_changed', weight: 0.1 },
  { type: 'high_denial_risk', weight: 0.05 },
] as const;

type SyntheticType = typeof syntheticSources[number]['type'];

const baseNotificationData: Record<SyntheticType, Partial<Notification>> = {
    auth_expired: {
        channel: 'auth',
        title: 'Auth Expired',
        description: 'Prior auth #SIM-12345 for CPT 27447 expired.',
        priority: 'critical',
        metadata: {
            daysUntilExpiration: -1,
            caseValue: 32000,
        },
    },
    eligibility_change: {
        channel: 'eligibility',
        title: 'Eligibility Change',
        description: 'Primary coverage has terminated.',
        priority: 'high',
    },
    submission_failed: {
        channel: 'ops',
        title: '270 Submission Failed',
        description: 'Eligibility check failed due to a simulated endpoint error.',
        priority: 'medium',
    },
    estimate_changed: {
        channel: 'estimate',
        title: 'Estimate Ready for Review',
        description: 'A simulated patient estimate requires your review.',
        priority: 'low',
        metadata: { caseValue: 550 },
    },
    high_denial_risk: {
        channel: 'rcm',
        title: 'High Denial Risk Detected',
        description: 'Simulated case has a high probability of denial.',
        priority: 'high',
        metadata: { denialRiskScore: 88, caseValue: 1200 },
    },
};

export function generateSyntheticNotification(): Notification {
    const random = Math.random();
    let cumulativeWeight = 0;
    const sourceType = syntheticSources.find(source => {
        cumulativeWeight += source.weight;
        return random < cumulativeWeight;
    })?.type || 'auth_expired';

    const baseData = baseNotificationData[sourceType];
    const patientName = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
    const caseId = Math.floor(100000 + Math.random() * 900000).toString();
    const payer = getRandomItem(INSURANCE_PAYERS.slice(0, 10)); // Use common payers

    return {
        id: `sim_${crypto.randomUUID()}`,
        isRead: false,
        actions: [{ label: 'Review Case', type: 'link', url: `/case/${caseId}`, primary: true }],
        timestamp: new Date().toISOString(),
        patientName,
        caseId,
        ...baseData,
        title: `${baseData.title} for ${patientName}`,
        metadata: {
            ...baseData.metadata,
            payer,
            clusterKey: `${payer.toLowerCase().replace(' ', '')}-${sourceType.split('_')[0]}`,
            workflowStep: 'pre_service',
            synthetic: true,
        },
    } as Notification;
}
