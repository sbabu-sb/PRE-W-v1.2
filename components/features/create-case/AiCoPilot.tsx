import React from 'react';
import { Lightbulb, CheckCircle2, AlertCircle, Loader, ShieldAlert, ShieldCheck, User, Calendar, Briefcase, Stethoscope, StopCircle } from 'lucide-react';
import { WorklistPatient } from '../../../types'; // Assuming types are accessible

// This is a comprehensive type representing the state of the form
export type FormData = {
    patientName: string;
    dob: string;
    dos: string;
    coverages: {
        primary: { isActive: boolean; payerId: string; memberId: string };
        secondary: { isActive: boolean; payerId: string; memberId: string };
    };
    procedures: { code: string; desc: string }[];
    diagnoses: { code: string; desc: string }[];
    // Simulated clearance statuses
    eligibilityStatus: 'pending' | 'active' | 'inactive' | 'error';
    authStatus: 'pending' | 'required' | 'not_required' | 'drafting';
    cobStatus: 'pending' | 'ok' | 'msp_pending';
};

interface AiCoPilotProps {
    formData: FormData;
    activeStep: number;
}

const clearanceIcons = {
    pending: <Loader className="h-4 w-4 text-gray-400 animate-spin" />,
    active: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    inactive: <StopCircle className="h-4 w-4 text-red-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
    required: <ShieldAlert className="h-4 w-4 text-yellow-600" />,
    not_required: <ShieldCheck className="h-4 w-4 text-green-500" />,
    drafting: <Loader className="h-4 w-4 text-blue-500 animate-spin" />,
    ok: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    msp_pending: <AlertCircle className="h-4 w-4 text-yellow-600" />,
};

const clearanceText = {
    pending: 'Pending...',
    active: 'Primary: Active',
    inactive: 'Primary: Inactive',
    error: 'Error',
    required: 'Auth Required',
    not_required: 'No Auth Needed',
    drafting: 'Drafting...',
    ok: 'No Issues Found',
    msp_pending: 'MSP Questionnaire Pending',
};

const AiCoPilot: React.FC<AiCoPilotProps> = ({ formData, activeStep }) => {

    const getNextBestAction = () => {
        if (activeStep === 1) {
            if (!formData.patientName || !formData.dos) {
                return "Start by finding the patient or entering a new patient and Date of Service.";
            }
            return "Patient data complete. Move to 'Coverage & Verification' to run eligibility.";
        }
        if (activeStep === 2) {
            if (!formData.coverages.primary.payerId) {
                return "Enter Primary coverage details. Use 'Scan Card' to speed up entry.";
            }
            if (formData.coverages.primary.payerId.toLowerCase().includes('medicare')) {
                return "**CRITICAL: MSP Verification.** The primary payer is Medicare. You *must* complete the MSP questionnaire. A 'Verify MSP' button has been added to the Coverage section.";
            }
            if (formData.eligibilityStatus === 'inactive') {
                return "**STOP:** Primary eligibility is inactive. Do not proceed. Action: Ask patient for their new insurance card or contact the payer.";
            }
            return "Coverage verified. Proceed to 'Clinical Definition'.";
        }
        if (activeStep === 3) {
            if (formData.procedures.length === 0 || !formData.procedures[0].code) {
                 return "Define the clinical details. Use 'Suggest Codes from Note' for AI assistance.";
            }
            if (formData.authStatus === 'required') {
                return "**Auth Required.** Review the clinical details and use 'Gemini - Draft Auth Note' to generate a justification.";
            }
            return "Clinical details are valid. Proceed to 'Finalize & Assign'.";
        }
        if (activeStep === 4) {
            return "**Ready to Create.** All data is valid. Please review the 'Case Summary' card and click 'Create Case'.";
        }
        return "Complete the current step to proceed.";
    };

    return (
        <div className="space-y-6 sticky top-6">
            {/* Card 1: Next Best Action */}
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 flex items-center mb-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                    Next Best Action
                </h3>
                <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: getNextBestAction() }} />
            </div>

            {/* Card 2: Real-time Clearance */}
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Real-time Clearance</h3>
                <ul className="space-y-2.5 text-sm">
                    <li className="flex items-center justify-between">
                        <span className="font-medium text-gray-600">Eligibility</span>
                        <span className="flex items-center gap-1.5 font-semibold">{clearanceIcons[formData.eligibilityStatus]} {clearanceText[formData.eligibilityStatus]}</span>
                    </li>
                    <li className="flex items-center justify-between">
                        <span className="font-medium text-gray-600">Authorization</span>
                        <span className="flex items-center gap-1.5 font-semibold">{clearanceIcons[formData.authStatus]} {clearanceText[formData.authStatus]}</span>
                    </li>
                    <li className="flex items-center justify-between">
                        <span className="font-medium text-gray-600">COB / MSP</span>
                        <span className="flex items-center gap-1.5 font-semibold">{clearanceIcons[formData.cobStatus]} {clearanceText[formData.cobStatus]}</span>
                    </li>
                </ul>
            </div>
            
            {/* Card 3: Case Summary */}
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                 <h3 className="text-sm font-bold text-gray-800 mb-3">Case Summary</h3>
                 <div className="space-y-2 text-sm text-gray-700">
                     <p className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400"/> {formData.patientName || 'N/A'} | DOB: {formData.dob || 'N/A'}</p>
                     <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400"/> DOS: {formData.dos || 'N/A'} | Pre-Service</p>
                     <div>
                        <p className="flex items-center gap-2 mb-1"><Briefcase className="h-4 w-4 text-gray-400"/> Coverages</p>
                        <ul className="pl-6 text-xs space-y-0.5">
                            <li><strong>P:</strong> {formData.coverages.primary.payerId || 'N/A'} (Elig: <span className="font-medium">{formData.eligibilityStatus}</span>)</li>
                             {formData.coverages.secondary.isActive && <li><strong>S:</strong> {formData.coverages.secondary.payerId || 'N/A'} (Elig: <span className="font-medium">Pending</span>)</li>}
                        </ul>
                     </div>
                     <div>
                         <p className="flex items-center gap-2 mb-1"><Stethoscope className="h-4 w-4 text-gray-400"/> Clinical</p>
                         <ul className="pl-6 text-xs space-y-0.5">
                            <li><strong>CPT:</strong> {formData.procedures.map(p => p.code).join(', ') || 'N/A'}</li>
                            <li><strong>ICD:</strong> {formData.diagnoses.map(d => d.code).join(', ') || 'N/A'}</li>
                         </ul>
                     </div>
                 </div>
                 {formData.eligibilityStatus === 'inactive' && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-red-600 font-bold text-sm">
                        <StopCircle className="h-5 w-5"/> Blocked: Primary Eligibility Inactive
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AiCoPilot;