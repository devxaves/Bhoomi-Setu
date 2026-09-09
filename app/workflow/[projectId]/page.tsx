"use client";

/**
 * BhoomiSetu — Statutory Workflow & Operations Hub (/workflow/[projectId])
 *
 * Comprehensive command console for RFCTLARR Act lifecycle:
 * Tab 1: Statutory Pipeline (10-stage state machine, deadline countdowns, RAG alerts, audit log)
 * Tab 2: Awards & Compensation (RFCTLARR §26/30 formula breakdown, mock PFMS DBT disbursement)
 * Tab 3: Mutation Tracking (distinct revenue records title transfer, separate from physical possession)
 * Tab 4: Per-Family R&R Tracking (affected families, individual status, rollup to risk engine)
 */

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileText,
  ChevronRight,
  Info,
  Loader2,
  RefreshCw,
  Lock,
  Layers,
  Banknote,
  Landmark,
  Users,
  Building2,
  MapPin,
  Calendar,
  Calculator,
  PlusCircle,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import {
  STAGES,
  STAGE_INFO,
  canAdvanceStage,
  formatCountdown,
  computeUrgency,
  type Stage,
} from "@/lib/workflow";
import { calculateAwardBreakdown } from "@/lib/statutory-math";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  land_requiring_body: string;
  district: string;
  state: string;
  project_type: string | null;
  current_stage: Stage;
  stage_started_at: string;
  status_flag: "green" | "amber" | "red" | "lapsed";
  risk_score: number;
}

interface Notification {
  id: string;
  section: "section_11" | "section_19";
  notified_on: string;
  deadline_on: string;
}

interface AuditEntry {
  id: string;
  action: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  created_at: string;
}

interface UserProfile {
  id: string;
  role: string;
  email: string;
  jurisdiction: string | null;
}

interface Award {
  id: string;
  project_id: string;
  parcel_id: string;
  award_date: string;
  market_value: number;
  solatium_pct: number;
  additional_amount_pct: number;
  total_compensation: number;
  ulpin?: string;
  survey_number?: string;
  village?: string;
  payment_status?: string;
  amount_disbursed?: number;
  mock_pfms_ref?: string | null;
}

interface CompensationPayment {
  id: string;
  award_id: string;
  amount_assessed: number;
  amount_disbursed: number;
  status: "assessed" | "sanctioned" | "disbursed" | "failed";
  disbursed_on: string | null;
  mock_pfms_ref: string | null;
  ulpin?: string;
  survey_number?: string;
  village?: string;
  owner_name?: string | null;
  bank_ref?: string | null;
}

interface MutationRecord {
  id: string;
  parcel_id: string;
  mutation_status: "pending" | "filed" | "completed";
  filed_on: string | null;
  completed_on: string | null;
  ulpin?: string;
  survey_number?: string;
  village?: string;
  area_hectares?: number;
}

interface MutationMetrics {
  totalParcels: number;
  completedCount: number;
  filedCount: number;
  pendingCount: number;
  mutationCompletionPct: number;
  lagCount: number;
}

interface AffectedFamily {
  id: string;
  parcel_id: string;
  family_ref: string;
  displaced: boolean;
  compensation_status: "pending" | "assessed" | "sanctioned" | "disbursed";
  housing_status: "pending" | "allotted" | "completed";
  employment_status: "pending" | "offered" | "completed";
  livelihood_restored: boolean;
  ulpin?: string;
  survey_number?: string;
  village?: string;
}

interface RRRollupSummary {
  totalFamilies: number;
  restoredFamilies: number;
  pendingFamilies: number;
  completionPct: number;
  incompletenessPct: number;
  displacedCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const RAG_STYLES: Record<string, { badge: string; bar: string; bg: string }> = {
  green: { badge: "bg-green-100 text-green-700 border-green-200", bar: "bg-green-500", bg: "bg-green-50 border-green-200" },
  amber: { badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-500", bg: "bg-amber-50 border-amber-200" },
  red: { badge: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-500", bg: "bg-red-50 border-red-200" },
  lapsed: { badge: "bg-purple-100 text-purple-700 border-purple-200", bar: "bg-purple-500", bg: "bg-purple-50 border-purple-200" },
};

function RAGBadge({ flag, className = "" }: { flag: string; className?: string }) {
  const s = RAG_STYLES[flag] ?? RAG_STYLES.green;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.badge} ${className}`}>
      {flag.toUpperCase()}
    </span>
  );
}

function DeadlineCard({ notif }: { notif: Notification }) {
  const { daysLeft, label, isPast } = formatCountdown(notif.deadline_on);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notifiedDate = new Date(notif.notified_on);
  const deadlineDate = new Date(notif.deadline_on);
  const totalDays = Math.max(1, Math.ceil((deadlineDate.getTime() - notifiedDate.getTime()) / 86400000));
  const elapsedDays = Math.max(0, Math.ceil((today.getTime() - notifiedDate.getTime()) / 86400000));
  const pct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  const urgency = computeUrgency(pct, isPast);
  const s = RAG_STYLES[urgency];

  return (
    <div className={`rounded-xl border p-4 ${s.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
            {notif.section === "section_11" ? "Section 11 Preliminary Notification" : "Section 19 Declaration"}
          </span>
          <div className="text-xs text-gray-400">
            Notified: {new Date(notif.notified_on).toLocaleDateString("en-IN")}
          </div>
        </div>
        <RAGBadge flag={urgency} />
      </div>

      <div className="h-2 bg-white/70 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{pct}% of statutory window</span>
        <span className={`font-semibold ${isPast ? "text-purple-700" : urgency === "red" ? "text-red-700" : urgency === "amber" ? "text-amber-700" : "text-green-700"}`}>
          {label}
        </span>
      </div>

      <div className="mt-1.5 text-xs text-gray-400">
        Deadline: {new Date(notif.deadline_on).toLocaleDateString("en-IN")} · {totalDays} day window
      </div>

      {isPast && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-700 bg-purple-100/50 rounded px-2 py-1">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Statutory window lapsed. Re-notification is required under RFCTLARR §19/25.
        </div>
      )}
    </div>
  );
}

// ── Main Workflow Page Component ───────────────────────────────────────────────

export default function ProjectWorkflowPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  // Active Tab: 'pipeline' | 'awards' | 'mutations' | 'rr'
  const [activeTab, setActiveTab] = useState<"pipeline" | "awards" | "mutations" | "rr">("pipeline");

  // Project & Data Fetching
  const { data: projData, mutate: mutateProject } = useSWR<{ success: boolean; data: Project }>(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher
  );
  const project = projData?.data;

  const { data: userProfile } = useSWR<UserProfile>("/api/me", fetcher);
  const userRole = userProfile?.role || "collector";
  const canAct = canAdvanceStage(userRole);

  const { data: notifData } = useSWR<{ success: boolean; data: Notification[] }>(
    projectId ? `/api/notifications?project_id=${projectId}` : null,
    fetcher
  );
  const notifications = notifData?.data ?? [];

  const { data: auditData, mutate: mutateAudit } = useSWR<{ success: boolean; data: AuditEntry[] }>(
    projectId ? `/api/audit?entity_id=${projectId}` : null,
    fetcher
  );
  const auditEntries = auditData?.data ?? [];

  const { data: parcelsData } = useSWR<{ success: boolean; data: any[] }>(
    projectId ? `/api/parcels?project_id=${projectId}` : null,
    fetcher
  );
  const parcels = parcelsData?.data ?? [];

  // Awards & Compensation Data
  const { data: awardsData, mutate: mutateAwards } = useSWR<{ success: boolean; data: Award[] }>(
    projectId ? `/api/awards?project_id=${projectId}` : null,
    fetcher
  );
  const awards = awardsData?.data ?? [];

  const { data: compData, mutate: mutateComp } = useSWR<{ success: boolean; data: CompensationPayment[] }>(
    projectId ? `/api/compensation?project_id=${projectId}` : null,
    fetcher
  );
  const payments = compData?.data ?? [];

  // Mutations Data
  const { data: mutData, mutate: mutateMutations } = useSWR<{
    success: boolean;
    data: MutationRecord[];
    metrics: MutationMetrics;
  }>(projectId ? `/api/mutations?project_id=${projectId}` : null, fetcher);
  const mutations = mutData?.data ?? [];
  const mutationMetrics = mutData?.metrics;

  // Affected Families Data
  const { data: famData, mutate: mutateFamilies } = useSWR<{
    success: boolean;
    data: AffectedFamily[];
    rollup: RRRollupSummary;
  }>(projectId ? `/api/affected-families?project_id=${projectId}` : null, fetcher);
  const families = famData?.data ?? [];
  const rrRollup = famData?.rollup;

  // ── Action State ────────────────────────────────────────────────────────────
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  // Award Form State
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardParcelId, setAwardParcelId] = useState("");
  const [awardMarketValue, setAwardMarketValue] = useState("2500000");
  const [awardSolatiumPct, setAwardSolatiumPct] = useState("100");
  const [awardAddlPct, setAwardAddlPct] = useState("12");
  const [submittingAward, setSubmittingAward] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Calculated award breakdown preview
  const awardBreakdown = useMemo(() => {
    const mv = parseFloat(awardMarketValue) || 0;
    const sol = parseFloat(awardSolatiumPct) || 100;
    const addl = parseFloat(awardAddlPct) || 12;
    return calculateAwardBreakdown(mv, sol, addl);
  }, [awardMarketValue, awardSolatiumPct, awardAddlPct]);

  // Stage Advance
  const handleAdvance = async (toStage: Stage) => {
    setAdvancing(true);
    setAdvanceError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/advance-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage, role: userRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdvanceError(data.error ?? "Failed to advance stage.");
      } else {
        mutateProject();
        mutateAudit();
      }
    } catch {
      setAdvanceError("Network error while advancing stage.");
    } finally {
      setAdvancing(false);
    }
  };

  // Create Award Submit
  const handleCreateAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardParcelId) {
      setActionFeedback("Please select a parcel for the award.");
      return;
    }
    setSubmittingAward(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          parcel_id: awardParcelId,
          award_date: new Date().toISOString().split("T")[0],
          market_value: parseFloat(awardMarketValue),
          solatium_pct: parseFloat(awardSolatiumPct),
          additional_amount_pct: parseFloat(awardAddlPct),
          role: userRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionFeedback(data.error || "Failed to create award.");
      } else {
        setActionFeedback(`Award created! Total compensation assessed: ₹${data.breakdown.totalCompensation.toLocaleString("en-IN")}`);
        setShowAwardModal(false);
        mutateAwards();
        mutateComp();
        mutateAudit();
      }
    } catch {
      setActionFeedback("Error submitting award.");
    } finally {
      setSubmittingAward(false);
    }
  };

  // Compensation Transition
  const handlePaymentTransition = async (paymentId: string, status: "sanctioned" | "disbursed" | "failed") => {
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/compensation/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, role: userRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionFeedback(data.error || "Failed to update payment.");
      } else {
        setActionFeedback(data.message);
        mutateComp();
        mutateAwards();
        mutateAudit();
      }
    } catch {
      setActionFeedback("Payment transition failed.");
    }
  };

  // Mutation Status Update
  const handleMutationUpdate = async (parcelId: string, status: "pending" | "filed" | "completed") => {
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/mutations/${parcelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, role: userRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionFeedback(data.error || "Failed to update mutation.");
      } else {
        setActionFeedback(data.message);
        mutateMutations();
        mutateAudit();
      }
    } catch {
      setActionFeedback("Mutation update failed.");
    }
  };

  // Affected Family Update
  const handleFamilyUpdate = async (familyId: string, updates: Partial<AffectedFamily>) => {
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/affected-families/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, role: userRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionFeedback(data.error || "Failed to update family.");
      } else {
        setActionFeedback(data.message);
        mutateFamilies();
        mutateAudit();
      }
    } catch {
      setActionFeedback("Family update failed.");
    }
  };

  if (!project) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const currentIdx = STAGES.indexOf(project.current_stage);
  const nextStage = STAGES[currentIdx + 1] as Stage | undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Project Header ──────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {project.project_type || "Infrastructure"}
              </span>
              <RAGBadge flag={project.status_flag} />
              <span className="text-xs text-slate-400">ID: {project.id.slice(0, 8)}…</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{project.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {project.land_requiring_body} · {project.district}, {project.state}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Risk Score</div>
              <div className="text-sm font-extrabold text-slate-800">{Number(project.risk_score ?? 0).toFixed(1)}/100</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Current Stage</div>
              <div className="text-sm font-bold text-amber-700 capitalize">{STAGE_INFO[project.current_stage].label}</div>
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionFeedback && (
          <div className="max-w-7xl mx-auto mt-3">
            <div className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-between">
              <span>{actionFeedback}</span>
              <button onClick={() => setActionFeedback(null)} className="font-bold text-blue-500 hover:text-blue-700">✕</button>
            </div>
          </div>
        )}

        {/* ── Navigation Tabs ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-1 border-b border-slate-200">
          {[
            { id: "pipeline", label: "Statutory Pipeline (10-Stage)", icon: <Layers className="h-4 w-4" /> },
            { id: "awards", label: `Awards & PFMS Compensation (${awards.length})`, icon: <Banknote className="h-4 w-4" /> },
            { id: "mutations", label: `Revenue Mutation (${mutationMetrics?.mutationCompletionPct ?? 0}%)`, icon: <Landmark className="h-4 w-4" /> },
            { id: "rr", label: `Per-Family R&R (${rrRollup?.completionPct ?? 0}%)`, icon: <Users className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-amber-600 text-amber-700 bg-amber-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Tab Content ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 1: Statutory Pipeline (10-Stage State Machine)            */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "pipeline" && (
          <div className="space-y-6">
            {/* 10-Stage Pipeline Node Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="relative z-10 flex items-start justify-between gap-1 overflow-x-auto pb-2">
                {STAGES.map((stage, idx) => {
                  const info = STAGE_INFO[stage];
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={stage} className="flex flex-col items-center gap-1.5 min-w-[90px] max-w-[100px]">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted
                            ? "bg-green-500 border-green-500 text-white shadow"
                            : isCurrent
                            ? "bg-amber-500 border-amber-500 text-white shadow-lg ring-4 ring-amber-200 animate-pulse"
                            : "bg-white border-slate-300 text-slate-400"
                        }`}
                        title={info.description}
                      >
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <span className={`text-[11px] font-semibold text-center leading-tight ${isCurrent ? "text-amber-700 font-bold" : isCompleted ? "text-green-700" : "text-slate-500"}`}>
                        {info.label}
                      </span>
                      <span className="text-[9px] text-slate-400">{info.actRef}</span>
                    </div>
                  );
                })}
              </div>

              {/* Stage Advance Action Box */}
              {nextStage && (
                <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Next Statutory Transition:</div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{STAGE_INFO[project.current_stage].label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <span className="text-amber-700 capitalize font-bold">{STAGE_INFO[nextStage].label}</span>
                      <span className="text-xs text-slate-400 font-normal">({STAGE_INFO[nextStage].actRef})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdvance(nextStage)}
                    disabled={advancing || !canAct}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {advancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                    Advance to {STAGE_INFO[nextStage].label}
                  </button>
                </div>
              )}

              {advanceError && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  ⚠️ {advanceError}
                </div>
              )}
            </div>

            {/* Deadlines & Audit Trail Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Statutory Deadline Cards */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Statutory 12-Month Notification Windows
                </h3>
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400">No Section 11 or Section 19 notifications issued yet.</p>
                ) : (
                  notifications.map((n) => <DeadlineCard key={n.id} notif={n} />)
                )}
              </div>

              {/* Audit Trail */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  Statutory Audit Trail (audit_log)
                </h3>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {auditEntries.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No audit entries recorded for this project.</p>
                  ) : (
                    auditEntries.map((e) => (
                      <div key={e.id} className="py-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{e.action}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(e.created_at).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 2: Awards & Compensation (PFMS Disbursement)              */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "awards" && (
          <div className="space-y-6">
            {/* Section Header & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Compensation Awards & PFMS DBT Disbursement
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  RFCTLARR Act §26/§30 statutory compensation formula + Public Financial Management System direct benefit transfer
                </p>
              </div>

              <button
                onClick={() => setShowAwardModal(true)}
                disabled={!canAct}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Declare New Award (§23/§26/§30)
              </button>
            </div>

            {/* Compensation Payments Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Compensation Disbursement Pipeline (assessed → sanctioned → disbursed)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-3">Parcel / ULPIN</th>
                      <th className="p-3">Landowner / Bank</th>
                      <th className="p-3">Assessed Amount</th>
                      <th className="p-3">Disbursed Amount</th>
                      <th className="p-3">PFMS Reference</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No compensation awards or payments created for this project yet. Declare an award above to initiate.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-semibold text-slate-900">
                            <div>{p.ulpin ? `ULPIN: ${p.ulpin}` : `Survey ${p.survey_number || "N/A"}`}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{p.village || "N/A"}</div>
                          </td>
                          <td className="p-3 text-slate-700">
                            <div className="font-medium">{p.owner_name || "Beneficiary Landowner"}</div>
                            <div className="text-[10px] text-slate-400">A/C: {p.bank_ref || "****5678"}</div>
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            ₹{Number(p.amount_assessed).toLocaleString("en-IN")}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            ₹{Number(p.amount_disbursed).toLocaleString("en-IN")}
                          </td>
                          <td className="p-3">
                            {p.mock_pfms_ref ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Check className="h-3 w-3" />
                                {p.mock_pfms_ref}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">Pending PFMS</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.status === "disbursed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : p.status === "sanctioned"
                                  ? "bg-blue-100 text-blue-800"
                                  : p.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {p.status === "assessed" && (
                              <button
                                onClick={() => handlePaymentTransition(p.id, "sanctioned")}
                                disabled={!canAct}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-all disabled:opacity-50"
                              >
                                Sanction Payment
                              </button>
                            )}
                            {p.status === "sanctioned" && (
                              <button
                                onClick={() => handlePaymentTransition(p.id, "disbursed")}
                                disabled={!canAct}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1 ml-auto"
                              >
                                <Landmark className="h-3 w-3" />
                                Disburse via PFMS
                              </button>
                            )}
                            {p.status === "failed" && (
                              <button
                                onClick={() => handlePaymentTransition(p.id, "sanctioned")}
                                disabled={!canAct}
                                className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs transition-all disabled:opacity-50"
                              >
                                Retry Sanction
                              </button>
                            )}
                            {p.status === "disbursed" && (
                              <span className="text-[10px] text-emerald-700 font-bold">Paid on {p.disbursed_on || "Today"}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Award Creation Modal / Form */}
            {showAwardModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-amber-600" />
                      <h3 className="font-bold text-slate-900 text-base">Pass Statutory Award (RFCTLARR §23/§26/§30)</h3>
                    </div>
                    <button onClick={() => setShowAwardModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                  </div>

                  <form onSubmit={handleCreateAward} className="mt-4 space-y-4">
                    {/* Parcel Selector */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Target Land Parcel *</label>
                      <select
                        value={awardParcelId}
                        onChange={(e) => setAwardParcelId(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">-- Select Demarcated Parcel --</option>
                        {parcels.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.ulpin ? `ULPIN: ${p.ulpin}` : `Survey: ${p.survey_number}`} ({p.village || "Unknown"}, {p.area_hectares} ha)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Valuation Inputs */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Base Market Value (₹)</label>
                        <input
                          type="number"
                          value={awardMarketValue}
                          onChange={(e) => setAwardMarketValue(e.target.value)}
                          required
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Solatium (§30) %</label>
                        <input
                          type="number"
                          value={awardSolatiumPct}
                          onChange={(e) => setAwardSolatiumPct(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Additional Amt (§26) %</label>
                        <input
                          type="number"
                          value={awardAddlPct}
                          onChange={(e) => setAwardAddlPct(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    {/* Live Calculation Breakdown Display */}
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                      <div className="font-bold text-amber-950 uppercase tracking-wide text-[10px] mb-1">
                        Statutory Compensation Breakdown
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Base Market Value:</span>
                        <span className="font-mono font-semibold">₹{awardBreakdown.marketValue.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>+ 100% Solatium (RFCTLARR §30):</span>
                        <span className="font-mono font-semibold text-amber-800">+ ₹{awardBreakdown.solatiumAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>+ 12% Additional Amount (RFCTLARR §26(2)):</span>
                        <span className="font-mono font-semibold text-amber-800">+ ₹{awardBreakdown.additionalAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="border-t border-amber-200 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                        <span>Total Assessed Compensation:</span>
                        <span className="font-mono text-emerald-700">₹{awardBreakdown.totalCompensation.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAwardModal(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingAward}
                        className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                      >
                        {submittingAward ? "Passing Award…" : "Issue Award & Create Payment"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 3: Revenue Title Mutation Tracking                         */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "mutations" && (
          <div className="space-y-6">
            {/* Critical Institutional Header on Mutation Separation */}
            <div className="p-5 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <Landmark className="h-6 w-6 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-blue-900">
                    Statutory Separation: Revenue Title Mutation vs. Physical Possession
                  </h3>
                  <p className="text-xs text-blue-800 leading-relaxed mt-1">
                    Under Indian Land Revenue Codes (e.g. Maharashtra Land Revenue Code, Karnataka Land Revenue Act), taking
                    physical possession under RFCTLARR §38 does <strong>not</strong> transfer title in revenue records (7/12 extract / Record of Rights).
                    Nationally, mutation frequently lags behind physical possession by years. BhoomiSetu tracks mutation status
                    as an explicit, independent legal stage (pending → filed → completed) to eliminate revenue ghosting and post-acquisition disputes.
                  </p>
                </div>
              </div>
            </div>

            {/* Mutation Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Total Demarcated</div>
                <div className="text-lg font-extrabold text-slate-900">{mutationMetrics?.totalParcels ?? parcels.length}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-semibold text-emerald-600">Mutations Completed</div>
                <div className="text-lg font-extrabold text-emerald-700">{mutationMetrics?.completedCount ?? 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-semibold text-blue-600">In Tehsil (Filed)</div>
                <div className="text-lg font-extrabold text-blue-700">{mutationMetrics?.filedCount ?? 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Pending Filing</div>
                <div className="text-lg font-extrabold text-slate-700">{mutationMetrics?.pendingCount ?? 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-semibold text-purple-600">Possession Mutation Lag</div>
                <div className="text-lg font-extrabold text-purple-700">{mutationMetrics?.lagCount ?? 0} parcels</div>
              </div>
            </div>

            {/* Mutations Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Parcel Revenue Title Mutation Register
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-3">Parcel ULPIN / Survey</th>
                      <th className="p-3">Village / Area</th>
                      <th className="p-3">Possession Stage</th>
                      <th className="p-3">Mutation Status</th>
                      <th className="p-3">Filed Date</th>
                      <th className="p-3">Completed Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mutations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No parcels demarcated for mutation tracking yet.
                        </td>
                      </tr>
                    ) : (
                      mutations.map((m) => {
                        const inPossession = ["possession", "rr", "closed"].includes(project.current_stage);
                        const hasLag = inPossession && m.mutation_status !== "completed";

                        return (
                          <tr key={m.parcel_id} className="hover:bg-slate-50/60">
                            <td className="p-3 font-semibold text-slate-900">
                              <div>{m.ulpin ? `ULPIN: ${m.ulpin}` : `Survey ${m.survey_number}`}</div>
                            </td>
                            <td className="p-3 text-slate-600">
                              <div>{m.village || "N/A"}</div>
                              <div className="text-[10px] text-slate-400">{m.area_hectares} ha</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inPossession ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600"}`}>
                                {inPossession ? "Possessed (§38)" : "Pre-Possession"}
                              </span>
                              {hasLag && (
                                <div className="text-[9px] font-bold text-red-600 mt-0.5">⚠️ Title Lag Active</div>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  m.mutation_status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : m.mutation_status === "filed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {m.mutation_status}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600">{m.filed_on || "—"}</td>
                            <td className="p-3 font-mono text-[11px] text-slate-600">{m.completed_on || "—"}</td>
                            <td className="p-3 text-right">
                              {m.mutation_status === "pending" && (
                                <button
                                  onClick={() => handleMutationUpdate(m.parcel_id, "filed")}
                                  disabled={!canAct}
                                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-all disabled:opacity-50"
                                >
                                  Mark Filed in Tehsil
                                </button>
                              )}
                              {m.mutation_status === "filed" && (
                                <button
                                  onClick={() => handleMutationUpdate(m.parcel_id, "completed")}
                                  disabled={!canAct}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all disabled:opacity-50"
                                >
                                  Mark Completed
                                </button>
                              )}
                              {m.mutation_status === "completed" && (
                                <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                                  <Check className="h-3 w-3" /> Title Transferred
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 4: Per-Family R&R Tracking                                */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "rr" && (
          <div className="space-y-6">
            {/* Project Rollup Summary Card (Feeds Risk Engine Rule 5) */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Project R&R Resettlement Completion Rollup
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Individual affected family entitlements rolling up into the official RFCTLARR Chapter V compliance score
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-700">Restored Livelihoods</div>
                    <div className="text-lg font-black text-emerald-700">
                      {rrRollup?.restoredFamilies ?? 0} / {rrRollup?.totalFamilies ?? 0} ({rrRollup?.completionPct ?? 0}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${rrRollup?.completionPct ?? 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>0% (High Risk)</span>
                  <span>Direct input to Risk Engine Rule 5 (Incompleteness Penalty: {rrRollup?.incompletenessPct ?? 0}%)</span>
                  <span>100% (Compliant)</span>
                </div>
              </div>
            </div>

            {/* Affected Families Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Individual Affected Families Register
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  Editable per-family records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-3">Family Reference</th>
                      <th className="p-3">Parcel / Village</th>
                      <th className="p-3">Displaced</th>
                      <th className="p-3">Compensation</th>
                      <th className="p-3">Housing Allotment</th>
                      <th className="p-3">Employment</th>
                      <th className="p-3">Livelihood Restored</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {families.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No affected families recorded under this project corridor.
                        </td>
                      </tr>
                    ) : (
                      families.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-slate-900">{f.family_ref}</td>
                          <td className="p-3 text-slate-600">
                            <div>{f.ulpin ? `ULPIN: ${f.ulpin}` : `Survey ${f.survey_number}`}</div>
                            <div className="text-[10px] text-slate-400">{f.village}</div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                f.displaced ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {f.displaced ? "Displaced" : "Non-Displaced"}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={f.compensation_status}
                              onChange={(e) => handleFamilyUpdate(f.id, { compensation_status: e.target.value as any })}
                              disabled={!canAct}
                              className="px-2 py-1 rounded text-[11px] border border-slate-300 bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="assessed">Assessed</option>
                              <option value="sanctioned">Sanctioned</option>
                              <option value="disbursed">Disbursed</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              value={f.housing_status}
                              onChange={(e) => handleFamilyUpdate(f.id, { housing_status: e.target.value as any })}
                              disabled={!canAct}
                              className="px-2 py-1 rounded text-[11px] border border-slate-300 bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="allotted">Allotted</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              value={f.employment_status}
                              onChange={(e) => handleFamilyUpdate(f.id, { employment_status: e.target.value as any })}
                              disabled={!canAct}
                              className="px-2 py-1 rounded text-[11px] border border-slate-300 bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="offered">Offered</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleFamilyUpdate(f.id, { livelihood_restored: !f.livelihood_restored })}
                              disabled={!canAct}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                                f.livelihood_restored
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300"
                              }`}
                            >
                              {f.livelihood_restored ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              {f.livelihood_restored ? "Restored" : "Pending"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
