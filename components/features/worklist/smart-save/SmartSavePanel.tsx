import React from 'react';
import DrawerPanel from '../../../common/DrawerPanel';
import { SmartSaveMode, SmartSaveScope, ViewState } from '../../../../types';
import { Undo, Pin, GitCompareArrows, Save } from 'lucide-react';
import { formatRelativeTime } from '../../../../utils/formatters';

interface SmartSavePanelProps {
  isOpen: boolean;
  onClose: () => void;
  policy: SmartSaveMode;
  onPolicyChange: (mode: SmartSaveMode) => void;
  scope: SmartSaveScope;
  onScopeChange: (scope: SmartSaveScope) => void;
  hasUnsavedChanges: boolean;
  onSaveChanges: () => void;
  viewHistory: ViewState[];
  onRestoreState: (viewId: string) => void;
}

const SmartSavePanel: React.FC<SmartSavePanelProps> = ({ 
    isOpen, 
    onClose,
    policy,
    onPolicyChange,
    scope,
    onScopeChange,
    hasUnsavedChanges,
    onSaveChanges,
    viewHistory,
    onRestoreState
}) => {
    // Mock user permissions for UI display
    const availableScopes: SmartSaveScope[] = ['user', 'team'];

    const footer = policy === 'manual' ? (
        <div className="flex justify-end">
            <button
                onClick={onSaveChanges}
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                <Save className="h-4 w-4" />
                {hasUnsavedChanges ? 'Save Changes' : 'No Changes to Save'}
            </button>
        </div>
    ) : undefined;

    const generateViewDescription = (view: ViewState): string => {
        const parts: string[] = [];
        if (view.grouping?.path?.length > 0) {
            parts.push(`Grouped by ${view.grouping.path.join(' → ')}`);
        }
        if (view.filters?.length > 0) {
            parts.push(`${view.filters.length} filter${view.filters.length > 1 ? 's' : ''}`);
        }
        if (view.sorting && !view.sorting.isPriorityMode && view.sorting.manualSort) {
            parts.push(`Sorted by ${view.sorting.manualSort.fieldId}`);
        }
        if (parts.length === 0) return "Default view";
        return parts.join(', ');
    };

    return (
        <DrawerPanel
            isOpen={isOpen}
            onClose={onClose}
            title="SmartSave"
            subtitle="Control how this view is captured and restored."
            footer={footer}
        >
            <div className="space-y-8">
                {/* Section 1: Save Policy */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Save Policy</h3>
                    <div className="space-y-2">
                        <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${policy === 'auto' ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                            <input type="radio" name="save-policy" value="auto" checked={policy === 'auto'} onChange={() => onPolicyChange('auto')} className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <div className="ml-3">
                                <p className="font-medium text-gray-900">Auto (Recommended)</p>
                                <p className="text-xs text-gray-500">Automatically save every meaningful view change.</p>
                            </div>
                        </label>
                         <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${policy === 'prompt' ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                            <input type="radio" name="save-policy" value="prompt" checked={policy === 'prompt'} onChange={() => onPolicyChange('prompt')} className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <div className="ml-3">
                                <p className="font-medium text-gray-900">Prompt Me</p>
                                <p className="text-xs text-gray-500">Ask to save after important changes.</p>
                            </div>
                        </label>
                         <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${policy === 'manual' ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                            <input type="radio" name="save-policy" value="manual" checked={policy === 'manual'} onChange={() => onPolicyChange('manual')} className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <div className="ml-3">
                                <p className="font-medium text-gray-900">Manual Only</p>
                                <p className="text-xs text-gray-500">Only save when I explicitly click "Save".</p>
                            </div>
                        </label>
                    </div>
                </section>

                {/* Section 2: Save Scope */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Save Scope</h3>
                     <div className="space-y-2">
                         {availableScopes.includes('user') && (
                            <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${scope === 'user' ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                                <input type="radio" name="save-scope" value="user" checked={scope === 'user'} onChange={() => onScopeChange('user')} className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <div className="ml-3">
                                    <p className="font-medium text-gray-900">For me only (Personal)</p>
                                </div>
                            </label>
                         )}
                         {availableScopes.includes('team') && (
                             <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${scope === 'team' ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                                <input type="radio" name="save-scope" value="team" checked={scope === 'team'} onChange={() => onScopeChange('team')} className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <div className="ml-3">
                                    <p className="font-medium text-gray-900">For my team (Auth Team)</p>
                                </div>
                            </label>
                         )}
                         {availableScopes.includes('org') && (
                             <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${scope === 'org' ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                                <input type="radio" name="save-scope" value="org" checked={scope === 'org'} onChange={() => onScopeChange('org')} className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <div className="ml-3">
                                    <p className="font-medium text-gray-900">As organization default</p>
                                </div>
                            </label>
                         )}
                    </div>
                </section>

                {/* Section 3: Recent View States */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent View States</h3>
                    {viewHistory.length > 0 ? (
                        <ul className="space-y-2">
                            {viewHistory.map((item, index) => (
                                <li key={item.id} className="p-3 border rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm text-gray-700 font-medium pr-4">{generateViewDescription(item)}</p>
                                        <span className="text-xs text-gray-500 flex-shrink-0">{formatRelativeTime(item.updatedAt)}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <button onClick={() => onRestoreState(item.id)} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"><Undo className="h-3 w-3" /> Restore</button>
                                        <button className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:underline"><Pin className="h-3 w-3" /> Pin</button>
                                        <button className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:underline"><GitCompareArrows className="h-3 w-3" /> Diff</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-center text-gray-500 py-4">No view history yet.</p>
                    )}
                </section>
                
                {/* Section 4: Auto-Reapply Rules */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Auto-Reapply Rules (AI)</h3>
                    <div className="space-y-3">
                         <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                            <span className="text-sm text-gray-700">When I return, reapply my last view</span>
                        </label>
                         <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">When data matches a past scenario, reapply that view</span>
                        </label>
                    </div>
                </section>
            </div>
        </DrawerPanel>
    );
};

export default SmartSavePanel;