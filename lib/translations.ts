export type Language = "en" | "hi" | "bn" | "kn";

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Top Bar
    "govt.india": "Government of India",
    "govt.mord": "Ministry of Rural Development",
    "govt.dolr": "Department of Land Resources (DoLR)",
    "govt.helpline": "Helpline",
    "govt.liveFeed": "Live Portal Feed",

    // Nav
    "nav.brand": "BhoomiSetu",
    "nav.tagline": "National Land Acquisition & Compliance Portal",
    "nav.home": "Home",
    "nav.atlas": "GIS Atlas",
    "nav.workflow": "Workflow",
    "nav.analytics": "Analytics",
    "nav.citizen": "Citizen Corner",
    "nav.tools": "Governance Tools",
    "nav.ocr": "Document OCR Extraction",
    "nav.risk": "Explainable Risk Engine",
    "nav.archive": "Digital Records Archive",
    "nav.admin": "CALA & Admin Console",
    "nav.ulpinSearch": "ULPIN Search",
    "nav.login": "Official Login",
    "nav.signOut": "Sign Out",

    // Hero Section
    "hero.badgeAct": "RFCTLARR Act, 2013 Statutory Compliance",
    "hero.badgeGati": "PM GatiShakti National Master Plan Aligned",
    "hero.title": "Integrated National Land Acquisition & Cadastral Compliance Portal",
    "hero.desc": "A GIS-native national orchestration platform enforcing transparent, time-bound statutory lifecycles under the RFCTLARR Act, 2013. Unified with 14-digit ULPIN parcel mapping, AI gazette extraction, and automated DBT compensation auditing.",
    "hero.searchLabel": "Instant Citizen Land Parcel Lookup (ULPIN / Survey No.)",
    "hero.searchPlaceholder": "e.g. UP-LKO-2024-8841 or 14-Digit Bhu-Aadhaar",
    "hero.searchBtn": "Verify Land Status",
    "hero.quickSamples": "Quick Test Samples:",
    "hero.publicTransparency": "Public Transparency",
    "hero.btnAtlas": "Open National GIS Atlas",
    "hero.btnWorkflow": "Statutory 10-Stage Pipeline",
    "hero.btnDashboard": "National Executive Dashboard",
    "hero.statStages": "10 Statutory Stages",
    "hero.statUlpin": "100% ULPIN Anchored",
    "hero.statRag": "RAG Escalation",
    "hero.statPostgis": "PostGIS Spatial Math",

    // Indicators
    "metrics.title": "Real-Time Compliance Across 28 States & 8 Union Territories",
    "metrics.subtitle": "National Land Acquisition Operations & Statutory Indicators",
    "metrics.viewDetails": "View Detailed Analytics",
    "metrics.projects": "Projects Monitored",
    "metrics.parcels": "Parcels with ULPIN",
    "metrics.compensation": "DBT Compensation",
    "metrics.mutation": "RoR Mutation Sync",
    "metrics.timeSaved": "Statutory Time Saved",
    "metrics.directBank": "Direct to Bank Accounts",
    "metrics.titleTransferred": "Legal Title Transferred",
    "metrics.avgPerProject": "Avg per Project Corridor",

    // Statutory Pipeline
    "pipeline.badge": "Statutory Mandate",
    "pipeline.title": "RFCTLARR Act, 2013 — 10-Stage Enforceable State Machine",
    "pipeline.desc": "Every infrastructure acquisition is tracked through mandatory statutory milestones. Deadlines are automatically computed to prevent legal lapses and administrative overruns.",
    "pipeline.inspectBtn": "Inspect Workflow Pipeline",
    "pipeline.legalReq": "Legal Requirement",
    "pipeline.enforceMech": "Enforcement Mechanism",
    "pipeline.reqOutputs": "Required Outputs",

    // Strategic Corridors
    "corridors.badge": "High-Impact Infrastructure",
    "corridors.title": "Active Priority Corridors Tracked",
    "corridors.desc": "Real-time tracking of critical expressways, dedicated freight corridors, and irrigation networks.",
    "corridors.allProjects": "All 1,480 Projects",
    "corridors.completion": "Acquisition Completion",

    // Stakeholders
    "stakeholders.badge": "Stakeholder Ecosystem",
    "stakeholders.title": "Tailored Portals for Every Institutional Role",
    "stakeholders.desc": "Secure, authenticated interfaces aligned with the statutory duties of state and central authorities.",
    "stakeholders.landowners": "Landowners & Farmers",
    "stakeholders.landownersDesc": "Direct access to verify land acquisition status, review compensation calculation sheets, check DBT bank status, and file grievances.",
    "stakeholders.cala": "Collectors & CALA",
    "stakeholders.calaDesc": "Manage preliminary gazettes, oversee Section 15 objection hearings, authorize awards, and supervise time-bound RAG escalations.",
    "stakeholders.agencies": "Implementing Bodies",
    "stakeholders.agenciesDesc": "NHAI, Indian Railways, and MoRTH can upload GIS alignment shapefiles, detect parcel overlaps, and track compensation escrow accounts.",
    "stakeholders.revenue": "Revenue & Land Records",
    "stakeholders.revenueDesc": "Synchronize DILRMP Bhulekh records of rights, verify cadastral polygon maps, and record instantaneous legal mutation certificates.",

    // Footer
    "footer.desc": "National Land Acquisition Control & Statutory Compliance Portal. Designed and developed for the Department of Land Resources (DoLR), Ministry of Rural Development, Government of India.",
    "footer.modules": "Portal Modules",
    "footer.citizen": "Citizen Corner",
    "footer.integrated": "Integrated Systems",
    "footer.copyright": "BhoomiSetu. Department of Land Resources (DoLR), Government of India.",
  },

  hi: {
    // Top Bar
    "govt.india": "भारत सरकार",
    "govt.mord": "ग्रामीण विकास मंत्रालय",
    "govt.dolr": "भूमि संसाधन विभाग (DoLR)",
    "govt.helpline": "हेल्पलाइन",
    "govt.liveFeed": "लाइव पोर्टल फीड",

    // Nav
    "nav.brand": "भूमि सेतु",
    "nav.tagline": "राष्ट्रीय भूमि अधिग्रहण एवं अनुपालन पोर्टल",
    "nav.home": "मुख्य पृष्ठ",
    "nav.atlas": "जीआईएस एटलस",
    "nav.workflow": "कार्यप्रवाह",
    "nav.analytics": "एनालिटिक्स",
    "nav.citizen": "नागरिक सेवाएँ",
    "nav.tools": "प्रशासनिक उपकरण",
    "nav.ocr": "दस्तावेज़ ओसीआर निष्कर्षण",
    "nav.risk": "जोखिम मूल्यांकन इंजन",
    "nav.archive": "डिजिटल अभिलेखागार",
    "nav.admin": "सीएएलए और एडमिन कंसोल",
    "nav.ulpinSearch": "यूलपिन खोज",
    "nav.login": "विभागीय लॉगिन",
    "nav.signOut": "लॉग आउट",

    // Hero Section
    "hero.badgeAct": "आरएफसीटीएलएआरआर अधिनियम, 2013 वैधानिक अनुपालन",
    "hero.badgeGati": "पीएम गतिशक्ति राष्ट्रीय मास्टर प्लान से एकीकृत",
    "hero.title": "एकीकृत राष्ट्रीय भूमि अधिग्रहण एवं भू-स्थानिक अनुपालन पोर्टल",
    "hero.desc": "आरएफसीटीएलएआरआर अधिनियम, 2013 के तहत पारदर्शी एवं समयबद्ध वैधानिक प्रक्रियाओं को लागू करने वाला राष्ट्रीय जीआईएस मंच। 14-अंकीय यूलपिन भूखंड मैपिंग, एआई गजट निष्कर्षण, और प्रत्यक्ष लाभ अंतरण (डीबीटी) मुआवजा निगरानी से युक्त।",
    "hero.searchLabel": "त्वरित नागरिक भूमि भूखंड खोज (यूलपिन / खसरा सं.)",
    "hero.searchPlaceholder": "उदा. UP-LKO-2024-8841 या 14-अंकीय भू-आधार",
    "hero.searchBtn": "भूमि स्थिति जांचें",
    "hero.quickSamples": "त्वरित परीक्षण नमूने:",
    "hero.publicTransparency": "सार्वजनिक पारदर्शिता",
    "hero.btnAtlas": "राष्ट्रीय जीआईएस एटलस खोलें",
    "hero.btnWorkflow": "वैधानिक 10-चरणीय पाइपलाइन",
    "hero.btnDashboard": "राष्ट्रीय कार्यकारी डैशबोर्ड",
    "hero.statStages": "10 वैधानिक चरण",
    "hero.statUlpin": "100% यूलपिन आधारित",
    "hero.statRag": "आरएजी समयसीमा चेतावनी",
    "hero.statPostgis": "पोस्टजीआईएस स्थानिक गणना",

    // Indicators
    "metrics.title": "28 राज्यों और 8 केंद्र शासित प्रदेशों में वास्तविक समय अनुपालन",
    "metrics.subtitle": "राष्ट्रीय भूमि अधिग्रहण संचालन एवं वैधानिक संकेतक",
    "metrics.viewDetails": "विस्तृत एनालिटिक्स देखें",
    "metrics.projects": "निगरानी की जा रही परियोजनाएं",
    "metrics.parcels": "यूलपिन युक्त कुल भूखंड",
    "metrics.compensation": "डीबीटी मुआवजा वितरित",
    "metrics.mutation": "राजस्व दाखिल-खारिज दर",
    "metrics.timeSaved": "बचाया गया वैधानिक समय",
    "metrics.directBank": "सीधे बैंक खातों में हस्तांतरित",
    "metrics.titleTransferred": "विधिक स्वामित्व हस्तांतरित",
    "metrics.avgPerProject": "औसत प्रति परियोजना गलियारा",

    // Statutory Pipeline
    "pipeline.badge": "वैधानिक जनादेश",
    "pipeline.title": "आरएफसीटीएलएआरआर अधिनियम, 2013 — 10-चरणीय बाध्यकारी प्रक्रिया",
    "pipeline.desc": "प्रत्येक बुनियादी ढांचा अधिग्रहण अनिवार्य कानूनी चरणों के माध्यम से ट्रैक किया जाता है। प्रशासनिक विलंब और कानूनी चूक रोकने के लिए समयसीमाएं स्वचालित रूप से गणना की जाती हैं।",
    "pipeline.inspectBtn": "कार्यप्रवाह पाइपलाइन देखें",
    "pipeline.legalReq": "कानूनी अनिवार्यता",
    "pipeline.enforceMech": "प्रवर्तन तंत्र",
    "pipeline.reqOutputs": "आवश्यक परिणाम/दस्तावेज़",

    // Strategic Corridors
    "corridors.badge": "महत्वपूर्ण बुनियादी ढांचा",
    "corridors.title": "सक्रिय प्राथमिकता वाले गलियारों की निगरानी",
    "corridors.desc": "एक्सप्रेसवे, माल ढुलाई गलियारों (डीएफसी) और सिंचाई परियोजनाओं की वास्तविक समय ट्रैकिंग।",
    "corridors.allProjects": "सभी 1,480 परियोजनाएं",
    "corridors.completion": "भूमि अधिग्रहण प्रगति",

    // Stakeholders
    "stakeholders.badge": "हितधारक पारिस्थितिकी तंत्र",
    "stakeholders.title": "प्रत्येक संस्थागत भूमिका के लिए विशेष पोर्टल",
    "stakeholders.desc": "राज्य और केंद्र सरकार के अधिकारियों के वैधानिक कर्तव्यों के अनुरूप सुरक्षित और प्रमाणित इंटरफेस।",
    "stakeholders.landowners": "भू-स्वामी एवं किसान",
    "stakeholders.landownersDesc": "अधिग्रहण स्थिति जांचें, मुआवजा गणना पत्रक देखें, डीबीटी भुगतान की स्थिति ट्रैक करें और आपत्तियां दर्ज करें।",
    "stakeholders.cala": "जिला कलेक्टर और सीएएलए",
    "stakeholders.calaDesc": "धारा 11/19 गजट अधिसूचनाएं जारी करें, धारा 15 की सुनवाई संचालित करें, और अवार्ड स्वीकृत करें।",
    "stakeholders.agencies": "कार्यान्वयन एजेंसियां (एनएचएआई/रेलवे)",
    "stakeholders.agenciesDesc": "जीआईएस अलाइनमेंट मैप अपलोड करें, भूखंड ओवरलैप पहचानें और मुआवजा एस्क्रो खातों की निगरानी करें।",
    "stakeholders.revenue": "राजस्व एवं भूमि अभिलेख विभाग",
    "stakeholders.revenueDesc": "डीआईएलआरएमपी भूलेखा रिकॉर्ड सिंक्रनाइज़ करें, भू-नक्शा सत्यापित करें और त्वरित दाखिल-खारिज दर्ज करें।",

    // Footer
    "footer.desc": "राष्ट्रीय भूमि अधिग्रहण नियंत्रण एवं वैधानिक अनुपालन पोर्टल। भूमि संसाधन विभाग (DoLR), ग्रामीण विकास मंत्रालय, भारत सरकार द्वारा संचालित।",
    "footer.modules": "पोर्टल मॉड्यूल",
    "footer.citizen": "नागरिक कॉर्नर",
    "footer.integrated": "एकीकृत प्रणालियां",
    "footer.copyright": "भूमि सेतु। भूमि संसाधन विभाग (DoLR), भारत सरकार।",
  },

  bn: {
    // Top Bar
    "govt.india": "ভারত সরকার",
    "govt.mord": "গ্রামীণ উন্নয়ন মন্ত্রক",
    "govt.dolr": "ভূমি সম্পদ বিভাগ (DoLR)",
    "govt.helpline": "হেল্পলাইন",
    "govt.liveFeed": "লাইভ পোর্টাল ফিড",

    // Nav
    "nav.brand": "ভূমি সেতু",
    "nav.tagline": "জাতীয় ভূমি অধিগ্রহণ ও বিধিবদ্ধ সম্মতি পোর্টাল",
    "nav.home": "মূল পাতা",
    "nav.atlas": "জিআইএস মানচিত্র",
    "nav.workflow": "কার্যপ্রবাহ",
    "nav.analytics": "পরিসংখ্যান",
    "nav.citizen": "নাগরিক পরিষেবা",
    "nav.tools": "প্রশাসনিক সরঞ্জাম",
    "nav.ocr": "নথিপত্র ওসিআর নিষ্কাশন",
    "nav.risk": "ঝুঁকি মূল্যায়ন ইঞ্জিন",
    "nav.archive": "ডিজিটাল রেকর্ড সংরক্ষণাগার",
    "nav.admin": "সিএএলএ ও অ্যাডমিন কনসোল",
    "nav.ulpinSearch": "ইউএলপিআইএন সন্ধান",
    "nav.login": "বিভাগীয় লগইন",
    "nav.signOut": "লগ আউট",

    // Hero Section
    "hero.badgeAct": "আরএফসিটিএলএআরআর আইন, ২০১৩ বিধিবদ্ধ সম্মতি",
    "hero.badgeGati": "পিএম গতিশক্তি ন্যাশনাল মাস্টার প্ল্যান সংযুক্ত",
    "hero.title": "সমন্বিত জাতীয় ভূমি অধিগ্রহণ ও ক্যাডাস্ট্রাল সম্মতি পোর্টাল",
    "hero.desc": "আরএফসিটিএলএআরআর আইন, ২০১৩-এর অধীনে স্বচ্ছ ও সময়সীমাবদ্ধ প্রক্রিয়াকরণ নিশ্চিতকারী একটি জিআইএস প্ল্যাটফর্ম। ১৪-ডিজিটের ইউএলপিআইএন চিহ্নিতকরণ, এআই গেজেট প্রক্রিয়াকরণ এবং সরাসরি ব্যাংক স্থানান্তরের (ডিবিটি) মাধ্যমে ক্ষতিপূরণ প্রদান।",
    "hero.searchLabel": "নাগরিকদের জন্য সরাসরি জমির খতিয়ান/ইউএলপিআইএন অনুসন্ধান",
    "hero.searchPlaceholder": "যেমন: UP-LKO-2024-8841 অথবা ১৪-ডিজিটের ভূ-আধার",
    "hero.searchBtn": "জমির স্থিতি যাচাই করুন",
    "hero.quickSamples": "নমুনা অনুসন্ধান:",
    "hero.publicTransparency": "নাগরিক স্বচ্ছতা",
    "hero.btnAtlas": "জাতীয় জিআইএস অ্যাটলাস খুলুন",
    "hero.btnWorkflow": "বিধিবদ্ধ ১০-ধাপের প্রক্রিয়া",
    "hero.btnDashboard": "জাতীয় এক্সিকিউটিভ ড্যাশবোর্ড",
    "hero.statStages": "১০টি বিধিবদ্ধ পর্যায়",
    "hero.statUlpin": "১০০% ইউএলপিআইএন সংযুক্ত",
    "hero.statRag": "আরএজি সময়সীমা সতর্কতা",
    "hero.statPostgis": "পোস্টজিআইএস অবস্থান গণনা",

    // Indicators
    "metrics.title": "২৮টি রাজ্য এবং ৮টি কেন্দ্রশাসিত অঞ্চলে রিয়েল-টাইম সম্মতি",
    "metrics.subtitle": "জাতীয় ভূমি অধিগ্রহণ কার্যক্রম ও বিধিবদ্ধ সূচক",
    "metrics.viewDetails": "বিস্তারিত পরিসংখ্যান দেখুন",
    "metrics.projects": "পর্যবেক্ষণাধীন প্রকল্প",
    "metrics.parcels": "ইউএলপিআইএন যুক্ত মোট জমি",
    "metrics.compensation": "ডিবিটি ক্ষতিপূরণ প্রদান",
    "metrics.mutation": "জমির মিউটেশন বা নামজারি হার",
    "metrics.timeSaved": "সংরক্ষিত বিধিবদ্ধ সময়",
    "metrics.directBank": "সরাসরি ব্যাংক অ্যাকাউন্টে জমা",
    "metrics.titleTransferred": "আইনি স্বত্ব হস্তান্তর সম্পন্ন",
    "metrics.avgPerProject": "প্রকল্প প্রতি গড় সংরক্ষিত সময়",

    // Statutory Pipeline
    "pipeline.badge": "বিধিবদ্ধ নির্দেশিকা",
    "pipeline.title": "আরএফসিটিএলএআরআর আইন, ২০১৩ — ১০-ধাপের বাধ্যতামূলক কার্যপ্রবাহ",
    "pipeline.desc": "প্রতিটি অবকাঠামো প্রকল্পের ভূমি অধিগ্রহণ বাধ্যতামূলক আইনি পর্যায়ক্রমের মধ্য দিয়ে পরিচালিত হয়। সময়সীমা স্বয়ংক্রিয়ভাবে গণনা করা হয় যাতে কোনো আইনি বিলম্ব না ঘটে।",
    "pipeline.inspectBtn": "সম্পূর্ণ কার্যপ্রবাহ দেখুন",
    "pipeline.legalReq": "আইনি প্রয়োজনীয়তা",
    "pipeline.enforceMech": "প্রয়োগ ব্যবস্থা",
    "pipeline.reqOutputs": "প্রয়োজনীয় ফলাফল/গেজেট",

    // Strategic Corridors
    "corridors.badge": "অগ্রাধিকারপ্রাপ্ত অবকাঠামো",
    "corridors.title": "সক্রিয় জাতীয় করিডোর পর্যবেক্ষণ",
    "corridors.desc": "জাতীয় মহাসড়ক, ফ্রেইট করিডোর এবং সেচ প্রকল্পের রিয়েল-টাইম অগ্রগতি।",
    "corridors.allProjects": "সকল ১,৪৮০টি প্রকল্প",
    "corridors.completion": "অধিগ্রহণ সম্পন্নতার হার",

    // Stakeholders
    "stakeholders.badge": "অংশীদারদের সুবিধাসমূহ",
    "stakeholders.title": "প্রতিটি প্রশাসনিক ভূমিকার জন্য ডেডিকেটেড পোর্টাল",
    "stakeholders.desc": "রাজ্য ও কেন্দ্রীয় আধিকারিকদের বিধিবদ্ধ দায়িত্বের সাথে সুসংগত সুরক্ষিত ইন্টারফেস।",
    "stakeholders.landowners": "জমির মালিক ও কৃষক",
    "stakeholders.landownersDesc": "জমির অধিগ্রহণের স্থিতি যাচাই করুন, ক্ষতিপূরণের হিসাবপত্র দেখুন এবং অভিযোগ দাখিল করুন।",
    "stakeholders.cala": "জেলাশাসক ও সিএএলএ",
    "stakeholders.calaDesc": "ধারা ১১ ও ধারা ১৯ গেজেট বিজ্ঞপ্তি জারি করুন, শুনানি পরিচালনা করুন এবং ক্ষতিপূরণ অনুমোদন করুন।",
    "stakeholders.agencies": "প্রকল্প রূপায়ণকারী সংস্থা (এনএইচএআই/রেল)",
    "stakeholders.agenciesDesc": "জিআইএস অ্যালাইনমেন্ট ম্যাপ আপলোড করুন, জমির সংঘাত চিহ্নিত করুন এবং ক্ষতিপূরণ নজরদারি করুন।",
    "stakeholders.revenue": "রাজস্ব ও ভূমি সংস্কার বিভাগ",
    "stakeholders.revenueDesc": "ডিআইএলআরএমপি খতিয়ান রেকর্ড সিঙ্ক করুন, মৌজা মানচিত্র যাচাই করুন এবং নামজারি নিশ্চিত করুন।",

    // Footer
    "footer.desc": "জাতীয় ভূমি অধিগ্রহণ নিয়ন্ত্রণ ও বিধিবদ্ধ সম্মতি পোর্টাল। ভূমি সম্পদ বিভাগ (DoLR), গ্রামীণ উন্নয়ন মন্ত্রক, ভারত সরকার।",
    "footer.modules": "পোর্টাল মডিউল",
    "footer.citizen": "নাগরিক পরিষেবা",
    "footer.integrated": "সংযুক্ত পোর্টাল",
    "footer.copyright": "ভূমি সেতু। ভূমি সম্পদ বিভাগ (DoLR), ভারত সরকার।",
  },

  kn: {
    // Top Bar
    "govt.india": "ಭಾರತ ಸರ್ಕಾರ",
    "govt.mord": "ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಸಚಿವಾಲಯ",
    "govt.dolr": "ಭೂ ಸಂಪನ್ಮೂಲಗಳ ಇಲಾಖೆ (DoLR)",
    "govt.helpline": "ಸಹಾಯವಾಣಿ",
    "govt.liveFeed": "ಲೈವ್ ಪೋರ್ಟಲ್ ಫೀಡ್",

    // Nav
    "nav.brand": "ಭೂಮಿ ಸೇತು",
    "nav.tagline": "ರಾಷ್ಟ್ರೀಯ ಭೂಸ್ವಾಧೀನ ಮತ್ತು ಶಾಸನಬದ್ಧ ಅನುಸರಣಾ ಪೋರ್ಟಲ್",
    "nav.home": "ಮುಖಪುಟ",
    "nav.atlas": "ಜಿಐಎಸ್ ಭೂಪಟ",
    "nav.workflow": "ಕಾರ್ಯಪ್ರವಾಹ",
    "nav.analytics": "ವಿಶ್ಲೇಷಣೆ",
    "nav.citizen": "ನಾಗರಿಕ ಸೇವೆಗಳು",
    "nav.tools": "ಆಡಳಿತ ಉಪಕರಣಗಳು",
    "nav.ocr": "ದಾಖಲೆ ಓಸಿಆರ್ ಹೊರತೆಗೆಯುವಿಕೆ",
    "nav.risk": "ಅಪಾಯ ಎಂಜಿನ್",
    "nav.archive": "ಡಿಜಿಟಲ್ ದಾಖಲೆಗಳು",
    "nav.admin": "ಸಿಎಎಲ್‌ಎ ಮತ್ತು ಅಡ್ಮಿನ್ ಕನ್ಸೋಲ್",
    "nav.ulpinSearch": "ಯುಎಲ್‌ಪಿಐಎನ್ ಹುಡುಕಾಟ",
    "nav.login": "ಇಲಾಖಾ ಲಾಗಿನ್",
    "nav.signOut": "ಸೈನ್ ಔಟ್",

    // Hero Section
    "hero.badgeAct": "ಆರ್‌ಎಫ್‌ಸಿಟಿಎಲ್‌ಎಆರ್‌ಆರ್ ಕಾಯ್ದೆ, 2013 ಶಾಸನಬದ್ಧ ಅನುಸರಣೆ",
    "hero.badgeGati": "ಪಿಎಂ ಗತಿಶಕ್ತಿ ರಾಷ್ಟ್ರೀಯ ಮಾಸ್ಟರ್ ಪ್ಲಾನ್ ಜೋಡಣೆ",
    "hero.title": "ಸಮಗ್ರ ರಾಷ್ಟ್ರೀಯ ಭೂಸ್ವಾಧೀನ ಮತ್ತು ಜಿಐಎಸ್ ಅನುಸರಣಾ ಪೋರ್ಟಲ್",
    "hero.desc": "ಆರ್‌ಎಫ್‌ಸಿಟಿಎಲ್‌ಎಆರ್‌ಆರ್ ಕಾಯ್ದೆ, 2013 ರ ಅಡಿಯಲ್ಲಿ ಪಾರದರ್ಶಕ ಮತ್ತು ಸಮಯ-ಬದ್ಧ ಶಾಸನಬದ್ಧ ಪ್ರಕ್ರಿಯೆಗಳನ್ನು ಜಾರಿಗೊಳಿಸುವ ರಾಷ್ಟ್ರೀಯ ಜಿಐಎಸ್ ವೇದಿಕೆ. 14-ಅಂಕಿಯ ಯುಎಲ್‌ಪಿಐಎನ್ ಭೂ ನಕ್ಷೆ, ಎಐ ಗೆಜೆಟ್ ಪರಿಶೀಲನೆ ಮತ್ತು ನೇರ ನಗದು ವರ್ಗಾವಣೆ (ಡಿಬಿಟಿ) ಪರಿಹಾರ ಮೇಲ್ವಿಚಾರಣೆ.",
    "hero.searchLabel": "ತ್ವರಿತ ನಾಗರಿಕ ಭೂಮಿ ಯುಎಲ್‌ಪಿಐಎನ್ / ಸರ್ವೆ ನಂಬರ್ ಹುಡುಕಾಟ",
    "hero.searchPlaceholder": "ಉದಾ: KA-BLR-2024-9921 ಅಥವಾ 14-ಅಂಕಿಯ ಭೂ-ಆಧಾರ್",
    "hero.searchBtn": "ಭೂಮಿ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ",
    "hero.quickSamples": "ಮಾದರಿ ಪರೀಕ್ಷೆ:",
    "hero.publicTransparency": "ಸಾರ್ವಜನಿಕ ಪಾರದರ್ಶಕತೆ",
    "hero.btnAtlas": "ರಾಷ್ಟ್ರೀಯ ಜಿಐಎಸ್ ನಕ್ಷೆ ತೆರೆಯಿರಿ",
    "hero.btnWorkflow": "ಶಾಸನಬದ್ಧ 10-ಹಂತದ ಪ್ರಕ್ರಿಯೆ",
    "hero.btnDashboard": "ರಾಷ್ಟ್ರೀಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "hero.statStages": "10 ಶಾಸನಬದ್ಧ ಹಂತಗಳು",
    "hero.statUlpin": "100% ಯುಎಲ್‌ಪಿಐಎನ್ ಜೋಡಣೆ",
    "hero.statRag": "ಆರ್‌ಎಜಿ ಗಡುವು ಎಚ್ಚರಿಕೆ",
    "hero.statPostgis": "ಪೋಸ್ಟ್‌ಜಿಐಎಸ್ ಸ್ಥಾನಿಕ ಲೆಕ್ಕಾಚಾರ",

    // Indicators
    "metrics.title": "28 ರಾಜ್ಯಗಳು ಮತ್ತು 8 ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶಗಳಲ್ಲಿ ನೈಜ-ಸಮಯದ ಅನುಸರಣೆ",
    "metrics.subtitle": "ರಾಷ್ಟ್ರೀಯ ಭೂಸ್ವಾಧೀನ ಕಾರ್ಯಾಚರಣೆಗಳು ಮತ್ತು ಶಾಸನಬದ್ಧ ಸೂಚಕಗಳು",
    "metrics.viewDetails": "ವಿವರವಾದ ವಿಶ್ಲೇಷಣೆ ವೀಕ್ಷಿಸಿ",
    "metrics.projects": "ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿದ ಯೋಜನೆಗಳು",
    "metrics.parcels": "ಯುಎಲ್‌ಪಿಐಎನ್ ಹೊಂದಿರುವ ಒಟ್ಟು ಜಮೀನುಗಳು",
    "metrics.compensation": "ಡಿಬಿಟಿ ಪರಿಹಾರ ವಿತರಣೆ",
    "metrics.mutation": "ಖಾತಾ ಬದಲಾವಣೆ (ಮ್ಯುಟೇಶನ್) ದರ",
    "metrics.timeSaved": "ಉಳಿಸಿದ ಶಾಸನಬದ್ಧ ಸಮಯ",
    "metrics.directBank": "ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗಳಿಗೆ",
    "metrics.titleTransferred": "ಕಾನೂನುಬದ್ಧ ಹಕ್ಕು ವರ್ಗಾವಣೆ ಪೂರ್ಣ",
    "metrics.avgPerProject": "ಯೋಜನೆಗೆ ಸರಾಸರಿ ಉಳಿತಾಯ",

    // Statutory Pipeline
    "pipeline.badge": "ಶಾಸನಬದ್ಧ ಆದೇಶ",
    "pipeline.title": "ಆರ್‌ಎಫ್‌ಸಿಟಿಎಲ್‌ಎಆರ್‌ಆರ್ ಕಾಯ್ದೆ, 2013 — 10-ಹಂತದ ಕಡ್ಡಾಯ ಪ್ರಕ್ರಿಯೆ",
    "pipeline.desc": "ಪ್ರತಿಯೊಂದು ಮೂಲಸೌಕರ್ಯ ಭೂಸ್ವಾಧೀನವನ್ನು ಕಡ್ಡಾಯ ಕಾನೂನು ಹಂತಗಳ ಮೂಲಕ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲಾಗುತ್ತದೆ. ಕಾನೂನು ವಿಳಂಬವನ್ನು ತಪ್ಪಿಸಲು ಗಡುವುಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ.",
    "pipeline.inspectBtn": "ಕಾರ್ಯಪ್ರವಾಹ ವೀಕ್ಷಿಸಿ",
    "pipeline.legalReq": "ಕಾನೂನು ಅಗತ್ಯತೆ",
    "pipeline.enforceMech": "ಜಾರಿಗೊಳಿಸುವ ಕಾರ್ಯವಿಧಾನ",
    "pipeline.reqOutputs": "ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು/ಗೆಜೆಟ್",

    // Strategic Corridors
    "corridors.badge": "ಪ್ರಮುಖ ಮೂಲಸೌಕರ್ಯ",
    "corridors.title": "ಸಕ್ರಿಯ ಆದ್ಯತೆಯ ಕಾರಿಡಾರ್‌ಗಳ ಟ್ರ್ಯಾಕಿಂಗ್",
    "corridors.desc": "ಎಕ್ಸ್‌ಪ್ರೆಸ್‌ವೇಗಳು, ಸರಕು ಕಾರಿಡಾರ್‌ಗಳು ಮತ್ತು ನೀರಾವರಿ ಯೋಜನೆಗಳ ನೈಜ-ಸಮಯದ ಪ್ರಗತಿ.",
    "corridors.allProjects": "ಎಲ್ಲಾ 1,480 ಯೋಜನೆಗಳು",
    "corridors.completion": "ಸ್ವಾಧೀನ ಪೂರ್ಣತೆಯ ದರ",

    // Stakeholders
    "stakeholders.badge": "ಪಾಲುದಾರರ ವ್ಯವಸ್ಥೆ",
    "stakeholders.title": "ಪ್ರತಿಯೊಂದು ಸಾಂಸ್ಥಿಕ ಪಾತ್ರಕ್ಕಾಗಿ ವಿಶೇಷ ಪೋರ್ಟಲ್",
    "stakeholders.desc": "ರಾಜ್ಯ ಮತ್ತು ಕೇಂದ್ರ ಅಧಿಕಾರಿಗಳ ಶಾಸನಬದ್ಧ ಕರ್ತವ್ಯಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ಸುರಕ್ಷಿತ ಇಂಟರ್ಫೇಸ್.",
    "stakeholders.landowners": "ಭೂಮಾಲೀಕರು ಮತ್ತು ರೈತರು",
    "stakeholders.landownersDesc": "ಭೂಸ್ವಾಧೀನ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ, ಪರಿಹಾರ ಲೆಕ್ಕಾಚಾರ ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ ಮತ್ತು ಆನ್‌ಲೈನ್ ದೂರುಗಳನ್ನು ಸಲ್ಲಿಸಿ.",
    "stakeholders.cala": "ಜಿಲ್ಲಾಧಿಕಾರಿಗಳು ಮತ್ತು ಸಿಎಎಲ್‌ಎ",
    "stakeholders.calaDesc": "ಸೆಕ್ಷನ್ 11 ಮತ್ತು 19 ಅಧಿಸೂಚನೆಗಳನ್ನು ಹೊರಡಿಸಿ, ವಿಚಾರಣೆಗಳನ್ನು ನಡೆಸಿ ಮತ್ತು ಪರಿಹಾರವನ್ನು ಅನುಮೋದಿಸಿ.",
    "stakeholders.agencies": "ಅನುಷ್ಠಾನ ಸಂಸ್ಥೆಗಳು (ಎನ್‌ಎಚ್‌ಎಐ/ರೈಲ್ವೆ)",
    "stakeholders.agenciesDesc": "ಜಿಐಎಸ್ ನಕ್ಷೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಭೂ ಅತಿಕ್ರಮಣಗಳನ್ನು ಗುರುತಿಸಿ ಮತ್ತು ಪರಿಹಾರ ಠೇವಣಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
    "stakeholders.revenue": "ಕಂದಾಯ ಮತ್ತು ಭೂ ದಾಖಲೆಗಳ ಇಲಾಖೆ",
    "stakeholders.revenueDesc": "ಭೂಮಿ ಆರ್‍ಟಿಸಿ ದಾಖಲೆಗಳನ್ನು ಸಿಂಕ್ ಮಾಡಿ, ಭೂ ನಕ್ಷೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ತ್ವರಿತ ಮ್ಯುಟೇಶನ್ ಖಚಿತಪಡಿಸಿ.",

    // Footer
    "footer.desc": "ರಾಷ್ಟ್ರೀಯ ಭೂಸ್ವಾಧೀನ ನಿಯಂತ್ರಣ ಮತ್ತು ಶಾಸನಬದ್ಧ ಅನುಸರಣಾ ಪೋರ್ಟಲ್. ಭೂ ಸಂಪನ್ಮೂಲಗಳ ಇಲಾಖೆ (DoLR), ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ.",
    "footer.modules": "ಪೋರ್ಟಲ್ ಮಾಡ್ಯೂಲ್‌ಗಳು",
    "footer.citizen": "ನಾಗರಿಕ ಸೇವೆಗಳು",
    "footer.integrated": "ಸಂಯೋಜಿತ ವ್ಯವಸ್ಥೆಗಳು",
    "footer.copyright": "ಭೂಮಿ ಸೇತು. ಭೂ ಸಂಪನ್ಮೂಲಗಳ ಇಲಾಖೆ (DoLR), ಭಾರತ ಸರ್ಕಾರ.",
  },
};
