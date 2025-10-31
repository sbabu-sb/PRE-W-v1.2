import React from 'react';
import { JourneyEvent, JourneyPhase } from '../../../types';
import { formatRelativeTime } from '../../../utils/formatters';
import {
  FilePlus, ShieldCheck, FileBadge, FileText, CheckCircle, XCircle, Clock, Ghost, Bot, User, Server, MessageSquare
} from 'lucide-react';

interface JourneyEventCardProps {
  event: JourneyEvent;
}

const phaseStyles: Record<JourneyPhase, { color: string; bg: string }> = {
    pre_service: { color: 'text-sky-800', bg: 'bg-sky-100' },
    financial_clearance: { color: 'text-blue-800', bg: 'bg-blue-100' },
    scheduling: { color: 'text-indigo-800', bg: 'bg-indigo-100' },
    clinical: { color: 'text-purple-800', bg: 'bg-purple-100' },
    claims: { color: 'text-orange-800', bg: 'bg-orange-100' },
    appeals: { color: 'text-red-800', bg: 'bg-red-100' },
    resolution: { color: 'text-green-800', bg: 'bg-green-100' },
};

const getIcon = (type: JourneyEvent['type'], source: JourneyEvent['source'], isCounterfactual?: boolean) => {
    const iconClass = "h-5 w-5";
    if (isCounterfactual) return <Ghost className={iconClass} />;
    
    // Source icons take priority
    if (source === 'patient') return <User className={iconClass} />;
    if (source === 'ai') return <Bot className={iconClass} />;
    if (source === 'integration') return <Server className={iconClass} />;
    
    // Event type icons
    switch(type) {
        case 'case_created': return <FilePlus className={iconClass} />;
        case 'eligibility_run': return <ShieldCheck className={iconClass} />;
        case 'auth_approved': return <FileBadge className={iconClass} />;
        case 'auth_denied': return <XCircle className={`${iconClass} text-red-600`} />;
        case 'auth_submitted': return <FileBadge className={iconClass} />;
        case 'estimate_revised': return <FileText className={iconClass} />;
        case 'closed': return <CheckCircle className={iconClass} />;
        case 'note_added': return <MessageSquare className={iconClass} />;
        case 'assignment_changed': return <User className={iconClass} />;
        default: return <Clock className={iconClass} />;
    }
};

const JourneyEventCard: React.FC<JourneyEventCardProps> = ({ event }) => {
  const { color, bg } = phaseStyles[event.phase] || phaseStyles.pre_service;
  const whyItMatters = event.type === 'auth_denied' ? 'This denial may increase patient OOP or delay service.' : null;

  return (
    <div className="relative flex items-start gap-4">
      <div className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full z-10 ${bg} ${color} ${event.isCounterfactual ? 'border-2 border-dashed border-gray-400 !bg-gray-100 !text-gray-500' : ''}`}>
        {getIcon(event.type, event.source, event.isCounterfactual)}
      </div>
      <div className="ml-12 w-full">
        <div className={`p-4 rounded-lg border shadow-sm ${event.isCounterfactual ? 'border-dashed border-gray-400 bg-gray-50' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${bg} ${color}`}>
                        {event.phase.replace('_', ' ')}
                    </span>
                    <p className={`text-sm font-semibold mt-1 ${event.isCounterfactual ? 'text-gray-600 italic' : 'text-gray-800'}`}>{event.description}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-4">{formatRelativeTime(event.timestamp)}</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
                by {event.actorName} ({event.source})
            </div>
             {whyItMatters && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-yellow-800 bg-yellow-50 p-2 rounded-md">
                    <span className="font-semibold">Why this matters:</span> {whyItMatters}
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default JourneyEventCard;