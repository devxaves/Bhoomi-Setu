"use client";

/**
 * BhoomiSetu — Compensation Disbursement (/compensation)
 *
 * Track and manage compensation payment lifecycle:
 * assessed → sanctioned → disbursed → failed
 * With mock PFMS integration on disbursement.
 * Redesigned with White + Orange theme, Sora & Space Grotesk typography
 */

import { useState } from "react";
import useSWR from "swr";
import {
  Banknote,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Send,
  XCircle,
  Sparkles,
} from "lucide-react";
import type { CompensationPayment } from "@/lib/db/queries/compensation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Project {
  id: string;
  name: string;
  district: string;
  state: string;
}

const STATUS_STYLE: Record<string, string> = {
  assessed: "bg-slate-100 text-slate-700 border-slate-200",
  sanctioned: "bg-blue-50 text-blue-700 border-blue-200",
  disbursed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  assessed: ["sanctioned"],
  sanctioned: ["disbursed", "failed"],
  disbursed: [],
  failed: [],
};

export default function CompensationPage() {
  const [projectId, setProjectId] = useState("");

  const { data: projectsData } = useSWR<{ data: Project[] }>(
    "/api/projects?limit=200",
    fetcher
  );
  const projects = projectsData?.data ?? [];

  const {
    data: paymentsData,
    isLoading,
    error,
    mutate,
  } = useSWR<{ data: CompensationPayment[] }>(
    projectId ? `/api/compensation?project_id=${projectId}` : null,
    fetcher
  );
  const payments = paymentsData?.data ?? [];

  const totalAssessed = payments.reduce((s, p) => s + p.amount_assessed, 0);
  const totalDisbursed = payments
    .filter((p) => p.status === "disbursed")
    .reduce((s, p) => s + (p.amount_disbursed ?? p.amount_assessed), 0);

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex items-center gap-4 relative overflow-hidden animate-fade-in">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 mb-1">
              <Sparkles className="w-3 h-3 text-orange-500" />
              Direct Benefit Transfer
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
              Compensation Disbursement Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              RFCTLARR §38(1) — DBT-based disbursement lifecycle linked to Public Financial Management System (PFMS).
            </p>
          </div>
        </div>

        {/* Project selector */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 animate-fade-in">
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-mono uppercase">
            Select Infrastructure Corridor
          </label>
          <div className="relative">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-3 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500 appearance-none font-medium text-slate-800"
            >
              <option value="">— Choose a corridor project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.district}, {p.state})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Summary cards */}
        {projectId && payments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
            {(["assessed", "sanctioned", "disbursed", "failed"] as const).map((status) => {
              const count = payments.filter((p) => p.status === status).length;
              return (
                <div key={status} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
                  <div className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 font-mono">{count}</div>
                  <span className={`inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[status]} mt-2 uppercase`}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!projectId && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 p-8 animate-fade-in">
            <Banknote className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-heading font-bold text-slate-700">Select a Project to Inspect Payments</p>
            <p className="text-xs mt-1 text-slate-400">Track compensation disbursement from award valuation through DBT disbursement.</p>
          </div>
        )}

        {projectId && isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2.5">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-xs font-medium">Loading payments…</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-medium text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Failed to load compensation records
          </div>
        )}

        {projectId && !isLoading && payments.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 text-slate-400">
            <p className="font-heading font-bold text-slate-700">No Compensation Records Found</p>
            <p className="text-xs mt-1 text-slate-400">Statutory awards must be declared first in the Awards console.</p>
          </div>
        )}

        {payments.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 border-b border-slate-100 uppercase font-mono font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5">ULPIN</th>
                    <th className="p-3.5">Owner Record</th>
                    <th className="p-3.5 text-right">Assessed Amount</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">PFMS Reference</th>
                    <th className="p-3.5 text-center">Lifecycle Transition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => {
                    const transitions = VALID_TRANSITIONS[payment.status] ?? [];
                    return (
                      <tr key={payment.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="p-3.5 font-mono text-orange-700 font-medium">{payment.ulpin ?? "—"}</td>
                        <td className="p-3.5 text-slate-700 font-medium">{payment.owner_name ?? "—"}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(payment.amount_assessed)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${STATUS_STYLE[payment.status]}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-xs text-slate-500 font-mono">
                          {payment.mock_pfms_ref ?? "—"}
                        </td>
                        <td className="p-3.5 text-center">
                          <PaymentActions
                            paymentId={payment.id}
                            currentStatus={payment.status}
                            transitions={transitions}
                            onUpdated={mutate}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500 font-mono flex-wrap">
              <span>
                Total Records: <strong className="text-slate-800">{payments.length}</strong>
              </span>
              <span>
                Total Assessed: <strong className="text-slate-900">{formatCurrency(totalAssessed)}</strong>
              </span>
              <span>
                Disbursed: <strong className="text-emerald-700">{formatCurrency(totalDisbursed)}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Payment Actions ────────────────────────────────────────────────────────

function PaymentActions({
  paymentId,
  currentStatus,
  transitions,
  onUpdated,
}: {
  paymentId: string;
  currentStatus: string;
  transitions: string[];
  onUpdated: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (transitions.length === 0) return <span className="text-xs text-slate-400 font-mono">—</span>;

  const handleTransition = async (newStatus: string) => {
    setUpdating(newStatus);
    setError(null);

    try {
      const res = await fetch(`/api/compensation/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Update failed");
      } else {
        onUpdated();
      }
    } catch {
      setError("Network error");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 justify-center">
      {transitions.map((t) => (
        <button
          key={t}
          onClick={() => handleTransition(t)}
          disabled={updating !== null}
          title={`Mark as ${t}`}
          className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-lg transition-all disabled:opacity-50 cursor-pointer ${
            t === "disbursed"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              : t === "sanctioned"
              ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
              : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          }`}
        >
          {updating === t ? (
            <Loader2 className="h-3 w-3 animate-spin inline" />
          ) : t === "disbursed" ? (
            <Send className="h-3 w-3 inline" />
          ) : t === "failed" ? (
            <XCircle className="h-3 w-3 inline" />
          ) : null}
          {" "}
          {t}
        </button>
      ))}
      {error && (
        <span className="text-[10px] text-red-500 font-mono ml-1">{error}</span>
      )}
    </div>
  );
}
