import { FilterObject, WorklistPatient, CaseStatus, SortKey } from '../types';

// Mock AI service to generate context-aware filter suggestions.
export const generateFilterSuggestions = (
  data: WorklistPatient[],
  // userRole: string // for future use
): Partial<FilterObject>[] => {
  const suggestions: Partial<FilterObject>[] = [];
  const totalCount = data.length;
  if (totalCount === 0) return [];

  // Suggestion 1: Auth issues
  const authRequiredCount = data.filter(p => p.authStatus === 'Required').length;
  if (authRequiredCount / totalCount > 0.2) { // if > 20% need auth
    suggestions.push({
      fieldId: 'preServiceClearance' as SortKey,
      fieldName: 'Pre-Service Clearance',
      condition: 'is-any-of',
      values: ['Blocked'],
      source: 'ai',
      explanation: `Focus on ${authRequiredCount} cases blocked by auth requirements.`
    });
  }

  // Suggestion 2: Expiring Soon
  const now = new Date();
  const expiringSoonCount = data.filter(p => {
    const dos = new Date(p.metaData.service.date);
    const diffDays = (dos.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays < 2;
  }).length;

  if (expiringSoonCount > 0) {
      suggestions.push({
          fieldId: 'dos' as SortKey,
          fieldName: 'Date of Service',
          condition: 'between',
          value: now.toISOString().split('T')[0],
          value2: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          source: 'ai',
          explanation: `Prioritize ${expiringSoonCount} cases with service dates in the next 48 hours.`
      });
  }

  // Suggestion 3: High-Priority Unassigned
  const highPriorityUnassigned = data.filter(p => (p.priorityDetails?.score ?? 0) > 80 && p.assignedTo.name === 'Unassigned').length;
  if (highPriorityUnassigned > 0) {
      suggestions.push({
          fieldId: 'assignedTo' as SortKey,
          fieldName: 'Assigned To',
          condition: 'is-any-of',
          values: ['Unassigned'],
          source: 'ai',
          explanation: `Address ${highPriorityUnassigned} high-priority, unassigned cases immediately.`
      });
  }
  
  return suggestions;
}