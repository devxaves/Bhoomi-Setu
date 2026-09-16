"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import {
  MapPin,
  Upload,
  GitBranch,
  AlertTriangle,
  BarChart3,
  Archive,
  Search,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Landmark,
  Shield,
  ChevronRight,
  Scale,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  FileCheck2,
  Building2,
  Layers,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [ulpinInput, setUlpinInput] = useState("");
  const [activeStage, setActiveStage] = useState(4); // Default to Sec 19 Final Declaration

  const handleUlpinSearch = (e?: React.FormEvent, customUlpin?: string) => {
    if (e) e.preventDefault();
    const query = (customUlpin || ulpinInput).trim();
    router.push(query ? `/citizen?ulpin=${encodeURIComponent(query)}` : "/citizen");
  };

  const handleDemoUlpin = (ulpin: string) => {
    setUlpinInput(ulpin);
    router.push(`/citizen?ulpin=${encodeURIComponent(ulpin)}`);
  };

  // ── Core Modules ────────────────────────────────────────────────────
  const modules = [
    {
      category: "SPATIAL CADASTRAL",
      title: language === "hi" ? "जीआईएस एटलस" : language === "bn" ? "জিআইএস অ্যাটলাস" : language === "kn" ? "ಜಿಐಎಸ್ ಅಟ್ಲಾಸ್" : "GIS Cadastral Atlas",
      desc: language === "hi" ? "14-अंकीय यूलपिन भूखंड मानचित्र, परियोजना ओवरले और जोखिम रंग कोडिंग।" : language === "bn" ? "14-ডিজিট ইউএলপিআইএন মানচিত্র ও প্রকল্প ওভারলে।" : language === "kn" ? "14-ಅಂಕಿಯ ಯುಎಲ್‌ಪಿಐಎನ್ ನಕ್ಷೆ ಮತ್ತು ಯೋಜನೆ ಓವರ್ಲೇ." : "14-digit ULPIN parcel map with project corridor overlays and risk heat-coding.",
      href: "/atlas",
      icon: MapPin,
      accent: "text-blue-600",
      bg: "bg-blue-50",
      badge: "Sentinel-2 + Cadastral",
    },
    {
      category: "STATUTORY PIPELINE",
      title: language === "hi" ? "10-चरणीय कार्यप्रवाह" : language === "bn" ? "10-ধাপ কর্মপ্রবাহ" : language === "kn" ? "10-ಹಂತ ವರ್ಕ್‌ಫ್ಲೋ" : "Statutory Workflow",
      desc: language === "hi" ? "आरएफसीटीएलएआरआर 2013 अनुपालन पाइपलाइन, समयसीमा उलटी गिनती और आरएजी अलर्ट।" : language === "bn" ? "আরএফসিটিএলএআরআর ২০১৩ অনুযায়ী সময়সীমা ট্র্যাকিং ও আরএজি সতর্কতা।" : language === "kn" ? "RFCTLARR 2013 ಗಡುವು ಕೌಂಟ್‌ಡೌನ್ ಮತ್ತು RAG ಎಚ್ಚರಿಕೆ." : "RFCTLARR 2013 compliance pipeline with deadline countdowns and RAG escalation.",
      href: "/workflow",
      icon: GitBranch,
      accent: "text-orange-600",
      bg: "bg-orange-50",
      badge: "RFCTLARR §11–§38",
    },
    {
      category: "PUBLIC ACCESS",
      title: language === "hi" ? "नागरिक पोर्टल" : language === "bn" ? "নাগরিক পোর্টাল" : language === "kn" ? "ನಾಗರಿಕ ಪೋರ್ಟಲ್" : "Citizen Portal",
      desc: language === "hi" ? "14-अंकीय यूलपिन से भू-स्थिति जांच, मुआवजा विवरण और ऑनलाइन आपत्ति दर्ज करें।" : language === "bn" ? "14-ডিজিট ইউএলপিআইএন দিয়ে জমির স্থিতি, ক্ষতিপূরণ দেখুন।" : language === "kn" ? "14-ಅಂಕಿ ULPIN ಮೂಲಕ ಭೂ ಸ್ಥಿತಿ, ಪರಿಹಾರ ವಿವರ ಮತ್ತು ದೂರು ಸಲ್ಲಿಸಿ." : "Look up parcel status, review compensation, and file online grievances by ULPIN.",
      href: "/citizen",
      icon: Landmark,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
      badge: "Zero-Auth Public",
    },
    {
      category: "LEGAL OCR / NER",
      title: language === "hi" ? "दस्तावेज़ ओसीआर" : language === "bn" ? "ডকুমেন্ট ওসিআর" : language === "kn" ? "ದಾಖಲೆ ಓಸಿಆರ್" : "Document OCR",
      desc: language === "hi" ? "स्कैन किए गए गजट, धारा 11/19 नोटिफिकेशन से स्वचालित खसरा और मालिक नाम निष्कर्षण।" : language === "bn" ? "স্ক্যান করা গেজেট থেকে দাগ ও মালিকের নাম স্বয়ংক্রিয় নিষ্কাশন।" : language === "kn" ? "ಸ್ಕ್ಯಾನ್ ಗೆಜೆಟ್‌ಗಳಿಂದ ಸರ್ವೆ ನಂಬರ್ ಮತ್ತು ಮಾಲೀಕ ಹೆಸರು ಹೊರತೆಗೆಯುವಿಕೆ." : "Auto-extract survey numbers and owner names from scanned gazette notifications.",
      href: "/upload",
      icon: Upload,
      accent: "text-violet-600",
      bg: "bg-violet-50",
      badge: "Bilingual NER",
    },
    {
      category: "EXPLAINABLE AI",
      title: language === "hi" ? "जोखिम इंजन" : language === "bn" ? "ঝুঁকি মূল্যায়ন" : language === "kn" ? "ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ" : "Risk Engine",
      desc: language === "hi" ? "स्वामित्व विवाद, मुकदमेबाजी और समयसीमा चूक के लिए पारदर्शी नियम-आधारित जोखिम स्कोरिंग।" : language === "bn" ? "মালিকানা বিরোধ ও মামলার জন্য নিয়ম-ভিত্তিক ঝুঁকি মূল্যায়ন।" : language === "kn" ? "ಮಾಲೀಕತ್ವ ವಿವಾದ ಮತ್ತು ಮೊಕದ್ದಮೆಗಾಗಿ ನಿಯಮ-ಆಧಾರಿತ ಅಪಾಯ ಸ್ಕೋರಿಂಗ್." : "Rule-based risk scoring for ownership disputes, litigation, and deadline overruns.",
      href: "/risk",
      icon: AlertTriangle,
      accent: "text-rose-600",
      bg: "bg-rose-50",
      badge: "Multi-Factor Scoring",
    },
    {
      category: "EXECUTIVE ANALYTICS",
      title: language === "hi" ? "कार्यपालक डैशबोर्ड" : language === "bn" ? "এক্সিকিউটিভ ড্যাশবোর্ড" : language === "kn" ? "ಕಾರ್ಯನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" : "Analytics Dashboard",
      desc: language === "hi" ? "राज्य और जिला-स्तरीय केपीआई, दाखिल-खारिज दर और डीबीटी मुआवजा वितरण ट्रैकिंग।" : language === "bn" ? "রাজ্য ও জেলা স্তরে কেপিআই এবং ডিবিটি ক্ষতিপূরণ ট্র্যাকিং।" : language === "kn" ? "ರಾಜ್ಯ ಮತ್ತು ಜಿಲ್ಲಾ ಮಟ್ಟದ ಕೆಪಿಐ ಮತ್ತು ಡಿಬಿಟಿ ಮೇಲ್ವಿಚಾರಣೆ." : "District and state-level KPI rollups, mutation completion, and DBT disbursement metrics.",
      href: "/dashboard",
      icon: BarChart3,
      accent: "text-amber-600",
      bg: "bg-amber-50",
      badge: "PFMS + DILRMP Sync",
    },
  ];

  // ── RFCTLARR Statutory 4 Phases ─────────────────────────────────────
  const phases = [
    { id: 1, name: "Planning & SIA", stages: [0, 1, 2], label: "Phase 1: Planning" },
    { id: 2, name: "Inquiries & Declaration", stages: [3, 4], label: "Phase 2: Declaration" },
    { id: 3, name: "Valuation & Compensation", stages: [5, 6, 7], label: "Phase 3: Valuation" },
    { id: 4, name: "Possession & Resettlement", stages: [8, 9], label: "Phase 4: Handover" },
  ];

  // ── 10-Stage Rich Statutory Lifecycle Dataset ────────────────────────
  const stages = [
    {
      id: 1,
      sec: "Sec. 4",
      actRef: "Section 4(1), RFCTLARR Act 2013",
      label: language === "hi" ? "प्रस्ताव व एसआईए" : language === "bn" ? "প্রস্তাব ও SIA" : language === "kn" ? "ಪ್ರಸ್ತಾವನೆ & SIA" : "Proposal & SIA Study",
      phaseId: 1,
      phaseName: "Planning & SIA",
      time: "6-Month Maximum Window",
      authority: "Requisitioning Authority & State Govt",
      desc: "Formal public purpose justification and mandatory Social Impact Assessment (SIA) in consultation with affected Gram Sabhas to determine social and ecological feasibility.",
      deliverables: [
        "Notification of Public Purpose & Boundary Intent",
        "Comprehensive Social Impact Assessment (SIA) Study",
        "Videotaped Gram Sabha Consultation Minutes",
        "Social Impact Management Plan (SIMP)",
      ],
      statutoryRule: "Mandatory public hearing in all affected local bodies. Land acquisition proposal must establish that the land sought is the bare minimum required.",
      riskNote: "If SIA report is not completed and submitted within 6 months, preliminary approvals expire automatically.",
    },
    {
      id: 2,
      sec: "Sec. 7",
      actRef: "Section 7(1)-(4), RFCTLARR Act 2013",
      label: language === "hi" ? "एसआईए मूल्यांकन" : language === "bn" ? "SIA মূল্যায়ন" : language === "kn" ? "SIA ಮೌಲ್ಯಮಾಪನ" : "Expert Group Appraisal",
      phaseId: 1,
      phaseName: "Planning & SIA",
      time: "2-Month Statutory Window",
      authority: "Independent Multi-Disciplinary Expert Group",
      desc: "Independent multi-disciplinary expert committee rigorously examines the SIA report to confirm genuine public purpose, absence of excessive multi-crop land take, and livelihood mitigation adequacy.",
      deliverables: [
        "Independent Expert Group Evaluation Report",
        "Multi-Crop Irrigated Land Assessment (§10)",
        "Alternative Site Feasibility Scorecard",
        "State Government Formal Approval Order",
      ],
      statutoryRule: "If the Expert Group recommends that the project does not serve a public purpose, the acquisition proceedings must be formally abandoned.",
      riskNote: "Overriding Expert Group objections requires explicit written justification tabled before the state legislative assembly.",
    },
    {
      id: 3,
      sec: "Sec. 11",
      actRef: "Section 11(1), RFCTLARR Act 2013",
      label: language === "hi" ? "प्रारंभिक अधिसूचना" : language === "bn" ? "প্রাথমিক বিজ্ঞপ্তি" : language === "kn" ? "ಪ್ರಾಥಮಿಕ ಅಧಿಸೂಚನೆ" : "Preliminary Gazette Notification",
      phaseId: 1,
      phaseName: "Planning & SIA",
      time: "Statutory Freeze Trigger",
      authority: "Appropriate Government (Official Gazette)",
      desc: "Official Gazette publication specifying cadastral survey numbers to be acquired. Imposes an immediate statutory bar on transfers, encumbrances, and developments across all notified parcels.",
      deliverables: [
        "Official Gazette Section 11(1) Publication",
        "Notices in Two Local Daily Newspapers",
        "Public Display at Gram Panchayat / Ward Offices",
        "Joint Cadastral Geo-boundary Demarcation",
      ],
      statutoryRule: "No transaction or creation of encumbrance in respect of specified land is permissible without the Collector's prior sanction.",
      riskNote: "Crucial deadline trigger: Section 19 final declaration MUST be published within 12 months, or Section 11 proceedings lapse completely.",
    },
    {
      id: 4,
      sec: "Sec. 15",
      actRef: "Section 15(1) & 15(2), RFCTLARR Act 2013",
      label: language === "hi" ? "आपत्ति सुनवाई" : language === "bn" ? "আপত্তির শুনানি" : language === "kn" ? "ಆಕ್ಷೇಪಣೆ ವಿಚಾರಣೆ" : "Hearing of Objections",
      phaseId: 2,
      phaseName: "Inquiries & Declaration",
      time: "60 Days from Sec. 11 Notice",
      authority: "District Collector / Competent Authority (CALA)",
      desc: "Collector/CALA conducts formal quasi-judicial hearings for all affected titleholders to submit written objections concerning land extent, public purpose, title disputes, and environmental impact.",
      deliverables: [
        "Formal Objection Register & Tracking IDs",
        "Personal Hearing Proceedings & Record of Statements",
        "Joint Site Verification & Boundary Rectification Memo",
        "Collector's Statutory Inquiry Report to Government",
      ],
      statutoryRule: "Every person interested has a statutory entitlement to be heard in person or by an authorized advocate before acquisition approval.",
      riskNote: "Ex-parte proceedings or failure to record specific findings on landowner objections invalidates subsequent acquisition orders in court.",
    },
    {
      id: 5,
      sec: "Sec. 19",
      actRef: "Section 19(1), RFCTLARR Act 2013",
      label: language === "hi" ? "अंतिम घोषणा" : language === "bn" ? "চূড়ান্ত ঘোষণা" : language === "kn" ? "ಅಂತಿಮ ಘೋಷಣೆ" : "Final Declaration & R&R Summary",
      phaseId: 2,
      phaseName: "Inquiries & Declaration",
      time: "Strict 12-Month Hard Limit",
      authority: "State / Central Government",
      desc: "Conclusive declaration that land is legally required for public purpose, published along with the summary of the Rehabilitation & Resettlement (R&R) scheme and certified cadastral schedule.",
      deliverables: [
        "Section 19(1) Final Acquisition Gazette",
        "Summary R&R Scheme Publication (§19(2))",
        "Definitive Cadastral Parcel Schedule & Map",
        "Deposit of Estimated Land Cost with Collector",
      ],
      statutoryRule: "Declaration is conclusive proof of public purpose. If declaration is not issued within 12 months of Sec 11(1), the entire acquisition proceedings LAPSE.",
      riskNote: "Zero-tolerance judicial choke point: on day 366 without formal extension, land returns to owner and process must restart.",
    },
    {
      id: 6,
      sec: "Sec. 23 & 26",
      actRef: "Sections 23, 26, 27, 28 & 30, RFCTLARR Act",
      label: language === "hi" ? "मुआवजा अवार्ड" : language === "bn" ? "ক্ষতিপূরণ রোয়েদাদ" : language === "kn" ? "ಪರಿಹಾರ ಪ್ರಶಸ್ತಿ" : "Award Determination & Solatium",
      phaseId: 3,
      phaseName: "Valuation & Compensation",
      time: "Within 12 Mo. of Sec. 19",
      authority: "District Collector / CALA",
      desc: "Statutory enquiry into market value, determining compensation: Base Market Value × Rural Multiplier (1.0 to 2.0) + 100% Solatium (§30) + 12% additional interest per annum (§30(3)).",
      deliverables: [
        "Collector's Form 10 Statutory Award Order",
        "Circle Rate vs 3-Year Registered Deed Valuation",
        "100% Solatium (First Schedule) Calculation Sheet",
        "12% Annual Additional Interest Computation",
      ],
      statutoryRule: "Award must be pronounced within 12 months from publication of Section 19 declaration; failure leads to statutory lapse.",
      riskNote: "Under-valuation or omitted assets trigger disputes under Section 64 (Land Acquisition Authority), stalling escrow clearance.",
    },
    {
      id: 7,
      sec: "PFMS / DBT",
      actRef: "Section 77(1) & PFMS Guidelines",
      label: language === "hi" ? "डीबीटी भुगतान" : language === "bn" ? "ডিবিটি পরিশোধ" : language === "kn" ? "ಡಿಬಿಟಿ ಪಾವತಿ" : "Direct Benefit Transfer (DBT)",
      phaseId: 3,
      phaseName: "Valuation & Compensation",
      time: "Mandatory Prior to Possession",
      authority: "CALA & PFMS Banking Gateway",
      desc: "Direct electronic credit of determined compensation into verified Aadhaar/PAN-seeded bank accounts of titleholders via Public Financial Management System (PFMS).",
      deliverables: [
        "PFMS Beneficiary Verification & Payment Advice",
        "Aadhaar-Seeded Bank Account Validation Logs",
        "Electronic Payment Advice (EPA) Disbursal Receipts",
        "Disputed Compensation Court Escrow Deposit (§77(2))",
      ],
      statutoryRule: "Tender of compensation or bank account deposit is mandatory before the Collector can legally demand physical possession of land.",
      riskNote: "Any attempt to dispossess landowners before compensation is credited is illegal and subject to contempt proceedings.",
    },
    {
      id: 8,
      sec: "RoR Mutation",
      actRef: "State Land Revenue Code & DILRMP",
      label: language === "hi" ? "दाखिल-खारिज" : language === "bn" ? "নামজারি" : language === "kn" ? "ಮ್ಯುಟೇಶನ್" : "Revenue Record Mutation (RoR)",
      phaseId: 3,
      phaseName: "Valuation & Compensation",
      time: "Immediate Post-Payment",
      authority: "Tahsildar / Sub-Divisional Officer",
      desc: "Updating the state digital land registry (Jamabandi/Bhoomi/Bhulekh) to mutate ownership title in the name of the Requisitioning Agency (e.g., NHAI, Indian Railways).",
      deliverables: [
        "Tahsildar Digital Mutation Sanction Order",
        "Updated Record of Rights (RoR) Khatiyan Extract",
        "Sub-Division Cadastral Map (Tippan/Tatkal)",
        "ULPIN Ownership Attribute Synchronization",
      ],
      statutoryRule: "State digital title mutation prevents unlawful secondary transactions, dual registration, or post-acquisition encumbrance.",
      riskNote: "Possession taken without RoR mutation creates massive legacy disputes where original owners inadvertently resell acquired land.",
    },
    {
      id: 9,
      sec: "Sec. 38",
      actRef: "Section 38(1), RFCTLARR Act 2013",
      label: language === "hi" ? "भौतिक कब्जा" : language === "bn" ? "জমির দখল" : language === "kn" ? "ಭೌತಿಕ ಸ್ವಾಧೀನ" : "Physical Possession & Handover",
      phaseId: 4,
      phaseName: "Possession & Resettlement",
      time: "Post 100% Compensation",
      authority: "District Collector & Police Assistance",
      desc: "Collector takes peaceful physical possession of encumbrance-free land and formally transfers the certified Right-of-Way (RoW) corridor to the infrastructure project concessionaire.",
      deliverables: [
        "Joint Panchnama Field Inspection Certificate",
        "Boundary Pillars & Geo-Fenced Demarcation",
        "Formal Right-of-Way (RoW) Handover Memo",
        "Physical Possession Certificate to Agency",
      ],
      statutoryRule: "The Collector shall take possession of land only after full payment of compensation as well as rehabilitation monetary benefits.",
      riskNote: "Dispossessing occupants before full payment violates Section 38 and attracts immediate High Court stay orders.",
    },
    {
      id: 10,
      sec: "Sec. 31",
      actRef: "Section 31 & Schedules II / III",
      label: language === "hi" ? "पुनर्वास व समापन" : language === "bn" ? "পুনর্বাসন ও সমাপ্তি" : language === "kn" ? "ಪುನರ್ವಸತಿ & ಸಮಾಪ್ತಿ" : "R&R Closure & Project Commissioning",
      phaseId: 4,
      phaseName: "Possession & Resettlement",
      time: "Final Statutory Closure",
      authority: "R&R Commissioner & Project Directorate",
      desc: "Full execution of Rehabilitation & Resettlement entitlements under Schedules II and III, including alternate housing, resettlement allowances, job quotas, and statutory compliance audit.",
      deliverables: [
        "R&R Entitlements Settlement & Completion Audit",
        "Resettlement Colony Housing Allotment Deeds",
        "Livelihood Allowance & Skill Training Register",
        "Final Statutory Compliance Certificate (MoRD)",
      ],
      statutoryRule: "Every displaced family must be provided comprehensive R&R benefits prior to project commissioning.",
      riskNote: "Pending R&R grievances delay financial closure and final operational licensing from central oversight bodies.",
    },
  ];

  const currentStage = stages[activeStage];
  const activePhase = phases.find((p) => p.stages.includes(activeStage)) || phases[0];

  // ── Priority Corridors ──────────────────────────────────────────────
  const corridors = [
    { name: "Delhi–Mumbai Expressway (Pkg IV)", agency: "NHAI / MoRTH", parcels: "14,820", stage: "Sec. 19 Declared", progress: 88, link: "/atlas" },
    { name: "Western Dedicated Freight Corridor", agency: "DFCCIL / Railways", parcels: "22,450", stage: "Award & DBT", progress: 94, link: "/atlas" },
    { name: "Bengaluru–Chennai Expressway", agency: "NHAI / DIC", parcels: "8,920", stage: "Mutation", progress: 82, link: "/atlas" },
    { name: "Ken–Betwa River Link", agency: "NWDA / MoJS", parcels: "31,100", stage: "SIA & Sec. 11", progress: 65, link: "/atlas" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30" />
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left: Text + Search */}
            <div className="space-y-6">
              {/* Slim badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-200 bg-orange-50/90 text-orange-800 text-xs font-semibold font-label animate-fade-in shadow-xs">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>{t("hero.badgeAct", "RFCTLARR Act, 2013 — Department of Land Resources, GoI")}</span>
              </div>

              {/* Headline */}
              <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-extrabold tracking-tight text-foreground leading-[1.12]">
                  {t("hero.title", "National Land Acquisition & Statutory Compliance Platform")}
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                  {t("hero.desc", "Unified GIS-cadastral engine enforcing transparent, time-bound RFCTLARR Act 2013 workflows — from Section 4 SIA to Direct Benefit Transfer.")}
                </p>
              </div>

              {/* ULPIN Search Form */}
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <form onSubmit={(e) => handleUlpinSearch(e)} className="flex gap-2 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t("hero.searchPlaceholder", "Enter 14-digit ULPIN (e.g. 29210301001001)")}
                      value={ulpinInput}
                      onChange={(e) => setUlpinInput(e.target.value)}
                      className="input-premium pl-10 font-mono text-sm placeholder:font-sans shadow-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary whitespace-nowrap cursor-pointer px-5"
                  >
                    {t("hero.searchBtn", "Check Status")}
                  </button>
                </form>

                {/* Quick Demo ULPIN Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  <span className="text-muted-foreground font-medium text-[11px] mr-1">Demo Parcels:</span>
                  {[
                    { id: "29210301001001", label: "Bantwal (NH-75)" },
                    { id: "27014503005001", label: "Sinnar (Samruddhi)" },
                    { id: "23120101002001", label: "Pithampur (DMIC)" },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleDemoUlpin(chip.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-300 font-mono text-[11px] transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>{chip.label}</span>
                      <span className="text-[10px] text-muted-foreground font-sans">({chip.id.slice(0, 6)}…)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Row */}
              <div className="flex flex-wrap gap-3 pt-2 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <Link href="/atlas" className="btn-primary">
                  <MapPin className="w-4 h-4" />
                  {t("hero.btnAtlas", "Open GIS Atlas")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/workflow" className="btn-outline">
                  <GitBranch className="w-4 h-4 text-orange-600" />
                  {t("hero.btnWorkflow", "Statutory Workflow")}
                </Link>
                <Link href="/citizen" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors">
                  <Landmark className="w-3.5 h-3.5 text-teal-600" />
                  {t("hero.btnCitizen", "Public Portal")}
                </Link>
              </div>

              {/* Trust row */}
              {/* <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-4 border-t border-border/60 animate-fade-in" style={{ animationDelay: "400ms" }}>
                {[
                  t("hero.statStages", "10 Statutory Stages"),
                  t("hero.statUlpin", "100% ULPIN-Keyed"),
                  t("hero.statRag", "RAG Escalation Engine"),
                  t("hero.statDbt", "PFMS Direct Benefit Transfer"),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div> */}
            </div>

            {/* Right: GIS Visual Card */}
            {/* Right: GIS Visual Card with Slow Scanning Line & Live Telemetry */}
            <div className="relative rounded-2xl bg-slate-950 overflow-hidden shadow-2xl border border-slate-700/80 aspect-[4/3] lg:aspect-auto lg:h-[460px]">
              <Image
                src="/images/roadImage.png"
                alt="National GIS Cadastral Map"
                fill
                className="object-cover opacity-75"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/40" />

              {/* Slow Scan Beam */}
              <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent animate-scan-beam pointer-events-none" />

              {/* Slow Ambient Glow */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-500/20 rounded-full blur-2xl animate-pulse-slow pointer-events-none" />

              {/* Top bar */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                {/* <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-[11px] text-slate-200 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>CADASTRE · Sentinel-2 Multi-Band</span>
                </span> */}
              </div>

              {/* Parcel Live Badge & Popup */}
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="bg-slate-50/10 backdrop-blur-sm rounded-xl p-4 border border-slate-700/90 text-white space-y-2.5 shadow-2xl">
                  <div className="flex items-center justify-between text-x">
                    <span className="font-bold text-orange-400 font-mono flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" /> ULPIN: 29210301001001
                    </span>
                    <span className="text-[15px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Sec. 19 Declared
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[13px] text-slate-300">
                    <div><span className="text-slate-500">Corridor:</span> Bengaluru–Mangaluru NH-75</div>
                    <div><span className="text-slate-500">Extent:</span> 1.84 Ha (Wetland)</div>
                    <div><span className="text-slate-500">Determined Award:</span> <span className="text-emerald-400 font-bold font-mono">₹1,42,80,000</span></div>
                    <div><span className="text-slate-500">DBT Status:</span> <span className="text-amber-300 font-semibold">PFMS Batch Ready</span></div>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Statutory Progression</span>
                      <span className="text-orange-400 font-bold">Stage 5 of 10 (Sec 19)</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full" style={{ width: "50%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP WITH SLOW SMOOTH MOTION AMBIENT BACKGROUND ───── */}
      <section className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden border-y border-slate-800 py-10">
        {/* Slow Motion Floating Ambient Luminous Orbs */}
        <div className="absolute -left-20 -top-24 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute -right-20 -bottom-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl animate-float-slow-reverse pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-36 rounded-full bg-amber-400/10 blur-3xl animate-pulse-slow pointer-events-none" />

        {/* Slow Drifting Constellation / Cadastral Vector Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.07] bg-grid animate-grid-drift pointer-events-none" />

        {/* Subtle Top Accent Shimmer Line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          {/* Header Telemetry Pill */}
          <div className="flex items-center justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-slate-300 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE NATIONAL LAND TELEMETRY · RFCTLARR ACT 2013</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: "2.8M+", label: t("stat.parcels", "ULPIN-Keyed Parcels"), sub: "DILRMP Synced", color: "text-orange-400" },
              { value: "10", label: t("stat.stages", "Statutory Stages"), sub: "RFCTLARR Act 2013", color: "text-amber-400" },
              { value: "28", label: t("stat.states", "States & UTs"), sub: "PM GatiShakti Projects", color: "text-emerald-400" },
              { value: "₹4.2T", label: t("stat.disbursed", "Awards Monitored"), sub: "PFMS DBT Integrated", color: "text-orange-400" },
            ].map((s, i) => (
              <div
                key={i}
                className="group relative p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-orange-400/40 hover:bg-white/[0.06] transition-all text-center"
              >
                <div className={`text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold ${s.color} font-mono tracking-tight`}>
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-200 font-semibold mt-1.5 font-heading">{s.label}</div>
                {s.sub && <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULE GRID ─────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-9 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="section-label mb-2">{t("section.modulesLabel", "PLATFORM ARCHITECTURE")}</div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
                {t("section.modules", "Core Platform Modules")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {t("section.modulesDesc", "Integrated institutional tools covering every phase from cadastral demarcation to direct DBT disbursement.")}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3.5 py-2 rounded-xl transition-colors self-start md:self-auto"
            >
              <span>Executive KPI View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`card-enhanced group flex flex-col justify-between p-6 rounded-2xl hover:border-orange-300 hover:shadow-md transition-all animate-fade-in-scale animate-stagger-${i + 1}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase border border-slate-200">
                        {mod.category}
                      </span>
                      <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                        {mod.badge}
                      </span>
                    </div>
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className={`p-3 rounded-xl ${mod.bg} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${mod.accent}`} />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-foreground text-base group-hover:text-orange-700 transition-colors">
                          {mod.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-orange-600 group-hover:text-orange-700">
                    <span>Launch Module</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── RFCTLARR 10-STAGE STATUTORY LIFECYCLE (REDESIGNED) ─────────── */}
      <section id="lifecycle" className="py-16 bg-gradient-to-b from-orange-50/20 via-white to-amber-50/20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          {/* Section Header */}
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/70 border border-orange-200 text-orange-800 text-xs font-bold font-label mb-3">
              <Scale className="w-3.5 h-3.5 text-orange-600" />
              <span>RFCTLARR ACT, 2013 STATUTORY BLUEPRINT</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Interactive 10-Stage Statutory Lifecycle
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Every infrastructure acquisition under Indian law strictly follows 4 legal phases and 10 statutory milestones. Select any stage to review mandatory timelines, deliverables, and judicial risk modes.
            </p>
          </div>

          {/* 4-Phase High-Level Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            {phases.map((p) => {
              const isPhaseActive = p.stages.includes(activeStage);
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveStage(p.stages[0])}
                  className={`px-4 py-3 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    isPhaseActive
                      ? "bg-white border-orange-400 shadow-md ring-2 ring-orange-100"
                      : "bg-white/80 border-slate-200 hover:border-orange-200 hover:bg-orange-50/30"
                  }`}
                >
                  <div>
                    <div className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isPhaseActive ? "text-orange-600" : "text-muted-foreground"}`}>
                      Phase {p.id}
                    </div>
                    <div className="text-xs sm:text-sm font-heading font-bold text-foreground truncate">
                      {p.name}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isPhaseActive ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {p.stages.length} Steps
                  </span>
                </button>
              );
            })}
          </div>

          {/* 10-Stage Interactive Stepper Rail */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6 overflow-x-auto">
            <div className="min-w-[760px] relative">
              {/* Connector rail line */}
              <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 rounded-full z-0">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${(activeStage / 9) * 100}%` }}
                />
              </div>

              {/* 10 Nodes */}
              <div className="relative z-10 flex items-center justify-between">
                {stages.map((stg, idx) => {
                  const isCurrent = idx === activeStage;
                  const isPassed = idx < activeStage;
                  return (
                    <button
                      key={stg.id}
                      onClick={() => setActiveStage(idx)}
                      className="group flex flex-col items-center cursor-pointer focus:outline-none transition-transform hover:scale-105"
                    >
                      {/* Node Icon/Circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-xs transition-all shadow-xs ${
                          isCurrent
                            ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white ring-4 ring-orange-200 shadow-md scale-110"
                            : isPassed
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-white border-2 border-slate-300 text-slate-600 group-hover:border-orange-400 group-hover:text-orange-600"
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <span>{stg.id}</span>
                        )}
                      </div>

                      {/* Section Tag */}
                      <div className="mt-2 text-center">
                        <div className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded transition-colors ${
                          isCurrent
                            ? "bg-orange-100 text-orange-800"
                            : "text-slate-500 group-hover:text-slate-800"
                        }`}>
                          {stg.sec}
                        </div>
                        <div className={`text-[10px] font-medium max-w-[70px] truncate mt-0.5 ${
                          isCurrent ? "font-bold text-foreground" : "text-muted-foreground"
                        }`}>
                          {stg.label.split(" ")[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Stage Showcase Card */}
          <div className="card-enhanced rounded-2xl overflow-hidden border-orange-200/80 shadow-md bg-white">
            {/* Card Header Strip */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold font-mono text-sm">
                  {currentStage.id}
                </span>
                <div>
                  <div className="text-[11px] font-mono tracking-wider uppercase text-orange-100">
                    {currentStage.phaseName} · Milestone {currentStage.id} of 10
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-extrabold text-white leading-tight">
                    {currentStage.label}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold text-white border border-white/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentStage.time}</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/30 text-xs font-mono font-semibold text-white">
                  <Scale className="w-3.5 h-3.5" />
                  <span>{currentStage.sec}</span>
                </span>
              </div>
            </div>

            {/* Card Content Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

              {/* Col 1: Statutory Mandate & Authority (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <div className="text-[11px] font-bold font-mono text-orange-700 uppercase tracking-wider mb-1">
                    Legal Citation & Mandate
                  </div>
                  <div className="font-heading font-bold text-foreground text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span>{currentStage.actRef}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {currentStage.desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Statutory Authority In-Charge</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {currentStage.authority}
                  </div>
                </div>

                {/* Core Legal Rule */}
                <div className="p-3.5 rounded-xl bg-orange-50/70 border-l-4 border-l-orange-500 border-t border-r border-b border-orange-200">
                  <div className="text-[10px] font-bold font-mono text-orange-800 uppercase tracking-wider mb-1">
                    Statutory Core Rule
                  </div>
                  <div className="text-xs text-orange-950 leading-relaxed font-medium">
                    &ldquo;{currentStage.statutoryRule}&rdquo;
                  </div>
                </div>
              </div>

              {/* Col 2: Mandatory Deliverables (4 cols) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="text-[11px] font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Required Statutory Deliverables</span>
                </div>
                <div className="space-y-2">
                  {currentStage.deliverables.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="font-medium leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 3: Judicial Risk Alert & Action (3 cols) */}
              <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
                {/* Judicial Failure Risk */}
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold font-mono text-rose-800 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    <span>Statutory Failure Risk</span>
                  </div>
                  <p className="text-xs text-rose-900 leading-relaxed font-medium">
                    {currentStage.riskNote}
                  </p>
                </div>

                {/* Direct Action CTAs */}
                <div className="space-y-2 pt-2">
                  <Link
                    href="/workflow"
                    className="btn-primary w-full justify-center text-xs py-2.5"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Track in Live Workflow</span>
                  </Link>
                  <Link
                    href="/atlas"
                    className="btn-outline w-full justify-center text-xs py-2 bg-white"
                  >
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    <span>Inspect Spatial Atlas</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Card Footer: Step Navigator */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                disabled={activeStage === 0}
                onClick={() => setActiveStage((prev) => Math.max(0, prev - 1))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Stage</span>
              </button>

              <button
                type="button"
                disabled={activeStage === stages.length - 1}
                onClick={() => setActiveStage((prev) => Math.min(stages.length - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next Stage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLE ACCESS CARDS ────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="section-label mb-2">ACCESS CONTROL</div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              {t("section.access", "Role-Based Portals")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
              {t("section.accessDesc", "Bespoke interfaces configured for landowners, district CALA authorities, and central project monitoring units.")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: language === "hi" ? "नागरिक / भू-स्वामी" : language === "bn" ? "নাগরিক / ভূ-মালিক" : language === "kn" ? "ನಾಗರಿಕ / ಭೂಮಾಲೀಕ" : "Citizen / Landowner",
                badge: "Zero-Auth Public Access",
                desc: language === "hi" ? "ULPIN से स्थिति जांचें, मुआवजा विवरण देखें और आपत्ति दर्ज करें।" : language === "bn" ? "ULPIN দিয়ে স্থিতি দেখুন, ক্ষতিপূরণ যাচাই করুন।" : language === "kn" ? "ULPIN ಮೂಲಕ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ, ಪರಿಹಾರ ನೋಡಿ." : "Check parcel status, verify compensation awards, and file Section 15 objections via 14-digit ULPIN.",
                href: "/citizen",
                cta: language === "hi" ? "नागरिक पोर्टल" : language === "bn" ? "নাগরিক পোর্টাল" : language === "kn" ? "ನಾಗರಿಕ ಪೋರ್ಟಲ್" : "Citizen Portal",
                icon: Landmark,
                color: "border-teal-200 bg-teal-50/40 hover:border-teal-300",
                iconColor: "text-teal-700 bg-teal-100",
                ctaColor: "bg-teal-700 hover:bg-teal-800",
              },
              {
                title: language === "hi" ? "जिला अधिकारी / सीएएलए" : language === "bn" ? "জেলা কর্মকর্তা / CALA" : language === "kn" ? "ಜಿಲ್ಲಾ ಅಧಿಕಾರಿ / CALA" : "District Collector / CALA",
                badge: "Official Revenue Console",
                desc: language === "hi" ? "कार्यप्रवाह प्रबंधन, समयसीमा निगरानी, ​​दाखिल-खारिज और जोखिम स्कोरिंग।" : language === "bn" ? "কর্মপ্রবাহ ব্যবস্থাপনা, সময়সীমা পর্যবেক্ষণ ও ঝুঁকি মূল্যায়ন।" : language === "kn" ? "ವರ್ಕ್‌ಫ್ಲೋ ನಿರ್ವಹಣೆ, ಗಡುವು ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ಅಪಾಯ ಸ್ಕೋರಿಂಗ್." : "Manage statutory stage transitions, monitor lapse countdowns, approve awards, and track PFMS DBT.",
                href: "/workflow",
                cta: language === "hi" ? "कार्यप्रवाह खोलें" : language === "bn" ? "কর্মপ্রবাহ দেখুন" : language === "kn" ? "ವರ್ಕ್‌ಫ್ಲೋ ತೆರೆಯಿರಿ" : "Open Workflow",
                title: language === "hi" ? "जिला अधिकारी / सीएएलए" : language === "bn" ? "জেলা কর্মকর্তা / CALA" : language === "kn" ? "ಜಿಲ್ಲಾ ಅಧಿಕಾರಿ / CALA" : "District Officer / CALA",
                desc: language === "hi" ? "कार्यप्रवाह प्रबंधन, समयसीमा निगरानी, ​​दाखिल-खारिज और जोखिम स्कोरिंग।" : language === "bn" ? "কর্মপ্রবাহ ব্যবস্থাপনা, সময়সীমা পর্যবেক্ষণ ও ঝুঁকি মূল্যায়ন।" : language === "kn" ? "ವರ್ಕ್‌ಫ್ಲೋ ನಿರ್ವಹಣೆ, ಗಡುವು ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ಅಪಾಯ ಸ್ಕೋರಿಂಗ್." : "Workflow management, deadline monitoring, mutation tracking, and risk scoring.",
                href: "/workflow",
                cta: language === "hi" ? "कार्यप्रवाह खोलें" : language === "bn" ? "কর্মপ্রবাহ দেখুন" : language === "kn" ? "ವರ್ಕ್‌ಫ್ಲೋ ತೆರೆಯಿರಿ" : "Open Workflow",
                icon: GitBranch,
                color: "border-amber-200 bg-amber-50/50",
                iconColor: "text-amber-600 bg-amber-100",
                ctaColor: "bg-amber-700 hover:bg-amber-800",
              },
              {
                title: language === "hi" ? "प्रशासक / सीएएलए विभाग" : language === "bn" ? "প্রশাসক / CALA বিভাগ" : language === "kn" ? "ನಿರ್ವಾಹಕ / CALA ವಿಭಾಗ" : "Admin / CALA Department",
                desc: language === "hi" ? "कार्यचालन कंसोल, डेटा सत्यापन, बहुभुज समायोजन और उपयोगकर्ता प्रबंधन।" : language === "bn" ? "পরিচালনা কনসোল, তথ্য যাচাই ও ব্যবহারকারী ব্যবস্থাপনা।" : language === "kn" ? "ನಿರ್ವಾಹಕ ಕನ್ಸೋಲ್, ಡೇಟಾ ದৃঢীকরণ ಮತ್ತು ಬಳಕೆದಾರ ನಿರ್ವಹಣೆ." : "Operations console, data validation, polygon adjustment, and user administration.",
                href: "/admin",
                cta: language === "hi" ? "एडमिन कंसोल" : language === "bn" ? "অ্যাডমিন কনসোল" : language === "kn" ? "ಅಡ್ಮಿನ್ ಕನ್ಸೋಲ್" : "Admin Console",
                icon: Shield,
                color: "border-slate-200 bg-slate-50/50",
                iconColor: "text-slate-600 bg-slate-100",
                ctaColor: "bg-slate-800 hover:bg-slate-900",
              },
            ].map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.href} className={`glass-card p-6 rounded-2xl border ${role.color} flex flex-col gap-4`}>
                  <div className={`w-10 h-10 rounded-xl ${role.iconColor} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground text-sm mb-1.5">{role.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                  </div>
                  <Link
                    href={role.href}
                    className={`mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg ${role.ctaColor} text-white text-xs font-semibold transition-colors shadow-xs`}
                  >
                    {role.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA WITH SLOW SMOOTH MOTION AMBIENT BACKGROUND ────── */}
      <section className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white py-16 overflow-hidden border-t border-slate-800">
        {/* Slow Motion Floating Ambient Glows */}
        <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-orange-500/15 blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl animate-float-slow-reverse pointer-events-none" />
        <div className="absolute inset-0 bg-dots opacity-10 animate-grid-drift pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse-slow" />
              <span>DILRMP + PM GatiShakti Compliant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white mb-1.5">
              {t("cta.title", "Ready to explore the National Cadastral Atlas?")}
            </h2>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              {t("cta.desc", "Visualise 2.8M+ land parcels, track Section 11 to Section 38 statutory progress, and assess litigation risk in real time.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Link
              href="/atlas"
              className="btn-primary text-sm px-5 py-2.5 shadow-lg shadow-orange-500/20"
            >
              <MapPin className="w-4 h-4" />
              <span>{t("cta.btn", "Open GIS Atlas")}</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold text-sm transition-colors shadow-sm"
            >
              <Shield className="w-4 h-4 text-orange-400" />
              <span>{t("cta.login", "Official Login")}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}