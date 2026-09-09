"use client";

/**
 * BhoomiSetu — Compensation Disbursement (/compensation)
 *
 * Track and manage compensation payment lifecycle:
 * assessed → sanctioned → disbursed → failed
 * With mock PFMS integration on disbursement.
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
  assessed: "bg-gray-100 text-gray-600",
  sanctioned: "bg-blue-100 text-blue-700",
  disbursed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <Banknote className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compensation Disbursement</h1>
          <p className="text-sm text-gray-500">
            RFCTLARR §38(1) — DBT-based compensation lifecycle with mock PFMS integration.
          </p>
        </div>
      </div>

      {/* Project selector */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 mb-6">
        <label className="text-xs text-gray-500 mb-1 block">Select Project</label>
        <div className="relative">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none"
          >
            <option value="">— Choose a project —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.district})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Summary cards */}
      {projectId && payments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(["assessed", "sanctioned", "disbursed", "failed"] as const).map((status) => {
            const count = payments.filter((p) => p.status === status).length;
            return (
              <div key={status} className="bg-white rounded-xl border px-4 py-3 text-center">
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]} mt-1`}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Payments table */}
      {!projectId && (
        <div className="text-center py-16 text-gray-400">
          <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-semibold text-gray-500">Select a project to view payments</p>
          <p className="text-sm mt-1">Track compensation disbursement from assessment through PFMS DBT.</p>
        </div>
      )}

      {projectId && isLoading && (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading payments…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Failed to load payments
        </div>
      )}

      {projectId && !isLoading && payments.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p>No compensation payments for this project yet.</p>
          <p className="text-xs mt-1">Awards must be passed first (see /awards).</p>
        </div>
      )}

      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">ULPIN</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Owner</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Assessed</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">PFMS Ref</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const transitions = VALID_TRANSITIONS[payment.status] ?? [];
                  return (
                    <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-amber-700">{payment.ulpin ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{payment.owner_name ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(payment.amount_assessed)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[payment.status]}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 font-mono">
                        {payment.mock_pfms_ref ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
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
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center gap-6 text-xs text-gray-500">
            <span>
              Total Payments: <span className="font-semibold text-gray-700">{payments.length}</span>
            </span>
            <span>
              Assessed: <span className="font-semibold text-gray-700">{formatCurrency(totalAssessed)}</span>
            </span>
            <span>
              Disbursed: <span className="font-semibold text-green-700">{formatCurrency(totalDisbursed)}</span>
            </span>
          </div>
        </div>
      )}
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

  if (transitions.length === 0) return <span className="text-xs text-gray-400">—</span>;

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
    <div className="flex items-center gap-1 justify-center">
      {transitions.map((t) => (
        <button
          key={t}
          onClick={() => handleTransition(t)}
          disabled={updating !== null}
          title={`Mark as ${t}`}
          className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors disabled:opacity-50 ${
            t === "disbursed"
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : t === "sanctioned"
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "bg-red-100 text-red-700 hover:bg-red-200"
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
        <span className="text-[10px] text-red-500 ml-1">{error}</span>
      )}
    </div>
  );
}
