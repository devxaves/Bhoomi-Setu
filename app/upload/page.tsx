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
 * Redesigned with White + Orange theme, Sora & Space Grotesk typography
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
  Sparkles,
  FileCheck,
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
    value >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : value >= 60 ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-red-50 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${color}`}>
      {value}% confidence
    </span>
  );
}

const ENTITY_COLORS: Record<string, string> = {
  ULPIN: "bg-orange-50 text-orange-700 border-orange-200",
  SURVEY_NO: "bg-blue-50 text-blue-700 border-blue-200",
  SECTION_REF: "bg-purple-50 text-purple-700 border-purple-200",
  NOTIF_DATE: "bg-teal-50 text-teal-700 border-teal-200",
  AWARD_AMOUNT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AREA_HA: "bg-amber-50 text-amber-700 border-amber-200",
  DISTRICT: "bg-rose-50 text-rose-700 border-rose-200",
  VILLAGE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OWNER_NAME: "bg-pink-50 text-pink-700 border-pink-200",
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
          ? "border-orange-500 bg-orange-50/60 shadow-inner"
          : file
          ? "border-emerald-400 bg-emerald-50/40 cursor-default"
          : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/30"
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
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          <p className="text-sm text-orange-800 font-heading font-bold">Processing document…</p>
          <p className="text-xs text-orange-600 font-mono">OCR → Legal NER → Discrepancy engine</p>
        </div>
      ) : file ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileCheck className="h-6 w-6" />
          </div>
          <p className="text-sm font-heading font-bold text-emerald-800">{file.name}</p>
          <p className="text-xs text-emerald-600 font-mono">
            {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown format"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-heading font-bold text-slate-800">
              Drop a statutory document here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Or click to browse from device — {SUPPORTED}
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Max 10 MB file
          </span>
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
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 shrink-0 w-36 font-medium">{label}</span>
      <span className={`text-xs font-semibold text-slate-800 text-right ${mono ? "font-mono text-orange-700" : ""}`}>
        {value ?? <span className="text-slate-300 font-normal">—</span>}
      </span>
    </div>
  );
}

function DiscrepancyCard({ d }: { d: Discrepancy }) {
  return (
    <div
      className={`rounded-xl border p-3.5 text-xs ${
        d.severity === "error"
          ? "bg-red-50/70 border-red-200 text-red-900"
          : "bg-amber-50/70 border-amber-200 text-amber-900"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {d.severity === "error" ? (
          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-mono font-bold text-[10px] uppercase tracking-wider mb-0.5 ${d.severity === "error" ? "text-red-700" : "text-amber-700"}`}>
            {d.type.replace(/_/g, " ")}
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {d.message}
          </p>
          {(d.extractedValue !== null || d.databaseValue !== null) && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/80 rounded-lg p-2 border border-black/5">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Extracted from Document</div>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{String(d.extractedValue ?? "—")}</div>
              </div>
              <div className="bg-white/80 rounded-lg p-2 border border-black/5">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Database Record</div>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{String(d.databaseValue ?? "—")}</div>
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
      form.append("save", "false");

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
        message: `Document saved successfully — Document ID: ${data.documentId}`,
      });
    } catch (err) {
      setSaveResult({ ok: false, message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm relative overflow-hidden animate-fade-in">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 mb-1">
                <Sparkles className="w-3 h-3 text-orange-500" />
                OCR & Legal NER Intelligence
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
                Document Ingestion & Verification
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Scan gazette notifications, awards, and survey maps with automatic discrepancy detection against revenue land records.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Left Column: upload controls ──────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Drop zone */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5 font-mono">
                <Upload className="h-4 w-4 text-orange-500" />
                Upload Document File
              </h2>
              <DropZone onFile={handleFileSelect} file={file} processing={processing} />
            </div>

            {/* Project selector */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5 font-mono">
                <Search className="h-4 w-4 text-amber-600" />
                Associate Project (Optional)
              </h2>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium text-slate-700"
              >
                <option value="">— Standalone Document (No Project) —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.district})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Associating a project compares extracted land metrics directly against parcel registries.
              </p>
            </div>

            {/* Process button */}
            <button
              onClick={handleProcess}
              disabled={!file || processing}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer text-xs uppercase tracking-wider font-mono"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {processing ? "Extracting Entities…" : "Extract & Verify"}
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Upload Another Document
              </button>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium animate-fade-in">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Pipeline info */}
            <div className="bg-orange-50/40 rounded-2xl border border-orange-100 p-4 text-xs text-slate-600 space-y-1.5">
              <div className="font-heading font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Extraction Pipeline
              </div>
              {[
                "Tesseract.js OCR engine",
                "Statutory regex: ULPIN, Survey, Section refs, Area, Dates",
                "HuggingFace Legal-NER for claimant & owner identities",
                "Automated discrepancy cross-matching with database records",
              ].map((s) => (
                <div key={s} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                  <span className="text-orange-500 font-bold">›</span>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Column: results ─────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {!result && !processing && (
              <div className="flex flex-col items-center justify-center h-80 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 p-6 text-center">
                <FileText className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm font-heading font-bold text-slate-600">No Document Analysed Yet</p>
                <p className="text-xs mt-1 text-slate-400 max-w-sm">
                  Upload a scanned gazette notification, award notice, or RoR deed to inspect extracted entities and verify database consistency.
                </p>
              </div>
            )}

            {result && (
              <>
                {/* ── OCR Card ─────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 animate-fade-in">
                  <div className="flex items-center justify-between mb-3.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                      <Eye className="h-4 w-4 text-orange-500" />
                      OCR Extraction Results
                    </h2>
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge value={result.ocr.confidence} />
                      {result.ocr.lowConfidenceWarning && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                          ⚠ Low scan quality
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {[
                      { label: "Document Name", value: result.filename },
                      { label: "Classification", value: result.docType },
                      { label: "Extracted Words", value: result.ocr.wordCount.toString() },
                      { label: "NER Method", value: result.ner.bertUsed ? "BERT + Regex" : "Statutory Regex" },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-xs">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{label}</div>
                        <div className="font-semibold text-slate-800 mt-0.5 truncate">{value}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowRawText((v) => !v)}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                  >
                    {showRawText ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showRawText ? "Hide" : "Inspect"} raw OCR stream
                  </button>

                  {showRawText && (
                    <pre className="mt-2.5 text-xs bg-slate-50 rounded-xl p-3.5 overflow-auto max-h-40 border border-slate-200 font-mono whitespace-pre-wrap text-slate-700">
                      {result.ocr.textPreview}
                      {result.ocr.wordCount > 60 && "\n\n[…truncated for preview]"}
                    </pre>
                  )}
                </div>

                {/* ── Extracted Fields (NER Summary) ───────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 animate-fade-in">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center justify-between font-mono">
                    <span className="flex items-center gap-1.5">
                      <Search className="h-4 w-4 text-orange-500" />
                      Extracted Legal Entities
                    </span>
                    <span className="text-[10px] font-normal text-slate-400 font-mono">
                      {result.ner.entityCount} entities isolated
                    </span>
                  </h2>

                  <div className="divide-y divide-slate-100">
                    <SummaryRow
                      label="ULPIN(s)"
                      mono
                      value={
                        result.ner.summary.ulpins.length > 0
                          ? result.ner.summary.ulpins.join(", ")
                          : null
                      }
                    />
                    <SummaryRow label="Survey Numbers" value={result.ner.summary.surveyNumbers.join(", ") || null} />
                    <SummaryRow label="Section Reference" value={result.ner.summary.sectionRefs.join(", ") || null} />
                    <SummaryRow label="Notified Dates" value={result.ner.summary.dates.join("; ") || null} />
                    <SummaryRow
                      label="Assessed Award"
                      value={
                        result.ner.summary.awardAmountInr !== null
                          ? `₹${(result.ner.summary.awardAmountInr / 100000).toFixed(2)} Lakh`
                          : null
                      }
                    />
                    <SummaryRow
                      label="Demarcated Area"
                      value={
                        result.ner.summary.areaHectares !== null
                          ? `${result.ner.summary.areaHectares} ha`
                          : null
                      }
                    />
                    <SummaryRow label="District(s)" value={result.ner.summary.districts.join(", ") || null} />
                    <SummaryRow label="Revenue Village" value={result.ner.summary.villages.join(", ") || null} />
                    <SummaryRow label="Recorded Owners" value={result.ner.summary.ownerNames.join(", ") || null} />
                    <SummaryRow label="Project Code" mono value={result.ner.summary.projectRef} />
                  </div>

                  {/* Entity tags */}
                  <div className="mt-3 pt-2">
                    <button
                      onClick={() => setShowAllEntities((v) => !v)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      {showAllEntities ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {showAllEntities ? "Collapse" : "Expand"} all entity tags
                    </button>

                    {showAllEntities && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 animate-fade-in">
                        {result.ner.entities.map((e, i) => (
                          <span
                            key={i}
                            title={`${e.type} · ${(e.confidence * 100).toFixed(0)}% confidence`}
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-mono ${ENTITY_COLORS[e.type] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
                          >
                            <span className="opacity-60 text-[9px] uppercase font-bold">{e.type}</span>
                            <span>{e.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Discrepancy Panel ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 animate-fade-in">
                  <div className="flex items-center justify-between mb-3.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Statutory Discrepancy Verification
                    </h2>
                    <div className="flex items-center gap-2">
                      {result.discrepancies.errorCount > 0 && (
                        <span className="text-xs bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full font-bold border border-red-200 font-mono">
                          {result.discrepancies.errorCount} blocker{result.discrepancies.errorCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {result.discrepancies.warningCount > 0 && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold border border-amber-200 font-mono">
                          {result.discrepancies.warningCount} warning{result.discrepancies.warningCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {result.discrepancies.count === 0 && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified Consistent
                        </span>
                      )}
                    </div>
                  </div>

                  {result.discrepancies.count === 0 ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      All extracted statutory fields match baseline revenue records without discrepancy.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {result.discrepancies.items.map((d, i) => (
                        <DiscrepancyCard key={i} d={d} />
                      ))}
                    </div>
                  )}

                  {!projectId && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <Info className="h-4 w-4 text-orange-500 shrink-0" />
                      Select a project from the left panel to trigger deep discrepancy checking against demarcated parcels.
                    </div>
                  )}
                </div>

                {/* ── Save action ───────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 animate-fade-in">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5 font-mono">
                    <Save className="h-4 w-4 text-emerald-600" />
                    Commit Extracted Document
                  </h2>

                  {result.discrepancies.hasBlockers && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-3.5 text-xs text-red-700 font-medium">
                      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      {result.discrepancies.errorCount} critical error{result.discrepancies.errorCount !== 1 ? "s" : ""} found.
                      You may still persist — flagged items will appear on the executive compliance desk.
                    </div>
                  )}

                  {saveResult && (
                    <div
                      className={`flex items-center gap-2 text-xs font-medium rounded-xl p-3 mb-3.5 ${
                        saveResult.ok
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {saveResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                      {saveResult.message}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving || !!saveResult?.ok}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer text-xs uppercase tracking-wider font-mono"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? "Persisting Record…" : saveResult?.ok ? "Saved to Repository ✓" : "Commit Document to Repository"}
                    </button>
                    {projectId && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        → linked to corridor
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
