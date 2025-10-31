import { TemporalEvent, WorklistPatient, ImpactCategory } from '../types';

/**
 * Gemini Temporal Signal Algorithm (GTSA) v2
 *
 * This function provides an enhanced score for an event by considering its type,
 * context from the patient worklist item, and a more sophisticated model of its
 * potential impact on revenue cycle management.
 *
 * @param event The temporal event to score.
 * @param patientContext The full patient worklist item for context.
 * @returns An object containing the score, and optionally an explanation and impact category.
 */
export const calculateGtsaScore = (
  event: Omit<TemporalEvent, 'id' | 'timestamp' | 'gtasScore' | 'integrityHash' | 'explanation' | 'impactCategory'>,
  patientContext?: WorklistPatient
): { score: number; explanation?: string; impactCategory?: ImpactCategory } => {
  let financialExposure = 0; // 0-1
  let complianceRisk = 0;    // 0-1
  let workflowDisruption = 0; // 0-1
  let timeCriticality = 0;     // 0-1
  let cohortCorrelation = 0;   // 0-1, mocked
  let userRoleWeight = 0.5;    // 0-1

  // --- Base scores from event type ---
  switch(event.eventType) {
    case 'auth_status_changed':
        financialExposure = 0.8; complianceRisk = 0.7; workflowDisruption = 0.6;
        break;
    case 'eligibility_rerun':
        financialExposure = 0.6; complianceRisk = 0.8; workflowDisruption = 0.5;
        break;
    case 'case_dispositioned':
        workflowDisruption = 0.2; financialExposure = 0.1;
        break;
    case 'note_added':
        workflowDisruption = 0.3;
        break;
    case 'reminder_created':
        workflowDisruption = 0.4;
        break;
    case 'assignment_changed':
        workflowDisruption = 0.5;
        break;
    case 'case_created':
        workflowDisruption = 0.2;
        break;
    default:
        workflowDisruption = 0.1;
  }
  
  // --- Contextual signals from patient data ---
  if (patientContext) {
      // Time Criticality based on DOS
      const dos = new Date(patientContext.metaData.service.date);
      const today = new Date();
      const daysUntilService = (dos.getTime() - today.getTime()) / (1000 * 3600 * 24);

      if (daysUntilService < 1) timeCriticality = 1.0;
      else if (daysUntilService < 3) timeCriticality = 0.8;
      else if (daysUntilService < 7) timeCriticality = 0.5;
      else timeCriticality = 0.1;

      // Financial exposure based on estimated value
      const value = patientContext.estimatedResponsibility ?? 0;
      if (value > 10000) financialExposure = Math.max(financialExposure, 0.9);
      else if (value > 2000) financialExposure = Math.max(financialExposure, 0.6);
  }

  // Simulate Cohort Correlation
  if (Math.random() < 0.1) cohortCorrelation = Math.random() * 0.5 + 0.5; // 10% chance of high correlation

  const score = (
      financialExposure * 0.25 +
      complianceRisk * 0.20 +
      workflowDisruption * 0.15 +
      timeCriticality * 0.15 +
      cohortCorrelation * 0.15 +
      userRoleWeight * 0.10
  ) * 100;

  const finalScore = Math.round(Math.min(99, score));
  
  // --- Generate Explanation for High-Signal Events ---
  if (finalScore >= 80) {
      let explanation = 'High-impact event detected.';
      let impactCategory: ImpactCategory = '⚙️ Ops';
      
      const sortedFactors = [
          { name: 'financialExposure', value: financialExposure, category: '💰 Revenue' },
          { name: 'timeCriticality', value: timeCriticality, category: '⏰ Time Critical' },
          { name: 'complianceRisk', value: complianceRisk, category: '🛡️ Compliance' }
      ].sort((a,b) => b.value - a.value);
      
      const primaryFactor = sortedFactors[0];
      if (primaryFactor.value > 0.7) {
          impactCategory = primaryFactor.category as ImpactCategory;
          if (primaryFactor.name === 'financialExposure') {
              explanation = `High-value case ($${patientContext?.estimatedResponsibility?.toLocaleString()}) requires attention.`;
          } else if (primaryFactor.name === 'timeCriticality') {
              explanation = `Urgent action needed: Date of Service is in less than 24 hours.`;
          } else if (primaryFactor.name === 'complianceRisk') {
              explanation = 'Potential compliance or eligibility issue detected.'
          }
      }
      return { score: finalScore, explanation, impactCategory };
  }

  return { score: finalScore };
};