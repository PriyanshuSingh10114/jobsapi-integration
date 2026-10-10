# TWO-APPLICATION MIGRATION PLAN
## JobsAPI Integration Monorepo Consolidation

**Target State:** Exactly two operational application codebases:
1. `frontend/` — The sole unified frontend (Dice UI Design System + Multi-ATS & Dice Capabilities).
2. `backend/` — The sole unified backend (Node.js/Express, Mongoose MongoDB, BullMQ Redis, Playwright RPA Engine).

**Decommission Targets:**
- `dice-automation-frontend/` (Deprecated & safely retired following verification).
- `dice-automation-backend/` (Deprecated & safely retired following verification).

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Recovery Checkpoint Tag:** `checkpoint/pre-two-app-consolidation` (Git branch `feature/two-app-consolidation`)

---

## 1. Executive Summary & Problem Statement

The repository currently consists of four previously independent services:
- `backend/`: Node.js Express API aggregating 13 ATS providers (Greenhouse, Lever, Workday, USAJobs, etc.) with BullMQ automation workers, MongoDB, Redis, and Playwright.
- `frontend/`: React Vite application incorporating Job Discovery, Universal Candidate Profile (UCKGraph), ATS readiness, and telemetry tracking.
- `dice-automation-backend/`: Python FastAPI service for scraping Dice, managing Dice Playwright persistent sessions, resume parsing, and Easy Apply execution.
- `dice-automation-frontend/`: Material-UI React application for managing Dice search profiles, resume library, review queue, and application runs.

Running four independent web applications creates deployment fragility, port conflicts, fragmented authentication, and unnecessary cognitive overhead. This migration genuinely consolidates all capabilities into **one frontend** and **one backend** without microservice proxies or iframe wrappers.

---

## 2. Four-Application Capability Inventory & Mapping Matrix

### 2.1 JobsAPI Backend (`backend/`)
| Component | Functionality | Status in Target Architecture |
| :--- | :--- | :--- |
| **Ingestion Engine** | 13 ATS Providers: Arbeitnow, Ashby, BambooHR, Greenhouse, Jobvite, Lever, Recruitee, Remotive, SmartRecruiters, Teamtailor, TheMuse, USAJobs, Workday | **Preserved** (`src/services/` & `src/routes/sourceRoutes.js`) |
| **Job Search & Query** | Multi-source normalization, text search, salary filters, remote verification, pagination | **Preserved & Expanded** to include native Dice jobs |
| **Candidate Profile** | Universal Candidate Knowledge Graph (UCKGraph), identity, work auth, skills, experience, education | **Preserved** (`src/models/CandidateProfile.js`, `/api/candidate`) |
| **ATS Automation** | 26 Automation Connectors (`DiceConnector`, `GreenhouseConnector`, `LeverConnector`, `WorkdayConnector`, `LinkedInEasyApplyConnector`, etc.) | **Preserved & Upgraded** with Dice session & application state |
| **Task Queue** | BullMQ + Redis job submission queue, retry policies, exponential backoff, worker processor | **Primary Queue** for all automation tasks (ATS + Dice) |
| **File Storage** | `LocalStorageService` with cryptographic sanitization, path traversal guards, `/uploads/resumes` | **Primary Storage** for all resume PDFs & DOCX assets |

### 2.2 JobsAPI Frontend (`frontend/`)
| Page / Component | Current Functionality | Status in Target Architecture |
| :--- | :--- | :--- |
| **Theme & Tokens** | Dice UI Obsidian Deep Navy (`#090D16`), Indigo Gradient (`#6366F1` to `#8B5CF6`), Slate Canvas (`#F8FAFC`), Plus Jakarta Sans | **Primary Design System** across all routes |
| **TopBar / Sidebar** | Live MongoDB status, Dice session status, Playwright engine status | **Primary Navigation** (7 unified sections) |
| **OverviewPage (`/`)** | Hero gradient banner, trending searches, ATS readiness, Dice stats | **Consolidated Dashboard** |
| **DiscoverPage (`/jobs`)** | Unified jobs catalog, search filters, ATS tags | **Consolidated Jobs Explorer** |
| **JobDetailPage (`/jobs/:id`)** | Requisition specs, skills alignment matrix, dual-engine Auto Apply trigger | **Consolidated Job View** |
| **AutoApplyPage (`/automation`)** | 3-tab Automation Center: Queue Metrics, Human Review Queue, Search Profiles | **Consolidated Automation Center** |
| **ApplicationsPage (`/applications`)** | Unified telemetry, status badges, details drawer, retry triggers | **Consolidated Applications Feed** |
| **ProfilePage (`/profile`)** | UCKGraph editor + Dice Resume Library (upload, parse, delete) | **Consolidated Profile & Assets Hub** |
| **SettingsPage (`/settings`)** | Dice session browser launcher, live verification, RPA options, theme selector | **Consolidated Settings Center** |

### 2.3 Dice Automation Backend (`dice-automation-backend/`)
| Feature | Original Implementation (Python FastAPI) | Target Implementation (`backend/` Node.js) |
| :--- | :--- | :--- |
| **Dice Session Management** | Playwright Chromium persistent context, cookie persistence (`data/dice_cookies.json`), encryption | **Port to Node.js Playwright** (`src/automation/dice/DiceSessionManager.js`) |
| **Dice Search Scraping** | `dice_browser.py`: URL builder with filters, DOM evaluation of job cards, deduplication | **Port to Node.js Playwright** (`src/automation/dice/DiceScraperService.js`) |
| **Search Profiles** | CRUD in MongoDB `search_profiles`, periodic/manual execution | **Mongoose Model & Service** (`src/models/SearchProfile.js`, `src/routes/diceRoutes.js`) |
| **Resume Library & Parsing** | PDF/DOCX text extraction, keyword skill matching, summary extraction | **Mongoose Model & Multer Service** (`src/models/Resume.js`, `src/services/resumeParser.service.js`) |
| **Application Execution** | Step-by-step Easy Apply wizard, screener question interception | **Integrated DiceConnector** (`src/automation/connectors/dice/DiceConnector.js`) |
| **Review Queue** | Screener questions stored in `review_queue`, manual answers via API | **Mongoose Model & API Router** (`src/models/ReviewItem.js`, `src/routes/diceRoutes.js`) |
| **Settings & Live Status** | `/settings/dice-status`, `/settings/open-dice-login`, `/dashboard/stats` | **Native Express Endpoints** under `/api/dice` and `/api/settings` |

### 2.4 Dice Automation Frontend (`dice-automation-frontend/`)
| UI View | Consumed Endpoints | Migration Destination in `frontend/` |
| :--- | :--- | :--- |
| `DashboardPage.tsx` | `/dashboard/stats`, `/settings/dice-status` | Incorporated in `frontend/src/pages/OverviewPage.jsx` |
| `ResumesPage.tsx` | `/resumes`, `/resumes/upload`, `/resumes/:id/reparse` | Incorporated in `frontend/src/pages/ProfilePage.jsx` (Tab: Resume Library) |
| `SearchProfilesPage.tsx` | `/search-profiles`, `/search-profiles/:id/run` | Incorporated in `frontend/src/pages/AutoApplyPage.jsx` (Tab: Search Profiles) |
| `ReviewQueuePage.tsx` | `/review-queue`, `/review-queue/:id/answer` | Incorporated in `frontend/src/pages/AutoApplyPage.jsx` (Tab: Review Queue) |
| `ApplicationsPage.tsx` | `/applications`, `/applications/:id/retry` | Incorporated in `frontend/src/pages/ApplicationsPage.jsx` |
| `SettingsPage.tsx` | `/settings`, `/settings/open-dice-login` | Incorporated in `frontend/src/pages/SettingsPage.jsx` |

---

## 3. Architectural Decision: Consolidated Native Node.js Backend

### Decision Rationale
Rather than maintaining a dual-language hybrid server (which would still require Python virtualenv, separate pip dependencies, and dual process supervisors), the Dice automation runtime is ported cleanly to native **Node.js Playwright and Express**.

**Key Technical Justifications:**
1. **Playwright Parity:** The Playwright API in Node.js (`playwright` npm package) is the primary reference implementation maintained by Microsoft. All browser methods used in Python (`page.goto()`, `page.evaluate()`, `page.locator()`, `page.fill()`, `page.click()`) map 1:1 to JavaScript `async/await`.
2. **Unified Data Layer:** Both backends already target MongoDB. Mongoose schemas in `backend/` will manage collections (`jobs`, `resumes`, `search_profiles`, `review_items`, `dice_sessions`) with zero cross-database impedance.
3. **Queue Consolidation:** JobsAPI already utilizes **BullMQ + Redis**, which is significantly more robust than in-memory Python threading. Background Dice search runs and Easy Apply tasks will be processed through BullMQ workers.
4. **Zero Port Conflicts:** `frontend` on port `5173` communicates with `backend` on port `5000`. Port `8000` and `5174` are decommissioned.

---

## 4. Target Directory Structure

```
jobsapi-integration/
├── frontend/                     # Sole Frontend (React 19, Vite, Tailwind CSS, Dice UI)
│   ├── src/
│   │   ├── components/          # Reusable UI, Layout, Job Intelligence cards
│   │   ├── pages/               # 8 consolidated routes
│   │   ├── services/
│   │   │   ├── api.js           # JobsAPI unified endpoints
│   │   │   └── diceApi.js       # Dice-specific endpoints (routed to port 5000)
│   │   └── index.css            # Dice UI design tokens
│   ├── package.json
│   └── vite.config.js
├── backend/                      # Sole Backend (Node.js Express, Mongoose, BullMQ, Playwright)
│   ├── src/
│   │   ├── app.js               # Express app configuration & middleware
│   │   ├── server.js            # HTTP server startup & graceful shutdown
│   │   ├── config/              # Centralized environment, logger, Swagger
│   │   ├── models/              # Mongoose schemas (Jobs, Resumes, Profiles, Reviews)
│   │   │   ├── CandidateProfile.js
│   │   │   ├── Job.js
│   │   │   ├── Resume.js         # Ported from Dice
│   │   │   ├── SearchProfile.js  # Ported from Dice
│   │   │   ├── ReviewItem.js     # Ported from Dice
│   │   │   └── DiceSession.js    # Ported from Dice
│   │   ├── routes/              # Express API routers
│   │   │   ├── jobRoutes.js
│   │   │   ├── candidate.routes.js
│   │   │   ├── automationRoutes.js
│   │   │   ├── diceRoutes.js     # Consolidated Dice router (/api/dice, /api/resumes, etc.)
│   │   │   └── ...
│   │   ├── services/            # Business logic
│   │   │   ├── resumeParser.service.js
│   │   │   ├── diceSearch.service.js
│   │   │   └── ...
│   │   └── automation/          # Playwright RPA engine
│   │       ├── browser/         # BrowserPool, BrowserManager
│   │       ├── connectors/      # 26 connectors (Dice, LinkedIn, Greenhouse, Lever...)
│   │       └── workers/         # BullMQ worker processor
│   ├── package.json
│   └── Dockerfile
├── docs/
│   └── audit/                   # Architecture, Baseline, Plans, Migration Reports
├── docker-compose.yml           # Exactly 4 services: frontend, backend, mongodb, redis
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. API Contract Consolidation & Route Unification Plan

All Dice API routes are consolidated into `backend/src/routes/diceRoutes.js` and mounted on `backend/src/app.js`:

| Route | Method | Purpose | Source / Migration Action |
| :--- | :--- | :--- | :--- |
| `/api/dice/health` | `GET` | Health check for Dice subsystems | Return `{ status: 'ok', database: 'connected', browser: 'ready' }` |
| `/api/dice/settings/dice-status` | `GET` | Check saved Dice session cookies & account | Inspect `data/dice_cookies.json` or MongoDB session |
| `/api/dice/settings/open-dice-login`| `POST` | Launch headful Playwright browser for Dice login | `BrowserManager.launch({ headless: false })` + navigate to Dice |
| `/api/dice/resumes` | `GET` | List candidate resumes with search & filter | Query `Resume` collection |
| `/api/dice/resumes/upload` | `POST` | Upload PDF/DOCX resumes (multi-file) | `multer` upload + `resumeParser.service.js` |
| `/api/dice/resumes/:id` | `GET/PUT/DELETE`| Manage single resume document | Query & update `Resume` collection |
| `/api/dice/resumes/:id/reparse` | `POST` | Trigger re-extraction of text & skills | Re-read stored file + update skills |
| `/api/dice/search-profiles` | `GET/POST` | List and create search profiles | `SearchProfile` collection |
| `/api/dice/search-profiles/:id` | `GET/PUT/DELETE`| Manage search profile | `SearchProfile` collection |
| `/api/dice/search-profiles/:id/run`| `POST` | Scrape Dice jobs using profile filters | `diceSearch.service.js` Playwright scraper |
| `/api/dice/review-queue` | `GET` | List screener questions needing user input | Query `ReviewItem` collection (`status: 'PENDING'`) |
| `/api/dice/review-queue/:id/answer`| `POST` | Submit answer for screener question | Update `ReviewItem` + notify waiting worker |
| `/api/dice/applications/queue` | `POST` | Queue job for Playwright auto-apply | Push task to BullMQ `automation-queue` |
| `/api/dice/applications/queue/status`| `GET` | Queue execution metrics | Query BullMQ queue job counts |
| `/api/dice/applications` | `GET` | Application history & traces | Query `ApplicationSession` + `Application` records |
| `/api/dice/applications/:id/retry` | `POST` | Re-queue failed application | Re-push task to BullMQ |
| `/api/dice/dashboard/stats` | `GET` | Resumes count, profiles count, tasks | Aggregate MongoDB collections |

In `frontend/src/services/diceApi.js`, the default `VITE_DICE_API_BASE_URL` is updated from `http://localhost:8000` to `http://localhost:5000/api/dice`.

---

## 6. Data Model Consolidation

Both platforms store records in MongoDB. Schemas are standardized in Mongoose:

1. **`Resume.js` Schema**:
   - `fileName`: string (required)
   - `displayName`: string
   - `filePath`: string (relative path in `uploads/resumes/`)
   - `targetRole`: string (indexed)
   - `yearsOfExperience`: number
   - `skills`: `[string]`
   - `summary`: string
   - `contentText`: string
   - `customFields`: `[{ key: string, value: string }]`
   - `createdAt`: Date (default: Date.now)

2. **`SearchProfile.js` Schema**:
   - `name`: string (required)
   - `keywords`: `[string]` (required)
   - `location`: string (default: 'United States')
   - `workSettings`: `[string]` (default: `['Remote']`)
   - `employmentTypes`: `[string]` (default: `['FULLTIME']`)
   - `easyApplyOnly`: boolean (default: true)
   - `postedWithin`: string (default: 'ONE')
   - `radius`: number (default: 30)
   - `createdAt`, `updatedAt`: Date

3. **`ReviewItem.js` Schema**:
   - `questionText`: string (required)
   - `questionType`: string (text, radio, checkbox, select)
   - `options`: `[string]`
   - `jobId`: string
   - `jobTitle`: string
   - `companyName`: string
   - `applicationId`: string
   - `status`: string (enum: `['PENDING', 'ANSWERED']`, default: `'PENDING'`)
   - `answerText`: string
   - `createdAt`: Date

4. **`DiceSession.js` Schema**:
   - `userId`: string (default: `'default'`)
   - `cookies`: `[mongoose.Schema.Types.Mixed]`
   - `username`: string
   - `isConnected`: boolean
   - `lastVerified`: Date

---

## 7. Configuration & Docker Compose Unification

### Consolidated `docker-compose.yml`
The application layer is reduced from 4 application containers to exactly 2:
- `frontend` (Port `5173`)
- `backend` (Port `5000`)
- `mongodb` (Port `27017`)
- `redis` (Port `6379`)

`dice-automation-frontend` and `dice-automation-backend` services are removed from `docker-compose.yml`.

---

## 8. Migration Execution Sequence

- **Stage A: Audit & Recovery Checkpoint** *(Completed)*
  - Git branch `feature/two-app-consolidation` created with tag `checkpoint/pre-two-app-consolidation`.
  - Comprehensive mapping and plan documented.

- **Stage B: Backend Native Dice Module Implementation**
  - Create Mongoose models: `Resume.js`, `SearchProfile.js`, `ReviewItem.js`, `DiceSession.js`.
  - Implement `diceSearch.service.js` using Node.js Playwright.
  - Implement `resumeParser.service.js` for PDF/DOCX extraction.
  - Implement `diceRoutes.js` and mount on Express in `backend/src/app.js`.

- **Stage C: Frontend API Client Realignment**
  - Switch `frontend/src/services/diceApi.js` to target `http://localhost:5000/api/dice`.
  - Update `.env.example` in `frontend/`.

- **Stage D: Validation & Test Suite Execution**
  - Run `backend` unit and integration tests (`npm test`).
  - Run `frontend` linter and production build (`npm run lint`, `npm run build`).
  - Test end-to-end Dice search execution, resume upload, and application queue status on port 5000.

- **Stage E: Repository Cleanup & Decommissioning**
  - Verify zero runtime imports or dependencies on `dice-automation-frontend/` and `dice-automation-backend/`.
  - Update `docker-compose.yml`, root `.env.example`, and `README.md`.
  - Safely remove the retired directories.
  - Run full validation suite once more.

- **Stage F: Final Documentation & Sign-off**
  - Produce `docs/audit/TWO_APPLICATION_MIGRATION_REPORT.md`.

---

## 9. Risk Register & Mitigation Strategy

| Risk | Severity | Mitigation |
| :--- | :--- | :--- |
| **Playwright Browser Lifecycle on Windows/Linux** | Medium | Use `BrowserPool` with graceful acquisition timeouts and automatic process garbage collection on disconnect. |
| **Dice Session Cookie Invalidation** | Medium | Cookies stored in both encrypted local file and MongoDB; `openDiceLogin` endpoint allows instant re-authentication in headful browser. |
| **Screener Question Stalling** | Low | `ReviewItem` queue notifies BullMQ worker; worker waits with bounded timeout and marks application as `REVIEW_REQUIRED` rather than crashing. |
| **Regression on ATS Connectors** | Low | All 13 existing ATS providers and 26 connectors remain untouched; Dice router operates as an additive modular domain. |
