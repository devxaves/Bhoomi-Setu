"use client";

/**
 * BhoomiSetu — GIS Parcel Atlas (/atlas)
 *
 * Full-screen split-panel layout:
 * Left panel  — project list, parcel count, filters (district/status_flag), AlignmentDrawer
 * Right panel — ParcelMap (full-screen, polygon render, risk coloring, click detail)
 *
 * Data flow:
 * 1. Fetch projects list via /api/projects (filtered by district/status_flag)
 * 2. On project select, fetch parcels via /api/parcels?project_id=
 * 3. Pass parcels + project alignment to ParcelMap
 * 4. AlignmentDrawer handles draw/upload + intersect
 */

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import {
  Map,
  Filter,
  ChevronRight,
  Search,
  AlertTriangle,
  Loader2,
  Building2,
  Layers,
  X,
  Sparkles,
  Compass,
} from "lucide-react";
import type { Polygon, MultiPolygon } from "geojson";
import type { ParcelFeature } from "@/components/map/ParcelMap";
import type { IntersectedParcel } from "@/components/map/AlignmentDrawer";

// Lazy-load map components (client-only, no SSR)
const ParcelMap = dynamic(() => import("@/components/map/ParcelMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-50/80 rounded-2xl border border-slate-200">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="text-sm font-medium">Initialising spatial atlas…</span>
      </div>
    </div>
  ),
});

const AlignmentDrawer = dynamic(() => import("@/components/map/AlignmentDrawer"), {
  ssr: false,
});

// ── Types ──────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  district: string;
  state: string;
  project_type: string | null;
  current_stage: string;
  status_flag: "green" | "amber" | "red" | "lapsed";
  risk_score: number | string;
  alignment_geojson: any;
  land_requiring_body: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  district: string;
  state: string;
  project_type: string | null;
  current_stage: string;
  status_flag: "green" | "amber" | "red" | "lapsed";
  risk_score: number | string;
  land_requiring_body: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_BADGE: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  red: "bg-red-50 text-red-700 border border-red-200",
  lapsed: "bg-purple-50 text-purple-700 border border-purple-200",
};

const STAGE_LABELS: Record<string, string> = {
  proposal: "Proposal",
  sia: "SIA",
  section_11: "Sec 11",
  section_19: "Sec 19",
  award: "Award",
  compensation: "Compensation",
  mutation: "Mutation",
  possession: "Possession",
  rr: "R&R",
  closed: "Closed",
};

// ── Main Component ─────────────────────────────────────────────────────────

export default function AtlasPage() {
  const [districtFilter, setDistrictFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [displayedParcels, setDisplayedParcels] = useState<ParcelFeature[]>([]);
  const [alignment, setAlignment] = useState<Polygon | MultiPolygon | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [seedStatus, setSeedStatus] = useState<"idle" | "seeding" | "done" | "error">("idle");

  // Build query string for projects API
  const projectsUrl = (() => {
    const params = new URLSearchParams();
    if (districtFilter) params.set("district", districtFilter);
    if (statusFilter) params.set("status_flag", statusFilter);
    return `/api/projects?${params.toString()}`;
  })();

  const { data: projectsData, isLoading: projectsLoading, mutate } = useSWR<{
    data: ProjectSummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }>(projectsUrl, fetcher, { refreshInterval: 30000 });

  const projects = projectsData?.data ?? [];

  // Auto-seed demo data on first load if projects exist but none have alignment
  useEffect(() => {
    if (projects.length === 0 || seedStatus !== "idle") return;
    const hasAnyAlignment = projects.some((p) => (p as any).alignment_geojson);
    if (hasAnyAlignment) {
      setSeedStatus("done");
      return;
    }
    setSeedStatus("seeding");
    fetch("/api/seed/atlas", { method: "POST" })
      .then((r) => r.json())
      .then(() => {
        setSeedStatus("done");
        mutate();
      })
      .catch(() => setSeedStatus("error"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, seedStatus]);

  // Filtered by local search
  const visibleProjects = projects.filter((p) =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.land_requiring_body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch parcels for selected project
  const parcelsUrl = selectedProject
    ? `/api/parcels?project_id=${selectedProject.id}&geometry=true`
    : null;

  const { data: parcelsData, isLoading: parcelsLoading } = useSWR<{
    data: ParcelFeature[];
    count?: number;
  }>(parcelsUrl, fetcher);

  useEffect(() => {
    if (parcelsData?.data) {
      setDisplayedParcels(parcelsData.data);
    } else if (!selectedProject) {
      setDisplayedParcels([]);
    }
  }, [parcelsData, selectedProject]);

  // Fetch full project details (with alignment_geojson) when a project is selected
  const projectDetailUrl = selectedProject
    ? `/api/projects/${selectedProject.id}`
    : null;

  const { data: projectDetailData } = useSWR<{ data: Project }>(
    projectDetailUrl,
    fetcher
  );

  useEffect(() => {
    if (projectDetailData?.data) {
      setAlignment(projectDetailData.data.alignment_geojson);
    }
  }, [projectDetailData]);

  const handleProjectSelect = useCallback((project: { id: string; name: string; district: string; state: string; project_type?: string | null; current_stage: string; status_flag: "green" | "amber" | "red" | "lapsed"; risk_score: number | string; land_requiring_body?: string }) => {
    setSelectedProject({ ...project, alignment_geojson: null } as Project);
    setAlignment(null);
    setDisplayedParcels([]);
  }, []);

  const handleIntersectResults = useCallback((parcels: IntersectedParcel[]) => {
    setDisplayedParcels((prev) =>
      prev.length > 0
        ? prev.filter((p) => parcels.some((ip) => ip.id === p.id))
        : (parcels as unknown as ParcelFeature[])
    );
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#fafaf9] font-sans">
      {/* ── Left Panel ──────────────────────────────────────────────── */}
      <aside className="w-88 shrink-0 flex flex-col bg-white border-r border-slate-200 shadow-sm z-10 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <span className="font-heading font-bold text-slate-900 text-sm block">Spatial Atlas</span>
                <span className="text-[10px] text-slate-400 font-mono">GIS Cadastral Overlay</span>
              </div>
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                showFilters
                  ? "bg-orange-50 text-orange-700 border border-orange-200"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search project, body, district…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 animate-fade-in">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">District</label>
                <input
                  type="text"
                  placeholder="e.g. Nashik"
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">RAG Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  <option value="">All Statuses</option>
                  <option value="green">Green (On Track)</option>
                  <option value="amber">Amber (At Risk)</option>
                  <option value="red">Red (Critical)</option>
                  <option value="lapsed">Lapsed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {projectsLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              <span className="text-xs font-medium">Loading projects…</span>
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 px-4 text-center">
              <Building2 className="h-8 w-8 mb-2 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">No matching projects found</p>
              {(districtFilter || statusFilter || searchQuery) ? (
                <button
                  onClick={() => { setDistrictFilter(""); setStatusFilter(""); setSearchQuery(""); }}
                  className="mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={async () => {
                    setSeedStatus("seeding");
                    try {
                      const res = await fetch("/api/seed/atlas", { method: "POST" });
                      if (res.ok) { setSeedStatus("done"); mutate(); }
                      else setSeedStatus("error");
                    } catch { setSeedStatus("error"); }
                  }}
                  className="mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold rounded-xl hover:shadow-md transition-all"
                >
                  Load Demo Data
                </button>
              )}
            </div>
          ) : (
            <div>
              {visibleProjects.map((project) => {
                const isSelected = selectedProject?.id === project.id;
                return (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className={`w-full text-left p-4 transition-all duration-200 border-l-4 ${
                      isSelected
                        ? "bg-orange-50/60 border-orange-500 shadow-inner"
                        : "border-transparent hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-heading font-bold text-slate-800 truncate">{project.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{project.land_requiring_body}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{project.district}, {project.state}</p>
                        {"ulpins" in project && (project as any).ulpins?.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[10px] font-mono text-orange-700 bg-orange-100/60 border border-orange-200/60 px-2 py-0.5 rounded-md">
                              {(project as any).ulpins.length} parcel{(project as any).ulpins.length !== 1 ? "s" : ""}
                            </span>
                            {(project as any).ulpins.slice(0, 2).map((u: string) => (
                              <span key={u} className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                …{u.slice(-6)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            STATUS_BADGE[project.status_flag] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {project.status_flag}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {STAGE_LABELS[project.current_stage] ?? project.current_stage}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-orange-700 font-medium">
                        <ChevronRight className="h-3.5 w-3.5 text-orange-500" />
                        {parcelsLoading ? "Loading parcel geometries…" : `${displayedParcels.length} parcel polygon${displayedParcels.length !== 1 ? "s" : ""} on map`}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Risk Distribution Mini-Chart */}
        {projects.length > 0 && !selectedProject && (
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-mono font-semibold">
              Corridor Risk Distribution
            </div>
            <div className="flex gap-2 h-14 items-end">
              {(() => {
                const buckets = [0, 0, 0];
                projects.forEach((p) => {
                  const s = Number(p.risk_score ?? 0);
                  if (s >= 70) buckets[2]++;
                  else if (s >= 40) buckets[1]++;
                  else buckets[0]++;
                });
                const max = Math.max(...buckets, 1);
                const colors = ["#10B981", "#F59E0B", "#EF4444"];
                const labels = ["Low", "Medium", "High"];
                return buckets.map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono font-bold text-slate-600">{count}</span>
                    <div className="w-full rounded-t-md transition-all duration-300" style={{ height: `${(count / max) * 100}%`, background: colors[i], minHeight: 4 }} />
                    <span className="text-[9px] text-slate-400 font-medium">{labels[i]}</span>
                  </div>
                ));
              })()}
            </div>
            {seedStatus === "seeding" && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-orange-600 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Seeding demo corridors & parcels…
              </div>
            )}
            {seedStatus === "done" && (
              <button
                onClick={async () => {
                  setSeedStatus("seeding");
                  try {
                    const res = await fetch("/api/seed/atlas", { method: "POST" });
                    if (res.ok) { setSeedStatus("done"); mutate(); }
                    else setSeedStatus("error");
                  } catch { setSeedStatus("error"); }
                }}
                className="mt-2 text-[10px] text-orange-600 font-semibold hover:underline"
              >
                Reload Demo Spatial Data
              </button>
            )}
          </div>
        )}

        {/* Stage Progress Indicator */}
        {selectedProject && (
          <div className="border-t border-slate-100 p-4 bg-slate-50/60">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2.5 font-mono font-semibold">
              Statutory Stage Progress
            </div>
            <div className="flex items-center gap-1">
              {Object.entries(STAGE_LABELS).map(([key, label], idx) => {
                const currentIdx = Object.keys(STAGE_LABELS).indexOf(selectedProject.current_stage);
                const isActive = idx === currentIdx;
                const isComplete = idx < currentIdx;
                return (
                  <div key={key} className="flex-1 flex flex-col items-center" title={label}>
                    <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                      isComplete ? "bg-emerald-500" : isActive ? "bg-orange-500" : "bg-slate-200"
                    }`} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center mt-2 text-[10px]">
              <span className="font-semibold text-slate-600">
                {STAGE_LABELS[selectedProject.current_stage] ?? selectedProject.current_stage}
              </span>
              <span className="font-mono text-slate-400">
                Stage {Object.keys(STAGE_LABELS).indexOf(selectedProject.current_stage) + 1} of 10
              </span>
            </div>
          </div>
        )}

        {/* Alignment Drawer */}
        {selectedProject && (
          <div className="border-t border-slate-100 p-3 bg-white">
            <AlignmentDrawer
              onAlignmentChange={setAlignment}
              onIntersectResults={handleIntersectResults}
              projectId={selectedProject.id}
            />
          </div>
        )}

        {/* Draw mode toggle */}
        {selectedProject && (
          <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <Layers className="h-3.5 w-3.5 text-orange-600" />
              Draw Alignment on Map
            </div>
            <button
              onClick={() => setDrawMode((v) => !v)}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                drawMode
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {drawMode ? "Active" : "Off"}
            </button>
          </div>
        )}
      </aside>

      {/* ── Right Panel: Map ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col p-4 overflow-hidden relative">
        {/* Stats bar */}
        {selectedProject && (
          <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm text-xs animate-fade-in">
            <span className="font-heading font-bold text-slate-800 truncate max-w-xs">
              {selectedProject.name}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              <span className="text-slate-400 font-medium">Stage: </span>
              <strong className="text-orange-600">{STAGE_LABELS[selectedProject.current_stage] ?? selectedProject.current_stage}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              <span className="text-slate-400 font-medium">Risk Score: </span>
              <strong className="font-mono">{Number(selectedProject.risk_score ?? 0).toFixed(1)}/100</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 truncate">
              <span className="text-slate-400 font-medium">Agency: </span>
              {selectedProject.land_requiring_body}
            </span>
            <button
              onClick={() => { setSelectedProject(null); setDisplayedParcels([]); setAlignment(null); }}
              className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              title="Deselect project"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm relative">
          <ParcelMap
            projects={visibleProjects}
            selectedProject={selectedProject}
            onProjectSelect={handleProjectSelect}
            parcels={displayedParcels}
            projectAlignment={alignment}
            onAlignmentDraw={setAlignment}
            drawMode={drawMode}
            className="w-full h-full"
          />
        </div>

        {/* No project selected hint */}
        {!selectedProject && !projectsLoading && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-orange-200 px-5 py-3 text-xs text-slate-700 flex items-center gap-3 pointer-events-none animate-fade-in z-20">
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <span>Click any corridor marker on the map or select from the left panel to inspect parcel boundaries</span>
          </div>
        )}
      </main>
    </div>
  );
}
