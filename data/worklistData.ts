// @ts-nocheck
import { WorklistPatient, CaseStatus, CaseEvent, Procedure, Benefits, Accumulators, Payer, MetaData, PriorityDetails, TopFactor } from '../types';
import { INSURANCE_PAYERS, PayerType, CobMethod } from '../constants';
import { generateLuhnCaseId } from '../utils/caseIdGenerator';

const firstNames = ['Eleanor', 'David', 'Maria', 'Thomas', 'Sophia', 'James', 'Isabella', 'William', 'Olivia', 'John', 'Emma', 'Liam', 'Ava', 'Noah', 'Mia', 'Lucas'];
const lastNames = ['Vance', 'Chen', 'Garcia', 'Anderson', 'Smith', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Lee', 'Walker', 'Hall'];
const fixedProvider = { name: 'Dr. Kara Ewing', npi: '1528208204', phone: '(555) 123-4567' };
const providers = [
    fixedProvider,
    { name: 'Dr. Montague', npi: '1987654321', phone: '(555) 111-2222' },
    { name: 'Dr. Emily Carter', npi: '1234567893', phone: '(555) 555-5555' },
    { name: 'Dr. Smith', npi: '1234567890', phone: '(555) 555-5555' },
    { name: 'Dr. Allen', npi: '1122334455', phone: '(555) 666-7777' }
];
const practices = [
    { name: 'Ortho Associates', taxId: '987654321' },
    { name: 'General Medical Clinic', taxId: '123456789' },
    { name: 'Downtown Health', taxId: '112233445' }
];
const teamMembers = [
    { name: 'Maria Garcia', avatarUrl: 'https://i.pravatar.cc/150?u=mariagarcia', role: 'Financial Counselor' },
    { name: 'David Chen', avatarUrl: 'https://i.pravatar.cc/150?u=davidchen', role: 'Auth Specialist' },
    { name: 'J. Smith', avatarUrl: 'https://i.pravatar.cc/150?u=jsmith', role: 'Supervisor' },
    { name: 'Unassigned', avatarUrl: '', role: 'Unassigned' },
];
const proceduresList: Partial<Procedure>[] = [
    { cptCode: '27447', billedAmount: '32000', dxCode: 'M17.11', category: 'Surgery', acuity: 'elective' },
    { cptCode: '99214', billedAmount: '250', dxCode: 'J02.9', category: 'Office Visit', acuity: 'standard' },
    { cptCode: '87880', billedAmount: '85', dxCode: 'J02.9', category: 'Lab', acuity: 'standard' },
    { cptCode: '71250', billedAmount: '850', dxCode: 'S62.60XA', category: 'Imaging', acuity: 'urgent' },
    { cptCode: 'G0202', billedAmount: '450', dxCode: 'Z12.31', category: 'Screening', isPreventive: true },
    { cptCode: '99285', billedAmount: '1200', dxCode: 'R07.9', category: 'Emergency', acuity: 'urgent' },
    { cptCode: '93010', billedAmount: '150', dxCode: 'I20.9', category: 'Cardiology', acuity: 'standard' }
];

// --- GCPE 2.0 IMPLEMENTATION (Phase 13) ---

// Internal types for the engine
interface Driver {
  label: string;
  weight: number; // Raw score contribution
  factor: 'financialImpact' | 'clinicalTimePressure' | 'complianceRisk' | 'workflowDisruption' | 'roleAffinity' | 'recurrencePenalty';
}

interface CohortStats {
  mean: number;
  stdDev: number;
  p95: number;
  p99: number;
}

// Mock Cohort Stats Provider
const MOCK_COHORT_STATS: Record<string, CohortStats> = {
    'default': { mean: 65, stdDev: 15, p95: 85, p99: 95 },
    'Auth Specialist': { mean: 70, stdDev: 12, p95: 90, p99: 97 },
    'Financial Counselor': { mean: 60, stdDev: 18, p95: 88, p99: 96 },
    'Supervisor': { mean: 75, stdDev: 10, p95: 92, p99: 98 },
};

const getCohortStats = (role: string): CohortStats => {
    return MOCK_COHORT_STATS[role] || MOCK_COHORT_STATS['default'];
};

// Main GCPE 2.0 Scoring Engine
const generatePriorityScoreGCPE = (
    patient: { id: string, procedures: Procedure[], metaData: MetaData, payers: Payer[], lastUpdated: string },
    financialClearance: WorklistPatient['financialClearance'],
    authStatus: WorklistPatient['authStatus'],
    userRole: string
): PriorityDetails => {
    
    const drivers: Driver[] = [];
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    // 1. Raw Factor Calculation
    const primaryProcedure = patient.procedures[0];
    const caseValue = Number(primaryProcedure?.billedAmount) || 0;
    const denialProbability = Math.random() * 0.4 + 0.05; // Mocked
    const financialImpact = clamp((caseValue * denialProbability) / 100, 0, 100);
    if (caseValue > 1000) {
        drivers.push({ factor: 'financialImpact', weight: financialImpact, label: `High Value Case ($${caseValue.toLocaleString()})` });
    }

    const serviceDate = new Date(patient.metaData.service.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilService = (serviceDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    let clinicalTimePressure = 0;
    if (daysUntilService < 0) clinicalTimePressure = 100;
    else if (daysUntilService <= 1) clinicalTimePressure = 90;
    else if (daysUntilService <= 3) clinicalTimePressure = 75;
    else if (daysUntilService <= 7) clinicalTimePressure = 50;
    else clinicalTimePressure = 10;
    if (clinicalTimePressure > 40) {
        drivers.push({ factor: 'clinicalTimePressure', weight: clinicalTimePressure, label: `DOS in ${Math.ceil(daysUntilService)} days` });
    }

    let complianceRisk = 0;
    if (authStatus === 'Required' || authStatus === 'Denied') complianceRisk = 90;
    else if (patient.payers[0]?.networkStatus === 'out-of-network') complianceRisk = 75;
    if (complianceRisk > 70) {
        drivers.push({ factor: 'complianceRisk', weight: complianceRisk, label: `Auth Status: ${authStatus || 'N/A'}` });
    }
    
    // Mocked factors
    const workflowDisruption = Math.random() > 0.8 ? 80 : 20;
    if (workflowDisruption > 50) drivers.push({ factor: 'workflowDisruption', weight: workflowDisruption, label: `Blocks 3 downstream steps` });
    
    let roleAffinity = 1.0;
    if (userRole === 'Auth Specialist' && (authStatus === 'Required' || authStatus === 'Denied')) roleAffinity = 1.2;
    if (userRole === 'Financial Counselor' && caseValue > 5000) roleAffinity = 1.2;
    if (roleAffinity > 1.0) drivers.push({ factor: 'roleAffinity', weight: (roleAffinity - 1) * 100, label: `Perfect fit for ${userRole}` });

    // 2. Time Decay/Boost (Simplified) & Recurrence Penalty
    let timeAdjustment = 1.0;
    let recurrencePenalty = 0;
    const hoursSinceUpdate = (new Date().getTime() - new Date(patient.lastUpdated).getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate > 48) {
        timeAdjustment = 0.8; // Decay stale items
        recurrencePenalty = -20;
        drivers.push({ factor: 'recurrencePenalty', weight: recurrencePenalty, label: `Stale item (>${Math.round(hoursSinceUpdate)}h)` });
    }
    if (daysUntilService < 1) timeAdjustment = 1.25; // Boost urgent items

    // Apply weights
    const factorWeights = { financialImpact: 0.28, clinicalTimePressure: 0.22, complianceRisk: 0.18, workflowDisruption: 0.17, roleAffinity: 0.10, recurrencePenalty: 0.05 };
    let rawPriority =
      (financialImpact * factorWeights.financialImpact) +
      (clinicalTimePressure * factorWeights.clinicalTimePressure) +
      (complianceRisk * factorWeights.complianceRisk) +
      (workflowDisruption * factorWeights.workflowDisruption) +
      (drivers.find(d => d.factor === 'roleAffinity')?.weight || 0) * factorWeights.roleAffinity +
      (recurrencePenalty) * factorWeights.recurrencePenalty;
    
    rawPriority = rawPriority * timeAdjustment * roleAffinity;

    // 3. Cohort Normalization
    const cohortStats = getCohortStats(userRole);
    const z = (rawPriority - cohortStats.mean) / (cohortStats.stdDev || 1);
    const cohortScore = clamp(50 + (z * 15), 0, 100);
    const cohortPercentile = Math.round(clamp(cohortScore / 100 * 80 + 20, 0, 99)); // Mock percentile

    // 4. Dynamic Range Enforcement
    let finalScore;
    if (cohortScore >= cohortStats.p99) {
        finalScore = 95 + ((cohortScore - cohortStats.p99) / (100 - cohortStats.p99)) * 4.9;
    } else if (cohortScore >= cohortStats.p95) {
        finalScore = 90 + ((cohortScore - cohortStats.p95) / (cohortStats.p99 - cohortStats.p95)) * 4.9;
    } else {
        finalScore = cohortScore;
    }
    finalScore = clamp(finalScore, 15, 99.9);

    // 5. Action-Linked Drivers and Best Action
    const sortedDrivers = drivers.sort((a, b) => b.weight - a.weight);
    const topDriver = sortedDrivers[0];
    
    let nextBestAction: { code: string; display_text: string } = { code: 'REVIEW', display_text: 'Review Case Details' };
    if (topDriver) {
        switch(topDriver.factor) {
            case 'complianceRisk': nextBestAction = { code: 'RESOLVE_AUTH', display_text: 'Resolve Auth Risk' }; break;
            case 'clinicalTimePressure': nextBestAction = { code: 'PRIORITIZE_DOS', display_text: 'Prioritize for DOS' }; break;
            case 'financialImpact': nextBestAction = { code: 'SECURE_FINANCES', display_text: 'Secure High-Value Case' }; break;
            case 'workflowDisruption': nextBestAction = { code: 'UNBLOCK_WORKFLOW', display_text: 'Unblock Downstream Steps' }; break;
            default: break;
        }
    }
    
    // Map internal drivers to UI-compatible TopFactor[]
    const topFactors: TopFactor[] = drivers.map(d => ({
        feature: d.factor,
        value: d.label,
        impact: d.weight
    }));

    return {
        score: parseFloat(finalScore.toFixed(2)),
        topFactors: topFactors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
        nextBestAction: nextBestAction,
        modelConfidence: parseFloat((0.85 + Math.random() * 0.14).toFixed(2)),
        percentileRank: cohortPercentile,
    };
};

// --- END GCPE 2.0 IMPLEMENTATION ---

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start: Date, end: Date): string => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];

const createDefaultProcedure = (overrides: Partial<Procedure>): Procedure => ({
    id: crypto.randomUUID(),
    cptCode: '',
    billedAmount: '0',
    modifiers: '',
    dxCode: '',
    category: 'Medical/Surgical',
    units: 1,
    isPreventive: false,
    dateOfService: '',
    acuity: 'standard',
    authDetails: { loading: false, data: null, error: null },
    necessityDetails: { loading: false, data: null, error: null },
    payerIntel: { loading: false, data: null, error: null },
    policyDetails: { loading: false, data: null, error: null },
    icdSuggestions: { loading: false, data: null, error: null },
    ...overrides
});

const defaultBenefits: Benefits = {
    planType: 'EmbeddedFamily', copayLogic: 'standard_waterfall', deductibleAllocation: 'highest_allowed_first', multiProcedureLogic: '100_50_25',
    inNetworkIndividualDeductible: '5000', inNetworkIndividualOopMax: '8000', inNetworkFamilyDeductible: '10000', inNetworkFamilyOopMax: '16000', inNetworkCoinsurancePercentage: '20',
    outOfNetworkIndividualDeductible: '10000', outOfNetworkIndividualOopMax: '20000', outOfNetworkFamilyDeductible: '20000', outOfNetworkFamilyOopMax: '40000', outOfNetworkCoinsurancePercentage: '40',
    therapyVisitLimits: { physical: '30', occupational: '30', speech: '30' },
    dmeRentalCap: { applies: false, purchasePrice: '' },
};

const defaultAccumulators: Accumulators = {
    inNetworkDeductibleMet: '1250', inNetworkOopMet: '2500', outOfNetworkDeductibleMet: '0',
    outOfNetworkOopMet: '0',
    therapyVisitsUsed: { physical: 5, occupational: 2, speech: 0 },
    dmeRentalPaid: 0
};

const createPayer = (rank: 'Primary' | 'Secondary' | 'Tertiary', procedures: Procedure[], overrides: Partial<Payer>): Payer => ({
    id: crypto.randomUUID(),
    rank,
    insurance: { name: getRandomItem(INSURANCE_PAYERS), memberId: `W${Math.floor(Math.random() * 1e9)}` },
    networkStatus: 'in-network',
    payerType: PayerType.Commercial,
    subrogationActive: false,
    cobMethod: CobMethod.Traditional,
    benefits: defaultBenefits,
    patientAccumulators: defaultAccumulators,
    familyAccumulators: defaultAccumulators,
    procedureBenefits: procedures.map(p => ({ procedureId: p.id, allowedAmount: String(Number(p.billedAmount) * 0.6), copay: '50', coinsurancePercentage: '' })),
    ...overrides,
});

export const createNewWorklistPatient = (): WorklistPatient => {
    const randomProcedureInfo = getRandomItem(proceduresList);
    const procedures = [createDefaultProcedure(randomProcedureInfo)];
    const provider = fixedProvider;
    const practice = getRandomItem(practices);
    const serviceDate = new Date();
    serviceDate.setDate(serviceDate.getDate() + Math.floor(Math.random() * 60) - 15);
    const randomHour = Math.floor(Math.random() * 9) + 8; // 8am to 4pm
    const randomMinute = ['00', '15', '30', '45'][Math.floor(Math.random() * 4)];
    const time = `${String(randomHour).padStart(2, '0')}:${randomMinute}`;

    const meta: MetaData = {
        patient: { name: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`, dob: getRandomDate(new Date(1950, 0, 1), new Date(2005, 0, 1)), relationship: 'Self', gender: Math.random() > 0.5 ? 'Male' : 'Female' },
        practice,
        provider,
        service: { date: serviceDate.toISOString().split('T')[0], time: time, placeOfService: '11' }
    };

    const payers = [createPayer('Primary', procedures, {})];
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 5));
    const events: CaseEvent[] = [{ at: createdDate.toISOString(), by: 'System', type: 'CREATION' }];
    const assignedTo = getRandomItem(teamMembers);
    const statusOptions = [CaseStatus.NEW, CaseStatus.ACTIVE, CaseStatus.PENDING_EXTERNAL, CaseStatus.WAITING_INTERNAL, CaseStatus.ACTIVE, CaseStatus.NEW];
    const status = getRandomItem(statusOptions);
    
    const financialClearance = getRandomItem(['Cleared', 'Needs Review', 'Blocked']);
    const authStatusOptions: WorklistPatient['authStatus'][] = ['Required', 'Not Required', 'Submitted', 'Approved', 'Denied'];
    const authStatus = getRandomItem(authStatusOptions);
    
    const lastUpdated = new Date();
    lastUpdated.setHours(lastUpdated.getHours() - Math.floor(Math.random() * 72));

    const worklistPatientBase = {
        id: generateLuhnCaseId(),
        metaData: meta,
        payers,
        procedures,
        lastUpdated: lastUpdated.toISOString(),
    };
    
    const priorityDetails = generatePriorityScoreGCPE(worklistPatientBase, financialClearance, authStatus, assignedTo.role || 'Generalist');

    return {
        ...worklistPatientBase,
        financialClearance,
        authStatus,
        estimateStatus: getRandomItem(['Not Started', 'In Progress', 'Ready for Review']),
        estimatedResponsibility: status === CaseStatus.COMPLETED ? 0 : Math.random() > 0.5 ? parseFloat((Math.random() * 2000).toFixed(2)) : null,
        lastWorkedBy: getRandomItem(teamMembers.filter(t => t.name !== 'Unassigned')),
        assignedTo: assignedTo,
        priorityDetails: priorityDetails,
        isExplorationItem: Math.random() > 0.8,
        status,
        events,
    };
};

// Generate a list of 50 unique patients for the initial worklist
export const worklistData: WorklistPatient[] = Array.from({ length: 50 }, createNewWorklistPatient);