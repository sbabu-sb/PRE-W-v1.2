import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Settings, HelpCircle, UserCircle } from 'lucide-react';
import { MetaData, Payer, Procedure, WorklistPatient, CaseStatus, CaseDisposition, SortKey, FilterObject, WorklistView, Notification, ActiveNotificationTab, ColumnMetadata, CaseNote, CaseAttachment, CaseActivity, AISummary, CaseReminder, ReminderStatus, GroupedWorklist, WorklistGroup, ViewState, SmartSaveMode, SmartSaveScope, TemporalEvent, RankedCase } from '../types';
import { worklistData, createNewWorklistPatient } from '../data/worklistData';
import { worklistColumnMetadata } from '../data/columnMetadata';
import WorklistTable from '../components/features/worklist/WorklistTable';
import SidePanel from '../components/common/SidePanel';
import EstimateCalculatorApp from '../EstimateCalculatorApp';
import BatchActionBar from '../components/features/worklist/BatchActionBar';
import WorklistHeader from '../components/features/worklist/WorklistHeader';
import PaginationControls from '../components/features/worklist/PaginationControls';
import Toast from '../components/common/Toast';
import DispositionComposerModal from '../components/features/worklist/DispositionComposerModal';
import CreateCasePage from './CreateCasePage';
import { EstimateProvider } from '../context/EstimateContext';
import EditFieldPanel from '../components/features/worklist/panels/EditFieldPanel';
import FilterBuilderPanel from '../components/features/worklist/panels/FilterBuilderPanel';
import FieldsManagementPanel from '../components/features/worklist/ColumnVisibilityManager';
import NotificationsButton from '../components/features/notifications/NotificationsButton';
import NotificationsIntelligencePanel from '../components/features/notifications/NotificationsIntelligencePanel';
import { mockNotifications } from '../data/notificationData';
import { orchestrateNotifications } from '../services/notificationEngine';
import { generateSyntheticNotification } from '../services/notificationSimulator';
import CaseCollaborationDrawer, { ActiveCollaborationTab } from '../components/features/worklist/panels/CaseCollaborationDrawer';
// FIX: Import 'getRemindersForUser' to resolve missing function error in refreshDiscoveryFeeds.
import { getNotesForCase, addNoteForCase, getAttachmentsForCase, addAttachmentForCase, getActivitiesForCase, getAggregatedFeedData, getAiSummaryForCase, regenerateAiSummaryForCase, getRemindersForCase, addReminderForCase, updateReminderStatusForCase, getRemindersForUser } from '../data/collaborationData';
import CaseFeedButton from '../components/features/worklist/CaseFeedButton';
import CaseFeedPanel from '../components/features/worklist/panels/CaseFeedPanel';
import GroupByPanel from '../components/features/worklist/panels/GroupByPanel';
import SmartSavePanel from '../components/features/worklist/smart-save/SmartSavePanel';
import { useDebounce } from '../hooks/useDebounce';
import CaseHistoryPanel from '../components/features/worklist/panels/CaseHistoryPanel';
import GlobalHistoryPanel from '../components/features/worklist/panels/GlobalHistoryPanel';
import { getHistoryForCase, addHistoryEvent, getGlobalHistory } from '../data/historyData';
import HistoryFeedButton from '../components/features/worklist/HistoryFeedButton';
import { getActivitiesForUser, logUserActivity } from '../data/userActivityData';
import { getForYouCases, getByYouCases } from '../services/workRelevanceService';
import ForYouPanel from '../components/features/worklist/panels/ForYouPanel';
import ByYouPanel from '../components/features/worklist/panels/ByYouPanel';
import ForYouButton from '../components/features/worklist/ForYouButton';
import ByYouButton from '../components/features/worklist/ByYouButton';
import JourneyPage from './JourneyPage';


const getGroupValue = (patient: WorklistPatient, groupByKey: SortKey): any => {
    switch (groupByKey) {
        case 'status': return patient.status;
        case 'primaryPayer': return patient.payers[0]?.insurance.name || 'N/A';
        case 'assignedTo': return patient.assignedTo.name;
        case 'preServiceClearance': return patient.financialClearance;
        case 'authStatus': return patient.authStatus || 'Not Checked';
        case 'dos': {
            const serviceDate = new Date(patient.metaData.service.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = (serviceDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
            if (diffDays < 0) return "Past Due";
            if (diffDays < 1) return "Today";
            if (diffDays <= 7) return "Next 7 Days";
            return "Later";
        }
        default: return 'Uncategorized';
    }
};

const getAllPatientIdsInGroup = (group: WorklistGroup): string[] => {
    let ids = group.items.map(p => p.id);
    if (group.subGroups && group.subGroups.length > 0) {
        for (const subGroup of group.subGroups) {
            ids = ids.concat(getAllPatientIdsInGroup(subGroup));
        }
    }
    return ids;
};

const VIEW_HISTORY_KEY = 'rcm_worklist_view_history_user_main';
const MAX_HISTORY_LENGTH = 10;

const WorklistPage: React.FC = () => {
    const [patients, setPatients] = useState<WorklistPatient[]>(worklistData);
    const [selectedPatient, setSelectedPatient] = useState<WorklistPatient | null>(null);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [panelWidth, setPanelWidth] = useState<number>(window.innerWidth * 0.6);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isPanelFullscreen, setIsPanelFullscreen] = useState<boolean>(false);
    const [lastNonFullscreenWidth, setLastNonFullscreenWidth] = useState<number>(window.innerWidth * 0.6);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'timeToService', direction: 'asc' });
    const [keywordFilter, setKeywordFilter] = useState('');
    const [filters, setFilters] = useState<FilterObject[]>([]);
    const [view, setView] = useState<'list' | 'create'>('list');
    
    const [panelState, setPanelState] = useState<{
        type: 'edit' | null;
        columnId: SortKey | null;
    }>({ type: null, columnId: null });

    const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
    const [initialFilterState, setInitialFilterState] = useState<{ filterId?: string; fieldId?: SortKey } | null>(null);
    
    // --- Grouping State (Phase 6) ---
    const [groupingPath, setGroupingPath] = useState<SortKey[]>([]);
    const [isGroupByPanelOpen, setIsGroupByPanelOpen] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // --- SmartSave State (Phase 7) ---
    const [isSmartSavePanelOpen, setIsSmartSavePanelOpen] = useState(false);
    const [smartSavePolicy, setSmartSavePolicy] = useState<SmartSaveMode>('auto');
    const [smartSaveScope, setSmartSaveScope] = useState<SmartSaveScope>('user');
    const [savedViewState, setSavedViewState] = useState<ViewState | null>(null);
    const [currentViewState, setCurrentViewState] = useState<ViewState | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [viewHistory, setViewHistory] = useState<ViewState[]>([]);
    const debouncedViewState = useDebounce(currentViewState, 800);

    const [orderedVisibleColumns, setOrderedVisibleColumns] = useState<SortKey[]>(worklistColumnMetadata.filter(c => c.isVisible).map(c => c.id));
    const [isFieldsPanelOpen, setIsFieldsPanelOpen] = useState(false);
    const [isPrioritySortMode, setIsPrioritySortMode] = useState(true);
    const [pinnedRows, setPinnedRows] = useState<Set<string>>(new Set());

    const showToast = useCallback((message: string, onUndo?: () => void) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastInfo({ id: crypto.randomUUID(), message, onUndo });
        toastTimeoutRef.current = window.setTimeout(() => setToastInfo(null), 7000);
    }, []);

    // --- SmartSave++ Logic ---
    const saveHistoryToLocalStorage = useCallback((history: ViewState[]) => {
        try {
            localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save view state history to localStorage", e);
        }
    }, []);

    const handleSaveChanges = useCallback(() => {
        if (currentViewState) {
            const newState: ViewState = { 
                ...currentViewState,
                id: crypto.randomUUID(), // Each version gets a unique ID
                updatedAt: new Date().toISOString(),
                version: (savedViewState?.version || 0) + 1,
             };
            const newHistory = [newState, ...viewHistory].slice(0, MAX_HISTORY_LENGTH);
            
            saveHistoryToLocalStorage(newHistory);
            setViewHistory(newHistory);
            setSavedViewState(newState);
            showToast("View saved successfully.");
        }
    }, [currentViewState, savedViewState, viewHistory, saveHistoryToLocalStorage, showToast]);

    const handleRestoreState = useCallback((viewId: string) => {
        const stateToRestore = viewHistory.find(v => v.id === viewId);
        if (stateToRestore) {
            // Apply the restored state
            setFilters(stateToRestore.filters || []);
            setGroupingPath(stateToRestore.grouping?.path || []);
            setIsPrioritySortMode(stateToRestore.sorting?.isPriorityMode ?? true);
            setSortConfig(stateToRestore.sorting?.manualSort || null);
            setOrderedVisibleColumns(stateToRestore.columns?.filter(c => c.isVisible).sort((a, b) => a.position - b.position).map(c => c.id) || worklistColumnMetadata.filter(c => c.isVisible).map(c => c.id));
            setPinnedRows(new Set(stateToRestore.pinnedRows || []));
            setSmartSavePolicy(stateToRestore.policy?.mode || 'auto');
            setSmartSaveScope(stateToRestore.scope || 'user');

            // Promote the restored state to the top of the history
            const newHistory = [
                stateToRestore,
                ...viewHistory.filter(v => v.id !== viewId)
            ].slice(0, MAX_HISTORY_LENGTH);

            saveHistoryToLocalStorage(newHistory);
            setViewHistory(newHistory);
            setSavedViewState(stateToRestore);

            showToast("View restored.");
            setIsSmartSavePanelOpen(false);
        } else {
            showToast("Error: Could not find view to restore.");
        }
    }, [viewHistory, saveHistoryToLocalStorage, showToast]);


    // Effect to load state on mount
    useEffect(() => {
        try {
            const savedHistoryJSON = localStorage.getItem(VIEW_HISTORY_KEY);
            if (savedHistoryJSON) {
                const loadedHistory: ViewState[] = JSON.parse(savedHistoryJSON);
                if (Array.isArray(loadedHistory) && loadedHistory.length > 0) {
                    setViewHistory(loadedHistory);
                    const latestState = loadedHistory[0];

                    setFilters(latestState.filters || []);
                    setGroupingPath(latestState.grouping?.path || []);
                    setIsPrioritySortMode(latestState.sorting?.isPriorityMode ?? true);
                    setSortConfig(latestState.sorting?.manualSort || null);
                    setOrderedVisibleColumns(latestState.columns?.filter(c => c.isVisible).sort((a, b) => a.position - b.position).map(c => c.id) || worklistColumnMetadata.filter(c => c.isVisible).map(c => c.id));
                    setPinnedRows(new Set(latestState.pinnedRows || []));
                    setSmartSavePolicy(latestState.policy?.mode || 'auto');
                    setSmartSaveScope(latestState.scope || 'user');
                    setSavedViewState(latestState);
                }
            }
        } catch (e) {
            console.error("Failed to load or parse saved view history.", e);
        }
    }, []);
    
    // Effect to build current view state from component state
    useEffect(() => {
        const buildCurrentState = (): ViewState => {
            const allColumnIds = worklistColumnMetadata.map(c => c.id);
            return {
                id: savedViewState?.id || 'view_user_main',
                userId: 'currentUser',
                orgId: 'acmeHealth',
                worklistId: 'mainWorklist',
                scope: smartSaveScope,
                createdAt: savedViewState?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                policy: { mode: smartSavePolicy },
                layout: {},
                filters: filters,
                grouping: { path: groupingPath, hideEmptyGroups: false },
                sorting: { isPriorityMode: isPrioritySortMode, manualSort: sortConfig },
                columns: allColumnIds.map((colId, index) => ({
                    id: colId,
                    isVisible: orderedVisibleColumns.includes(colId),
                    position: orderedVisibleColumns.indexOf(colId) > -1 ? orderedVisibleColumns.indexOf(colId) : index,
                })),
                pinnedRows: Array.from(pinnedRows),
                version: (savedViewState?.version || 0),
                source: 'user',
            };
        };
        setCurrentViewState(buildCurrentState());
    }, [filters, groupingPath, isPrioritySortMode, sortConfig, orderedVisibleColumns, pinnedRows, smartSavePolicy, smartSaveScope, savedViewState]);

    // Effect for autosave on debounced changes
    useEffect(() => {
        if (smartSavePolicy === 'auto' && debouncedViewState && hasUnsavedChanges) {
           handleSaveChanges();
        }
    }, [debouncedViewState, smartSavePolicy, hasUnsavedChanges, handleSaveChanges]);
    
    // Effect for drift detection
    useEffect(() => {
        if (!currentViewState) return;
    
        if (!savedViewState) {
            // If there's no saved state, any customization is an "unsaved change"
            setHasUnsavedChanges(true);
            return;
        }

        // A simplified deep comparison for this phase, ignoring transient properties
        const currentComparable = { ...currentViewState, id: null, updatedAt: null, version: null, createdAt: null };
        const savedComparable = { ...savedViewState, id: null, updatedAt: null, version: null, createdAt: null };

        const currentString = JSON.stringify(currentComparable);
        const savedString = JSON.stringify(savedComparable);
        
        setHasUnsavedChanges(currentString !== savedString);
    }, [currentViewState, savedViewState]);
    

    const handleSetGroupingPath = (path: SortKey[]) => {
        setGroupingPath(path);
        setCollapsedGroups(new Set());
        setIsGroupByPanelOpen(false);
    };

    const handleClearGrouping = () => {
        setGroupingPath([]);
        setCollapsedGroups(new Set());
    };

    const handleToggleGroupCollapse = (groupId: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleToggleGroupSelection = useCallback((group: WorklistGroup) => {
        const groupPatientIds = getAllPatientIdsInGroup(group);
        if (groupPatientIds.length === 0) return;
    
        setSelectedRows(prevSelected => {
            const newSet = new Set(prevSelected);
            const selectedInGroupCount = groupPatientIds.filter(id => newSet.has(id)).length;
            
            const shouldSelectAll = selectedInGroupCount < groupPatientIds.length;
    
            if (shouldSelectAll) {
                groupPatientIds.forEach(id => newSet.add(id));
            } else {
                groupPatientIds.forEach(id => newSet.delete(id));
            }
            return newSet;
        });
    }, []);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const clearDataTimeoutRef = useRef<number | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

    const [views, setViews] = useState<WorklistView[]>(() => {
        try {
            const savedViews = localStorage.getItem('worklistViews');
            if(savedViews) return JSON.parse(savedViews);
        } catch (e) { console.error("Failed to load views from localStorage", e); }
        return [
            { id: 'default', name: 'All Open Cases', sortConfig: { key: 'timeToService', direction: 'asc' }, keywordFilter: '', filters: [{ id: crypto.randomUUID(), fieldId: 'status', fieldName: 'Status', condition: 'is-none-of', values: [CaseStatus.COMPLETED, CaseStatus.ARCHIVED], isEnabled: true }] },
            { id: 'completed', name: 'Recently Completed', sortConfig: { key: 'lastWorkedBy', direction: 'desc' }, keywordFilter: '', filters: [{ id: crypto.randomUUID(), fieldId: 'status', fieldName: 'Status', condition: 'is-any-of', values: [CaseStatus.COMPLETED], isEnabled: true }] },
            { id: 'blocked', name: 'Blocked Cases', sortConfig: { key: 'timeToService', direction: 'asc' }, keywordFilter: '', filters: [{ id: crypto.randomUUID(), fieldId: 'preServiceClearance', fieldName: 'Pre-Service Clearance', condition: 'is-any-of', values: ['Blocked'], isEnabled: true }, { id: crypto.randomUUID(), fieldId: 'status', fieldName: 'Status', condition: 'is-none-of', values: [CaseStatus.COMPLETED, CaseStatus.ARCHIVED], isEnabled: true }] },
        ];
    });
    
    useEffect(() => {
        try { localStorage.setItem('worklistViews', JSON.stringify(views)); }
        catch (e) { console.error("Failed to save views to localStorage", e); }
    }, [views]);

    const [activeViewId, setActiveViewId] = useState<string | null>('default');

    
    const [isLive, setIsLive] = useState(true);
    const [pendingPatients, setPendingPatients] = useState<WorklistPatient[]>([]);
    const [hasNewData, setHasNewData] = useState(false);
    const [toastInfo, setToastInfo] = useState<{ id: string; message: string; onUndo?: () => void } | null>(null);
    const toastTimeoutRef = useRef<number | null>(null);
    const [dispositionState, setDispositionState] = useState<{ isOpen: boolean; patient: WorklistPatient | null }>({ isOpen: false, patient: null });

    // --- Collaboration State ---
    const [isCollaborationDrawerOpen, setIsCollaborationDrawerOpen] = useState(false);
    const [collaborationDrawerInitialTab, setCollaborationDrawerInitialTab] = useState<ActiveCollaborationTab>('notes');
    const [activeCaseForCollaboration, setActiveCaseForCollaboration] = useState<WorklistPatient | null>(null);
    const [notes, setNotes] = useState<CaseNote[]>([]);
    const [attachments, setAttachments] = useState<CaseAttachment[]>([]);
    const [activities, setActivities] = useState<CaseActivity[]>([]);
    const [reminders, setReminders] = useState<CaseReminder[]>([]);
    const [notesVersion, setNotesVersion] = useState(0); 
    const [attachmentsVersion, setAttachmentsVersion] = useState(0);
    const [remindersVersion, setRemindersVersion] = useState(0);
    const [isCaseFeedOpen, setIsCaseFeedOpen] = useState(false);
    const [activeAiSummary, setActiveAiSummary] = useState<AISummary | null>(null);
    const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false);

    // --- History State (Phase 8 & 2) ---
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [activeCaseForHistory, setActiveCaseForHistory] = useState<WorklistPatient | null>(null);
    const [caseHistory, setCaseHistory] = useState<TemporalEvent[]>([]);
    const [isGlobalHistoryPanelOpen, setIsGlobalHistoryPanelOpen] = useState(false);
    const [globalHistory, setGlobalHistory] = useState<TemporalEvent[]>([]);

    // --- Discovery State (Phase 9) ---
    const [isForYouPanelOpen, setIsForYouPanelOpen] = useState(false);
    const [isByYouPanelOpen, setIsByYouPanelOpen] = useState(false);
    const [forYouCases, setForYouCases] = useState<RankedCase[]>([]);
    const [byYouCases, setByYouCases] = useState<RankedCase[]>([]);

    // --- Journey State (Phase 10) ---
    const [isJourneyViewOpen, setIsJourneyViewOpen] = useState(false);
    const [activeCaseForJourney, setActiveCaseForJourney] = useState<WorklistPatient | null>(null);


    // --- Notification State ---
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [allNotifications, setAllNotifications] = useState<Notification[]>(mockNotifications);
    
    // Phase 3: Simulation Engine
    useEffect(() => {
        const simulationConfig = { enabled: true, intervalMs: 30000, maxInTray: 100 };
        if (!simulationConfig.enabled) return;

        const intervalId = setInterval(() => {
            const newNotif = generateSyntheticNotification();
            setAllNotifications(prev => {
                const updated = [newNotif, ...prev];
                // Prune oldest if over max
                if (updated.length > simulationConfig.maxInTray) {
                    return updated.slice(0, simulationConfig.maxInTray);
                }
                return updated;
            });
        }, simulationConfig.intervalMs);

        return () => clearInterval(intervalId);
    }, []);

    const orchestratedNotifications = useMemo(() => {
        try {
            return orchestrateNotifications(allNotifications);
        } catch (error) {
            console.error("CRITICAL: Notification orchestration failed.", error);
            return { direct: [], watching: [], ai_boost: [] }; // Return a safe default to prevent crash
        }
    }, [allNotifications]);
    
    const unreadCount = useMemo(() => {
        try {
            // Calculate total unique unread notifications across the 'direct' and 'watching' tabs
            // This ensures the badge count is an accurate reflection of what the user can see in the panel.
            const unreadIds = new Set<string>();
            orchestratedNotifications.direct.forEach(n => {
                if (!n.isRead) unreadIds.add(n.id);
            });
            orchestratedNotifications.watching.forEach(n => {
                if (!n.isRead) unreadIds.add(n.id);
            });
            return unreadIds.size;
        } catch (error) {
            console.error("Error calculating unread notification count:", error);
            return 0; // Return a safe default on error
        }
    }, [orchestratedNotifications]);

    const handleMarkAsRead = (notificationId: string) => {
        setAllNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = () => {
        setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
    
    const handleDismiss = (notificationId: string) => {
        setAllNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isDismissed: true } : n));
    };


     const handleRegenerateSummary = useCallback(async (caseId: string) => {
        setIsAiSummaryLoading(true);
        const result = await regenerateAiSummaryForCase(caseId);
        if (result.success) {
            setActiveAiSummary(result.data || null);
        } else {
            showToast("Failed to generate AI summary.");
            setActiveAiSummary(null);
        }
        setIsAiSummaryLoading(false);
    }, [showToast]);

    const handleOpenCollaborationDrawer = useCallback((patient: WorklistPatient, initialTab: ActiveCollaborationTab = 'notes') => {
        setActiveCaseForCollaboration(patient);
        setCollaborationDrawerInitialTab(initialTab);
        setNotes(getNotesForCase(patient.id));
        setAttachments(getAttachmentsForCase(patient.id));
        setActivities(getActivitiesForCase(patient.id));
        setReminders(getRemindersForCase(patient.id));
        setCaseHistory(getHistoryForCase(patient.id));
        
        const summary = getAiSummaryForCase(patient.id);
        if (summary) {
            setActiveAiSummary(summary);
        } else {
            const currentNotes = getNotesForCase(patient.id);
            if (currentNotes.length > 3) {
                handleRegenerateSummary(patient.id);
            } else {
                setActiveAiSummary(null);
            }
        }

        setIsCollaborationDrawerOpen(true);
    }, [handleRegenerateSummary]);
    
    const handleCloseCollaborationDrawer = useCallback(() => {
        setIsCollaborationDrawerOpen(false);
        setTimeout(() => setActiveCaseForCollaboration(null), 300);
    }, []);

    const handleAddNote = useCallback((caseId: string, content: string, parentNoteId?: string): CaseNote | undefined => {
        const patientContext = patients.find(p => p.id === caseId);
        const newNote = addNoteForCase(caseId, content, parentNoteId);
        if (activeCaseForCollaboration && activeCaseForCollaboration.id === caseId) {
            setNotes(getNotesForCase(caseId));
            setActivities(getActivitiesForCase(caseId));
        }
        setNotesVersion(v => v + 1);
        showToast("Note added successfully.");
        return newNote;
    }, [showToast, activeCaseForCollaboration, patients]);
    
    const handleAddAttachment = useCallback((caseId: string, file: File) => {
        const patientContext = patients.find(p => p.id === caseId);
        addAttachmentForCase(caseId, file);
        if (activeCaseForCollaboration && activeCaseForCollaboration.id === caseId) {
            setAttachments(getAttachmentsForCase(caseId));
            setActivities(getActivitiesForCase(caseId));
        }
        setAttachmentsVersion(v => v + 1);
        showToast(`Attachment "${file.name}" added.`);
    }, [showToast, activeCaseForCollaboration, patients]);
    
    const handleAddReminder = useCallback((caseId: string, reminderData: Omit<CaseReminder, 'id' | 'caseId' | 'createdAt' | 'createdById' | 'createdByName' | 'status' | 'auditTrail'>) => {
        const patientContext = patients.find(p => p.id === caseId);
        addReminderForCase(caseId, reminderData);
        if (activeCaseForCollaboration && activeCaseForCollaboration.id === caseId) {
            setReminders(getRemindersForCase(caseId));
            setActivities(getActivitiesForCase(caseId));
        }
        setRemindersVersion(v => v + 1);
        showToast("Reminder added.");
    }, [showToast, activeCaseForCollaboration, patients]);
    
    const handleUpdateReminderStatus = useCallback((reminderId: string, status: ReminderStatus) => {
        const reminder = updateReminderStatusForCase(reminderId, status);
        if (activeCaseForCollaboration) {
            setReminders(getRemindersForCase(activeCaseForCollaboration.id));
             if (status === 'completed' && reminder) {
                const patientContext = patients.find(p => p.id === reminder.caseId);
                setActivities(getActivitiesForCase(activeCaseForCollaboration.id));
                showToast("Reminder marked complete.");
            }
        }
        setRemindersVersion(v => v + 1);
    }, [showToast, activeCaseForCollaboration, patients]);

    // --- History Handlers (Phase 8 & 2) ---
    const handleOpenHistory = useCallback((patient: WorklistPatient) => {
        setActiveCaseForHistory(patient);
        setCaseHistory(getHistoryForCase(patient.id));
        setIsHistoryPanelOpen(true);
    }, []);

    const handleCloseHistory = useCallback(() => {
        setIsHistoryPanelOpen(false);
        setTimeout(() => setActiveCaseForHistory(null), 300);
    }, []);

    const handleOpenGlobalHistory = useCallback(() => {
        setGlobalHistory(getGlobalHistory());
        setIsGlobalHistoryPanelOpen(true);
    }, []);

    const handleCloseGlobalHistory = useCallback(() => {
        setIsGlobalHistoryPanelOpen(false);
    }, []);

    // --- Discovery Handlers (Phase 9) ---
    const refreshDiscoveryFeeds = useCallback(() => {
        const currentUserActivities = getActivitiesForUser('user1');
        const currentUserReminders = getRemindersForUser('user1');
        // Phase 9.4: Add simulated user role
        const currentUserRole = 'Auth Specialist'; // This can be made dynamic later

        setForYouCases(getForYouCases(patients, allNotifications, currentUserReminders, currentUserActivities, currentUserRole));
        setByYouCases(getByYouCases(patients, currentUserActivities));
    }, [patients, allNotifications]);
    
    useEffect(() => {
        refreshDiscoveryFeeds();
    }, [patients, notesVersion, attachmentsVersion, remindersVersion, refreshDiscoveryFeeds, allNotifications]);

    const handleOpenForYou = useCallback(() => {
        refreshDiscoveryFeeds();
        setIsForYouPanelOpen(true);
    }, [refreshDiscoveryFeeds]);
    
    const handleOpenByYou = useCallback(() => {
        refreshDiscoveryFeeds();
        setIsByYouPanelOpen(true);
    }, [refreshDiscoveryFeeds]);

    const handleOpenCaseFromDiscovery = useCallback((caseId: string) => {
        const patient = patients.find(p => p.id === caseId);
        if (patient) {
            setIsForYouPanelOpen(false);
            setIsByYouPanelOpen(false);
            handleRowSelect(patient);
        } else {
            showToast("Could not find the selected case.", undefined);
        }
    }, [patients, showToast]);

    // --- Journey Handlers (Phase 10) ---
    const handleOpenJourney = useCallback((patient: WorklistPatient) => {
        setActiveCaseForJourney(patient);
        setIsJourneyViewOpen(true);
    }, []);

    const handleCloseJourney = useCallback(() => {
        setIsJourneyViewOpen(false);
        setTimeout(() => setActiveCaseForJourney(null), 300);
    }, []);


    const handleRowSelect = useCallback((patient: WorklistPatient) => {
        if (clearDataTimeoutRef.current) {
            clearTimeout(clearDataTimeoutRef.current);
            clearDataTimeoutRef.current = null;
        }
        setPatients(prev => prev.map(p => p.id === patient.id && p.status === CaseStatus.NEW ? {...p, status: CaseStatus.ACTIVE} : p));
        setSelectedPatient(patient);
        setIsPanelOpen(true);
        if (isPanelFullscreen) {
            setIsPanelFullscreen(false);
            setPanelWidth(lastNonFullscreenWidth);
        }
    }, [isPanelFullscreen, lastNonFullscreenWidth]);
    
    const handleOpenCaseFromFeed = (patient: WorklistPatient) => {
        setIsCaseFeedOpen(false);
        handleRowSelect(patient);
    };

    const handleAddNoteFromFeed = (patient: WorklistPatient) => {
        setIsCaseFeedOpen(false);
        handleOpenCollaborationDrawer(patient);
    };

    const aggregatedFeedData = useMemo(() => getAggregatedFeedData(), [notesVersion, attachmentsVersion, remindersVersion]);
    const unreadCollabCount = 0; // Mocked for now
    
    const activeColumnMetadata = useMemo(() => {
        if (!panelState.columnId) return null;
        return worklistColumnMetadata.find(meta => meta.id === panelState.columnId) || null;
    }, [panelState.columnId]);

    const handleOpenPanel = (type: 'edit', columnId: SortKey) => {
        setPanelState({ type, columnId });
    };

    const handleClosePanel = () => {
        setPanelState({ type: null, columnId: null });
    };
    
    const handleUpsertFilter = (filter: FilterObject) => {
        setFilters(prev => {
            const existingIndex = prev.findIndex(f => f.id === filter.id);
            if (existingIndex > -1) {
                const newFilters = [...prev];
                newFilters[existingIndex] = filter;
                return newFilters;
            }
            return [...prev, filter];
        });
    };
    
    const handleRemoveFilter = (filterId: string) => {
        setFilters(prev => prev.filter(f => f.id !== filterId));
    };

    const handleClearAllFilters = () => {
        setFilters([]);
        showToast("All filters cleared.");
    };

    const handleFilterColumn = (fieldId: SortKey) => {
        const existingFilter = filters.find(f => f.fieldId === fieldId);
        if (existingFilter) {
            setInitialFilterState({ filterId: existingFilter.id, fieldId });
        } else {
            setInitialFilterState({ fieldId });
        }
        setIsFilterBuilderOpen(true);
    };
    
    const handleCreateCase = () => setView('create');
    const handleCancelCreate = () => setView('list');
    const handleSaveCase = (newCase: WorklistPatient) => {
        setPatients(prev => [newCase, ...prev]);
        showToast(`Case ${newCase.id} created successfully.`);
        setView('list');
    };

    const handleOpenDispositionModal = useCallback((patient: WorklistPatient) => {
        setDispositionState({ isOpen: true, patient });
    }, []);

    const handleCloseDispositionModal = useCallback(() => {
        setDispositionState({ isOpen: false, patient: null });
    }, []);

    const handleConfirmDisposition = useCallback((patientId: string, disposition: CaseDisposition) => {
        let originalPatient: WorklistPatient | undefined;
        setPatients(prev => {
            const newPatients = [...prev];
            const patientIndex = newPatients.findIndex(p => p.id === patientId);
            if (patientIndex !== -1) {
                originalPatient = { ...newPatients[patientIndex] };
                newPatients[patientIndex] = { ...newPatients[patientIndex], status: CaseStatus.COMPLETED, disposition, lastUpdated: new Date().toISOString() };
            }
            return newPatients;
        });

        if (originalPatient) {
            addHistoryEvent({
                caseId: patientId,
                patientName: originalPatient.metaData.patient.name,
                actorId: 'user1',
                actorName: 'Maria Garcia', // Assume current user
                eventType: 'case_dispositioned',
                description: `closed case with outcome: ${disposition.outcome}.`,
                details: { outcome: disposition.outcome, summary: disposition.summary },
                source: 'user',
            }, originalPatient);
        }

        handleCloseDispositionModal();
        setSelectedRows(prev => { const newSet = new Set(prev); newSet.delete(patientId); return newSet; });
        const onUndo = () => {
            if (originalPatient) setPatients(prev => { const patientIndex = prev.findIndex(p => p.id === patientId); if (patientIndex !== -1) { const newPatients = [...prev]; newPatients[patientIndex] = originalPatient!; return newPatients; } return prev; });
            setToastInfo(null);
        };
        showToast("1 case marked as complete.", onUndo);
    }, [handleCloseDispositionModal, showToast]);

    const handleMarkComplete = (patientIdsToUpdate: string[], newStatus: CaseStatus) => {
        const originalPatients = new Map<string, WorklistPatient>();
        setPatients(prev => prev.map(p => { if (patientIdsToUpdate.includes(p.id)) { originalPatients.set(p.id, { ...p }); return { ...p, status: newStatus, lastUpdated: new Date().toISOString() }; } return p; }));
        
        patientIdsToUpdate.forEach(patientId => {
            const patient = originalPatients.get(patientId);
            if(patient) {
                addHistoryEvent({
                    caseId: patientId,
                    patientName: patient.metaData.patient.name,
                    actorId: 'user1',
                    actorName: 'Maria Garcia', // Assume current user
                    eventType: 'status_change',
                    description: `changed status to ${newStatus}.`,
                    details: { oldValue: patient.status, newValue: newStatus },
                    source: 'user',
                }, patient);
            }
        });

        if (newStatus === CaseStatus.COMPLETED) {
            setSelectedRows(prev => { const newSet = new Set(prev); patientIdsToUpdate.forEach(id => newSet.delete(id)); return newSet; });
            const onUndo = () => { setPatients(prev => { const newPatients = [...prev]; originalPatients.forEach((originalPatient, id) => { const index = newPatients.findIndex(p => p.id === id); if (index !== -1) newPatients[index] = originalPatient; }); return newPatients; }); setToastInfo(null); };
            const message = `${patientIdsToUpdate.length} case${patientIdsToUpdate.length > 1 ? 's' : ''} marked as complete.`;
            showToast(message, onUndo);
        }
    };

    const handleToggleColumnVisibility = useCallback((columnId: SortKey) => {
        const wasVisible = orderedVisibleColumns.includes(columnId);
        let newOrderedColumns: SortKey[];

        if (wasVisible) {
            newOrderedColumns = orderedVisibleColumns.filter(id => id !== columnId);
        } else {
            newOrderedColumns = [...orderedVisibleColumns, columnId];
        }
        setOrderedVisibleColumns(newOrderedColumns);
        
        // Provide undo functionality via toast
        const onUndo = () => {
            setOrderedVisibleColumns(orderedVisibleColumns); // Revert to the original order
            setToastInfo(null);
        };
        const columnName = worklistColumnMetadata.find(c => c.id === columnId)?.name || 'Column';
        showToast(`Column "${columnName}" ${wasVisible ? 'hidden' : 'shown'}.`, onUndo);
    }, [orderedVisibleColumns, showToast]);
    
    const handleReorderColumns = useCallback((reorderedColumns: SortKey[]) => {
        setOrderedVisibleColumns(reorderedColumns);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const newPatient = createNewWorklistPatient();
            if (isLive) setPatients(prev => [newPatient, ...prev]);
            else { setPendingPatients(prev => [newPatient, ...prev]); setHasNewData(true); }
        }, 15000);
        return () => clearInterval(interval);
    }, [isLive]);

    const handleToggleLive = () => {
        if (!isLive) { setPatients(prev => [...pendingPatients, ...prev]); setPendingPatients([]); setHasNewData(false); }
        setIsLive(!isLive);
    };

    const processedData = useMemo(() => {
        let filteredItems = [...patients];

        if (keywordFilter) {
            const lowercasedFilter = keywordFilter.toLowerCase();
            filteredItems = filteredItems.filter(patient => {
                const { id, metaData, payers, financialClearance, estimateStatus, assignedTo } = patient;
                return (id.toLowerCase().includes(lowercasedFilter) || metaData.patient.name.toLowerCase().includes(lowercasedFilter) || payers.some(p => p.insurance.name.toLowerCase().includes(lowercasedFilter)) || metaData.provider.name.toLowerCase().includes(lowercasedFilter) || financialClearance.toLowerCase().includes(lowercasedFilter) || estimateStatus.toLowerCase().includes(lowercasedFilter) || assignedTo.name.toLowerCase().includes(lowercasedFilter));
            });
        }
        
        const activeFilters = filters.filter(f => f.isEnabled);
        if (activeFilters.length > 0) {
            filteredItems = filteredItems.filter(patient => {
                return activeFilters.every(filter => {
                    let patientValue: any;
                    switch(filter.fieldId) {
                        case 'id': patientValue = patient.id; break;
                        case 'patient': patientValue = patient.metaData.patient.name; break;
                        case 'priority': patientValue = patient.priorityDetails?.score; break;
                        case 'status': patientValue = patient.status; break;
                        case 'dos': patientValue = patient.metaData.service.date; break;
                        case 'timeToService': patientValue = patient.metaData.service.date; break;
                        case 'primaryPayer': patientValue = patient.payers[0]?.insurance.name; break;
                        case 'lastWorkedBy': patientValue = patient.lastWorkedBy.name; break;
                        case 'assignedTo': patientValue = patient.assignedTo.name; break;
                        case 'estimateStatus': patientValue = patient.estimateStatus; break;
                        case 'preServiceClearance': patientValue = patient.financialClearance; break;
                        default: return true;
                    }

                    const metadata = worklistColumnMetadata.find(m => m.id === filter.fieldId);
                    if (!metadata) return true;

                    const isEmpty = patientValue === undefined || patientValue === null || patientValue === '';
                    if (filter.condition === 'is-empty') return isEmpty;
                    if (filter.condition === 'is-not-empty') return !isEmpty;
                    if (isEmpty) return false; // Other conditions fail on empty values

                    switch (metadata.type) {
                        case 'text':
                            const pValText = String(patientValue).toLowerCase();
                            const fValText = String(filter.value).toLowerCase();
                            if (filter.condition === 'is') return pValText === fValText;
                            if (filter.condition === 'is-not') return pValText !== fValText;
                            if (filter.condition === 'contains') return pValText.includes(fValText);
                            if (filter.condition === 'does-not-contain') return !pValText.includes(fValText);
                            break;
                        case 'numeric':
                            const pValNum = Number(patientValue);
                            const fVal1Num = Number(filter.value);
                            const fVal2Num = Number(filter.value2);
                            if (filter.condition === 'is') return pValNum === fVal1Num;
                            if (filter.condition === 'is-not') return pValNum !== fVal1Num;
                            if (filter.condition === 'greater-than') return pValNum > fVal1Num;
                            if (filter.condition === 'less-than') return pValNum < fVal1Num;
                            if (filter.condition === 'between') return pValNum >= fVal1Num && pValNum <= fVal2Num;
                            break;
                        case 'date':
                            const pValDate = new Date(patientValue).setHours(0, 0, 0, 0);
                            const fVal1Date = new Date(filter.value).setHours(0, 0, 0, 0);
                            const fVal2Date = new Date(filter.value2).setHours(0, 0, 0, 0);
                            if (filter.condition === 'is') return pValDate === fVal1Date;
                            if (filter.condition === 'is-before') return pValDate < fVal1Date;
                            if (filter.condition === 'is-after') return pValDate > fVal1Date;
                            if (filter.condition === 'between') return pValDate >= fVal1Date && pValDate <= fVal2Date;
                            break;
                        case 'enum':
                        case 'multi-select':
                            if (filter.condition === 'is-any-of' || filter.condition === 'includes-any-of') return filter.values?.includes(patientValue);
                            if (filter.condition === 'is-none-of') return !filter.values?.includes(patientValue);
                            break;
                    }
                    return true;
                });
            });
        }
        
        let sortedItems;
        if (isPrioritySortMode) {
            sortedItems = [...filteredItems].sort((a, b) => (b.priorityDetails?.score ?? 0) - (a.priorityDetails?.score ?? 0));
        } else {
            sortedItems = [...filteredItems].sort((a, b) => {
                if (!sortConfig) return 0;
                let aValue: any = a[sortConfig.key as keyof WorklistPatient], bValue: any = b[sortConfig.key as keyof WorklistPatient];
                 switch (sortConfig.key) {
                    case 'patient': aValue = a.metaData.patient.name; bValue = b.metaData.patient.name; break;
                    case 'timeToService': case 'dos': aValue = new Date(a.metaData.service.date).getTime(); bValue = new Date(b.metaData.service.date).getTime(); break;
                    case 'primaryPayer': aValue = a.payers[0]?.insurance.name || ''; bValue = b.payers[0]?.insurance.name || ''; break;
                    case 'preServiceClearance': aValue = a.financialClearance; bValue = b.financialClearance; break;
                    case 'lastWorkedBy': aValue = new Date(a.lastUpdated).getTime(); bValue = new Date(b.lastUpdated).getTime(); break;
                    case 'assignedTo': aValue = a.assignedTo?.name || ''; bValue = b.assignedTo?.name || ''; break;
                    case 'priority': aValue = a.priorityDetails?.score ?? 0; bValue = b.priorityDetails?.score ?? 0; break;
                }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        const pinnedItems = sortedItems.filter(p => pinnedRows.has(p.id));
        const unpinnedItems = sortedItems.filter(p => !pinnedRows.has(p.id));

        const finalSortedItems = [...pinnedItems, ...unpinnedItems];

        if (groupingPath.length > 0) {
            const groupRecursively = (items: WorklistPatient[], path: SortKey[], level: number, parentId: string): WorklistGroup[] => {
                if (path.length === 0) return [];
                const groupByKey = path[0];
                const restOfPath = path.slice(1);
                const groupMap = new Map<any, WorklistPatient[]>();

                items.forEach(patient => {
                    const groupValue = getGroupValue(patient, groupByKey);
                    const group = groupMap.get(groupValue);
                    if (group) { group.push(patient); } 
                    else { groupMap.set(groupValue, [patient]); }
                });

                return Array.from(groupMap.entries()).map(([groupValue, groupItems]) => {
                    const groupId = `${parentId}${parentId ? '/' : ''}${groupByKey}:${groupValue}`;
                    const subGroups = groupRecursively(groupItems, restOfPath, level + 1, groupId);
                    const leafItems = restOfPath.length === 0 ? groupItems : [];
                    
                    const allItemsInGroup = subGroups.length > 0 ? subGroups.flatMap(sg => sg.items.concat(sg.subGroups.flatMap(ssg => ssg.items))) : groupItems; // Simplified for now
                    
                    let totalValue = 0, expiringAuths = 0, blockedCases = 0, unassignedCases = 0, count = 0;
                    const today = new Date();
                    const twoDaysFromNow = new Date(today.getTime() + 48 * 60 * 60 * 1000);

                    const aggregate = (itemsToAgg: WorklistPatient[]) => {
                        count += itemsToAgg.length;
                        itemsToAgg.forEach(p => {
                            totalValue += p.estimatedResponsibility ?? 0;
                            if (p.financialClearance === 'Blocked') blockedCases++;
                            if (p.assignedTo.name === 'Unassigned') unassignedCases++;
                            const serviceDate = new Date(p.metaData.service.date);
                            if (p.authStatus === 'Required' && serviceDate > today && serviceDate <= twoDaysFromNow) {
                                expiringAuths++;
                            }
                        });
                        
                        // Recursively aggregate subgroups
                        if (subGroups.length > 0) {
                           subGroups.forEach(subGroup => {
                                count += subGroup.count;
                                totalValue += subGroup.aggregations.totalValue;
                                expiringAuths += subGroup.aggregations.expiringAuths;
                                blockedCases += subGroup.aggregations.blockedCases;
                                unassignedCases += subGroup.aggregations.unassignedCases;
                           });
                        }
                    };

                    const itemsForAgg = [...leafItems, ...subGroups.flatMap(g => [...g.items, ...g.subGroups.flat().flatMap(sg => sg.items)])];
                    
                    itemsForAgg.forEach(p => {
                        totalValue += p.estimatedResponsibility ?? 0;
                        if (p.financialClearance === 'Blocked') blockedCases++;
                        if (p.assignedTo.name === 'Unassigned') unassignedCases++;
                        const serviceDate = new Date(p.metaData.service.date);
                        if (p.authStatus === 'Required' && serviceDate > today && serviceDate <= twoDaysFromNow) {
                            expiringAuths++;
                        }
                    });

                    return {
                        id: groupId, level, groupingKey: groupByKey, groupValue,
                        count: groupItems.length,
                        items: leafItems,
                        subGroups,
                        aggregations: { totalValue, expiringAuths, blockedCases, unassignedCases }
                    };
                }).sort((a, b) => String(a.groupValue).localeCompare(String(b.groupValue)));
            };
            const groupedResult: GroupedWorklist = {
                groups: groupRecursively(finalSortedItems, groupingPath, 0, '')
            };
            return groupedResult;
        }

        return finalSortedItems;
    }, [patients, keywordFilter, filters, sortConfig, pinnedRows, isPrioritySortMode, groupingPath]);

    const isDataGrouped = (data: WorklistPatient[] | GroupedWorklist): data is GroupedWorklist => 'groups' in data;
    const isGrouped = isDataGrouped(processedData);

    const totalRows = useMemo(() => isGrouped ? processedData.groups.reduce((sum, g) => sum + g.count, 0) : processedData.length, [isGrouped, processedData]);
    const totalPages = useMemo(() => isGrouped ? 1 : Math.ceil(totalRows / rowsPerPage), [isGrouped, totalRows, rowsPerPage]);

    const paginatedData = useMemo(() => {
        if (isGrouped) {
            return processedData; // Don't paginate when grouped for now
        }
        const startIndex = (currentPage - 1) * rowsPerPage;
        return processedData.slice(startIndex, startIndex + rowsPerPage);
    }, [processedData, isGrouped, currentPage, rowsPerPage]);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) { setCurrentPage(page); setActiveRowIndex(null); }
    };
    
    const handleRowsPerPageChange = (size: number) => {
        setRowsPerPage(size); setCurrentPage(1); setActiveRowIndex(null);
    };

    const handlePanelClose = useCallback(() => {
        setIsPanelOpen(false);
        clearDataTimeoutRef.current = window.setTimeout(() => setSelectedPatient(null), 300);
        if (isPanelFullscreen) { setIsPanelFullscreen(false); setPanelWidth(lastNonFullscreenWidth); }
    }, [isPanelFullscreen, lastNonFullscreenWidth]);
    
    const handleToggleRow = useCallback((patientId: string) => { setSelectedRows(prev => { const newSet = new Set(prev); if (newSet.has(patientId)) newSet.delete(patientId); else newSet.add(patientId); return newSet; }); }, []);
    
    const handleToggleAllRows = useCallback(() => {
        if (isGrouped) return;
        const currentPageIds = (paginatedData as WorklistPatient[]).map(p => p.id);
        const allOnPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedRows.has(id));
        setSelectedRows(prev => { const newSet = new Set(prev); if (allOnPageSelected) currentPageIds.forEach(id => newSet.delete(id)); else currentPageIds.forEach(id => newSet.add(id)); return newSet; });
    }, [paginatedData, selectedRows, isGrouped]);

    const onToggleFullscreen = useCallback(() => { setIsPanelFullscreen(prev => { if (!prev) { setLastNonFullscreenWidth(panelWidth); setPanelWidth(window.innerWidth); } else { setPanelWidth(lastNonFullscreenWidth); } return !prev; }); }, [panelWidth, lastNonFullscreenWidth]);
    
    const handleSort = (key: SortKey, direction?: 'asc' | 'desc') => {
        if (isPrioritySortMode) return;
        const newDirection = direction ?? (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc');
        setSortConfig({ key, direction: newDirection });
        setActiveRowIndex(null);
    };

    const handleTogglePrioritySort = () => {
        setIsPrioritySortMode(prev => { if (prev) setSortConfig({ key: 'timeToService', direction: 'asc' }); return !prev; });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGrouped) return; // Disable keyboard nav when grouped
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) { if (e.key === 'Escape') (e.target as HTMLElement).blur(); return; }
            if (['j', 'k', 'o', '/', ' ', 'Enter'].includes(e.key)) e.preventDefault();
            const currentPatients = paginatedData as WorklistPatient[];

            switch (e.key) {
                case 'j': setActiveRowIndex(prev => { const newIndex = prev === null ? 0 : Math.min(prev + 1, currentPatients.length - 1); document.getElementById(`worklist-row-${currentPatients[newIndex]?.id}`)?.scrollIntoView({ block: 'nearest' }); return newIndex; }); break;
                case 'k': setActiveRowIndex(prev => { const newIndex = prev === null ? 0 : Math.max(prev - 1, 0); document.getElementById(`worklist-row-${currentPatients[newIndex]?.id}`)?.scrollIntoView({ block: 'nearest' }); return newIndex; }); break;
                case 'o': case 'Enter': if (activeRowIndex !== null && currentPatients[activeRowIndex]) handleRowSelect(currentPatients[activeRowIndex]); break;
                case ' ': if (activeRowIndex !== null && currentPatients[activeRowIndex]) handleToggleRow(currentPatients[activeRowIndex].id); break;
                case 'Escape': if (dispositionState.isOpen) handleCloseDispositionModal(); else if (isPanelOpen) handlePanelClose(); else if (selectedRows.size > 0) setSelectedRows(new Set()); else setActiveRowIndex(null); break;
                case '/': searchInputRef.current?.focus(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeRowIndex, paginatedData, isGrouped, handleRowSelect, handlePanelClose, isPanelOpen, handleToggleRow, selectedRows.size, dispositionState.isOpen, handleCloseDispositionModal]);

    const handleBatchRunEB = () => { if (window.confirm(`Run E&B for ${selectedRows.size} items?`)) { alert(`Running E&B...`); setSelectedRows(new Set()); } };
    const handleBatchAssign = () => { const assignee = prompt(`Assign these ${selectedRows.size} items to:`); if (assignee) { alert(`Assigning to ${assignee}...`); setSelectedRows(new Set()); } };
    const handleBatchUpdateStatus = () => { const status = prompt(`New status for ${selectedRows.size} items:`); if (status) { alert(`Updating status...`); setSelectedRows(new Set()); } };
    const handleBatchAddNote = () => { const note = prompt(`Note for ${selectedRows.size} items:`); if (note) { alert(`Adding note...`); setSelectedRows(new Set()); } };
    const handleBatchExport = () => { if (window.confirm(`Export ${selectedRows.size} items?`)) { alert(`Exporting...`); setSelectedRows(new Set()); } };
    const handleBatchComplete = () => { handleMarkComplete(Array.from(selectedRows), CaseStatus.COMPLETED); };

    const handleAssignUser = (patientId: string, assigneeName: string) => {
        let originalPatient: WorklistPatient | undefined;
        setPatients(prev => {
            const newPatients = [...prev];
            const patientIndex = newPatients.findIndex(p => p.id === patientId);
            if (patientIndex !== -1) {
                originalPatient = newPatients[patientIndex];
                addHistoryEvent({
                    caseId: patientId,
                    patientName: originalPatient.metaData.patient.name,
                    actorId: 'user1',
                    actorName: 'Maria Garcia', // Assume current user
                    eventType: 'assignment_changed',
                    description: `assigned case to ${assigneeName}.`,
                    details: { oldValue: originalPatient.assignedTo.name, newValue: assigneeName },
                    source: 'user',
                }, originalPatient);
                newPatients[patientIndex] = { ...originalPatient, assignedTo: { name: assigneeName, avatarUrl: `https://i.pravatar.cc/150?u=${assigneeName.replace(' ', '')}` } };
            }
            return newPatients;
        });

        if (assigneeName === 'Maria Garcia') {
            logUserActivity('user1', patientId, 'assigned', 'You were assigned this case');
        }
    };

    const handleSelectView = (id: string) => {
        const selected = views.find(v => v.id === id);
        if (selected) { setSortConfig(selected.sortConfig); setKeywordFilter(selected.keywordFilter); setFilters(selected.filters || []); setActiveViewId(id); }
    };
    const handleSaveView = (name: string) => {
        const newView: WorklistView = { id: crypto.randomUUID(), name, sortConfig, keywordFilter, filters };
        setViews(prev => [...prev, newView]); setActiveViewId(newView.id);
    };
    const handleDeleteView = (id: string) => {
        if (id === 'default') { alert("Cannot delete the default view."); return; }
        setViews(prev => prev.filter(v => v.id !== id));
        if (activeViewId === id) handleSelectView('default');
    };
    
    useEffect(() => {
        if (!activeViewId) return;
        const activeView = views.find(v => v.id === activeViewId);
        if (!activeView) return;
        const sortIsSame = JSON.stringify(activeView.sortConfig) === JSON.stringify(sortConfig);
        const keywordIsSame = activeView.keywordFilter === keywordFilter;
        const filtersAreSame = JSON.stringify(activeView.filters) === JSON.stringify(filters);
        if (!sortIsSame || !keywordIsSame || !filtersAreSame) setActiveViewId(null);
    }, [sortConfig, keywordFilter, filters, activeViewId, views]);
    
    const handleTogglePin = useCallback((patientId: string) => {
        setPinnedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(patientId)) newSet.delete(patientId);
            else { if (newSet.size >= 5) { alert('You can only pin a maximum of 5 items.'); return prev; } newSet.add(patientId); }
            return newSet;
        });
    }, []);

    const handleExpandAll = useCallback(() => {
        setCollapsedGroups(new Set());
    }, []);

    const handleCollapseAll = useCallback(() => {
        if (!isGrouped) return;

        const getAllGroupIds = (groups: WorklistGroup[]): string[] => {
            let ids: string[] = [];
            for (const group of groups) {
                ids.push(group.id);
                if (group.subGroups && group.subGroups.length > 0) {
                    ids = ids.concat(getAllGroupIds(group.subGroups));
                }
            }
            return ids;
        };
        
        const allIds = getAllGroupIds((processedData as GroupedWorklist).groups);
        setCollapsedGroups(new Set(allIds));
    }, [isGrouped, processedData]);


    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {view === 'create' ? (
                <EstimateProvider>
                    <CreateCasePage onCancel={handleCancelCreate} onSave={handleSaveCase} showToast={showToast} />
                </EstimateProvider>
            ) : (
                <>
                    <header className="flex-shrink-0 bg-white border-b h-16 flex items-center justify-between px-6 z-20">
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight">PRE-SERVICE WORKSPACE</h1>
                        <div className="flex items-center space-x-4">
                            <ForYouButton count={forYouCases.length} onClick={handleOpenForYou} />
                            <ByYouButton count={byYouCases.length} onClick={handleOpenByYou} />
                            <CaseFeedButton badgeCount={unreadCollabCount} onClick={() => setIsCaseFeedOpen(true)} />
                            <HistoryFeedButton badgeCount={0} onClick={handleOpenGlobalHistory} />
                            <NotificationsButton badgeCount={unreadCount} onClick={() => setIsNotificationsOpen(true)} />
                            <HelpCircle className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
                            <Settings className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
                            <UserCircle className="h-7 w-7 text-gray-500 hover:text-gray-700 cursor-pointer" />
                        </div>
                    </header>
                    <main className="flex-1 flex flex-col p-6 overflow-auto">
                        <WorklistHeader
                            keywordFilter={keywordFilter}
                            setKeywordFilter={setKeywordFilter}
                            searchInputRef={searchInputRef}
                            views={views}
                            activeViewId={activeViewId}
                            handleSelectView={handleSelectView}
                            handleSaveView={handleSaveView}
                            handleDeleteView={handleDeleteView}
                            isLive={isLive}
                            hasNewData={hasNewData}
                            pendingCount={pendingPatients.length}
                            onToggleLive={handleToggleLive}
                            filters={filters}
                            onRemoveFilter={handleRemoveFilter}
                            isPrioritySortMode={isPrioritySortMode}
                            onTogglePrioritySort={handleTogglePrioritySort}
                            onCreate={handleCreateCase}
                            isFieldsPanelOpen={isFieldsPanelOpen}
                            onToggleFieldsPanel={() => setIsFieldsPanelOpen(!isFieldsPanelOpen)}
                            visibleColumnCount={orderedVisibleColumns.length}
                            onToggleFilterPanel={() => setIsFilterBuilderOpen(true)}
                            groupingPath={groupingPath}
                            onOpenGroupByPanel={() => setIsGroupByPanelOpen(true)}
                            onClearGrouping={handleClearGrouping}
                            onOpenSmartSavePanel={() => setIsSmartSavePanelOpen(true)}
                            smartSavePolicy={smartSavePolicy}
                            smartSaveScope={smartSaveScope}
                            hasUnsavedChanges={hasUnsavedChanges}
                        />
                        <div className="mt-4 flex-1">
                            <WorklistTable
                                data={paginatedData}
                                isGrouped={isGrouped}
                                collapsedGroups={collapsedGroups}
                                onToggleGroup={handleToggleGroupCollapse}
                                onToggleGroupSelection={handleToggleGroupSelection}
                                onSelectPatient={handleRowSelect}
                                selectedRows={selectedRows}
                                onToggleRow={handleToggleRow}
                                onToggleAllRows={handleToggleAllRows}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                activeRowIndex={activeRowIndex}
                                onAssignUser={handleAssignUser}
                                pinnedRows={pinnedRows}
                                onTogglePin={handleTogglePin}
                                isPrioritySortMode={isPrioritySortMode}
                                onOpenDispositionModal={handleOpenDispositionModal}
                                showToast={showToast}
                                onOpenPanel={handleOpenPanel}
                                orderedVisibleColumns={orderedVisibleColumns}
                                onRemoveColumn={handleToggleColumnVisibility}
                                onManageFields={() => setIsFieldsPanelOpen(true)}
                                onFilterColumn={handleFilterColumn}
                                onOpenCollaboration={handleOpenCollaborationDrawer}
                                onOpenHistory={handleOpenHistory}
                                onOpenJourney={handleOpenJourney}
                                notesVersion={notesVersion}
                                attachmentsVersion={attachmentsVersion}
                                onCollapseAll={handleCollapseAll}
                                onExpandAll={handleExpandAll}
                            />
                             <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                rowsPerPage={rowsPerPage}
                                totalRows={totalRows}
                                onPageChange={handlePageChange}
                                onRowsPerPageChange={handleRowsPerPageChange}
                            />
                        </div>
                    </main>
                    <BatchActionBar
                        selectedRowCount={selectedRows.size}
                        onClearSelection={() => setSelectedRows(new Set())}
                        onRunEB={handleBatchRunEB}
                        onAssign={handleBatchAssign}
                        onUpdateStatus={handleBatchUpdateStatus}
                        onAddNote={handleBatchAddNote}
                        onExport={handleBatchExport}
                        onComplete={handleBatchComplete}
                    />
                    <SidePanel isOpen={isPanelOpen} onClose={handlePanelClose} panelWidth={panelWidth} setPanelWidth={setPanelWidth} isPanelFullscreen={isPanelFullscreen} onToggleFullscreen={onToggleFullscreen} lastNonFullscreenWidth={lastNonFullscreenWidth} >
                        {selectedPatient && (
                          <EstimateProvider>
                              <EstimateCalculatorApp 
                                patientData={{
                                  metaData: selectedPatient.metaData,
                                  payers: selectedPatient.payers,
                                  procedures: selectedPatient.procedures
                                }}
                                onMarkComplete={() => handleConfirmDisposition(selectedPatient.id, { outcome: 'Cleared for Service', summary: 'Marked complete from panel view.' })}
                                onOpenJourney={() => handleOpenJourney(selectedPatient)}
                              />
                          </EstimateProvider>
                        )}
                    </SidePanel>
                     {toastInfo && <Toast key={toastInfo.id} message={toastInfo.message} onUndo={toastInfo.onUndo} onClose={() => setToastInfo(null)} />}
                     {dispositionState.isOpen && <DispositionComposerModal patient={dispositionState.patient} onClose={handleCloseDispositionModal} onConfirm={handleConfirmDisposition} />}
                     {panelState.type === 'edit' && activeColumnMetadata && (
                        <EditFieldPanel
                            isOpen={!!panelState.type}
                            onClose={handleClosePanel}
                            columnId={activeColumnMetadata.id}
                            fieldName={activeColumnMetadata.name}
                            fieldDescription={activeColumnMetadata.description || ''}
                            currentRating={3}
                            onSave={(name, rating) => {
                                showToast(`Field "${name}" properties updated.`);
                            }}
                            onDelete={() => {
                                showToast(`Field "${activeColumnMetadata.name}" deleted.`);
                            }}
                        />
                    )}
                    <FilterBuilderPanel 
                        isOpen={isFilterBuilderOpen}
                        onClose={() => setIsFilterBuilderOpen(false)}
                        activeFilters={filters}
                        onUpsertFilter={handleUpsertFilter}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                        onSaveView={handleSaveView}
                        views={views}
                        onApplyView={handleSelectView}
                        initialFilterState={initialFilterState}
                        onClearInitialState={() => setInitialFilterState(null)}
                    />
                    <FieldsManagementPanel 
                        isOpen={isFieldsPanelOpen}
                        onClose={() => setIsFieldsPanelOpen(false)}
                        orderedVisibleColumns={orderedVisibleColumns}
                        onFieldToggle={handleToggleColumnVisibility}
                        onFieldReorder={handleReorderColumns}
                    />
                     <NotificationsIntelligencePanel 
                        isOpen={isNotificationsOpen}
                        onClose={() => setIsNotificationsOpen(false)}
                        notifications={orchestratedNotifications}
                        unreadCount={unreadCount}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAllAsRead={handleMarkAllAsRead}
                        onDismiss={handleDismiss}
                    />
                    <CaseCollaborationDrawer
                        isOpen={isCollaborationDrawerOpen}
                        onClose={handleCloseCollaborationDrawer}
                        patient={activeCaseForCollaboration}
                        notes={notes}
                        attachments={attachments}
                        activities={activities}
                        reminders={reminders}
                        history={caseHistory}
                        onAddNote={handleAddNote}
                        onAddAttachment={handleAddAttachment}
                        onAddReminder={handleAddReminder}
                        onUpdateReminderStatus={handleUpdateReminderStatus}
                        aiSummary={activeAiSummary}
                        isAiSummaryLoading={isAiSummaryLoading}
                        onRegenerateSummary={() => activeCaseForCollaboration && handleRegenerateSummary(activeCaseForCollaboration.id)}
                        initialTab={collaborationDrawerInitialTab}
                    />
                    <CaseHistoryPanel
                        isOpen={isHistoryPanelOpen}
                        onClose={handleCloseHistory}
                        patient={activeCaseForHistory}
                        history={caseHistory}
                    />
                    <GlobalHistoryPanel
                        isOpen={isGlobalHistoryPanelOpen}
                        onClose={handleCloseGlobalHistory}
                        history={globalHistory}
                    />
                     <ForYouPanel isOpen={isForYouPanelOpen} onClose={() => setIsForYouPanelOpen(false)} rankedCases={forYouCases} onOpenCase={handleOpenCaseFromDiscovery} />
                     <ByYouPanel isOpen={isByYouPanelOpen} onClose={() => setIsByYouPanelOpen(false)} activityCases={byYouCases} onOpenCase={handleOpenCaseFromDiscovery} />
                    <CaseFeedPanel
                        isOpen={isCaseFeedOpen}
                        onClose={() => setIsCaseFeedOpen(false)}
                        feedData={aggregatedFeedData}
                        onOpenCase={handleOpenCaseFromFeed}
                        onAddNote={handleAddNoteFromFeed}
                    />
                    <GroupByPanel
                        isOpen={isGroupByPanelOpen}
                        onClose={() => setIsGroupByPanelOpen(false)}
                        onSetGroupingPath={handleSetGroupingPath}
                        groupingPath={groupingPath}
                        worklistData={patients}
                    />
                    <SmartSavePanel 
                        isOpen={isSmartSavePanelOpen}
                        onClose={() => setIsSmartSavePanelOpen(false)}
                        policy={smartSavePolicy}
                        onPolicyChange={setSmartSavePolicy}
                        scope={smartSaveScope}
                        onScopeChange={setSmartSaveScope}
                        hasUnsavedChanges={hasUnsavedChanges}
                        onSaveChanges={handleSaveChanges}
                        viewHistory={viewHistory}
                        onRestoreState={handleRestoreState}
                    />
                    {isJourneyViewOpen && activeCaseForJourney && (
                        <JourneyPage 
                            patient={activeCaseForJourney}
                            onClose={handleCloseJourney}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default WorklistPage;