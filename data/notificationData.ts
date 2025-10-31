import { Notification } from '../types';

const now = new Date();
const past = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

export const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    channel: 'auth',
    type: 'auth_expired',
    title: 'Auth Expired for John Smith',
    description: 'Prior auth #12345 for CPT 27447 expired yesterday.',
    timestamp: past(1440), // 1 day ago
    caseId: '123456',
    patientName: 'John Smith',
    priority: 'critical',
    isRead: false,
    actions: [{ label: 'Re-submit Auth', type: 'link', url: '/case/123456/auth', primary: true }],
    metadata: {
      payer: 'Aetna',
      daysUntilExpiration: -1,
      caseValue: 32000,
      workflowStep: 'pre_service',
      dos: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ai: {
      explanation: 'This authorization expired, putting a high-value case at immediate risk of denial.',
    },
  },
  {
    id: 'notif_2',
    channel: 'eligibility',
    type: 'eligibility_change',
    title: 'Eligibility Change: Maria Garcia',
    description: 'Primary coverage with UHC has terminated. Secondary BCBS is now primary.',
    timestamp: past(120), // 2 hours ago
    caseId: '654321',
    patientName: 'Maria Garcia',
    priority: 'high',
    isRead: false,
    actions: [{ label: 'Update COB', type: 'link', url: '/case/654321/coverage' }],
    metadata: {
      payer: 'UnitedHealthcare',
      workflowStep: 'pre_service',
      dos: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 'notif_3',
    channel: 'rcm',
    type: 'high_denial_risk',
    title: 'High Denial Risk Detected',
    description: 'Case 789012 for Cigna has a high probability of medical necessity denial.',
    timestamp: past(15), // 15 minutes ago
    caseId: '789012',
    patientName: 'David Chen',
    priority: 'high',
    isRead: true,
    actions: [{ label: 'Review Case', type: 'link', url: '/case/789012', primary: true }],
    metadata: {
      payer: 'Cigna',
      denialRiskScore: 88,
      caseValue: 1200,
      workflowStep: 'pre_service',
    },
    ai: {
      explanation: 'Our model predicts an 88% chance of denial based on the provided DX/CPT combo for this payer.',
      suggestedActions: [{ label: 'Draft LMN', confidence: 0.95 }, { label: 'Contact Provider', confidence: 0.8 }],
    },
  },
  {
    id: 'notif_4',
    channel: 'ops',
    type: 'submission_failed',
    title: '270 Submission Failed',
    description: 'Eligibility check for patient Eleanor Vance failed. Payer endpoint returned a 503 error.',
    timestamp: past(5), // 5 minutes ago
    caseId: '112233',
    patientName: 'Eleanor Vance',
    priority: 'medium',
    isRead: false,
    actions: [{ label: 'Retry Submission', type: 'api_call', api: '/api/eligibility/retry' }],
    metadata: {
      payer: 'BCBS',
      source: 'EDI Gateway',
    },
  },
  {
    id: 'notif_5',
    channel: 'estimate',
    type: 'estimate_changed',
    title: 'Estimate Ready for Review',
    description: 'The patient estimate for Thomas Anderson is complete and requires your review before sending.',
    timestamp: past(240), // 4 hours ago
    caseId: '445566',
    patientName: 'Thomas Anderson',
    priority: 'low',
    isRead: true,
    actions: [{ label: 'Review & Send', type: 'link', url: '/case/445566/estimate' }],
    metadata: {
      caseValue: 550,
      workflowStep: 'pre_service',
    },
  },
  {
    id: 'notif_6',
    channel: 'auth',
    type: 'auth_expiring',
    title: 'Auth for Sophia Jones Expiring Soon',
    description: 'Auth #A9876 for CPT 71250 will expire in 2 days.',
    timestamp: past(2880), // 2 days ago
    caseId: '778899',
    patientName: 'Sophia Jones',
    priority: 'medium',
    isRead: false,
    actions: [{ label: 'View Case', type: 'link', url: '/case/778899' }],
    metadata: {
      payer: 'Humana',
      daysUntilExpiration: 2,
      caseValue: 850,
      dos: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
   {
    id: 'notif_7',
    channel: 'ai',
    type: 'ai_recommendation',
    title: 'AI Suggestion: Re-verify Eligibility',
    description: 'We detected a pattern of recent eligibility drops for this Cigna plan. Recommend re-verifying for case 998877.',
    timestamp: past(60), // 1 hour ago
    caseId: '998877',
    patientName: 'Isabella Williams',
    priority: 'medium',
    isRead: false,
    actions: [{ label: 'Re-verify Now', type: 'api_call', api: '/api/eligibility/reverify/998877' }],
    metadata: {
      payer: 'Cigna',
      clusterKey: 'cigna-ppo-silver',
    },
    ai: {
        explanation: "Gemini detected an 80% increase in retroactive eligibility terminations for Cigna's PPO Silver plan this week. This case falls into that cohort.",
        confidence: 0.92
    }
  },
];
