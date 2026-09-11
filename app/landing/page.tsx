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
  CheckCircle2,
  Landmark,
  Shield,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [ulpinInput, setUlpinInput] = useState("");
  const [activeStage, setActiveStage] = useState(0);

  const handleUlpinSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = ulpinInput.trim();
    router.push(query ? `/citizen?ulpin=${encodeURIComponent(query)}` : "/citizen");
  };

  // ── Core Modules ────────────────────────────────────────────────────
  const modules = [
    {
      title: language === "hi" ? "जीआईएस एटलस" : language === "bn" ? "জিআইএস অ্যাটলাস" : language === "kn" ? "ಜಿಐಎಸ್ ಅಟ್ಲಾಸ್" : "GIS Cadastral Atlas",
      desc: language === "hi" ? "14-अंकीय यूलपिन भूखंड मानचित्र, परियोजना ओवरले और जोखिम रंग कोडिंग।" : language === "bn" ? "14-ডিজিট ইউএলপিআইএন মানচিত্র ও প্রকল্প ওভারলে।" : language === "kn" ? "14-ಅಂಕಿಯ ಯುಎಲ್‌ಪಿಐಎನ್ ನಕ್ಷೆ ಮತ್ತು ಯೋಜನೆ ಓವರ್ಲೇ." : "14-digit ULPIN parcel map with project corridor overlays and risk heat-coding.",
      href: "/atlas",
      icon: MapPin,
      accent: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: language === "hi" ? "10-चरणीय कार्यप्रवाह" : language === "bn" ? "10-ধাপ কর্মপ্রবাহ" : language === "kn" ? "10-ಹಂತ ವರ್ಕ್‌ಫ್ಲೋ" : "Statutory Workflow",
      desc: language === "hi" ? "आरएफसीटीएलएआरआर 2013 अनुपालन पाइपलाइन, समयसीमा उलटी गिनती और आरएजी अलर्ट।" : language === "bn" ? "আরএফসিটিএলএআরআর ২০১৩ অনুযায়ী সময়সীমা ট্র্যাকিং ও আরএজি সতর্কতা।" : language === "kn" ? "RFCTLARR 2013 ಗಡುವು ಕೌಂಟ್‌ಡೌನ್ ಮತ್ತು RAG ಎಚ್ಚರಿಕೆ." : "RFCTLARR 2013 compliance pipeline with deadline countdowns and RAG escalation.",
      href: "/workflow",
      icon: GitBranch,
      accent: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: language === "hi" ? "नागरिक पोर्टल" : language === "bn" ? "নাগরিক পোর্টাল" : language === "kn" ? "ನಾಗರಿಕ ಪೋರ್ಟಲ್" : "Citizen Portal",
      desc: language === "hi" ? "14-अंकीय यूलपिन से भू-स्थिति जांच, मुआवजा विवरण और ऑनलाइन आपत्ति दर्ज करें।" : language === "bn" ? "14-ডিজিট ইউএলপিআইএন দিয়ে জমির স্থিতি, ক্ষতিপূরণ দেখুন।" : language === "kn" ? "14-ಅಂಕಿ ULPIN ಮೂಲಕ ಭೂ ಸ್ಥಿತಿ, ಪರಿಹಾರ ವಿವರ ಮತ್ತು ದೂರು ಸಲ್ಲಿಸಿ." : "Look up parcel status, review compensation, and file online grievances by ULPIN.",
      href: "/citizen",
      icon: Landmark,
      accent: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      title: language === "hi" ? "दस्तावेज़ ओसीआर" : language === "bn" ? "ডকুমেন্ট ওসিআর" : language === "kn" ? "ದಾಖಲೆ ಓಸಿಆರ್" : "Document OCR",
      desc: language === "hi" ? "स्कैन किए गए गजट, धारा 11/19 नोटिफिकेशन से स्वचालित खसरा और मालिक नाम निष्कर्षण।" : language === "bn" ? "স্ক্যান করা গেজেট থেকে দাগ ও মালিকের নাম স্বয়ংক্রিয় নিষ্কাশন।" : language === "kn" ? "ಸ್ಕ್ಯಾನ್ ಗೆಜೆಟ್‌ಗಳಿಂದ ಸರ್ವೆ ನಂಬರ್ ಮತ್ತು ಮಾಲೀಕ ಹೆಸರು ಹೊರತೆಗೆಯುವಿಕೆ." : "Auto-extract survey numbers and owner names from scanned gazette notifications.",
      href: "/upload",
      icon: Upload,
      accent: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: language === "hi" ? "जोखिम इंजन" : language === "bn" ? "ঝুঁকি মূল্যায়ন" : language === "kn" ? "ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ" : "Risk Engine",
      desc: language === "hi" ? "स्वामित्व विवाद, मुकदमेबाजी और समयसीमा चूक के लिए पारदर्शी नियम-आधारित जोखिम स्कोरिंग।" : language === "bn" ? "মালিকানা বিরোধ ও মামলার জন্য নিয়ম-ভিত্তিক ঝুঁকি মূল্যায়ন।" : language === "kn" ? "ಮಾಲೀಕತ್ವ ವಿವಾದ ಮತ್ತು ಮೊಕದ್ದಮೆಗಾಗಿ ನಿಯಮ-ಆಧಾರಿತ ಅಪಾಯ ಸ್ಕೋರಿಂಗ್." : "Rule-based risk scoring for ownership disputes, litigation, and deadline overruns.",
      href: "/risk",
      icon: AlertTriangle,
      accent: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: language === "hi" ? "कार्यपालक डैशबोर्ड" : language === "bn" ? "এক্সিকিউটিভ ড্যাশবোর্ড" : language === "kn" ? "ಕಾರ್ಯನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" : "Analytics Dashboard",
      desc: language === "hi" ? "राज्य और जिला-स्तरीय केपीआई, दाखिल-खारिज दर और डीबीटी मुआवजा वितरण ट्रैकिंग।" : language === "bn" ? "রাজ্য ও জেলা স্তরে কেপিআই এবং ডিবিটি ক্ষতিপূরণ ট্র্যাকিং।" : language === "kn" ? "ರಾಜ್ಯ ಮತ್ತು ಜಿಲ್ಲಾ ಮಟ್ಟದ ಕೆಪಿಐ ಮತ್ತು ಡಿಬಿಟಿ ಮೇಲ್ವಿಚಾರಣೆ." : "District and state-level KPI rollups, mutation completion, and DBT disbursement metrics.",
      href: "/dashboard",
      icon: BarChart3,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  // ── 10-Stage Lifecycle (compact) ─────────────────────────────────────
  const stages = [
    { id: 1, sec: "Sec. 4", label: language === "hi" ? "प्रस्ताव व एसआईए" : language === "bn" ? "প্রস্তাব ও SIA" : language === "kn" ? "ಪ್ರಸ್ತಾವನೆ & SIA" : "Proposal & SIA" },
    { id: 2, sec: "Sec. 7", label: language === "hi" ? "एसआईए मूल्यांकन" : language === "bn" ? "SIA মূল্যায়ন" : language === "kn" ? "SIA ಮೌಲ್ಯಮಾಪನ" : "SIA Appraisal" },
    { id: 3, sec: "Sec. 11", label: language === "hi" ? "प्रारंभिक अधिसूचना" : language === "bn" ? "প্রাথমিক বিজ্ঞপ্তি" : language === "kn" ? "ಪ್ರಾಥಮಿಕ ಅಧಿಸೂಚನೆ" : "Preliminary Notification" },
    { id: 4, sec: "Sec. 15", label: language === "hi" ? "आपत्ति सुनवाई" : language === "bn" ? "আপত্তির শুনানি" : language === "kn" ? "ಆಕ್ಷೇಪಣೆ ವಿಚಾರಣೆ" : "Hearing Objections" },
    { id: 5, sec: "Sec. 19", label: language === "hi" ? "अंतिम घोषणा" : language === "bn" ? "চূড়ান্ত ঘোষণা" : language === "kn" ? "ಅಂತಿಮ ಘೋಷಣೆ" : "Final Declaration" },
    { id: 6, sec: "Sec. 23", label: language === "hi" ? "मुआवजा अवार्ड" : language === "bn" ? "ক্ষতিপূরণ রোয়েদাদ" : language === "kn" ? "ಪರಿಹಾರ ಪ್ರಶಸ್ತಿ" : "Award Determination" },
    { id: 7, sec: "PFMS", label: language === "hi" ? "डीबीटी भुगतान" : language === "bn" ? "ডিবিটি পরিশোধ" : language === "kn" ? "ಡಿಬಿಟಿ ಪಾವತಿ" : "Compensation (DBT)" },
    { id: 8, sec: "RoR", label: language === "hi" ? "दाखिल-खारिज" : language === "bn" ? "নামজারি" : language === "kn" ? "ಮ್ಯುಟೇಶನ್" : "Revenue Mutation" },
    { id: 9, sec: "Sec. 38", label: language === "hi" ? "भौतिक कब्जा" : language === "bn" ? "জমির দখল" : language === "kn" ? "ಭೌತಿಕ ಸ್ವಾಧೀನ" : "Physical Possession" },
    { id: 10, sec: "Sec. 31", label: language === "hi" ? "पुनर्वास व समापन" : language === "bn" ? "পুনর্বাসন ও সমাপ্তি" : language === "kn" ? "ಪುನರ್ವಸತಿ & ಸಮಾಪ್ತಿ" : "R&R & Project Close" },
  ];

  const stageDetails = [
    { time: language === "hi" ? "6 माह" : language === "bn" ? "6 মাস" : language === "kn" ? "6 ತಿಂಗಳು" : "6 Months", desc: language === "hi" ? "सार्वजनिक उद्देश्य का औचित्य और प्रभावित ग्राम सभाओं के साथ सामाजिक प्रभाव आकलन।" : language === "bn" ? "জনস্বার্থ ন্যায্যতা এবং আক্রান্ত গ্রাম সভার সাথে সামাজিক প্রভাব মূল্যায়ন।" : language === "kn" ? "ಸಾರ್ವಜನಿಕ ಉದ್ದೇಶ ಸಮರ್ಥನೆ ಮತ್ತು ಎಸ್‌ಐಎ ಅಧ್ಯಯನ." : "Public purpose justification and Social Impact Assessment study with affected Gram Sabhas." },
    { time: language === "hi" ? "2 माह" : language === "bn" ? "2 মাস" : language === "kn" ? "2 ತಿಂಗಳು" : "2 Months", desc: language === "hi" ? "स्वतंत्र बहु-विषयक विशेषज्ञ समिति एसआईए रिपोर्ट का मूल्यांकन करती है।" : language === "bn" ? "স্বাধীন বিশেষজ্ঞ কমিটি এসআইএ রিপোর্ট মূল্যায়ন করে।" : language === "kn" ? "ಸ್ವತಂತ್ರ ತಜ್ಞ ಸಮಿತಿಯು ಎಸ್‌ಐಎ ವರದಿ ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತದೆ." : "Independent Expert Committee evaluates the SIA report and environmental impact." },
    { time: language === "hi" ? "वैधानिक रोक" : language === "bn" ? "আইনি নিষেধাজ্ঞা" : language === "kn" ? "ಶಾಸನಬದ್ಧ ತಡೆ" : "Statutory Freeze", desc: language === "hi" ? "अधिसूचित खसरा नंबरों में भूमि लेनदेन पर रोक लगाने वाला आधिकारिक गजट प्रकाशन।" : language === "bn" ? "বিজ্ঞাপিত দাগে জমির লেনদেন স্থগিত করে সরকারি গেজেট প্রকাশ।" : language === "kn" ? "ಅಧಿಸೂಚಿತ ಸರ್ವೆ ನಂಬರ್‌ಗಳಲ್ಲಿ ಭೂ ವ್ಯವಹಾರ ಸ್ಥಗಿತ ಮಾಡುವ ಅಧಿಕೃತ ಗೆಜೆಟ್." : "Official Gazette publication freezing land transactions in notified cadastral survey numbers." },
    { time: language === "hi" ? "60 दिन" : language === "bn" ? "60 দিন" : language === "kn" ? "60 ದಿನಗಳು" : "60 Days", desc: language === "hi" ? "कलेक्टर/सीएएलए भू-स्वामियों के दावों और विवादों की औपचारिक सुनवाई करते हैं।" : language === "bn" ? "কালেক্টর/সিএএলএ জমির মালিকদের দাবি ও বিরোধের শুনানি নেন।" : language === "kn" ? "ಕಲೆಕ್ಟರ್/CALA ಭೂಮಾಲೀಕರ ಹಕ್ಕುಗಳ ವಿಚಾರಣೆ ನಡೆಸುತ್ತಾರೆ." : "Collector/CALA conducts formal hearings for landowner title disputes and boundary reviews." },
    { time: language === "hi" ? "सख्त 12 माह सीमा" : language === "bn" ? "কঠোর 12 মাস সীমা" : language === "kn" ? "ಕಟ್ಟುನಿಟ್ಟಿನ 12 ತಿಂಗಳ ಮಿತಿ" : "Strict 12-Month Limit", desc: language === "hi" ? "अधिग्रहण की अनिवार्य घोषणा। धारा 11 से 12 महीने में प्रकाशित न होने पर प्रक्रिया निरस्त।" : language === "bn" ? "ধারা ১১-এর ১২ মাসের মধ্যে প্রকাশ না হলে অধিগ্রহণ প্রক্রিয়া বাতিল হয়।" : language === "kn" ? "ಸೆಕ್ಷನ್ 11 ರ 12 ತಿಂಗಳೊಳಗೆ ಪ್ರಕಟಿಸದಿದ್ದರೆ ಭೂಸ್ವಾಧೀನ ರದ್ದಾಗುತ್ತದೆ." : "Mandatory acquisition declaration. If not published within 12 months of Sec 11, process lapses." },
    { time: language === "hi" ? "धारा 19 से 12 माह" : language === "bn" ? "ধারা 19 থেকে 12 মাস" : language === "kn" ? "ಸೆಕ್ಷನ್ 19 ರಿಂದ 12 ತಿಂಗಳು" : "12 Mo. from Sec 19", desc: language === "hi" ? "मुआवजा अवार्ड: बाजार मूल्य + 100% सोलेशियम + 12% अतिरिक्त ब्याज।" : language === "bn" ? "ক্ষতিপূরণ: বাজার মূল্য + 100% সোলেশিয়াম + 12% অতিরিক্ত সুদ।" : language === "kn" ? "ಪರಿಹಾರ: ಮಾರುಕಟ್ಟೆ ಮೌಲ್ಯ + 100% ಸೊಲೇಷಿಯಂ + 12% ಬಡ್ಡಿ." : "Compensation: Market value + 100% Solatium + 12% Additional Interest per annum." },
    { time: language === "hi" ? "कब्जे से पूर्व" : language === "bn" ? "দখলের পূর্বে" : language === "kn" ? "ಸ್ವಾಧೀನಕ್ಕೂ ಮುನ್ನ" : "Prior to Possession", desc: language === "hi" ? "सत्यापित भू-स्वामी बैंक खातों में प्रत्यक्ष लाभ अंतरण (डीबीटी) के माध्यम से जमा।" : language === "bn" ? "যাচাইকৃত ব্যাংক অ্যাকাউন্টে সরাসরি ক্ষতিপূরণ জমা।" : language === "kn" ? "ದೃಢೀಕೃತ ಬ್ಯಾಂಕ್ ಖಾತೆಗಳಿಗೆ ನೇರ ಡಿಬಿಟಿ ಜಮೆ." : "Direct Benefit Transfer to verified landowner bank accounts via PFMS integration." },
    { time: language === "hi" ? "अनिवार्य चरण" : language === "bn" ? "বাধ্যতামূলক পর্যায়" : language === "kn" ? "ಕಡ್ಡಾಯ ಹಂತ" : "Mandatory Stage", desc: language === "hi" ? "राज्य राजस्व अभिलेखों में भूमि का विधिक स्वामित्व अधिग्रहण करने वाली संस्था के नाम दर्ज।" : language === "bn" ? "রাজস্ব রেকর্ডে আইনি স্বত্ব রূপায়ণকারী সংস্থার নামে রূপান্তর।" : language === "kn" ? "ಭೂ ದಾಖಲೆಗಳಲ್ಲಿ ಕಾನೂನಿನ ಹಕ್ಕು NHAI/ರೈಲ್ವೇ ಹೆಸರಿಗೆ ನೋಂದಣಿ." : "Legal title transfer in state land records to the acquiring body (NHAI/Railways)." },
    { time: language === "hi" ? "100% भुगतान पश्चात" : language === "bn" ? "100% অর্থপ্রদানের পর" : language === "kn" ? "100% ಪಾವತಿಯ ನಂತರ" : "Post 100% Payment", desc: language === "hi" ? "100% मौद्रिक मुआवजा और आरएंडआर जमा होने के बाद ही बाधा-मुक्त भूमि का हस्तांतरण।" : language === "bn" ? "100% ক্ষতিপূরণ পরিশোধের পরই দায়মুক্ত জমি হস্তান্তর।" : language === "kn" ? "100% ಪರಿಹಾರ ಮತ್ತು R&R ಠೇವಣಿ ನಂತರ ಮಾತ್ರ ಭೂಮಿ ಹಸ್ತಾಂತರ." : "Handover of encumbrance-free land only after 100% compensation and R&R deposit." },
    { time: language === "hi" ? "अंतिम पूर्णता" : language === "bn" ? "চূড়ান্ত সমাপ্তি" : language === "kn" ? "ಅಂತಿಮ ಸಮಾಪ್ತಿ" : "Final Closure", desc: language === "hi" ? "प्रभावित परिवारों के लिए पुनर्वास एवं पुनर्व्यवस्थापन का पूर्ण कार्यान्वयन।" : language === "bn" ? "ক্ষতিগ্রস্ত পরিবারগুলির পুনর্বাসন ও প্রকল্পের আনুষ্ঠানিক সমাপ্তি।" : language === "kn" ? "ಸಂತ್ರಸ್ತ ಕುಟುಂಬಗಳಿಗೆ ಪುನರ್ವಸತಿ ಸೌಲಭ್ಯಗಳ ಸಂಪೂರ್ಣ ಅನುಷ್ಠಾನ." : "Full implementation of Rehabilitation & Resettlement for affected families." },
  ];

  // ── Priority Corridors ──────────────────────────────────────────────
  const corridors = [
    { name: "Delhi–Mumbai Expressway (Pkg IV)", agency: "NHAI / MoRTH", parcels: "14,820", stage: "Sec. 19 Declared", progress: 88 },
    { name: "Western Dedicated Freight Corridor", agency: "DFCCIL / Railways", parcels: "22,450", stage: "Award & DBT", progress: 94 },
    { name: "Bengaluru–Chennai Expressway", agency: "NHAI / DIC", parcels: "8,920", stage: "Mutation", progress: 82 },
    { name: "Ken–Betwa River Link", agency: "NWDA / MoJS", parcels: "31,100", stage: "SIA & Sec. 11", progress: 65 },
  ];

  const currentStage = stageDetails[activeStage];

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-amber-50/20 to-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left: Text + Search */}
            <div className="space-y-7">
              {/* Slim badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300/60 bg-amber-50 text-amber-800 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {t("hero.badgeAct", "RFCTLARR Act, 2013 — Department of Land Resources, GoI")}
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black tracking-tight text-slate-900 leading-[1.15]">
                  {t("hero.title", "National Land Acquisition & Compliance Portal")}
                </h1>
                <p className="text-base text-slate-500 leading-relaxed max-w-lg">
                  {t("hero.desc", "GIS-native platform for transparent, time-bound RFCTLARR Act 2013 workflows — from gazette to DBT.")}
                </p>
              </div>

              {/* ULPIN Search */}
              <form onSubmit={handleUlpinSearch} className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("hero.searchPlaceholder", "Enter 14-digit ULPIN / Survey No.")}
                    value={ulpinInput}
                    onChange={(e) => setUlpinInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-mono placeholder:font-sans shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t("hero.searchBtn", "Check Status")}
                </button>
              </form>

              {/* CTA Row */}
              <div className="flex flex-wrap gap-3">
                <Link href="/atlas" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition-colors">
                  <MapPin className="w-4 h-4" />
                  {t("hero.btnAtlas", "Open GIS Atlas")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/workflow" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-xs transition-colors">
                  <GitBranch className="w-4 h-4 text-emerald-600" />
                  {t("hero.btnWorkflow", "Statutory Workflow")}
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1 border-t border-slate-100">
                {[
                  t("hero.statStages", "10 Statutory Stages"),
                  t("hero.statUlpin", "100% ULPIN-Anchored"),
                  t("hero.statRag", "RAG Escalation Engine"),
                  t("hero.statDbt", "DBT Audit-Ready"),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: GIS Visual Card */}
            <div className="relative rounded-2xl bg-slate-900 overflow-hidden shadow-2xl border border-slate-700/60 aspect-[4/3] lg:aspect-auto lg:h-[440px]">
              <Image
                src="/images/pic2.jpg"
                alt="National GIS Cadastral Map"
                fill
                className="object-cover opacity-75"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/50" />

              {/* Top bar */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-[11px] text-slate-200 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE · Sentinel-2 + Cadastral
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 uppercase tracking-wider">
                  Zoom 14.5×
                </span>
              </div>

              {/* Parcel popup */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-3.5 border border-slate-700/80 text-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> ULPIN: UP-LKO-2024-8841
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Sec. 19 Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                    <div><span className="text-slate-500">Corridor:</span> Delhi–Mumbai Pkg 4</div>
                    <div><span className="text-slate-500">Area:</span> 2.45 Ha (Agricultural)</div>
                    <div><span className="text-slate-500">Award:</span> <span className="text-emerald-400 font-semibold">₹1,42,80,000</span></div>
                    <div><span className="text-slate-500">Status:</span> <span className="text-amber-300">DBT Pending</span></div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-700">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Acquisition Progress</span>
                      <span className="text-amber-300 font-bold">88%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: "88%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-7 grid grid-cols-2 sm:grid-cols-4 gap-5 divide-x divide-slate-700/50">
          {[
            { value: "2.8M+", label: t("stat.parcels", "ULPIN-Keyed Parcels") },
            { value: "10", label: t("stat.stages", "Statutory Stages"), sub: "RFCTLARR 2013" },
            { value: "28", label: t("stat.states", "States & UTs"), sub: "Active Projects" },
            { value: "₹4.2T", label: t("stat.disbursed", "Awards Monitored"), sub: "DBT Integrated" },
          ].map((s, i) => (
            <div key={i} className="text-center pl-5 first:pl-0">
              <div className="text-2xl font-black text-amber-400">{s.value}</div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">{s.label}</div>
              {s.sub && <div className="text-[10px] text-slate-500 mt-0.5">{s.sub}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULE GRID ─────────────────────────────────────────────── */}
      <section className="py-16 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-9">
            <h2 className="text-2xl font-black text-slate-900">
              {t("section.modules", "Platform Modules")}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t("section.modulesDesc", "Integrated toolset covering every stage of land acquisition.")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="group flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className={`p-2.5 rounded-xl ${mod.bg} flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${mod.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors flex items-center justify-between">
                      {mod.title}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── RFCTLARR LIFECYCLE ───────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">
              {t("section.lifecycle", "RFCTLARR Act 2013 — 10-Stage Statutory Lifecycle")}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t("section.lifecycleDesc", "Select any stage to view statutory timelines and legal requirements.")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stage Pills */}
            <div className="lg:col-span-1 space-y-1">
              {stages.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer text-sm ${
                    activeStage === i
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-amber-300 hover:text-amber-700"
                  }`}
                >
                  <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${activeStage === i ? "bg-amber-500/30 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {s.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-xs">{s.label}</div>
                    <div className={`text-[10px] ${activeStage === i ? "text-amber-200" : "text-slate-400"}`}>{s.sec}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Stage Detail Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
                      {stages[activeStage]?.sec}
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{stages[activeStage]?.label}</h3>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 text-right">
                    {currentStage?.time}
                  </div>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-6">{currentStage?.desc}</p>

                {/* Visual Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>{t("stage.progress", "Lifecycle Progress")}</span>
                    <span className="font-bold text-slate-600">{activeStage + 1} / 10</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${((activeStage + 1) / 10) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Proposal & SIA</span>
                    <span>R&R Closure</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href="/workflow"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    {t("stage.viewWorkflow", "View Live Workflow")}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    {t("stage.analytics", "Stage Analytics")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRIORITY CORRIDORS ──────────────────────────────────────── */}
      <section className="py-16 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {t("section.corridors", "Priority Infrastructure Corridors")}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {t("section.corridorsDesc", "Active land acquisition monitoring across PM GatiShakti projects.")}
              </p>
            </div>
            <Link href="/archive" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors">
              <Archive className="w-3.5 h-3.5" />
              {t("section.viewAll", "View All Projects")}
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">
                      {t("table.corridor", "Corridor / Project")}
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                      {t("table.agency", "Agency")}
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                      {t("table.parcels", "Parcels")}
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                      {t("table.stage", "Current Stage")}
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">
                      {t("table.progress", "Progress")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corridors.map((c, i) => (
                    <tr key={i} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{c.name}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs hidden sm:table-cell">{c.agency}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs hidden md:table-cell font-mono">{c.parcels}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {c.stage}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.progress >= 90 ? "bg-emerald-500" : c.progress >= 75 ? "bg-amber-500" : "bg-blue-500"}`}
                              style={{ width: `${c.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{c.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLE CTA ────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900">{t("section.access", "Access by Role")}</h2>
            <p className="text-sm text-slate-500 mt-1">{t("section.accessDesc", "Tailored workflows for every stakeholder in the land acquisition process.")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: language === "hi" ? "नागरिक / भू-स्वामी" : language === "bn" ? "নাগরিক / ভূ-মালিক" : language === "kn" ? "ನಾಗರಿಕ / ಭೂಮಾಲೀಕ" : "Citizen / Landowner",
                desc: language === "hi" ? "ULPIN से स्थिति जांचें, मुआवजा विवरण देखें और आपत्ति दर्ज करें।" : language === "bn" ? "ULPIN দিয়ে স্থিতি দেখুন, ক্ষতিপূরণ যাচাই করুন।" : language === "kn" ? "ULPIN ಮೂಲಕ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ, ಪರಿಹಾರ ನೋಡಿ." : "Check parcel status, verify compensation, and file online grievances via ULPIN.",
                href: "/citizen",
                cta: language === "hi" ? "नागरिक पोर्टल" : language === "bn" ? "নাগরিক পোর্টাল" : language === "kn" ? "ನಾಗರಿಕ ಪೋರ್ಟಲ್" : "Citizen Portal",
                icon: Landmark,
                color: "border-teal-200 bg-teal-50/50",
                iconColor: "text-teal-600 bg-teal-100",
                ctaColor: "bg-teal-700 hover:bg-teal-800",
              },
              {
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
                <div key={role.href} className={`p-6 rounded-2xl border ${role.color} flex flex-col gap-4`}>
                  <div className={`w-10 h-10 rounded-xl ${role.iconColor} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm mb-1.5">{role.title}</h3>
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

      {/* ── FOOTER CTA ──────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-white mb-1">
              {t("cta.title", "Start with GIS Atlas")}
            </h2>
            <p className="text-sm text-slate-400">
              {t("cta.desc", "Visualise land parcels, project corridors and acquisition risk across India.")}
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/atlas"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm shadow-sm transition-colors"
            >
              <MapPin className="w-4 h-4" />
              {t("cta.btn", "Open GIS Atlas")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-600 hover:border-slate-500 text-slate-200 font-semibold text-sm transition-colors"
            >
              <Shield className="w-4 h-4" />
              {t("cta.login", "Official Login")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}