"use client";

/**
 * BhoomiSetu — Awards Management (/awards)
 *
 * List and create compensation awards per project.
 * Role-gated: collector, state_admin, central_ministry can create.
 * Redesigned with White + Orange theme, Sora & Space Grotesk typography
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
  Sparkles,
  Scale,
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
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden animate-fade-in">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 mb-1">
                <Sparkles className="w-3 h-3 text-orange-500" />
                Statutory Determination
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
                Compensation Awards
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                RFCTLARR §26–30 — Valuation breakdown: market value + 100% solatium + 12% statutory interest.
              </p>
            </div>
          </div>
          {projectId && (
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold uppercase tracking-wider font-mono rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {showCreate ? "Close Form" : "Pass Award"}
            </button>
          )}
        </div>

        {/* Project selector */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 animate-fade-in">
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-mono uppercase">
            Select Infrastructure Corridor
          </label>
          <div className="relative">
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setShowCreate(false);
              }}
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
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 p-8 animate-fade-in">
            <Banknote className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-heading font-bold text-slate-700">Select a Project to Inspect Awards</p>
            <p className="text-xs mt-1 text-slate-400">Compensation awards are officially passed per parcel under RFCTLARR Section 26.</p>
          </div>
        )}

        {projectId && isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2.5">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-xs font-medium">Loading awards repository…</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-medium text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Failed to retrieve awards for this project
          </div>
        )}

        {projectId && !isLoading && awards.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 text-slate-400">
            <p className="font-heading font-bold text-slate-700">No Awards Declared Yet</p>
            <p className="text-xs mt-1 text-slate-400">Click &quot;Pass Award&quot; above to declare a statutory compensation award for this corridor.</p>
          </div>
        )}

        {awards.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 border-b border-slate-100 uppercase font-mono font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5">ULPIN</th>
                    <th className="p-3.5">Village</th>
                    <th className="p-3.5">Award Date</th>
                    <th className="p-3.5 text-right">Market Value</th>
                    <th className="p-3.5 text-right">Total Compensation</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {awards.map((award) => (
                    <tr key={award.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3.5 font-mono text-orange-700 font-medium">{award.ulpin}</td>
                      <td className="p-3.5 text-slate-600">{award.village ?? "—"}</td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {new Date(award.award_date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        {formatCurrency(award.market_value)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(award.total_compensation)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            award.payment_status === "disbursed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : award.payment_status === "sanctioned"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
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
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500 font-mono flex-wrap">
              <span>
                Total Awards: <strong className="text-slate-800">{awards.length}</strong>
              </span>
              <span>
                Total Assessed:{" "}
                <strong className="text-slate-900">
                  {formatCurrency(awards.reduce((sum, a) => sum + a.total_compensation, 0))}
                </strong>
              </span>
              <span>
                Disbursed:{" "}
                <strong className="text-emerald-700">
                  {awards.filter((a) => a.payment_status === "disbursed").length}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
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
        setResult({ ok: true, msg: data.message || "Award declared successfully" });
        setTimeout(onCreated, 1500);
      }
    } catch {
      setResult({ ok: false, msg: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 animate-fade-in">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono mb-4">
        Declare Statutory Compensation Award — RFCTLARR §26
      </h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Demarcated Parcel</label>
          <select
            value={parcelId}
            onChange={(e) => setParcelId(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-orange-500 font-medium text-slate-800"
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
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Declaration Date</label>
          <input
            type="date"
            value={awardDate}
            onChange={(e) => setAwardDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-orange-500 font-medium text-slate-800"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Base Market Value (₹)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={marketValue}
            onChange={(e) => setMarketValue(e.target.value)}
            placeholder="e.g. 2500000"
            required
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-orange-500 font-mono text-slate-800"
          />
          {marketValue && Number(marketValue) > 0 && (
            <div className="mt-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-xs text-slate-600 font-mono space-y-1">
              <div>Solatium (100%): <span className="font-bold text-slate-800">{formatCurrency(Number(marketValue))}</span></div>
              <div>Statutory Interest (12% p.a.): <span className="font-bold text-slate-800">{formatCurrency(Number(marketValue) * 0.12)}</span></div>
              <div className="font-bold text-orange-950 pt-1.5 border-t border-orange-200 flex justify-between">
                <span>Final Statutory Award:</span>
                <span>{formatCurrency(Number(marketValue) + Number(marketValue) + Number(marketValue) * 0.12)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-end gap-3">
          <button
            type="submit"
            disabled={submitting || !parcelId || !marketValue}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-semibold uppercase tracking-wider font-mono rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            Pass Award
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>

      {result && (
        <div
          className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            result.ok
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {result.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
          {result.msg}
        </div>
      )}
    </div>
  );
}
