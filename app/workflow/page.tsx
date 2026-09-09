"use client";

/**
 * BhoomiSetu — Workflow Index (/workflow)
 * Lists all projects with their current stage, RAG status, and deadline status.
 * Click a project → /workflow/[projectId]
 */

import useSWR from "swr";
import Link from "next/link";
import {
  Shield,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
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
}

interface Notification {
  project_id: string;
  section: string;
  deadline_on: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const RAG_STYLES: Record<string, { badge: string; row: string }> = {
  green:  { badge: "bg-green-100 text-green-700 border-green-200",   row: "hover:border-green-300" },
  amber:  { badge: "bg-amber-100 text-amber-700 border-amber-200",   row: "hover:border-amber-300" },
  red:    { badge: "bg-red-100 text-red-700 border-red-200",          row: "hover:border-red-300" },
  lapsed: { badge: "bg-purple-100 text-purple-700 border-purple-200", row: "hover:border-purple-300" },
};

export default function WorkflowIndexPage() {
  const { data: projectsData, isLoading } = useSWR<{ data: Project[] }>("/api/projects", fetcher);
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statutory Workflow</h1>
          <p className="text-sm text-gray-500">
            RFCTLARR Act, 2013 — 10-stage acquisition pipeline. Select a project to view and advance its stage.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(["green", "amber", "red", "lapsed"] as const).map((flag) => {
          const count = projects.filter((p) => p.status_flag === flag).length;
          const s = RAG_STYLES[flag];
          return (
            <div key={flag} className={`bg-white rounded-xl border px-4 py-3 text-center ${count > 0 ? "" : "opacity-60"}`}>
              <div className="text-2xl font-bold text-gray-800">{count}</div>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${s.badge} mt-1`}>
                {flag.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Project list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No projects found</div>
      ) : (
        <div className="flex flex-col gap-3">
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
                className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 cursor-pointer ${s.row}`}
              >
                {/* RAG indicator */}
                <div
                  className={`w-2.5 h-10 rounded-full shrink-0 ${
                    project.status_flag === "green" ? "bg-green-400"
                    : project.status_flag === "amber" ? "bg-amber-400"
                    : project.status_flag === "red" ? "bg-red-500"
                    : "bg-purple-500"
                  }`}
                />

                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{project.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {project.land_requiring_body} · {project.district}, {project.state}
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${s.badge}`}>
                      {project.status_flag.toUpperCase()}
                    </span>
                  </div>

                  {/* Stage + deadline row */}
                  <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="font-medium text-gray-700">{stageInfo.label}</span>
                      <span className="text-gray-400">{stageInfo.actRef}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{dwellDays}d in stage</span>
                    </div>

                    {countdown && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        countdown.isPast ? "text-purple-700"
                        : project.status_flag === "red" ? "text-red-600"
                        : project.status_flag === "amber" ? "text-amber-600"
                        : "text-green-600"
                      }`}>
                        {countdown.isPast ? (
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 shrink-0" />
                        )}
                        {countdown.label}
                      </div>
                    )}

                    <div className="text-xs text-gray-400">
                      Risk: <span className={`font-semibold ${
                        Number(project.risk_score ?? 0) >= 70 ? "text-red-600"
                        : Number(project.risk_score ?? 0) >= 40 ? "text-amber-600"
                        : "text-green-600"
                      }`}>{Number(project.risk_score ?? 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
