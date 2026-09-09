/**
 * BhoomiSetu — Explainable Rule-Based Risk Engine
 *
 * Implements Section 5.6 and 7.3 of the specification.
 * Fully deterministic, rule-based, and explainable — NOT a black-box ML model.
 *
 * Each rule contributes:
 *   1. A numerical score contribution bounded by its weight
 *   2. A human-readable, fact-based explanation string
 *   3. A severity classification ('low' | 'medium' | 'high' | 'critical')
 *
 * Persistent results are stored in `risk_scores.reasons` as structured JSON.
 * Supports Policy Simulation Mode by accepting dynamic weight overrides.
 */

import { query } from "@/lib/db/pool";
import { computeUrgency, type DeadlineUrgency } from "@/lib/workflow";
import { saveRiskScore } from "@/lib/db/queries/risk-scores";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  severity: "low" | "medium" | "high" | "critical";
  explanation: string;
  details?: Record<string, unknown>;
}

export interface RiskComputationResult {
  entityType: "project" | "parcel";
  entityId: string;
  entityName: string;
  district?: string | null;
  state?: string | null;
  score: number;
  riskCategory: "low" | "medium" | "high";
  reasons: RiskFactorReason[];
  weightsUsed: RiskRuleWeights;
  computedAt: string;
}

// ── Helper functions ──────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

export function getRiskCategory(score: number): "low" | "medium" | "high" {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

// ── Parcel Risk Computation ───────────────────────────────────────────────────

async function computeParcelRiskInternal(
  parcelId: string,
  weights: RiskRuleWeights
): Promise<RiskComputationResult> {
  // 1. Fetch parcel data
  const parcelRes = await query<any>(
    `SELECT p.*, pr.name AS project_name, pr.current_stage AS project_stage
     FROM parcels p
     LEFT JOIN projects pr ON pr.id = p.project_id
     WHERE p.id = $1`,
    [parcelId]
  );

  if (parcelRes.rows.length === 0) {
    throw new Error(`Parcel with ID '${parcelId}' not found.`);
  }
  const parcel = parcelRes.rows[0];

  const reasons: RiskFactorReason[] = [];

  // --- Rule 1: Stage Dwell Urgency (inherited from associated project) ---
  const wUrgency = weights.stage_dwell_urgency;
  if (parcel.project_id) {
    const notifRes = await query<any>(
      `SELECT section, notified_on, deadline_on,
              GREATEST(0, (CURRENT_DATE - notified_on)) AS days_elapsed,
              GREATEST(1, (deadline_on - notified_on)) AS days_total,
              (CURRENT_DATE > deadline_on) AS past_deadline
       FROM notifications
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [parcel.project_id]
    );

    if (notifRes.rows.length > 0) {
      const n = notifRes.rows[0];
      const pctElapsed = Math.min(200, (Number(n.days_elapsed) / Number(n.days_total)) * 100);
      const urgency: DeadlineUrgency = computeUrgency(pctElapsed, Boolean(n.past_deadline));

      let score = 0;
      let severity: RiskFactorReason["severity"] = "low";
      let explanation = "";

      if (urgency === "lapsed") {
        score = wUrgency;
        severity = "critical";
        explanation = `Associated project (${parcel.project_name}) statutory deadline lapsed under RFCTLARR for ${n.section}. Acquisition proceedings at risk of legal lapse.`;
      } else if (urgency === "red") {
        score = round2(wUrgency * 0.88);
        severity = "high";
        explanation = `Associated project statutory window is at ${pctElapsed.toFixed(1)}% elapsed (${Math.max(0, n.days_total - n.days_elapsed)} days remaining for ${n.section}). High urgency.`;
      } else if (urgency === "amber") {
        score = round2(wUrgency * 0.55);
        severity = "medium";
        explanation = `Associated project statutory window is at ${pctElapsed.toFixed(1)}% elapsed for ${n.section}. Moderate statutory escalation.`;
      } else {
        score = 0;
        severity = "low";
        explanation = `Associated project timelines compliant (${pctElapsed.toFixed(1)}% elapsed on statutory window).`;
      }

      reasons.push({
        factor: "stage_dwell_urgency",
        label: "Statutory Stage Dwell Urgency",
        weight: wUrgency,
        score,
        maxScore: wUrgency,
        severity,
        explanation,
        details: { urgency, pctElapsed: round2(pctElapsed), section: n.section },
      });
    } else {
      reasons.push({
        factor: "stage_dwell_urgency",
        label: "Statutory Stage Dwell Urgency",
        weight: wUrgency,
        score: 0,
        maxScore: wUrgency,
        severity: "low",
        explanation: `Associated project (${parcel.project_name}) is in stage '${parcel.project_stage || "proposal"}'; no active statutory notification deadlines recorded.`,
      });
    }
  } else {
    reasons.push({
      factor: "stage_dwell_urgency",
      label: "Statutory Stage Dwell Urgency",
      weight: wUrgency,
      score: 0,
      maxScore: wUrgency,
      severity: "low",
      explanation: "Standalone parcel not currently linked to any statutory project timeline.",
    });
  }

  // --- Rule 2: Disputed Ownership ---
  const wOwnership = weights.disputed_ownership;
  const ownershipStatus = (parcel.ownership_status || "clear").toLowerCase();
  let ownershipScore = 0;
  let ownershipSeverity: RiskFactorReason["severity"] = "low";
  let ownershipExplanation = "";

  if (ownershipStatus === "disputed") {
    ownershipScore = wOwnership;
    ownershipSeverity = "critical";
    ownershipExplanation = `Parcel ownership title is flagged as 'disputed' in revenue records. Multiple conflicting claimants or inheritance contest pending.`;
  } else if (ownershipStatus === "under_verification") {
    ownershipScore = round2(wOwnership * 0.5);
    ownershipSeverity = "medium";
    ownershipExplanation = `Parcel ownership title is currently 'under verification' by the Revenue Inspector; mutation not yet confirmed.`;
  } else {
    ownershipScore = 0;
    ownershipSeverity = "low";
    ownershipExplanation = `Ownership title verified clear in state revenue records.`;
  }

  reasons.push({
    factor: "disputed_ownership",
    label: "Title & Ownership Status",
    weight: wOwnership,
    score: ownershipScore,
    maxScore: wOwnership,
    severity: ownershipSeverity,
    explanation: ownershipExplanation,
    details: { ownershipStatus },
  });

  // --- Rule 3: Litigation Flag ---
  const wLitigation = weights.litigation_flag;
  const isLitigated = Boolean(parcel.litigation_flag);
  reasons.push({
    factor: "litigation_flag",
    label: "Pending Court Litigation",
    weight: wLitigation,
    score: isLitigated ? wLitigation : 0,
    maxScore: wLitigation,
    severity: isLitigated ? "critical" : "low",
    explanation: isLitigated
      ? `Active civil or high court litigation injunction filed against acquisition of this parcel. May cause judicial stay order.`
      : `No pending court litigation or judicial stay order recorded against this parcel.`,
    details: { litigationFlag: isLitigated },
  });

  // --- Rule 4: Document Discrepancy Flags ---
  const wDoc = weights.document_discrepancy;
  // Look up documents linked to project or referencing this parcel
  const docRes = await query<any>(
    `SELECT d.id, d.filename, d.discrepancy_flags
     FROM documents d
     WHERE (d.project_id = $1 OR d.ner_entities::text LIKE $2)
     ORDER BY d.created_at DESC`,
    [parcel.project_id, `%${parcel.ulpin}%`]
  );

  let errorCount = 0;
  let warningCount = 0;
  for (const doc of docRes.rows) {
    const flags = Array.isArray(doc.discrepancy_flags) ? doc.discrepancy_flags : [];
    for (const flag of flags) {
      if (flag.severity === "error") errorCount++;
      else if (flag.severity === "warning") warningCount++;
    }
  }

  const docScore = clamp(round2(errorCount * 10 + warningCount * 4), 0, wDoc);
  let docSeverity: RiskFactorReason["severity"] = "low";
  let docExplanation = "";

  if (errorCount > 0 || warningCount > 0) {
    docSeverity = errorCount > 0 ? "high" : "medium";
    docExplanation = `${errorCount} high-severity and ${warningCount} warning discrepancy flags detected between scanned revenue documents and database records (e.g. area or survey number mismatch).`;
  } else {
    docExplanation = `All uploaded legal and survey documents match parcel database records without discrepancy.`;
  }

  reasons.push({
    factor: "document_discrepancy",
    label: "Document OCR Discrepancies",
    weight: wDoc,
    score: docScore,
    maxScore: wDoc,
    severity: docSeverity,
    explanation: docExplanation,
    details: { errorCount, warningCount, documentsReviewed: docRes.rows.length },
  });

  // --- Rule 5: Affected Families R&R Completeness ---
  const wRR = weights.rr_incompleteness;
  const famRes = await query<any>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE livelihood_restored = true)::int AS restored,
            COUNT(*) FILTER (WHERE compensation_status = 'disbursed')::int AS compensated
     FROM affected_families
     WHERE parcel_id = $1`,
    [parcelId]
  );

  const totalFamilies = Number(famRes.rows[0]?.total || 0);
  const restoredFamilies = Number(famRes.rows[0]?.restored || 0);
  let rrScore = 0;
  let rrSeverity: RiskFactorReason["severity"] = "low";
  let rrExplanation = "";

  if (totalFamilies === 0) {
    rrScore = 0;
    rrSeverity = "low";
    rrExplanation = `No displaced or project-affected families registered for this parcel.`;
  } else {
    const pendingFamilies = totalFamilies - restoredFamilies;
    const incompletenessPct = (pendingFamilies / totalFamilies) * 100;
    rrScore = round2((incompletenessPct / 100) * wRR);

    if (incompletenessPct > 60) {
      rrSeverity = "high";
    } else if (incompletenessPct > 0) {
      rrSeverity = "medium";
    }

    rrExplanation = `R&R incomplete: ${pendingFamilies} of ${totalFamilies} affected families (${incompletenessPct.toFixed(0)}%) have pending livelihood or housing restoration.`;
  }

  reasons.push({
    factor: "rr_incompleteness",
    label: "R&R Resettlement Incompleteness",
    weight: wRR,
    score: rrScore,
    maxScore: wRR,
    severity: rrSeverity,
    explanation: rrExplanation,
    details: { totalFamilies, restoredFamilies },
  });

  // Total Score
  const totalScore = clamp(
    round2(reasons.reduce((sum, r) => sum + r.score, 0)),
    0,
    100
  );

  return {
    entityType: "parcel",
    entityId: parcel.id,
    entityName: parcel.ulpin ? `ULPIN: ${parcel.ulpin}` : `Survey ${parcel.survey_number || "N/A"}`,
    district: parcel.district,
    state: parcel.state,
    score: totalScore,
    riskCategory: getRiskCategory(totalScore),
    reasons,
    weightsUsed: weights,
    computedAt: new Date().toISOString(),
  };
}

// ── Project Risk Computation ──────────────────────────────────────────────────

async function computeProjectRiskInternal(
  projectId: string,
  weights: RiskRuleWeights
): Promise<RiskComputationResult> {
  // 1. Fetch project data
  const projRes = await query<any>(
    `SELECT * FROM projects WHERE id = $1`,
    [projectId]
  );

  if (projRes.rows.length === 0) {
    throw new Error(`Project with ID '${projectId}' not found.`);
  }
  const project = projRes.rows[0];

  const reasons: RiskFactorReason[] = [];

  // --- Rule 1: Stage Dwell Urgency ---
  const wUrgency = weights.stage_dwell_urgency;
  const notifRes = await query<any>(
    `SELECT section, notified_on, deadline_on,
            GREATEST(0, (CURRENT_DATE - notified_on)) AS days_elapsed,
            GREATEST(1, (deadline_on - notified_on)) AS days_total,
            (CURRENT_DATE > deadline_on) AS past_deadline
     FROM notifications
     WHERE project_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [projectId]
  );

  if (notifRes.rows.length > 0) {
    const n = notifRes.rows[0];
    const pctElapsed = Math.min(200, (Number(n.days_elapsed) / Number(n.days_total)) * 100);
    const urgency: DeadlineUrgency = computeUrgency(pctElapsed, Boolean(n.past_deadline));

    let score = 0;
    let severity: RiskFactorReason["severity"] = "low";
    let explanation = "";

    if (urgency === "lapsed") {
      score = wUrgency;
      severity = "critical";
      explanation = `Statutory deadline for ${n.section} lapsed on ${n.deadline_on}. Proceedings at risk of lapse under RFCTLARR.`;
    } else if (urgency === "red") {
      score = round2(wUrgency * 0.88);
      severity = "high";
      explanation = `Statutory window for ${n.section} is at ${pctElapsed.toFixed(1)}% elapsed (${Math.max(0, n.days_total - n.days_elapsed)} days remaining). Urgent action required.`;
    } else if (urgency === "amber") {
      score = round2(wUrgency * 0.56);
      severity = "medium";
      explanation = `Statutory window for ${n.section} is at ${pctElapsed.toFixed(1)}% elapsed (${Math.max(0, n.days_total - n.days_elapsed)} days remaining). Alert sent to Collector.`;
    } else {
      score = 0;
      severity = "low";
      explanation = `Statutory timeline compliant (${pctElapsed.toFixed(1)}% elapsed for ${n.section}, ${Math.max(0, n.days_total - n.days_elapsed)} days buffer).`;
    }

    reasons.push({
      factor: "stage_dwell_urgency",
      label: "Statutory Stage Dwell Urgency",
      weight: wUrgency,
      score,
      maxScore: wUrgency,
      severity,
      explanation,
      details: { urgency, pctElapsed: round2(pctElapsed), section: n.section },
    });
  } else {
    // If no notification, check days dwelled in current stage
    const stageStarted = project.stage_started_at ? new Date(project.stage_started_at) : new Date();
    const daysDwelled = Math.floor((Date.now() - stageStarted.getTime()) / (1000 * 60 * 60 * 24));
    let dwellScore = 0;
    let dwellSeverity: RiskFactorReason["severity"] = "low";
    let dwellExplanation = "";

    if (daysDwelled > 180) {
      dwellScore = round2(wUrgency * 0.5);
      dwellSeverity = "medium";
      dwellExplanation = `Project has dwelled in stage '${project.current_stage}' for ${daysDwelled} days without advancing.`;
    } else {
      dwellScore = 0;
      dwellSeverity = "low";
      dwellExplanation = `Project stage dwell time normal (${daysDwelled} days in stage '${project.current_stage}').`;
    }

    reasons.push({
      factor: "stage_dwell_urgency",
      label: "Statutory Stage Dwell Urgency",
      weight: wUrgency,
      score: dwellScore,
      maxScore: wUrgency,
      severity: dwellSeverity,
      explanation: dwellExplanation,
      details: { daysDwelled, currentStage: project.current_stage },
    });
  }

  // Fetch aggregate parcel statistics for this project
  const parcelsRes = await query<any>(
    `SELECT COUNT(*)::int AS total_parcels,
            COUNT(*) FILTER (WHERE ownership_status = 'disputed')::int AS disputed_count,
            COUNT(*) FILTER (WHERE ownership_status = 'under_verification')::int AS verif_count,
            COUNT(*) FILTER (WHERE litigation_flag = true)::int AS litigated_count
     FROM parcels
     WHERE project_id = $1`,
    [projectId]
  );

  const totalParcels = Number(parcelsRes.rows[0]?.total_parcels || 0);
  const disputedCount = Number(parcelsRes.rows[0]?.disputed_count || 0);
  const verifCount = Number(parcelsRes.rows[0]?.verif_count || 0);
  const litigatedCount = Number(parcelsRes.rows[0]?.litigated_count || 0);

  // --- Rule 2: Disputed Ownership across Project Parcels ---
  const wOwnership = weights.disputed_ownership;
  let ownershipScore = 0;
  let ownershipSeverity: RiskFactorReason["severity"] = "low";
  let ownershipExplanation = "";

  if (totalParcels === 0) {
    ownershipScore = 0;
    ownershipSeverity = "low";
    ownershipExplanation = "No demarcated land parcels linked to this project yet.";
  } else {
    const disputeRatio = (disputedCount + verifCount * 0.5) / totalParcels;
    ownershipScore = clamp(round2(disputeRatio * wOwnership), 0, wOwnership);

    if (disputedCount > 0) {
      ownershipSeverity = disputedCount / totalParcels > 0.3 ? "critical" : "high";
      ownershipExplanation = `${disputedCount} of ${totalParcels} demarcated parcels (${((disputedCount / totalParcels) * 100).toFixed(0)}%) have disputed title in state revenue records.`;
    } else if (verifCount > 0) {
      ownershipSeverity = "medium";
      ownershipExplanation = `${verifCount} of ${totalParcels} parcels are undergoing ownership title verification.`;
    } else {
      ownershipScore = 0;
      ownershipSeverity = "low";
      ownershipExplanation = `All ${totalParcels} demarcated project parcels have clear, verified ownership titles.`;
    }
  }

  reasons.push({
    factor: "disputed_ownership",
    label: "Title & Ownership Status",
    weight: wOwnership,
    score: ownershipScore,
    maxScore: wOwnership,
    severity: ownershipSeverity,
    explanation: ownershipExplanation,
    details: { totalParcels, disputedCount, verifCount },
  });

  // --- Rule 3: Litigation Flag across Project Parcels ---
  const wLitigation = weights.litigation_flag;
  let litigationScore = 0;
  let litigationSeverity: RiskFactorReason["severity"] = "low";
  let litigationExplanation = "";

  if (totalParcels === 0) {
    litigationScore = 0;
    litigationSeverity = "low";
    litigationExplanation = "No parcels demarcated; no litigation tracked.";
  } else {
    const litigationRatio = litigatedCount / totalParcels;
    litigationScore = clamp(round2(litigationRatio * wLitigation), 0, wLitigation);

    if (litigatedCount > 0) {
      litigationSeverity = litigatedCount > 1 ? "critical" : "high";
      litigationExplanation = `${litigatedCount} of ${totalParcels} project parcels have active civil or high court stay orders against acquisition.`;
    } else {
      litigationScore = 0;
      litigationSeverity = "low";
      litigationExplanation = `Zero parcels under this project corridor are subject to active court litigation.`;
    }
  }

  reasons.push({
    factor: "litigation_flag",
    label: "Pending Court Litigation",
    weight: wLitigation,
    score: litigationScore,
    maxScore: wLitigation,
    severity: litigationSeverity,
    explanation: litigationExplanation,
    details: { totalParcels, litigatedCount },
  });

  // --- Rule 4: Document Discrepancy Flags ---
  const wDoc = weights.document_discrepancy;
  const docRes = await query<any>(
    `SELECT d.id, d.filename, d.discrepancy_flags
     FROM documents d
     WHERE d.project_id = $1
     ORDER BY d.created_at DESC`,
    [projectId]
  );

  let errorCount = 0;
  let warningCount = 0;
  for (const doc of docRes.rows) {
    const flags = Array.isArray(doc.discrepancy_flags) ? doc.discrepancy_flags : [];
    for (const flag of flags) {
      if (flag.severity === "error") errorCount++;
      else if (flag.severity === "warning") warningCount++;
    }
  }

  const docScore = clamp(round2(errorCount * 10 + warningCount * 4), 0, wDoc);
  let docSeverity: RiskFactorReason["severity"] = "low";
  let docExplanation = "";

  if (errorCount > 0 || warningCount > 0) {
    docSeverity = errorCount > 0 ? "high" : "medium";
    docExplanation = `${errorCount} critical and ${warningCount} warning discrepancies identified across project documents (area, survey, or valuation mismatch).`;
  } else {
    docExplanation = `All uploaded legal and survey documents match project parcel records without discrepancy.`;
  }

  reasons.push({
    factor: "document_discrepancy",
    label: "Document OCR Discrepancies",
    weight: wDoc,
    score: docScore,
    maxScore: wDoc,
    severity: docSeverity,
    explanation: docExplanation,
    details: { errorCount, warningCount, documentsReviewed: docRes.rows.length },
  });

  // --- Rule 5: Affected Families R&R Completeness ---
  const wRR = weights.rr_incompleteness;
  const famRes = await query<any>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE af.livelihood_restored = true)::int AS restored
     FROM affected_families af
     JOIN parcels p ON p.id = af.parcel_id
     WHERE p.project_id = $1`,
    [projectId]
  );

  const totalFamilies = Number(famRes.rows[0]?.total || 0);
  const restoredFamilies = Number(famRes.rows[0]?.restored || 0);
  let rrScore = 0;
  let rrSeverity: RiskFactorReason["severity"] = "low";
  let rrExplanation = "";

  if (totalFamilies === 0) {
    rrScore = 0;
    rrSeverity = "low";
    rrExplanation = `No project-affected families registered in the R&R database for this project.`;
  } else {
    const pendingFamilies = totalFamilies - restoredFamilies;
    const incompletenessPct = (pendingFamilies / totalFamilies) * 100;
    rrScore = round2((incompletenessPct / 100) * wRR);

    if (incompletenessPct > 60) {
      rrSeverity = "high";
    } else if (incompletenessPct > 0) {
      rrSeverity = "medium";
    }

    rrExplanation = `R&R rehabilitation pending for ${pendingFamilies} of ${totalFamilies} affected families (${incompletenessPct.toFixed(0)}% incomplete across project corridor).`;
  }

  reasons.push({
    factor: "rr_incompleteness",
    label: "R&R Resettlement Incompleteness",
    weight: wRR,
    score: rrScore,
    maxScore: wRR,
    severity: rrSeverity,
    explanation: rrExplanation,
    details: { totalFamilies, restoredFamilies },
  });

  // Total Score
  const totalScore = clamp(
    round2(reasons.reduce((sum, r) => sum + r.score, 0)),
    0,
    100
  );

  return {
    entityType: "project",
    entityId: project.id,
    entityName: project.name,
    district: project.district,
    state: project.state,
    score: totalScore,
    riskCategory: getRiskCategory(totalScore),
    reasons,
    weightsUsed: weights,
    computedAt: new Date().toISOString(),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute the explainable risk score for an entity (project or parcel).
 * If persist is true, writes to risk_scores table and updates entity's risk_score column.
 */
export async function computeEntityRisk(
  entityType: "project" | "parcel",
  entityId: string,
  options?: {
    weights?: Partial<RiskRuleWeights>;
    persist?: boolean;
  }
): Promise<RiskComputationResult> {
  const mergedWeights: RiskRuleWeights = {
    ...DEFAULT_RISK_WEIGHTS,
    ...(options?.weights || {}),
  };

  let result: RiskComputationResult;
  if (entityType === "project") {
    result = await computeProjectRiskInternal(entityId, mergedWeights);
  } else {
    result = await computeParcelRiskInternal(entityId, mergedWeights);
  }

  // Persist if requested (defaults to true)
  if (options?.persist !== false) {
    await saveRiskScore(entityType, entityId, result.score, result.reasons);
  }

  return result;
}

// ── Batch Risk Computation (avoids N+1 queries) ──────────────────────────────

interface BatchData {
  projects: any[];
  parcels: any[];
  notifications: any[];
  documents: any[];
  families: any[];
}

/**
 * Pre-fetch all data needed for risk computation in bulk queries.
 * Returns lookup maps for O(1) access during risk calculation.
 */
async function fetchBatchData(): Promise<{
  notificationsByProject: Map<string, any[]>;
  documentsByProject: Map<string, any[]>;
  familiesByParcel: Map<string, any[]>;
  parcelStatsByProject: Map<string, { total: number; disputed: number; verif: number; litigated: number }>;
  familyStatsByProject: Map<string, { total: number; restored: number }>;
}> {
  // Single bulk queries instead of per-entity queries
  const [notifsRes, docsRes, familiesRes, parcelStatsRes, familyStatsRes] = await Promise.all([
    query<any>(
      `SELECT DISTINCT ON (project_id, section)
        project_id, section, notified_on, deadline_on,
        GREATEST(0, (CURRENT_DATE - notified_on)) AS days_elapsed,
        GREATEST(1, (deadline_on - notified_on)) AS days_total,
        (CURRENT_DATE > deadline_on) AS past_deadline
       FROM notifications
       ORDER BY project_id, section, created_at DESC`
    ),
    query<any>(
      `SELECT project_id, id, filename, discrepancy_flags
       FROM documents
       ORDER BY created_at DESC`
    ),
    query<any>(
      `SELECT parcel_id, id, livelihood_restored, compensation_status
       FROM affected_families`
    ),
    query<any>(
      `SELECT project_id,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE ownership_status = 'disputed')::int AS disputed,
              COUNT(*) FILTER (WHERE ownership_status = 'under_verification')::int AS verif,
              COUNT(*) FILTER (WHERE litigation_flag = true)::int AS litigated
       FROM parcels
       GROUP BY project_id`
    ),
    query<any>(
      `SELECT p.project_id,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE af.livelihood_restored = true)::int AS restored
       FROM affected_families af
       JOIN parcels p ON p.id = af.parcel_id
       GROUP BY p.project_id`
    ),
  ]);

  // Build lookup maps
  const notificationsByProject = new Map<string, any[]>();
  for (const n of notifsRes.rows) {
    const existing = notificationsByProject.get(n.project_id) || [];
    existing.push(n);
    notificationsByProject.set(n.project_id, existing);
  }

  const documentsByProject = new Map<string, any[]>();
  for (const d of docsRes.rows) {
    if (!d.project_id) continue;
    const existing = documentsByProject.get(d.project_id) || [];
    existing.push(d);
    documentsByProject.set(d.project_id, existing);
  }

  const familiesByParcel = new Map<string, any[]>();
  for (const f of familiesRes.rows) {
    const existing = familiesByParcel.get(f.parcel_id) || [];
    existing.push(f);
    familiesByParcel.set(f.parcel_id, existing);
  }

  const parcelStatsByProject = new Map<string, any>();
  for (const s of parcelStatsRes.rows) {
    parcelStatsByProject.set(s.project_id, {
      total: s.total,
      disputed: s.disputed,
      verif: s.verif,
      litigated: s.litigated,
    });
  }

  const familyStatsByProject = new Map<string, any>();
  for (const s of familyStatsRes.rows) {
    familyStatsByProject.set(s.project_id, {
      total: s.total,
      restored: s.restored,
    });
  }

  return {
    notificationsByProject,
    documentsByProject,
    familiesByParcel,
    parcelStatsByProject,
    familyStatsByProject,
  };
}

/**
 * Batch compute risk scores for all projects and parcels.
 * Uses pre-fetched data to avoid N+1 queries.
 * Returns results grouped by entity type.
 */
export async function computeBatchRisk(
  options?: { weights?: Partial<RiskRuleWeights>; persist?: boolean }
): Promise<{
  projects: RiskComputationResult[];
  parcels: RiskComputationResult[];
}> {
  const mergedWeights: RiskRuleWeights = {
    ...DEFAULT_RISK_WEIGHTS,
    ...(options?.weights || {}),
  };

  // Fetch all entities and bulk data in parallel
  const [projectsRes, parcelsRes, batchData] = await Promise.all([
    query<any>("SELECT * FROM projects"),
    query<any>("SELECT p.*, pr.name AS project_name, pr.current_stage AS project_stage FROM parcels p LEFT JOIN projects pr ON pr.id = p.project_id"),
    fetchBatchData(),
  ]);

  const projectResults: RiskComputationResult[] = [];
  const parcelResults: RiskComputationResult[] = [];

  // Compute project risks using pre-fetched data
  for (const project of projectsRes.rows) {
    const reasons: RiskFactorReason[] = [];
    const notifs = batchData.notificationsByProject.get(project.id) || [];
    const docs = batchData.documentsByProject.get(project.id) || [];
    const parcelStats = batchData.parcelStatsByProject.get(project.id) || { total: 0, disputed: 0, verif: 0, litigated: 0 };
    const familyStats = batchData.familyStatsByProject.get(project.id) || { total: 0, restored: 0 };

    // Rule 1: Stage Dwell Urgency
    const wUrgency = mergedWeights.stage_dwell_urgency;
    if (notifs.length > 0) {
      const n = notifs[0]; // most urgent notification
      const pctElapsed = Math.min(200, (Number(n.days_elapsed) / Number(n.days_total)) * 100);
      const urgency = computeUrgency(pctElapsed, Boolean(n.past_deadline));

      let score = 0;
      let severity: RiskFactorReason["severity"] = "low";
      let explanation = "";

      if (urgency === "lapsed") { score = wUrgency; severity = "critical"; explanation = `Statutory deadline for ${n.section} lapsed.`; }
      else if (urgency === "red") { score = round2(wUrgency * 0.88); severity = "high"; explanation = `Statutory window at ${pctElapsed.toFixed(1)}% elapsed.`; }
      else if (urgency === "amber") { score = round2(wUrgency * 0.56); severity = "medium"; explanation = `Statutory window at ${pctElapsed.toFixed(1)}% elapsed.`; }
      else { explanation = `Statutory timeline compliant.`; }

      reasons.push({ factor: "stage_dwell_urgency", label: "Statutory Stage Dwell Urgency", weight: wUrgency, score, maxScore: wUrgency, severity, explanation, details: { urgency, pctElapsed: round2(pctElapsed), section: n.section } });
    } else {
      const stageStarted = project.stage_started_at ? new Date(project.stage_started_at) : new Date();
      const daysDwelled = Math.floor((Date.now() - stageStarted.getTime()) / 86400000);
      const dwellScore = daysDwelled > 180 ? round2(wUrgency * 0.5) : 0;
      reasons.push({ factor: "stage_dwell_urgency", label: "Statutory Stage Dwell Urgency", weight: wUrgency, score: dwellScore, maxScore: wUrgency, severity: dwellScore > 0 ? "medium" : "low", explanation: `Stage dwell: ${daysDwelled} days.`, details: { daysDwelled, currentStage: project.current_stage } });
    }

    // Rule 2: Disputed Ownership
    const wOwnership = mergedWeights.disputed_ownership;
    const { total: totalParcels, disputed: disputedCount, verif: verifCount } = parcelStats;
    const disputeRatio = totalParcels > 0 ? (disputedCount + verifCount * 0.5) / totalParcels : 0;
    const ownershipScore = clamp(round2(disputeRatio * wOwnership), 0, wOwnership);
    const ownershipSeverity = disputedCount > 0 ? (disputedCount / totalParcels > 0.3 ? "critical" : "high") : verifCount > 0 ? "medium" : "low";
    reasons.push({ factor: "disputed_ownership", label: "Title & Ownership Status", weight: wOwnership, score: ownershipScore, maxScore: wOwnership, severity: ownershipSeverity, explanation: `${disputedCount} disputed, ${verifCount} under verification out of ${totalParcels} parcels.`, details: { totalParcels, disputedCount, verifCount } });

    // Rule 3: Litigation
    const wLitigation = mergedWeights.litigation_flag;
    const { litigated: litigatedCount } = parcelStats;
    const litigationScore = totalParcels > 0 ? clamp(round2((litigatedCount / totalParcels) * wLitigation), 0, wLitigation) : 0;
    reasons.push({ factor: "litigation_flag", label: "Pending Court Litigation", weight: wLitigation, score: litigationScore, maxScore: wLitigation, severity: litigatedCount > 0 ? "high" : "low", explanation: `${litigatedCount} of ${totalParcels} parcels under litigation.`, details: { totalParcels, litigatedCount } });

    // Rule 4: Document Discrepancies
    const wDoc = mergedWeights.document_discrepancy;
    let errorCount = 0;
    let warningCount = 0;
    for (const doc of docs) {
      const flags = Array.isArray(doc.discrepancy_flags) ? doc.discrepancy_flags : [];
      for (const flag of flags) {
        if (flag.severity === "error") errorCount++;
        else if (flag.severity === "warning") warningCount++;
      }
    }
    const docScore = clamp(round2(errorCount * 10 + warningCount * 4), 0, wDoc);
    reasons.push({ factor: "document_discrepancy", label: "Document OCR Discrepancies", weight: wDoc, score: docScore, maxScore: wDoc, severity: errorCount > 0 ? "high" : warningCount > 0 ? "medium" : "low", explanation: `${errorCount} errors, ${warningCount} warnings across ${docs.length} documents.`, details: { errorCount, warningCount, documentsReviewed: docs.length } });

    // Rule 5: R&R Completeness
    const wRR = mergedWeights.rr_incompleteness;
    const { total: totalFamilies, restored: restoredFamilies } = familyStats;
    const pendingFamilies = totalFamilies - restoredFamilies;
    const incompletenessPct = totalFamilies > 0 ? (pendingFamilies / totalFamilies) * 100 : 0;
    const rrScore = round2((incompletenessPct / 100) * wRR);
    reasons.push({ factor: "rr_incompleteness", label: "R&R Resettlement Incompleteness", weight: wRR, score: rrScore, maxScore: wRR, severity: incompletenessPct > 60 ? "high" : incompletenessPct > 0 ? "medium" : "low", explanation: `${pendingFamilies} of ${totalFamilies} families pending.`, details: { totalFamilies, restoredFamilies } });

    const totalScore = clamp(round2(reasons.reduce((sum, r) => sum + r.score, 0)), 0, 100);

    projectResults.push({
      entityType: "project",
      entityId: project.id,
      entityName: project.name,
      district: project.district,
      state: project.state,
      score: totalScore,
      riskCategory: getRiskCategory(totalScore),
      reasons,
      weightsUsed: mergedWeights,
      computedAt: new Date().toISOString(),
    });
  }

  // Compute parcel risks using pre-fetched data
  for (const parcel of parcelsRes.rows) {
    const reasons: RiskFactorReason[] = [];

    // Rule 1: Stage Dwell (from associated project)
    const wUrgency = mergedWeights.stage_dwell_urgency;
    if (parcel.project_id) {
      const notifs = batchData.notificationsByProject.get(parcel.project_id) || [];
      if (notifs.length > 0) {
        const n = notifs[0];
        const pctElapsed = Math.min(200, (Number(n.days_elapsed) / Number(n.days_total)) * 100);
        const urgency = computeUrgency(pctElapsed, Boolean(n.past_deadline));
        let score = 0; let severity: RiskFactorReason["severity"] = "low"; let explanation = "";
        if (urgency === "lapsed") { score = wUrgency; severity = "critical"; explanation = `Project deadline lapsed.`; }
        else if (urgency === "red") { score = round2(wUrgency * 0.88); severity = "high"; explanation = `Project window at ${pctElapsed.toFixed(1)}%.`; }
        else if (urgency === "amber") { score = round2(wUrgency * 0.55); severity = "medium"; explanation = `Project window at ${pctElapsed.toFixed(1)}%.`; }
        else { explanation = `Project timeline compliant.`; }
        reasons.push({ factor: "stage_dwell_urgency", label: "Statutory Stage Dwell Urgency", weight: wUrgency, score, maxScore: wUrgency, severity, explanation, details: { urgency, pctElapsed: round2(pctElapsed), section: n.section } });
      } else {
        reasons.push({ factor: "stage_dwell_urgency", label: "Statutory Stage Dwell Urgency", weight: wUrgency, score: 0, maxScore: wUrgency, severity: "low", explanation: "No active notifications.", details: {} });
      }
    } else {
      reasons.push({ factor: "stage_dwell_urgency", label: "Statutory Stage Dwell Urgency", weight: wUrgency, score: 0, maxScore: wUrgency, severity: "low", explanation: "Standalone parcel.", details: {} });
    }

    // Rule 2: Ownership
    const wOwnership = mergedWeights.disputed_ownership;
    const ownershipStatus = (parcel.ownership_status || "clear").toLowerCase();
    const ownershipScore = ownershipStatus === "disputed" ? wOwnership : ownershipStatus === "under_verification" ? round2(wOwnership * 0.5) : 0;
    const ownershipSeverity = ownershipStatus === "disputed" ? "critical" : ownershipStatus === "under_verification" ? "medium" : "low";
    reasons.push({ factor: "disputed_ownership", label: "Title & Ownership Status", weight: wOwnership, score: ownershipScore, maxScore: wOwnership, severity: ownershipSeverity, explanation: `Ownership: ${ownershipStatus}.`, details: { ownershipStatus } });

    // Rule 3: Litigation
    const wLitigation = mergedWeights.litigation_flag;
    const isLitigated = Boolean(parcel.litigation_flag);
    reasons.push({ factor: "litigation_flag", label: "Pending Court Litigation", weight: wLitigation, score: isLitigated ? wLitigation : 0, maxScore: wLitigation, severity: isLitigated ? "critical" : "low", explanation: isLitigated ? "Active litigation." : "No litigation.", details: { litigationFlag: isLitigated } });

    // Rule 4: Document Discrepancies
    const wDoc = mergedWeights.document_discrepancy;
    const docs = batchData.documentsByProject.get(parcel.project_id) || [];
    let errorCount = 0; let warningCount = 0;
    for (const doc of docs) {
      const flags = Array.isArray(doc.discrepancy_flags) ? doc.discrepancy_flags : [];
      for (const flag of flags) { if (flag.severity === "error") errorCount++; else if (flag.severity === "warning") warningCount++; }
    }
    const docScore = clamp(round2(errorCount * 10 + warningCount * 4), 0, wDoc);
    reasons.push({ factor: "document_discrepancy", label: "Document OCR Discrepancies", weight: wDoc, score: docScore, maxScore: wDoc, severity: errorCount > 0 ? "high" : warningCount > 0 ? "medium" : "low", explanation: `${errorCount} errors, ${warningCount} warnings.`, details: { errorCount, warningCount } });

    // Rule 5: R&R
    const wRR = mergedWeights.rr_incompleteness;
    const fams = batchData.familiesByParcel.get(parcel.id) || [];
    const totalFams = fams.length;
    const restoredFams = fams.filter((f: any) => f.livelihood_restored).length;
    const pendingFams = totalFams - restoredFams;
    const rrPct = totalFams > 0 ? (pendingFams / totalFams) * 100 : 0;
    const rrScore = round2((rrPct / 100) * wRR);
    reasons.push({ factor: "rr_incompleteness", label: "R&R Resettlement Incompleteness", weight: wRR, score: rrScore, maxScore: wRR, severity: rrPct > 60 ? "high" : rrPct > 0 ? "medium" : "low", explanation: `${pendingFams}/${totalFams} families pending.`, details: { totalFamilies: totalFams, restoredFamilies: restoredFams } });

    const totalScore = clamp(round2(reasons.reduce((sum, r) => sum + r.score, 0)), 0, 100);

    parcelResults.push({
      entityType: "parcel",
      entityId: parcel.id,
      entityName: parcel.ulpin ? `ULPIN: ${parcel.ulpin}` : `Survey ${parcel.survey_number || "N/A"}`,
      district: parcel.district,
      state: parcel.state,
      score: totalScore,
      riskCategory: getRiskCategory(totalScore),
      reasons,
      weightsUsed: mergedWeights,
      computedAt: new Date().toISOString(),
    });
  }

  // Persist all results if requested
  if (options?.persist !== false) {
    const { saveRiskScore } = await import("@/lib/db/queries/risk-scores");
    const allResults = [...projectResults, ...parcelResults];
    await Promise.all(
      allResults.map((r) => saveRiskScore(r.entityType, r.entityId, r.score, r.reasons))
    );
  }

  return { projects: projectResults, parcels: parcelResults };
}

/**
 * Pure simulation function: calculates the re-weighted score on the client or server
 * using existing raw factor scores without re-querying the database.
 */
export function simulateRiskScore(
  baseResult: RiskComputationResult,
  customWeights: RiskRuleWeights
): RiskComputationResult {
  const simulatedReasons: RiskFactorReason[] = baseResult.reasons.map((r) => {
    const newWeight = customWeights[r.factor] ?? r.weight;
    // Ratio of original points scored out of original maxScore
    const ratio = r.maxScore > 0 ? r.score / r.maxScore : 0;
    const newScore = round2(ratio * newWeight);

    return {
      ...r,
      weight: newWeight,
      maxScore: newWeight,
      score: newScore,
    };
  });

  const totalScore = clamp(
    round2(simulatedReasons.reduce((sum, r) => sum + r.score, 0)),
    0,
    100
  );

  return {
    ...baseResult,
    score: totalScore,
    riskCategory: getRiskCategory(totalScore),
    reasons: simulatedReasons,
    weightsUsed: customWeights,
    computedAt: new Date().toISOString(),
  };
}
