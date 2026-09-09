/**
 * BhoomiSetu — Risk Engine Shared Types & Client-Safe Utilities
 *
 * Safe to import in both Client Components and Server Modules.
 * Contains no Node.js/DB dependencies.
 */

export interface RiskRuleWeights {
  stage_dwell_urgency: number;    // Default: 25
  disputed_ownership: number;     // Default: 20
  litigation_flag: number;        // Default: 20
  document_discrepancy: number;   // Default: 20
  rr_incompleteness: number;      // Default: 15
}

export const DEFAULT_RISK_WEIGHTS: RiskRuleWeights = {
  stage_dwell_urgency: 25,
  disputed_ownership: 20,
  litigation_flag: 20,
  document_discrepancy: 20,
  rr_incompleteness: 15,
};

export type RiskFactorKey = keyof RiskRuleWeights;

export interface RiskFactorReason {
  factor: RiskFactorKey;
  label: string;
  weight: number;
  score: number;
  maxScore: number;
  explanation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, unknown>;
}

export interface RiskScoreResult {
  entity_type: 'project' | 'parcel';
  entity_id: string;
  score: number;
  category: 'low' | 'medium' | 'high' | 'critical';
  reasons: RiskFactorReason[];
  weights_used: RiskRuleWeights;
  calculated_at: string;
  is_simulated?: boolean;
}

export function getRiskCategory(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

export function getRiskBadgeClass(category: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (category) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
}
