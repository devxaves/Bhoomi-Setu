# BhoomiSetu (भूमिसेतु) 🏛️📍
### National Land Acquisition Control & Compliance Portal
*Department of Land Resources (DoLR) | Ministry of Rural Development, Government of India*
*Aligned with PM GatiShakti National Master Plan & RFCTLARR Act, 2013*

---

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=flat-square&logo=postgresql)](https://neon.tech/)
[![MapLibre GL](https://img.shields.io/badge/GIS-MapLibre_GL-38A169?style=flat-square&logo=mapbox)](https://maplibre.org/)
[![Groq AI](https://img.shields.io/badge/AI-Groq_LLM-FF6F00?style=flat-square)](https://groq.com/)
[![Multilingual](https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20BN%20%7C%20KN-008080?style=flat-square)](#-multilingual-support)

---

## 📌 Executive Summary

**BhoomiSetu** is a unified, enterprise GIS-native national land acquisition control, monitoring, and compliance platform designed for major linear infrastructure projects (Highways, Railways, Industrial Corridors, Transmission Lines, and Pipelines).

The platform enforces end-to-end statutory compliance under the **Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (RFCTLARR Act 2013)** across all **10 statutory stages**—from Social Impact Assessment (SIA) preliminary notifications to final physical possession and land record mutation.

---

## 🌟 Key Capabilities & Modules

### 1. 🗺️ National Land Atlas (`/atlas`)
* **14-Digit ULPIN Integration**: Universal Land Parcel Identification Number spatial lookup and cross-state revenue registry sync.
* **Vector GIS Mapping Engine**: Powered by MapLibre GL JS with interactive polygon editing (`@mapbox/mapbox-gl-draw`), spatial buffer analysis (`@turf/turf`), and ISRO Bhuvan satellite layer toggle.
* **Corridor & Buffer Overlays**: Right-of-Way (RoW) alignment visualization, parcel ownership status, and statutory restriction filters (forest, eco-sensitive, tribal land).

### 2. 📋 RFCTLARR 2013 Statutory Lifecycle Tracker (`/workflow`)
* **10-Stage Compliance Pipeline**: Automated SLA countdown timers and hard legal stop-gate controls for statutory deadlines (e.g., Sec 19 declaration within 12 months of Sec 11, Sec 25 award timeline).
* **Statutory Stage Gates**:
  1. *Section 4*: Social Impact Assessment (SIA) Notification
  2. *Section 7*: Multi-Disciplinary Expert Group Appraisal
  3. *Section 11*: Preliminary Gazette Notification & Land Inspection
  4. *Section 15*: Hearing of Objections (60-day window)
  5. *Section 19*: Final Declaration & Rehabilitation & Resettlement (R&R) Scheme
  6. *Section 21*: Notice to Persons Interested (Claims & Valuation)
  7. *Section 23/26*: CALA Inquiry & Solatium Award Determination
  8. *Section 37*: Final Award Enactment & PFMS Compensation Disbursement
  9. *Section 38*: Physical Possession & Eviction Notice Execution
  10. *Revenue Mutation*: State RoR (Record of Rights) Digital Updating

### 3. 📊 PM GatiShakti Executive Analytics Dashboard (`/dashboard`)
* **Real-time Acquisition KPIs**: Total hectares acquired, active corridor count, compensation disbursed (₹ Crores), and statutory bottleneck alerts.
* **Interactive Visual Analytics**: State-wise progress breakdown, acquisition velocity trends, corridor readiness scoring, and pending legal challenge heatmaps built with Recharts.

### 4. ⚖️ CALA Admin & Gazette Publishing Console (`/admin`)
* **Competent Authority Workspace**: Official portal for CALA (Competent Authority for Land Acquisition) officers to draft, verify, and publish Section 11/19 gazette notifications.
* **PFMS Payment Batching**: Direct integration staging for Direct Benefit Transfer (DBT) compensation payments to land owner bank accounts.

### 5. 🛡️ Citizen Portal & R&R Grievance System (`/citizen`)
* **Public ULPIN Notice Lookup**: Citizens can search land survey numbers or ULPINs to inspect statutory notices affecting their property.
* **Compensation Estimator**: Interactive calculator computing statutory market value multiplier (1.0x urban, 1.0x-2.0x rural), 100% Solatium (Sec 30), and 12% per annum interest.
* **Grievance Redressal Portal**: Submit and track Rehabilitation & Resettlement (R&R) complaints with automated ticket generation and SLA tracking.

### 6. 🔍 AI Gazette Document & OCR Extraction (`/upload`)
* **Automated Land Schedule Parsing**: High-accuracy client/server OCR pipeline powered by **Tesseract.js**.
* **Entity Extraction**: Converts scanned gazette PDFs and images into structured survey numbers, owner names, khata numbers, and acquired area tables ready for database ingest.

### 7. ⚠️ Explainable AI Risk & Compliance Engine (`/risk`)
* **Legal & Delay Risk Scoring**: Rule-based & predictive risk engine evaluating land acquisition projects for litigation exposure, forest/coastal clearance bottlenecks, SIA delays, and valuation disputes.
* **Root Cause Diagnostics**: Explanatory breakdown with actionable risk mitigation recommendations.

### 8. 📜 Digital Records Archive & Revenue Mutation (`/archive`, `/mutations`, `/awards`, `/dss`)
* **Statutory Records Repository**: Centralized archive of SIA reports, expert group recommendations, gazette publications, and compensation awards with full-text search.
* **RoR Mutation Tracking**: Monitors post-acquisition land title transfers to the acquiring authority across state revenue departments.
* **DSS Policy Simulation Engine**: Interactive route optimization, corridor alignment evaluation, and financial impact forecasting.

---

## 🌐 Multilingual Support & AI Chatbot

### 💬 BhoomiSetu Sahayak (AI Chatbot Assistant)
* **Floating Context-Aware Bot**: Accessible on all pages via a floating widget.
* **RFCTLARR & Platform Knowledge**: Trained to answer citizen and official queries regarding land acquisition statutory procedures, compensation formulas, SLA deadlines, and ULPIN verification.
* **Powered by Groq API**: Utilizes high-throughput LLM models (`openai/gpt-oss-120b` and `qwen/qwen3.8-27b`) with clean markdown formatting.

### 🗣️ Site-Wide Multilingual Engine
* **Supported Languages**:
  * 🇬🇧 **English** (EN)
  * 🇮🇳 **Hindi (हिंदी)** (HI)
  * 🇮🇳 **Bengali (বাংলা)** (BN)
  * 🇮🇳 **Kannada (ಕನ್ನಡ)** (KN)
* **Hybrid Translation Architecture**: Fast client-side translation provider (`LanguageProvider.tsx` + `lib/translations.ts`) coupled with a server-side AI translation fallback endpoint (`app/api/translate/route.ts`).

---

## 🛠️ Technology Stack

| Layer | Technology / Library | Description |
|---|---|---|
| **Framework** | Next.js 15.5 (App Router) | Server Components, Route Handlers, React 18 |
| **Language** | TypeScript 5.0 | End-to-end strict type safety |
| **Styling** | Tailwind CSS v4, Geist Fonts | Modern design system, responsive layouts |
| **Database** | Neon PostgreSQL | Serverless cloud PostgreSQL (raw SQL queries via `pg`) |
| **GIS & Mapping** | MapLibre GL, Turf.js, Mapbox Draw | Vector maps, geo-fencing, spatial buffer analysis |
| **AI / LLM** | Groq API (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`) | Fast AI Chatbot & Multilingual support |
| **OCR Engine** | Tesseract.js | Client & Node document text extraction |
| **Charts & UI** | Recharts, Lucide Icons, Radix UI | Data visualization and accessible UI primitives |
| **Auth** | Custom AuthProvider (`components/AuthProvider.tsx`) | Role-Based Access Control (RBAC) |

---

## 📁 Repository Structure

```
Bhoomi-Setu/
├── app/                        # Next.js 15 App Router Pages & API Routes
│   ├── admin/                  # CALA Admin Console & Gazette Publication
│   ├── api/                    # Serverless API Endpoints
│   │   ├── chat/               # Groq-powered AI Chatbot route handler
│   │   └── translate/          # Dynamic AI Translation fallback route
│   ├── archive/                # Digital Records & Gazette Archive
│   ├── atlas/                  # GIS National Land Atlas Map Engine
│   ├── awards/                 # Compensation Award Generator (Sec 26-30)
│   ├── citizen/                # Citizen Portal & R&R Grievances
│   ├── dashboard/              # Executive Analytics & PM GatiShakti Dashboard
│   ├── dss/                    # Decision Support System Policy Simulator
│   ├── landing/                # Public Landing Page & Showcase
│   ├── login/ & register/      # RBAC Authentication Pages
│   ├── mutations/              # RoR Land Records Mutation Tracker
│   ├── risk/                   # AI Risk & Statutory Compliance Engine
│   ├── upload/                 # AI Gazette Document OCR Ingestion
│   ├── workflow/               # 10-Stage RFCTLARR Statutory Tracker
│   ├── layout.tsx              # Root Layout (Nav, Footer, Chatbot, Multi-Lang)
│   └── page.tsx                # Entry redirect to /landing
├── components/                 # React UI Components
│   ├── BhoomiChatbot.tsx       # Floating AI Chatbot Widget
│   ├── LanguageProvider.tsx    # Multilingual Context Provider
│   ├── NavBar.tsx              # Government Standard Top Navigation
│   ├── AuthProvider.tsx        # Session & Role Management Provider
│   ├── map/                    # MapLibre GIS Map Components
│   └── ui/                     # Radix UI primitives & components
├── db/                         # Database Schema & Migrations
│   ├── index.ts                # Neon PostgreSQL Client Pool (`pg`)
│   └── migrations/             # SQL Migration Scripts (0001 to 0004)
├── lib/                        # Core Utilities & Business Logic
│   ├── translations.ts         # Multilingual Dictionary (EN, HI, BN, KN)
│   ├── ocr.ts                  # Tesseract OCR pipeline wrapper
│   ├── risk-engine.ts          # Statutory risk scoring logic
│   ├── statutory-math.ts       # Compensation & Solatium formulas
│   └── workflow.ts             # RFCTLARR stage state machine
├── public/                     # Static Assets & Images
│   └── images/                 # Landing page media assets
├── scripts/                    # Database Setup Scripts
│   ├── migrate.ts              # SQL Database Migration runner
│   └── seed-prod.sql           # Initial project & parcel seed data
├── .env.example                # Environment variables template
├── next.config.mjs             # Next.js configuration
├── package.json                # Project dependencies & scripts
└── README.md                   # Comprehensive project documentation
```

---

## ⚡ Quick Start & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **PostgreSQL**: Neon PostgreSQL instance (or local PostgreSQL)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Bhoomi-Setu.git
cd Bhoomi-Setu
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials:
```env
# Neon PostgreSQL Connection String
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Groq API Key (for BhoomiSetu Sahayak Chatbot & AI Translation)
GROQ_API_KEY=your_groq_api_key_here

# Optional: Enable Mock Integration Mode for DILRMP/PFMS APIs
NEXT_PUBLIC_MOCK_MODE=true
```

### 4. Run Database Migrations
Initialize database tables and seed sample data:
```bash
npm run migrate
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the platform.

### 6. Interactive Platform Documentation
* **Web App Route**: [http://localhost:3000/docs](http://localhost:3000/docs)
* **Direct Standalone HTML**: [http://localhost:3000/docs.html](http://localhost:3000/docs.html)

---

## ⚖️ RFCTLARR Act 2013 Statutory Stage Matrix

| Stage | Section | Statutory Milestone | Timeline SLA | Responsible Entity |
|---|---|---|---|---|
| **1** | Sec 4 | Social Impact Assessment (SIA) Notification | 6 Months | SIA Unit / District Magistrate |
| **2** | Sec 7 | Expert Group Appraisal & Recommendations | 2 Months | Multi-Disciplinary Expert Group |
| **3** | Sec 11 | Preliminary Gazette Notification & Survey | 12 Months | CALA / Collector |
| **4** | Sec 15 | Hearing of Objections & Land Owner Claims | 60 Days | CALA |
| **5** | Sec 19 | Final Declaration & R&R Scheme Approval | 12 Months | State Government / CALA |
| **6** | Sec 21 | Notice to Interested Persons & Land Claims | 30 Days | CALA |
| **7** | Sec 23/26 | Solatium & Compensation Award Determination | 12 Months | CALA / Collector |
| **8** | Sec 37 | Award Enactment & DBT Payment Disbursement | Immediate | CALA / PFMS |
| **9** | Sec 38 | Physical Possession & Land Handover | 60 Days | CALA / Project Authority |
| **10** | Mutation | Digital RoR Revenue Record Updating | 30 Days | Tehsildar / State Revenue Dept |

---

## 📜 Available NPM Scripts

* `npm run dev` — Launch Next.js local development server.
* `npm run build` — Create optimized production build.
* `npm run start` — Run production server.
* `npm run lint` — Execute ESLint static analysis checks.
* `npm run migrate` — Execute PostgreSQL database migrations using `scripts/migrate.ts`.

---

## 🛡️ License & Compliance

This software is developed for the **Department of Land Resources (DoLR), Ministry of Rural Development, Government of India**. All rights reserved under National Spatial Data Infrastructure (NSDI) and G2G Digital India standards.

---

<p center>
  <b>BhoomiSetu (भूमिсеtu)</b> — <i>Bridging Infrastructure Development with Fair Compensation & Transparency.</i>
</p>
