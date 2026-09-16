"use client";

/**
 * BhoomiSetu — Workflow Detail (/workflow/[projectId])
 *
 * Individual project workflow view with:
 * - 10-stage pipeline visualization
 * - Advance stage controls (role-gated)
 * - Deadline urgency cards
 * - Audit log timeline
 * - Parcel & award summaries
 * - Redesigned with White + Orange aesthetic and Sora / Space Grotesk typography
 */

import { useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  MapPin,
  Loader2,
  Banknote,
  Scale,
  History,
  Play,
  Sparkles,
} from "lucide-react";
import { STAGE_INFO, STAGES, formatCountdown } from "@/lib/workflow";
import type { Stage } from "@/lib/workflow";

// ── Types ──────────────────────────────────────────────────────────────────

interface WorkflowProject {
  id: string;
  name: string;
  land_requiring_body: string;
  project_type: string | null;
  district: string;
  state: string;
  current_stage: Stage;
  stage_started_at: string;
  status_flag: "green" | "amber" | "red" | "lapsed";
  risk_score: number;
  created_at: string;
}

interface AuditEntry {
  id: string;
  actor_id: string | null;
  action: string;
  before_state: any;
  after_state: any;
  created_at: string;
  actor_email?: string;
  actor_role?: string;
}

interface ParcelSummary {
  id: string;
  ulpin: string;
  survey_number: string | null;
  village: string | null;
  area_hectares: number | null;
  ownership_status: string;
  litigation_flag: boolean;
  risk_score: number;
}

interface AwardSummary {
  id: string;
  ulpin: string | null;
  award_date: string;
  market_value: number;
  total_compensation: number;
  payment_status: string | null;
  amount_disbursed: number | null;
}

interface Deadline {
  id: string;
  section: "section_11" | "section_19";
  notified_on: string;
  deadline_on: string;
  days_left: number;
  is_past: boolean;
  urgency: "green" | "amber" | "red" | "lapsed";
  pct_elapsed: number;
}

interface WorkflowData {
  project: WorkflowProject;
  auditLog: AuditEntry[];
  parcels: ParcelSummary[];
  awards: AwardSummary[];
  deadlines: Deadline[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Helpers ────────────────────────────────────────────────────────────────

const RAG_BADGE: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  lapsed: "bg-purple-50 text-purple-700 border-purple-200",
};

const URGENCY_STYLE: Record<string, string> = {
  green: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
  amber: "bg-amber-50/70 border-amber-200 text-amber-900",
  red: "bg-red-50/70 border-red-200 text-red-900",
  lapsed: "bg-purple-50/70 border-purple-200 text-purple-900",
};

function riskColor(score: number): string {
  if (score >= 70) return "text-red-600";
  if (score >= 40) return "text-amber-600";
  return "text-emerald-600";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function WorkflowDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [advanceSuccess, setAdvanceSuccess] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{ data: WorkflowData }>(
    projectId ? `/api/projects/${projectId}/workflow` : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  const handleAdvance = useCallback(async () => {
    if (!data?.data.project) return;
    const project = data.data.project;
    const currentIdx = STAGES.indexOf(project.current_stage);
    const nextStage = STAGES[currentIdx + 1];
    if (!nextStage) return;

    setAdvancing(true);
    setAdvanceError(null);
    setAdvanceSuccess(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/advance-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_stage: nextStage }),
      });
      const result = await res.json();

      if (!res.ok) {
        setAdvanceError(result.message || result.error || "Stage advance failed");
      } else {
        setAdvanceSuccess(
          `Advanced to "${STAGE_INFO[nextStage].label}" (${STAGE_INFO[nextStage].actRef})`
        );
        mutate();
      }
    } catch {
      setAdvanceError("Network error — could not reach server");
    } finally {
      setAdvancing(false);
    }
  }, [data, mutate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-sm font-medium text-slate-500">Loading statutory workflow…</span>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-slate-400 px-4">
        <AlertTriangle className="h-12 w-12 mb-3 text-amber-500" />
        <p className="text-lg font-heading font-bold text-slate-700">Failed to load workflow</p>
        <p className="text-xs text-slate-400 mt-1">{error?.message || "Project not found or server error"}</p>
        <Link
          href="/workflow"
          className="mt-5 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-semibold hover:bg-orange-100 transition-colors"
        >
          ← Back to workflow list
        </Link>
      </div>
    );
  }

  const { project, auditLog, parcels, awards, deadlines } = data.data;
  const currentIdx = STAGES.indexOf(project.current_stage);
  const nextStage = STAGES[currentIdx + 1];
  const isClosed = project.current_stage === "closed";
  const dwellDays = Math.floor(
    (Date.now() - new Date(project.stage_started_at).getTime()) / 86400000
  );

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex items-center gap-4 relative overflow-hidden animate-fade-in">
          <Link
            href="/workflow"
            className="p-2 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-500 hover:text-orange-700 transition-all"
            title="Back to workflows"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 truncate">
                  {project.name}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {project.land_requiring_body} · <span className="font-medium text-slate-700">{project.district}, {project.state}</span>
                </p>
              </div>
            </div>
          </div>
          <span className={`inline-flex shrink-0 items-center px-3 py-1 rounded-full text-xs font-mono font-bold border ${RAG_BADGE[project.status_flag]}`}>
            {project.status_flag.toUpperCase()}
          </span>
        </div>

        {/* Stage Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Statutory 10-Stage Pipeline — RFCTLARR Act
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Clock className="h-3.5 w-3.5 text-orange-500" />
              {dwellDays} day{dwellDays !== 1 ? "s" : ""} in current stage
            </div>
          </div>

          {/* Pipeline bar */}
          <div className="flex items-end gap-1 mb-4">
            {STAGES.map((stage, idx) => {
              const info = STAGE_INFO[stage];
              const isComplete = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={stage} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full h-3 rounded-md transition-all duration-300 ${
                      isComplete
                        ? "bg-emerald-500 shadow-sm"
                        : isCurrent
                        ? project.status_flag === "red"
                          ? "bg-red-500 shadow-md ring-2 ring-red-200"
                          : project.status_flag === "amber"
                          ? "bg-amber-500 shadow-md ring-2 ring-amber-200"
                          : "bg-orange-500 shadow-md ring-2 ring-orange-200"
                        : "bg-slate-100"
                    }`}
                  />
                  <span
                    className={`text-[9px] mt-1.5 leading-tight text-center truncate w-full ${
                      isCurrent
                        ? "text-orange-600 font-heading font-bold"
                        : isComplete
                        ? "text-emerald-600 font-medium"
                        : "text-slate-400"
                    }`}
                  >
                    {info.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current stage detail card */}
          <div className="bg-orange-50/40 border border-orange-100/80 rounded-2xl p-5 mt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-600 font-bold">
                  Current Active Stage
                </span>
                <div className="text-lg font-heading font-extrabold text-slate-900 mt-0.5">
                  {STAGE_INFO[project.current_stage].label}
                </div>
                <div className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                  {STAGE_INFO[project.current_stage].description}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1.5">
                  Reference: {STAGE_INFO[project.current_stage].actRef}
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end self-start sm:self-auto shrink-0">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-heading font-black bg-white shadow-sm border-2 ${
                    project.risk_score >= 70 ? "border-red-400 text-red-600" : project.risk_score >= 40 ? "border-amber-400 text-amber-600" : "border-emerald-400 text-emerald-600"
                  }`}
                >
                  {Math.round(project.risk_score)}
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Risk Score
                </div>
              </div>
            </div>
          </div>

          {/* Advance button */}
          {!isClosed && nextStage && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              {advanceSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 text-xs text-emerald-800 flex items-center gap-2.5 font-medium animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {advanceSuccess}
                </div>
              )}
              {advanceError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-xs text-red-800 flex items-center gap-2.5 font-medium animate-fade-in">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  {advanceError}
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Subsequent Statutory Step:{" "}
                  <strong className="text-slate-800 font-heading">{STAGE_INFO[nextStage].label}</strong>
                  <span className="text-slate-400 font-mono ml-1">({STAGE_INFO[nextStage].actRef})</span>
                </div>
                <button
                  onClick={handleAdvance}
                  disabled={advancing}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {advancing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Advance to {STAGE_INFO[nextStage].label}
                </button>
              </div>
            </div>
          )}

          {isClosed && (
            <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-2 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              <span>Statutory lifecycle fully completed and closed under RFCTLARR.</span>
            </div>
          )}
        </div>

        {/* Deadlines */}
        {deadlines.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 animate-fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 font-mono">
              Statutory Deadlines Watch
            </h2>
            <div className="grid gap-3">
              {deadlines.map((d) => (
                <div
                  key={d.id}
                  className={`rounded-2xl border p-4.5 ${URGENCY_STYLE[d.urgency]} transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-heading font-bold text-sm">
                        {d.section === "section_11" ? "Section 11 → Section 19 (12-Month Rule)" : "Section 19 → Section 23 Award (12-Month Rule)"}
                      </div>
                      <div className="text-xs opacity-75 mt-0.5 font-mono">
                        Notified: {d.notified_on} · Statutory Limit: {d.deadline_on}
                      </div>
                    </div>
                    <div className="text-right">
                      {d.is_past ? (
                        <span className="text-xs font-mono font-bold flex items-center gap-1 text-purple-700 bg-purple-100/60 px-2 py-1 rounded-lg">
                          <AlertTriangle className="h-3.5 w-3.5" /> LAPSED
                        </span>
                      ) : (
                        <div>
                          <div className="text-xl font-heading font-black">{d.days_left}</div>
                          <div className="text-[10px] opacity-75 font-mono uppercase">days remaining</div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(d.pct_elapsed, 100)}%`,
                        background:
                          d.urgency === "red"
                            ? "#EF4444"
                            : d.urgency === "amber"
                            ? "#F59E0B"
                            : d.urgency === "lapsed"
                            ? "#8B5CF6"
                            : "#10B981",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Parcels */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:border-orange-200 transition-all">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2 font-mono">
              <MapPin className="h-4 w-4 text-orange-500" />
              Demarcated Parcels ({parcels.length})
            </h2>
            {parcels.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No parcels linked yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-400 font-mono text-[10px] uppercase">
                      <th className="pb-2 font-semibold">ULPIN</th>
                      <th className="pb-2 font-semibold">Survey</th>
                      <th className="pb-2 font-semibold text-right">Area</th>
                      <th className="pb-2 font-semibold text-right">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parcels.slice(0, 8).map((p) => (
                      <tr key={p.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-2.5 font-mono text-orange-700 font-medium">{p.ulpin}</td>
                        <td className="py-2.5 text-slate-600">{p.survey_number ?? "—"}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">{p.area_hectares ? `${p.area_hectares} ha` : "—"}</td>
                        <td className={`py-2.5 text-right font-mono font-bold ${riskColor(p.risk_score)}`}>
                          {p.risk_score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parcels.length > 8 && (
                  <p className="text-[10px] text-slate-400 mt-3 text-center font-mono">
                    + {parcels.length - 8} additional parcels
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Awards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:border-orange-200 transition-all">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2 font-mono">
              <Banknote className="h-4 w-4 text-emerald-600" />
              Compensation Awards ({awards.length})
            </h2>
            {awards.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No awards declared yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-400 font-mono text-[10px] uppercase">
                      <th className="pb-2 font-semibold">ULPIN</th>
                      <th className="pb-2 font-semibold text-right">Assessed</th>
                      <th className="pb-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {awards.slice(0, 8).map((a) => (
                      <tr key={a.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-2.5 font-mono text-orange-700 font-medium">{a.ulpin ?? "—"}</td>
                        <td className="py-2.5 text-right text-slate-800 font-mono font-semibold">
                          {formatCurrency(a.total_compensation)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            a.payment_status === "disbursed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : a.payment_status === "sanctioned"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {a.payment_status ?? "pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {awards.length > 8 && (
                  <p className="text-[10px] text-slate-400 mt-3 text-center font-mono">
                    + {awards.length - 8} additional awards
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 animate-fade-in">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-5 flex items-center gap-2 font-mono">
            <History className="h-4 w-4 text-orange-500" />
            Statutory Immutable Audit Trail
          </h2>
          {auditLog.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No audit entries recorded yet</p>
          ) : (
            <div className="space-y-4">
              {auditLog.map((entry) => {
                const actionParts = entry.action.split(":");
                const actionType = actionParts[0];
                const transition = actionParts[1];
                return (
                  <div key={entry.id} className="flex items-start gap-3 text-xs border-l-2 border-orange-200 pl-4 py-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-slate-900">{actionType}</span>
                        {transition && (
                          <span className="text-orange-700 font-mono text-[11px] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                            {transition.replace("→", " → ")}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {entry.actor_email ?? "System Agent"} ({entry.actor_role ?? "automated"})
                        {" · "}
                        {new Date(entry.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                      {entry.after_state && typeof entry.after_state === "object" && (
                        <div className="text-[11px] text-slate-600 mt-1.5 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-wrap gap-x-4 gap-y-1">
                          {Object.entries(entry.after_state as Record<string, unknown>)
                            .slice(0, 4)
                            .map(([k, v]) => (
                              <span key={k}>
                                <span className="text-slate-400">{k}:</span>{" "}
                                <span className="font-bold text-slate-700">{String(v)}</span>
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
