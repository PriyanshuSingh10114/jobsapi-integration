# 🗺️ Unified Frontend Architecture & Migration Plan

**Document:** Frontend Consolidation Architecture & Capability Mapping  
**Primary Application:** `frontend/` (JobsAPI + Dice Unified Interface)  
**Main Design & Theme:** **Dice UI Theme** (`#090d16` Obsidian Sidebar, Indigo/Violet Gradient `#6366f1` / `#8b5cf6`, `#f8fafc` Slate Canvas, Plus Jakarta Sans typography)  
**Date:** 2026-10-10  
**Status:** In Progress — Stage 1 Complete, Stage 2 Initiating  

---

## 1. Executive Summary

This document specifies the technical plan to consolidate the user-facing capabilities of `frontend/` and `dice-automation-frontend/` into a single, cohesive, production-grade application hosted inside `frontend/`.

Per user requirements, the **Dice UI Theme** is the primary design language across the entire application shell, ensuring a modern, high-tech, dark-accented aesthetic with real-time status indicators and consistent ergonomics.

Both underlying backend services remain active and independent:
* **JobsAPI Backend (`http://localhost:5000/api`):** Job aggregation across 13+ ATS providers, MongoDB search indexing, and universal BullMQ application worker.
* **Dice Automation Backend (`http://localhost:8000`):** Dice authenticated session management, search profiles, resume parsing, and Playwright automation queue.

---

## 2. Comprehensive Capability Mapping

| Capability / Feature | Original Source Application | Target Unified Route | Backend Service Endpoint | Status in Unified Frontend |
| :--- | :--- | :--- | :--- | :--- |
| **System Overview & KPI Stats** | `frontend/` & `dice-automation-frontend/` | `/` (`Dashboard`) | JobsAPI: `GET /stats`<br/>Dice: `GET /dashboard/stats`, `GET /settings/dice-status` | Unified aggregation card grid with real-time status chips |
| **Unified Job Feed & Search** | `frontend/` & `dice-automation-frontend/` | `/jobs` & `/discover` | JobsAPI: `GET /jobs`, `GET /jobs/search`<br/>Dice: `GET /jobs` | Unified faceted search with ATS & Dice provider badges |
| **Job Details & One-Click Apply** | `frontend/` & `dice-automation-frontend/` | `/jobs/:id` | JobsAPI: `GET /jobs/:id`<br/>Dice: `POST /applications/queue` | Detail drawer/page supporting original apply URL or Dice automation |
| **Automation Queue & Worker** | `dice-automation-frontend/` | `/automation` | Dice: `GET /applications/queue/status`<br/>JobsAPI: `GET /automation/status/:id` | Unified automation center with live progress bar and task status |
| **Human-in-the-Loop Review Queue** | `dice-automation-frontend/` | `/automation/review` | Dice: `GET /review-queue`, `POST /review-queue/:id/answer` | Interactive modal/page for candidate confirmation and custom answers |
| **Dice Search Profiles** | `dice-automation-frontend/` | `/automation/profiles` | Dice: `GET /search-profiles`, `POST /search-profiles` | Full CRUD profile builder with title keywords, radius, remote filters |
| **Application History & Tracking**| `frontend/` & `dice-automation-frontend/` | `/applications` | Dice: `GET /applications`<br/>JobsAPI: `GET /automation/logs/:id` | Unified status timeline with retry actions, timestamps, and error reasons |
| **Saved Jobs & Bookmarks** | `frontend/` | `/saved` | LocalStorage + JobsAPI backend | Quick-action role bookmarks with direct apply launcher |
| **Candidate Profile & UCKGraph** | `frontend/` | `/profile` | JobsAPI: `GET /candidate/profile`, `PUT /candidate/profile` | Canonical candidate profile editor and ATS readiness calculator |
| **Resume Library & AI Parser** | `dice-automation-frontend/` | `/profile/resumes` | Dice: `GET /resumes`, `POST /resumes/upload`, `POST /resumes/:id/reparse` | Drag-and-drop resume uploader, PDF preview, skill tag extractor |
| **Integrations & Dice Session** | `dice-automation-frontend/` | `/settings` | Dice: `GET /settings/dice-status`, `POST /settings/open-dice-login`<br/>JobsAPI: `GET /health/ready` | Session credentials checker, headed login trigger, Chrome extension guide |
| **Source Health & Telemetry** | `frontend/` | `/settings/sources` | JobsAPI: `GET /sources`, `GET /analytics/sources` | Real-time ATS ingestion latency, failure rates, and sync metrics |

---

## 3. Unified Navigation Architecture

The unified navigation follows the 7 core sections specified in the architectural mandate:

```
[Sidebar: Obsidian Dark #090d16 | Brand: DiceAuto + JobsAPI Pro Gradient]
│
├── 1. Dashboard                 -> /                (Aggregated telemetry & quick actions)
├── 2. All Jobs                  -> /jobs            (Unified 13+ ATS & Dice job feed)
├── 3. Automation Center         -> /automation      (Queue manager, Review queue, Search profiles)
├── 4. My Applications           -> /applications    (Unified history, statuses & retry actions)
├── 5. Saved Jobs                -> /saved           (Bookmarked roles & evaluation list)
├── 6. Profile & Resumes         -> /profile         (Candidate knowledge graph & Resume library)
└── 7. Integrations & Settings   -> /settings        (Dice session status, ATS sync health & controls)
```

---

## 4. Design System Unification (Dice UI Theme)

To satisfy the explicit directive: **"Dice UI is the main theme and UI"**, `frontend/`'s design tokens and layouts are aligned to the Dice UI design system:

* **Sidebar:** Obsidian Deep Navy (`#090d16` / `#0b0f19`), subtle border (`rgba(255, 255, 255, 0.07)`).
* **Brand Accent:** Gradient `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)` (Indigo-Violet).
* **Active Indicator:** Left accent border `3.5px solid #6366f1` with soft glow background `rgba(99, 102, 241, 0.18)`.
* **Canvas Background:** Crisp Slate-50 (`#f8fafc`).
* **Card Surface:** Pure White (`#ffffff`) with subtle border (`#e2e8f0`) and soft shadow (`0 1px 3px rgba(0, 0, 0, 0.05)`).
* **Typography:** `Plus Jakarta Sans` / `Inter` (`#0f172a` primary, `#64748b` secondary, `#94a3b8` muted).
* **Real-time Live Indicators:**
  * MongoDB Online: Green dot with `.radar-dot-active` pulse.
  * Dice Session: Online/Offline chip with direct link to login supervisor.
  * JobsAPI Sync Status: Live health badge.

---

## 5. API Client Layer Architecture (`frontend/src/services/`)

* **`api.js` (JobsAPI Client):**
  * Base URL: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'`
  * Manages `/jobs`, `/sources`, `/stats`, `/candidate/*`, `/analytics/*`.
* **`diceApi.js` (Dice Automation Client):**
  * Base URL: `import.meta.env.VITE_DICE_API_BASE_URL || 'http://localhost:8000'`
  * Manages `/settings/dice-status`, `/resumes`, `/search-profiles`, `/applications/queue`, `/review-queue`, `/dashboard/stats`.
* **Unified Error Normalizer:**
  * Transforms error payloads from both Express and FastAPI into standard `{ message, code, status }` objects.
