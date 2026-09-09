"use client";

/**
 * BhoomiSetu — Executive Compliance & Operations Dashboard (/dashboard)
 *
 * Implements Section 5.7 of the specification:
 * - Hand-written SQL aggregations across projects, parcels, awards, and mutations
 * - CRITICAL: Mutation Completion Rate presented separately from Physical Possession Rate
 * - Recharts visualizations: RAG status distribution, 10-stage pipeline, monthly trend,
 *   district drill-down
 */

import { useState } from "react";
import useSWR from "swr";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Building2,
  MapPin,
  Landmark,
  Scale,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Layers,
} from "lucide-react";
import type { ExecutiveDashboardData } from "@/lib/db/queries/dashboard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Fallback seed data if DB is connecting
const FALLBACK_DASHBOARD: ExecutiveDashboardData = {
  kpis: {
    totalProjects: 3,
    totalParcels: 8,
    totalAreaHectares: 24.25,
    totalCompensationAssessed: 37170000,
    totalCompensationDisbursed: 17850000,
    disbursementRatePct: 48.0,
    possessionRatePct: 62.5,
    mutationCompletionRatePct: 25.0,
    mutationLagParcelsCount: 3,
    averageRiskScore: 46.5,
  },
  statusBreakdown: [
    { status: "green", count: 1 },
    { status: "amber", count: 1 },
    { status: "red", count: 1 },
    { status: "lapsed", count: 0 },
  ],
  stageDistribution: [
    { stage: "proposal", label: "Proposal", count: 0 },
    { stage: "sia", label: "SIA", count: 0 },
    { stage: "section_11", label: "Sec 11", count: 1 },
    { stage: "section_19", label: "Sec 19", count: 0 },
    { stage: "award", label: "Award", count: 1 },
    { stage: "compensation", label: "Compensation", count: 1 },
    { stage: "mutation", label: "Mutation", count: 0 },
    { stage: "possession", label: "Possession", count: 0 },
    { stage: "rr", label: "R&R", count: 0 },
    { stage: "closed", label: "Closed", count: 0 },
  ],
  districtBreakdown: [
    {
      state: "Maharashtra",
      district: "Nashik",
      projectsCount: 1,
      parcelsCount: 3,
      areaHectares: 9.8,
      mutationsCompleted: 0,
      mutationRatePct: 0.0,
    },
    {
      state: "Karnataka",
      district: "Dakshina Kannada",
      projectsCount: 1,
      parcelsCount: 3,
      areaHectares: 7.45,
      mutationsCompleted: 0,
      mutationRatePct: 0.0,
    },
    {
      state: "Karnataka",
      district: "Bellary",
      projectsCount: 1,
      parcelsCount: 2,
      areaHectares: 7.0,
      mutationsCompleted: 2,
      mutationRatePct: 100.0,
    },
  ],
  monthlyTrajectory: [
    { month: "Nov 2024", projects: 1, notifications: 2, mutations: 1 },
    { month: "Dec 2024", projects: 1, notifications: 1, mutations: 1 },
    { month: "Jan 2025", projects: 2, notifications: 2, mutations: 0 },
    { month: "Feb 2025", projects: 3, notifications: 3, mutations: 1 },
    { month: "Mar 2025", projects: 3, notifications: 4, mutations: 2 },
  ],
};

const RAG_COLORS: Record<string, string> = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  lapsed: "#a855f7",
};

export default function DashboardPage() {
  const { data, mutate, isValidating } = useSWR<{ success: boolean } & ExecutiveDashboardData>(
    "/api/dashboard/analytics",
    fetcher,
    { revalidateOnFocus: false }
  );

  const stats: ExecutiveDashboardData = data?.kpis ? data : FALLBACK_DASHBOARD;
  const { kpis, statusBreakdown, stageDistribution, districtBreakdown, monthlyTrajectory } = stats;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Header ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Executive Compliance Console
              </span>
              <span className="text-xs text-slate-400">SIH 2025 · PS 26016</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              National Land Acquisition Operations & Compliance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Department of Land Resources (DoLR), Ministry of Rural Development · Real-time statutory metrics
            </p>
          </div>

          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all self-start md:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`} />
            Refresh Analytics
          </button>
        </div>

        {/* ── Core KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active Corridors</span>
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{kpis.totalProjects}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{kpis.totalParcels} demarcated parcels</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Acquisition Area</span>
              <MapPin className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{kpis.totalAreaHectares} ha</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across {districtBreakdown.length} districts</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Compensation</span>
              <Landmark className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{(kpis.totalCompensationAssessed / 10000000).toFixed(2)} Cr
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              ₹{(kpis.totalCompensationDisbursed / 10000000).toFixed(2)} Cr disbursed ({kpis.disbursementRatePct}%)
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">National Risk Level</span>
              <Scale className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{kpis.averageRiskScore}/100</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Multi-factor rule-based aggregate</div>
          </div>
        </div>

        {/* ── CRITICAL DIFFERENTIATOR: Mutation Rate vs Physical Possession Rate ── */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-800 text-blue-200">
                <FileCheck className="h-3.5 w-3.5" />
                Statutory Gap Indicator
              </div>
              <h2 className="text-lg font-bold">
                Physical Possession Rate vs. Revenue Record Mutation Rate
              </h2>
              <p className="text-xs text-blue-200 leading-relaxed">
                A critical flaw in historical land acquisition reporting has been treating physical possession under §38 as &quot;acquisition complete.&quot;
                In revenue administration, mutating titles into state Land Records (7/12 extract / RoR) frequently lags behind physical possession by years.
                BhoomiSetu surfaces this gap distinctly to eliminate title ghosting.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center min-w-[140px]">
                <div className="text-[11px] text-blue-200 font-semibold uppercase">Possession Rate</div>
                <div className="text-3xl font-black text-blue-300 mt-1">{kpis.possessionRatePct}%</div>
                <div className="text-[10px] text-blue-200/80 mt-0.5">Physical control (§38)</div>
              </div>

              <div className="text-2xl font-light text-blue-400">vs</div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center min-w-[140px]">
                <div className="text-[11px] text-amber-200 font-semibold uppercase">Mutation Rate</div>
                <div className="text-3xl font-black text-amber-300 mt-1">{kpis.mutationCompletionRatePct}%</div>
                <div className="text-[10px] text-amber-200/80 mt-0.5">Legal RoR title transfer</div>
              </div>
            </div>
          </div>

          {kpis.mutationLagParcelsCount > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-amber-300 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>{kpis.mutationLagParcelsCount} parcels</strong> currently have physical possession taken without completed revenue title mutation in Tehsil records.
              </span>
            </div>
          )}
        </div>

        {/* ── Charts Grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: RAG Status Breakdown (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              Statutory RAG Health (RFCTLARR)
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Urgency distribution based on statutory 12-month deadlines</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {statusBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={RAG_COLORS[entry.status] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: 10-Stage Pipeline Dwelling Distribution (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-600" />
              10-Stage Pipeline Lifecycle Distribution
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Corridors currently active across the statutory lifecycle</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageDistribution}>
                  <XAxis dataKey="label" textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Trajectory & District Drill-Down ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Trajectory Area Chart (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Acquisition Activity Trajectory (Last 5 Months)
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Monthly trends in projects, notifications, and mutations</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrajectory}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="projects" name="Projects" stroke="#2563eb" fill="#dbeafe" />
                  <Area type="monotone" dataKey="notifications" name="Notifications (§11/19)" stroke="#d97706" fill="#fef3c7" />
                  <Area type="monotone" dataKey="mutations" name="Completed Mutations" stroke="#16a34a" fill="#dcfce7" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* District Table (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                District & State Compliance Breakdown
              </h3>
            </div>

            <div className="overflow-x-auto flex-1 max-h-64">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">District</th>
                    <th className="p-2.5">Projects</th>
                    <th className="p-2.5">Area (ha)</th>
                    <th className="p-2.5 text-right">Mutation %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {districtBreakdown.map((d) => (
                    <tr key={`${d.state}-${d.district}`} className="hover:bg-slate-50/60">
                      <td className="p-2.5 font-semibold text-slate-800">
                        {d.district}
                        <div className="text-[10px] text-slate-400 font-normal">{d.state}</div>
                      </td>
                      <td className="p-2.5 font-bold text-slate-700">{d.projectsCount}</td>
                      <td className="p-2.5 text-slate-600">{d.areaHectares}</td>
                      <td className="p-2.5 text-right font-bold text-slate-800">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${d.mutationRatePct >= 50 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {d.mutationRatePct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
