import React, { useState, useEffect } from 'react';
import { Layers, X, Wand2, Loader } from 'lucide-react';
import { SortKey, AIGroupingSuggestion, WorklistPatient } from '../../../../types';
import { worklistColumnMetadata } from '../../../../data/columnMetadata';
import DrawerPanel from '../../../common/DrawerPanel';
import { fetchGroupingSuggestions } from '../../../../services/geminiService';

interface GroupByPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSetGroupingPath: (path: SortKey[]) => void;
  groupingPath: SortKey[];
  worklistData: WorklistPatient[];
}

const GroupByPanel: React.FC<GroupByPanelProps> = ({ isOpen, onClose, onSetGroupingPath, groupingPath, worklistData }) => {
  const [suggestions, setSuggestions] = useState<AIGroupingSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && suggestions.length === 0 && !isLoadingSuggestions) {
      const getSuggestions = async () => {
        setIsLoadingSuggestions(true);
        setSuggestionError(null);

        const summary = {
          total: worklistData.length,
          statuses: worklistData.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          authStates: worklistData.reduce((acc, p) => {
            const status = p.authStatus || 'Not Checked';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };

        const result = await fetchGroupingSuggestions(summary);
        if (result.success && result.data) {
          setSuggestions(result.data);
        } else {
          setSuggestionError(result.error || 'Failed to get suggestions.');
        }
        setIsLoadingSuggestions(false);
      };
      getSuggestions();
    }
  }, [isOpen, worklistData, suggestions, isLoadingSuggestions]);
  
  const groupableFields = worklistColumnMetadata.filter(c => c.groupable);
  const availableFields = groupableFields.filter(f => !groupingPath.includes(f.id));

  const handleAddGroup = (fieldId: SortKey) => {
    if (groupingPath.length < 3) {
      onSetGroupingPath([...groupingPath, fieldId]);
    }
  };

  const handleRemoveGroup = (index: number) => {
    onSetGroupingPath(groupingPath.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    onSetGroupingPath([]);
  };
  
  const footer = (
    <div className="flex justify-between items-center">
        <button onClick={handleClear} disabled={groupingPath.length === 0} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:text-gray-400">
            Reset to flat view
        </button>
    </div>
  );

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title="Group by" subtitle="Cluster your worklist into lanes." footer={footer}>
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-purple-500" />
            AI Suggestions
          </h4>
          {isLoadingSuggestions ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-3 bg-gray-100 rounded-md animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : suggestionError ? (
            <p className="text-sm text-red-500 text-center py-4">{suggestionError}</p>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSetGroupingPath(suggestion.path)}
                  className="w-full text-left p-3 rounded-md border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors"
                >
                  <p className="font-semibold text-purple-800">
                    Group by {suggestion.path.map(p => worklistColumnMetadata.find(c => c.id === p)?.name || p).join(' → ')}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{suggestion.rationale}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No suggestions available.</p>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Active Grouping</h4>
          {groupingPath.length > 0 ? (
            <div className="space-y-2">
              {groupingPath.map((fieldId, index) => {
                const field = worklistColumnMetadata.find(f => f.id === fieldId);
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                    <span className="text-sm font-medium text-blue-800">
                      {index > 0 && <span className="text-gray-400 mr-2">→</span>}
                      {field?.name || fieldId}
                    </span>
                    <button onClick={() => handleRemoveGroup(index)} className="p-1 rounded-full hover:bg-blue-200 text-blue-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No grouping applied.</p>
          )}
        </div>

        {groupingPath.length < 3 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {groupingPath.length === 0 ? 'Select a field to group by' : '+ Add sub-group'}
            </h4>
            <div className="space-y-2">
              {availableFields.map(field => (
                <button
                  key={field.id}
                  onClick={() => handleAddGroup(field.id)}
                  className="w-full text-left p-3 rounded-md text-sm font-medium flex items-center gap-3 transition-colors hover:bg-gray-100 text-gray-800"
                >
                  <Layers className="h-4 w-4 text-gray-500" />
                  {field.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DrawerPanel>
  );
};

export default GroupByPanel;