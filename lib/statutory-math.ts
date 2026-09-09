/**
 * BhoomiSetu — Statutory Formula & Compensation Math
 *
 * Safe to import in both Client and Server code.
 * Implements Section 26 & 30 of RFCTLARR Act, 2013:
 * Total Compensation = Market Value + Solatium (100%) + Additional Amount (12%)
 */

export interface AwardCalculationBreakdown {
  marketValue: number;
  solatiumPct: number;
  solatiumAmount: number;
  additionalAmountPct: number;
  additionalAmount: number;
  totalCompensation: number;
}

export function calculateAwardBreakdown(
  marketValue: number,
  solatiumPct: number = 100,
  additionalAmountPct: number = 12
): AwardCalculationBreakdown {
  const mv = Number(marketValue) || 0;
  const solPct = Number(solatiumPct) || 100;
  const addPct = Number(additionalAmountPct) || 12;

  const solatiumAmount = Math.round((mv * (solPct / 100)) * 100) / 100;
  const additionalAmount = Math.round((mv * (addPct / 100)) * 100) / 100;
  const totalCompensation = Math.round((mv + solatiumAmount + additionalAmount) * 100) / 100;

  return {
    marketValue: mv,
    solatiumPct: solPct,
    solatiumAmount,
    additionalAmountPct: addPct,
    additionalAmount,
    totalCompensation,
  };
}
