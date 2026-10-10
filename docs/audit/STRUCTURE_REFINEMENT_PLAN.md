# Repository Structure Refinement Plan — JobsAPI Integration

**Role:** Principal Software Architect  
**Project:** JobsAPI Integration Platform  
**Target:** Monorepo Structure Refinement & Two-Application Architecture Consolidation  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT  
**Date:** October 2026  

---

## 1. Executive Summary & Context

The `jobsapi-integration` repository originated from the federation of four previously independent projects:
1. `backend/`: Node.js / Express API server, MongoDB persistence, BullMQ queues, 13 ATS providers, and an extensive `src/automation/` hierarchy with 28 provider connectors.
2. `frontend/`: React 19 / Vite single-page application for aggregated US job search.
3. `dice-automation-backend/`: Legacy Python FastAPI + Playwright automation service operating on port 8000.
4. `dice-automation-frontend/`: Legacy React + MUI operator portal operating on port 5174 with Dice light theme green accents.

This document establishes the **definitive architectural refinement plan** to govern the repository's consolidation into **exactly two permanent applications**:
- **`frontend/`**: The unified frontend application utilizing the **Dice automation light theme green color palette (Resume2Hire style)** with emerald green (`#10B981` / `#059669`) primary accents, slate-50 canvas (`#F8FAFC`), white card surfaces (`#FFFFFF`), and dark slate typography (`#0F172A`).
- **`backend/`**: The unified backend application operating under Node.js / Express on port 5000, managing all ATS aggregations, database models, Redis queues, and native Playwright RPA modules.

---

## 2. Phase A — Inspection of the Repository Structure

### 2.1 Monorepo Top-Level Structure
```
jobsapi-integration/
├── backend/                       # Node.js 22 + Express 5 + MongoDB + Playwright + BullMQ
├── frontend/                      # React 19 + Vite 8 + Tailwind CSS 4 + Lucide React
├── docs/                          # Comprehensive technical audits and architecture specs
│   └── audit/
├── scripts/                       # Local execution and verification orchestration scripts
├── tools/                         # Preserved operator utilities (Dice Chrome Extension)
├── docker-compose.yml             # Single frontend + Single backend + Redis + MongoDB
├── .env.example                   # Unified environment configuration template
├── .gitignore                     # Repository-wide ignore rules
├── .dockerignore                  # Docker build context exclusions
├── package.json                   # Root-level orchestration scripts
└── README.md                      # Engineering setup and API documentation
```

### 2.2 Backend Architectural Inventory (`backend/`)
The JobsAPI backend contains a mature, enterprise-grade architecture:
- **Application Entry:** [`src/server.js`](file:///e:/TM/jobsapi-integration/backend/src/server.js) initializes HTTP listener (port 5000), MongoDB connection via Mongoose, and background cron schedules.
- **Express App Configuration:** [`src/app.js`](file:///e:/TM/jobsapi-integration/backend/src/app.js) configures helmet security, rate limiting, CORS, correlation IDs, and mounts all API routers.
- **Existing Automation Hierarchy (`src/automation/`):**
  - `adapters/`: ATS-specific form handlers (`AshbyAdapter`, `GreenhouseAdapter`, `LeverAdapter`, `WorkdayAdapter`).
  - `browser/`: `BrowserManager`, `BrowserPool`, `SessionManager`, `StealthPlugin`.
  - `canonical/`: `CanonicalFieldRegistry` defining standard candidate taxonomy and synonyms.
  - `connectors/`: 28 pre-built provider connectors including:
    - Multi-ATS: `GreenhouseConnector`, `LeverConnector`, `AshbyConnector`, `WorkdayConnector`, `BambooHRConnector`, `SmartRecruitersConnector`, `JobviteConnector`.
    - Major Job Boards: `LinkedInEasyApplyConnector`, `IndeedConnector`, `ZipRecruiterConnector`, `DiceConnector`.
  - `engine/`: Core RPA capabilities (`FieldFillEngine`, `FileUploadEngine`, `FormIntelligence`, `LocatorEngine`, `ValidationEngine`, `QuestionInterceptor`).
  - `managers/`: `ApplicationIdempotencyService`, `ApplicationPreflightValidator`, `ApplicationStateMachine`, `ProfileReadinessCalculator`.
  - `workers/`: `AutomationWorkerProcessor.js` powered by BullMQ and Redis.
- **Persistence Models (`src/models/`):**
  - Ingestion: `Job.js`, `Source.js`, `SyncMetric.js`.
  - Profile & RPA: `CandidateProfile.js`, `ApplicationSession.js`, `Resume.js`, `SearchProfile.js`, `ReviewItem.js`, `DiceSession.js`.

### 2.3 Frontend Architectural Inventory (`frontend/`)
The consolidated frontend contains a modern React 19 architecture:
- **Entry & Tooling:** Vite 8, React 19, Tailwind CSS 4, React Router 7, TanStack React Query 5.
- **Layout & Design:**
  - Design tokens in `src/index.css` implementing the **Dice automation light theme green palette**:
    - Primary Brand: Emerald Green (`#10B981`), Hover (`#059669`), Teal Secondary (`#0D9488`).
    - Canvas: Slate-50 (`#F8FAFC`), Surface: Pure White (`#FFFFFF`), Text: Deep Slate (`#0F172A`).
    - Borders: Clean Slate (`#E2E8F0`), Subtle Accents: `rgba(16, 185, 129, 0.12)`.
  - Shell: `src/components/layout/AppShell.jsx`, `Sidebar.jsx`, `TopBar.jsx`, `MobileNav.jsx`.
- **Pages & Capabilities:**
  - `OverviewPage.jsx`: Real-time KPI metrics, search prompt, and quick links.
  - `DiscoverPage.jsx` & `JobDetailPage.jsx`: Faceted job discovery across 13 ATS providers and Dice.
  - `AutoApplyPage.jsx`: Unified 3-tab Automation Center (Queue metrics, Human Review Queue, Search Profiles).
  - `ApplicationsPage.jsx` & `ApplicationDetailPage.jsx`: End-to-end telemetry across Dice and ATS submissions.
  - `ProfilePage.jsx`: Candidate UCKGraph editor paired with the Dice Resume Library.
  - `SettingsPage.jsx`: Dice session cookie status, headful browser launcher, and RPA configurations.

---

## 3. Phase B — Directory and File Classification

| Directory / Artifact | Classification | Justification & Action |
| :--- | :--- | :--- |
| `frontend/src/` | **Retain in common frontend** | Core React SPA components, pages, routing, and design system. |
| `frontend/public/` | **Retain in common frontend** | Static web assets (logos, icons, favicons). |
| `frontend/dist/` | **Exclude from version control** | Ephemeral production build bundle; generated by `vite build`. |
| `backend/src/` | **Retain in common backend** | Core Express API, controllers, routers, models, and services. |
| `backend/src/automation/` | **Retain in common backend** | The 28 connectors, locator engines, and Playwright RPA modules are authoritative. |
| `backend/sample_resumes/` | **Preserve as test evidence** | Multi-format PDF and DOCX test resumes for parser test suites. |
| `backend/uploads/` | **Retain in common backend** | Persistent storage for user resume uploads and parsed files. |
| `tools/dice-chrome-extension/` | **Preserve as utility** | Chrome browser extension for exporting authenticated Dice cookies. |
| `docs/audit/` | **Preserve as documentation** | Architectural audit history, baseline reports, and migration logs. |
| `scripts/` | **Retain in root** | Monorepo orchestration scripts for dev startup and full test execution. |
| `dice-automation-backend/` | **Retire following verification** | Legacy Python runtime; all scraping, cookies, and parsing migrated to Node.js. |
| `dice-automation-frontend/` | **Retire following verification** | Legacy MUI frontend; all review, profile, and queue capabilities unified into `frontend/`. |

---

## 4. Phase C — Target Root Structure

```
jobsapi-integration/
├── .vscode/                       # Editor workspace configurations
├── frontend/                      # Unified React 19 Frontend Application
├── backend/                       # Unified Node.js / Express Backend Application
├── tools/                         # Ancillary tools (Chrome extension)
├── docs/                          # Technical specifications and audit reports
│   └── audit/
├── scripts/                       # Root orchestration and validation scripts
│   ├── start-dev.ps1              # PowerShell concurrent dev launcher
│   ├── start-dev.sh               # Bash concurrent dev launcher
│   ├── test-all.ps1               # PowerShell test verification runner
│   └── test-all.sh                # Bash test verification runner
├── docker-compose.yml             # Container orchestration (frontend, backend, mongo, redis)
├── .env.example                   # Master environment template
├── .gitignore                     # Monorepo ignore rules
├── .dockerignore                  # Docker build ignore rules
├── .editorconfig                  # Formatting standards
├── package.json                   # Root orchestrator scripts (npm test, npm run dev)
└── README.md                      # Unified documentation
```

---

## 5. Phase D — Frontend Architectural Refinement

The permanent frontend structure inside `frontend/src/` is organized around domain features while preserving existing dependencies:

```
frontend/src/
├── app/
│   ├── router/                    # Route declarations and navigation guards
│   └── layouts/                   # AppShell, Sidebar, TopBar, MobileNav
├── components/
│   ├── ui/                        # Button, Input, Modal, Badge, Card, Drawer
│   ├── jobs/                      # JobCard, JobFilters, JobIntelligencePanel
│   └── shared/                    # EmptyState, ErrorState, LoadingSkeleton
├── pages/
│   ├── OverviewPage.jsx           # Dashboard and KPIs
│   ├── DiscoverPage.jsx           # All Jobs & Faceted Search
│   ├── JobDetailPage.jsx          # Job Description & Intelligence
│   ├── AutoApplyPage.jsx          # Automation Queue, Human Review, Search Profiles
│   ├── ApplicationsPage.jsx       # Submissions & Live Telemetry
│   ├── ProfilePage.jsx            # UCKGraph Profile & Dice Resume Library
│   └── SettingsPage.jsx           # Dice Session & RPA Parameters
├── services/
│   ├── api.js                     # JobsAPI client (Port 5000 /api)
│   └── diceApi.js                 # Native Dice module client (Port 5000 /api/dice)
└── index.css                      # Dice automation light theme green styling tokens
```

---

## 6. Phase E — Backend Architectural Refinement

The permanent backend structure inside `backend/src/` consolidates the full automation lifecycle:

```
backend/src/
├── app.js                         # Express application setup and route mounting
├── server.js                      # Server lifecycle and database connection
├── config/                        # Database, Redis, Winston logger, environment
├── controllers/                   # jobController, statsController, adminController
├── cron/                          # Scheduled ATS ingestion tasks
├── models/                        # Mongoose schemas:
│   ├── Job.js                     # Unified Job collection
│   ├── Source.js                  # ATS provider sync metadata
│   ├── SyncMetric.js              # Sync run statistics
│   ├── CandidateProfile.js        # UCKGraph candidate profile
│   ├── ApplicationSession.js      # Submissions & state machine
│   ├── Resume.js                  # Uploaded resumes & parsed skills
│   ├── SearchProfile.js           # Dice automated discovery queries
│   ├── ReviewItem.js              # Human screener questions
│   └── DiceSession.js             # Dice browser session cookies
├── routes/                        # jobsRoutes, statsRoutes, adminRoutes, diceRoutes
├── services/                      # Business logic:
│   ├── ats/                       # 13 ATS ingestion services
│   ├── diceSearch.service.js      # Playwright Dice job scraping
│   ├── diceSession.service.js     # Dice cookie management & login launcher
│   └── resumeParser.service.js    # PDF/DOCX skill & metadata extractor
└── automation/                    # Authoritative RPA Hierarchy:
    ├── adapters/                  # ATS form handlers (Greenhouse, Lever, Ashby)
    ├── browser/                   # BrowserPool, SessionManager, StealthPlugin
    ├── canonical/                 # CanonicalFieldRegistry & field taxonomy
    ├── connectors/                # 28 Connectors (Dice, LinkedIn, Indeed, etc.)
    ├── engine/                    # FormIntelligence, LocatorEngine, FieldFillEngine
    ├── managers/                  # Idempotency, PreflightValidator, StateMachine
    └── workers/                   # BullMQ AutomationWorkerProcessor
```

---

## 7. Phase F — Critical Runtime Compatibility Analysis

| Dimension | Legacy Dice Backend | Consolidated Node Backend | Architectural Decision |
| :--- | :--- | :--- | :--- |
| **Language & Runtime** | Python 3.11 / FastAPI | Node.js 22 / Express 5 | **Native Node.js Port** |
| **Browser RPA Tool** | Playwright (Python async) | Playwright (Node.js) | Native Playwright Node API matches existing `src/automation/` |
| **Document Parsing** | PyPDF2, docx2txt | pdf-parse, fast-xml-parser | Implemented in `resumeParser.service.js` |
| **Database Access** | Motor / PyMongo | Mongoose 9 (Node.js) | Direct schema parity with single MongoDB connection |
| **Process Model** | 2 separate HTTP servers (:5000 & :8000) | Single HTTP server (:5000) | Zero port collisions, single Docker container |

**Conclusion:** Porting the Python automation logic directly into native Node.js Playwright within `backend/src/` provides 100% feature fidelity while eliminating cross-language IPC complexity, port conflicts, and dual container maintenance.

---

## 8. Phase G — Configuration and Hygiene

1. **Exclusions from Version Control (`.gitignore`):**
   - Generated: `node_modules/`, `dist/`, `build/`, `*.log`, `combined.log`, `error.log`.
   - Browser data: `data/browser_profiles/`, `data/dice_cookies.json`.
   - Uploads: `backend/uploads/resumes/*` (preserving `.gitkeep`).
   - Secrets: `.env`, `.env.local`, `*.local` (preserving `.env.example`).
2. **Docker Compose (`docker-compose.yml`):**
   - 4 clean services: `mongodb` (27017), `redis` (6379), `api` (5000), `frontend` (5173).
3. **Environment Template (`.env.example`):**
   - Consolidates backend and frontend variables with safe placeholders and no hardcoded secrets.

---

## 9. Phase H — Validation & Quality Gates

The consolidated structure must satisfy the following automated verification suite:

```bash
# 1. Monorepo Root Test Suite (Backend + Frontend Lint + Frontend Build)
npm test

# 2. Individual Backend Test Suite (All 48 unit & integration tests)
cd backend && npm test

# 3. Individual Frontend Verification
cd frontend
npm run lint     # 0 errors
npm run build    # Vite production build succeeds (< 600ms)
```

---

## 10. Summary of Architectural Decisions

1. **Single Frontend:** Permanent home is `frontend/`. Styled using the **Dice automation light theme green color palette (Resume2Hire style)** with emerald green primary accents and clean slate typography.
2. **Single Backend:** Permanent home is `backend/`. Native Node.js Playwright RPA replaces the Python FastAPI daemon on port 8000.
3. **Zero Deprecation Debt:** Legacy `dice-automation-frontend/` and `dice-automation-backend/` directories are completely retired with zero remaining build or runtime dependencies.
4. **Preserved Utilities:** Chrome Extension and sample test resume artifacts are safely archived in `tools/dice-chrome-extension/` and `backend/sample_resumes/`.
