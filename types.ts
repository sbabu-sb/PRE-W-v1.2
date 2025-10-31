import { CobMethod, PayerType } from './constants';

export interface ApiState<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
  key?: string | null;
  cpt?: string;
}

export interface CptDetails {
  description: string;
  authRequired: boolean;
  notes: string;
  isDeprecated: boolean;
  deprecationNote: string | null;
  error?: string;
}

export interface NecessityDetails {
  denialRisk: 'Low' | 'Medium' | 'High';
  reason: string;
  mitigation: string;
  confidence: 'High' | 'Medium' | 'Low';
  modifierSuggestion: string | null;
}

export interface IcdSuggestion {
  code: string;
  description: string;
}

export interface IcdSuggestionsData {
  suggestions: IcdSuggestion[];
  note: string;
}

export interface PayerPolicy {
  policyRule: string;
  impact: 'Requires Prior Auth' | 'Not Covered' | 'Covered if Criteria Met' | 'Standard Coverage';
  source: string;
}

export interface PayerIntel {
  intel: string;
}

export interface BundlingAuditResult {
  codePair: [string, string];
  relationship: string;
  suggestion: string;
}

export interface BundlingAuditData {
  auditResults: BundlingAuditResult[];
  hasIssues: boolean;
  summary: string;
}

export interface NpiData {
  npi: string;
  isValid: boolean;
  isActive: boolean;
  providerName: string;
  primaryTaxonomy: string;
  address: string;
  error: string | null;
}

export interface Procedure {
  id: string;
  cptCode: string;
  billedAmount: string;
  modifiers: string;
  dxCode: string;
  category: string;
  units: number;
  isPreventive: boolean;
  dateOfService: string;
  acuity: 'standard' | 'elective' | 'urgent' | 'none';
  authDetails: ApiState<CptDetails>;
  necessityDetails: ApiState<NecessityDetails>;
  payerIntel: ApiState<PayerIntel>;
  policyDetails: ApiState<PayerPolicy>;
  icdSuggestions: ApiState<IcdSuggestionsData>;
}

export interface ProcedureBenefit {
  procedureId: string;
  allowedAmount: string;
  copay: string;
  coinsurancePercentage: string | null;
}

export interface Benefits {
  planType: 'EmbeddedFamily' | 'AggregateFamily' | 'Individual';
  copayLogic: 'standard_waterfall' | 'highest_copay_only_per_day' | 'copay_by_category_per_day' | 'copay_only_if_present';
  deductibleAllocation: 'highest_allowed_first' | 'line_item_order';
  multiProcedureLogic: '100_50_25' | '100_50_50';
  inNetworkIndividualDeductible: string;
  inNetworkIndividualOopMax: string;
  inNetworkFamilyDeductible: string;
  inNetworkFamilyOopMax: string;
  inNetworkCoinsurancePercentage: string;
  outOfNetworkIndividualDeductible: string;
  outOfNetworkIndividualOopMax: string;
  outOfNetworkFamilyDeductible: string;
  outOfNetworkFamilyOopMax: string;
  outOfNetworkCoinsurancePercentage: string;
  therapyVisitLimits: {
    physical: string;
    occupational: string;
    speech: string;
  };
  dmeRentalCap: {
    applies: boolean;
    purchasePrice: string;
  };
}

export interface Accumulators {
  inNetworkDeductibleMet: string;
  inNetworkOopMet: string;
  outOfNetworkDeductibleMet: string;
  outOfNetworkOopMet: string;
  therapyVisitsUsed: {
    physical: number;
    occupational: number;
    speech: number;
  };
  dmeRentalPaid: number;
}

export interface Payer {
  id: string;
  rank: 'Primary' | 'Secondary' | 'Tertiary';
  insurance: { name: string; memberId: string };
  networkStatus: 'in-network' | 'out-of-network';
  payerType: PayerType;
  subrogationActive: boolean;
  cobMethod: CobMethod;
  benefits: Benefits;
  patientAccumulators: Accumulators;
  familyAccumulators: Accumulators | null;
  procedureBenefits: ProcedureBenefit[];
}

export interface MetaData {
  patient: { name: string; dob: string; relationship: 'Self' | 'Spouse' | 'Child' | 'Other Dependent'; gender: string; };
  practice: { name: string; taxId: string };
  provider: { name: string; npi: string; phone: string };
  service: { date: string; time?: string; placeOfService: string };
}

export interface PropensityData {
  paymentHistory: 'on_time' | 'payment_plan' | 'sometimes_late' | 'difficulty' | '';
  financialConfidence: 'excellent' | 'good' | 'fair' | 'needs_improvement' | '';
  outstandingBalance: string;
  employmentStatus: 'employed' | 'unemployed' | 'student' | 'retired' | 'other' | '';
  householdIncome: '<25k' | '25k-50k' | '50k-100k' | '100k-200k' | '>200k' | '';
  householdSize: string;
  isHSACompatible: boolean;
}

export interface PayerVerificationDetails {
  payerId: string;
  authStatus: 'Required' | 'Not Required' | 'Not Checked';
  authPredictionReasoning: string;
  authPredictionConfidence: 'High' | 'Medium' | 'Low' | null;
  edi270Submitted: string | null;
  edi271Response: string | null;
  reVerifying?: boolean;
}

export interface VerificationResult {
  overallEligibilityStatus: 'Active' | 'Inactive' | 'Error';
  eligibilityNotes: string;
  payerVerifications: Record<string, PayerVerificationDetails>; // Keyed by Payer ID
  authRequiredForAnyPayer: boolean;
}

export interface RiskFactor {
    id: string;
    text: string;
    impact: 'High' | 'Medium' | 'Low';
    category: 'Eligibility' | 'Authorization' | 'Coding' | 'Provider Data' | 'Other';
    scoreImpact: number; 
}

export interface PaymentLikelihood {
    likelihood: "High" | "Medium" | "Low" | "Very Low";
    confidence: "High" | "Medium" | "Low";
    keyFactors: RiskFactor[];
    recommendation: string;
    error?: string;
}

export interface BreakdownStep {
  description: string;
  patientOwes: number;
  notes: string;
}

export interface AdjudicatedProcedure {
  id: string;
  cptCode: string;
  originalBilledAmount: number;
  patientCostShare: number;
  payerPayment: number;
  balanceAfterPayer: number;
  finalAllowedAmount: number;
  calculationBreakdown: BreakdownStep[];
  processingOrder: number | null;
}

export interface AdjudicationForPayer extends Payer {
    procedureEstimates: AdjudicatedProcedure[];
    totalPayerPaymentThisPayer: number;
    totalPatientShareThisPayer: number;
    totalRemainingBalanceAfterPayer: number;
}

export interface PropensityResult {
    score: number;
    tier: 'High' | 'Medium' | 'Low';
    recommendation: string;
    dynamicActions: { text: string; type: 'primary' | 'secondary' }[];
    factors: Record<string, number>;
}

export interface EstimateData {
  metaData: MetaData;
  payers: Payer[];
  procedures: Procedure[];
  totalPatientResponsibility: number;
  adjudicationChain: AdjudicationForPayer[];
  propensity: PropensityResult | null;
  nonCobPatientLiability: Record<string, number>;
}

export interface AiEstimatePayerResult {
    payerName: string;
    estimatedPayment: number;
    patientShare: number;
    notes: string;
}

export interface AiEstimate {
    primaryPayer: AiEstimatePayerResult;
    secondaryPayer: AiEstimatePayerResult | null;
    tertiaryPayer: AiEstimatePayerResult | null;
    finalPatientResponsibility: number;
    overallConfidence: 'High' | 'Medium' | 'Low';
    keyAssumptions: string[];
}

export interface AuthSubmissionState {
  loading: boolean;
  status: 'Pending' | 'Approved' | 'Rejected (More Info)' | null;
  generated278: string | null;
  authNumber: string | null;
  statusNotes: string | null;
}

export interface SearchResultItem {
  type: 'CPT' | 'ICD-10' | 'Payer';
  code: string;
  description: string;
  relevance: string;
}

export interface QuickAnswer {
  answer: string;
  confidence: 'High' | 'Medium' | 'Low';
  source: string;
}

export interface SearchResults {
  procedures: SearchResultItem[];
  diagnoses: SearchResultItem[];
  payers: SearchResultItem[];
  quickAnswer?: QuickAnswer | null;
}

// --- Create Case Page ---
export interface RuleCheck {
  id: 'eligibility' | 'authorization' | 'npi' | 'cob';
  status: 'pass' | 'fail' | 'warn' | 'pending';
  message: string;
}

// --- Enterprise Case Lifecycle & Disposition Engine (v3) ---

export enum CaseStatus {
  NEW = "New",
  ACTIVE = "Active",
  PENDING_EXTERNAL = "Pending External",
  WAITING_INTERNAL = "Waiting Internal",
  COMPLETED = "Completed",
  ARCHIVED = "Archived",
  REOPENED = "Reopened"
}

export interface CaseDisposition {
  outcome: string;
  summary: string;
  note?: string;
  finalizable?: boolean;
  attachments?: {
    authNumber?: string;
    payerRef?: string;
  }
}

export interface CaseEvent {
  at: string;                   // ISO
  by: string;                   // user id / system
  type: 'STATUS_CHANGE' | 'NOTE' | 'OVERRIDE' | 'REOPEN' | 'CREATION';
  from_status?: CaseStatus;
  to_status?: CaseStatus;
  payload?: any;
}

interface TopFactor {
  feature: string;
  value: string | number | null;
  impact: number;
}

interface NextBestAction {
  code: string;
  display_text: string;
}

interface PriorityDetails {
  score: number;
  topFactors: TopFactor[];
  nextBestAction: NextBestAction;
  modelConfidence?: number;
  percentileRank?: number;
}

export interface WorklistPatient {
    id: string;
    metaData: MetaData;
    payers: Payer[];
    procedures: Procedure[];
    financialClearance: 'Cleared' | 'Needs Review' | 'Blocked';
    authStatus?: 'Required' | 'Not Required' | 'Submitted' | 'Approved' | 'Denied';
    estimateStatus: 'Not Started' | 'In Progress' | 'Ready for Review' | 'Sent to Patient';
    estimatedResponsibility: number | null;
    lastUpdated: string;
    lastWorkedBy: { name: string; avatarUrl: string };
    assignedTo: { name: string; avatarUrl: string };
    priorityDetails?: PriorityDetails;
    isExplorationItem?: boolean;
    status: CaseStatus;
    disposition?: CaseDisposition;
    events: CaseEvent[];
}

export type SortKey = 'patient' | 'timeToService' | 'dos' | 'primaryPayer' | 'preServiceClearance' | 'estimateStatus' | 'lastWorkedBy' | 'assignedTo' | 'priority' | 'status' | 'id' | 'authStatus';

// --- Context-Aware Filtering (v4 - Enhanced) ---

export type FieldType =
  | 'numeric'
  | 'text'
  | 'date'
  | 'boolean'
  | 'enum'
  | 'multi-select';

export interface ColumnMetadata {
  id: SortKey;
  name: string;
  type: FieldType;
  description?: string;
  icon?: string;
  options?: readonly string[];
  isFilterable: boolean;
  isVisible: boolean;
  position: number;
  domain?: 'eligibility' | 'auth' | 'estimate' | 'demographics' | 'scheduling' | 'ops';
  groupable?: boolean;
  groupStrategy?: 'enum' | 'bucket' | 'date-range' | 'owner' | 'payer' | 'rcm-status';
  rcmDomain?: 'eligibility' | 'auth' | 'estimate' | 'patient' | 'scheduling';
}

export type FilterCondition =
  | 'is' | 'is-not' | 'contains' | 'does-not-contain'
  | 'is-empty' | 'is-not-empty'
  | 'greater-than' | 'less-than' | 'between'
  | 'is-before' | 'is-after'
  | 'is-any-of' | 'is-none-of'
  | 'includes-any-of' | 'includes-all-of' | 'excludes-all-of';

export interface FilterObject {
  id: string;
  fieldId: SortKey;
  fieldName: string;
  condition: FilterCondition;
  value?: any;
  value2?: any;
  values?: any[];
  isEnabled: boolean;
  source?: 'user' | 'ai' | 'system';
  explanation?: string;
}

export interface WorklistView {
  id: string;
  name: string;
  sortConfig: { key: SortKey; direction: 'asc' | 'desc' } | null;
  keywordFilter: string;
  filters: FilterObject[];
  groupingPath?: SortKey[];
}

// --- Grouping System (v6) ---
export interface GroupAggregations {
  totalValue: number;
  expiringAuths: number;
  blockedCases: number;
  unassignedCases: number;
}

export interface WorklistGroup {
    id: string; // A unique path-based ID, e.g., "payer:Aetna/authStatus:Pending"
    level: number;
    groupingKey: SortKey;
    groupValue: any;
    count: number; // Total count of items in this group and all subgroups
    items: WorklistPatient[]; // Items directly under this group (at leaf nodes)
    subGroups: WorklistGroup[];
    aggregations: GroupAggregations;
}

export interface GroupedWorklist {
    groups: WorklistGroup[];
}

// --- AI Grouping Suggestions (v6.2) ---
export interface AIGroupingSuggestion {
  path: SortKey[];
  rationale: string;
}


// --- Enterprise Notification Intelligence System (ENIS) ---

export type NotificationLayout = 'top' | 'secondary' | 'bundle';

export interface NotificationAction {
  label: string;
  type: 'link' | 'modal' | 'api_call' | 'inline';
  url?: string;
  api?: string;
  primary?: boolean;
}

export interface Notification {
  id: string;
  channel: 'system' | 'rcm' | 'auth' | 'eligibility' | 'estimate' | 'ops' | 'ai';
  type: 'eligibility_change' | 'auth_expired' | 'auth_expiring' | 'auth_missing' | 'submission_failed' | 'estimate_changed' | 'high_denial_risk' | 'bulk_pattern' | 'ai_recommendation';
  title: string;
  description: string;
  timestamp: string; // ISO
  caseId: string;
  patientName: string;
  patientMrn?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  isDismissed?: boolean;
  actions: NotificationAction[];
  metadata: {
    payer?: string;
    policyId?: string;
    denialRiskScore?: number; // 0-100
    daysUntilExpiration?: number; // negative = already expired
    caseValue?: number; // $
    workflowStep?: 'pre_service' | 'claims' | 'post_service';
    patientInsuranceTier?: 'premium' | 'standard' | 'budget';
    dos?: string;
    watch?: boolean;
    clusterKey?: string; // e.g., payer+product
    source?: string;
    synthetic?: boolean;
  };
  ai?: {
    explanation?: string;
    suggestedActions?: Array<{ label: string; confidence: number }>;
    suppressionReason?: string;
    confidence?: number;
  };
  // Properties added by the orchestration engine
  score?: number;
  isBundled?: boolean;
  count?: number;
  bundledItems?: Notification[];
  layout?: NotificationLayout;
  aiScore?: number;
}

export interface AIBoostMetadata {
  trendScore?: number;
  complianceRisk?: boolean;
  revenueImpact?: number;
  suggestedActions?: Array<{ label: string; confidence: number }>;
  rationale?: string;
}

export type ActiveNotificationTab = 'direct' | 'watching' | 'ai_boost';

export interface NotificationsIntelligencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: {
    direct: Notification[];
    watching: Notification[];
    ai_boost: Notification[];
  };
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (notificationId: string) => void;
}

// --- Enterprise Case Collaboration System (v5) ---

export interface NoteVersion {
  version: number;
  content: string;
  editedAt: string;
  editedBy: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  avatarUrl?: string;
  createdAt: string; // ISO string
  updatedAt?: string;
  content: string;
  parentNoteId?: string;
  mentions?: Array<{ userId: string; userName: string; role?: string }>;
  tags?: string[];
  requiresFollowUp?: boolean;
  followUpBy?: string; // ISO date
  followUpOwnerId?: string;
  visibility?: 'team' | 'org' | 'internal-only';
  versionHistory?: NoteVersion[];
  aiSummarySnapshotId?: string;
}

export interface AttachmentVersion {
  version: number;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CaseAttachment {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number; // in bytes
  uploadUrl: string;
  uploadedBy: string;
  uploadedAt: string; // ISO string
  category?: 'auth' | 'eligibility' | 'estimate' | 'clinical' | 'other';
  versionHistory?: AttachmentVersion[];
  ocrExtract?: Record<string, string>;
}

export interface CaseActivity {
  id: string;
  caseId: string;
  type: 'note_created' | 'note_edited' | 'attachment_added' | 'attachment_updated' | 'attachment_deleted' | 'ai_summary_generated' | 'user_assigned' | 'sla_updated' | 'reminder_created' | 'reminder_completed';
  actorId: string;
  actorName: string;
  occurredAt: string; // ISO string
  details: {
    noteId?: string;
    noteContent?: string;
    attachmentId?: string;
    fileName?: string;
    [key: string]: any;
  };
}

export interface AISummary {
  caseId: string;
  generatedAt: string;
  summary: string;
  actions: Array<{ label: string; owner?: string; due?: string; confidence: number }>;
  sentiment?: 'neutral' | 'urgent' | 'blocked' | 'resolved';
  rationale?: string;
  sourceItemIds: string[];
}

// --- Reminders & Follow-ups System (Phase 5.1) ---
export type ReminderStatus = 'pending' | 'due_soon' | 'overdue' | 'completed' | 'snoozed';

export interface ReminderAudit {
  at: string;
  actorId: string;
  action: 'created' | 'updated' | 'completed' | 'snoozed' | 'reassigned';
  details?: any;
}

export interface CaseReminder {
  id: string;
  caseId: string;
  relatedNoteId?: string;
  title: string;
  description?: string;
  dueAt: string; // ISO
  createdAt: string;
  createdById: string;
  createdByName: string;
  assignedToId?: string;
  assignedToName?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: ReminderStatus;
  source: 'note' | 'action_menu' | 'ai' | 'system';
  visibility: 'team' | 'org' | 'internal-only';
  metadata?: {
    payer?: string;
    patientName?: string;
    phone?: string;
    followUpType?: 'payer_call' | 'patient_call' | 'doc_upload' | 'auth_resubmit' | 'eligibility_rerun';
  };
  auditTrail: ReminderAudit[];
}

export interface AIReminderSuggestion {
  title: string;
  dueAt: string;
  rationale: string;
  confidence: number;
}

// --- SmartSave++ (Phase 7) ---

export type SmartSaveMode = 'auto' | 'prompt' | 'manual';
export type SmartSaveScope = 'user' | 'team' | 'org';

/**
 * Represents a complete, persistable snapshot of the worklist view state.
 * This schema governs how views are saved, shared, and restored across scopes.
 */
export interface ViewState {
  id: string; // e.g., 'view_usr_123_wklist_456_main'
  userId: string;
  orgId: string;
  teamId?: string;
  worklistId: string; // Identifier for the specific worklist this view applies to
  name?: string; // e.g., "My High-Priority Aetna View"
  description?: string;
  scope: SmartSaveScope;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  policy: {
    mode: SmartSaveMode;
  };
  layout: {
    density?: 'comfortable' | 'compact';
    panels?: {
      notifications?: boolean;
      caseFeed?: boolean;
    };
  };
  filters: FilterObject[];
  grouping: {
    path: SortKey[];
    hideEmptyGroups: boolean;
  };
  sorting: {
    isPriorityMode: boolean;
    manualSort: {
        fieldId: SortKey;
        direction: 'asc' | 'desc';
    } | null;
  };
  columns: {
    id: SortKey;
    isVisible: boolean;
    position: number;
    width?: number; // pixel value
    pinned?: 'left' | 'right';
  }[];
  pinnedRows: string[]; // Set of patient IDs
  notificationsView?: {
    showUnreadOnly?: boolean;
    activeTab?: ActiveNotificationTab;
  };
  remindersView?: {
    showOverdueFirst?: boolean;
  };
  version: number; // For optimistic concurrency
  source: 'user' | 'system' | 'ai'; // Who created/modified this state
  metadata?: {
    synthetic?: boolean; // Was this auto-generated for a new user?
  }
}

// --- Temporal Intelligence (Phase 8) ---

export type TemporalEventType =
  | 'field_edit'
  | 'status_change'
  | 'note_added'
  | 'note_edited'
  | 'attachment_uploaded'
  | 'eligibility_rerun'
  | 'auth_status_changed'
  | 'estimate_regenerated'
  | 'reminder_created'
  | 'reminder_completed'
  | 'view_config_changed'
  | 'filter_applied'
  | 'group_by_changed'
  | 'ai_action_accepted'
  | 'ai_action_rejected'
  | 'assignment_changed'
  | 'case_created'
  | 'case_dispositioned'
  | 'thread_summary';

export type ImpactCategory = '💰 Revenue' | '⏰ Time Critical' | '🛡️ Compliance' | '⚙️ Ops';

export interface TemporalEvent {
  id: string;
  caseId: string;
  patientName: string;
  actorId: string;
  actorName: string;
  eventType: TemporalEventType;
  timestamp: string; // ISO string
  description: string; // human-readable summary
  details?: {
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    noteId?: string;
    attachmentId?: string;
    reminderId?: string;
    [key: string]: any;
  };
  // FIX: Added 'integration' and 'patient' to align with JourneyEvent and fix type error.
  source: 'user' | 'system' | 'ai' | 'integration' | 'patient';
  // Phase 2+ additions
  gtasScore?: number;
  explanation?: string;
  impactCategory?: ImpactCategory;
  // Phase 3 additions
  threadId?: string;
  threadSummary?: string;
  childEvents?: TemporalEvent[];
  // Future additions
  readBy?: string[];
  integrityHash?: string;
}

// --- Role-Intelligent Case Discovery (Phase 9) ---

export interface UserActivity {
  userId: string;
  caseId: string;
  lastInteraction: string; // ISO string
  interactionTypes: (
    | 'assigned'
    | 'commented'
    | 'attachment_added'
    | 'edited'
  )[];
  lastAction: string; // Human-readable summary like "You commented..."
}

export interface RankedCase {
  caseId: string;
  patientName: string;
  relevanceScore: number;
  explanation: string[];
  personalizationSignals?: string[]; // Phase 9.4
  // For "By You" panel
  lastAction?: string; 
  lastInteraction?: string;
  // Phase 9.3 De-duplication signals
  isNotified?: boolean;
  isReminder?: boolean;
}

// --- Patient Journey Intelligence (Phase 10) ---

export type JourneyPersona = 'ops' | 'provider' | 'patient';

export type JourneyPhase =
  | 'pre_service'
  | 'financial_clearance'
  | 'scheduling'
  | 'clinical'
  | 'claims'
  | 'appeals'
  | 'resolution';

export type JourneyEventType =
  | 'case_created'
  | 'eligibility_run'
  | 'eligibility_failed'
  | 'auth_submitted'
  | 'auth_approved'
  | 'auth_denied'
  | 'auth_expiring'
  | 'estimate_generated'
  | 'estimate_revised'
  | 'copay_collected'
  | 'doc_requested'
  | 'doc_received'
  | 'claim_submitted'
  | 'claim_denied'
  | 'appeal_submitted'
  | 'rescheduled'
  | 'canceled'
  | 'reopened'
  | 'closed'
  | 'note_added'
  | 'assignment_changed';

export interface JourneyEvent {
  id: string;
  caseId: string;
  patientName?: string;
  phase: JourneyPhase;
  type: JourneyEventType;
  timestamp: string;
  actorName?: string;
  actorRole?: string;
  description: string;
  financialImpact?: number;
  complianceRisk?: number;
  slaDeltaMins?: number;
  source?: 'user' | 'system' | 'ai' | 'integration' | 'patient';
  links?: { label: string; url: string }[];
  rawRefId?: string;
  isCounterfactual?: boolean;
}

// Phase 10.2 Additions
export interface JourneyGap {
  id: string;
  caseId: string;
  type: 'journey_gap';
  startTimestamp: string;
  endTimestamp: string;
  durationHours: number;
  description: string;
}

export interface JourneyGraph {
  nodes: Array<{ id: string; label: string; phase: JourneyPhase; timestamp: string }>;
  edges: Array<{ from: string; to: string; durationMins: number; riskAtEdge?: number }>;
}

export interface PredictiveNextStep {
    action: string;
    rationale: string;
    confidence: number;
    source: 'ai';
}