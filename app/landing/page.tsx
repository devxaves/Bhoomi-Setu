import Link from "next/link"
import {
  Map,
  Upload,
  GitBranch,
  AlertTriangle,
  BarChart3,
  Archive,
  User,
  Shield,
  ArrowRight,
  Building2,
  Clock,
  CheckCircle2,
  Scale,
} from "lucide-react"

const MODULES = [
  {
    title: "GIS Atlas",
    description: "Interactive national map with ULPIN-keyed parcel polygons, project alignment overlays, and risk-scored color coding.",
    href: "/atlas",
    icon: Map,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Document Upload",
    description: "OCR + NER pipeline for scanned notifications, awards, and SIA reports with automatic discrepancy detection.",
    href: "/upload",
    icon: Upload,
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    title: "Statutory Workflow",
    description: "10-stage RFCTLARR pipeline with statutory deadline countdowns, RAG status escalation, and audit trail.",
    href: "/workflow",
    icon: GitBranch,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Risk Engine",
    description: "Explainable, rule-based risk scoring for projects and parcels — ownership disputes, litigation, deadline overruns.",
    href: "/risk",
    icon: AlertTriangle,
    color: "from-red-500 to-rose-500",
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    title: "Analytics Dashboard",
    description: "National/state/district KPI rollups, mutation completion rates, compensation disbursement tracking.",
    href: "/dashboard",
    icon: BarChart3,
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Digital Archive",
    description: "Multi-parameter searchable repository of all projects, parcels, awards — with CSV export and audit trails.",
    href: "/archive",
    icon: Archive,
    color: "from-slate-500 to-gray-600",
    bgColor: "bg-slate-50",
    iconColor: "text-slate-600",
  },
  {
    title: "Citizen Portal",
    description: "Public ULPIN lookup — affected landowners can check their parcel status, award details, and file grievances.",
    href: "/citizen",
    icon: User,
    color: "from-teal-500 to-emerald-500",
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    title: "Admin Console",
    description: "Operations console for data entry, polygon drawing, mock adapter testing, and user management.",
    href: "/admin",
    icon: Shield,
    color: "from-gray-700 to-gray-900",
    bgColor: "bg-gray-50",
    iconColor: "text-gray-700",
  },
]

const LIFECYCLE_STAGES = [
  { name: "Proposal", icon: "📋" },
  { name: "SIA", icon: "📊" },
  { name: "Sec. 11", icon: "📢" },
  { name: "Sec. 19", icon: "📜" },
  { name: "Award", icon: "💰" },
  { name: "Compensation", icon: "🏦" },
  { name: "Mutation", icon: "📝" },
  { name: "Possession", icon: "🔑" },
  { name: "R&R", icon: "🏠" },
  { name: "Closed", icon: "✅" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-emerald-50" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          {/* Top badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-sm font-medium">
              <Building2 className="w-4 h-4" />
              Smart India Hackathon 2025 · Problem Statement 26016
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-amber-600">Bhoomi</span>
              <span className="text-emerald-700">Setu</span>
            </h1>
            <p className="mt-2 text-lg sm:text-xl font-semibold text-gray-700">
              National Land Acquisition Control & Compliance Platform
            </p>
            <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Real-time tracking, GIS mapping, and AI-powered compliance for the
              <strong className="text-gray-700"> RFCTLARR Act, 2013</strong> lifecycle —
              from proposal through compensation, mutation, and R&R.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Dept. of Land Resources · Ministry of Rural Development
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 animate-fade-in">
            <Link
              href="/sign-in"
              className="btn-enhanced inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Shield className="w-4 h-4" />
              Sign In (Officials)
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/citizen"
              className="btn-enhanced inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg border border-emerald-200 shadow-sm hover:bg-emerald-50 hover:shadow-md transition-all duration-200"
            >
              <User className="w-4 h-4" />
              Citizen ULPIN Lookup
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto animate-fade-in">
            {[
              { label: "Statutory Stages", value: "10", icon: GitBranch },
              { label: "Deadline Tracking", value: "RAG", icon: Clock },
              { label: "Risk Scoring", value: "0–100", icon: AlertTriangle },
              { label: "ULPIN-Anchored", value: "14-digit", icon: CheckCircle2 },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 rounded-lg bg-white/60 border border-gray-100">
                <stat.icon className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <div className="text-xl font-bold text-gray-900 animate-count-up">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RFCTLARR Lifecycle Pipeline */}
      <section className="bg-white border-y py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center justify-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              RFCTLARR Act, 2013 — Complete Lifecycle
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              10-stage statutory pipeline with enforceable deadlines and RAG escalation
            </p>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-2">
            {LIFECYCLE_STAGES.map((stage, i) => (
              <div key={stage.name} className="flex items-center gap-2">
                <div className="stage-pill stage-pill-completed">
                  <span>{stage.icon}</span>
                  <span>{stage.name}</span>
                </div>
                {i < LIFECYCLE_STAGES.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module Grid */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Platform Modules</h2>
            <p className="text-muted-foreground mt-1">
              Comprehensive tooling for every stakeholder in the land acquisition lifecycle
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((mod, i) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="card-enhanced group block rounded-xl p-5 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${mod.bgColor} mb-3`}>
                  <mod.icon className={`w-5 h-5 ${mod.iconColor}`} />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                  {mod.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {mod.description}
                </p>
                <div className="mt-3 text-xs font-medium text-amber-600 group-hover:text-amber-700 flex items-center gap-1">
                  Open Module <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mock Integration Notice */}
      <section className="py-8 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            <span className="mock-badge">MOCK</span>
            External integrations (DILRMP, LACRRIS, BhoomiRashi, PFMS) are
            <strong> simulated mock adapters</strong> for demonstration — not connected to
            real government APIs.
          </div>
        </div>
      </section>
    </div>
  )
}