"use client";

/**
 * BhoomiSetu — Awards Management (/awards)
 *
 * List and create compensation awards per project.
 * Role-gated: collector, state_admin, central_ministry can create.
 */

import { useState } from "react";
import useSWR from "swr";
import {
  Banknote,
  Plus,
  Loader2,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import type { Award } from "@/lib/db/queries/awards";

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

export default function AwardsPage() {
  const [projectId, setProjectId] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: projectsData } = useSWR<{ data: Project[] }>(
    "/api/projects?limit=200",
    fetcher
  );
  const projects = projectsData?.data ?? [];

  const {
    data: awardsData,
    isLoading,
    error,
    mutate,
  } = useSWR<{ data: Award[] }>(
    projectId ? `/api/awards?project_id=${projectId}` : null,
    fetcher
  );
  const awards = awardsData?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
          <Banknote className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Compensation Awards</h1>
          <p className="text-sm text-gray-500">
            RFCTLARR §26/30 — Award declarations with statutory compensation calculation.
          </p>
        </div>
        {projectId && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Pass Award
          </button>
        )}
      </div>

      {/* Project selector */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 mb-6">
        <label className="text-xs text-gray-500 mb-1 block">Select Project</label>
        <div className="relative">
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setShowCreate(false);
            }}
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

      {/* Create award form */}
      {showCreate && projectId && (
        <CreateAwardForm
          projectId={projectId}
          onCreated={() => {
            setShowCreate(false);
            mutate();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Awards list */}
      {!projectId && (
        <div className="text-center py-16 text-gray-400">
          <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-semibold text-gray-500">Select a project to view awards</p>
          <p className="text-sm mt-1">Compensation awards are declared per parcel under RFCTLARR §26.</p>
        </div>
      )}

      {projectId && isLoading && (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading awards…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Failed to load awards
        </div>
      )}

      {projectId && !isLoading && awards.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p>No awards declared for this project yet.</p>
        </div>
      )}

      {awards.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">ULPIN</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Village</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Award Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Market Value</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Total Compensation</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">Payment</th>
                </tr>
              </thead>
              <tbody>
                {awards.map((award) => (
                  <tr key={award.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-amber-700">{award.ulpin}</td>
                    <td className="px-4 py-3 text-gray-600">{award.village ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(award.award_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(award.market_value)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(award.total_compensation)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          award.payment_status === "disbursed"
                            ? "bg-green-100 text-green-700"
                            : award.payment_status === "sanctioned"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {award.payment_status ?? "assessed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center gap-6 text-xs text-gray-500">
            <span>
              Total Awards: <span className="font-semibold text-gray-700">{awards.length}</span>
            </span>
            <span>
              Total Compensation:{" "}
              <span className="font-semibold text-gray-700">
                {formatCurrency(awards.reduce((sum, a) => sum + a.total_compensation, 0))}
              </span>
            </span>
            <span>
              Disbursed:{" "}
              <span className="font-semibold text-green-700">
                {awards.filter((a) => a.payment_status === "disbursed").length}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Award Form ──────────────────────────────────────────────────────

function CreateAwardForm({
  projectId,
  onCreated,
  onCancel,
}: {
  projectId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [parcelId, setParcelId] = useState("");
  const [awardDate, setAwardDate] = useState(new Date().toISOString().slice(0, 10));
  const [marketValue, setMarketValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const { data: parcelsData } = useSWR<{ data: { id: string; ulpin: string; survey_number: string | null; village: string | null }[] }>(
    `/api/parcels?project_id=${projectId}`,
    fetcher
  );
  const parcels = parcelsData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcelId || !marketValue) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          parcel_id: parcelId,
          award_date: awardDate,
          market_value: Number(marketValue),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ ok: false, msg: data.error || "Failed to create award" });
      } else {
        setResult({ ok: true, msg: data.message || "Award created successfully" });
        setTimeout(onCreated, 1500);
      }
    } catch {
      setResult({ ok: false, msg: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
        Pass Compensation Award — RFCTLARR §26
      </h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Parcel</label>
          <select
            value={parcelId}
            onChange={(e) => setParcelId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">— Select parcel —</option>
            {parcels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.ulpin} {p.survey_number ? `(${p.survey_number})` : ""} {p.village ? `— ${p.village}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Award Date</label>
          <input
            type="date"
            value={awardDate}
            onChange={(e) => setAwardDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Market Value (₹)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={marketValue}
            onChange={(e) => setMarketValue(e.target.value)}
            placeholder="e.g. 2500000"
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {marketValue && Number(marketValue) > 0 && (
            <div className="mt-2 text-xs text-gray-500 space-y-0.5">
              <div>Solatium (100%): <span className="font-medium">{formatCurrency(Number(marketValue))}</span></div>
              <div>Additional 12%: <span className="font-medium">{formatCurrency(Number(marketValue) * 0.12)}</span></div>
              <div className="font-semibold text-gray-700 pt-1 border-t">
                Total: {formatCurrency(Number(marketValue) + Number(marketValue) + Number(marketValue) * 0.12)}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={submitting || !parcelId || !marketValue}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            Pass Award
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {result && (
        <div
          className={`mt-4 px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
            result.ok
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {result.msg}
        </div>
      )}
    </div>
  );
}
