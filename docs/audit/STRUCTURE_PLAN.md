# 📐 Monorepo Target Structure & Reorganization Plan

**Document:** Target Architecture & Monorepo Reorganization Plan  
**Project:** JobsAPI Integration Platform  
**Audit Date:** 2026-10-10  
**Repository Branch:** `main`  
**Auditor:** Senior Staff Architect, Full-Stack Engineer, DevOps & Security Reviewer  

---

## 1. Guiding Principles & Non-Destructive Invariants

To maintain stability while making the monorepo clean, predictable, and maintainable, this reorganization strictly adheres to the following principles:

1. **Independent Runnability:** Each of the four applications (`backend`, `frontend`, `dice-automation-backend`, `dice-automation-frontend`) must remain fully self-contained and runnable independently without cross-application module dependencies or circular imports.
2. **Contract Preservation:** No API routes, HTTP schemas, environment variable names, database models, or build scripts will be altered without backward compatibility.
3. **No Indiscriminate Mass Refactoring:** Core business logic, ATS connectors, and automation workers will not be arbitrarily moved or rewritten.
4. **Zero Data/Feature Loss:** No existing features, test harnesses, or configurations will be removed.
5. **Progressive, Verifiable Batches:** Every batch of changes must be followed by validation builds and tests.

---

## 2. Monorepo Structural Blueprint

### 2.1 Target Root Hierarchy

```
jobsapi-integration/
├── .github/
│   └── workflows/                       # CI/CD pipelines (Tests, Builds, Lints)
├── .vscode/                             # Workspace settings & launch configurations
├── backend/                             # [App 1] JobsAPI Express Backend & Universal Worker
│   ├── evidence/                        # Test evidence & HTML diagnostic snapshots
│   │   └── snapshots/                   # Reorganized Greenhouse/ATS test snapshots
│   ├── src/                             # Core Express application source
│   ├── tests/                           # Unit and integration test suites
│   ├── uploads/                         # Temporary/local file upload directory
│   ├── Dockerfile                       # Multi-stage production Dockerfile
│   └── package.json                     # Node.js dependencies and scripts
├── frontend/                            # [App 2] JobsAPI React 19 Frontend
│   ├── src/                             # UI components, pages, services, utils
│   ├── public/                          # Static assets and icons
│   ├── Dockerfile                       # Nginx multi-stage Dockerfile
│   └── package.json                     # React dependencies and build scripts
├── dice-automation-backend/             # [App 3] Python FastAPI Dice Automation Engine
│   ├── app/                             # FastAPI controllers, browser engines, schemas
│   ├── dice-chrome-extension/           # Companion session extraction Chrome Extension
│   ├── resumes/                         # Local resume PDF/DOCX storage
│   ├── scripts/                         # Maintenance and headed login scripts
│   ├── tests/                           # Pytest automation test suite
│   ├── Dockerfile                       # Python 3.11 + Playwright production container
│   ├── requirements.txt                 # Pinned Python dependencies
│   └── render.yaml                      # Cloud deployment manifest
├── dice-automation-frontend/            # [App 4] React 19 + TypeScript Dice Operator Portal
│   ├── src/                             # Material UI pages, components, types, services
│   ├── public/                          # Static icons and assets
│   ├── Dockerfile                       # Standardized container definition
│   └── package.json                     # Dependencies and build scripts
├── docs/                                # Technical & Architectural Documentation
│   ├── audit/                           # Formal monorepo audit deliverables
│   │   ├── REPOSITORY_INVENTORY.md      # Application catalog & tool baseline
│   │   ├── ARCHITECTURE.md              # System flows, pipeline & boundary mapping
│   │   ├── BASELINE.md                  # Empirical test & verification baseline
│   │   ├── BUG_REGISTER.md              # Prioritized defect register
│   │   ├── STRUCTURE_PLAN.md            # Target structure & migration plan (This Document)
│   │   └── STABILIZATION_REPORT.md      # Final verification & stabilization sign-off
│   ├── development/                     # Local setup guides for all services
│   └── deployment/                      # Docker & cloud deployment runbooks
├── scripts/                             # Monorepo-level utility scripts (bootstrap, dev)
├── docker-compose.yml                   # Unified Docker Compose manifest (all 4 apps + DBs)
├── .gitignore                           # Comprehensive root gitignore
├── .dockerignore                        # Comprehensive root dockerignore
├── .editorconfig                        # Universal coding style conventions
├── .env.example                         # Safe root monorepo environment template
└── README.md                            # High-level monorepo operational guide
```

---

## 3. Structural Reorganization Batches

### Batch 1: Monorepo Root Hygiene & Developer Ergonomics
* **Actions:**
  1. Add root `.gitignore` to prevent committing `node_modules/`, `.venv/`, `*.log`, `dist/`, `coverage/`, and sensitive `.env` files across all four apps.
  2. Add root `.dockerignore` to streamline Docker build contexts.
  3. Add root `.editorconfig` for cross-platform formatting consistency (LF line endings, UTF-8, 2-space indentation).
  4. Add root `.env.example` consolidating environment variables across all services without disclosing credentials.
  5. Add `frontend/.env.example` for developer reference.
* **Verification:** Run `git status` to verify root ignore rules work cleanly.

### Batch 2: Port Conflict Resolution & Frontend Dev Configuration
* **Actions:**
  1. Configure `dice-automation-frontend/vite.config.ts` to use explicit development server port `5174`:
     ```ts
     server: { port: 5174, strictPort: true }
     ```
  2. Configure `frontend/vite.config.js` with explicit development server port `5173`:
     ```js
     server: { port: 5173, strictPort: true }
     ```
* **Verification:** Run `npm run build` in both frontends to ensure zero configuration regressions.

### Batch 3: Frontend ESLint & React 19 State Hook Fixes
* **Actions:**
  1. Remove unnecessary `import React from 'react'` from React 19 components in `frontend/`.
  2. Refactor synchronous `useEffect(setState)` calls in `frontend/src/pages/SavedJobsPage.jsx` and `ProfilePage.jsx` into lazy state initializers:
     ```jsx
     // Before (triggers react-hooks/set-state-in-effect error):
     const [savedJobs, setSavedJobs] = useState([]);
     useEffect(() => { setSavedJobs(JSON.parse(...)); }, []);

     // After (idiomatic & clean):
     const [savedJobs, setSavedJobs] = useState(() => {
       try { return JSON.parse(localStorage.getItem('jobsapi_saved_jobs') || '[]'); }
       catch { return []; }
     });
     ```
  3. Remove unused variables flagged by ESLint.
* **Verification:** Run `npm run lint` and `npm run build` in `frontend/`.

### Batch 4: Unified Docker Orchestration & Container Hardening
* **Actions:**
  1. Add `dice-automation-frontend/Dockerfile` (Multi-stage Node build -> Nginx).
  2. Update `dice-automation-backend/Dockerfile` with a native `HEALTHCHECK` probe.
  3. Update root `docker-compose.yml` to define services for:
     * `mongodb` (port 27017)
     * `redis` (port 6379)
     * `jobsapi-api` (port 5000)
     * `jobsapi-worker` (Playwright worker)
     * `jobsapi-frontend` (port 5173)
     * `dice-backend` (port 8000)
     * `dice-frontend` (port 5174)
* **Verification:** Validate Compose syntax using `docker compose config` (or schema check).

### Batch 5: Backend Diagnostic File Consolidation
* **Actions:**
  1. Move loose HTML snapshots (`greenhouse_*.html`) from `backend/` root into `backend/evidence/snapshots/`.
  2. Relocate one-off scratch scripts (`analyze_*.js`, `test_diagnostics.js`, `test_score.js`) into `backend/scripts/diagnostics/` to declutter the application root while preserving complete file contents.
* **Verification:** Run `npm test` in `backend/` to verify zero broken path dependencies.

### Batch 6: Final Stabilization Report & Acceptance
* **Actions:**
  1. Compile `docs/audit/STABILIZATION_REPORT.md` verifying all checks, fixed issues, and operational commands.
