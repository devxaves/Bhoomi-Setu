# 🏛️ BhoomiSetu (National Land Acquisition Control & Compliance Platform) — Comprehensive Project Architecture & Feature Specification

> **Document Purpose**: This is a complete, from-scratch technical and functional blueprint for **BhoomiSetu**, a full rebuild targeting Smart India Hackathon Problem Statement 26016 (Real-Time National Land Acquisition & Management System, Dept. of Land Resources, Ministry of Rural Development). It is derived architecturally from a prior project ("BharatAtlas," a Forest Rights Act WebGIS + DSS platform) but is a **complete domain rebuild** — different entities, different workflow, different rules, different modules. Reuse only the *engineering patterns* described below (auth, map engine, OCR/NER pipeline, dashboard/analytics pattern, admin console pattern). Do not carry over any Forest Rights Act (FRA) terminology, claim types (IFR/CR/CFR), or DSS scheme rules (PM-KISAN, Jal Jeevan Mission, etc.) — this is a different domain end-to-end.

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Complete Technology Stack & Architecture Overview](#2-complete-technology-stack--architecture-overview)
3. [Database Schema — Raw SQL, No ORM](#3-database-schema--raw-sql-no-orm)
4. [Application Routing & Navigation Blueprint](#4-application-routing--navigation-blueprint)
5. [Module-by-Module Feature Breakdown](#5-module-by-module-feature-breakdown)
6. [Backend API Routes & Request/Response Contracts](#6-backend-api-routes--requestresponse-contracts)
7. [AI, Rule Engine & Statutory Deadline Algorithms](#7-ai-rule-engine--statutory-deadline-algorithms)
8. [Map & GIS Mechanics](#8-map--gis-mechanics)
9. [Step-by-Step Build Blueprint](#9-step-by-step-build-blueprint)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Domain: RFCTLARR Act, 2013
India's land acquisition process is governed by the **Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013**. It defines a strict, statutorily time-bound lifecycle:

1. **Proposal & Social Impact Assessment (SIA)** — public purpose justification, impact study
2. **Preliminary Notification (Section 11)** — freezes land transactions in the notified area
3. **Declaration of Acquisition (Section 19)** — must occur within **12 months** of Section 11, or the process lapses
4. **Award (Sections 23, 26, 30)** — compensation and R&R entitlements declared; must occur within **12 months** of Section 19
5. **Compensation Disbursement** — DBT-based payment to landowners
6. **Mutation** — legal title transfer in revenue records (frequently skipped/delayed in practice — a major real-world gap)
7. **Possession (Section 38)** — only after full compensation + R&R monetary component is deposited
8. **Rehabilitation & Resettlement (R&R)** — tracked per affected/displaced family, not just per hectare

### 1.2 The System: BhoomiSetu
Today this lifecycle is tracked manually or via fragmented state-specific/central systems (LACRRIS, BhoomiRashi for highways, state land record portals), with no unified national orchestration layer and no proactive compliance tooling. **BhoomiSetu** is a GIS-native, ULPIN-anchored platform that:
- Digitizes the full RFCTLARR lifecycle as an enforceable state machine with statutory deadline tracking and RAG (Red/Amber/Green) escalation
- Plots every parcel on an interactive map (ULPIN-keyed) with spatial project-vs-parcel intersection
- Extracts structured data from scanned notifications/awards via OCR + NER
- Applies a rule-based, explainable risk-scoring engine to flag delay-prone projects and parcels
- Tracks compensation, **mutation** (explicitly, as its own stage — this is the single most commonly missed metric nationally), and R&R per affected family
- Provides a citizen-facing portal so affected landowners can check their own status via ULPIN
- Exposes clearly-labeled **mock adapters** for DILRMP, ULPIN, LACRRIS, and BhoomiRashi to demonstrate a federated-integration architecture without claiming real production access

---

## 2. Complete Technology Stack & Architecture Overview

| Layer | Technology | Rationale / Function |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | Fullstack React framework, Server Components, API routes, streaming |
| **Language** | **TypeScript 5** | Strict typing for data models, API payloads, GeoJSON |
| **Styling & UI** | **Tailwind CSS v4**, Radix UI primitives, Lucide React, Geist font | Rapid styling, consistent design tokens |
| **Authentication** | **Clerk (`@clerk/nextjs`)** | Registration, login, session tokens, `clerkMiddleware` route protection |
| **Database** | **PostgreSQL on Neon (serverless)** — **NO ORM** | Direct SQL, no Prisma. Use `pg` (node-postgres) or `postgres.js` as the driver. PostGIS extension enabled on Neon for spatial columns/queries where possible; if Neon's PostGIS support is limited, store geometry as GeoJSON in `jsonb` columns and do spatial math in application code, but write the schema so it can be swapped to native `geometry` columns later. |
| **SQL access pattern** | Hand-written parameterized SQL in a `lib/db/*.ts` query-module layer (one file per entity: `queries/projects.ts`, `queries/parcels.ts`, etc.), using a shared connection pool client | No query builder, no ORM abstraction — raw `client.query(sql, params)` calls, explicit and auditable, matching government-grade transparency expectations |
| **Migrations** | Plain numbered `.sql` files in `/db/migrations/`, run via a small custom migration runner script (no Prisma Migrate) | Full control, no generated migration files |
| **Mapping & GIS** | **MapLibre GL JS**, `@maplibre/maplibre-gl-geocoder` | Vector/raster map rendering, OSM raster tiles, Esri Satellite, OpenTopoMap, Nominatim Indian geocoder (`countrycodes=in`) |
| **OCR** | **Tesseract.js** | Browser/Node-compatible OCR for scanned notifications, awards, SIA reports |
| **NER** | **HuggingFace Inference API** (`dslim/bert-base-NER`) + regex fallback | Entity extraction — rewritten regex patterns for ULPIN, survey numbers, award amounts, notification dates, district/village names (NOT the old FRA claimant/village patterns) |
| **Risk/Decision engine** | Custom TypeScript rule engine (`lib/risk-engine.ts`) — rule-based, explainable, NOT a black-box ML model | Weighted scoring: stage-dwell-time, ownership-conflict flag, litigation flag, R&R completeness, document-vs-database discrepancy count |
| **Client state/fetching** | **SWR** | Auto-caching, polling, real-time dashboard refresh |
| **Charts** | **Recharts** | KPI cards, bar/pie/line charts for dashboards |
| **Mock external integrations** | Internal API routes returning seeded/static JSON explicitly labeled `source: "mock-DILRMP"`, `source: "mock-LACRRIS"`, `source: "mock-BhoomiRashi"`, `source: "mock-PFMS"` | Demonstrates federated-adapter architecture honestly, without claiming real government API access |

---

## 3. Database Schema — Raw SQL, No ORM

All tables below are Postgres `CREATE TABLE` statements meant to live in `/db/migrations/0001_init.sql`. No Prisma schema file exists anywhere in this project.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis; -- if unsupported on the target Neon tier, fall back to jsonb geometry columns

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id      TEXT UNIQUE NOT NULL,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('lrb','collector','state_admin','central_ministry','citizen')),
  jurisdiction  TEXT, -- district/state code the user is scoped to, null for central roles
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  land_requiring_body TEXT NOT NULL,
  ministry          TEXT,
  state             TEXT NOT NULL,
  district          TEXT NOT NULL,
  project_type      TEXT, -- highway, railway, irrigation, industrial corridor, etc.
  alignment_geojson JSONB, -- project alignment/boundary as GeoJSON
  current_stage     TEXT NOT NULL DEFAULT 'proposal'
                      CHECK (current_stage IN (
                        'proposal','sia','section_11','section_19','award',
                        'compensation','mutation','possession','rr','closed'
                      )),
  stage_started_at  TIMESTAMPTZ DEFAULT now(),
  status_flag       TEXT NOT NULL DEFAULT 'green' CHECK (status_flag IN ('green','amber','red','lapsed')),
  risk_score        NUMERIC(5,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE parcels (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ulpin             TEXT UNIQUE NOT NULL, -- 14-digit Bhu-Aadhaar
  project_id        UUID REFERENCES projects(id),
  survey_number     TEXT,
  village           TEXT,
  district          TEXT,
  state             TEXT,
  area_hectares     NUMERIC(10,4),
  land_type         TEXT, -- agricultural, commercial, forest, etc.
  geometry_geojson  JSONB NOT NULL, -- Polygon/MultiPolygon GeoJSON
  ownership_status  TEXT DEFAULT 'clear' CHECK (ownership_status IN ('clear','disputed','under_verification')),
  litigation_flag   BOOLEAN DEFAULT false,
  risk_score        NUMERIC(5,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE owners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id   UUID REFERENCES parcels(id),
  name        TEXT NOT NULL,
  contact     TEXT,
  bank_ref    TEXT, -- masked/last-4 only, never store full account numbers
  is_current  BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID REFERENCES projects(id),
  section       TEXT NOT NULL CHECK (section IN ('section_11','section_19')),
  notified_on   DATE NOT NULL,
  deadline_on   DATE NOT NULL, -- notified_on + 12 months, computed at insert time
  document_id   UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE awards (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID REFERENCES projects(id),
  parcel_id           UUID REFERENCES parcels(id),
  award_date          DATE,
  market_value        NUMERIC(14,2),
  solatium_pct        NUMERIC(5,2) DEFAULT 100,
  additional_amount_pct NUMERIC(5,2) DEFAULT 12,
  total_compensation  NUMERIC(14,2),
  document_id         UUID,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE compensation_payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  award_id        UUID REFERENCES awards(id),
  amount_assessed NUMERIC(14,2),
  amount_disbursed NUMERIC(14,2) DEFAULT 0,
  status          TEXT DEFAULT 'assessed' CHECK (status IN ('assessed','sanctioned','disbursed','failed')),
  disbursed_on    DATE,
  mock_pfms_ref   TEXT, -- returned by the mock PFMS adapter
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mutations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id       UUID REFERENCES parcels(id),
  mutation_status TEXT DEFAULT 'pending' CHECK (mutation_status IN ('pending','filed','completed')),
  filed_on        DATE,
  completed_on    DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE affected_families (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id           UUID REFERENCES parcels(id),
  family_ref          TEXT NOT NULL, -- anonymized reference code, not a name shown on public dashboards
  displaced            BOOLEAN DEFAULT false,
  compensation_status TEXT DEFAULT 'pending',
  housing_status      TEXT DEFAULT 'pending',
  employment_status   TEXT DEFAULT 'pending',
  livelihood_restored BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID REFERENCES projects(id),
  filename      TEXT NOT NULL,
  doc_type      TEXT, -- notification, award, sia_report
  raw_ocr_text  TEXT,
  ner_entities  JSONB,
  discrepancy_flags JSONB, -- e.g. area mismatch vs. parcels table
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE risk_scores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project','parcel')),
  entity_id   UUID NOT NULL,
  score       NUMERIC(5,2) NOT NULL,
  reasons     JSONB NOT NULL, -- [{ factor, weight, explanation }]
  computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE grievances (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id   UUID REFERENCES parcels(id),
  submitted_by TEXT, -- ULPIN or citizen reference
  message     TEXT NOT NULL,
  status      TEXT DEFAULT 'open' CHECK (status IN ('open','in_review','resolved')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  action      TEXT NOT NULL,
  before_state JSONB,
  after_state  JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mock_adapter_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source      TEXT NOT NULL, -- mock-DILRMP, mock-LACRRIS, mock-BhoomiRashi, mock-PFMS
  request     JSONB,
  response    JSONB,
  called_at   TIMESTAMPTZ DEFAULT now()
);
```

Indexes to add in a follow-up migration: `parcels(project_id)`, `parcels(ulpin)`, `awards(parcel_id)`, `notifications(deadline_on)` (for the deadline cron scan), and a GIN index on `parcels(geometry_geojson)` if staying on jsonb rather than native PostGIS `geometry`.

---

## 4. Application Routing & Navigation Blueprint

- `/` , `/landing` — public landing page
- `/sign-in`, `/sign-up` — Clerk auth routes
- `/atlas` — full-screen national/state/district/project/parcel drill-down GIS map
- `/upload` — document upload, OCR/NER extraction, discrepancy flagging, "save to parcel/project" action
- `/workflow/[projectId]` — statutory stage tracker for a single project (visual pipeline, deadline countdowns, RAG status)
- `/risk` — risk/decision-support console: project + parcel risk scores, explanations, "why" drill-down
- `/dashboard` — executive analytics (national/state/district KPI rollups, charts)
- `/archive` — multi-filter search across projects/parcels/awards, CSV export
- `/citizen` — public ULPIN lookup portal (no auth, or lightweight OTP-style mock auth), grievance submission
- `/admin` — operations console: project/parcel data entry, mini-map parcel geometry drawing, mock adapter test console

---

## 5. Module-by-Module Feature Breakdown

### 5.1 Landing Page (`/landing` & `/`)
Public-facing explainer with problem framing, CTA to sign in (officials) or go to citizen portal.

### 5.2 Authentication & Security Layer (Clerk Middleware)
`clerkMiddleware` protects all routes except `/`, `/landing`, `/citizen`, `/sign-in`, `/sign-up`. Role is read from the `users` table (looked up by `clerk_id`) on each protected API call and used for row-level authorization in the raw SQL query layer (e.g., a `collector` role's queries are always scoped `WHERE district = $jurisdiction`).

### 5.3 GIS Atlas Engine (`/atlas`)
Reuse the MapLibre GL rendering pattern directly: raster tile sources (OSM, Esri Satellite, OpenTopoMap), Nominatim Indian geocoder, custom HTML DOM markers with hover-tooltip/click-modal pattern. New behavior: parcels render as polygons (not points), colored by `risk_score`/`status_flag`; clicking a project alignment shows spatially-intersecting parcels (computed either via PostGIS `ST_Intersects` or application-side turf.js if staying on jsonb geometry).

### 5.4 Document Upload, OCR & NER Extraction (`/upload`)
Reuse the Tesseract.js → HuggingFace NER → regex-fallback pipeline structure directly. Rewrite the entity patterns for this domain: ULPIN (14-digit numeric), survey number, notification date, award amount, district/village, Section reference (11/19/23). New addition not present in the old project: a **discrepancy check** — after extraction, compare extracted `area` against the matching `parcels.area_hectares` and flag a mismatch into `documents.discrepancy_flags` and surface it in the UI.

### 5.5 Statutory Workflow Engine (`/workflow/[projectId]`) — NEW MODULE, no equivalent in old project
Visual pipeline of the 10 stages (`proposal → sia → section_11 → section_19 → award → compensation → mutation → possession → rr → closed`). Each stage transition writes to `audit_log`. A scheduled job (Vercel Cron / node-cron) scans `notifications.deadline_on` daily: at 60% of elapsed statutory window → set `status_flag = 'amber'`; at 90% → `'red'`; past deadline with no stage advance → `'lapsed'`. Escalation is a simple in-app alert list (SMS/email can be mocked).

### 5.6 Risk / Decision Support Engine (`/risk`)
Structurally reuse the old `dss-engine.ts` pattern (typed rules, conditions, thresholds, "Policy Simulation Mode" sliders, priority levels, CSV export) but the rules are entirely new:
- Rule: stage dwell-time > X% of statutory window → risk +weight
- Rule: `ownership_status = 'disputed'` → risk +weight
- Rule: `litigation_flag = true` → risk +weight
- Rule: R&R completeness < threshold → risk +weight
- Rule: document discrepancy present → risk +weight
Each contributing rule is stored with a human-readable `explanation` string in `risk_scores.reasons`, rendered as a "why is this risky" panel — this explainability is the core "AI decision support" pitch element.

### 5.7 Executive Analytics Dashboard (`/dashboard`)
Reuse the KPI-card + bar/pie/line-chart pattern via Recharts. Aggregation queries are hand-written SQL (`GROUP BY district`, `GROUP BY status_flag`, monthly trend via `date_trunc`) instead of Prisma aggregate calls. New metric that MUST be present (missing from nearly every comparable govt system): **mutation completion rate** shown separately from possession rate, since these are frequently confused/conflated.

### 5.8 Digital Archive & Filtering Engine (`/archive`)
Reuse the multi-parameter filter + paginated table + CSV export pattern, applied to projects/parcels/awards instead of FRA claims.

### 5.9 Citizen Portal (`/citizen`) — NEW MODULE, no equivalent in old project
Public ULPIN search → returns (only) that parcel's stage, hearing date if applicable, award status, compensation disbursement status, mutation status, R&R status for the associated family (anonymized reference only, never another family's PII). Includes a lightweight grievance submission form writing to `grievances`.

### 5.10 Admin Console (`/admin`)
Reuse the `MiniMapSelector` draggable-marker + search pattern directly for parcel geometry entry (extended from point to polygon drawing, e.g. via `mapbox-gl-draw` or MapLibre's draw plugin). Includes a "Mock Adapter Console" panel — buttons to trigger `mock-DILRMP`, `mock-LACRRIS`, `mock-BhoomiRashi`, `mock-PFMS` calls and view the logged request/response from `mock_adapter_log`, demonstrating the integration architecture live in the demo.

---

## 6. Backend API Routes & Request/Response Contracts

All routes are Next.js Route Handlers (`app/api/.../route.ts`) calling hand-written query functions from `lib/db/queries/*.ts` — never an ORM client.

- `POST /api/projects` — create project
- `GET /api/projects/[id]` — project detail + current stage + risk score
- `POST /api/projects/[id]/advance-stage` — transition workflow stage, writes audit_log
- `GET /api/parcels?ulpin=` — parcel lookup
- `POST /api/parcels/intersect` — body: alignment GeoJSON → returns spatially-intersecting parcels
- `POST /api/upload` — multipart document upload → OCR → NER → discrepancy check → returns structured fields
- `POST /api/risk/evaluate` — body: `{ entityType, entityId }` → runs rule engine → persists to `risk_scores`
- `GET /api/dashboard/analytics` — aggregated KPI payload
- `GET /api/citizen/lookup?ulpin=` — public, scoped response only
- `POST /api/citizen/grievance` — public grievance submission
- `GET/POST /api/mock/dilrmp`, `/api/mock/lacrris`, `/api/mock/bhoomirashi`, `/api/mock/pfms` — clearly labeled mock adapters, logging to `mock_adapter_log`

---

## 7. AI, Rule Engine & Statutory Deadline Algorithms

### 7.1 OCR + NER Pipeline (structurally reused from old project)
```
Scanned Document (PDF/JPG)
  → Tesseract.js OCR → Raw Text
  → HuggingFace BERT-NER (if available) / Regex fallback (domain-specific patterns: ULPIN, survey no., dates, amounts)
  → Structured Fields
  → Compare against parcels/awards table → discrepancy_flags
  → Store in `documents` table
```

### 7.2 Statutory Deadline Engine (NEW)
```
Daily cron scan of `notifications` and `projects`
  → For each open project, compute days_elapsed / statutory_window_days
  → < 60%: status_flag = green
  → 60-90%: status_flag = amber, in-app alert to Collector
  → >90%: status_flag = red, escalate to State + Central dashboard
  → past deadline, no stage transition: status_flag = lapsed, flagged for re-notification
```

### 7.3 Risk Rule Engine (structurally reused pattern, entirely new rules)
```
Select project/parcel
  → Gather: stage dwell-time, ownership_status, litigation_flag,
            R&R completeness %, document discrepancy count
  → Apply weighted rule set (thresholds adjustable via "Policy Simulation Mode" sliders,
    same UX pattern as old project's DSS thresholds)
  → Produce score 0-100 + ordered list of contributing reasons (human-readable)
  → Persist to risk_scores, render in /risk UI
```

---

## 8. Map & GIS Mechanics

Same GeoJSON conventions as before (`[longitude, latitude]`, WGS 84). Parcels are now **Polygon/MultiPolygon** geometries, not points — the marker/pin pattern from the old project extends to polygon rendering with fill color driven by `risk_score`/`status_flag`. Project "alignment" (e.g. a highway corridor) is drawn or uploaded as GeoJSON and spatially intersected against the parcels table to auto-populate a project's affected-parcel list — this is the single most demo-impactful GIS interaction and has no equivalent in the old point-based Atlas.

---

## 9. Step-by-Step Build Blueprint

### Phase 1: Foundation, Auth, Raw DB Layer (no ORM)
1. Scaffold Next.js 15 App Router + TypeScript + Tailwind CSS v4.
2. Install `@clerk/nextjs`, configure `middleware.ts`.
3. Provision Neon PostgreSQL, enable PostGIS if available.
4. Write `/db/migrations/0001_init.sql` with the full schema above; write a minimal migration runner script (`scripts/migrate.ts`) that applies numbered `.sql` files in order — no Prisma anywhere in the repo.
5. Build `lib/db/pool.ts` (connection pool via `pg`) and one query module per entity under `lib/db/queries/`.

### Phase 2: GIS Engine
1. Install `maplibre-gl`, `@maplibre/maplibre-gl-geocoder`, a polygon-draw plugin.
2. Configure raster sources (OSM/Esri/OpenTopoMap) + Nominatim India geocoder.
3. Build `/atlas` with polygon rendering for parcels, alignment upload/draw for projects, spatial intersection call to `/api/parcels/intersect`.
4. Build the `MiniMapSelector`-equivalent polygon-drawing admin tool.

### Phase 3: OCR/NER + Discrepancy Detection
1. Install `tesseract.js`.
2. Build `/api/upload`, rewrite regex fallback patterns for this domain.
3. Build discrepancy comparison logic against `parcels`/`awards`.
4. Build `/upload` UI with confidence indicators, discrepancy warnings, "save to project/parcel" action.

### Phase 4: Statutory Workflow + Deadline Engine
1. Implement the 10-stage state machine and `advance-stage` API with audit logging.
2. Build the cron/scheduled deadline scanner.
3. Build `/workflow/[projectId]` visual pipeline UI with RAG status and countdowns.

### Phase 5: Risk Engine
1. Build `lib/risk-engine.ts` with the new rule set and explanation strings.
2. Build `/risk` UI with score, "why" panel, and policy-simulation threshold sliders.

### Phase 6: Compensation, Mutation, R&R
1. Build award/compensation/mutation CRUD + mock PFMS adapter integration.
2. Build affected-family R&R tracking UI (per-family, not aggregate-only).

### Phase 7: Dashboard, Archive, Citizen Portal, Admin
1. Build `/dashboard` with hand-written SQL aggregations + Recharts, including the mutation-rate metric.
2. Build `/archive` multi-filter search + CSV export.
3. Build `/citizen` public ULPIN lookup + grievance form.
4. Build `/admin` operations console + mock adapter test panel.

---

*This document is the complete structural, algorithmic, and architectural specification for BhoomiSetu. It is derived from the BharatAtlas project's engineering patterns but is a full domain rebuild — no FRA terminology, claim types, or scheme rules should appear anywhere in the new codebase.*
