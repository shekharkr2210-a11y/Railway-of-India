# 🚆 AI-Powered Automatic Block Planning — Hackathon Requirement Review & Implementation Plan

**Problem Statement:** SIH / Ministry of Railways — ID **26027**
*"AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways"*

**Reviewer role:** Hackathon judge / technical evaluator
**Review date:** 2026-08-30
**Reviewed artifact:** Next.js 16 App-Router application in `c:\Users\shekh\problem` (commit `bc2b610`)

---

## 1. Executive Summary

### 1.1 Verdict

This is a **strong, polished demo prototype with genuine algorithmic substance**, but it is **not yet a complete answer to Problem Statement 26027**. The app implements the *shape* of all four required capabilities (data ingestion, AI-style prioritization, optimization, multi-horizon plans), backed by real engineering — SQLite persistence, signed-cookie auth, HMAC sanction signatures, headway solving, and shadow-block clustering. However, **three credibility gaps would cost marks with a technical jury**:

1. **Fabricated/fudged metrics** — the dashboard shows KPIs (18,450 defects, "Block Optimizer: 94.2%", WAF/SOC telemetry) that are hard-coded or multiplied, **not derived from computed data**. A technical judge will probe this.
2. **The four expected solutions are only ~50% implemented** — data integration is simulated (no connectors, no goods-train forecast model), the "AI/ML" is a deterministic weighted scorecard (no trained model, no validation), and **WEEKLY/MONTHLY plans are the single-day solver repeated with date offsets** — not genuine multi-week/month optimisation.
3. **A hard safety constraint can be violated** — when no timetable gap fits, the optimizer schedules a block anyway in a fallback slot, even if it overlaps a passenger express (contradicting the README's "must NEVER be delayed").

None of these are fatal — all are fixable, and several are already partially anticipated by the in-repo plan (`implementation_plan.md`). Section 6 gives a phased plan.

### 1.2 Scorecard (1–5)

| Criterion | Score | Notes |
|---|---|---|
| Requirement 1 — Data integration (TMS/SMMS/TDMS + TTT + goods forecast) | 2.5 / 5 | Persistence + models exist; integration is simulated; no COA freight forecast model |
| Requirement 2 — AI/ML prioritisation by criticality/urgency/impact | 3.0 / 5 | Explainable, domain-sound TCI & Weibull scoring; *not* a trained/validated model; confidence scores fabricated |
| Requirement 3 — Optimisation for asset uptime / downtime / coordination | 3.5 / 5 | Real headway solver + shadow-block clustering + machine rostering; but hard-constraint fallback bug and metric fudging |
| Requirement 4 — Weekly & monthly block plans | 2.5 / 5 | UI toggles + calendar exist; underlying solver is single-day, dates assigned by index, no day-aware validation |
| Engineering quality & credibility | 3.5 / 5 | SQLite, auth, crypto, validation, security headers are genuinely good; zero tests / CI / Docker; fake telemetry hurts integrity |
| Presentation & domain authenticity | 4.5 / 5 | 18 real zones, real corridors (NDLS–FZB, MTJ–AGC), real train names, strong README + PDF deck |
| **Overall** | **3.2 / 5** | **Strong demo; needs integrity + depth fixes to fully satisfy the problem statement** |

### 1.3 Files reviewed

- `app/lib/*` — `types.ts`, `mockData.ts`, `optimizer.ts`, `mlEngine.ts`, `timetableEngine.ts`, `preventiveMaintenanceEngine.ts`, `db.ts`, `seed.ts`, `bootstrap.ts`, `taskStore.ts`, `repositories.ts`, `security.ts`, `session.ts`, `auth.ts`, `validation.ts`, `apiClient.ts`, `clientSecurity.ts`
- `app/api/**/route.ts` — `optimize`, `tasks`, `import`, `reports/pending-works`, `zones`, `bdms/sanction`, `bdms/verify`, `auth/login|logout|me`, `security/audit-logs`, `health`
- `app/page.tsx` + 15 UI components (`app/components/*`)
- `proxy.ts`, `next.config.ts`, `.env.example`, `package.json`, `README.md`, SQLite DB `data/blockplanner.db` (live counts inspected)

---

## 2. Requirement Coverage Matrix (vs. Problem Statement 26027)

| # | Required capability (from PS) | Status | What exists | What is missing / weak |
|---|---|---|---|---|
| 1a | **Integrate maintenance data — defects & overdue tasks from TMS, SMMS, TDMS** | ⚠️ Partial | `tasks` table + `INITIAL_MAINTENANCE_TASKS` (16 seeded) carrying `sourceSystem`, `severity`, `overdueDays`; CSV/JSON upload in the UI; `/api/import` batch loader; `DataIngestionPanel` "Trigger Multi-System Sync" simulator | No real source adapters/connectors; sync is **simulated with sample defects**, not data-shaped by the source systems; no schema mapping layer for TMS/SMMS/TDMS payloads; `Book1.xlsx` not used |
| 1b | **Corridor block & block availability per Train Time Table** | ⚠️ Partial | `sections` (12) + `train_movements` (11) tables; `timetableEngine.ts` sweeps headway gaps; `checkBlockTrainConflict` vs passenger/freight | Gap windows are **single-day (0–1440 min)**; overnight/24h-rolling blocks unsupported; no per-track (of the N-tracks) availability model; only 11 trains (real sections run 140–220/day) |
| 1c | **Goods-trains forecast from Control Office (COA)** | ❌ Missing | COA described only in the UI feed list ("Passenger Timetable, Goods Train Forecast …") | **No forecast logic at all.** `DemandPrediction` in `mlEngine.ts` predicts defect counts, not freight train demand/paths. No time-series/regression of freight volumes feeding the optimizer |
| 2 | **AI/ML prioritisation & scheduling by criticality, urgency, impact on asset availability** | ⚠️ Partial | TCI = weighted severity + overdue-decay + TSR penalty + traffic-density multiplier + power-block; Weibull reliability (`computeWeibullReliability`); explainable breakdown `explainTaskCriticality`; What-If rescoring | Deterministic, hand-tuned scorecard — **no trained model, no train/eval split, no validation accuracy, no calibration, no retraining loop**; `confidenceScore` (0.91–0.96) is fabricated; "94.2% accuracy"-style claims refer to a model that doesn't exist |
| 3 | **Optimise schedule → max asset uptime, min downtime, coordinate multi-department** | ⚠️ Partial | Shadow-block clustering (≤8 km co-location, multi-dept bundling), best-fit headway-gap slotting, machine double-book guard, `downtimeHoursSaved`, cross-zonal conflict counter | **Hard-constraint fallback bug** (`optimizer.ts` L141–152) schedules over passenger trains when no gap fits; metrics inflated by `scopeMultiplier` and fabricated baselines; machine booking ignores dates (single-day key); greedy heuristic — no objective function / alternative search |
| 4 | **Block plans over multiple horizons — weekly & monthly** | ⚠️ Partial | Header DAILY/WEEKLY/MONTHLY toggle; `CalendarView` (7-day & month grids); `scheduledDate` assignment | WEEKLY/MONTHLY = same single-day solver; dates spread by cluster *index* (`dayOffset = idx/…`), **not by per-date feasibility**; `weekNumber`/`monthName` defined but never set; no plan-export (PDF/CSV) for a shareable "block plan document" |
| + | Ops: BDMS workflow & security | ✅ Good | BDMS sanction portal w/ server-side HMAC-SHA256 + verify endpoint + persisted audit; signed-cookie sessions; bcrypt; zod; rate-limiter proxy; security headers; `/api/health` | Demo fallbacks undermine it (see §4); fabricated SOC/WAF telemetry in `CyberSecurityPanel` |

**Ground truth (queried `data/blockplanner.db`):** tasks = **16**, sections = 12, train movements = 11, zones = 18, users = 4, blocks = 0, sanctions = 0, audit_logs = 1. The app currently stores **far less data than the UI implies** (initial UI metrics claim 18,450 defects / 68 divisions / 142 conflicts) — a judge can verify this in minutes.

---

## 3. Strengths — What Works Well (keep)

1. **Real persistence layer.** SQLite via `better-sqlite3` (WAL, idempotent migrations, lazy bootstrap) — `db.ts`, `seed.ts`, `taskStore.ts`, `repositories.ts`. Restart-safe.
2. **Genuine algorithm core.**
   - Headway sweep solver with safety clearance and freight-vs-passenger discrimination (`timetableEngine.ts`).
   - TCI scoring with exponential overdue decay & explainability (`mlEngine.ts`).
   - Shadow-block co-location clustering and downtime math (`optimizer.ts`).
   - Weibull reliability → preventive-maintenance cycles (`preventiveMaintenanceEngine.ts`).
3. **Server-side trust primitives.** Deterministic canonicalization + HMAC signing/verification, `timingSafeEqual`, persisted sanctions (`security.ts`, `bdms/sanction`, `bdms/verify`).
4. **Real auth & authorization scaffolding.** bcrypt-hashed users, signed HttpOnly session cookies, role checks on mutation APIs, scope checks, audit logging (`auth.ts`, `session.ts`).
5. **API hygiene.** zod validation, size-capped imports, typed errors, rate limiting/session enrichment in `proxy.ts`, security headers, `/api/health`.
---

## 4. Points to Improve (prioritised)

### 4.1 Critical — credibility & integrity (fix before demo)

| # | Issue | Evidence (file:line) | Impact |
|---|---|---|---|
| C1 | **Fabricated dashboard KPIs.** Initial global metrics claim 18,450 defects, 3,120 critical, 98.4% availability, 142 conflicts for an app whose DB holds **16 tasks / 0 conflicts**. | `app/page.tsx:53-65`; `app/lib/security.ts:30-38` (fake SOC/WAF status); `app/components/CyberSecurityPanel.tsx` | Judge sees false scale → **trust damage**. Replace with computed-or-null + explicit "demo projection" labels, or compute real aggregates |
| C2 | **Metric fudging in the optimizer.** `scopeMultiplier` (×18/×4/×1) inflates results; `trainDelaysPrevented` uses an invented formula `cluster.length*35 + (trainImpact>0?0:45)`; asset-availability clamps to a 92.0–99.8 band; `crossZonalConflictsResolved` counts section-name matches, not conflicts. | `app/lib/optimizer.ts:255,263-287` | Metrics are not auditable or scientific |
| C3 | **Hard passenger constraint violated.** When no headway gap fits, fallback schedules a 01:00/11:30 slot anyway, even if `checkBlockTrainConflict` returns `isHardPassengerViolation` — the block is emitted with a `trainImpact` number rather than rejected. | `app/lib/optimizer.ts:141-152` | Contradicts README ("must NEVER be delayed"); safety example a judge can reproduce |
| C4 | **Auth is bypassable in demo paths.** (a) `bdms/sanction` falls back to a `demo-user` session when no cookie exists, so an unauthenticated client can sanction blocks; (b) `LoginPage.performLogin` has an offline **fallback that logs in as any chosen role**; (c) `Header` still exposes a role-switch modal. | `app/api/bdms/sanction/route.ts:26-33`; `app/components/LoginPage.tsx:64-85`; `app/components/Header.tsx` | RBAC is cosmetic; a 401/403 matrix cannot be honestly shown |
| C5 | **Optimizer trusts client-supplied tasks.** `/api/optimize` uses `body.tasks` verbatim instead of loading from the DB. | `app/api/optimize/route.ts:24-26` | Data integrity: client can inject arbitrary/invalid data; defeats the "integrated store" story |
| C6 | **Stale report data.** `/api/reports/pending-works` filters `INITIAL_MAINTENANCE_TASKS` (mock constant), so tasks added/imported via the app **never appear** in the Pending Works report. | `app/api/reports/pending-works/route.ts:12` | Real consistency bug, easy to demo |

### 4.2 Major — requirement depth (see §6)

| # | Issue | Evidence | Impact |
|---|---|---|---|
| M1 | **No real data integration** — feeds are hard-coded status cards + a `setTimeout` simulator; no TMS/SMMS/TDMS/COA adapters, no file→schema mapping for `Book1.xlsx`. | `app/components/DataIngestionPanel.tsx` | Requirement 1 not credibly demonstrated |
| M2 | **No goods-train forecast model.** `DemandPrediction` only predicts defect counts; nothing models COA freight forecasts; schedules assume a static 11-train timetable. | `app/lib/mlEngine.ts:172-214` | Requirement 1c missing |
| M3 | **"AI/ML" = deterministic scoring.** No model, no train/test split, no measured accuracy, no calibration; `confidenceScore` is hard-coded (0.91+0.05). | `app/lib/mlEngine.ts:211` | Requirement 2 not convincingly "AI" & accuracy claims unverifiable |
| M4 | **Weekly/Monthly plans are cosmetic.** Dates derived from cluster index, not per-date capacity; overnight (past-midnight) blocks unsupported; `weekNumber`/`monthName` unused; machine bookings keyed by time only. | `app/lib/optimizer.ts:61-64,235-248` | Requirement 4 shallow |
| M5 | **No plan export / document.** A "block plan" for a division is a deliverable document; app has no PDF/CSV/XLSX export of the weekly/monthly plan. | — | Requirement 4 "provides block plans" weak |
| M6 | **Single-day timetable model.** 0–1440 min only; multi-day plans not validated date-by-date; no rolling 24h headway. | `app/lib/timetableEngine.ts` | Underlying cause of M4 |
| M7 | **Data volume is tiny** (16 tasks, 11 trains, 12 sections, 1 audit row). Cannot show scalability or "enterprise" behavior. | live DB counts | Demo may look empty |

### 4.3 Minor / hygiene

| # | Issue | Evidence |
|---|---|---|
| m1 | No automated tests (unit/integration/e2e), no `test` script; vitest/testing-library/jsdom are installed but unused. | `package.json`; no `tests/` dir |
| m2 | No CI, no Dockerfile/compose, no deployment docs; `.env.example` only documents `HMAC_SECRET_KEY` (missing `SESSION_SECRET`, `DB_PATH`, `SEED_ADMIN_PASSWORD`, `RATE_LIMIT_MAX`, `NEXT_PUBLIC_APP_URL`). | `.env.example`, repo root |
| m3 | `pino` dependency unused — no structured logging; audit logs are the only observability. | `package.json`, `app/lib` |
| m4 | Client-side "HMAC-SHA256" preview (`clientSecurity.ts`) is an FNV-style hash, **not** the server HMAC — the UI can show a fake signature; fallback audit entries fabricate IPs ("10.142.12.89 (mTLS Encrypted Link)"). | `app/lib/clientSecurity.ts:13-30`; `app/page.tsx:198-207` |
| m5 | README overstates: "Live WebSocket", "Zero-Trust", "mTLS", "Backend Route Handlers Online" while data is demo-only. | `README.md`, `app/page.tsx:403` |
| m6 | Stale-request races (`runOptimization`/`useEffect` can apply an older response after a newer one); sparse loading/error/empty states; a11y gaps in modals. | `app/page.tsx:72-133` |
| m7 | Non-deterministic artifacts: `Math.random()`/`Date.now()` in IDs, `weekNumber`/`monthName` unused, `BLK` id blockCounter resets per run. | `app/lib/types.ts:182-183`, `optimizer.ts`, `repositories.ts:62` |
| m8 | Lint warnings (unused imports) still present in components. | `lint-output.txt` |

---

## 5. Missing Features → Requirement Map (what a judge will look for)

| PS requirement | Missing / weak feature | Priority |
|---|---|---|
| 1 — Integration | Real (or convincingly simulated) source adapters for TMS/SMMS/TDMS/COA/BDMS; schema mapping; sync engine with per-source watermark/last-sync metadata; XLSX import | P0 |
| 1 — Integration | **Goods-train forecast** module (COA): predict freight rake movements per corridor/day from historical volumes, feed as soft constraints into the optimizer | P0 |
| 2 — AI/ML | Trained, validated prioritization model (even a small gradient-boosted/logistic model with a real train/val split and measured metrics + feature importance); calibrated confidence; retraining script | P0 |
| 3 — Optimisation | Per-date planning across N days; overnight blocks; date-aware machine capacity; passenger hard-constraint as an invariant (never schedule over); exact objective: max task coverage + max downtime saved + min train delay | P0 |
| 3 — Optimisation | "Unscheduled tasks" list when capacity runs out; add a simple local-search / swap improvement loop to the greedy | P1 |
| 4 — Multi-horizon | Genuine WEEKLY (7-day) and MONTHLY (30-day) schedule builders; week/month numbering; plan export (PDF/CSV) | P0 |
| — | Honest metrics dashboard (computed, no multipliers); demo-data labeling | P1 |
| — | Tests + CI + Docker + env docs | P1 |

---

## 6. Implementation Plan for the Missing Features

**Guiding rules:**
- Each phase ships working, verifiable output; never regress the other phases.
- All metrics become **computed**; any demo/projection number is explicitly labeled "simulated".
- Keep the existing architecture (SQLite, Next route handlers, opts/repos split) — no rewrite.

### Phase 0 — Honesty & integrity sweep (0.5–1 day)

| Task | Files | Acceptance |
|---|---|---|
| Replace hard-coded initial metrics with `null` + computed-on-mount (or honest "demo projection" labels); delete `scopeMultiplier`, delay fudge, availability clamp | `app/page.tsx`, `app/lib/optimizer.ts` | Dashboard numbers always equal DB-derived sums; grep clean of 18,450 |
| Replace `INITIAL_SECURITY_STATUS`/`INITIAL_AUDIT_LOGS` with DB-only reads; remove fake SOC/WAF claims or label "simulated UI" | `app/lib/security.ts`, `app/api/security/audit-logs/route.ts`, `CyberSecurityPanel.tsx` | No fabricated telemetry visible |
| Remove demo auth bypasses (sanction demo-user fallback, login offline fallback, Header role-switch); enforce 401/403 | `app/api/bdms/sanction/route.ts`, `LoginPage.tsx`, `Header.tsx` | `curl /api/tasks` → 401; sanction without cookie → 401 |
| README accuracy pass ("demo", not "live/zero-trust/mTLS") | `README.md`, footer | No overclaims in text/UI |

### Phase 1 — Source-integration layer (Requirement 1a/1b) — 3–5 days

Build a connector abstraction with pluggable "source adapters" so the demo is *architecturally* real:

| Task | Files | Acceptance |
|---|---|---|
| New `source_adapter` interface + registry keyed by `TMS/SMMS/TDMS/COA/BDMS`; each adapter exposes `fetchUpdates(sinceWatermark)` returning strongly-typed `DefectRecord[]` / `CorridorAvailability[]` / `TrainMovement[]` | `app/lib/sources/` (new) | Importable from route handlers; pure TS |
| `SyncEngine` — runs adapters in order, maps to canonical `task` schema via per-source mapper functions, upserts in a transaction, records `source_syncs` (source, watermark, inserted, failed) | `app/lib/syncEngine.ts`, new DB table `source_syncs` migration | Idempotent re-run produces 0 duplicate ids; sync metadata persisted |
| Bundle 3 "simulated-but-honest" adapters that generate realistic defect payloads from seed templates + a small deterministic RNG (labeled SIMULATED in DB/source_syncs) | `app/lib/sources/simTms.ts|simTdms|simSmms`, `app/lib/sources/simCoa.ts` | Sync count grows DB; rows carry `ingest_source` |
| `POST /api/sync/:source` route (auth-protected) + UI wiring so "Trigger Multi-System Sync" calls the real endpoint; `xlsx` export/import for `Book1.xlsx` via `xlsx` package | `app/api/sync/[source]/route.ts`, `DataIngestionPanel.tsx` | REST call persists rows; uploading shipped template adds visible tasks |
| Use `taskStore` in `/api/optimize` (server loads tasks from DB by scope) — stop trusting client payload | `app/api/optimize/route.ts` | Optimize ignores `body.tasks`; uses DB rows |

### Phase 2 — COA goods-train forecast (Requirement 1c) — 2–3 days

| Task | Files | Acceptance |
|---|---|---|
| New freight-forecast engine: given freight movement history (extend `train_movements` with per-day counts or add `freight_history`), fit a simple time-series (moving-average + day-of-week seasonal index) per corridor | `app/lib/forecastEngine.ts` (new) | Outputs `{ date, sectionId, predictedRakes, confidence }` for horizon |
| Integrate forecast into `generateOptimizedBlocks` as *soft constraints*: forecasted freight windows raise `freightImpactScore` on adjacent gaps; hard passenger still absolute | `app/lib/optimizer.ts`, `app/lib/timetableEngine.ts` | Forecast-aware schedule differs & is explainable; UI shows COA forecast strip |
| UI: "Goods Train Forecast (COA)" widget on GANTT/OVERVIEW showing predicted rakes by day | `app/components/GoodsTrainForecastPanel.tsx` (new), `page.tsx` | Demo story: schedule reacts to freight surge |

### Phase 3 — Real ML prioritization model (Requirement 2) — 3–4 days

| Task | Files | Acceptance |
|---|---|---|
| Build a labelled dataset (synthetic-but-principled): generate task records where `criticality` target is derived from safety rules + noise; split train/val/test (60/20/20) with fixed seed | `ml/train.py` (new, scripts/) or `app/lib/ml/dataset.ts` | Deterministic, reproducible |
| Train a small model (gradient-boosted trees via `xlsx`-free Python `scikit-learn`/`xgboost`, OR pure-TS logistic regression w/ gradient descent) over the existing TCI features | `ml/train.py` → exports `model.json` (weights / tree stumps) | Model artifact committed; evaluation printed |
| Load `model.json` in a new runtime `app/lib/ml/predict.ts`; `calculateMLCriticality` = `baseline TCI` blended with model score; `confidenceScore` = real calibration (e.g., isotonic bin fraction) | `app/lib/mlEngine.ts` (refactor), `app/lib/ml/predict.ts` | Predictions match Python reference within ±ε; confidence is measured on val set |
| Dashboard "Model Performance" panel shows **real hold-out metrics** (accuracy, AUC, F1, feature importance) pulled from the evaluation run — no hard-coding | `app/components/ModelPerformancePanel.tsx` (new) | Metrics change only when re-trained; clearly sourced |
| Retraining script + README section ("how to retrain") | scripts/ + README | Reproducible end-to-end |

### Phase 4 — True multi-day / weekly / monthly solver (Requirements 3 & 4) — 3–5 days

| Task | Files | Acceptance |
|---|---|---|
| Rewrite slotting to a **date sequence**: for each day in `[start .. start+horizonDays)`, generate per-day headway gaps via `findAvailableHeadwayWindows` and schedule clusters Earliest-Deadline-First by criticality | `app/lib/optimizer.ts` (refactor), `timetableEngine.ts` (add `findWindowsForDate`) | Each block carries a real `scheduledDate`; property test: no block overlaps a passenger train on its date |
| Hard-constraint invariant: if no clash-free window exists on any day, the cluster goes to `unscheduledTasks` (never force-schedule) | `optimizer.ts` | `unscheduledTasks.length` returned; UI badge |
| **Overnight/rolling windows**: allow blocks spanning 22:00 → 02:00 with 24h-rolling timeline (minutes relative to window start); model "day rollover" | `timetableEngine.ts` | Overnight block correctly placed and checked against next-day trains |
| **Date-aware machine rostering**: booking key = `(scheduledDate, machineCode)`; capacity limit per day; add to `BLK` plan output | `optimizer.ts` | Same machine never double-booked same day/unavailable day |
| Weekly/Monthly plan documents: `GET /api/plans/:horizon` returning blocks grouped with `weekNumber`/`monthName`; CSV export endpoint + "Download Plan" buttons | `app/lib/planBuilder.ts` (new), `app/api/plans/route.ts`, `CalendarView.tsx` | Judge can download a 7-day / 30-day plan |
| Optional improvement loop: after greedy pass, run K random 2-opt swaps (fixed seed) accepting strictly-improving downtime | `optimizer.ts` | Output is at least as good as greedy; still constrained-safe |

### Phase 5 — Exact, auditable metrics (Requirement 3, cross-cut) — 1–2 days

| Task | Files | Acceptance |
|---|---|---|
| Define metric formulas in one module: `downtimeSaved = Σ individual - Σ scheduled_actual`; `assetAvailability = 100 · (1 - scheduled_block_hours / (section·track·hours OR demand-based denominator))`; `trainDelayMin = Σ real overlap minutes (0 if none)`; remove all multipliers/clamps | `app/lib/metrics.ts` (new), `optimizer.ts` | Each metric has a unit, formula, and trace to DB data; no magic constants |
| Recompute `totalDefects`, `availability`, `conflicts` from real filter results only; empty state when no data | `page.tsx`, components | UI numbers = API numbers always |
| Keep explainability: `explainTaskCriticality` remains for TCI; add `explainBlock` showing which trains, gap, machines, and savings compose each block | `mlEngine.ts`, `optimizer.ts` | Judge can drill into any block |

### Phase 6 — Quality bar (tests / CI / Docker / logging / env) — 3–4 days

| Task | Files | Acceptance |
|---|---|---|
| Unit tests: `timetableEngine` (gap math, night windows), `optimizer` (no passenger overlap property, date range, machine booking), `mlEngine` (scores in [0,100], determinism), `forecastEngine`, session/security crypto round-trip | `tests/unit/*.test.ts` | `npm test` green |
| Integration tests: all API routes (auth 401/403 matrix, import cap, sync, plans, sanction sign→verify→tamper) against a temp SQLite DB | `tests/integration/*.test.ts` | Coverage of route matrix |
| Add `test`, `test:watch`, `test:ci`, `db:backup` scripts; vitest config | `package.json`, `vitest.config.ts` | CI runs them |
| GitHub Actions workflow: lint + typecheck + unit + integration on push/PR | `.github/workflows/ci.yml` | Green in CI |
| Docker: multi-stage `Dockerfile` (Node 22 LTS) + `docker-compose.yml` with volume `./data`, healthcheck `/api/health`; `next.config.ts` `output:'standalone'` + `serverExternalPackages: ['pino','better-sqlite3']` | `Dockerfile`, `docker-compose.yml`, `next.config.ts` | `docker compose up` → healthy & seeded |
| Structured logging with `pino` (request id, user, action, latency); `/api/health` stays | `app/lib/logger.ts` (new), route handlers | Health + logs usable in demo |
| Document env vars in `.env.example` + README (HMAC/SESSION secrets, DB_PATH, SEED_ADMIN_PASSWORD, RATE_LIMIT_MAX, NEXT_PUBLIC_APP_URL); secrets rotated & git-ignored | `.env.example`, README, `.gitignore` | Fresh clone runs with `.env.example` |

### Phase 7 — Final acceptance & judge demo script — 1 day

| Task | Files | Acceptance |
|---|---|---|
| Walk the 6 Critical issues from §4.1 and prove each fixed (grep + live query) | — | Screenshot-able evidence |
| **Demo script (10 min):** ① Login (real 401/403 demo optional) → ② Trigger sync → DB row count visibly grows → ③ Open Pending Works → new tasks present → ④ Run optimizer DAILY → Gantt shows clash-free blocks + downtime math → ⑤ WEEKLY plan: 7-day calendar with per-date feasibility + CSV export → ⑥ MONTHLY with `weekNumber` grouping → ⑦ Drill into a block: trains avoided, machines, signature → ⑧ Sanction (real HMAC) → verify → tamper payload → verify fails → ⑨ Model performance panel with hold-out metrics → ⑩ What-If freight surge → forecast widget reacts | — | Every step verifiable by judge hands-on |
| Update README limitation section honestly | `README.md` | "decision-support prototype; connectors simulated; model retrained offline" |

---

## 7. Effort Summary & Sequencing

| Phase | Focus | Est. effort | Parallelisable |
|---|---|---|---|
| 0 | Integrity sweep (metrics, auth, marketing) | 0.5–1 d | — |
| 1 | Source-integration layer + sync | 3–5 d | ║ 2, ║ 3 |
| 2 | COA goods-train forecast | 2–3 d | ║ 1 |
| 3 | Real ML model + metrics panel | 3–4 d | ║ 1 |
| 4 | Multi-day solver + plans export | 3–5 d | needs 0 |
| 5 | Exact metrics module | 1–2 d | ║ 6 |
| 6 | Tests/CI/Docker/logging/env | 3–4 d | ║ 5 |
| 7 | Acceptance + demo script | 1 d | — |
| **Total (1 engineer, sequential)** | | **~3 weeks** | |
| **2 engineers (1 ∥ 2 ∥ 3 → 4 → 5/6 → 7)** | | **~10–12 days** | |

## 8. Top Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Over-promising "AI" again | High | Ship a real (even small) model with measured metrics (Phase 3); label simulation clearly |
| Hard-constraint regressions | Med | Property test (no passenger overlap) runs in CI from Phase 4 onward |
| Multi-day planner scope creep | Med | Keep greedy+swap; explicit `unscheduledTasks`; avoid full MILP |
| Native module build in Docker (better-sqlite3) | Med | Pin Node 22 LTS, prebuilt binaries; fallback Docker image with build tools |
| Judge probes stale-report bug | Med | Fixed in Phase 1 (taskStore-backed reports) — demos always end-to-end consistent |

---

*Prepared as a fresh, requirement-anchored review. Complements the in-repo `professional_use_review.md` / `implementation_plan.md` (which focus on production-readiness); this document is scoped specifically to Problem Statement 26027's four expected solutions.*