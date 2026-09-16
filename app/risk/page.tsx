"use client";

/**
 * BhoomiSetu — Risk & Decision Support Console (/risk)
 *
 * Implements Section 5.6 and 7.3 of the specification:
 *   - Sortable table of all projects & parcels by risk score
 *   - Per-entity "Why is this risky?" explainability breakdown panel
 *   - "Policy Simulation Mode" with live weight sliders (does not alter stored DB values)
 *   - Single-entity and batch recompute capabilities
 *   - Redesigned with White + Warm Orange palette, Sora & Space Grotesk typography
 */

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Search,
  Building2,
  MapPin,
  FileWarning,
  Scale,
  Users,
  Clock,
  ChevronRight,
  Info,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  type RiskRuleWeights,
  DEFAULT_RISK_WEIGHTS,
  type RiskFactorReason,
  getRiskCategory,
} from "@/lib/risk-types";

interface EntityRisk {
  entity_id: string;
  entity_type: "project" | "parcel";
  title: string;
  subtitle: string | null;
  district: string | null;
  state: string | null;
  current_stage?: string;
  status_flag?: string;
  ownership_status?: string;
  litigation_flag?: boolean;
  score: number;
  reasons: RiskFactorReason[];
  computed_at: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Fallback seed data if DB is initialising
const FALLBACK_ENTITIES: EntityRisk[] = [
  {
    entity_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    entity_type: "project",
    title: "Mumbai–Nagpur Expressway (Samruddhi Mahamarg)",
    subtitle: "Highway • Nashik, Maharashtra",
    district: "Nashik",
    state: "Maharashtra",
    current_stage: "compensation",
    status_flag: "red",
    score: 78.25,
    reasons: [
      {
        factor: "stage_dwell_urgency",
        label: "Statutory Stage Dwell Urgency",
        weight: 25,
        score: 22,
        maxScore: 25,
        severity: "high",
        explanation: "Section 19 statutory window has exceeded 90% dwell time before award passing. Collector escalation active.",
      },
      {
        factor: "disputed_ownership",
        label: "Title & Ownership Status",
        weight: 20,
        score: 16,
        maxScore: 20,
        severity: "high",
        explanation: "2 of 3 project parcels (67%) have disputed title in state revenue records with multiple competing claimants.",
      },
      {
        factor: "litigation_flag",
        label: "Pending Court Litigation",
        weight: 20,
        score: 20,
        maxScore: 20,
        severity: "critical",
        explanation: "Active High Court civil writ petition stay order pending against acquisition corridor in Sinnar taluka.",
      },
      {
        factor: "document_discrepancy",
        label: "Document OCR Discrepancies",
        weight: 20,
        score: 10,
        maxScore: 20,
        severity: "medium",
        explanation: "1 critical discrepancy flagged: extracted deed area differs by >5% from RoR village records.",
      },
      {
        factor: "rr_incompleteness",
        label: "R&R Resettlement Incompleteness",
        weight: 15,
        score: 10.25,
        maxScore: 15,
        severity: "high",
        explanation: "R&R rehabilitation pending for 2 of 3 affected families (66.7% incomplete across corridor).",
      },
    ],
    computed_at: new Date().toISOString(),
  },
  {
    entity_id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    entity_type: "parcel",
    title: "ULPIN: 29210301001002",
    subtitle: "Survey: SY/124/B • Bantwal",
    district: "Dakshina Kannada",
    state: "Karnataka",
    ownership_status: "disputed",
    litigation_flag: true,
    score: 72.5,
    reasons: [
      {
        factor: "stage_dwell_urgency",
        label: "Statutory Stage Dwell Urgency",
        weight: 25,
        score: 14,
        maxScore: 25,
        severity: "medium",
        explanation: "Associated project (NH-48 Expansion) statutory window is at 68.4% elapsed. Amber deadline alert issued.",
      },
      {
        factor: "disputed_ownership",
        label: "Title & Ownership Status",
        weight: 20,
        score: 20,
        maxScore: 20,
        severity: "critical",
        explanation: "Parcel ownership title is flagged as 'disputed' in revenue records. Multiple conflicting claimants recorded.",
      },
      {
        factor: "litigation_flag",
        label: "Pending Court Litigation",
        weight: 20,
        score: 20,
        maxScore: 20,
        severity: "critical",
        explanation: "Active civil court litigation injunction filed against acquisition of this parcel.",
      },
      {
        factor: "document_discrepancy",
        label: "Document OCR Discrepancies",
        weight: 20,
        score: 10,
        maxScore: 20,
        severity: "medium",
        explanation: "1 high-severity discrepancy: extracted award area exceeds revenue registry by 0.25 hectares.",
      },
      {
        factor: "rr_incompleteness",
        label: "R&R Resettlement Incompleteness",
        weight: 15,
        score: 8.5,
        maxScore: 15,
        severity: "medium",
        explanation: "1 displaced family has housing restoration pending verification.",
      },
    ],
    computed_at: new Date().toISOString(),
  },
  {
    entity_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    entity_type: "project",
    title: "NH-48 Expansion: Bangalore–Mangalore Highway Widening",
    subtitle: "Highway • Dakshina Kannada, Karnataka",
    district: "Dakshina Kannada",
    state: "Karnataka",
    current_stage: "section_11",
    status_flag: "amber",
    score: 42.5,
    reasons: [
      {
        factor: "stage_dwell_urgency",
        label: "Statutory Stage Dwell Urgency",
        weight: 25,
        score: 14,
        maxScore: 25,
        severity: "medium",
        explanation: "Section 11 statutory window is at 68.4% elapsed. Section 19 declaration pending.",
      },
      {
        factor: "disputed_ownership",
        label: "Title & Ownership Status",
        weight: 20,
        score: 6.67,
        maxScore: 20,
        severity: "medium",
        explanation: "1 of 3 project parcels (33%) has disputed ownership title.",
      },
      {
        factor: "litigation_flag",
        label: "Pending Court Litigation",
        weight: 20,
        score: 6.67,
        maxScore: 20,
        severity: "medium",
        explanation: "1 parcel has active civil court stay petition pending.",
      },
      {
        factor: "document_discrepancy",
        label: "Document OCR Discrepancies",
        weight: 20,
        score: 10,
        maxScore: 20,
        severity: "medium",
        explanation: "Discrepancy detected in boundary schedule vs notified revenue survey map.",
      },
      {
        factor: "rr_incompleteness",
        label: "R&R Resettlement Incompleteness",
        weight: 15,
        score: 5.16,
        maxScore: 15,
        severity: "low",
        explanation: "R&R plan draft approved; preliminary family claims submitted.",
      },
    ],
    computed_at: new Date().toISOString(),
  },
  {
    entity_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    entity_type: "project",
    title: "Tungabhadra Irrigation Canal Extension",
    subtitle: "Irrigation • Bellary, Karnataka",
    district: "Bellary",
    state: "Karnataka",
    current_stage: "award",
    status_flag: "green",
    score: 18.75,
    reasons: [
      {
        factor: "stage_dwell_urgency",
        label: "Statutory Stage Dwell Urgency",
        weight: 25,
        score: 0,
        maxScore: 25,
        severity: "low",
        explanation: "Statutory timelines compliant (42.1% elapsed for Section 19 declaration).",
      },
      {
        factor: "disputed_ownership",
        label: "Title & Ownership Status",
        weight: 20,
        score: 0,
        maxScore: 20,
        severity: "low",
        explanation: "All demarcated project parcels have clear, verified ownership titles.",
      },
      {
        factor: "litigation_flag",
        label: "Pending Court Litigation",
        weight: 20,
        score: 0,
        maxScore: 20,
        severity: "low",
        explanation: "Zero parcels under this corridor are subject to active court litigation.",
      },
      {
        factor: "document_discrepancy",
        label: "Document OCR Discrepancies",
        weight: 20,
        score: 0,
        maxScore: 20,
        severity: "low",
        explanation: "All uploaded legal and survey documents match parcel records without discrepancy.",
      },
      {
        factor: "rr_incompleteness",
        label: "R&R Resettlement Incompleteness",
        weight: 15,
        score: 18.75,
        maxScore: 15,
        severity: "low",
        explanation: "R&R rehabilitation complete for displaced agricultural families.",
      },
    ],
    computed_at: new Date().toISOString(),
  },
];

export default function RiskConsolePage() {
  // SWR data fetch
  const { data, error, mutate, isValidating } = useSWR<{
    success: boolean;
    scores: EntityRisk[];
  }>("/api/risk/scores", fetcher, { revalidateOnFocus: false });

  const rawEntities = useMemo(() => {
    if (data?.scores && data.scores.length > 0) return data.scores;
    return FALLBACK_ENTITIES;
  }, [data]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "project" | "parcel">("all");
  const [sortBy, setSortBy] = useState<"score_desc" | "score_asc" | "title">("score_desc");
  const [selectedId, setSelectedId] = useState<string>(FALLBACK_ENTITIES[0].entity_id);

  // Policy Simulation State
  const [simulationMode, setSimulationMode] = useState(false);
  const [simWeights, setSimWeights] = useState<RiskRuleWeights>(DEFAULT_RISK_WEIGHTS);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [recomputeFeedback, setRecomputeFeedback] = useState<string | null>(null);

  // Filtered & Sorted list
  const filteredEntities = useMemo(() => {
    return rawEntities
      .filter((e) => {
        if (typeFilter !== "all" && e.entity_type !== typeFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.subtitle && e.subtitle.toLowerCase().includes(q)) ||
          (e.district && e.district.toLowerCase().includes(q)) ||
          (e.state && e.state.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "score_desc") return b.score - a.score;
        if (sortBy === "score_asc") return a.score - b.score;
        return a.title.localeCompare(b.title);
      });
  }, [rawEntities, typeFilter, searchQuery, sortBy]);

  // Active selected entity
  const activeEntity = useMemo(() => {
    return (
      rawEntities.find((e) => e.entity_id === selectedId) ||
      filteredEntities[0] ||
      rawEntities[0]
    );
  }, [rawEntities, filteredEntities, selectedId]);

  // If selectedId not in filtered, update selection
  useEffect(() => {
    if (filteredEntities.length > 0 && !filteredEntities.find((e) => e.entity_id === selectedId)) {
      setSelectedId(filteredEntities[0].entity_id);
    }
  }, [filteredEntities, selectedId]);

  // Compute Simulated Score for active entity
  const simulatedScoreData = useMemo(() => {
    if (!activeEntity || !activeEntity.reasons) {
      return { score: activeEntity?.score || 0, reasons: [] };
    }

    if (!simulationMode) {
      return { score: activeEntity.score, reasons: activeEntity.reasons };
    }

    const newReasons = activeEntity.reasons.map((r) => {
      const newWeight = simWeights[r.factor] ?? r.weight;
      const ratio = r.maxScore > 0 ? r.score / r.maxScore : 0;
      const newScore = Math.round(ratio * newWeight * 100) / 100;
      return {
        ...r,
        weight: newWeight,
        maxScore: newWeight,
        score: newScore,
      };
    });

    const total = Math.min(
      100,
      Math.max(
        0,
        Math.round(newReasons.reduce((sum, r) => sum + r.score, 0) * 100) / 100
      )
    );

    return { score: total, reasons: newReasons };
  }, [activeEntity, simulationMode, simWeights]);

  // Single Entity Recompute
  const handleRecomputeEntity = async (entity: EntityRisk) => {
    setIsRecomputing(true);
    setRecomputeFeedback(null);
    try {
      const res = await fetch("/api/risk/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: entity.entity_type,
          entityId: entity.entity_id,
          persist: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRecomputeFeedback(`Risk evaluated: ${data.score}/100`);
        mutate();
      } else {
        setRecomputeFeedback(data.error || "Evaluation failed.");
      }
    } catch {
      setRecomputeFeedback("Network error running risk engine.");
    } finally {
      setIsRecomputing(false);
      setTimeout(() => setRecomputeFeedback(null), 4000);
    }
  };

  // Batch Recompute All
  const handleBatchRecompute = async () => {
    setIsRecomputing(true);
    setRecomputeFeedback("Batch recomputing all projects & parcels…");
    try {
      const res = await fetch("/api/risk/recompute-all", { method: "POST" });
      const resData = await res.json();
      if (resData.success) {
        setRecomputeFeedback(resData.message);
        mutate();
      } else {
        setRecomputeFeedback(resData.error || "Batch recompute failed.");
      }
    } catch {
      setRecomputeFeedback("Batch recompute failed.");
    } finally {
      setIsRecomputing(false);
      setTimeout(() => setRecomputeFeedback(null), 5000);
    }
  };

  // High, medium, low counts
  const highRiskCount = rawEntities.filter((e) => e.score >= 60).length;
  const mediumRiskCount = rawEntities.filter((e) => e.score >= 30 && e.score < 60).length;
  const lowRiskCount = rawEntities.filter((e) => e.score < 30).length;

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Header ─────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden animate-fade-in">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    <Sparkles className="w-3 h-3 text-orange-500" />
                    Explainable AI Engine
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-slate-600 border border-slate-200">
                    RFCTLARR §11–44
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight mt-1">
                  Risk & Decision Support Console
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Multi-factor explainable statutory risk assessment, policy simulator, and legal dispute tracking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                onClick={() => setSimulationMode(!simulationMode)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  simulationMode
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-700 shadow-sm"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                {simulationMode ? "Simulation Active" : "Policy Simulation Mode"}
              </button>

              <button
                onClick={handleBatchRecompute}
                disabled={isRecomputing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRecomputing ? "animate-spin" : ""}`} />
                Recompute All
              </button>
            </div>
          </div>

          {/* Feedback alert */}
          {recomputeFeedback && (
            <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
              <div className="px-4 py-2.5 rounded-xl text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200 flex items-center justify-between">
                <span>{recomputeFeedback}</span>
                <button
                  onClick={() => setRecomputeFeedback(null)}
                  className="text-orange-600 hover:text-orange-800 font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── KPI Metrics Bar ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">Assessed Entities</div>
              <div className="text-xl font-heading font-bold text-slate-900">{rawEntities.length}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-red-200/80 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-red-500 font-mono">Critical (≥60)</div>
              <div className="text-xl font-heading font-bold text-red-600">{highRiskCount}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-amber-500 font-mono">Moderate (30–60)</div>
              <div className="text-xl font-heading font-bold text-amber-600">{mediumRiskCount}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-emerald-500 font-mono">Low Risk (&lt;30)</div>
              <div className="text-xl font-heading font-bold text-emerald-600">{lowRiskCount}</div>
            </div>
          </div>
        </div>

        {/* ── Main Two-Column Layout ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ─────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN: Entities Table & Filters (7 cols)               */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            {/* Table Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search entity, ULPIN, district…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Type toggle */}
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-xs font-medium">
                  {(["all", "project", "parcel"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1 rounded-lg capitalize transition-all ${
                        typeFilter === t
                          ? "bg-white text-slate-900 shadow-sm font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {t === "all" ? "All" : t + "s"}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value="score_desc">Highest Risk First</option>
                  <option value="score_asc">Lowest Risk First</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Entity List Table */}
            <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
              {filteredEntities.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No entities found matching your filters.
                </div>
              ) : (
                filteredEntities.map((item) => {
                  const isSelected = item.entity_id === activeEntity?.entity_id;
                  const cat = getRiskCategory(item.score);

                  return (
                    <div
                      key={item.entity_id}
                      onClick={() => setSelectedId(item.entity_id)}
                      className={`p-4 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 border-l-4 ${
                        isSelected
                          ? "bg-orange-50/50 border-orange-500 shadow-inner"
                          : "hover:bg-slate-50/70 border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                            item.entity_type === "project"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {item.entity_type === "project" ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-heading font-bold text-slate-900 truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {item.entity_type}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.subtitle || `${item.district}, ${item.state}`}
                          </div>

                          {/* Top risk reason teaser */}
                          {item.reasons && item.reasons.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                              <span className="font-semibold text-slate-700">Driver:</span>
                              <span className="truncate max-w-[280px]">
                                {item.reasons.find((r) => r.score > 0)?.label || "Statutory Compliance"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: Score badge */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                              cat === "high"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : cat === "medium"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            <span>{item.score.toFixed(1)}</span>
                            <span className="text-[10px] font-normal opacity-75">/100</span>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 capitalize font-mono">
                            {cat} Risk
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN: Explainability Breakdown & Simulation (5 cols)*/}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Entity Header & Score Overview Card */}
            {activeEntity && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                        {activeEntity.entity_type}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {activeEntity.entity_id.slice(0, 8)}…
                      </span>
                    </div>
                    <h2 className="text-base font-heading font-bold text-slate-900 mt-1.5">
                      {activeEntity.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeEntity.subtitle || `${activeEntity.district}, ${activeEntity.state}`}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRecomputeEntity(activeEntity)}
                    disabled={isRecomputing}
                    title="Re-run explainable rules against live database"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRecomputing ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Score Big Display */}
                <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide font-mono">
                      {simulationMode ? "Simulated Score" : "Assessed Risk Score"}
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span
                        className={`text-3xl font-heading font-black ${
                          simulatedScoreData.score >= 60
                            ? "text-red-600"
                            : simulatedScoreData.score >= 30
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {simulatedScoreData.score.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">/ 100</span>
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full capitalize ${
                          simulatedScoreData.score >= 60
                            ? "bg-red-100 text-red-800"
                            : simulatedScoreData.score >= 30
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {getRiskCategory(simulatedScoreData.score)} Risk
                      </span>
                    </div>

                    {simulationMode && (
                      <div className="text-xs text-slate-600 mt-2 flex items-center gap-1.5 font-mono">
                        <span>Stored: <strong>{activeEntity.score.toFixed(1)}</strong></span>
                        <span>→</span>
                        <span
                          className={`font-bold ${
                            simulatedScoreData.score > activeEntity.score
                              ? "text-red-600"
                              : simulatedScoreData.score < activeEntity.score
                              ? "text-emerald-600"
                              : "text-slate-600"
                          }`}
                        >
                          {simulatedScoreData.score > activeEntity.score ? "+" : ""}
                          {(simulatedScoreData.score - activeEntity.score).toFixed(1)} pts
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                    {simulatedScoreData.score >= 60 ? (
                      <AlertTriangle className="h-7 w-7 text-red-500" />
                    ) : simulatedScoreData.score >= 30 ? (
                      <Clock className="h-7 w-7 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Policy Simulation Mode Slider Box ─────────────────────── */}
            {simulationMode && (
              <div className="bg-orange-50/70 rounded-2xl border border-orange-200 p-5 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between border-b border-orange-200/80 pb-3">
                  <div className="flex items-center gap-2 text-orange-950 font-heading font-bold text-xs">
                    <Sparkles className="h-4 w-4 text-orange-600" />
                    Policy Simulation Sliders
                  </div>
                  <button
                    onClick={() => setSimWeights(DEFAULT_RISK_WEIGHTS)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-orange-800 hover:text-orange-950 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset Weights
                  </button>
                </div>

                <p className="text-[11px] text-orange-900/80 mt-2 mb-3 leading-relaxed">
                  Adjust rule weights to simulate statutory policy changes. Does <strong>not</strong> modify stored production database values.
                </p>

                <div className="space-y-3">
                  {(
                    [
                      { key: "stage_dwell_urgency", label: "Stage Dwell Urgency" },
                      { key: "disputed_ownership", label: "Disputed Ownership" },
                      { key: "litigation_flag", label: "Court Litigation" },
                      { key: "document_discrepancy", label: "OCR Document Discrepancy" },
                      { key: "rr_incompleteness", label: "R&R Incompleteness" },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 mb-1 font-mono">
                        <span>{label}</span>
                        <span className="font-bold text-orange-900">
                          {simWeights[key]} pts ({(simWeights[key] / 100 * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={simWeights[key]}
                        onChange={(e) =>
                          setSimWeights({
                            ...simWeights,
                            [key]: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-orange-600 h-1.5 bg-orange-200/70 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Explainability: Contributing Factors List ─────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                  <Info className="h-3.5 w-3.5 text-orange-500" />
                  Contributing Risk Factors (Explainability)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {simulatedScoreData.reasons.length} Rules Applied
                </span>
              </div>

              <div className="space-y-3">
                {simulatedScoreData.reasons.map((reason) => {
                  const pct = reason.maxScore > 0 ? (reason.score / reason.maxScore) * 100 : 0;
                  const isCritical = reason.severity === "critical" || pct >= 80;
                  const isHigh = reason.severity === "high" || pct >= 50;

                  return (
                    <div
                      key={reason.factor}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-orange-50/20 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              isCritical
                                ? "bg-red-500"
                                : isHigh
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span className="text-xs font-heading font-bold text-slate-800">
                            {reason.label}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            reason.score > 0
                              ? isCritical
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {reason.score.toFixed(1)} / {reason.maxScore} pts
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200/70 h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCritical
                              ? "bg-red-500"
                              : isHigh
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                        />
                      </div>

                      {/* Human-readable rationale explanation */}
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-2">
                        {reason.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
