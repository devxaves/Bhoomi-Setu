/**
 * BhoomiSetu — Discrepancy Detection Engine
 *
 * After NER extraction from a document, this module:
 * 1. Queries the database for matching parcels/awards using extracted ULPINs
 * 2. Compares extracted field values against stored database values
 * 3. Writes structured mismatches to documents.discrepancy_flags (JSONB)
 *
 * Discrepancy types checked:
 *   - area_mismatch        : extracted area_hectares ≠ parcels.area_hectares (>5% tolerance)
 *   - ulpin_not_found      : extracted ULPIN not in parcels table
 *   - survey_no_mismatch   : extracted survey number ≠ parcels.survey_number
 *   - district_mismatch    : extracted district ≠ parcels.district
 *   - amount_mismatch      : extracted award amount ≠ awards.total_compensation (>5% tolerance)
 *   - section_out_of_order : Section 19 before Section 11 in timeline
 */

import { query } from "@/lib/db/pool";
import type { ExtractedSummary } from "@/lib/ner";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Discrepancy {
  type: DiscrepancyType;
  severity: "warning" | "error";
  field: string;
  extractedValue: string | number | null;
  databaseValue: string | number | null;
  ulpin?: string;
  message: string;
}

export type DiscrepancyType =
  | "area_mismatch"
  | "ulpin_not_found"
  | "survey_no_mismatch"
  | "district_mismatch"
  | "amount_mismatch"
  | "section_out_of_order"
  | "parcel_project_mismatch";

interface ParcelRow {
  id: string;
  ulpin: string;
  survey_number: string | null;
  village: string | null;
  district: string | null;
  area_hectares: number | null;
  project_id: string | null;
}

interface AwardRow {
  id: string;
  parcel_id: string;
  total_compensation: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Percentage difference between two numbers */
function pctDiff(a: number, b: number): number {
  if (b === 0) return 100;
  return Math.abs(a - b) / b * 100;
}

/** Case-insensitive normalised district comparison */
function districtMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

/** Fuzzy survey number comparison (strips spaces, dashes, case) */
function surveyMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[\s\-\/]/g, "");
  return norm(a) === norm(b);
}

// ── Main Discrepancy Check ────────────────────────────────────────────────────

/**
 * Run all discrepancy checks between extracted NER summary and the database.
 * Returns structured discrepancy list — empty array means no issues found.
 */
export async function checkDiscrepancies(
  summary: ExtractedSummary,
  projectId?: string | null
): Promise<Discrepancy[]> {
  const discrepancies: Discrepancy[] = [];

  if (summary.ulpins.length === 0 && summary.areaHectares === null) {
    // Nothing actionable to check
    return discrepancies;
  }

  // ── 1. ULPIN-based checks ──────────────────────────────────────────────────
  for (const ulpin of summary.ulpins) {
    const { rows: parcels } = await query<ParcelRow>(
      `SELECT id, ulpin, survey_number, village, district, area_hectares, project_id
       FROM parcels WHERE ulpin = $1`,
      [ulpin]
    );

    if (parcels.length === 0) {
      // ULPIN from document not found in our parcels table
      discrepancies.push({
        type: "ulpin_not_found",
        severity: "error",
        field: "ulpin",
        extractedValue: ulpin,
        databaseValue: null,
        ulpin,
        message: `ULPIN ${ulpin} extracted from document is not registered in the parcels table.`,
      });
      continue; // Can't check further for this ULPIN
    }

    const parcel = parcels[0];

    // ── 2. Area mismatch (>5% tolerance) ──────────────────────────────────
    if (summary.areaHectares !== null && parcel.area_hectares !== null) {
      const diff = pctDiff(summary.areaHectares, parcel.area_hectares);
      if (diff > 5) {
        discrepancies.push({
          type: "area_mismatch",
          severity: diff > 20 ? "error" : "warning",
          field: "area_hectares",
          extractedValue: summary.areaHectares,
          databaseValue: parcel.area_hectares,
          ulpin,
          message: `Area discrepancy for ULPIN ${ulpin}: document says ${summary.areaHectares} ha, database has ${parcel.area_hectares} ha (${diff.toFixed(1)}% difference).`,
        });
      }
    }

    // ── 3. Survey number mismatch ──────────────────────────────────────────
    if (summary.surveyNumbers.length > 0 && parcel.survey_number) {
      const docSurvey = summary.surveyNumbers[0];
      if (!surveyMatch(docSurvey, parcel.survey_number)) {
        discrepancies.push({
          type: "survey_no_mismatch",
          severity: "warning",
          field: "survey_number",
          extractedValue: docSurvey,
          databaseValue: parcel.survey_number,
          ulpin,
          message: `Survey number mismatch for ULPIN ${ulpin}: document has "${docSurvey}", database has "${parcel.survey_number}".`,
        });
      }
    }

    // ── 4. District mismatch ───────────────────────────────────────────────
    if (summary.districts.length > 0 && parcel.district) {
      const extractedDistrict = summary.districts[0];
      if (!districtMatch(extractedDistrict, parcel.district)) {
        discrepancies.push({
          type: "district_mismatch",
          severity: "warning",
          field: "district",
          extractedValue: extractedDistrict,
          databaseValue: parcel.district,
          ulpin,
          message: `District mismatch for ULPIN ${ulpin}: document says "${extractedDistrict}", database has "${parcel.district}".`,
        });
      }
    }

    // ── 5. Project linkage check ───────────────────────────────────────────
    if (projectId && parcel.project_id && parcel.project_id !== projectId) {
      discrepancies.push({
        type: "parcel_project_mismatch",
        severity: "warning",
        field: "project_id",
        extractedValue: projectId,
        databaseValue: parcel.project_id,
        ulpin,
        message: `ULPIN ${ulpin} is linked to a different project in the database (${parcel.project_id}) vs. the document being uploaded to (${projectId}).`,
      });
    }

    // ── 6. Award amount check ──────────────────────────────────────────────
    if (summary.awardAmountInr !== null) {
      const { rows: awards } = await query<AwardRow>(
        `SELECT id, parcel_id, total_compensation
         FROM awards WHERE parcel_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [parcel.id]
      );

      if (awards.length > 0 && awards[0].total_compensation !== null) {
        const diff = pctDiff(summary.awardAmountInr, awards[0].total_compensation);
        if (diff > 5) {
          discrepancies.push({
            type: "amount_mismatch",
            severity: diff > 25 ? "error" : "warning",
            field: "total_compensation",
            extractedValue: summary.awardAmountInr,
            databaseValue: awards[0].total_compensation,
            ulpin,
            message: `Award amount discrepancy for ULPIN ${ulpin}: document has ₹${(summary.awardAmountInr / 100000).toFixed(2)} lakh, database has ₹${((awards[0].total_compensation) / 100000).toFixed(2)} lakh (${diff.toFixed(1)}% difference).`,
          });
        }
      }
    }
  }

  // ── 7. Section ordering sanity check ──────────────────────────────────────
  const hasSection11 = summary.sectionRefs.some((s) => s.includes("11"));
  const hasSection19 = summary.sectionRefs.some((s) => s.includes("19"));
  if (hasSection19 && !hasSection11) {
    discrepancies.push({
      type: "section_out_of_order",
      severity: "warning",
      field: "section_refs",
      extractedValue: summary.sectionRefs.join(", "),
      databaseValue: null,
      message:
        "Document references Section 19 but not Section 11. Under RFCTLARR, Section 11 notification must precede Section 19 declaration. Verify the document set is complete.",
    });
  }

  return discrepancies;
}

/**
 * Compute a severity summary for UI display.
 */
export function summariseDiscrepancies(discrepancies: Discrepancy[]): {
  errorCount: number;
  warningCount: number;
  hasBlockers: boolean;
} {
  const errorCount = discrepancies.filter((d) => d.severity === "error").length;
  const warningCount = discrepancies.filter((d) => d.severity === "warning").length;
  return {
    errorCount,
    warningCount,
    hasBlockers: errorCount > 0,
  };
}
