import React from 'react';
import { Search, Plus, Activity, X, BrainCircuit, List, Columns, Library, Settings, HelpCircle, UserCircle } from 'lucide-react';
import ViewsDropdown from './ViewsDropdown';
import { WorklistPatient, WorklistView, FilterObject, SortKey, SmartSaveMode, SmartSaveScope } from '../../../types';
import { worklistColumnMetadata } from '../../../data/columnMetadata';
import FilterButton from './FilterButton';
import GroupByButton from './GroupByButton';
import SmartSaveButton from './smart-save/SmartSaveButton';
import HistoryFeedButton from './HistoryFeedButton';
import CaseFeedButton from './CaseFeedButton';
import NotificationsButton from '../../features/notifications/NotificationsButton';
import ForYouButton from './ForYouButton';
import ByYouButton from './ByYouButton';


interface FilterPillsDisplayProps {
    filters: FilterObject[];
    onRemoveFilter: (filterId: string) => void;
}

const FilterPillsDisplay: React.FC<FilterPillsDisplayProps> = ({ filters, onRemoveFilter }) => {
    if (filters.length === 0) return null;

    const getFilterPillText = (filter: FilterObject): string => {
        const name = filter.fieldName || filter.fieldId;
        const conditionText = filter.condition.replace(/-/g, ' ');

        let valueText = '';
        if (filter.values && filter.values.length > 0) {
            valueText = filter.values.length > 2
                ? `[${filter.values[0]}, ${filter.values[1]}, ...]`
                : `[${filter.values.join(', ')}]`;
        } else if (filter.condition === 'between') {
            valueText = `${filter.value} and ${filter.value2}`;
        } else {
            valueText = filter.value;
        }

        if (['is-empty', 'is-not-empty'].includes(filter.condition)) {
            return `${name} ${conditionText}`;
        }

        return `${name} ${conditionText} ${valueText}`;
    };

    return (
        <div className="flex items-center flex-wrap gap-2">
            {filters.map(filter => (
                <div key={filter.id} className="flex items-center space-x-1 bg-blue-100 text-blue-800 rounded-md p-1 pl-2 text-sm animate-fade-in">
                    <span className="font-medium" title={getFilterPillText(filter)}>{getFilterPillText(filter)}</span>
                    <button onClick={() => onRemoveFilter(filter.id)} className="p-1 rounded-full hover:bg-blue-200"><X className="h-3 w-3" /></button>
                </div>
            ))}
        </div>
    );
};


interface WorklistHeaderProps {
    keywordFilter: string;
    setKeywordFilter: (query: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    views: WorklistView[];
    activeViewId: string | null;
    handleSelectView: (id: string) => void;
    handleSaveView: (name: string) => void;
    handleDeleteView: (id: string) => void;
    isLive: boolean;
    hasNewData: boolean;
    pendingCount: number;
    onToggleLive: () => void;
    filters: FilterObject[];
    onRemoveFilter: (filterId: string) => void;
    isPrioritySortMode: boolean;
    onTogglePrioritySort: () => void;
    onCreate: () => void;
    isFieldsPanelOpen: boolean;
    onToggleFieldsPanel: () => void;
    visibleColumnCount: number;
    onToggleFilterPanel: () => void;
    groupingPath: SortKey[];
    onOpenGroupByPanel: () => void;
    onClearGrouping: () => void;
    onOpenSmartSavePanel: () => void;
    smartSavePolicy: SmartSaveMode;
    smartSaveScope: SmartSaveScope;
    hasUnsavedChanges: boolean;
    onOpenGlobalHistory: () => void;
    unreadCollabCount: number;
    onOpenCaseFeed: () => void;
    unreadNotifCount: number;
    onOpenNotifications: () => void;
    forYouCount: number;
    onOpenForYou: () => void;
    byYouCount: number;
    onOpenByYou: () => void;
}

const WorklistHeader: React.FC<WorklistHeaderProps> = ({
    keywordFilter, setKeywordFilter, searchInputRef, views, activeViewId, handleSelectView,
    handleSaveView, handleDeleteView, isLive, hasNewData, pendingCount, onToggleLive,
    filters, onRemoveFilter, isPrioritySortMode, onTogglePrioritySort,
    onCreate, isFieldsPanelOpen, onToggleFieldsPanel, visibleColumnCount, onToggleFilterPanel,
    groupingPath, onOpenGroupByPanel, onClearGrouping, onOpenSmartSavePanel,
    smartSavePolicy, smartSaveScope, hasUnsavedChanges, onOpenGlobalHistory,
    unreadCollabCount, onOpenCaseFeed, unreadNotifCount, onOpenNotifications,
    forYouCount, onOpenForYou, byYouCount, onOpenByYou,
}) => {

    return (
        <div className="flex-shrink-0 bg-white p-6 pb-4 border-b border-gray-200/80 space-y-4">
             <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">PRE-SERVICE WORKSPACE</h1>
                <div className="flex items-center space-x-4">
                    <ForYouButton count={forYouCount} onClick={onOpenForYou} />
                    <ByYouButton count={byYouCount} onClick={onOpenByYou} />
                    <CaseFeedButton badgeCount={unreadCollabCount} onClick={onOpenCaseFeed} />
                    <HistoryFeedButton badgeCount={0} onClick={onOpenGlobalHistory} />
                    <NotificationsButton badgeCount={unreadNotifCount} onClick={onOpenNotifications} />
                    <HelpCircle className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
                    <Settings className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
                    <UserCircle className="h-7 w-7 text-gray-500 hover:text-gray-700 cursor-pointer" />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold text-gray-800">Cases</h2>
                    <ViewsDropdown views={views} activeViewId={activeViewId} onSelectView={handleSelectView} onSaveView={handleSaveView} onDeleteView={handleDeleteView} />
                    <GroupByButton groupingPath={groupingPath} onClick={onOpenGroupByPanel} onClear={onClearGrouping} />
                    <SmartSaveButton
                        onClick={onOpenSmartSavePanel}
                        mode={smartSavePolicy}
                        scope={smartSaveScope}
                        hasUnsavedChanges={hasUnsavedChanges}
                    />
                     <button onClick={onTogglePrioritySort} title="Toggle between AI-powered priority ranking and manual column sorting"
                        className={`flex items-center space-x-2 text-sm font-semibold h-10 px-4 rounded-md border transition-colors ${
                            isPrioritySortMode 
                                ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {isPrioritySortMode ? <BrainCircuit className="h-4 w-4 text-blue-500" /> : <List className="h-4 w-4 text-gray-500" />}
                        <span>{isPrioritySortMode ? 'Priority Rank' : 'Manual Sort'}</span>
                    </button>
                    <div className="relative">
                        <button onClick={onToggleFieldsPanel} className="flex items-center space-x-2 text-sm font-semibold text-gray-700 h-10 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50">
                            <Columns className="h-4 w-4 text-gray-500" />
                            <span>Fields</span>
                            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{visibleColumnCount}</span>
                        </button>
                    </div>
                     <FilterButton activeCount={filters.length} onClick={onToggleFilterPanel} />
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={onToggleLive} className="relative flex items-center space-x-2 text-sm font-semibold h-10 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50">
                        <Activity className={`h-4 w-4 ${isLive ? 'text-green-500' : hasNewData ? 'text-blue-500' : 'text-gray-500'}`} />
                        <span className={`${isLive ? 'text-green-700' : hasNewData ? 'text-blue-700' : 'text-gray-600'}`}>{isLive ? 'Live' : `Paused ${hasNewData ? `(${pendingCount} New)` : ''}`}</span>
                        {hasNewData && !isLive && <span className="absolute top-0 right-0 -mr-1 -mt-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
                    </button>
                    <button onClick={onCreate} className="h-10 px-4 flex items-center space-x-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition shadow-sm">
                        <Plus className="h-5 w-5" /><span>Create</span>
                    </button>
                </div>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg border border-gray-200/80 flex items-center space-x-2 flex-wrap gap-y-2">
                <div className="relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input ref={searchInputRef} type="text" value={keywordFilter} onChange={(e) => setKeywordFilter(e.target.value)} placeholder="Keyword search..."
                        className="w-52 h-9 pl-9 pr-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition bg-white text-sm" />
                </div>
                <FilterPillsDisplay filters={filters} onRemoveFilter={onRemoveFilter} />
            </div>
        </div>
    );
};

export default WorklistHeader;
