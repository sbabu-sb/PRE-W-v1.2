import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit3, ArrowUp, ArrowDown, EyeOff, LayoutDashboard, Columns, Filter } from 'lucide-react';

interface ColumnHeaderMenuTrayProps {
  onEditField: () => void;
  onSortAscending: () => void;
  onSortDescending: () => void;
  onViewAsBoard: () => void;
  onRemoveFromView: () => void;
  onAddRemoveColumns: () => void;
  onFilter: () => void;
}

const ColumnHeaderMenuTray: React.FC<ColumnHeaderMenuTrayProps> = ({
  onEditField,
  onSortAscending,
  onSortDescending,
  onViewAsBoard,
  onRemoveFromView,
  onAddRemoveColumns,
  onFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);


  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
            e.stopPropagation(); // Prevent row click and sort action
            setIsOpen(prev => !prev);
        }}
        className="p-1 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Column actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border border-gray-200/80 animate-fade-in"
          role="menu"
          aria-orientation="vertical"
        >
          <ul className="py-1 text-sm text-gray-700">
            <li role="menuitem" tabIndex={-1} onKeyDown={e => e.key === 'Enter' && handleAction(onFilter)} onClick={() => handleAction(onFilter)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"><Filter className="h-4 w-4 mr-3 text-gray-500" />Filter</li>
            <div className="border-t my-1 mx-2"></div>
            <li role="menuitem" tabIndex={-1} onKeyDown={e => e.key === 'Enter' && handleAction(onEditField)} onClick={() => handleAction(onEditField)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"><Edit3 className="h-4 w-4 mr-3 text-gray-500" />Edit field</li>
            <li role="menuitem" tabIndex={-1} onKeyDown={e => e.key === 'Enter' && handleAction(onSortAscending)} onClick={() => handleAction(onSortAscending)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"><ArrowUp className="h-4 w-4 mr-3 text-gray-500" />Sort ascending</li>
            <li role="menuitem" tabIndex={-1} onKeyDown={e => e.key === 'Enter' && handleAction(onSortDescending)} onClick={() => handleAction(onSortDescending)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"><ArrowDown className="h-4 w-4 mr-3 text-gray-500" />Sort descending</li>
            <div className="border-t my-1 mx-2"></div>
            <li role="menuitem" tabIndex={-1} onKeyDown={e => e.key === 'Enter' && handleAction(onViewAsBoard)} onClick={() => handleAction(onViewAsBoard)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"><LayoutDashboard className="h-4 w-4 mr-3 text-gray-500" />View as board</li>
            <li role="menuitem" tabIndex={-1} onKeyDown={e => e.key === 'Enter' && handleAction(onRemoveFromView)} onClick={() => handleAction(onRemoveFromView)} className="px-3 py-2 hover:bg-gray-100 text-red-600 cursor-pointer flex items-center"><EyeOff className="h-4 w-4 mr-3" />Remove from view</li>
            <li role="menuitem" tabIndex={-1} onKeyDown={e => e.key === 'Enter' && handleAction(onAddRemoveColumns)} onClick={() => handleAction(onAddRemoveColumns)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"><Columns className="h-4 w-4 mr-3 text-gray-500" />Manage fields</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ColumnHeaderMenuTray;