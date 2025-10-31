
import React from 'react';
import { JourneyGraph } from '../../../types';
import { ArrowRight } from 'lucide-react';

interface JourneyGraphViewProps {
    graph: JourneyGraph;
}

const JourneyGraphView: React.FC<JourneyGraphViewProps> = ({ graph }) => {
    if (!graph || graph.nodes.length === 0) {
        return <p className="text-center text-gray-500">No graph data available.</p>;
    }

    return (
        <div className="space-y-4">
            {graph.nodes.map((node, index) => {
                const edge = graph.edges.find(e => e.from === node.id);
                const durationHours = edge ? Math.floor(edge.durationMins / 60) : null;
                const durationDays = edge ? Math.floor(edge.durationMins / (60 * 24)) : null;

                let durationText = '';
                if (edge) {
                    if (durationDays > 1) {
                        durationText = `${durationDays}d`;
                    } else if (durationHours > 0) {
                        durationText = `${durationHours}h`;
                    } else {
                        durationText = `${edge.durationMins}m`;
                    }
                }

                return (
                    <div key={node.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms`}}>
                        {/* Node */}
                        <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 capitalize">{node.label}</p>
                                    <p className="text-xs text-gray-500">{new Date(node.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {node.phase.replace('_', ' ')}
                            </span>
                        </div>

                        {/* Edge */}
                        {edge && (
                            <div className="flex items-center justify-center h-12">
                                <ArrowRight className="h-5 w-5 text-slate-400" />
                                <span className="ml-2 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                    {durationText}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default JourneyGraphView;
