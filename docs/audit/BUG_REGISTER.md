# 🐛 Monorepo Bug & Risk Register

**Document:** Prioritized Defect & Risk Register  
**Project:** JobsAPI Integration Platform  
**Audit Date:** 2026-10-10  
**Repository Branch:** `main`  
**Auditor:** Senior Staff Architect, Full-Stack Engineer, DevOps & Security Reviewer  

---

## 1. Classification & Severity Standards

Every issue is classified into one of four severity tiers:
* **Critical (P0):** Immediate security flaw, data loss, crash loop, or service-halting blocker.
* **High (P1):** Architectural defect, runtime error, broken build, or uncontrolled concurrency.
* **Medium (P2):** Port collisions, configuration desync, containerization gaps, or lint violations.
* **Low (P3):** Code style inconsistencies, unorganized diagnostic dumps, or minor documentation drifts.

---

## 2. Structured Bug & Risk Register

### [BUG-01] Frontend ESLint Violations & React 19 State Hydration Warnings
* **Severity:** High (P1)
* **Status:** Confirmed Defect
* **Affected Service & Files:** `frontend/src/pages/SavedJobsPage.jsx`, `frontend/src/pages/ProfilePage.jsx`, and various components.
* **Description:** Running `npm run lint` generates 98 errors. The errors stem from:
  1. Legacy `import React from 'react'` in React 19 where modern JSX automatic transforms make default React imports redundant and trigger `no-unused-vars`.
  2. Calling `setState` synchronously within `useEffect` bodies (in `SavedJobsPage.jsx` and `ProfilePage.jsx`), which triggers React 19 `react-hooks/set-state-in-effect` errors and causes cascading renders.
  3. Unused destructured variables (`isLoading`, `data`, `refetch`).
* **Root Cause:** React 19 stricter hook linter rules and residual legacy boilerplate.
* **Impact:** Broken automated CI lint checks; potential unnecessary browser re-renders.
* **Recommended Fix:** 
  1. Remove redundant `import React` statements.
  2. Refactor state initialization using lazy initializer callbacks `useState(() => ...)` instead of synchronous `useEffect(setState)`.
  3. Clean unused imports and variables.
* **Regression Tests:** `npm run lint` and `npm run build` in `frontend/`.

---

### [BUG-02] Monorepo Local Port Collision Between JobsAPI and Dice Frontends
* **Severity:** Medium (P2)
* **Status:** Confirmed Defect
* **Affected Service & Files:** `frontend/vite.config.js` and `dice-automation-frontend/vite.config.ts`.
* **Description:** Both frontends use Vite and do not specify an explicit development server port in their config files. By default, Vite attempts to bind to port `5173`. When both applications are run concurrently, the second application gets assigned an unpredictable fallback port (e.g. `5174` or `5175`).
* **Root Cause:** Missing explicit `server.port` declarations in `vite.config.*`.
* **Impact:** Broken CORS mappings and developer friction when testing both applications simultaneously.
* **Recommended Fix:** Set `frontend` to port `5173` and `dice-automation-frontend` explicitly to port `5174` in their respective Vite configurations.
* **Regression Tests:** Launch both Vite development servers simultaneously and verify expected port binding.

---

### [BUG-03] Missing Root Monorepo Configuration Suite
* **Severity:** Medium (P2)
* **Status:** Confirmed Defect
* **Affected Service & Files:** Monorepo Root (`.gitignore`, `.dockerignore`, `.editorconfig`, `.env.example`).
* **Description:** The monorepo root lacks a `.gitignore`, `.dockerignore`, `.editorconfig`, and `.env.example`. Only individual subdirectories contain `.gitignore` files.
* **Root Cause:** Monorepo consolidation without unified root configuration.
* **Impact:** High risk of committing temporary logs (`*.log`), build artifacts, or secret keys from root commands. Docker builds from root context copy excessive unneeded files.
* **Recommended Fix:** Add comprehensive root-level `.gitignore`, `.dockerignore`, `.editorconfig`, and `.env.example` templates.
* **Regression Tests:** Verify `git status` ignores root build artifacts and temporary files.

---

### [BUG-04] Dice Automation Stack Omitted from Monorepo `docker-compose.yml`
* **Severity:** Medium (P2)
* **Status:** Confirmed Architectural Defect
* **Affected Service & Files:** `docker-compose.yml`.
* **Description:** The root `docker-compose.yml` only provisions `mongodb`, `redis`, `api` (JobsAPI backend), `worker` (JobsAPI worker), and `frontend` (JobsAPI UI). The Dice Automation Backend and Dice Automation Frontend services are completely absent from Docker Compose.
* **Root Cause:** Historical development of Dice Automation as a separate standalone repository.
* **Impact:** Inability to run or test the complete monorepo stack with a single `docker-compose up` command.
* **Recommended Fix:** Extend `docker-compose.yml` with optional profiles or service definitions for `dice-backend` (port 8000) and `dice-frontend` (port 5174), connecting to the shared `jobsapi-network`.
* **Regression Tests:** `docker compose config` syntax validation.

---

### [BUG-05] Missing Environment Configuration Templates
* **Severity:** Low (P3)
* **Status:** Confirmed Defect
* **Affected Service & Files:** `frontend/.env.example` and `dice-automation-backend/.env`.
* **Description:** `frontend` contains a `.env` but lacks `.env.example`. Conversely, `dice-automation-backend` contains `.env.example` but no default `.env` for local non-Docker development.
* **Root Cause:** Inconsistent environment file conventions across the four applications.
* **Impact:** Poor developer onboarding ergonomics; potential configuration confusion.
* **Recommended Fix:** Provide `frontend/.env.example` and create a safe local default `dice-automation-backend/.env`.
* **Regression Tests:** Inspect file presence and verify no secrets are committed.

---

### [BUG-06] Inconsistent Node.js Dice Connector vs Mature Python Dice Engine
* **Severity:** Medium (P2)
* **Status:** Architectural Discrepancy & Technical Debt
* **Affected Service & Files:** `backend/src/automation/connectors/dice/DiceConnector.js`.
* **Description:** `backend` contains a 79-line placeholder `DiceConnector.js` with stubbed methods (`authenticate()` is empty, `verify()` returns static true, only 4 form fields are mapped). Meanwhile, `dice-automation-backend` contains a comprehensive 400+ line `DiceBoard.py` with multi-step wizard navigation, CAPTCHA challenge guards, cookie encryption, and resume attachment.
* **Root Cause:** Concurrent implementations by different teams before monorepo consolidation.
* **Impact:** Misleading system capabilities; maintainers might mistakenly attempt to debug or extend the incomplete Node.js connector instead of utilizing the mature Python engine.
* **Recommended Fix:** Document clearly in `DiceConnector.js` that the canonical Dice automation platform is hosted in `dice-automation-backend/`, or wire `DiceConnector.js` to delegate tasks to the Dice backend REST API.
* **Regression Tests:** Node unit test pass rate.

---

### [BUG-07] Host Python Dependency Mismatch for Dice Backend
* **Severity:** Medium (P2)
* **Status:** Environmental Prerequisite Blocker
* **Affected Service & Files:** `dice-automation-backend/tests/`.
* **Description:** Host Windows Python 3.12 lacks the `playwright` Python package and has a broken C++ runtime in host `pymupdf 1.24.10`, causing pytest collection to halt with `ModuleNotFoundError: No module named 'playwright'` and `ImportError: DLL load failed while importing _extra`.
* **Root Cause:** Host system lacks dedicated virtual environment `.venv` with the exact pinned wheels from `requirements.txt`.
* **Impact:** Bare-metal test execution is blocked on Windows without virtual environment isolation or containerized execution.
* **Recommended Fix:** Document the exact setup commands in `DEVELOPMENT.md` (`python -m venv .venv; .venv\Scripts\pip install -r requirements.txt; python -m playwright install chromium`).
* **Regression Tests:** Run pytest inside containerized or virtualenv runtime.

---

### [BUG-08] Process-Local Rate Limiter and Sync Mutex (Multi-Replica Scaling Risk)
* **Severity:** Low (P3)
* **Status:** Architectural Risk (Documented)
* **Affected Service & Files:** `backend/src/middleware/rateLimiter.js` and `backend/src/services/sync.service.js`.
* **Description:** The token bucket rate limiter in `rateLimiter.js` and `isSyncAllRunning` mutex flag in `sync.service.js` reside in Node.js process memory. In a multi-replica container deployment, different API replicas will not share token buckets or mutex locks.
* **Root Cause:** Initial single-instance design.
* **Impact:** Acceptable for single-instance Docker/monolith deployment; risk when scaling horizontally.
* **Recommended Fix:** Retain current process-local implementation for baseline stability, but document the roadmap migration to Redis-backed distributed locks (`ioredis` / Redlock) and Redis token-buckets (`rate-limiter-flexible`).
* **Regression Tests:** Process-local unit tests continue to pass.

---

### [BUG-09] Loose Diagnostic HTML Dumps and Scripts in Backend Root
* **Severity:** Low (P3)
* **Status:** Confirmed Repository Hygiene Issue
* **Affected Service & Files:** `backend/` root files (`analyze_apply.js`, `analyze_html.js`, `greenhouse_*.html`, `test_*.js`).
* **Description:** 15 loose test and snapshot files reside directly in `backend/` instead of dedicated `tests/` or `evidence/` directories.
* **Root Cause:** Rapid iterative debugging during Greenhouse automation development.
* **Impact:** Cluttered application root; confusion between production scripts and temporary test dumps.
* **Recommended Fix:** Move diagnostic HTML snapshots to `backend/evidence/snapshots/` and consolidate one-off test scripts in `backend/scripts/diagnostics/` while preserving file contents.
* **Regression Tests:** Verify `backend` tests and builds continue to run.

---

### [BUG-10] Dice Automation Backend Dockerfile Missing Healthcheck
* **Severity:** Low (P3)
* **Status:** Confirmed DevOps Defect
* **Affected Service & Files:** `dice-automation-backend/Dockerfile`.
* **Description:** `dice-automation-backend/Dockerfile` exposes port 8000 but does not declare a `HEALTHCHECK` instruction, unlike `backend/Dockerfile` which implements a robust `HEALTHCHECK` against `/health`.
* **Root Cause:** Incomplete Dockerfile hardening.
* **Impact:** Container orchestrators (Docker Compose, Kubernetes) cannot verify container readiness before routing traffic.
* **Recommended Fix:** Add `HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:8000/health || exit 1` to `dice-automation-backend/Dockerfile`.
* **Regression Tests:** Validate Dockerfile syntax.
