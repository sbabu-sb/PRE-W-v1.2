import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, Route, GitBranch, List, FileDown, User, Briefcase, Heart, Lightbulb } from 'lucide-react';
import { WorklistPatient, JourneyEvent, JourneyGraph, JourneyGap, JourneyPersona, PredictiveNextStep, CaseStatus } from '../types';
import { getCuratedJourneyForCase } from '../services/journeyService';
import JourneyTimeline from '../components/features/journey/JourneyTimeline';
import JourneyGraphView from '../components/features/journey/JourneyGraphView';
import { useJourneyPdfGenerator } from '../components/features/journey/useJourneyPdfGenerator';

interface JourneyPageProps {
  patient: WorklistPatient;
  onClose: () => void;
}

const PredictiveNextStepCard: React.FC<{ nextStep: PredictiveNextStep | null; patientStatus: CaseStatus; }> = ({ nextStep, patientStatus }) => {
    const isCaseResolved = patientStatus === CaseStatus.COMPLETED || patientStatus === CaseStatus.ARCHIVED;

    if (isCaseResolved || nextStep?.action === 'No further action needed') {
        return (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="font-semibold text-green-800">Journey Complete</p>
                <p className="text-sm text-green-700">This pre-service journey is resolved.</p>
            </div>
        );
    }
    
    if (nextStep) {
        return (
            <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="text-sm font-bold text-purple-800 flex items-center mb-2">
                    <Lightbulb className="h-5 w-5 text-purple-500 mr-2" />
                    Predictive Next Step
                </h3>
                <p className="text-lg font-semibold text-gray-800">{nextStep.action}</p>
                <p className="text-sm text-gray-600 mt-1">{nextStep.rationale}</p>
            </div>
        );
    }
    
    // Default case: journey is ongoing, but no specific AI suggestion.
    return (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-bold text-blue-800 flex items-center mb-2">
                <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                Next Step
            </h3>
            <p className="text-lg font-semibold text-gray-800">Continue Standard Procedure</p>
            <p className="text-sm text-gray-600 mt-1">The AI has no specific recommendation. Continue with the standard operating procedure for this case.</p>
        </div>
    );
};


const JourneyPage: React.FC<JourneyPageProps> = ({ patient, onClose }) => {
  const [journeyData, setJourneyData] = useState<{ 
      events: (JourneyEvent | JourneyGap)[], 
      graph: JourneyGraph,
      summary: { duration: string; denials: number; conformanceScore: number },
      predictiveNextStep: PredictiveNextStep | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'timeline' | 'graph'>('timeline');
  const [activePersona, setActivePersona] = useState<JourneyPersona>('ops');

  const { generatePDF, isGenerating } = useJourneyPdfGenerator();

  useEffect(() => {
    const fetchJourney = () => {
      setIsLoading(true);
      const data = getCuratedJourneyForCase(patient.id, activePersona);
      setJourneyData(data);
      setIsLoading(false);
    };
    fetchJourney();
  }, [patient.id, activePersona]);
  
  const handleExport = () => {
      if (journeyData) {
        generatePDF({
            patient,
            journeyData: { ...journeyData, events: journeyData.events.filter(e => e.type !== 'journey_gap') as JourneyEvent[], gaps: journeyData.events.filter(e => e.type === 'journey_gap') as JourneyGap[] },
            persona: activePersona,
        });
      }
  };

  const PersonaButton: React.FC<{ persona: JourneyPersona, icon: React.ReactNode, label: string }> = (props) => (
      <button onClick={() => setActivePersona(props.persona)} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition ${activePersona === props.persona ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white hover:bg-indigo-50 text-gray-700'}`}>
          {props.icon} {props.label}
      </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-[2000] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-slate-50 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex-shrink-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Route className="h-6 w-6 text-blue-600" />
              Patient Journey
            </h2>
            <p className="text-sm text-gray-500">{patient.metaData.patient.name} ({patient.id})</p>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={handleExport}
                disabled={isGenerating}
                className="flex items-center gap-2 text-sm font-semibold bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
                <FileDown className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Export PDF'}
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><X className="h-6 w-6" /></button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">Loading Journey...</div>
        ) : journeyData && (journeyData.events.length > 0 || activePersona !== 'ops') ? (
          <>
            <div className="flex-shrink-0 bg-white p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex justify-center md:justify-start items-center gap-2 p-1 bg-slate-100 rounded-lg border">
                    <PersonaButton persona="ops" icon={<Briefcase className="h-4 w-4" />} label="Ops View" />
                    <PersonaButton persona="provider" icon={<User className="h-4 w-4" />} label="Provider View" />
                    <PersonaButton persona="patient" icon={<Heart className="h-4 w-4" />} label="Patient View" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                    <div><p className="text-xs text-gray-500 uppercase">Duration</p><p className="font-bold text-gray-800 flex items-center justify-center gap-1"><Clock className="h-4 w-4" /> {journeyData.summary.duration}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase">Denials</p><p className={`font-bold flex items-center justify-center gap-1 ${journeyData.summary.denials > 0 ? 'text-red-600' : 'text-green-600'}`}><AlertTriangle className="h-4 w-4" /> {journeyData.summary.denials}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase">Conformance</p><p className="font-bold text-gray-800">{journeyData.summary.conformanceScore}%</p></div>
                    <div className="flex items-center justify-center">
                        <div className="flex rounded-md shadow-sm border border-gray-300">
                            <button onClick={() => setActiveView('timeline')} className={`px-2 py-1 text-xs font-medium rounded-l-md transition ${activeView === 'timeline' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}><List className="h-4 w-4 inline mr-1"/> Timeline</button>
                            <button onClick={() => setActiveView('graph')} className={`px-2 py-1 text-xs font-medium rounded-r-md transition ${activeView === 'graph' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}><GitBranch className="h-4 w-4 inline mr-1"/> Graph</button>
                        </div>
                    </div>
                </div>
            </div>
            <main className="flex-1 overflow-y-auto p-6 lg:p-8">
              {activeView === 'timeline' ? (
                  <JourneyTimeline items={journeyData.events} />
              ) : (
                  <JourneyGraphView graph={journeyData.graph} />
              )}
              <PredictiveNextStepCard nextStep={journeyData.predictiveNextStep} patientStatus={patient.status} />
            </main>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">No significant journey events found for this case.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyPage;