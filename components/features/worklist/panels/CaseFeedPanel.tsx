import React, { useState, useMemo } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { WorklistPatient, CaseNote, CaseAttachment, CaseReminder } from '../../../../types';
import CaseFeedItem from './collaboration/CaseFeedItem';

interface CaseFeedPanelProps {
    isOpen: boolean;
    onClose: () => void;
    feedData: { patient: WorklistPatient; activities: (CaseNote | CaseAttachment | CaseReminder)[] }[];
    onOpenCase: (patient: WorklistPatient) => void;
    onAddNote: (patient: WorklistPatient) => void;
}

const CaseFeedPanel: React.FC<CaseFeedPanelProps> = ({ isOpen, onClose, feedData, onOpenCase, onAddNote }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'notes' | 'attachments' | 'reminders'>('all');

    const isNote = (item: any): item is CaseNote => 'content' in item;
    const isAttachment = (item: any): item is CaseAttachment => 'fileName' in item;
    const isReminder = (item: any): item is CaseReminder => 'dueAt' in item;


    const filteredFeedData = useMemo(() => {
        return feedData
            .map(item => {
                const filteredActivities = item.activities.filter(activity => {
                    const typeMatch = filterType === 'all' 
                        || (filterType === 'notes' && isNote(activity)) 
                        || (filterType === 'attachments' && isAttachment(activity))
                        || (filterType === 'reminders' && isReminder(activity));
                    
                    if (!typeMatch) return false;

                    if (searchTerm) {
                        const lowerSearch = searchTerm.toLowerCase();
                        let content = '';
                        let author = '';
                        
                        if (isNote(activity)) {
                            content = activity.content;
                            author = activity.authorName;
                        } else if (isAttachment(activity)) {
                            content = activity.fileName;
                            author = activity.uploadedBy;
                        } else if (isReminder(activity)) {
                            content = activity.title;
                            author = activity.createdByName;
                        }
                        
                        const patientName = item.patient.metaData.patient.name;
                        const caseId = item.patient.id;
                        
                        return content.toLowerCase().includes(lowerSearch) 
                            || author.toLowerCase().includes(lowerSearch)
                            || patientName.toLowerCase().includes(lowerSearch)
                            || caseId.toLowerCase().includes(lowerSearch);
                    }
                    return true;
                });

                return { ...item, activities: filteredActivities };
            })
            .filter(item => item.activities.length > 0);
    }, [feedData, searchTerm, filterType]);


    if (!isOpen) return null;

    const FilterPill: React.FC<{label: string, type: typeof filterType, activeType: typeof filterType, onClick: (type: typeof filterType) => void}> = ({ label, type, activeType, onClick}) => {
        const isActive = type === activeType;
        return (
             <button 
                onClick={() => onClick(type)}
                className={`px-2.5 py-1 text-sm font-medium rounded-full transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
                {label}
            </button>
        )
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black/40 z-[1050] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div
                className={`fixed inset-y-0 right-0 pt-16 bg-slate-50 shadow-2xl flex flex-col z-[1100] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: 'clamp(320px, 20vw, 480px)' }}
                role="dialog"
            >
                <header className="flex-shrink-0 p-4 border-b bg-white space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">Global Case Feed</h2>
                        <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search feed..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 border rounded-md bg-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                     <div className="flex items-center gap-2">
                        <FilterPill label="All" type="all" activeType={filterType} onClick={setFilterType} />
                        <FilterPill label="Notes" type="notes" activeType={filterType} onClick={setFilterType} />
                        <FilterPill label="Attachments" type="attachments" activeType={filterType} onClick={setFilterType} />
                        <FilterPill label="Reminders" type="reminders" activeType={filterType} onClick={setFilterType} />
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredFeedData.length === 0 ? (
                        <p className="text-center text-gray-500 pt-16">
                            {searchTerm || filterType !== 'all' ? 'No matching activities found.' : 'No recent collaboration activity.'}
                        </p>
                    ) : (
                        filteredFeedData.map(item => (
                            <CaseFeedItem key={item.patient.id} caseData={item} onOpenCase={onOpenCase} onAddNote={onAddNote} />
                        ))
                    )}
                </main>
            </div>
        </>
    );
};

export default CaseFeedPanel;