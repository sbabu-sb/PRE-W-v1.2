import React, { useState } from 'react';
import { Clock, Send, Loader, FileCheck, FileX, FileText, PenSquare, Code, PhoneForwarded } from 'lucide-react';
import { useEstimateState, useEstimateDispatch } from '../../../context/EstimateContext';
import { generateDummy278 } from '../../../utils/generators';
import { formatDate } from '../../../utils/formatters';
import { PayerVerificationDetails, AuthSubmissionState, Procedure } from '../../../types';
import { fetchAppealLetterDraftFromApi, fetchCodingSuggestionsForDenialFromApi, fetchPeerToPeerScriptFromApi } from '../../../services/geminiService';

interface AuthSubmissionSectionProps {
    payerVerificationDetails: PayerVerificationDetails | undefined;
}

const CLAIM_AUTH_ID = 'claim-level-auth';

interface AiActionCenterProps {
    authSubmission: AuthSubmissionState;
}


const AiActionCenter: React.FC<AiActionCenterProps> = ({ authSubmission }) => {
    const { metaData, payers, procedures } = useEstimateState();
    const dispatch = useEstimateDispatch();
    const [loadingAction, setLoadingAction] = useState<'appeal' | 'coding' | 'script' | null>(null);

    const rejectedProcedure = procedures.find(p => authSubmission.statusNotes?.includes(p.cptCode));
    const primaryPayer = payers[0];

    const handleAction = async (action: 'appeal' | 'coding' | 'script') => {
        if (!rejectedProcedure || !primaryPayer || !authSubmission.statusNotes) {
            dispatch({ type: 'SHOW_MODAL', payload: { title: "Error", message: "Could not identify the specific procedure or payer for this action." } });
            return;
        }
        setLoadingAction(action);
        
        let result, title;
        const denialReason = authSubmission.statusNotes;

        switch (action) {
            case 'appeal':
                title = `✨ AI-Drafted Appeal Letter to ${primaryPayer.insurance.name}`;
                result = await fetchAppealLetterDraftFromApi(rejectedProcedure, metaData, primaryPayer, denialReason);
                break;
            case 'coding':
                title = "💡 AI Coding Suggestions";
                result = await fetchCodingSuggestionsForDenialFromApi(rejectedProcedure, primaryPayer, denialReason);
                break;
            case 'script':
                title = `📞 AI Peer-to-Peer Script for ${primaryPayer.insurance.name}`;
                result = await fetchPeerToPeerScriptFromApi(rejectedProcedure, metaData, denialReason);
                break;
        }
        
        setLoadingAction(null);

        if (result?.success && result.data) {
            const message = (result.data as any).draft || (result.data as any).suggestions || (result.data as any).script || "No content generated.";
            dispatch({ type: 'SHOW_MODAL', payload: { title, message } });
        } else {
            dispatch({ type: 'SHOW_MODAL', payload: { title: "Error", message: result?.error || `Could not generate ${action}.` } });
        }
    };

    return (
        <div className="mt-4 p-4 border rounded-lg bg-red-50 border-red-200">
            <h4 className="font-bold text-red-700 flex items-center">
                <FileX className="h-5 w-5 mr-2" />
                AI Action Center: Denial Detected
            </h4>
            <p className="text-sm text-red-600 my-2">
                <strong>Reason:</strong> {authSubmission.statusNotes}
            </p>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => handleAction('appeal')} disabled={!!loadingAction} className="flex items-center space-x-2 text-sm bg-red-600 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400">
                    {loadingAction === 'appeal' ? <Loader className="h-4 w-4 animate-spin" /> : <PenSquare className="h-4 w-4" />}
                    <span>Generate Appeal Letter</span>
                </button>
                <button onClick={() => handleAction('coding')} disabled={!!loadingAction} className="flex items-center space-x-2 text-sm bg-red-100 text-red-800 font-semibold py-1.5 px-3 rounded-lg hover:bg-red-200 transition disabled:opacity-50">
                    {loadingAction === 'coding' ? <Loader className="h-4 w-4 animate-spin" /> : <Code className="h-4 w-4" />}
                    <span>Suggest Coding Alternatives</span>
                </button>
                <button onClick={() => handleAction('script')} disabled={!!loadingAction} className="flex items-center space-x-2 text-sm bg-red-100 text-red-800 font-semibold py-1.5 px-3 rounded-lg hover:bg-red-200 transition disabled:opacity-50">
                    {loadingAction === 'script' ? <Loader className="h-4 w-4 animate-spin" /> : <PhoneForwarded className="h-4 w-4" />}
                    <span>Draft Peer-to-Peer Script</span>
                </button>
            </div>
        </div>
    );
};
