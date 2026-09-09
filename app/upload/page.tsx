"use client";

/**
 * BhoomiSetu — Document Upload & OCR/NER Review (/upload)
 *
 * Panels:
 * 1. File Drop Zone    — drag-drop or browse, shows file metadata
 * 2. OCR Progress      — animated progress, confidence indicator
 * 3. Extracted Fields  — NER entity review, edit before save
 * 4. Discrepancy Panel — warnings/errors surfaced prominently
 * 5. Save Action       — link to project_id, confirm and persist
 */

import { useState, useRef, useCallback } from "react";
import useSWR from "swr";
import {
  Upload,
  FileText,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NEREntity {
  type: string;
  value: string;
  normalised?: string | number;
  confidence: number;
  source: "bert" | "regex";
}

interface ExtractedSummary {
  ulpins: string[];
  surveyNumbers: string[];
  sectionRefs: string[];
  dates: string[];
  awardAmountInr: number | null;
  areaHectares: number | null;
  districts: string[];
  villages: string[];
  ownerNames: string[];
  projectRef: string | null;
}

interface Discrepancy {
  type: string;
  severity: "warning" | "error";
  field: string;
  extractedValue: string | number | null;
  databaseValue: string | number | null;
  ulpin?: string;
  message: string;
}

interface UploadResult {
  success: boolean;
  documentId: string | null;
  saved: boolean;
  filename: string;
  docType: string;
  projectId: string | null;
  ocr: {
    confidence: number;
    wordCount: number;
    lowConfidenceWarning: boolean;
    textPreview: string;
  };
  ner: {
    bertUsed: boolean;
    regexFallback: boolean;
    entityCount: number;
    summary: ExtractedSummary;
    entities: NEREntity[];
  };
  discrepancies: {
    count: number;
    errorCount: number;
    warningCount: number;
    hasBlockers: boolean;
    items: Discrepancy[];
  };
}

interface Project { id: string; name: string; district: string; state: string; }

// ── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ConfidenceBadge({ value }: { value: number }) {
  const color =
    value >= 80 ? "bg-green-100 text-green-700 border-green-200"
    : value >= 60 ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
      {value}% confidence
    </span>
  );
}

const ENTITY_COLORS: Record<string, string> = {
  ULPIN: "bg-indigo-100 text-indigo-700 border-indigo-200",
  SURVEY_NO: "bg-blue-100 text-blue-700 border-blue-200",
  SECTION_REF: "bg-purple-100 text-purple-700 border-purple-200",
  NOTIF_DATE: "bg-teal-100 text-teal-700 border-teal-200",
  AWARD_AMOUNT: "bg-green-100 text-green-700 border-green-200",
  AREA_HA: "bg-amber-100 text-amber-700 border-amber-200",
  DISTRICT: "bg-orange-100 text-orange-700 border-orange-200",
  VILLAGE: "bg-pink-100 text-pink-700 border-pink-200",
  OWNER_NAME: "bg-rose-100 text-rose-700 border-rose-200",
  PROJECT_REF: "bg-slate-100 text-slate-700 border-slate-200",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function DropZone({
  onFile,
  file,
  processing,
}: {
  onFile: (f: File) => void;
  file: File | null;
  processing: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }

  const SUPPORTED = "JPEG, PNG, TIFF, WEBP, PDF";

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => !file && !processing && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
        drag
          ? "border-amber-400 bg-amber-50"
          : file
          ? "border-green-400 bg-green-50 cursor-default"
          : "border-gray-300 hover:border-amber-300 hover:bg-amber-50/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.tiff,.tif,.webp,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      {processing ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="text-sm text-amber-700 font-medium">Processing document…</p>
          <p className="text-xs text-amber-500">OCR → NER → Discrepancy check</p>
        </div>
      ) : file ? (
        <div className="flex flex-col items-center gap-2">
          <FileText className="h-10 w-10 text-green-600" />
          <p className="text-sm font-semibold text-green-700">{file.name}</p>
          <p className="text-xs text-green-500">
            {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="h-10 w-10 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-700">
              Drop a scanned document here
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Or click to browse — {SUPPORTED}
            </p>
          </div>
          <p className="text-xs text-gray-400">Max 10 MB</p>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b last:border-0">
      <span className="text-xs text-gray-500 shrink-0 w-36">{label}</span>
      <span className={`text-xs font-medium text-gray-800 text-right ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function DiscrepancyCard({ d }: { d: Discrepancy }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-sm ${
        d.severity === "error"
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-2">
        {d.severity === "error" ? (
          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        )}
        <div>
          <div className={`font-semibold text-xs uppercase tracking-wide mb-0.5 ${d.severity === "error" ? "text-red-700" : "text-amber-700"}`}>
            {d.type.replace(/_/g, " ")}
          </div>
          <p className={`text-xs ${d.severity === "error" ? "text-red-700" : "text-amber-700"}`}>
            {d.message}
          </p>
          {(d.extractedValue !== null || d.databaseValue !== null) && (
            <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/70 rounded px-2 py-1">
                <div className="text-gray-400 mb-0.5">Extracted</div>
                <div className="font-mono text-gray-700">{String(d.extractedValue ?? "—")}</div>
              </div>
              <div className="bg-white/70 rounded px-2 py-1">
                <div className="text-gray-400 mb-0.5">Database</div>
                <div className="font-mono text-gray-700">{String(d.databaseValue ?? "—")}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [showAllEntities, setShowAllEntities] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Fetch projects for the project selector
  const { data: projectsData } = useSWR<{ data: Project[] }>("/api/projects", fetcher);
  const projects = projectsData?.data ?? [];

  // ── Process file ─────────────────────────────────────────────────────────────

  const processFile = useCallback(async (f: File, pid?: string) => {
    setProcessing(true);
    setResult(null);
    setError(null);
    setSaveResult(null);
    setShowRawText(false);
    setShowAllEntities(false);

    try {
      const form = new FormData();
      form.append("file", f);
      if (pid) form.append("project_id", pid);
      form.append("save", "false"); // First pass: extract only, don't persist yet

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      setResult(data as UploadResult);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  }, []);

  function handleFileSelect(f: File) {
    setFile(f);
    setResult(null);
    setError(null);
  }

  async function handleProcess() {
    if (!file) return;
    await processFile(file, projectId || undefined);
  }

  // ── Save to DB ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!file || !result) return;
    setSaving(true);
    setSaveResult(null);

    try {
      const form = new FormData();
      form.append("file", file);
      if (projectId) form.append("project_id", projectId);
      form.append("save", "true");

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaveResult({
        ok: true,
        message: `Document saved — ID: ${data.documentId}`,
      });
    } catch (err) {
      setSaveResult({ ok: false, message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Upload</h1>
          <p className="text-sm text-gray-500">
            OCR → NER extraction → discrepancy detection for notifications, awards, SIA reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left Column: upload controls ──────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Drop zone */}
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-indigo-600" />
              Upload Document
            </h2>
            <DropZone onFile={handleFileSelect} file={file} processing={processing} />
          </div>

          {/* Project selector */}
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Search className="h-4 w-4 text-amber-600" />
              Link to Project (optional)
            </h2>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">— No project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.district})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Link enables discrepancy check against parcels in this project
            </p>
          </div>

          {/* Process button */}
          <button
            onClick={handleProcess}
            disabled={!file || processing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {processing ? "Extracting…" : "Extract & Analyse"}
          </button>

          {/* Reset */}
          {result && (
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
                setError(null);
                setSaveResult(null);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Upload Another
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Pipeline info */}
          <div className="bg-gray-50 rounded-xl border p-3 text-xs text-gray-500 space-y-1">
            <div className="font-semibold text-gray-600 mb-1">Pipeline</div>
            {[
              "Tesseract.js OCR (v4)",
              "Domain regex: ULPIN, survey no., Section ref, dates, amounts, area",
              "HuggingFace BERT-NER for owner names (if API key set)",
              "Discrepancy check vs. parcels/awards DB",
            ].map((s) => (
              <div key={s} className="flex items-start gap-1">
                <span className="text-indigo-400 mt-0.5">›</span>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Column: results ─────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {!result && !processing && (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed text-gray-400">
              <FileText className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Results will appear here after extraction</p>
              <p className="text-xs mt-1 opacity-70">Upload a document and click "Extract & Analyse"</p>
            </div>
          )}

          {result && (
            <>
              {/* ── OCR Card ─────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-teal-600" />
                    OCR Result
                  </h2>
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge value={result.ocr.confidence} />
                    {result.ocr.lowConfidenceWarning && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ⚠ Low quality scan
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: "Filename", value: result.filename },
                    { label: "Document Type", value: result.docType },
                    { label: "Word Count", value: result.ocr.wordCount.toString() },
                    { label: "NER Method", value: result.ner.bertUsed ? "BERT + Regex" : "Regex only" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-xs">
                      <div className="text-gray-400">{label}</div>
                      <div className="font-medium text-gray-700">{value}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowRawText((v) => !v)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  {showRawText ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showRawText ? "Hide" : "Show"} raw text
                </button>

                {showRawText && (
                  <pre className="mt-2 text-xs bg-gray-50 rounded-lg p-3 overflow-auto max-h-40 border font-mono whitespace-pre-wrap text-gray-700">
                    {result.ocr.textPreview}
                    {result.ocr.wordCount > 60 && "\n\n[…truncated]"}
                  </pre>
                )}
              </div>

              {/* ── Extracted Fields (NER Summary) ───────────────────── */}
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-indigo-600" />
                  Extracted Fields
                  <span className="ml-auto text-xs font-normal text-gray-400">
                    {result.ner.entityCount} entities
                  </span>
                </h2>

                <div className="divide-y">
                  <SummaryRow
                    label="ULPIN(s)"
                    mono
                    value={
                      result.ner.summary.ulpins.length > 0
                        ? result.ner.summary.ulpins.join(", ")
                        : null
                    }
                  />
                  <SummaryRow label="Survey No(s)." value={result.ner.summary.surveyNumbers.join(", ") || null} />
                  <SummaryRow label="Section Refs" value={result.ner.summary.sectionRefs.join(", ") || null} />
                  <SummaryRow label="Dates" value={result.ner.summary.dates.join("; ") || null} />
                  <SummaryRow
                    label="Award Amount"
                    value={
                      result.ner.summary.awardAmountInr !== null
                        ? `₹${(result.ner.summary.awardAmountInr / 100000).toFixed(2)} lakh`
                        : null
                    }
                  />
                  <SummaryRow
                    label="Area"
                    value={
                      result.ner.summary.areaHectares !== null
                        ? `${result.ner.summary.areaHectares} ha`
                        : null
                    }
                  />
                  <SummaryRow label="District(s)" value={result.ner.summary.districts.join(", ") || null} />
                  <SummaryRow label="Village(s)" value={result.ner.summary.villages.join(", ") || null} />
                  <SummaryRow label="Owner Names" value={result.ner.summary.ownerNames.join(", ") || null} />
                  <SummaryRow label="Project Ref" mono value={result.ner.summary.projectRef} />
                </div>

                {/* Entity tags */}
                <div className="mt-3">
                  <button
                    onClick={() => setShowAllEntities((v) => !v)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showAllEntities ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showAllEntities ? "Hide" : "Show"} all entity tags
                  </button>

                  {showAllEntities && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.ner.entities.map((e, i) => (
                        <span
                          key={i}
                          title={`${e.type} · ${(e.confidence * 100).toFixed(0)}% · ${e.source}`}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${ENTITY_COLORS[e.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                        >
                          <span className="opacity-60 text-[10px]">{e.type}</span>
                          {e.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Discrepancy Panel ─────────────────────────────────── */}
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Discrepancy Check
                  </h2>
                  <div className="flex items-center gap-2">
                    {result.discrepancies.errorCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        {result.discrepancies.errorCount} error{result.discrepancies.errorCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {result.discrepancies.warningCount > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {result.discrepancies.warningCount} warning{result.discrepancies.warningCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {result.discrepancies.count === 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        No issues
                      </span>
                    )}
                  </div>
                </div>

                {result.discrepancies.count === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4" />
                    All extracted fields match the database records.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {result.discrepancies.items.map((d, i) => (
                      <DiscrepancyCard key={i} d={d} />
                    ))}
                  </div>
                )}

                {!projectId && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Link to a project above to enable full discrepancy checking against parcels/awards
                  </div>
                )}
              </div>

              {/* ── Save action ───────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Save className="h-4 w-4 text-green-600" />
                  Save Document
                </h2>

                {result.discrepancies.hasBlockers && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-xs text-red-700">
                    <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {result.discrepancies.errorCount} critical error{result.discrepancies.errorCount !== 1 ? "s" : ""} found.
                    You can still save — errors are recorded in discrepancy_flags for review.
                  </div>
                )}

                {saveResult && (
                  <div
                    className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 mb-3 ${
                      saveResult.ok
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {saveResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {saveResult.message}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !!saveResult?.ok}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving…" : saveResult?.ok ? "Saved ✓" : "Save to Database"}
                  </button>
                  {projectId && (
                    <div className="text-xs text-gray-500">
                      → linked to project
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
