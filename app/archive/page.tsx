"use client";

/**
 * BhoomiSetu — Digital Archive & Multi-Filter Search Console (/archive)
 *
 * Implements Section 5.8 of the specification:
 * - Multi-parameter filtered search across projects, parcels, and awards
 * - Paginated table with real-time query refinement
 * - One-click RFC 4180 CSV export
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
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Header ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                National Statutory Repository
              </span>
              <span className="text-xs text-slate-400">RTI & Audit Ready</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Digital Archive & Multi-Filter Search</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive lookup across statutory projects, demarcated land parcels, and compensation awards
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={csvExportUrl}
              download
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to CSV
            </a>
          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search query input */}
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, ULPIN, survey number, or body…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Entity Type Toggle */}
            <div className="sm:col-span-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              {(["all", "projects", "parcels", "awards"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setEntityType(t);
                    setPage(1);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-md font-semibold capitalize text-center transition-all ${
                    entityType === t
                      ? "bg-slate-900 text-white shadow-xs"
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
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
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
                className="text-amber-700 hover:text-amber-900 font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* ── Results Data Table ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Title & Details</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Magnitude</th>
                  <th className="p-3">Risk Score</th>
                  <th className="p-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No records found matching your query.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={`${r.entityType}-${r.id}`} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.entityType === "project"
                              ? "bg-blue-100 text-blue-800"
                              : r.entityType === "parcel"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
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

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{r.title}</div>
                        <div className="text-[11px] text-slate-500">{r.secondaryInfo}</div>
                      </td>

                      <td className="p-3 text-slate-700">
                        <div className="font-medium">{r.district}</div>
                        <div className="text-[10px] text-slate-400">{r.state}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {r.status}
                        </span>
                      </td>

                      <td className="p-3 font-semibold text-slate-800">{r.amountOrArea}</td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            r.riskScore >= 60
                              ? "bg-red-100 text-red-800"
                              : r.riskScore >= 30
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {r.riskScore.toFixed(1)}
                        </span>
                      </td>

                      <td className="p-3 text-right text-[11px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
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
