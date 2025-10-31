import React, { useState, useMemo, useRef } from 'react';
import { GripVertical, Search, Plus } from 'lucide-react';
import { SortKey } from '../../../types';
// FIX: Corrected import from the non-existent 'worklistColumns' to 'columnMetadata'.
import { worklistColumnMetadata } from '../../../data/columnMetadata';
import DrawerPanel from '../../common/DrawerPanel';
import InputField from '../../common/InputField';

interface FieldsManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  orderedVisibleColumns: SortKey[];
  onFieldToggle: (fieldId: SortKey) => void;
  onFieldReorder: (reorderedColumns: SortKey[]) => void;
}

interface FieldItemProps {
  fieldId: SortKey;
  isVisible: boolean;
  onToggle: (id: SortKey) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLLIElement>, id: SortKey) => void;
  onDragOver?: (e: React.DragEvent<HTMLLIElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLLIElement>, id: SortKey) => void;
  isDragging?: boolean;
}

const FieldItem: React.FC<FieldItemProps> = ({ fieldId, isVisible, onToggle, isDraggable, onDragStart, onDragOver, onDrop, isDragging }) => {
  const column = worklistColumnMetadata.find(c => c.id === fieldId);
  if (!column) return null;

  return (
    <li
      draggable={isDraggable}
      onDragStart={isDraggable ? e => onDragStart?.(e, fieldId) : undefined}
      onDragOver={isDraggable ? onDragOver : undefined}
      onDrop={isDraggable ? e => onDrop?.(e, fieldId) : undefined}
      className={`flex items-center justify-between p-2 rounded-md hover:bg-gray-100 transition-colors ${isDraggable ? 'cursor-grab' : ''} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        {isDraggable && <GripVertical className="h-4 w-4 text-gray-400" />}
        {/* FIX: Changed property access from .title to .name to match ColumnMetadata type */}
        <span className="text-sm font-medium text-gray-800">{column.name}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isVisible}
          onChange={() => onToggle(fieldId)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </li>
  );
};

const FieldsManagementPanel: React.FC<FieldsManagementPanelProps> = ({
  isOpen, onClose, orderedVisibleColumns, onFieldToggle, onFieldReorder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedId, setDraggedId] = useState<SortKey | null>(null);

  const filteredColumns = useMemo(() => {
    return worklistColumnMetadata.filter(col =>
      // FIX: Changed property access from .title to .name to match ColumnMetadata type
      col.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const visibleFields = useMemo(() => {
    return orderedVisibleColumns.filter(id => filteredColumns.some(c => c.id === id));
  }, [orderedVisibleColumns, filteredColumns]);
  
  const availableFields = useMemo(() => {
    const visibleSet = new Set(orderedVisibleColumns);
    return filteredColumns.filter(col => !visibleSet.has(col.id));
  }, [orderedVisibleColumns, filteredColumns]);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: SortKey) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: SortKey) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const currentOrder = [...orderedVisibleColumns];
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex > -1 && targetIndex > -1) {
      const [removed] = currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, removed);
      onFieldReorder(currentOrder);
    }
    setDraggedId(null);
  };

  const footer = (
    <button className="w-full bg-blue-50 text-blue-700 font-semibold py-2 rounded-md hover:bg-blue-100 text-sm flex items-center justify-center gap-2">
      <Plus className="h-4 w-4" /> Create a new field
    </button>
  );

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title="Fields" footer={footer}>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search all space fields"
            className="w-full pl-9 pr-3 py-2 border rounded-md bg-gray-50 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Visible Fields Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Fields in this view</h4>
          <ul className="space-y-1">
            {visibleFields.map(fieldId => (
              <FieldItem
                key={fieldId}
                fieldId={fieldId}
                isVisible={true}
                onToggle={onFieldToggle}
                isDraggable={true}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggedId === fieldId}
              />
            ))}
             {visibleFields.length === 0 && <p className="text-xs text-center text-gray-500 p-2">No visible fields match your search.</p>}
          </ul>
        </div>
        
        {/* Available Fields Section */}
        <details className="group" open={availableFields.length > 0 && searchTerm.length > 0}>
          <summary className="text-xs font-semibold text-gray-500 uppercase list-none cursor-pointer">
            Available fields ({availableFields.length})
          </summary>
          <p className="text-xs text-gray-500 mt-1 mb-2">Toggle a field to add it to this view.</p>
          <ul className="space-y-1 mt-2">
            {availableFields.map(field => (
              <FieldItem key={field.id} fieldId={field.id} isVisible={false} onToggle={onFieldToggle} />
            ))}
            {availableFields.length === 0 && searchTerm && <p className="text-xs text-center text-gray-500 p-2">No available fields match your search.</p>}
          </ul>
        </details>
      </div>
    </DrawerPanel>
  );
};

export default FieldsManagementPanel;