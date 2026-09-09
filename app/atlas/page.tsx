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
} from "lucide-react";
import type { Polygon, MultiPolygon } from "geojson";
import type { ParcelFeature } from "@/components/map/ParcelMap";
import type { IntersectedParcel } from "@/components/map/AlignmentDrawer";

// Lazy-load map components (client-only, no SSR)
const ParcelMap = dynamic(() => import("@/components/map/ParcelMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-sm">Initialising map…</span>
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
  risk_score: number;
  alignment_geojson: Polygon | MultiPolygon | null;
  land_requiring_body: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  lapsed: "bg-purple-100 text-purple-700",
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
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [displayedParcels, setDisplayedParcels] = useState<ParcelFeature[]>([]);
  const [alignment, setAlignment] = useState<Polygon | MultiPolygon | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [drawMode, setDrawMode] = useState(false);

  // Build query string for projects API
  const projectsUrl = (() => {
    const params = new URLSearchParams();
    if (districtFilter) params.set("district", districtFilter);
    if (statusFilter)   params.set("status_flag", statusFilter);
    return `/api/projects?${params.toString()}`;
  })();

  const { data: projectsData, isLoading: projectsLoading } = useSWR<{
    data: Project[];
  }>(projectsUrl, fetcher, { refreshInterval: 30000 });

  const projects = projectsData?.data ?? [];

  // Filtered by local search
  const visibleProjects = projects.filter((p) =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.land_requiring_body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch parcels for selected project
  const parcelsUrl = selectedProject
    ? `/api/parcels?project_id=${selectedProject.id}`
    : null;

  const { data: parcelsData, isLoading: parcelsLoading } = useSWR<{
    data: ParcelFeature[];
  }>(parcelsUrl, fetcher);

  useEffect(() => {
    if (parcelsData?.data) {
      setDisplayedParcels(parcelsData.data);
    } else if (!selectedProject) {
      setDisplayedParcels([]);
    }
  }, [parcelsData, selectedProject]);

  const handleProjectSelect = useCallback((project: Project) => {
    setSelectedProject(project);
    setAlignment(project.alignment_geojson);
    setDisplayedParcels([]);
  }, []);

  const handleIntersectResults = useCallback((parcels: IntersectedParcel[]) => {
    // Augment parcels from intersect results with a dummy geometry for display
    // (intersect API returns slim parcels without geometry — full geometry fetched
    //  from /api/parcels?project_id= when a project is selected)
    // For now, update the displayed list to show the matched ones
    setDisplayedParcels((prev) =>
      prev.length > 0
        ? prev.filter((p) => parcels.some((ip) => ip.id === p.id))
        : (parcels as unknown as ParcelFeature[])
    );
  }, []);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-gray-100">
      {/* ── Left Panel ──────────────────────────────────────────────── */}
      <aside className="w-80 shrink-0 flex flex-col bg-white border-r shadow-sm z-10 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-gray-800">Parcel Atlas</span>
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                showFilters
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search project, district…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-0.5 block">District</label>
                <input
                  type="text"
                  placeholder="e.g. Nashik"
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-0.5 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="">All</option>
                  <option value="green">Green</option>
                  <option value="amber">Amber</option>
                  <option value="red">Red</option>
                  <option value="lapsed">Lapsed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto">
          {projectsLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading projects…</span>
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 px-4 text-center">
              <Building2 className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No projects found</p>
              {(districtFilter || statusFilter || searchQuery) && (
                <button
                  onClick={() => { setDistrictFilter(""); setStatusFilter(""); setSearchQuery(""); }}
                  className="mt-2 text-xs text-amber-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {visibleProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-amber-50 ${
                    selectedProject?.id === project.id
                      ? "bg-amber-50 border-l-4 border-amber-500"
                      : "border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{project.land_requiring_body}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{project.district}, {project.state}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[project.status_flag] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {project.status_flag}
                      </span>
                      <span className="text-xs text-gray-400">
                        {STAGE_LABELS[project.current_stage] ?? project.current_stage}
                      </span>
                    </div>
                  </div>
                  {selectedProject?.id === project.id && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-700">
                      <ChevronRight className="h-3 w-3" />
                      {parcelsLoading ? "Loading parcels…" : `${displayedParcels.length} parcel${displayedParcels.length !== 1 ? "s" : ""}`}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alignment Drawer (bottom of left panel) */}
        {selectedProject && (
          <div className="border-t p-3 bg-gray-50">
            <AlignmentDrawer
              onAlignmentChange={setAlignment}
              onIntersectResults={handleIntersectResults}
              projectId={selectedProject.id}
            />
          </div>
        )}

        {/* Draw mode toggle */}
        {selectedProject && (
          <div className="border-t px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Layers className="h-3.5 w-3.5" />
              Draw Alignment on Map
            </div>
            <button
              onClick={() => setDrawMode((v) => !v)}
              className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                drawMode
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {drawMode ? "On" : "Off"}
            </button>
          </div>
        )}
      </aside>

      {/* ── Right Panel: Map ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col p-3 overflow-hidden">
        {/* Stats bar */}
        {selectedProject && (
          <div className="flex items-center gap-3 mb-2 text-xs">
            <span className="font-semibold text-gray-700 truncate max-w-xs">
              {selectedProject.name}
            </span>
            {[
              { label: "Stage", value: STAGE_LABELS[selectedProject.current_stage] },
              { label: "Risk", value: selectedProject.risk_score.toFixed(1) },
              { label: "Type", value: selectedProject.project_type ?? "—" },
            ].map((item) => (
              <span key={item.label} className="text-gray-500">
                <span className="text-gray-400">{item.label}: </span>
                {item.value}
              </span>
            ))}
            <button
              onClick={() => { setSelectedProject(null); setDisplayedParcels([]); setAlignment(null); }}
              className="ml-auto text-gray-400 hover:text-gray-600"
              title="Deselect project"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Map */}
        <ParcelMap
          parcels={displayedParcels}
          projectAlignment={alignment}
          onAlignmentDraw={setAlignment}
          drawMode={drawMode}
          className="flex-1"
        />

        {/* No project selected hint */}
        {!selectedProject && !projectsLoading && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-xl shadow-lg border px-4 py-2 text-sm text-gray-600 flex items-center gap-2 pointer-events-none">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Select a project from the left panel to view its parcels
          </div>
        )}
      </main>
    </div>
  );
}
