import React from 'react';
import { CaseNote, CaseAttachment, WorklistPatient, CaseReminder } from '../../../../../types';
import { MessageSquare, Paperclip, ArrowRight, BellRing } from 'lucide-react';
import { formatRelativeTime } from '../../../../../utils/formatters';
import Chip from '../../../../common/Chip';

interface CaseFeedItemProps {
    caseData: {
        patient: WorklistPatient;
        activities: (CaseNote | CaseAttachment | CaseReminder)[];
    };
    onOpenCase: (patient: WorklistPatient) => void;
    onAddNote: (patient: WorklistPatient) => void;
}

const ActivityRow: React.FC<{ item: CaseNote | CaseAttachment | CaseReminder }> = ({ item }) => {
    const isNote = (i: any): i is CaseNote => 'content' in i;
    const isAttachment = (i: any): i is CaseAttachment => 'fileName' in i;
    const isReminder = (i: any): i is CaseReminder => 'dueAt' in i;

    let icon: React.ReactNode;
    let timestamp: string;
    let author: string;
    let content: React.ReactNode;
    let slaChip: React.ReactNode | null = null;
    
    if (isNote(item)) {
        icon = <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />;
        timestamp = item.createdAt;
        author = item.authorName;
        content = <p className="text-gray-600 break-words"><span className="font-semibold text-gray-800">{author}:</span> {item.content}</p>;
    } else if (isAttachment(item)) {
        icon = <Paperclip className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />;
        timestamp = item.uploadedAt;
        author = item.uploadedBy;
        content = <p className="text-gray-600 break-words"><span className="font-semibold text-gray-800">{author}:</span> added attachment "{item.fileName}"</p>;
    } else if (isReminder(item)) {
        icon = <BellRing className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />;
        timestamp = item.createdAt;
        author = item.createdByName;
        content = <p className="text-gray-600 break-words"><span className="font-semibold text-gray-800">{author}:</span> set a reminder "{item.title}"</p>;

        const now = new Date().getTime();
        const due = new Date(item.dueAt).getTime();
        const diffHours = (due - now) / (1000 * 60 * 60);
        
        if (item.status === 'completed') {
            slaChip = <Chip tone='neutral'>Completed</Chip>;
        } else if (diffHours < 0) {
            slaChip = <Chip tone='danger'>Overdue</Chip>;
        } else if (diffHours <= 24) {
            slaChip = <Chip tone='warn'>Due Soon</Chip>;
        }
    } else {
        return null;
    }


    return (
        <div className="flex items-start gap-2 text-sm">
            {icon}
            <div className="flex-1 min-w-0">
                {content}
                {slaChip && <div className="mt-1">{slaChip}</div>}
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{formatRelativeTime(timestamp)}</span>
        </div>
    );
}

const CaseFeedItem: React.FC<CaseFeedItemProps> = ({ caseData, onOpenCase, onAddNote }) => {
    const { patient, activities } = caseData;
    const last3Activities = activities.slice(0, 3);
    
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-800">{patient.metaData.patient.name}</h4>
                    <p className="text-xs text-gray-500">{patient.id} • {patient.payers[0]?.insurance.name}</p>
                </div>
                <Chip>{patient.status}</Chip>
            </div>
            <div className="mt-3 space-y-2">
                {last3Activities.map(activity => <ActivityRow key={activity.id} item={activity} />)}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
                <button onClick={() => onAddNote(patient)} className="text-sm font-semibold text-blue-600 hover:underline">Add Note</button>
                <button onClick={() => onOpenCase(patient)} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100">
                    Open Case <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default CaseFeedItem;