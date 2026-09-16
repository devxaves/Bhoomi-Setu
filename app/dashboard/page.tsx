"use client";

/**
 * BhoomiSetu — Executive Compliance & Operations Dashboard (/dashboard)
 *
 * Implements Section 5.7 of the specification:
 * - Hand-written SQL aggregations across projects, parcels, awards, and mutations
 * - CRITICAL: Mutation Completion Rate presented separately from Physical Possession Rate
 * - Recharts visualizations: RAG status distribution, 10-stage pipeline, monthly trend,
 *   district drill-down
 * - Redesigned with White + Warm Orange palette, Sora & Space Grotesk typography
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
  ArrowUpRight,
  Sparkles,
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
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  lapsed: "#8B5CF6",
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
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle ambient decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Header ─────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500" />
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                <Sparkles className="w-3 h-3 text-orange-500" />
                Executive Compliance Console
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                PM GatiShakti & RFCTLARR 2013 Aligned
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 mt-1.5 tracking-tight">
              National Land Acquisition Operations & Compliance
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Department of Land Resources (DoLR), Ministry of Rural Development · Real-time statutory metrics
            </p>
          </div>

          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-700 shadow-sm transition-all duration-200 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-orange-600 ${isValidating ? "animate-spin" : ""}`} />
            {isValidating ? "Refreshing..." : "Refresh Analytics"}
          </button>
        </div>

        {/* ── Core KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Corridors</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-2">
              {kpis.totalProjects}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              {kpis.totalParcels} demarcated parcels
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Acquisition Area</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-2">
              {kpis.totalAreaHectares} <span className="text-sm font-normal text-slate-500">ha</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Across {districtBreakdown.length} districts
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Compensation</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Landmark className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-2">
              ₹{(kpis.totalCompensationAssessed / 10000000).toFixed(2)} <span className="text-sm font-normal text-slate-500">Cr</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold font-mono mt-1">
              ₹{(kpis.totalCompensationDisbursed / 10000000).toFixed(2)} Cr ({kpis.disbursementRatePct}%)
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">National Risk</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-2">
              {kpis.averageRiskScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Multi-factor rule index
            </div>
          </div>
        </div>

        {/* ── CRITICAL DIFFERENTIATOR: Mutation Rate vs Physical Possession Rate ── */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#1A1A2E] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800/80">
          {/* Slow Ambient Floating Orbs */}
          <div className="absolute -left-12 -top-12 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl animate-float-slow pointer-events-none" />
          <div className="absolute right-0 -bottom-16 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-float-slow-reverse pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />

          {/* Drifting Cadastral Grid Texture */}
          <div className="absolute inset-0 opacity-[0.07] bg-grid animate-grid-drift pointer-events-none" />

          {/* Slow Scanning Light Beam */}
          <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-orange-400/10 to-transparent animate-scan-beam pointer-events-none" />

          {/* Ambient Top Glow Line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                <FileCheck className="h-3.5 w-3.5" />
                Statutory Gap Indicator
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-white">
                Physical Possession Rate vs. Revenue Record Mutation Rate
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                A critical flaw in historical land acquisition reporting has been treating physical possession under §38 as &quot;acquisition complete.&quot;
                In revenue administration, mutating titles into state Land Records (7/12 extract / RoR) frequently lags behind physical possession by years.
                BhoomiSetu surfaces this gap distinctly to eliminate title ghosting.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 self-start lg:self-auto">
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/80 text-center min-w-[140px] shadow-lg relative group overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                <div className="text-[11px] text-blue-300 font-semibold uppercase tracking-wider relative z-10">Possession Rate</div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-blue-300 mt-1 relative z-10">{kpis.possessionRatePct}%</div>
                <div className="text-[10px] text-blue-200/70 mt-1 relative z-10">Physical control (§38)</div>
              </div>

              <div className="text-2xl font-light text-slate-500">vs</div>

              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/80 text-center min-w-[140px] shadow-lg relative group overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider relative z-10">Mutation Rate</div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-amber-300 mt-1 relative z-10">{kpis.mutationCompletionRatePct}%</div>
                <div className="text-[10px] text-amber-200/70 mt-1 relative z-10">Legal RoR title transfer</div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Charts Grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: RAG Status Breakdown (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col hover:border-orange-200 transition-all">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-orange-600" />
              Statutory RAG Health (RFCTLARR)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Urgency distribution based on statutory 12-month deadlines</p>

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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: 10-Stage Pipeline Dwelling Distribution (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col hover:border-orange-200 transition-all">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-2">
              <Layers className="h-4 w-4 text-orange-600" />
              10-Stage Pipeline Lifecycle Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">Corridors currently active across the statutory lifecycle</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageDistribution}>
                  <XAxis dataKey="label" textAnchor="end" interval={0} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#EA7E30" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Trajectory & District Drill-Down ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Trajectory Area Chart (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:border-orange-200 transition-all">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Acquisition Activity Trajectory (Last 5 Months)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Monthly trends in projects, notifications, and mutations</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrajectory}>
                  <defs>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNotifications" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EA7E30" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EA7E30" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMutations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="projects" name="Projects" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorProjects)" />
                  <Area type="monotone" dataKey="notifications" name="Notifications (§11/19)" stroke="#EA7E30" strokeWidth={2} fillOpacity={1} fill="url(#colorNotifications)" />
                  <Area type="monotone" dataKey="mutations" name="Completed Mutations" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorMutations)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* District Table (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:border-orange-200 transition-all">
            <div className="p-5 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                <span>District & State Compliance Breakdown</span>
                <span className="text-[10px] font-normal text-slate-400">{districtBreakdown.length} regions</span>
              </h3>
            </div>

            <div className="overflow-x-auto flex-1 max-h-64">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 text-[10px] uppercase font-semibold font-mono">
                  <tr>
                    <th className="p-3">District</th>
                    <th className="p-3">Projects</th>
                    <th className="p-3">Area (ha)</th>
                    <th className="p-3 text-right">Mutation %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {districtBreakdown.map((d) => (
                    <tr key={`${d.state}-${d.district}`} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">
                        {d.district}
                        <div className="text-[10px] text-slate-400 font-normal">{d.state}</div>
                      </td>
                      <td className="p-3 font-bold font-mono text-slate-700">{d.projectsCount}</td>
                      <td className="p-3 font-mono text-slate-600">{d.areaHectares}</td>
                      <td className="p-3 text-right font-bold">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono inline-block ${
                          d.mutationRatePct >= 50
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
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
