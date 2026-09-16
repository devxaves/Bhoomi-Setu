"use client";

/**
 * BhoomiSetu — Statutory Workflow Index (/workflow)
 * Lists all projects with their current stage, RAG status, and deadline status.
 * Click a project → /workflow/[projectId]
 */

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import {
  Shield,
  ChevronRight,
  AlertTriangle,
  Clock,
  Loader2,
  Search,
  MapPin,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { STAGE_INFO } from "@/lib/workflow";
import type { Stage } from "@/lib/workflow";
import { formatCountdown } from "@/lib/workflow";

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
  parcel_count: number;
  ulpins: string[];
}

interface Notification {
  project_id: string;
  section: string;
  deadline_on: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const RAG_STYLES: Record<string, { badge: string; border: string; dot: string }> = {
  green:  { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-l-emerald-500", dot: "bg-emerald-500" },
  amber:  { badge: "bg-amber-50 text-amber-700 border-amber-200", border: "border-l-amber-500", dot: "bg-amber-500" },
  red:    { badge: "bg-red-50 text-red-700 border-red-200", border: "border-l-red-500", dot: "bg-red-500" },
  lapsed: { badge: "bg-purple-50 text-purple-700 border-purple-200", border: "border-l-purple-500", dot: "bg-purple-500" },
};

export default function WorkflowIndexPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const projectsUrl = searchQuery
    ? `/api/projects?limit=200&search=${encodeURIComponent(searchQuery)}`
    : "/api/projects?limit=200";
  const { data: projectsData, isLoading } = useSWR<{ data: Project[]; pagination?: { total: number } }>(projectsUrl, fetcher);
  const { data: notifsData } = useSWR<{ data: Notification[] }>(
    "/api/notifications?upcoming=true",
    fetcher,
    { refreshInterval: 60000 }
  );

  const projects = projectsData?.data ?? [];
  const notifs = notifsData?.data ?? [];

  // Build a map of project_id → nearest upcoming deadline
  const deadlineMap = new Map<string, string>();
  for (const n of notifs) {
    const existing = deadlineMap.get(n.project_id);
    if (!existing || n.deadline_on < existing) {
      deadlineMap.set(n.project_id, n.deadline_on);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm relative overflow-hidden animate-fade-in">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 mb-1">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  Statutory Pipeline Console
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
                  RFCTLARR Acquisition Workflows
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  RFCTLARR Act, 2013 — 10-stage statutory lifecycle tracking, countdown watches, and progression audit.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
          {(["green", "amber", "red", "lapsed"] as const).map((flag) => {
            const count = projects.filter((p) => p.status_flag === flag).length;
            const s = RAG_STYLES[flag];
            return (
              <div
                key={flag}
                className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all ${
                  count > 0 ? "hover:border-orange-200" : "opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${s.badge}`}>
                    {flag.toUpperCase()}
                  </span>
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-3 font-mono">
                  {count}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Projects in status</div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative animate-fade-in">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, district, or ULPIN code…"
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-slate-200/80 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Project list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-sm font-medium">Loading statutory workflows…</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Layers className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-heading font-semibold text-slate-700">No acquisition workflows found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="space-y-3.5 animate-fade-in">
            {projects.map((project) => {
              const stageInfo = STAGE_INFO[project.current_stage];
              const s = RAG_STYLES[project.status_flag] ?? RAG_STYLES.green;
              const nearestDeadline = deadlineMap.get(project.id);
              const countdown = nearestDeadline ? formatCountdown(nearestDeadline) : null;
              const dwellDays = Math.floor(
                (Date.now() - new Date(project.stage_started_at).getTime()) / 86400000
              );

              return (
                <Link
                  key={project.id}
                  href={`/workflow/${project.id}`}
                  className={`group bg-white rounded-2xl border border-slate-200/80 border-l-4 ${s.border} shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 p-5 flex items-center gap-4 cursor-pointer relative overflow-hidden`}
                >
                  {/* Project info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-heading font-bold text-slate-900 group-hover:text-orange-600 transition-colors text-base truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {project.land_requiring_body} · <span className="font-medium text-slate-600">{project.district}, {project.state}</span>
                        </div>
                        {project.ulpins?.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            <span className="text-[11px] font-mono font-medium text-orange-700 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md">
                              {project.ulpins.length} parcel{project.ulpins.length !== 1 ? "s" : ""}
                            </span>
                            {project.ulpins.slice(0, 3).map((u) => (
                              <span key={u} className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                …{u.slice(-6)}
                              </span>
                            ))}
                            {project.ulpins.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-mono">+{project.ulpins.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className={`inline-flex shrink-0 items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${s.badge}`}>
                        {project.status_flag.toUpperCase()}
                      </span>
                    </div>

                    {/* Stage + deadline row */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="font-heading font-bold text-slate-800">{stageInfo.label}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({stageInfo.actRef})</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{dwellDays}d in stage</span>
                      </div>

                      {countdown && (
                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                          countdown.isPast ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : project.status_flag === "red" ? "bg-red-50 text-red-700 border border-red-200"
                          : project.status_flag === "amber" ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {countdown.isPast ? (
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                          ) : (
                            <Clock className="h-3 w-3 shrink-0" />
                          )}
                          {countdown.label}
                        </div>
                      )}

                      <div className="text-xs text-slate-500 ml-auto font-mono">
                        Risk: <span className={`font-bold ${
                          Number(project.risk_score ?? 0) >= 70 ? "text-red-600"
                          : Number(project.risk_score ?? 0) >= 40 ? "text-amber-600"
                          : "text-emerald-600"
                        }`}>{Number(project.risk_score ?? 0).toFixed(1)}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-50 text-slate-400 group-hover:text-orange-600 flex items-center justify-center transition-all shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
