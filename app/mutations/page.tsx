"use client";

/**
 * BhoomiSetu — Mutation Tracking (/mutations)
 *
 * Track revenue record title transfer (mutation) status per parcel.
 * pending → filed → completed
 * Most commonly delayed stage in Indian land acquisition.
 * Redesigned with White + Orange theme, Sora & Space Grotesk typography
 */

import { useState } from "react";
import useSWR from "swr";
import {
  FileText,
  Loader2,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Landmark,
} from "lucide-react";
import type { Mutation, MutationMetrics } from "@/lib/db/queries/mutations";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Project {
  id: string;
  name: string;
  district: string;
  state: string;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  filed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  filed: <Send className="h-3 w-3" />,
  completed: <CheckCircle2 className="h-3 w-3" />,
};

export default function MutationsPage() {
  const [projectId, setProjectId] = useState("");

  const { data: projectsData } = useSWR<{ data: Project[] }>(
    "/api/projects?limit=200",
    fetcher
  );
  const projects = projectsData?.data ?? [];

  const {
    data: mutationsData,
    isLoading,
    error,
    mutate,
  } = useSWR<{ data: Mutation[]; metrics: MutationMetrics }>(
    projectId ? `/api/mutations?project_id=${projectId}` : null,
    fetcher
  );
  const mutations = mutationsData?.data ?? [];
  const metrics = mutationsData?.metrics;

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex items-center gap-4 relative overflow-hidden animate-fade-in">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 mb-1">
              <Sparkles className="w-3 h-3 text-orange-500" />
              State Land Records Modernisation
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
              Revenue Title Mutations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              State Land Revenue Act — Title transfer tracking (7/12 extract / RoR). Surfaces the physical possession vs title lag.
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

        {/* Metrics cards */}
        {projectId && metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-center">
              <div className="text-2xl font-heading font-bold text-slate-900 font-mono">{metrics.totalParcels}</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Total Parcels</div>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 text-center">
              <div className="text-2xl font-heading font-bold text-emerald-700 font-mono">{metrics.completedCount}</div>
              <div className="text-xs text-emerald-600 mt-1 font-mono">Mutated (RoR)</div>
            </div>
            <div className="bg-white rounded-2xl border border-blue-200/80 p-4 text-center">
              <div className="text-2xl font-heading font-bold text-blue-700 font-mono">{metrics.filedCount}</div>
              <div className="text-xs text-blue-600 mt-1 font-mono">Filed in Tehsil</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-center">
              <div className="text-2xl font-heading font-bold text-slate-600 font-mono">{metrics.pendingCount}</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Pre-Mutation</div>
            </div>
            <div className={`rounded-2xl border p-4 text-center ${metrics.lagCount > 0 ? "bg-red-50/70 border-red-200" : "bg-emerald-50/70 border-emerald-200"}`}>
              <div className={`text-2xl font-heading font-bold font-mono ${metrics.lagCount > 0 ? "text-red-700" : "text-emerald-700"}`}>
                {metrics.lagCount}
              </div>
              <div className="text-xs mt-1 font-bold text-slate-700">Mutation Lag</div>
              <div className="text-[10px] text-slate-400 font-mono">Possessed w/o title</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!projectId && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 p-8 animate-fade-in">
            <Landmark className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-heading font-bold text-slate-700">Select a Project to Track Mutations</p>
            <p className="text-xs mt-1 text-slate-400">Track statutory revenue record title updates and eliminate title ghosting.</p>
          </div>
        )}

        {projectId && isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2.5">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-xs font-medium">Loading mutation registers…</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-medium text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Failed to retrieve mutation records
          </div>
        )}

        {projectId && !isLoading && mutations.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 text-slate-400">
            <p className="font-heading font-bold text-slate-700">No Mutation Records for this Project</p>
            <p className="text-xs mt-1 text-slate-400">Mutation registers are automatically created when parcels are demarcated.</p>
          </div>
        )}

        {mutations.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 border-b border-slate-100 uppercase font-mono font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5">ULPIN</th>
                    <th className="p-3.5">Survey No.</th>
                    <th className="p-3.5">Village</th>
                    <th className="p-3.5 text-right">Area</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Filed On</th>
                    <th className="p-3.5 text-center">Completed</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mutations.map((m) => (
                    <tr key={m.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3.5 font-mono text-orange-700 font-medium">{m.ulpin ?? "—"}</td>
                      <td className="p-3.5 text-slate-700 font-medium">{m.survey_number ?? "—"}</td>
                      <td className="p-3.5 text-slate-600">{m.village ?? "—"}</td>
                      <td className="p-3.5 text-right text-slate-700 font-mono font-semibold">
                        {m.area_hectares ? `${m.area_hectares} ha` : "—"}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${STATUS_STYLE[m.mutation_status]}`}>
                          {STATUS_ICON[m.mutation_status]}
                          {m.mutation_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-xs text-slate-500 font-mono">
                        {m.filed_on
                          ? new Date(m.filed_on).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td className="p-3.5 text-center text-xs text-slate-500 font-mono">
                        {m.completed_on
                          ? new Date(m.completed_on).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td className="p-3.5 text-center">
                        <MutationActions
                          parcelId={m.id}
                          currentStatus={m.mutation_status}
                          onUpdated={mutate}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mutation Actions ───────────────────────────────────────────────────────

function MutationActions({
  parcelId,
  currentStatus,
  onUpdated,
}: {
  parcelId: string;
  currentStatus: string;
  onUpdated: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextStatus =
    currentStatus === "pending"
      ? "filed"
      : currentStatus === "filed"
      ? "completed"
      : null;

  if (!nextStatus) return <span className="text-xs text-slate-400 font-mono">—</span>;

  const handleAdvance = async () => {
    setUpdating(nextStatus);
    setError(null);

    try {
      const res = await fetch(`/api/mutations/${parcelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          ...(nextStatus === "filed" ? { filed_on: new Date().toISOString().slice(0, 10) } : {}),
          ...(nextStatus === "completed" ? { completed_on: new Date().toISOString().slice(0, 10) } : {}),
        }),
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
      <button
        onClick={handleAdvance}
        disabled={updating !== null}
        title={`Mark as ${nextStatus}`}
        className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-lg transition-all disabled:opacity-50 cursor-pointer ${
          nextStatus === "completed"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
        }`}
      >
        {updating ? (
          <Loader2 className="h-3 w-3 animate-spin inline" />
        ) : nextStatus === "completed" ? (
          <CheckCircle2 className="h-3 w-3 inline" />
        ) : (
          <Send className="h-3 w-3 inline" />
        )}
        {" "}
        Mark {nextStatus}
      </button>
      {error && <span className="text-[10px] text-red-500 font-mono ml-1">{error}</span>}
    </div>
  );
}
