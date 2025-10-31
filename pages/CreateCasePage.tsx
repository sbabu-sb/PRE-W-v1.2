import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  X, Save, Wand2, Loader, Trash2, PlusCircle, Camera, Check, AlertCircle
} from "lucide-react";
import { useEstimateState, useEstimateDispatch } from '../context/EstimateContext';

// New modular components
import SmartStepperSection from '../components/features/create-case/SmartStepperSection';
import AiCoPilot from '../components/features/create-case/AiCoPilot';
import GlobalSearch from '../components/features/search/GlobalSearch';
import ChatbotWidget from '../components/features/chatbot/ChatbotWidget';

// Common components
import InputField from "../components/common/InputField";
import SelectField from "../components/common/SelectField";
import Textarea from "../components/common/Textarea";
import InsuranceCombobox from "../components/common/InsuranceCombobox";

// Types and services
import { WorklistPatient, CaseStatus, Procedure, Benefits, Accumulators, Payer, MetaData } from "../types";
import { createNewWorklistPatient } from '../data/worklistData';
import { suggestCodesFromNote } from '../services/geminiService';
import { generateLuhnCaseId } from '../utils/caseIdGenerator';
import { CobMethod, PayerType } from "../constants";
import { isValidNpiLuhn } from '../utils/validators';
import { FormData } from "../components/features/create-case/AiCoPilot";
import NpiInputField from "../components/features/create-case/NpiInputField";


// --- Main Page Component ---
const CreateCasePage: React.FC<{ onCancel: () => void; onSave: (newCase: WorklistPatient) => void; showToast: (message: string) => void; }> = ({ onCancel, onSave, showToast }) => {
  const { metaData, payers, procedures } = useEstimateState();
  const dispatch = useEstimateDispatch();

  // Stepper State
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Provider Info State
  const [providerInfo, setProviderInfo] = useState({
    orderingNpi: '',
    orderingName: '',
    taxId: '',
    address: '',
    renderingNpi: '',
    renderingName: '',
  });
  const [npiValidity, setNpiValidity] = useState<{ ordering: boolean | null; rendering: boolean | null }>({ ordering: null, rendering: null });

  // Coverage Tab UI State
  const [activeCoverageTab, setActiveCoverageTab] = useState<'primary' | 'secondary' | 'tertiary'>('primary');
  const [showSecondary, setShowSecondary] = useState(payers.length > 1);
  const [showTertiary, setShowTertiary] = useState(payers.length > 2);


  // Local UI State
  const [clinicalNoteForAi, setClinicalNoteForAi] = useState('');
  const [isSuggestingCodes, setIsSuggestingCodes] = useState(false);
  const [assignTo, setAssignTo] = useState('UNASSIGNED');
  const [teamNotes, setTeamNotes] = useState('');
  
  // Simulated Clearance State
  const [eligibilityStatus, setEligibilityStatus] = useState<'pending' | 'active' | 'inactive' | 'error'>('pending');

  const formDataForCopilot = useMemo(() => {
    // FIX: Explicitly type `authStatus` and enhance logic to correctly handle the 'pending' state,
    // which resolves the TypeScript error where the type was being incorrectly widened to 'string'.
    const authStatus: FormData['authStatus'] = 
      procedures.some(p => p.authDetails.loading) ? 'pending' :
      procedures.some(p => p.authDetails.data?.authRequired) ? 'required' : 'not_required';
      
    return {
      patientName: metaData.patient.name,
      dob: metaData.patient.dob,
      dos: metaData.service.date,
      coverages: {
        primary: {
          isActive: payers.length > 0,
          payerId: payers[0]?.insurance.name || '',
          memberId: payers[0]?.insurance.memberId || '',
        },
        secondary: {
          isActive: payers.length > 1,
          payerId: payers[1]?.insurance.name || '',
          memberId: payers[1]?.insurance.memberId || '',
        }
      },
      procedures: procedures.map(p => ({ code: p.cptCode, desc: p.authDetails.data?.description || '' })),
      diagnoses: procedures.map(p => ({ code: p.dxCode, desc: '' })),
      eligibilityStatus,
      authStatus: authStatus,
      cobStatus: payers.length > 1 ? (payers[0]?.payerType === PayerType.Medicare ? 'msp_pending' : 'ok') : 'ok',
    };
  }, [metaData, payers, procedures, eligibilityStatus]);

  // --- Event Handlers ---
  const handleHeaderClick = (step: number) => {
    setActiveStep(current => current === step ? 0 : step);
  };
  
  const handleProviderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProviderInfo(prev => ({ ...prev, [name]: value }));

    if (name === 'orderingNpi' || name === 'renderingNpi') {
      const fieldKey = name === 'orderingNpi' ? 'ordering' : 'rendering';
      if (value.length === 10) {
        setNpiValidity(prev => ({ ...prev, [fieldKey]: isValidNpiLuhn(value) }));
      } else {
        setNpiValidity(prev => ({ ...prev, [fieldKey]: null }));
      }
    }
  };

  const validateAndProceed = (fromStep: number) => {
    let isValid = false;
    if (fromStep === 1 && metaData.patient.name && metaData.service.date) isValid = true;
    if (fromStep === 2 && providerInfo.orderingNpi && npiValidity.ordering) isValid = true;
    if (fromStep === 3 && payers[0]?.insurance.name && payers[0]?.insurance.memberId && eligibilityStatus === 'active') isValid = true;
    if (fromStep === 4 && procedures[0]?.cptCode && procedures[0]?.dxCode) isValid = true;

    if (isValid) {
      setCompletedSteps(prev => new Set(prev).add(fromStep));
      setActiveStep(fromStep + 1);
    }
  };

  useEffect(() => {
    if (activeStep === 3 && payers[0]?.insurance.name && payers[0]?.insurance.memberId && eligibilityStatus === 'pending') {
      const timer = setTimeout(() => {
        setEligibilityStatus(Math.random() > 0.1 ? 'active' : 'inactive');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeStep, payers, eligibilityStatus]);
  
  const handleScanCard = () => {
    const randomPayer = "Aetna";
    const memberId = `W${Math.floor(100000000 + Math.random() * 900000000)}`;
    dispatch({ type: 'UPDATE_PAYER_DETAIL', payload: { id: payers[0].id, field: 'name', value: randomPayer } });
    dispatch({ type: 'UPDATE_PAYER_DETAIL', payload: { id: payers[0].id, field: 'memberId', value: memberId } });
  };
  
  const handleSuggestCodes = async () => {
    if (!clinicalNoteForAi.trim()) return;
    setIsSuggestingCodes(true);
    const result = await suggestCodesFromNote(clinicalNoteForAi);
    if (result.success && result.data) {
      const { procedures: suggProcs, diagnoses: suggDiags } = result.data;
      const primaryDx = suggDiags.length > 0 ? suggDiags[0].code : (procedures[0]?.dxCode || '');

      suggProcs.forEach((suggProc, index) => {
        if (procedures[index]) {
          const procId = procedures[index].id;
          dispatch({ type: 'UPDATE_PROCEDURE', payload: { id: procId, field: 'cptCode', value: suggProc.code } });
          dispatch({ type: 'UPDATE_PROCEDURE', payload: { id: procId, field: 'dxCode', value: primaryDx } });
        } else {
          dispatch({ type: 'ADD_PROCEDURE' });
        }
      });
    }
    setIsSuggestingCodes(false);
  };
  
  const handleProcedureChange = (id: string, field: keyof Procedure, value: string | number | boolean) => dispatch({ type: 'UPDATE_PROCEDURE', payload: { id, field, value } });
  const handleAddProcedure = () => dispatch({ type: 'ADD_PROCEDURE' });
  const handleRemoveProcedure = (id: string) => dispatch({ type: 'REMOVE_PROCEDURE', payload: { id } });
  
  const handleDiagnosisChange = (value: string) => {
      procedures.forEach(p => {
          dispatch({ type: 'UPDATE_PROCEDURE', payload: { id: p.id, field: 'dxCode', value } });
      });
  };

  const handleSave = () => {
    const finalMetaData: MetaData = {
      ...metaData,
      provider: {
        ...metaData.provider,
        npi: providerInfo.orderingNpi,
        name: providerInfo.orderingName,
      },
      practice: {
        ...metaData.practice,
        taxId: providerInfo.taxId,
      }
    };

    const newCase: WorklistPatient = {
        ...createNewWorklistPatient(),
        id: generateLuhnCaseId(),
        metaData: finalMetaData,
        payers: payers,
        procedures: procedures,
        status: CaseStatus.NEW,
        disposition: {
          outcome: 'Case Created',
          summary: teamNotes || `Rendering Provider: ${providerInfo.renderingName} (NPI: ${providerInfo.renderingNpi})`,
        },
    };
    onSave(newCase);
  }

  const isSaveDisabled = completedSteps.size < 4;
  
  const handleAddSecondary = () => {
    if (payers.length < 2) dispatch({ type: 'ADD_PAYER' });
    setShowSecondary(true);
    setActiveCoverageTab('secondary');
  };

  const handleAddTertiary = () => {
    if (payers.length < 3) dispatch({ type: 'ADD_PAYER' });
    setShowTertiary(true);
    setActiveCoverageTab('tertiary');
  };

  const handleRemoveCoverage = (level: 'secondary' | 'tertiary') => {
    if (level === 'secondary') {
      if(payers[2]) dispatch({ type: 'REMOVE_PAYER', payload: { id: payers[2].id } });
      if(payers[1]) dispatch({ type: 'REMOVE_PAYER', payload: { id: payers[1].id } });
      setShowSecondary(false);
      setShowTertiary(false);
      setActiveCoverageTab('primary');
    } else { // tertiary
      if(payers[2]) dispatch({ type: 'REMOVE_PAYER', payload: { id: payers[2].id } });
      setShowTertiary(false);
      setActiveCoverageTab('secondary');
    }
  };

  const handlePrefill = useCallback(() => {
      // Prefills a more complex case
      const today = new Date().toISOString().split('T')[0];
      const prefillProcedures: Procedure[] = [
          { id: crypto.randomUUID(), cptCode: '27447', billedAmount: '32000', modifiers: 'RT', dxCode: 'M17.11', category: 'Surgery', units: 1, isPreventive: false, dateOfService: today, acuity: 'elective', authDetails: { loading: false, data: null, error: null }, necessityDetails: { loading: false, data: null, error: null }, payerIntel: { loading: false, data: null, error: null }, policyDetails: { loading: false, data: null, error: null }, icdSuggestions: { loading: false, data: null, error: null } },
      ];
      const defaultBenefits: Benefits = { planType: 'EmbeddedFamily', copayLogic: 'standard_waterfall', deductibleAllocation: 'highest_allowed_first', multiProcedureLogic: '100_50_25', inNetworkIndividualDeductible: '', inNetworkIndividualOopMax: '', inNetworkFamilyDeductible: '', inNetworkFamilyOopMax: '', inNetworkCoinsurancePercentage: '', outOfNetworkIndividualDeductible: '', outOfNetworkIndividualOopMax: '', outOfNetworkFamilyDeductible: '', outOfNetworkFamilyOopMax: '', outOfNetworkCoinsurancePercentage: '', therapyVisitLimits: { physical: '', occupational: '', speech: '' }, dmeRentalCap: { applies: false, purchasePrice: '' } };
      const defaultAcc: Accumulators = { inNetworkDeductibleMet: '', inNetworkOopMet: '', outOfNetworkDeductibleMet: '', outOfNetworkOopMet: '', therapyVisitsUsed: { physical: 0, occupational: 0, speech: 0 }, dmeRentalPaid: 0 };
      const prefillPayers: Payer[] = [
          { id: crypto.randomUUID(), rank: 'Primary', insurance: { name: 'Aetna', memberId: 'W123456789' }, networkStatus: 'in-network', payerType: PayerType.Commercial, subrogationActive: false, cobMethod: CobMethod.Traditional, benefits: defaultBenefits, patientAccumulators: defaultAcc, familyAccumulators: defaultAcc, procedureBenefits: prefillProcedures.map(p => ({ procedureId: p.id, allowedAmount: '', copay: '', coinsurancePercentage: '' })) },
      ];
      const prefillMetaData: MetaData = { patient: { name: 'John A. Appleseed', dob: '1985-05-15', relationship: 'Self', gender: 'Male' }, practice: { name: '', taxId: '' }, provider: { name: '', npi: '', phone: '' }, service: { date: '2025-10-27', time: '10:30', placeOfService: '22' } };
      
      setProviderInfo({
        orderingNpi: '1234567893', orderingName: 'Dr. Emily Carter', taxId: '987654321',
        address: '123 Health St, Anytown USA', renderingNpi: '1987654321', renderingName: 'Dr. John Smith'
      });
      setNpiValidity({ ordering: true, rendering: true });

      dispatch({ type: 'PREFILL_FORM', payload: { metaData: prefillMetaData, payers: prefillPayers, procedures: prefillProcedures } });
      setClinicalNoteForAi("Patient presents with chronic right knee pain due to osteoarthritis. Scheduled for total knee arthroplasty.")
  }, [dispatch]);

  return (
    <div className="h-full bg-slate-100 flex flex-col overflow-hidden relative">
      <header className="flex-shrink-0 bg-white border-b border-gray-200 z-10">
          <div className="max-w-full mx-auto px-6 py-3 flex justify-between items-center">
              <h1 className="text-lg font-bold text-gray-900">Create Pre-Service Case</h1>
              <div className="flex items-center gap-2">
                  <button type="button" onClick={handlePrefill} className="flex items-center space-x-2 text-sm bg-yellow-400 text-yellow-900 font-semibold py-2 px-3 rounded-lg hover:bg-yellow-500 transition">
                      <Wand2 className="h-4 w-4" /><span>Prefill Test Data</span>
                  </button>
                  <GlobalSearch />
              </div>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-full mx-auto w-full px-6 py-6 grid grid-cols-12 gap-6 pb-28">
          <div className="col-span-12 lg:col-span-7 space-y-4">
            
            <SmartStepperSection stepNumber={1} title="Patient & Encounter" isActive={activeStep === 1} isCompleted={completedSteps.has(1)} isLocked={false} onHeaderClick={() => handleHeaderClick(1)}>
              <div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Patient Name" value={metaData.patient.name} onChange={e => dispatch({ type: 'UPDATE_METADATA', payload: { section: 'patient', name: 'name', value: e.target.value } })} required />
                  <InputField label="Date of Birth" type="date" value={metaData.patient.dob} placeholder="dd/mm/yyyy" onChange={e => dispatch({ type: 'UPDATE_METADATA', payload: { section: 'patient', name: 'dob', value: e.target.value } })} required />
                  <InputField label="Date of Service" type="date" value={metaData.service.date} onChange={e => dispatch({ type: 'UPDATE_METADATA', payload: { section: 'service', name: 'date', value: e.target.value } })} required />
                  <InputField label="Time of Service" type="time" name="time" value={metaData.service.time || ''} onChange={e => dispatch({ type: 'UPDATE_METADATA', payload: { section: 'service', name: 'time', value: e.target.value } })} />
              </div><button onClick={() => validateAndProceed(1)} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700">Continue</button></div>
            </SmartStepperSection>

            <SmartStepperSection stepNumber={2} title="Provider Information" isActive={activeStep === 2} isCompleted={completedSteps.has(2)} isLocked={!completedSteps.has(1)} onHeaderClick={() => handleHeaderClick(2)}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NpiInputField
                        label="Ordering Provider NPI"
                        name="orderingNpi"
                        value={providerInfo.orderingNpi}
                        onChange={handleProviderChange}
                        isValid={npiValidity.ordering}
                        required
                    />
                    <InputField label="Ordering Provider Name" name="orderingName" value={providerInfo.orderingName} onChange={handleProviderChange} />
                    <InputField label="Practice TAX ID" name="taxId" value={providerInfo.taxId} onChange={handleProviderChange} />
                    <InputField label="Practice Address" name="address" value={providerInfo.address} onChange={handleProviderChange} />
                    <NpiInputField
                        label="Rendering Provider NPI"
                        name="renderingNpi"
                        value={providerInfo.renderingNpi}
                        onChange={handleProviderChange}
                        isValid={npiValidity.rendering}
                    />
                    <InputField label="Rendering Provider Name" name="renderingName" value={providerInfo.renderingName} onChange={handleProviderChange} />
                </div>
                <button onClick={() => validateAndProceed(2)} disabled={npiValidity.ordering === false} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">Continue</button>
              </div>
            </SmartStepperSection>

            <SmartStepperSection stepNumber={3} title="Coverage & Verification" isActive={activeStep === 3} isCompleted={completedSteps.has(3)} isLocked={!completedSteps.has(2)} onHeaderClick={() => handleHeaderClick(3)}>
               <div className="space-y-4">
                 <button onClick={handleScanCard} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors">
                    <Camera className="h-5 w-5"/> <span className="font-semibold">Scan Insurance Card (OCR)</span>
                 </button>
                 
                {/* Coverage Tabs */}
                <div>
                    <div className="flex justify-between items-end border-b border-gray-200">
                        <div className="flex space-x-1 -mb-px">
                            <button onClick={() => setActiveCoverageTab('primary')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeCoverageTab === 'primary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Primary</button>
                            {showSecondary && <button onClick={() => setActiveCoverageTab('secondary')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeCoverageTab === 'secondary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Secondary <X onClick={(e) => {e.stopPropagation(); handleRemoveCoverage('secondary')}} className="h-4 w-4 text-red-400 hover:text-red-600"/></button>}
                            {showTertiary && <button onClick={() => setActiveCoverageTab('tertiary')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeCoverageTab === 'tertiary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Tertiary <X onClick={(e) => {e.stopPropagation(); handleRemoveCoverage('tertiary')}} className="h-4 w-4 text-red-400 hover:text-red-600"/></button>}
                        </div>
                         <div className="flex space-x-2 pb-1">
                            {!showSecondary && <button onClick={handleAddSecondary} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Secondary</button>}
                            {showSecondary && !showTertiary && payers[1]?.insurance.name && <button onClick={handleAddTertiary} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Tertiary</button>}
                         </div>
                    </div>
                    <div className="pt-4 space-y-2">
                        {payers.map((payer, index) => (
                           <div key={payer.id} className={activeCoverageTab === payer.rank.toLowerCase() ? 'block' : 'hidden'}>
                               <InsuranceCombobox label={`${payer.rank} Coverage`} value={payer.insurance.name} onChange={val => dispatch({ type: 'UPDATE_PAYER_DETAIL', payload: { id: payer.id, field: 'name', value: val } })} />
                               <InputField label="Member ID" value={payer.insurance.memberId} onChange={e => dispatch({ type: 'UPDATE_PAYER_DETAIL', payload: { id: payer.id, field: 'memberId', value: e.target.value } })} />
                           </div>
                        ))}
                    </div>
                </div>

                 <button onClick={() => validateAndProceed(3)} disabled={eligibilityStatus !== 'active'} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">Continue</button>
               </div>
            </SmartStepperSection>

            <SmartStepperSection stepNumber={4} title="Clinical Definition" isActive={activeStep === 4} isCompleted={completedSteps.has(4)} isLocked={!completedSteps.has(3)} onHeaderClick={() => handleHeaderClick(4)}>
               <div className="space-y-4">
                    <div>
                        <Textarea label="Clinical Note for AI" value={clinicalNoteForAi} onChange={e => setClinicalNoteForAi(e.target.value)} placeholder="e.g., pt has chronic rt knee pain, getting office visit and x-ray" />
                        <button onClick={handleSuggestCodes} disabled={isSuggestingCodes} className="mt-2 flex items-center gap-2 text-sm text-purple-700 font-semibold bg-purple-100 px-3 py-1.5 rounded-md hover:bg-purple-200 disabled:opacity-60">
                            {isSuggestingCodes ? <Loader className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4"/>} {isSuggestingCodes ? 'Analyzing...' : 'Gemini - Suggest Codes from Note'}
                        </button>
                    </div>
                    <div className="space-y-2 border-t pt-4">
                        <h4 className="text-sm font-semibold">Procedures</h4>
                        {procedures.map((p, i) => (
                          <div key={p.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
                            <InputField label={i===0?"CPT":""} value={p.cptCode} onChange={e => handleProcedureChange(p.id, 'cptCode', e.target.value)}/>
                            <InputField label={i===0?"Modifiers":""} value={p.modifiers} onChange={e => handleProcedureChange(p.id, 'modifiers', e.target.value)}/>
                            <button onClick={() => handleRemoveProcedure(p.id)} className="h-9 px-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 className="h-4 w-4"/></button>
                          </div>
                        ))}
                        <button onClick={handleAddProcedure} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"><PlusCircle className="h-4 w-4"/>Add Procedure</button>
                    </div>
                     <div className="space-y-2 border-t pt-4">
                        <h4 className="text-sm font-semibold">Primary Diagnosis</h4>
                        <InputField label="ICD-10" value={procedures[0]?.dxCode || ''} onChange={e => handleDiagnosisChange(e.target.value)}/>
                    </div>
                 <button onClick={() => validateAndProceed(4)} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700">Continue</button>
               </div>
            </SmartStepperSection>

            <SmartStepperSection stepNumber={5} title="Finalize & Assign" isActive={activeStep === 5} isCompleted={completedSteps.has(5)} isLocked={!completedSteps.has(4)} onHeaderClick={() => handleHeaderClick(5)}>
               <div className="space-y-4">
                 <SelectField label="Assign To" value={assignTo} onChange={(e: any) => setAssignTo(e.target.value)}><option value="UNASSIGNED">Unassigned</option><option value="ME">Me</option><option value="AUTH-TEAM">Auth Team</option></SelectField>
                 <Textarea label="Notes for team" value={teamNotes} onChange={(e: any) => setTeamNotes(e.target.value)} />
               </div>
            </SmartStepperSection>
          </div>
          
          <aside className="col-span-12 lg:col-span-5">
            <AiCoPilot formData={formDataForCopilot} activeStep={activeStep}/>
          </aside>
        </div>
      </main>

      <footer className="flex-shrink-0 fixed bottom-0 inset-x-0 z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-full mx-auto px-6 py-3 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="h-10 px-4 rounded-lg border border-gray-300 text-sm text-gray-700 font-semibold hover:bg-gray-50 flex items-center gap-1.5"><X className="h-4 w-4" /> Cancel</button>
            <button onClick={handleSave} disabled={isSaveDisabled} className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"><Save className="h-4 w-4" /> Create Case</button>
          </div>
        </div>
      </footer>
      <div className="fixed bottom-0 right-0 p-4 sm:p-6 lg:p-8 z-20">
        <ChatbotWidget />
      </div>
    </div>
  );
}

export default CreateCasePage;