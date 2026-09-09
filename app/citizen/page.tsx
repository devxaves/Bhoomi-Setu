"use client";

/**
 * BhoomiSetu — Public Citizen Portal (/citizen)
 *
 * Implements Section 5.9 of the specification:
 * - Public, unauthenticated (with optional mock-OTP) ULPIN lookup
 * - Strictly scoped to return ONLY the queried parcel's own status
 * - Displays stage, award status, compensation status, mutation status, and
 *   the single associated family's R&R status via anonymized family_ref
 * - ZERO PII LEAKS: No claimant names, no phone numbers, no bank accounts
 * - Grievance submission form persisting directly to the grievances table
 */

import { useState } from "react";
import {
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  Banknote,
  Landmark,
  Users,
  ShieldCheck,
  AlertCircle,
  Send,
  Loader2,
  KeyRound,
  FileText,
  HelpCircle,
  Building2,
} from "lucide-react";
import type { CitizenParcelLookup } from "@/lib/db/queries/citizen";

const DEMO_ULPINS = [
  { ulpin: "29210301001001", label: "NH-48 Clear Title (Bantwal)" },
  { ulpin: "29210301001002", label: "NH-48 Disputed (Bantwal)" },
  { ulpin: "27014503005001", label: "Samruddhi Exp (Sinnar)" },
];

export default function CitizenPortalPage() {
  const [ulpinInput, setUlpinInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parcelData, setParcelData] = useState<CitizenParcelLookup | null>(null);

  // Mock OTP Flow
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("482910");
  const [verifiedOtp, setVerifiedOtp] = useState(false);

  // Grievance Form State
  const [grievanceCategory, setGrievanceCategory] = useState("compensation");
  const [grievanceMessage, setGrievanceMessage] = useState("");
  const [submittingGrievance, setSubmittingGrievance] = useState(false);
  const [grievanceResult, setGrievanceResult] = useState<string | null>(null);

  // Project Search State
  const [projectQuery, setProjectQuery] = useState("");
  const [projectResults, setProjectResults] = useState<any[]>([]);
  const [searchingProjects, setSearchingProjects] = useState(false);
  const [projectSearchError, setProjectSearchError] = useState<string | null>(null);

  const handleProjectSearch = async () => {
    const q = projectQuery.trim();
    if (q.length < 2) {
      setProjectSearchError("Enter at least 2 characters to search.");
      return;
    }
    setSearchingProjects(true);
    setProjectSearchError(null);
    setProjectResults([]);
    try {
      const res = await fetch(`/api/citizen/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) {
        setProjectSearchError(json.error || "No projects found.");
      } else {
        setProjectResults(json.data ?? []);
      }
    } catch {
      setProjectSearchError("Network error searching projects.");
    } finally {
      setSearchingProjects(false);
    }
  };

  const handleLookup = async (targetUlpin?: string) => {
    const queryUlpin = (targetUlpin || ulpinInput).trim();
    if (!queryUlpin) {
      setError("Please enter a 14-digit ULPIN / Bhu-Aadhaar number.");
      return;
    }

    setLoading(true);
    setError(null);
    setParcelData(null);
    setGrievanceResult(null);

    try {
      const res = await fetch(`/api/citizen/lookup?ulpin=${encodeURIComponent(queryUlpin)}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "No land acquisition records found for this ULPIN.");
      } else {
        setParcelData(json.data);
      }
    } catch {
      setError("Network error while verifying ULPIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGrievanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcelData || !grievanceMessage.trim()) return;

    setSubmittingGrievance(true);
    setGrievanceResult(null);
    try {
      const res = await fetch("/api/citizen/grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ulpin: parcelData.ulpin,
          category: grievanceCategory,
          message: grievanceMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGrievanceResult(`Error: ${data.error || "Failed to submit grievance."}`);
      } else {
        setGrievanceResult(data.message);
        setGrievanceMessage("");
      }
    } catch {
      setGrievanceResult("Network error submitting grievance.");
    } finally {
      setSubmittingGrievance(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Public Banner ─────────────────────────────────────────── */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Public Bhu-Aadhaar & RFCTLARR Status Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Citizen Land Acquisition Status Lookup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Check the statutory stage, compensation award, revenue record mutation, and R&R entitlements
            for your land parcel using your 14-digit ULPIN (Unique Land Parcel Identification Number).
          </p>
        </div>

        {/* ── Search Card ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                maxLength={14}
                placeholder="Enter 14-digit ULPIN (e.g. 29210301001001)"
                value={ulpinInput}
                onChange={(e) => setUlpinInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              onClick={() => handleLookup()}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Verify Status
            </button>
          </div>

          {/* Demo Quick Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-slate-400 font-medium">Quick Demo Samples:</span>
            {DEMO_ULPINS.map((chip) => (
              <button
                key={chip.ulpin}
                onClick={() => {
                  setUlpinInput(chip.ulpin);
                  handleLookup(chip.ulpin);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors border border-slate-200"
              >
                {chip.ulpin} ({chip.label})
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* ── Project Search (Public) ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800">Search Projects by Name or District</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. NH-48, Nashik, Highway Authority…"
                value={projectQuery}
                onChange={(e) => setProjectQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleProjectSearch()}
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              onClick={handleProjectSearch}
              disabled={searchingProjects}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {searchingProjects ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </div>

          {projectSearchError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {projectSearchError}
            </div>
          )}

          {projectResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {projectResults.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.land_requiring_body} · {p.district}, {p.state}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        p.status_flag === "green" ? "bg-green-100 text-green-700"
                        : p.status_flag === "amber" ? "bg-amber-100 text-amber-700"
                        : p.status_flag === "red" ? "bg-red-100 text-red-700"
                        : "bg-purple-100 text-purple-700"
                      }`}>
                        {p.status_flag?.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">Risk: {p.risk_score}</span>
                    </div>
                  </div>
                  <a
                    href={`/workflow/${p.id}`}
                    className="ml-3 shrink-0 text-xs font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                  >
                    View Details →
                  </a>
                </div>
              ))}
            </div>
          )}

          {!searchingProjects && projectResults.length === 0 && !projectSearchError && projectQuery.length >= 2 && (
            <p className="text-xs text-slate-400 text-center py-2">No projects found matching &ldquo;{projectQuery}&rdquo;</p>
          )}
        </div>

        {/* ── Scoped Parcel Status Card (ZERO PII LEAKS) ─────────────── */}
        {parcelData && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 animate-fade-in p-6">
            {/* Header / Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ULPIN: {parcelData.ulpin}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Survey {parcelData.survey_number}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {parcelData.village}, {parcelData.district}, {parcelData.state}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Project: <strong>{parcelData.project_name}</strong> · Area: <strong>{parcelData.area_hectares} hectares</strong> ({parcelData.land_type})
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Statutory Stage</div>
                <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mt-0.5 inline-block">
                  {parcelData.stage_label}
                </div>
              </div>
            </div>

            {/* 4 Entitlement Status Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tile 1: Compensation Award Status */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    Compensation Award (RFCTLARR §23)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      parcelData.compensation_status === "disbursed"
                        ? "bg-emerald-100 text-emerald-800"
                        : parcelData.compensation_status === "sanctioned"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {parcelData.compensation_status || (parcelData.has_award ? "Assessed" : "Pending Award")}
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  {parcelData.compensation_assessed ? (
                    <div>
                      Assessed Entitlement: <strong className="text-slate-900 font-mono">₹{parcelData.compensation_assessed.toLocaleString("en-IN")}</strong>
                      {parcelData.disbursed_on && (
                        <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          ✓ Direct benefit transfer disbursed on {parcelData.disbursed_on}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">Statutory award valuation has not been declared yet.</span>
                  )}
                </div>
              </div>

              {/* Tile 2: Revenue Record Mutation */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-blue-600" />
                    Revenue Record Title Mutation
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      parcelData.mutation_status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : parcelData.mutation_status === "filed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {parcelData.mutation_status}
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  {parcelData.mutation_status === "completed" ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Revenue title mutated in state Land Records (7/12 extract / RoR) on {parcelData.mutation_completed_on || "Recent"}.
                    </span>
                  ) : parcelData.mutation_status === "filed" ? (
                    <span className="text-blue-700">
                      Title transfer application filed with Tehsil office on {parcelData.mutation_filed_on || "Recent"}.
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Pre-mutation status. Mutation filing in revenue registry pending.
                    </span>
                  )}
                </div>
              </div>

              {/* Tile 3: R&R Resettlement Entitlements (ANONYMIZED) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-purple-600" />
                    Associated Family R&R Entitlement Status
                  </span>
                  {parcelData.family_ref && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                      Ref: {parcelData.family_ref}
                    </span>
                  )}
                </div>

                {parcelData.family_ref ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Displacement</div>
                      <div className="font-bold text-slate-800 mt-0.5">{parcelData.displaced ? "Displaced" : "Non-Displaced"}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Housing Allotment</div>
                      <div className="font-bold text-slate-800 mt-0.5 capitalize">{parcelData.housing_status || "Pending"}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Employment Status</div>
                      <div className="font-bold text-slate-800 mt-0.5 capitalize">{parcelData.employment_status || "Pending"}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Livelihood Restored</div>
                      <div className={`font-bold mt-0.5 ${parcelData.livelihood_restored ? "text-emerald-700" : "text-amber-700"}`}>
                        {parcelData.livelihood_restored ? "✓ Restored" : "In Progress"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No project-affected family recorded for this parcel or non-residential land.
                  </p>
                )}
              </div>
            </div>

            {/* ── Grievance Submission Form ─────────────────────────────── */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Submit Statutory Grievance to District Collector
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Notice an area discrepancy, delayed disbursement, or unfulfilled R&R entitlement?
                Your grievance is recorded in the official compliance audit log and forwarded to the Land Acquisition Officer.
              </p>

              <form onSubmit={handleGrievanceSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Grievance Category</label>
                    <select
                      value={grievanceCategory}
                      onChange={(e) => setGrievanceCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="compensation">Delayed Compensation Disbursement</option>
                      <option value="discrepancy">Area / Survey Number Discrepancy</option>
                      <option value="rr">Pending Housing / R&R Entitlement</option>
                      <option value="mutation">Revenue Mutation Title Issue</option>
                      <option value="general">General Statutory Enquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Detailed Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the issue with your parcel, compensation, or entitlements…"
                    value={grievanceMessage}
                    onChange={(e) => setGrievanceMessage(e.target.value)}
                    className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Grievance will be automatically tied to ULPIN {parcelData.ulpin}
                  </span>
                  <button
                    type="submit"
                    disabled={submittingGrievance || !grievanceMessage.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all"
                  >
                    {submittingGrievance ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Register Grievance
                  </button>
                </div>
              </form>

              {grievanceResult && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                  ✓ {grievanceResult}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
