/**
 * BhoomiSetu — Document Upload API
 * POST /api/upload
 *
 * Multipart form-data pipeline:
 *   1. Receive file (image/PDF) + optional project_id
 *   2. Validate MIME type
 *   3. Run Tesseract.js OCR → raw text + confidence
 *   4. Run NER (BERT + regex) → structured entities + summary
 *   5. Run discrepancy check → compare extracted vs. DB values
 *   6. Store in documents table (raw_ocr_text, ner_entities JSONB, discrepancy_flags JSONB)
 *   7. Return full pipeline result to client
 *
 * Query params / form fields:
 *   - file          : File (required) — image or PDF
 *   - project_id    : string (optional) — link document to a project
 *   - save          : "true" | "false" — whether to persist (default: true)
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runOCR, validateDocumentMime, inferDocType } from "@/lib/ocr";
import { runNER } from "@/lib/ner";
import { checkDiscrepancies, summariseDiscrepancies } from "@/lib/discrepancy";
import { createDocument } from "@/lib/db/queries/documents";

// Max upload size: 10 MB
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const runtime = "nodejs"; // Tesseract.js requires Node.js runtime

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = (formData.get("project_id") as string | null) || undefined;
    const saveFlag = formData.get("save") !== "false"; // default true

    // ── 1. Validate file ──────────────────────────────────────────────────────
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded. Include a 'file' field in form-data." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE_BYTES / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    if (!validateDocumentMime(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Upload a JPEG, PNG, TIFF, WEBP, or PDF.`,
        },
        { status: 415 }
      );
    }

    const filename = file.name;
    const docType = inferDocType(filename);

    // ── 2. OCR ─────────────────────────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ocrResult = await runOCR(buffer, file.type);

    if (!ocrResult.text || ocrResult.wordCount < 3) {
      return NextResponse.json(
        {
          error: "OCR produced no readable text. Ensure the document is clear and not fully blank.",
          ocr: ocrResult,
        },
        { status: 422 }
      );
    }

    // ── 3. NER ─────────────────────────────────────────────────────────────────
    const nerResult = await runNER(ocrResult.text);

    // ── 4. Discrepancy check ───────────────────────────────────────────────────
    const discrepancies = await checkDiscrepancies(nerResult.summary, projectId);
    const discrepancySummary = summariseDiscrepancies(discrepancies);

    // ── 5. Persist (if save=true) ──────────────────────────────────────────────
    let documentId: string | null = null;

    if (saveFlag) {
      const doc = await createDocument({
        project_id: projectId ?? null,
        filename,
        doc_type: docType,
        raw_ocr_text: ocrResult.text,
        ner_entities: nerResult.entities,
        extracted_summary: nerResult.summary,
        discrepancy_flags: discrepancies,
      });
      documentId = doc.id;
    }

    // ── 6. Return pipeline result ──────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      documentId,
      saved: saveFlag,
      filename,
      docType,
      projectId: projectId ?? null,
      ocr: {
        confidence: ocrResult.confidence,
        wordCount: ocrResult.wordCount,
        lowConfidenceWarning: ocrResult.lowConfidenceWarning,
        textPreview: ocrResult.text.slice(0, 500),
      },
      ner: {
        bertUsed: nerResult.bertUsed,
        regexFallback: nerResult.regexFallback,
        entityCount: nerResult.entities.length,
        summary: nerResult.summary,
        // Return all entities for the review panel
        entities: nerResult.entities,
      },
      discrepancies: {
        count: discrepancies.length,
        errorCount: discrepancySummary.errorCount,
        warningCount: discrepancySummary.warningCount,
        hasBlockers: discrepancySummary.hasBlockers,
        items: discrepancies,
      },
    });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json(
      { error: "Upload pipeline failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// GET /api/upload/[id] is handled in a separate route for document retrieval
