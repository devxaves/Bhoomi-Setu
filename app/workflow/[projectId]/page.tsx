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
  green: "bg-green-100 text-green-700 border-green-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  red: "bg-red-100 text-red-700 border-red-200",
  lapsed: "bg-purple-100 text-purple-700 border-purple-200",
};

const RAG_DOT: Record<string, string> = {
  green: "bg-green-400",
  amber: "bg-amber-400",
  red: "bg-red-500",
  lapsed: "bg-purple-500",
};

const URGENCY_STYLE: Record<string, string> = {
  green: "bg-green-50 border-green-200 text-green-800",
  amber: "bg-amber-50 border-amber-200 text-amber-800",
  red: "bg-red-50 border-red-200 text-red-800",
  lapsed: "bg-purple-50 border-purple-200 text-purple-800",
};

function riskColor(score: number): string {
  if (score >= 70) return "text-red-600";
  if (score >= 40) return "text-amber-600";
  return "text-green-600";
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
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        <span className="ml-3 text-gray-500">Loading workflow…</span>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] text-gray-400">
        <AlertTriangle className="h-10 w-10 mb-3 text-amber-400" />
        <p className="text-lg font-semibold text-gray-600">Failed to load workflow</p>
        <p className="text-sm mt-1">{error?.message || "Project not found"}</p>
        <Link href="/workflow" className="mt-4 text-sm text-amber-600 hover:underline">
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/workflow"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{project.name}</h1>
              <p className="text-sm text-gray-500 truncate">
                {project.land_requiring_body} · {project.district}, {project.state}
              </p>
            </div>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center px-3 py-1 rounded-full text-sm font-semibold border ${RAG_BADGE[project.status_flag]}`}>
          {project.status_flag.toUpperCase()}
        </span>
      </div>

      {/* Stage Pipeline */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Statutory Pipeline — RFCTLARR Act
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {dwellDays} day{dwellDays !== 1 ? "s" : ""} in current stage
          </div>
        </div>

        {/* Pipeline bar */}
        <div className="flex items-end gap-0.5 mb-3">
          {STAGES.map((stage, idx) => {
            const info = STAGE_INFO[stage];
            const isComplete = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isFuture = idx > currentIdx;
            return (
              <div key={stage} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full h-3 rounded-sm transition-colors ${
                    isComplete
                      ? "bg-green-400"
                      : isCurrent
                      ? project.status_flag === "red"
                        ? "bg-red-500"
                        : project.status_flag === "amber"
                        ? "bg-amber-400"
                        : project.status_flag === "lapsed"
                        ? "bg-purple-500"
                        : "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
                <span
                  className={`text-[9px] mt-1 leading-tight text-center ${
                    isCurrent
                      ? "text-gray-900 font-bold"
                      : isComplete
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {info.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current stage detail */}
        <div className="bg-gray-50 rounded-xl p-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Current Stage</div>
              <div className="text-lg font-bold text-gray-900">
                {STAGE_INFO[project.current_stage].label}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                {STAGE_INFO[project.current_stage].description}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {STAGE_INFO[project.current_stage].actRef}
              </div>
            </div>
            <div className="text-right">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black ${riskColor(project.risk_score)}`}
                style={{ border: `3px solid ${project.risk_score >= 70 ? "#ef4444" : project.risk_score >= 40 ? "#f59e0b" : "#22c55e"}` }}>
                {Math.round(project.risk_score)}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Risk Score</div>
            </div>
          </div>
        </div>

        {/* Advance button */}
        {!isClosed && nextStage && (
          <div className="mt-4 pt-4 border-t">
            {advanceSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-3 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {advanceSuccess}
              </div>
            )}
            {advanceError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-3 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {advanceError}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Next: <span className="font-semibold text-gray-700">{STAGE_INFO[nextStage].label}</span>
                <span className="text-gray-400 ml-1">({STAGE_INFO[nextStage].actRef})</span>
              </div>
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Project fully completed and closed.</span>
          </div>
        )}
      </div>

      {/* Deadlines */}
      {deadlines.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Statutory Deadlines
          </h2>
          <div className="grid gap-3">
            {deadlines.map((d) => (
              <div
                key={d.id}
                className={`rounded-xl border px-4 py-3 ${URGENCY_STYLE[d.urgency]}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">
                      {d.section === "section_11" ? "Section 11 → Section 19" : "Section 19 → Award"}
                    </div>
                    <div className="text-xs opacity-75 mt-0.5">
                      Notified: {d.notified_on} · Deadline: {d.deadline_on}
                    </div>
                  </div>
                  <div className="text-right">
                    {d.is_past ? (
                      <span className="text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> LAPSED
                      </span>
                    ) : (
                      <div>
                        <div className="text-lg font-black">{d.days_left}</div>
                        <div className="text-[10px] opacity-75">days left</div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(d.pct_elapsed, 100)}%`,
                      background:
                        d.urgency === "red"
                          ? "#ef4444"
                          : d.urgency === "amber"
                          ? "#f59e0b"
                          : d.urgency === "lapsed"
                          ? "#7c3aed"
                          : "#22c55e",
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
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-500" />
            Affected Parcels ({parcels.length})
          </h2>
          {parcels.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No parcels linked yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">ULPIN</th>
                    <th className="pb-2 font-medium">Survey</th>
                    <th className="pb-2 font-medium text-right">Area</th>
                    <th className="pb-2 font-medium text-right">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {parcels.slice(0, 10).map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-amber-700">{p.ulpin}</td>
                      <td className="py-2 text-gray-600">{p.survey_number ?? "—"}</td>
                      <td className="py-2 text-right text-gray-600">{p.area_hectares ? `${p.area_hectares} ha` : "—"}</td>
                      <td className={`py-2 text-right font-bold ${riskColor(p.risk_score)}`}>
                        {p.risk_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parcels.length > 10 && (
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  + {parcels.length - 10} more parcels
                </p>
              )}
            </div>
          )}
        </div>

        {/* Awards */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-amber-500" />
            Compensation Awards ({awards.length})
          </h2>
          {awards.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No awards declared yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">ULPIN</th>
                    <th className="pb-2 font-medium text-right">Award</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {awards.slice(0, 10).map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-amber-700">{a.ulpin ?? "—"}</td>
                      <td className="py-2 text-right text-gray-700 font-medium">
                        {formatCurrency(a.total_compensation)}
                      </td>
                      <td className="py-2 text-right">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          a.payment_status === "disbursed"
                            ? "bg-green-100 text-green-700"
                            : a.payment_status === "sanctioned"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {a.payment_status ?? "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {awards.length > 10 && (
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  + {awards.length - 10} more awards
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mt-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-amber-500" />
          Audit Trail
        </h2>
        {auditLog.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No audit entries</p>
        ) : (
          <div className="space-y-3">
            {auditLog.map((entry) => {
              const actionParts = entry.action.split(":");
              const actionType = actionParts[0];
              const transition = actionParts[1]; // e.g. "proposal→sia"
              return (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{actionType}</span>
                      {transition && (
                        <span className="text-amber-600 font-mono text-xs">{transition.replace("→", " → ")}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {entry.actor_email ?? "System"} ({entry.actor_role ?? "—"})
                      {" · "}
                      {new Date(entry.created_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                    {entry.after_state && typeof entry.after_state === "object" && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.entries(entry.after_state as Record<string, unknown>)
                          .filter(([k]) => !["stage", "status_flag"].includes(k) || true)
                          .slice(0, 4)
                          .map(([k, v]) => (
                            <span key={k} className="inline-block mr-3">
                              <span className="text-gray-400">{k}:</span>{" "}
                              <span className="font-medium">{String(v)}</span>
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
  );
}
