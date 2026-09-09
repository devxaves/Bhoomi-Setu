"use client";

/**
 * BhoomiSetu — Mutation Tracking (/mutations)
 *
 * Track revenue record title transfer (mutation) status per parcel.
 * pending → filed → completed
 * Most commonly delayed stage in Indian land acquisition.
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
  pending: "bg-gray-100 text-gray-600",
  filed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Mutation</h1>
          <p className="text-sm text-gray-500">
            State Land Revenue Act — Title transfer tracking. Most delayed stage nationally.
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

      {/* Metrics cards */}
      {projectId && metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl border px-4 py-3 text-center">
            <div className="text-2xl font-bold text-gray-800">{metrics.totalParcels}</div>
            <div className="text-xs text-gray-500 mt-1">Total Parcels</div>
          </div>
          <div className="bg-white rounded-xl border px-4 py-3 text-center">
            <div className="text-2xl font-bold text-green-700">{metrics.completedCount}</div>
            <div className="text-xs text-gray-500 mt-1">Completed</div>
          </div>
          <div className="bg-white rounded-xl border px-4 py-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{metrics.filedCount}</div>
            <div className="text-xs text-gray-500 mt-1">Filed</div>
          </div>
          <div className="bg-white rounded-xl border px-4 py-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{metrics.pendingCount}</div>
            <div className="text-xs text-gray-500 mt-1">Pending</div>
          </div>
          <div className={`rounded-xl border px-4 py-3 text-center ${metrics.lagCount > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <div className={`text-2xl font-bold ${metrics.lagCount > 0 ? "text-red-700" : "text-green-700"}`}>
              {metrics.lagCount}
            </div>
            <div className="text-xs mt-1 font-medium text-gray-600">Mutation Lag</div>
            <div className="text-[10px] text-gray-400">Possessed but not mutated</div>
          </div>
        </div>
      )}

      {/* Mutations table */}
      {!projectId && (
        <div className="text-center py-16 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-semibold text-gray-500">Select a project to view mutations</p>
          <p className="text-sm mt-1">Track revenue record title transfer per parcel.</p>
        </div>
      )}

      {projectId && isLoading && (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading mutations…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Failed to load mutations
        </div>
      )}

      {projectId && !isLoading && mutations.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p>No parcels with mutation records for this project.</p>
          <p className="text-xs mt-1">Mutation records are created when parcels are linked to a project.</p>
        </div>
      )}

      {mutations.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">ULPIN</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Survey No.</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Village</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Area</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">Filed On</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">Completed</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mutations.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-amber-700">{m.ulpin ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{m.survey_number ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{m.village ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {m.area_hectares ? `${m.area_hectares} ha` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[m.mutation_status]}`}>
                        {STATUS_ICON[m.mutation_status]}
                        {m.mutation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {m.filed_on
                        ? new Date(m.filed_on).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {m.completed_on
                        ? new Date(m.completed_on).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
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

  if (!nextStatus) return <span className="text-xs text-gray-400">—</span>;

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
        className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors disabled:opacity-50 ${
          nextStatus === "completed"
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
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
      {error && <span className="text-[10px] text-red-500 ml-1">{error}</span>}
    </div>
  );
}
