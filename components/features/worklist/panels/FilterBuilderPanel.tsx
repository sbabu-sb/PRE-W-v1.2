import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Wand2, Save } from 'lucide-react';
import DrawerPanel from '../../../common/DrawerPanel';
import SelectField from '../../../common/SelectField';
import InputField from '../../../common/InputField';
import ActiveFilterItem from './ActiveFilterItem';
import { ColumnMetadata, FilterObject, FilterCondition, WorklistView, SortKey } from '../../../../types';
import { worklistColumnMetadata } from '../../../../data/columnMetadata';

const conditionsByType: Record<ColumnMetadata['type'], { value: FilterCondition; label: string }[]> = {
  numeric: [ { value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' }, { value: 'greater-than', label: 'Greater than' }, { value: 'less-than', label: 'Less than' }, { value: 'between', label: 'Between' }, { value: 'is-empty', label: 'Is empty' }, { value: 'is-not-empty', label: 'Is not empty' } ],
  text: [ { value: 'contains', label: 'Contains' }, { value: 'does-not-contain', label: 'Does not contain' }, { value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' }, { value: 'is-empty', label: 'Is empty' }, { value: 'is-not-empty', label: 'Is not empty' } ],
  date: [ { value: 'is', label: 'Is' }, { value: 'is-before', label: 'Is before' }, { value: 'is-after', label: 'Is after' }, { value: 'between', label: 'Between' }, { value: 'is-empty', label: 'Is empty' }, { value: 'is-not-empty', label: 'Is not empty' } ],
  enum: [ { value: 'is-any-of', label: 'Is any of' }, { value: 'is-none-of', label: 'Is none of' }, { value: 'is-empty', label: 'Is empty' }, { value: 'is-not-empty', label: 'Is not empty' } ],
  'multi-select': [ { value: 'includes-any-of', label: 'Includes any of' }, { value: 'includes-all-of', label: 'Includes all of' }, { value: 'excludes-all-of', label: 'Excludes all of' }, { value: 'is-empty', label: 'Is empty' }, { value: 'is-not-empty', label: 'Is not empty' } ],
  boolean: [ { value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' } ],
};

// --- Filter Editor Sub-Component ---
const FilterEditor: React.FC<{
    field: ColumnMetadata;
    existingFilter: FilterObject | null;
    onApply: (filter: FilterObject) => void;
    onCancel: () => void;
}> = ({ field, existingFilter, onApply, onCancel }) => {
    const availableConditions = conditionsByType[field.type] || conditionsByType.text;
    const [condition, setCondition] = useState<FilterCondition>(existingFilter?.condition || availableConditions[0].value);
    const [value1, setValue1] = useState(existingFilter?.value ?? '');
    const [value2, setValue2] = useState(existingFilter?.value2 ?? '');
    const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set(existingFilter?.values ?? []));

    const handleApply = () => {
        onApply({
            id: existingFilter?.id || crypto.randomUUID(),
            fieldId: field.id,
            fieldName: field.name,
            condition,
            value: value1,
            value2,
            values: Array.from(selectedValues),
            isEnabled: true,
            source: 'user',
        });
    };

    const handleCheckboxChange = (option: string) => {
        setSelectedValues(prev => {
            const newSet = new Set(prev);
            if (newSet.has(option)) newSet.delete(option); else newSet.add(option);
            return newSet;
        });
    };

    const renderInputs = () => {
        if (['is-empty', 'is-not-empty'].includes(condition)) return null;
        switch (field.type) {
            case 'numeric':
                return condition === 'between' ? (
                    <div className="flex gap-2"><InputField label="From" type="number" value={value1} onChange={e => setValue1(e.target.value)} /><InputField label="To" type="number" value={value2} onChange={e => setValue2(e.target.value)} /></div>
                ) : <InputField label="Value" type="number" value={value1} onChange={e => setValue1(e.target.value)} />;
            case 'date':
                return condition === 'between' ? (
                    <div className="flex gap-2"><InputField label="Start" type="date" value={value1} onChange={e => setValue1(e.target.value)} /><InputField label="End" type="date" value={value2} onChange={e => setValue2(e.target.value)} /></div>
                ) : <InputField label="Date" type="date" value={value1} onChange={e => setValue1(e.target.value)} />;
            case 'enum': case 'multi-select':
                return <div className="space-y-2 max-h-64 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50">{field.options?.map(option => <label key={option} className="flex items-center p-2 rounded-md hover:bg-white cursor-pointer"><input type="checkbox" checked={selectedValues.has(option)} onChange={() => handleCheckboxChange(option)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="ml-3 text-sm text-gray-700">{option}</span></label>)}</div>;
            default: return <InputField label="Value" type="text" value={value1} onChange={e => setValue1(e.target.value)} />;
        }
    };

    return (
        <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-4">
            <h4 className="font-semibold text-gray-800">Filter by: {field.name}</h4>
            <SelectField label="Condition" value={condition} onChange={e => setCondition(e.target.value as FilterCondition)}>{availableConditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</SelectField>
            {renderInputs()}
            <div className="flex justify-end gap-2 pt-2 border-t"><button onClick={onCancel} className="px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-gray-200">Cancel</button><button onClick={handleApply} className="px-3 py-1.5 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700">Apply</button></div>
        </div>
    );
};

// --- Main Panel Component ---
interface FilterBuilderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: FilterObject[];
  onUpsertFilter: (filter: FilterObject) => void;
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
  onSaveView: (name: string) => void;
  views: WorklistView[];
  onApplyView: (viewId: string) => void;
  initialFilterState: { filterId?: string; fieldId?: SortKey } | null;
  onClearInitialState: () => void;
}

const FilterBuilderPanel: React.FC<FilterBuilderPanelProps> = ({ isOpen, onClose, activeFilters, onUpsertFilter, onRemoveFilter, onClearAll, onSaveView, views, onApplyView, initialFilterState, onClearInitialState }) => {
    const [mode, setMode] = useState<'list' | 'pickingField' | 'editingFilter'>('list');
    const [fieldToEdit, setFieldToEdit] = useState<ColumnMetadata | null>(null);
    const [filterToEdit, setFilterToEdit] = useState<FilterObject | null>(null);
    
    const filterableFields = useMemo(() => worklistColumnMetadata.filter(f => f.isFilterable), []);
    
    useEffect(() => {
        if (!isOpen) {
            setMode('list');
            setFieldToEdit(null);
            setFilterToEdit(null);
        } else if (initialFilterState) {
            const { filterId, fieldId } = initialFilterState;
            let targetFilter: FilterObject | null = null;
            let targetField: ColumnMetadata | null = null;
            
            if (filterId) {
                targetFilter = activeFilters.find(f => f.id === filterId) || null;
                if (targetFilter) {
                    targetField = filterableFields.find(f => f.id === targetFilter.fieldId) || null;
                }
            } else if (fieldId) {
                targetField = filterableFields.find(f => f.id === fieldId) || null;
            }

            if (targetField) {
                setFieldToEdit(targetField);
                setFilterToEdit(targetFilter);
                setMode('editingFilter');
            }
            onClearInitialState(); // Reset the trigger
        }
    }, [isOpen, initialFilterState, onClearInitialState, activeFilters, filterableFields]);


    const handleAddFilterClick = () => setMode('pickingField');
    const handleFieldPicked = (field: ColumnMetadata) => { setFieldToEdit(field); setFilterToEdit(null); setMode('editingFilter'); };
    const handleEditFilterClick = (filter: FilterObject) => {
        const field = filterableFields.find(f => f.id === filter.fieldId);
        if (field) { setFieldToEdit(field); setFilterToEdit(filter); setMode('editingFilter'); }
    };

    const handleApplyFilter = (filter: FilterObject) => { onUpsertFilter(filter); setMode('list'); };

    const handleSaveView = () => {
        const name = prompt("Enter a name for this view:");
        if (name) onSaveView(name);
    };

    const footer = (
        <div className="flex justify-between items-center">
            <button onClick={onClearAll} disabled={activeFilters.length === 0} className="flex items-center gap-2 text-sm text-red-600 font-semibold hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"><Trash2 className="h-4 w-4" /> Clear all</button>
            <button onClick={handleSaveView} disabled={activeFilters.length === 0} className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 px-3 py-1.5 rounded-md disabled:opacity-50"><Save className="h-4 w-4" /> Save as view...</button>
        </div>
    );

    return (
        <DrawerPanel isOpen={isOpen} onClose={onClose} title="Filters" subtitle="Add filters to control which records are shown." footer={footer}>
            <div className="space-y-4">
                {mode === 'editingFilter' && fieldToEdit ? (
                    <FilterEditor field={fieldToEdit} existingFilter={filterToEdit} onApply={handleApplyFilter} onCancel={() => setMode('list')} />
                ) : mode === 'pickingField' ? (
                    <div className="p-2 bg-gray-50 border rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Select a field to filter by</h4>
                        <ul className="space-y-1 max-h-96 overflow-y-auto">{filterableFields.map(field => <li key={field.id} onClick={() => handleFieldPicked(field)} className="p-2 rounded-md hover:bg-blue-100 cursor-pointer text-sm font-medium">{field.name}</li>)}</ul>
                        <button onClick={() => setMode('list')} className="w-full mt-2 text-sm py-1.5 rounded-md hover:bg-gray-200">Cancel</button>
                    </div>
                ) : ( <>
                    {activeFilters.length > 0 && <div className="space-y-2">{activeFilters.map(f => <ActiveFilterItem key={f.id} filter={f} onEdit={() => handleEditFilterClick(f)} onRemove={() => onRemoveFilter(f.id)} />)}</div>}
                    <button onClick={handleAddFilterClick} className="w-full bg-blue-50 text-blue-700 font-semibold py-2 rounded-md hover:bg-blue-100 text-sm flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> Add a filter</button>
                    
                    <div className="pt-4 border-t"><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Gemini Suggestions</h4><p className="text-sm text-center text-gray-500 py-4 italic">AI suggestions are coming soon.</p></div>
                    <div className="pt-4 border-t"><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Saved Views</h4>
                        {views.length > 0 ? (
                            <ul className="space-y-1">{views.map(v => <li key={v.id} onClick={() => onApplyView(v.id)} className="p-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm">{v.name}</li>)}</ul>
                        ) : (<p className="text-sm text-center text-gray-500 py-4 italic">No saved views yet.</p>)}
                    </div>
                </>)}
            </div>
        </DrawerPanel>
    );
};

export default FilterBuilderPanel;