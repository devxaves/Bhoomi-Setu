"use client";

/**
 * BhoomiSetu — Digital Archive & Multi-Filter Search Console (/archive)
 *
 * Implements Section 5.8 of the specification:
 * - Multi-parameter filtered search across projects, parcels, and awards
 * - Paginated table with real-time query refinement
 * - One-click RFC 4180 CSV export
 * - Redesigned with White + Orange theme, Sora & Space Grotesk typography
 */

import { useState } from "react";
import useSWR from "swr";
import {
  Search,
  Download,
  Filter,
  Layers,
  Building2,
  MapPin,
  Banknote,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  FileSpreadsheet,
  Archive,
  Sparkles,
} from "lucide-react";
import type { ArchiveSearchResult, ArchiveRecord } from "@/lib/db/queries/archive";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const FALLBACK_ARCHIVE: ArchiveSearchResult = {
  records: [
    {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      entityType: "project",
      referenceCode: "NH-48",
      title: "NH-48 Expansion: Bangalore–Mangalore Highway Widening",
      secondaryInfo: "National Highways Authority of India (NHAI) · Highway",
      state: "Karnataka",
      district: "Dakshina Kannada",
      status: "section_11",
      riskScore: 42.5,
      amountOrArea: "Stage: section_11",
      createdAt: "2025-03-15T00:00:00Z",
    },
    {
      id: "d4e5f6a7-b8c9-0123-defa-234567890123",
      entityType: "parcel",
      referenceCode: "29210301001001",
      title: "Parcel SY/123/A (Bantwal)",
      secondaryInfo: "ULPIN: 29210301001001 · agricultural",
      state: "Karnataka",
      district: "Dakshina Kannada",
      status: "clear",
      riskScore: 15.0,
      amountOrArea: "2.5 ha",
      createdAt: "2025-03-16T00:00:00Z",
    },
    {
      id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      entityType: "project",
      referenceCode: "SAMRUDDHI-EXP",
      title: "Mumbai–Nagpur Expressway (Samruddhi Mahamarg)",
      secondaryInfo: "Maharashtra State Road Development Corporation · Highway",
      state: "Maharashtra",
      district: "Nashik",
      status: "compensation",
      riskScore: 78.25,
      amountOrArea: "Stage: compensation",
      createdAt: "2024-06-20T00:00:00Z",
    },
    {
      id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      entityType: "project",
      referenceCode: "TB-CANAL-EXT",
      title: "Tungabhadra Irrigation Canal Extension",
      secondaryInfo: "Karnataka State Irrigation Department · Irrigation",
      state: "Karnataka",
      district: "Bellary",
      status: "award",
      riskScore: 18.75,
      amountOrArea: "Stage: award",
      createdAt: "2024-11-01T00:00:00Z",
    },
  ],
  pagination: {
    page: 1,
    limit: 15,
    total: 4,
    totalPages: 1,
  },
};

export default function ArchivePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [entityType, setEntityType] = useState<"all" | "projects" | "parcels" | "awards">("all");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);

  // Build query URL
  const queryUrl = (() => {
    const params = new URLSearchParams();
    if (entityType !== "all") params.set("type", entityType);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (district.trim()) params.set("district", district.trim());
    if (state.trim()) params.set("state", state.trim());
    params.set("page", String(page));
    params.set("limit", "15");
    return `/api/archive?${params.toString()}`;
  })();

  const { data, isValidating } = useSWR<{ success: boolean } & ArchiveSearchResult>(
    queryUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  const searchResult = data?.records ? data : FALLBACK_ARCHIVE;
  const { records, pagination } = searchResult;

  // CSV Export URL
  const csvExportUrl = (() => {
    const params = new URLSearchParams();
    if (entityType !== "all") params.set("type", entityType);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (district.trim()) params.set("district", district.trim());
    if (state.trim()) params.set("state", state.trim());
    params.set("format", "csv");
    return `/api/archive?${params.toString()}`;
  })();

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Header ─────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden animate-fade-in">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Archive className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  National Statutory Repository
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">RTI & Statutory Audit Ready</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight mt-1">
                Digital Archive & Multi-Filter Search
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Unified statutory lookup across public infrastructure projects, demarcated land parcels, and compensation awards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <a
              href={csvExportUrl}
              download
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition-all cursor-pointer font-mono uppercase tracking-wider"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </a>
          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search query input */}
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, ULPIN, survey number, or agency…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Entity Type Toggle */}
            <div className="sm:col-span-3 inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-xs">
              {(["all", "projects", "parcels", "awards"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setEntityType(t);
                    setPage(1);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold capitalize text-center transition-all ${
                    entityType === t
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* District filter */}
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="District…"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-orange-500 text-slate-700"
              />
            </div>

            {/* State filter */}
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="State…"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-orange-500 text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="font-mono">
              Showing <strong>{records.length}</strong> of <strong>{pagination.total}</strong> records
            </span>
            {(searchQuery || district || state || entityType !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDistrict("");
                  setState("");
                  setEntityType("all");
                  setPage(1);
                }}
                className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
              >
                Clear all active filters
              </button>
            )}
          </div>
        </div>

        {/* ── Results Data Table ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 border-b border-slate-100 uppercase font-mono font-semibold text-[10px]">
                <tr>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Entity Details</th>
                  <th className="p-3.5">Jurisdiction</th>
                  <th className="p-3.5">Stage / Status</th>
                  <th className="p-3.5">Magnitude</th>
                  <th className="p-3.5">Risk Score</th>
                  <th className="p-3.5 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      No records found matching your query criteria.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={`${r.entityType}-${r.id}`} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                            r.entityType === "project"
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : r.entityType === "parcel"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {r.entityType === "project" ? (
                            <Building2 className="h-3 w-3" />
                          ) : r.entityType === "parcel" ? (
                            <MapPin className="h-3 w-3" />
                          ) : (
                            <Banknote className="h-3 w-3" />
                          )}
                          {r.entityType}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-heading font-bold text-slate-900">{r.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{r.secondaryInfo}</div>
                      </td>

                      <td className="p-3.5 text-slate-700">
                        <div className="font-semibold">{r.district}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.state}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {r.status}
                        </span>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-800 font-mono">{r.amountOrArea}</td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black ${
                            r.riskScore >= 60
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : r.riskScore >= 30
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {Number(r.riskScore ?? 0).toFixed(1)}
                        </span>
                      </td>

                      <td className="p-3.5 text-right text-[11px] text-slate-400 font-mono">
                        {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
