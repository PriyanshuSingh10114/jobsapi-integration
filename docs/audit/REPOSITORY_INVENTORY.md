# 📦 Monorepo Repository Inventory & Technology Audit

**Document:** Monorepo Inventory & Technical Baseline  
**Project:** JobsAPI Integration Platform  
**Audit Date:** 2026-10-10  
**Repository Branch:** `main` (Safety Backup: `backup/pre-audit-baseline`)  
**Auditor:** Senior Staff Architect, Full-Stack Engineer, DevOps & Security Reviewer  

---

## 1. Monorepo Overview & High-Level Structure

The JobsAPI Integration Platform is a consolidated monorepo housing four previously independent applications plus auxiliary components (Chrome Extension, telemetry suites, and reporting tooling):

```
jobsapi-integration/
├── .vscode/                     # IDE workspace configurations
├── backend/                     # Node.js / Express Core JobsAPI & Universal ATS Automation Platform
├── frontend/                    # Vite + React 19 Single Page Application for JobsAPI
├── dice-automation-backend/     # Python / FastAPI + Playwright Dedicated Dice Automation Engine
├── dice-automation-frontend/    # Vite + React 19 + TypeScript + MUI Application for Dice Automation
├── docs/                        # Architecture, API, and validation documentation
│   └── audit/                   # Systematic audit, baseline, risk, and stabilization deliverables
├── docker-compose.yml           # Root multi-container orchestration manifest (JobsAPI stack)
├── README.md                    # Root architecture and usage guide
└── JobsAPI_Engineering_and_API_Report.pdf  # Comprehensive platform report artifact
```

---

## 2. Application-by-Application Inventory

### Application 1: JobsAPI Core Backend (`backend/`)

* **Role & Responsibility:** Ingests jobs from 13+ ATS providers, deduplicates and normalizes job data, indexes documents into MongoDB, exposes authenticated REST API endpoints, and orchestrates asynchronous candidate auto-apply jobs via BullMQ and Playwright Chromium.
* **Technology Stack:**
  * **Runtime:** Node.js (Verified: `v22.13.1`, Target: Node 22)
  * **Framework:** Express.js (`v5.2.1`)
  * **Database ORM/ODM:** Mongoose (`v9.7.0`) for MongoDB
  * **Caching & Queues:** `ioredis` (`v5.11.1`), `bullmq` (`v5.80.5`)
  * **Browser Automation:** Playwright (`v1.61.1`)
  * **Logging & Docs:** Winston (`v3.19.0`), Swagger UI Express (`v5.0.1`), swagger-jsdoc (`v6.3.0`)
  * **Security & Network:** Axios (`v1.18.0`), axios-retry (`v4.5.0`), multer (`v2.2.0`), cors (`v2.8.6`), dotenv (`v17.4.2`)
* **Entry Points:**
  * **REST API Server:** `backend/src/server.js` (Express app configured in `backend/src/app.js`)
  * **Automation Worker:** `backend/src/automation/workers/AutomationWorkerProcessor.js`
* **Available Commands (`backend/package.json`):**
  * Development API: `npm run dev` (`nodemon src/server.js`)
  * Production API: `npm start` (`node src/server.js`)
  * Worker: `npm run worker` (`node src/automation/workers/AutomationWorkerProcessor.js`)
  * Duplicate Audit: `npm run audit:duplicates` (`node src/scripts/auditDuplicates.js`)
  * All Tests: `npm test` (`node --test tests/unit/*.test.js tests/integration/*.test.js`)
  * Unit Tests: `npm run test:unit` (`node --test tests/unit/*.test.js`)
  * Integration Tests: `npm run test:integration` (`node --test tests/integration/*.test.js`)
* **Database & External Dependencies:**
  * **MongoDB:** Database `jobsapi` (Local port 27017 or MongoDB Atlas URI via `MONGODB_URI`)
  * **Redis:** Port 6379 (for BullMQ queues and worker coordination)
  * **External ATS Ingestion Endpoints:** Greenhouse, Lever, Ashby, USAJobs, TheMuse, SmartRecruiters, Recruitee, Workday, Jobvite, Teamtailor, BambooHR, Arbeitnow, Remotive
* **Key Configuration Files:**
  * `backend/src/config/environment.js` (Fail-fast centralized configuration validator)
  * `backend/src/config/db.js` (Mongoose connection pool configuration)
  * `backend/src/config/swagger.js` (OpenAPI specification)
  * `backend/src/config/connectors/*.json` (ATS seed directory and validated company token feeds)
  * `backend/.env.example` & `backend/.env`
* **Test Coverage & Limitations:**
  * 38 automated test cases using Node.js built-in test runner (`node --test`).
  * Covers token hashing, data extraction, location normalization, state machine transitions, canonical profile schema, rate limiting, and RBAC authentication.
  * *Limitation:* Does not execute real third-party ATS browser submissions in unit CI (uses mocks/test harness).

---

### Application 2: JobsAPI Web Frontend (`frontend/`)

* **Role & Responsibility:** Responsive client dashboard for job search, filtering, auto-apply workflow management, source health monitoring, skill trends, and candidate profile management.
* **Technology Stack:**
  * **Runtime:** Node.js (`v22.13.1`), npm (`11.13.0`)
  * **Framework / Build Tool:** React (`v19.2.6`), React DOM (`v19.2.6`), Vite (`v8.0.12`, resolved `8.0.16`)
  * **Styling:** Tailwind CSS (`v4.3.1`), `@tailwindcss/vite` (`v4.3.1`), PostCSS (`v8.5.15`)
  * **Data Fetching & State:** `@tanstack/react-query` (`v5.101.0`), Axios (`v1.18.0`)
  * **Routing:** `react-router-dom` (`v7.18.0`)
  * **Icons & Visualization:** `lucide-react` (`v1.20.0`), `recharts` (`v3.8.1`)
* **Entry Points:**
  * HTML: `frontend/index.html`
  * Application Mount: `frontend/src/main.jsx` -> `frontend/src/App.jsx`
* **Available Commands (`frontend/package.json`):**
  * Development Server: `npm run dev` (`vite`, default port 5173)
  * Production Build: `npm run build` (`vite build`)
  * Code Linting: `npm run lint` (`eslint .`)
  * Preview Bundle: `npm run preview` (`vite preview`)
* **Database & External Dependencies:**
  * Consumes JobsAPI Backend REST endpoints on `http://localhost:5000/api` (configured via `VITE_API_BASE_URL`).
* **Key Configuration Files:**
  * `frontend/vite.config.js`
  * `frontend/eslint.config.js`
  * `frontend/.env` (`VITE_API_BASE_URL=http://localhost:5000/api`)
  * Note: `frontend/.env.example` was missing.
* **Test Coverage & Limitations:**
  * No unit/E2E test suite configured in `package.json` (no Jest/Vitest/Playwright tests).
  * ESLint static analysis configured, but presently reports 98 non-blocking lint errors (predominantly `no-unused-vars` and React 19 `react-hooks/set-state-in-effect`).

---

### Application 3: Dice Automation Backend (`dice-automation-backend/`)

* **Role & Responsibility:** Specialized automation engine for Dice.com job discovery, semantic job description matching, candidate resume parsing, persistent session/cookie management, and interactive/autonomous application execution on Dice.
* **Technology Stack:**
  * **Runtime:** Python (Host: `3.12.6`, Docker target: `3.11-slim`)
  * **Web Framework:** FastAPI (`v0.141.1`), Uvicorn (`v0.53.0`), Starlette (`v1.6.0`)
  * **Database ODM / Driver:** Motor (`v3.7.1`), PyMongo (`v4.18.1`) for async MongoDB
  * **Browser Automation:** Playwright Python (`v1.63.0`)
  * **Document Parsing & AI:** PyMuPDF (`v1.28.2` specified in requirements; host has broken `1.24.10`), `python-docx` (`v1.2.0`), OpenAI API (`v3.14.1`, model: `gpt-4o-mini`)
  * **Validation & Security:** Pydantic (`v2.13.5`), `pydantic-settings` (`v2.15.0`), PyJWT (`v2.9.0`), `cryptography` (`>=42.0.0`), `bcrypt` (`>=4.2.0`), `email-validator`
* **Entry Points:**
  * Web API: `dice-automation-backend/app/main.py` (`uvicorn app.main:app --port 8000`)
  * Automation Runner / Worker: `app.services.application_queue.application_queue_manager` (started in `main.py` lifespan)
* **Available Commands & Scripts:**
  * Direct Startup: `uvicorn app.main:app --host 0.0.0.0 --port 8000` (or `python -m app.main`)
  * Tests: `pytest tests/`
  * Session Exporter: `python scripts/export_session.py`
  * Interactive Headed Login: `python scripts/login_dice.py`
  * Render Cloud Build: `bash render-build.sh`
* **Database & External Dependencies:**
  * **MongoDB:** Database `dice_automation` (configured via `MONGODB_URL` and `DATABASE_NAME`)
  * **OpenAI API:** Optional semantic JD parsing & tailoring (`OPENAI_API_KEY`)
  * **Cloudinary:** Optional resume asset cloud sync
  * **Target Host:** Dice.com (`https://www.dice.com`)
* **Key Configuration Files:**
  * `dice-automation-backend/app/config.py`
  * `dice-automation-backend/.env.example`
  * `dice-automation-backend/Dockerfile`
  * `dice-automation-backend/render.yaml`
  * `dice-automation-backend/requirements.txt`
* **Test Coverage & Limitations:**
  * 10 Python test files in `tests/` (`test_production_readiness.py`, `test_browser_manager.py`, `test_dice_session.py`, `test_application_execution.py`, `test_resumes.py`, etc.).
  * *Critical Baseline Blockers:* Host Python environment lacks `playwright` Python module and has a broken C++ runtime/DLL in host `pymupdf`, preventing test suite execution on local bare-metal without containerization or virtualenv installation.

---

### Application 4: Dice Automation Frontend (`dice-automation-frontend/`)

* **Role & Responsibility:** Dedicated operator portal for Dice job tracking, search profile configuration, resume uploads, candidate matching, and manual review queue before autonomous submission.
* **Technology Stack:**
  * **Runtime:** Node.js (`v22.13.1`), npm (`11.13.0`)
  * **Framework / Build Tool:** React (`v19.2.8`), Vite (`v8.3.0`), TypeScript (`v6.0.2`)
  * **UI Component Library:** Material UI (`@mui/material` `v9.4.0`), Emotion (`@emotion/react`, `@emotion/styled` `v11.14.0`), `@mui/icons-material` (`v9.4.0`)
  * **Routing & Client:** `react-router-dom` (`v7.18.4`), Axios (`v1.20.0`)
  * **Linter:** Oxlint (`v1.81.0`)
* **Entry Points:**
  * HTML: `dice-automation-frontend/index.html`
  * Application Mount: `src/main.tsx` -> `src/App.tsx`
* **Available Commands (`dice-automation-frontend/package.json`):**
  * Development Server: `npm run dev` (`vite`, default port 5173 - port conflict with JobsAPI frontend if run simultaneously without port override)
  * Production Build: `npm run build` (`tsc -b && vite build`) -> Verified PASS
  * Code Linting: `npm run lint` (`oxlint`) -> Verified PASS (0 errors, 10 warnings)
  * Preview: `npm run preview` (`vite preview`)
* **Database & External Dependencies:**
  * Consumes Dice Automation Backend on `http://localhost:8000` (configured via `VITE_API_BASE_URL`).
* **Key Configuration Files:**
  * `dice-automation-frontend/vite.config.ts`
  * `dice-automation-frontend/tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
  * `dice-automation-frontend/.oxlintrc.json`
  * `dice-automation-frontend/.env` & `.env.example`
* **Test Coverage & Limitations:**
  * No unit or component test runner (Jest/Vitest) configured.
  * Static type checking (`tsc -b`) and linting (`oxlint`) pass cleanly.

---

## 3. Auxiliary Components

### 3.1 Dice Chrome Extension (`dice-automation-backend/dice-chrome-extension/`)
* **Purpose:** Chrome browser extension (Manifest V3) allowing human operators to log into Dice.com on their personal browser and seamlessly export authenticated session cookies/tokens directly to the Dice Automation Backend (`POST http://localhost:8000/api/dice-session/connect`).
* **Key Files:** `manifest.json`, `background.js`, `popup.html`, `popup.js`, `popup.css`.

### 3.2 Reporting & Maintenance Scripts
* `backend/scripts/generate_pdf_report.js`: Compiles the comprehensive architecture and performance report using Playwright PDF rendering.
* `backend/src/scripts/`: Housekeeping scripts for deduplication audits (`auditDuplicates.js`), metrics cleanup (`cleanupSyncMetrics.js`), token validators (`validateLeverTokens.js`), and company registry verifiers.

---

## 4. Environment & Tooling Version Summary

| Tool / Runtime | Host Installed Version | Intended Target Version | Status |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v22.13.1` | `>= 22.0.0` | **MATCH** |
| **npm** | `11.13.0` | `>= 10.0.0` | **MATCH** |
| **Python** | `3.12.6` | `3.11 / 3.12` | **MATCH** |
| **MongoDB** | `7.0.x` (Port 27017 active) | `>= 6.0` | **MATCH** |
| **Redis** | Port 6379 active | `>= 7.0` | **MATCH** |
| **Docker CLI** | `28.3.2` | `>= 24.0` | **MATCH** |
| **Docker Daemon** | Not running | Running engine | **BLOCKED** (Engine offline) |

---

## 5. Architectural Observations & Gaps

1. **Monorepo Disconnect:**
   * `docker-compose.yml` only coordinates `backend`, `frontend`, `mongodb`, and `redis`. It does not define services for `dice-automation-backend` or `dice-automation-frontend`.
2. **Port Collisions:**
   * Both `frontend` and `dice-automation-frontend` use Vite and default to port `5173` if started simultaneously in local development without explicit port separation.
3. **Redundant Feature Duplication:**
   * `backend` contains a preliminary `DiceConnector.js` stub in Node.js, while `dice-automation-backend` contains a complete, production-grade Dice automation system in Python.
4. **Root Repository Hygiene:**
   * The monorepo root lacks a `.gitignore`, `.env.example`, `.dockerignore`, and `.editorconfig`.
   * Loose debugging scripts, logs, and diagnostic HTML snapshots exist in `backend/` root directory.
5. **Python Host Dependency Drift:**
   * Bare-metal Python lacks `playwright` and has a broken `pymupdf` C-extension, meaning `dice-automation-backend` requires a dedicated virtualenv or Docker container to run its test suite safely.
