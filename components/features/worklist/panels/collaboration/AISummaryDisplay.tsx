import React from 'react';
import { AISummary } from '../../../../../types';
import { Wand2, RefreshCw, Loader, Lightbulb } from 'lucide-react';

interface AISummaryDisplayProps {
    summary: AISummary | null;
    isLoading: boolean;
    onRegenerate: () => void;
}

const AISummaryDisplay: React.FC<AISummaryDisplayProps> = ({ summary, isLoading, onRegenerate }) => {
    if (isLoading) {
        return (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-center">
                <Loader className="h-5 w-5 animate-spin text-purple-500" />
                <span className="ml-2 text-sm text-purple-700 font-medium">Gemini is thinking...</span>
            </div>
        );
    }

    if (!summary) {
        return null; // Don't show anything if there's no summary and not loading
    }
    
    const sentimentStyles = {
        blocked: 'bg-red-100 text-red-800 border-red-200',
        urgent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        resolved: 'bg-green-100 text-green-800 border-green-200',
        neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    const sentimentStyle = summary.sentiment ? sentimentStyles[summary.sentiment] : sentimentStyles.neutral;

    return (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-3 animate-fade-in">
            <div className="flex justify-between items-start">
                <h3 className="flex items-center text-sm font-bold text-purple-800">
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Summary
                </h3>
                <button onClick={onRegenerate} className="p-1 rounded-full text-purple-600 hover:bg-purple-100" title="Regenerate summary">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>
            
            <p className="text-sm text-purple-900">{summary.summary}</p>
            
            {summary.actions && summary.actions.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center"><Lightbulb className="h-3 w-3 mr-1" />Next Actions</h4>
                    <ul className="space-y-1">
                        {summary.actions.map((action, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-700">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                                <span>{action.label} {action.owner && <span className="text-xs text-gray-500">({action.owner})</span>}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {summary.sentiment && (
                <div className="flex items-center justify-between text-xs">
                     <span className={`px-2 py-0.5 rounded-full font-medium ${sentimentStyle}`}>
                        Sentiment: {summary.sentiment.charAt(0).toUpperCase() + summary.sentiment.slice(1)}
                    </span>
                    <span className="text-gray-400">Generated {new Date(summary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}

        </div>
    );
};

export default AISummaryDisplay;
