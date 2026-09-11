"use client";

/**
 * BhoomiSetu — Admin Console (/admin)
 *
 * Tabs:
 * 1. Add Parcel       — form with MiniMapPolygon for geometry entry
 * 2. Add Project      — form with MiniMapPolygon for alignment drawing
 * 3. Mock Adapters    — test DILRMP / LACRRIS / BhoomiRashi / PFMS mock APIs
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { Shield, MapPin, Building2, Plug, Loader2, CheckCircle2, AlertTriangle, RefreshCw, Dice5 } from "lucide-react";
import type { Polygon, MultiPolygon } from "geojson";

const MiniMapPolygon = dynamic(() => import("@/components/map/MiniMapPolygon"), {
  ssr: false,
  loading: () => (
    <div className="h-72 bg-gray-100 rounded-lg flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
    </div>
  ),
});

// ── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "parcel" | "project" | "mock";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "parcel",  label: "Add Parcel",    icon: <MapPin className="h-4 w-4" /> },
  { id: "project", label: "Add Project",   icon: <Building2 className="h-4 w-4" /> },
  { id: "mock",    label: "Mock Adapters", icon: <Plug className="h-4 w-4" /> },
];

// ── Mock adapter keys ────────────────────────────────────────────────────────

const MOCK_ADAPTERS = [
  { key: "dilrmp",     label: "DILRMP",      color: "bg-blue-600",   desc: "Digital India Land Records Modernisation Programme" },
  { key: "lacrris",    label: "LACRRIS",     color: "bg-purple-600", desc: "Land Acquisition, Compensation, R&R Info System" },
  { key: "bhoomirashi",label: "BhoomiRashi", color: "bg-green-600",  desc: "Highway land acquisition compensation portal" },
  { key: "pfms",       label: "PFMS",        color: "bg-amber-600",  desc: "Public Financial Management System (disbursement)" },
] as const;

// ── ULPIN Auto-Generation ──────────────────────────────────────────────────
// Format: SSDD (state 2 + district 2) + 10 random digits = 14 digits total
// Indian state codes (Census 2011)

const STATE_CODES: Record<string, string> = {
  "Andhra Pradesh": "28", "Arunachal Pradesh": "12", "Assam": "18",
  "Bihar": "10", "Chhattisgarh": "22", "Goa": "30", "Gujarat": "24",
  "Haryana": "06", "Himachal Pradesh": "02", "Jharkhand": "20",
  "Karnataka": "29", "Kerala": "32", "Madhya Pradesh": "23",
  "Maharashtra": "27", "Manipur": "14", "Meghalaya": "17",
  "Mizoram": "15", "Nagaland": "13", "Odisha": "21",
  "Punjab": "03", "Rajasthan": "08", "Sikkim": "11",
  "Tamil Nadu": "33", "Telangana": "36", "Tripura": "16",
  "Uttar Pradesh": "09", "Uttarakhand": "05", "West Bengal": "19",
  "Delhi": "07", "Jammu and Kashmir": "01", "Ladakh": "38",
  "Chandigarh": "04", "Puducherry": "34", "Andaman and Nicobar Islands": "35",
  "Dadra and Nagar Haveli": "26", "Lakshadweep": "31",
};

function generateUlpin(state: string, district: string): string {
  const stateCode = STATE_CODES[state] || String(Math.floor(Math.random() * 90) + 10);
  const districtHash = district
    ? String(district.charCodeAt(0) % 10).padStart(1, "0") +
      String(district.length % 10)
    : String(Math.floor(Math.random() * 90) + 10);
  const randomPart = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
  return (stateCode + districtHash + randomPart).slice(0, 14);
}

// ── Parcel Form ─────────────────────────────────────────────────────────────

function AddParcelForm() {
  const [geom, setGeom] = useState<Polygon | null>(null);
  const [form, setForm] = useState({
    project_id: "", ulpin: "", survey_number: "", village: "", district: "", state: "",
    area_hectares: "", land_type: "agricultural", ownership_status: "clear",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Fetch projects for the selector
  const { data: projectsData } = useSWR<{ data: { id: string; name: string; district: string; state: string }[] }>(
    "/api/projects?limit=200",
    (url: string) => fetch(url).then((r) => r.json())
  );
  const projects = projectsData?.data ?? [];

  function handleField(field: string, value: string) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Auto-fill state/district from selected project
      if (field === "project_id" && value) {
        const proj = projects.find((p) => p.id === value);
        if (proj) {
          next.district = proj.district;
          next.state = proj.state;
        }
      }
      return next;
    });
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!geom) { setResult({ ok: false, message: "Please draw the parcel boundary on the map." }); return; }
    if (!form.ulpin.trim()) { setResult({ ok: false, message: "ULPIN is required." }); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ulpin: form.ulpin.trim(),
          project_id: form.project_id || undefined,
          survey_number: form.survey_number || undefined,
          village: form.village || undefined,
          district: form.district || undefined,
          state: form.state || undefined,
          area_hectares: form.area_hectares ? parseFloat(form.area_hectares) : undefined,
          land_type: form.land_type,
          geometry_geojson: geom,
          ownership_status: form.ownership_status,
          litigation_flag: Boolean((form as any).litigation_flag),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create parcel");

      // Auto-compute risk score for the new parcel
      let riskMsg = "";
      if (data.data?.id) {
        try {
          const riskRes = await fetch("/api/risk/compute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entityType: "parcel", entityId: data.data.id, persist: true }),
          });
          const riskData = await riskRes.json();
          if (riskData.success) {
            riskMsg = ` • Initial Risk Score: ${riskData.score.toFixed(1)}/100 (${riskData.riskCategory.toUpperCase()})`;
          }
        } catch {
          // non-blocking
        }
      }

      setResult({ ok: true, message: `Parcel ${form.ulpin} created — ID: ${data.data?.id}${riskMsg}` });
      setForm({ project_id: "", ulpin: "", survey_number: "", village: "", district: "", state: "", area_hectares: "", land_type: "agricultural", ownership_status: "clear" });
      setGeom(null);
    } catch (err) {
      setResult({ ok: false, message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: field inputs */}
      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-gray-700">Parcel Details</h2>

        {/* Project selector */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Link to Project <span className="text-gray-400">(optional)</span>
          </label>
          <select
            value={form.project_id}
            onChange={(e) => handleField("project_id", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">— No project (standalone parcel) —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.district}, {p.state})
              </option>
            ))}
          </select>
          {form.project_id && (
            <p className="text-[10px] text-green-600 mt-1">
              ✓ State & district auto-filled from project. Parcel will appear in project&apos;s atlas view.
            </p>
          )}
        </div>

        {[
          { label: "ULPIN (14-digit)", field: "ulpin", placeholder: "e.g. 27010100012345", required: true, autoGen: true },
          { label: "Survey Number", field: "survey_number", placeholder: "e.g. 45/2A" },
          { label: "Village", field: "village", placeholder: "e.g. Bhimashankar" },
          { label: "District", field: "district", placeholder: "e.g. Pune" },
          { label: "State", field: "state", placeholder: "e.g. Maharashtra" },
          { label: "Area (hectares)", field: "area_hectares", placeholder: "e.g. 2.45" },
        ].map(({ label, field, placeholder, required, autoGen }) => (
          <div key={field}>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder={placeholder}
                value={form[field as keyof typeof form]}
                onChange={(e) => handleField(field, e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {autoGen && (
                <button
                  type="button"
                  onClick={() => {
                    const ulpin = generateUlpin(form.state, form.district);
                    handleField("ulpin", ulpin);
                  }}
                  title="Auto-generate ULPIN from state + district"
                  className="px-2 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1 text-xs font-medium shrink-0"
                >
                  <Dice5 className="h-3.5 w-3.5" />
                  Generate
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Land Type</label>
            <select
              value={form.land_type}
              onChange={(e) => handleField("land_type", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {["agricultural", "commercial", "forest", "residential", "government", "other"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Ownership Status</label>
            <select
              value={form.ownership_status}
              onChange={(e) => handleField("ownership_status", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="clear">Clear</option>
              <option value="disputed">Disputed</option>
              <option value="under_verification">Under Verification</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="litigation_flag"
            checked={(form as any).litigation_flag ?? false}
            onChange={(e) => handleField("litigation_flag", e.target.checked ? "true" : "")}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <label htmlFor="litigation_flag" className="text-xs font-medium text-gray-700">
            Litigation Pending Flag (Civil / High Court stay injunction)
          </label>
        </div>

        {result && (
          <div className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Creating…" : "Create Parcel & Compute Risk"}
        </button>
      </div>

      {/* Right: polygon draw */}
      <div>
        <MiniMapPolygon value={geom} onChange={setGeom} height={400} />
      </div>
    </form>
  );
}

// ── Project Form ────────────────────────────────────────────────────────────

function AddProjectForm() {
  const [geom, setGeom] = useState<Polygon | null>(null);
  const [form, setForm] = useState({
    name: "", land_requiring_body: "", ministry: "", state: "", district: "",
    project_type: "highway",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          alignment_geojson: geom ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create project");
      setResult({ ok: true, message: `Project "${form.name}" created — ID: ${data.data?.id}` });
      setForm({ name: "", land_requiring_body: "", ministry: "", state: "", district: "", project_type: "highway" });
      setGeom(null);
    } catch (err) {
      setResult({ ok: false, message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-gray-700">Project Details</h2>
        {[
          { label: "Project Name", field: "name", placeholder: "e.g. NH-48 Widening Phase II", required: true },
          { label: "Land Requiring Body", field: "land_requiring_body", placeholder: "e.g. NHAI", required: true },
          { label: "Ministry", field: "ministry", placeholder: "e.g. MoRTH" },
          { label: "State", field: "state", placeholder: "e.g. Maharashtra", required: true },
          { label: "District", field: "district", placeholder: "e.g. Pune", required: true },
        ].map(({ label, field, placeholder, required }) => (
          <div key={field}>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              placeholder={placeholder}
              value={form[field as keyof typeof form]}
              onChange={(e) => handleField(field, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        ))}

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Project Type</label>
          <select
            value={form.project_type}
            onChange={(e) => handleField("project_type", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {["highway", "railway", "irrigation", "industrial_corridor", "power_line", "pipeline", "other"].map((v) => (
              <option key={v} value={v}>{v.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {result && (
          <div className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Creating…" : "Create Project"}
        </button>
      </div>

      <div>
        <MiniMapPolygon value={geom} onChange={setGeom} height={400} />
        <p className="text-xs text-gray-400 mt-1">
          Draw the project alignment corridor (optional — can also be uploaded via Atlas)
        </p>
      </div>
    </form>
  );
}

// ── Mock Adapters Panel ─────────────────────────────────────────────────────

function MockAdaptersPanel() {
  const [results, setResults] = useState<Record<string, { loading: boolean; data: Record<string, unknown> | null; error: string | null }>>({});

  const { data: logsData, mutate: mutateLogs, isValidating: logsLoading } = useSWR<{
    success: boolean;
    count: number;
    logs: { id: string; source: string; request: any; response: any; called_at: string }[];
  }>("/api/mock/logs", (url: string) => fetch(url).then((r) => r.json()));

  const logs = logsData?.logs ?? [];

  async function callAdapter(key: string) {
    setResults((prev) => ({ ...prev, [key]: { loading: true, data: null, error: null } }));
    try {
      const res = await fetch(`/api/mock/${key}`, { method: "GET" });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [key]: { loading: false, data, error: null } }));
      mutateLogs();
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [key]: { loading: false, data: null, error: (err as Error).message },
      }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 mb-1">
        <Plug className="h-5 w-5 text-purple-600" />
        <div>
          <h2 className="font-semibold text-gray-700">Mock Integration Adapters</h2>
          <p className="text-xs text-gray-400">
            All responses are clearly labeled <code className="bg-gray-100 px-1 rounded">source: &quot;mock-*&quot;</code> — no real government API access claimed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_ADAPTERS.map(({ key, label, color, desc }) => {
          const state = results[key];
          return (
            <div key={key} className="border rounded-xl p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white ${color} mr-2`}>
                    MOCK
                  </span>
                  <span className="font-semibold text-gray-800">{label}</span>
                </div>
                <button
                  onClick={() => callAdapter(key)}
                  disabled={state?.loading}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {state?.loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Ping
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">{desc}</p>

              {state?.error && (
                <div className="text-xs text-red-600 bg-red-50 rounded p-2">
                  ⚠ {state.error} — <span className="text-gray-400">Make sure <code>/api/mock/{key}</code> is implemented</span>
                </div>
              )}
              {state?.data && !state.loading && (
                <pre className="text-xs bg-gray-50 rounded-lg p-2 overflow-x-auto max-h-40 border border-gray-100 font-mono">
                  {JSON.stringify(state.data as Record<string, unknown>, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        💡 Federated Integration: Mock adapters log every call to <code className="bg-amber-100 rounded px-1 font-bold">mock_adapter_log</code> in the database to audit inter-departmental data exchange across DILRMP, LACRRIS, BhoomiRashi, and PFMS.
      </div>

      {/* Live Mock Adapter Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Live Mock Adapter Log (mock_adapter_log Table)
            </h3>
            <p className="text-[11px] text-slate-400">Audit of all inbound and outbound mock federated adapter payloads</p>
          </div>
          <button
            onClick={() => mutateLogs()}
            disabled={logsLoading}
            className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${logsLoading ? "animate-spin" : ""}`} />
            Refresh Log
          </button>
        </div>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-semibold">
              <tr>
                <th className="p-2.5">Source</th>
                <th className="p-2.5">Request Payload</th>
                <th className="p-2.5">Response Payload</th>
                <th className="p-2.5 text-right">Called At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    No mock adapter calls recorded yet. Click &quot;Ping&quot; above to log an integration call.
                  </td>
                </tr>
              ) : (
                logs.map((log: { id: string; source: string; request: unknown; response: unknown; called_at: string }) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                    <td className="p-2.5 font-bold text-slate-800">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                        {log.source}
                      </span>
                    </td>
                    <td className="p-2.5 max-w-[200px] truncate text-slate-600">
                      {typeof log.request === "object" ? JSON.stringify(log.request) : String(log.request ?? "")}
                    </td>
                    <td className="p-2.5 max-w-[260px] truncate text-slate-600">
                      {typeof log.response === "object" ? JSON.stringify(log.response) : String(log.response ?? "")}
                    </td>
                    <td className="p-2.5 text-right text-slate-400 font-sans text-[10px]">
                      {new Date(log.called_at).toLocaleTimeString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("parcel");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-green-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
          <p className="text-sm text-gray-500">Data entry, parcel geometry, mock integration testing</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-amber-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        {activeTab === "parcel"  && <AddParcelForm />}
        {activeTab === "project" && <AddProjectForm />}
        {activeTab === "mock"    && <MockAdaptersPanel />}
      </div>
    </div>
  );
}