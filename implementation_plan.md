# 🛠️ Implementation Plan — Making the AI Block Planner Production-Ready
## Indian Railways / Smart India Hackathon — Problem Statement 26027

**Plan date:** 2026-08-28
**Basis:** Findings in `professional_use_review.md` (6 P0 blockers, P1/P2 issues).
**Framework:** Next.js **16.3.2** (App Router, Route Handlers) · React 19.2.8 · TypeScript 5 · Tailwind CSS 4.
**Important framework fact verified for this version:** In Next 16, `middleware.ts` is **deprecated and renamed to `proxy.ts`** (export `function proxy()`), which defaults to the Node.js runtime. All security/route-interception work below uses `proxy.ts`, **not** `middleware.ts`.

---

## 1. Objective & Definition of Done

**Goal:** Convert the current in-memory, mock-data demo into a system that is honest, persistent, secured, correct, and deployable — while preserving the genuinely useful algorithm work (TCI engine, headway solver, shadow-block clustering).

### Definition of Done (DoD)

| # | Requirement | Verifies phase |
|---|---|---|
| DoD-1 | **No fabricated data anywhere.** Every KPI, audit entry, feed status, and security value traces to computed/persisted data. "Demo/simulated" data is visibly labeled. | Phase 1 |
| DoD-2 | **Persistent.** Restarting the app/server does not lose tasks, sanctions, or audit logs. Reports and UI read the same store. | Phase 2 |
| DoD-3 | **Authenticated & authorized.** Logging in creates a real server-verified session; every API route and page enforces the user's role. | Phase 3 |
| DoD-4 | **Trustworthy signature flow.** Sanctions are signed server-side with the env secret, persisted, and verifiable; tampered payloads are rejected. No cryptography in the browser bundle. | Phase 4 |
| DoD-5 | **Correct scheduler.** No generated maintenance block overlaps a passenger express; metrics are exact (no multipliers/fallback fudging); weekly/monthly plans respect calendar dates. | Phase 5 |
| DoD-6 | **Robust UX.** Loading/error/empty states everywhere; no stale-result races; accessible modals and approval workflow. | Phase 6 |
| DoD-7 | **Tested.** Unit tests for all `lib/` engines, integration tests for all `app/api/**` routes, e2e for the key user journey. Green in CI. | Phase 7 |
| DoD-8 | **Deployable.** Docker image + compose + `.env.example` + README; `docker compose up` yields a running, seeded app. | Phase 8 |
| DoD-9 | **Operable.** Structured logging, `/api/health`, DB backup path, no secrets in source. | Phase 9 |

---

## 2. Review Issue → Plan Phase Mapping

| Review finding | Plan phase | Primary files |
|---|---|---|
| Fabricated KPIs / multipliers / fake SOC telemetry | 1 | `app/page.tsx`, `app/lib/optimizer.ts`, `app/lib/security.ts`, `app/components/DataIngestionPanel.tsx`, `CyberSecurityPanel.tsx` |
| No persistence, in-memory store | 2 | `app/lib/taskStore.ts`, `app/lib/db.ts` (new), all `app/api/**/route.ts` |
| Reports endpoint reads stale mock data | 2 | `app/api/reports/pending-works/route.ts` |
| Cosmetic login, no RBAC, open APIs | 3 | `app/lib/auth.ts` + `validation.ts` (new), `proxy.ts` (new), all routes, `LoginPage.tsx`, `Header.tsx` |
| Crypto broken (browser fallback, hardcoded secret) | 4 | `app/lib/security.ts`, `app/api/bdms/sanction`, `app/api/bdms/verify`, `BDMSWorkflow.tsx`, `BlockCircularModal.tsx` |
| Scheduler violates hard constraint; single-day model; machine booking no dates | 5 | `app/lib/optimizer.ts`, `app/lib/timetableEngine.ts` |
| Client imports Node crypto | 4/6 | `app/page.tsx`, `app/lib/apiClient.ts`, `app/components/*` |
| Race conditions, silent fallback, no loading/error/empty states, a11y | 6 | `app/page.tsx`, all components, new `error.tsx`/`loading.tsx` |
| Zero tests / CI / Docker / env config | 7, 8 | `tests/**`, `.github/workflows/ci.yml`, `Dockerfile`, `.env.example` |
| No logging / health / ops | 9 | `app/lib/logger.ts` (new), `app/api/health/route.ts` (new) |

---

## 3. Recommended Stack Additions

| Concern | Package | Why | Notes |
|---|---|---|---|
| Persistence | `better-sqlite3` | Zero-config embedded DB, synchronous, perfect for single-instance self-host | Auto-externalized by Next 16. Swap for `pg`/Prisma if multi-instance serverless is required; the repository interface below keeps that swap small |
| Validation | `zod` | Schema-validate every request body/server input | Replaces the silent-coercion pattern |
| Auth sessions | Node `crypto` (built-in) + signed HttpOnly cookie | Lightweight, full control, no magic deps | See `app/lib/auth.ts` design |
| Password hashing | `bcryptjs` (pure-JS, no native build issues) | Hash user passwords at rest | Or `argon2` if native is acceptable |
| Logging | `pino` (+ `pino-pretty` in dev) | Structured request/audit logging | Auto-externalized by Next 16 |
| Tests | `vitest` + `@testing-library/react` + `jsdom`; `playwright` for e2e | Unit/integration + browser e2e | Add `test` script to `package.json` |

**Do not add:** `javascript-lp-solver`/`ortools` (not needed for correct greedy+constraint scheduling), auth libraries (custom cookie session is simpler and auditable here).

---

## 4. Phase Sequencing & Critical Path

```
Phase 0 (baseline)
   └─► Phase 1 (honesty) ────────┐
        Phase 2 (persistence) ────┼──► Phase 3 (auth/RBAC) ─► Phase 4 (crypto) ─► Phase 8 (deploy)
        Phase 5 (scheduler) ──────┘        ▲                           │
        Phase 6 (UX)     ◄─── APIs stable ┘                           └► Phase 9 (ops)
        Phase 7 (tests)   — continuous alongside 2–6
        Phase 10 (acceptance sweep)
```

**Rationale:** Honesty is cheap and protects integrity from day one. Persistence is the trunk — auth, crypto, and UI all depend on it. The scheduler (pure functions) can be fixed in parallel with persistence. Deploy/CI lands once the API contract is stable.
---

## 5. Phase 0 — Baseline, Tooling & Guardrails (0.5–1 day)

**Objective:** Establish a provably clean starting point and the guardrails every later phase relies on.

### Steps
1. **Clean baseline.** `npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm run build`. Fix any pre-existing lint/type/build failures **first** (do not start new work on a red baseline). Record timings for comparison.
2. **Environment configuration.**
   - New `c:\Users\shekh\problem\.env.example`:
     ```
     NODE_ENV=production
     DB_PATH=./data/blockplanner.db
     SESSION_SECRET=<random 64-hex>
     HMAC_SECRET_KEY=<random 64-hex>
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     RATE_LIMIT_MAX=120
     SEED_ADMIN_PASSWORD=<generate once, print on first seed, rotate after>
     ```
   - Add `.env`, `data/*.db`, `*.db-journal` to `.gitignore`.
3. **Test tooling.** Add devDeps `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`. Add `package.json` scripts:
   ```json
   "test": "vitest run",
   "test:watch": "vitest",
   "test:ci": "vitest run --coverage"
   ```
4. **Dependencies (installed per phase, decided now):** `better-sqlite3`, `zod`, `bcryptjs`, `pino`.
5. **`next.config.ts`:** add `serverExternalPackages: ['pino']` (better-sqlite3 is already auto-external; be explicit anyway for clarity). Keep existing security headers.

### Acceptance criteria
- `npm run lint`, `tsc --noEmit`, `npm run build`, and `npm test` (empty suite) all exit 0.
- `.env.example` committed; no `.env` files tracked in git.

---

## 6. Phase 1 — Data Integrity & Honesty (2–3 days)

**Objective:** Remove every fabricated number and unverifiable security claim. This is the cheapest phase and the most important for credibility.

### Steps (file-by-file)

#### 6.1 `app/lib/optimizer.ts` — kill the multipliers
- Remove the `scopeMultiplier = 18/4/1` projection block and the `crossZonalConflictsResolved * 12` inflation. Metrics must equal **exact sums over actually-scheduled blocks**.
- Replace the magic `trainDelaysPrevented = round(cluster.length * 35 + (trainImpact ? 0 : 45))` with the real accumulated `delayRiskMinutes` from `checkBlockTrainConflict` results. If a window has zero conflicting trains the prevented-minutes contribution is `0`, not 45.
- `assetAvailabilityPercentage`: compute from real `scheduledHours / (sections * 24 * horizonDays)`; do **not** clamp to `[92, 99.8]`. Remove the `Math.min/max` clamp; cap only at `99.9` for float hygiene, and let low values show honestly.
- `activeZonesCount`/`activeDivisionsCount` from the actual section/task set, not hard-coded `18/68`.

#### 6.2 `app/lib/security.ts` — stop faking security
- Delete `INITIAL_SECURITY_STATUS` and `INITIAL_AUDIT_LOGS` constants (their content moves to the DB `audit_logs` table and a *real* health/status endpoint in phases 2–9).
- Replace `sanitizeInput()` semantics: strip control chars is fine as a safety net, but **do not** call it "sanitization against XSS" in comments. Rename to `stripControlChars` or handle via zod in Phase 3.
- Keep `generateDigitalSignature()` but gate it: `throw` if `HMAC_SECRET_KEY` is missing in production (no hardcoded fallback secret). The browser fallback hash is removed in Phase 4.

#### 6.3 `app/page.tsx` — real initial state
- Delete the hard-coded `metrics` initializer (18,450 defects etc.). Initialize `metrics = null`, render `<Skeleton>` until the first `/api/optimize` call returns.
- Remove `INITIAL_SECURITY_STATUS`/`INITIAL_AUDIT_LOGS` imports; hold `auditLogs = []` until fetched from `/api/security/audit-logs`.
- Footer copy "API Status: 200 OK • Backend Route Handlers Online" → replace with real derived status or remove.
- Add a persistent "🟡 DEMO DATA — simulated feeds" badge that displays until a real data source flag is set (Phase 2 seeds mark it).

#### 6.4 `app/components/DataIngestionPanel.tsx` — honest feed display
- The `feeds` array's `status/lastSync/latency/protocol/records` are hard-coded strings (feeds: "Live WebSocket", "12ms", "REST/gRPC", "Just now"). Replace with:
  - `status`: from a new `/api/sources` endpoint (Phase 2) or `'SIMULATED'`.
  - `lastSync`: timestamp of the last actual import batch (from DB).
  - `records`: real `COUNT(*)` per source from DB.
  - `protocol`: remove (not real).
- Add a "SIMULATED FEED" badge on every card while data is seed data.

#### 6.5 `app/components/CyberSecurityPanel.tsx` — only real facts
- Remove static claims: "WAF ACTIVE", "148 Attacks", "TLS 1.3 + mTLS", "Zero Trust AUTH VERIFED", "Clean (0 Vuls)". Replace with:
  - Actual TLS version observed on the request (often not visible app-side; if not measurable, drop the card).
  - Rate limiter state only once Phase 3 implements one.
  - DB-seeded audit log viewer (Phase 2) with real entries generated by real actions.
- Rephrase panel subtitle from "hardened against DDoS/SQL/XSS" to "security status reporting" until features exist.

#### 6.6 Copy audit (regex sweep)
- Grep for `mTLS|WebSocket|WAF|148|Attacks Blocked|Zero Trust|Live|CRIS-SANCTIONED|Just now|REST / gRPC` across `app/` and remove/replace anything not backed by code. Update README to state clearly: *"This is a simulation prototype; all feed/security telemetry is simulated."*

### Acceptance criteria (DoD-1)
- Grep sweep above returns no hits except intentional "simulated" labels.
- Metrics on the dashboard after first optimization match exactly what the optimizer computed (spot-check by hand for one zone).
- No hard-coded counts/percentages/adresses/threat numbers remain in `page.tsx`, `optimizer.ts`, `security.ts`, or components.
---

## 7. Phase 2 — Persistence Layer (3–5 days)

**Objective:** All state that must survive restarts (tasks, block windows, sanctions, audit logs, users, reference data) lives in `better-sqlite3`. Every API route reads/writes the DB. UI and reports converge on one source of truth.

### 7.1 New `app/lib/db.ts` — connection & schema
- Init a `better-sqlite3` instance at `process.env.DB_PATH || './data/blockplanner.db'`, creating the `data/` directory. Use `pragma journal_mode = WAL;`.
- `runMigrations()` executed on startup/import, with a `schema_migrations` table; write **idempotent, order-safe** SQL.
- Core tables: `users`, `sections`, `train_movements`, `tasks`, `block_windows`, `sanctions`, `audit_logs`.
- `tasks(id, source_system, department, zone_code, division_code, title, section_id, section_name, start_km, end_km, estimated_duration_hours, severity, overdue_days, requires_power_block, speed_restriction_impact_kmvh, criticality_score, status, created_at, updated_at)`.
- `block_windows(id, zone_code, division_code, section_id, section_name, start_time, end_time, duration_hours, is_shadow_block, participating_departments (JSON), task_ids (JSON), power_block_required, bdms_status, downtime_saved_hours, horizon, cross_zonal_impact, assigned_machines (JSON), scheduled_date, created_by, created_at)`.
- `sanctions(id, block_id, signed_by, signed_role, signature, payload_hash, created_at)`.
- `audit_logs(id, timestamp, action, user_id, user_role, ip_address, status, details, signature_hash)`.
- `users(id, name, email UNIQUE, password_hash, role, zone_code, division_code, is_active, created_at)`.
- Indexes: `tasks(status)`, `tasks(zone_code)`, `block_windows(scheduled_date)`, `audit_logs(timestamp)`.

### 7.2 New `app/lib/seed.ts` — idempotent seeding
- Insert `INITIAL_CORRIDOR_SECTIONS`, `INITIAL_MAINTENANCE_TASKS`, `INITIAL_TRAIN_MOVEMENTS`, and reference zones/divisions from `mockData.ts` **only if tables are empty** (upsert by PK).
- Insert a default `admin` user (role `BOARD_HQ`) with a bcrypt hash of `SEED_ADMIN_PASSWORD`; print a one-time notice "default admin created".
- Set the demo-data flag that Phase 1's UI badge reads.

### 7.3 Repository layer — replace `taskStore`
- Keep `app/lib/taskStore.ts` as the **interface name** to minimize route changes, but back it with the DB: all methods (`getAll/getByFilter/getById/add/addBatch/update/delete/reset`) become prepared statements (parameterized — no injection). Drop the `globalThis` singleton; use the single DB module instance.
- New `app/lib/repositories.ts`: `blockWindowsRepo`, `sanctionsRepo`, `auditLogRepo`, `usersRepo`, `sourceRepo` (per-source counts + last-import timestamps).
### 7.4 Route migrations (all `app/api/**/route.ts`)
- `api/tasks/route.ts`: GET/POST/PATCH/DELETE against `taskStore` (now DB-backed). POST/PATCH validate with zod (Phase 3 schemas; minimal inline checks now) and set `updated_at`.
- `api/import/route.ts`: batch-insert in a **transaction**; cap batch size (≤ 5 000 rows); validate each row; **dedupe by id**.
- `api/reports/pending-works/route.ts`: **fix the stale-data bug** — read from `taskStore`/DB, not `INITIAL_MAINTENANCE_TASKS`. Aggregate via SQL (GROUP BY department/severity/zone/section) instead of in-memory filtering.
- `api/zones/route.ts`: read zones/divisions from DB (reference tables), fall back to seed constants only if empty.
- `api/optimize/route.ts`: **stop trusting the client-supplied `tasks` array** — load tasks from the DB filtered by scope/zone/division/horizon; keep horizon/scope params (validated). Response gains an `unscheduledTasks` array in Phase 5.
- `api/security/audit-logs/route.ts`: `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT n` — real entries only.
- `api/bdms/sanction/route.ts` + `api/bdms/verify/route.ts`: persist sanctions (details in Phase 4).
- New `api/sources/route.ts`: per-source real counts and last-import time for the ingestion panel.

### 7.5 API client & page
- `app/lib/apiClient.ts`: add typed `fetchSourceStatus()`; keep existing signatures stable so components change minimally.
- `app/page.tsx`: hydrate `tasks` from `/api/tasks` on mount instead of `mockData.ts`; keep `INITIAL_*` imports only for seed reference display.

### Tests (pair with 7.3–7.4)
- `tests/unit/db.test.ts`: `better-sqlite3(':memory:')` — migrations, seeding, CRUD roundtrips, idempotent re-seed, WAL flags.

### Acceptance criteria (DoD-2)
- Kill and restart `npm run dev` → created/imported tasks, sanctions, and audit logs survive.
- A task created via UI appears in the **Pending Works report** (regression test).
- `api/sources` returns real counts matching `SELECT COUNT(*)` per source.
- `api/reports/pending-works` uses the same store as `api/tasks` for all filters.
---

## 8. Phase 3 — Auth, RBAC & API Security (3–5 days)

**Objective:** Real server-verified sessions, per-role access control, and hardened request handling. Uses `proxy.ts` (Next 16 convention; `middleware.ts` is deprecated).

### 8.1 New `app/lib/auth.ts` — signed-cookie sessions
- On login: create a session token = `base64url(payload).signature-HMAC(SESSION_SECRET)`, where payload = `{ userId, role, zoneCode, divisionCode, exp }`. Set an `HttpOnly; Secure; SameSite=Lax; Path=/` cookie (name `bp_session`; `Secure` in production).
- Helpers: `createSessionToken(user)`, `verifySessionToken(cookie) → payload | null`, `getSession(request)` (parses cookies), `requireRole(request, allowedRoles[]) → { session, user } | NextResponse(401/403)`, and `logAudit(action, user, ip, details, status)` (writes `audit_logs`, persisted).
- `SESSION_SECRET` required from env; app refuses to start in production if missing.
- Session lifetime: 8 h; sliding renewal optional; logout = cookie deletion + audit entry.

### 8.2 New `app/lib/validation.ts` — zod schemas
- `loginSchema` (email + password), `createTaskSchema`, `importTasksSchema` (array ≤ 5 000, each item strict), `optimizeSchema` (horizon/scope/zone/division enums), `sanctionSchema` (blockId, payload object), `verifySchema` (blockId, payload, signature).
- All API routes switch from coercion to `schema.parse()`; on failure return `400 { error: firstIssue.message, issues }` (never 500).

### 8.3 New auth API routes
- `app/api/auth/login/route.ts` — validate zod → look up user by email → `bcryptjs.compare` → create session cookie → return `{ user: { id, name, role, zoneCode, divisionCode } }`. Rate-limit 5 attempts/min per email+IP.
- `app/api/auth/logout/route.ts` — clear cookie, audit log entry.
- `app/api/auth/me/route.ts` — returns current session user or 401.

### 8.4 Root `proxy.ts` (replaces `middleware.ts`)
```ts
// proxy.ts  (Next 16: export function proxy)
export function proxy(request: NextRequest) {
  // 1. Public paths: /api/auth/login, /api/auth/logout, /api/health → next()
  // 2. Rate limit (in-memory token bucket keyed by ip) → 429 past RATE_LIMIT_MAX
  // 3. For /api/* (other): verify bp_session cookie via auth.verifySessionToken
  //    → 401 if missing/invalid; else attach user info to request header for routes
  // 4. Page routes: redirect to /login if no session (except /login)
  return NextResponse.next();
}
```
- Do **not** import `app/lib/db` inside `proxy.ts` (DB live in route runtime). Session verification is pure HMAC — safe at the proxy boundary. Full role checks repeat inside each route handler (defense in depth).

### 8.5 Role model + per-route policy
| Capability | BOARD_HQ | ZONAL_GM | DIVISIONAL_DRM | SECTION_CONTROLLER |
|---|---|---|---|---|
| View national/zone/division dashboards | ✓ all | ✓ own zone | ✓ own division | ✓ own division (read-only) |
| Create/import tasks | ✓ | ✓ own zone | ✓ own division | ✗ |
| Approve/update tasks | ✓ | ✓ | ✓ | ✗ |
| Run optimizer | ✓ | ✓ | ✓ | ✓ (own scope) |
| Sanction (sign) blocks | ✓ | ✓ | ✓ | ✗ |
| Verify signatures | ✓ | ✓ | ✓ | ✓ |
| View audit logs | ✓ | ✓ own scope | ✓ own scope | ✗ |
- Every route handler asserts scope containment: e.g., `sanction` requires `requireRole(req, ['BOARD_HQ','ZONAL_GM','DIVISIONAL_DRM'])` **and** (if role ≠ BOARD_HQ) `block.zoneCode`/`divisionCode` must belong to the user.

### 8.6 Client updates
- `app/components/LoginPage.tsx`: remove the role picker (role comes from the account); submit to `/api/auth/login`; show real 401/403/lockout messages; on success call `onLogin(user)`.
- `app/components/Header.tsx`: remove role-switch modal; display `loggedInUser` + role from session; add Logout button calling `/api/auth/logout`.
- `app/page.tsx`: on mount call `/api/auth/me`; if 401 show LoginPage; pass real role/scope from session. Convert role-scope **drops** in Header (e.g., `setScopeLevel`) to disabled options the user lacks permission for.
- `app/lib/apiClient.ts`: `fetch()` now includes `credentials: 'same-origin'` (default) — confirm no `credentials: 'omit'` anywhere; centralize `handleApiError` producing typed errors + 401-redirect.

### 8.7 Hardening
- **Body size limits:** in each mutating route, reject when `content-length > 1 MB` (import: `> 10 MB`).
- **CSRF:** SameSite=Lax cookie + JSON-only content-type on mutating routes suffices here; add a double-submit token to a `X-CSRF` header for mutating form-heavy flows if exposed externally.
- **Rate limiting:** token-bucket per IP in `proxy.ts` (in-memory is fine for single instance; note in README to move to Redis for scale-out).
- **Remove** `/api/bdms/verify` from public paths — signed-in users only (`SECTION_CONTROLLER` allowed).

### Acceptance criteria (DoD-3)
- Login with seeded `admin` → cookie set, `/api/auth/me` returns user.
- Curl `/api/tasks` without cookie → 401. SECTION_CONTROLLER POST `/api/tasks` or `/api/bdms/sanction` → 403.
- 6 failed logins in 1 min → 429.
- `proxy.ts` registered and active on all `/api/*` (verify with `curl -v`).
---

## 9. Phase 4 — Trustworthy Sanction Cryptography (1–2 days)

**Objective:** Fix the cryptographic scheme so sanctions are signed server-side, persisted, and verifiable — and no crypto runs in the browser.

### Steps

1. **`app/lib/security.ts` — remove the browser fallback entirely.**
   - Keep `generateDigitalSignature(blockId, payload, secret = process.env.HMAC_SECRET_KEY)`; **delete the FNV/hash fallback block** (`h1..h4`). If `crypto.createHmac` is unavailable, **throw** — do not silently degrade.
   - Enforce secret presence: in `NODE_ENV === 'production'` with a missing `HMAC_SECRET_KEY`, throw on sign. Keep a dev fallback *only* as an explicit `warning` log, never a fixed literal in production.
   - **Canonical payload:** export `canonicalize(payload) = JSON.stringify(recursive-sort-keys(payload))`. Sign and verify MUST both use it so object key order cannot break verification.
   - Add `hashPayload(payload) = sha256(canonicalize(payload))` for `sanctions.payload_hash`.

2. **`app/api/bdms/sanction/route.ts` — server-side signing with RBAC + persistence.**
   - Auth: `requireRole(req, ['BOARD_HQ','ZONAL_GM','DIVISIONAL_DRM'])`; for non-HQ, confirm the block's `zoneCode`/`divisionCode` is within the user's scope (else 403).
   - Verify the block exists (DB) and status ∈ `PROPOSED|APPROVED`; if already sanctioned, return the existing sanction (idempotent).
   - Compose `payload` **server-side** — `{ blockId, sectionId, startTime, endTime, participatingDepartments, powerBlockRequired, signedBy, role, issuedAt }` — never trust client body for derivable values.
   - Insert a `sanctions` row, update `block_windows.bdms_status = 'APPROVED'`, write an audit log, return `{ success, blockId, digitalSignature, payloadHash, timestamp, sanctionedBy }`.

3. **`app/api/bdms/verify/route.ts` — verified against the stored sanction.**
   - Auth: any signed-in role (incl. SECTION_CONTROLLER).
   - Load the sanction by blockId; none → `{ verified:false, status:'NO_SANCTION' }`.
   - Recompute HMAC over `canonicalize(payload)`; require `signature === expected && hashPayload(payload) === payloadHash`; **also** confirm the block's current stored start/end matches the payload (catches edits after signing).
   - Return `{ verified, status: 'VALID_SANCTION' | 'TAMPERED_OR_INVALID' | 'NO_SANCTION', details }`.

4. **Client cleanup — no crypto in the browser.**
   - `app/components/BDMSWorkflow.tsx`: remove `import { generateDigitalSignature } from '../lib/security'`; display the server-returned signature; add a per-block **Verify** button calling `/api/bdms/verify` and showing the result.
   - `app/components/BlockCircularModal.tsx`: remove client-generated `hmacSig`; show the server-returned signature + payload hash when provided.
   - `app/page.tsx`: use the API-returned signature hash in audit entries instead of calling `generateDigitalSignature` client-side.
   - Grep guard: **no `crypto`/`createHmac`/`generateDigitalSignature` imports inside any `'use client'` component.**

5. **Copy:** replace "Zero Trust Cryptographic Verification Active" with accurate "Signed server-side (HMAC-SHA256), verifiable, persisted".

### Acceptance criteria (DoD-4)
- Sanctioning persists a row, flips the block status, and returns a signature.
- Verify with the exact payload → `VALID_SANCTION`; verify with a modified `endTime` → `TAMPERED_OR_INVALID`.
- No-session `POST /api/bdms/sanction` → 401; SECTION_CONTROLLER → 403.
- `npm run build` succeeds; `grep -r createHmac app/components` returns nothing.
---

## 10. Phase 5 — Scheduler & Optimization Correctness (3–5 days, can overlap Phase 2)

**Objective:** The optimizer must never violate its own hard constraints, must produce exact (un-inflated) metrics, and must respect real calendar dates for WEEKLY/MONTHLY horizons.

### 10.1 `app/lib/timetableEngine.ts` — date-aware headway search
- Current solver is single-day (`0..1440` minutes). Extend:
  - Add `dateToDayMinutes(date, timeStr)` supporting **overnight** trains (exitTime < entryTime ⇒ normalizes into a day-vector).
  - New `findAvailableHeadwayWindowsMultiDay(sectionId, trains, horizonDays, minDurationHours, safetyClearanceMinutes)` — sweeps the timetable across `horizonDays`, returning gaps per `(dayIndex, startM, endM)`.
  - If no gap fits a task duration, the gap is **not emitted** (empty result is valid and meaningful).
- `checkBlockTrainConflict` gains an optional `date` param so checks are day-aware.

### 10.2 `app/lib/optimizer.ts` — hard constraints & honest math
1. **Hard passenger constraint (P1 blocker).** When no conflict-free headway window ≥ task duration exists, do **not** fall back to the night/midday slot algorithm. Mark the cluster `unscheduled`; its tasks stay `PENDING` and are aggregated into `metrics.unscheduledCriticalCount` + listed in `recommendations` ("N tasks could not be scheduled in conflict-free windows — escalate to manual possession planning"). Remove the `isNightSlot` fallback entirely.
2. **Remove `scopeMultiplier`.** All metrics are exact sums. `activeZonesCount`/`activeDivisionsCount` derive from the actual filtered dataset.
3. **Remove `trainDelaysPrevented` fudge.** Accumulate real `delayRiskMinutes` only when `checkBlockTrainConflict` reports freight overlap (passenger overlap is impossible — never scheduled). Contribution is 0 when no train overlaps.
4. **Machine booking across dates.** Include `scheduledDate` in `globalMachineBookings` entries and in the availability comparison, so the same BCM/CSM/TW can be booked on different days.
5. **Deterministic output.** Remove `Date.now()`-derived variety and `Math.random()`; add optional `now?: Date` (fixed in tests) so scheduled dates are reproducible.
6. **Configurable buffer.** Replace hard-coded `+0.3h` shadow buffer with the What-If `powerBlockBufferMinutes` (plus a civil setup default), threaded through optimizer inputs.
7. **Persist results.** `generateOptimizedBlocks` returns `{ blocks, unscheduledTasks, metrics, recommendations }`; `api/optimize` writes blocks to DB and returns unscheduled tasks.

### 10.3 `app/api/optimize/route.ts`
- Server-side task source (DB) per Phase 2; zod-validated params; run optimizer; upsert `block_windows` in a transaction; return blocks + unscheduled + exact metrics + recommendations.
- Horizon durations: DAILY = 1, WEEKLY = 7, MONTHLY = 30 with real `scheduledDate`s.

### 10.4 `app/lib/mlEngine.ts` — minor
- Unit-test TCI bounds `[10,99]` on extreme inputs; return per-feature scores from `explainTaskCriticality` in block metadata when cheap.

### Tests
- `tests/unit/optimizer.test.ts`: fixture dataset — assert **zero** blocks overlap passenger expresses (property-style over random task sets); assert unscheduled critical tasks reported when the timetable has no gap; assert metrics equal manual sums; assert weekly dates ∈ next 7 days.
- `tests/unit/timetableEngine.test.ts`: multi-day gaps, overnight trains, empty-result case.

### Acceptance criteria (DoD-5)
- Generated blocks never overlap a `PASSENGER_EXPRESS` (unit + e2e assertion).
- Deliberately packed test timetable → optimizer returns `unscheduledTasks`, not headway violations.
- `metrics.downtimeHoursSaved` equals the exact per-block sum; no multiplier anywhere.
- WEEKLY run places blocks on up to 7 distinct dates; MONTHLY within 30 days.
---

## 11. Phase 6 — Frontend Engineering & UX (2–3 days)

**Objective:** Kill stale-result races, surface failures honestly, add loading/error/empty states, and make the approval workflow accessible.

### 11.1 `app/page.tsx` — request hygiene & honest errors
- **Race fix:** track a monotonically increasing `requestSeq` inside `runOptimization`; apply a response only when `seq === latestSeq`. Replace the silent `catch { local fallback }` with: keep the **last good** result, set `optimizationError`, and show a banner "⚠ Server optimization failed — showing last successful plan" + Retry.
- Hydrate initial state from `/api/tasks` + `/api/auth/me` (never `mockData.ts` for state).
- Debounce rapid scope/horizon changes (~300 ms) to avoid N concurrent requests.

### 11.2 App-level boundaries
- New `app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx`.
- `app/lib/apiClient.ts`: add timeout (15 s) and typed `ApiError { status, message }`; components show a shared `ErrorBanner`.

### 11.3 Empty & loading states
- `TimeSpaceGantt`, `CalendarView`, `CorridorMap`, `TaskPriorityTable`, `BDMSWorkflow`, `PendingWorksReport`, `PreventiveMaintenancePanel`, `MetricsOverview`: skeleton while loading (null), "No data — run the optimizer / import data" empty state when lists are empty.

### 11.4 Accessibility
- Modals (`BlockCircularModal`, `ZoneDetailModal`, `AIExplainabilityModal`, `CreateTaskModal`, BDMS reject modal): `role="dialog" aria-modal="true"` + `aria-labelledby`, focus trap, focus restore on close, Escape to close, body scroll-lock.
- Icon-only buttons → `aria-label`; tables `<th scope="col">`; approve/reject labels distinct.
- Raise 9–11 px data text to ≥ 12 px on critical tables; WCAG contrast.
- Verify page title/description remain truthful.

### 11.5 Pagination
- `TaskPriorityTable`, `PendingWorksReport`: server-side `?page=&pageSize=` (default 50) in Phase 2 routes; client `Pagination` component.

### Acceptance criteria (DoD-6)
- Rapid scope/horizon switching shows only the latest plan.
- Server down → visible error + Retry; last-good plan retained.
- Axe/Lighthouse accessibility on OVERVIEW/GANTT/BDMS → 0 critical violations.
- Keyboard-only login → optimize → sanction flow fully operable.
---

## 12. Phase 7 — Test Strategy (write continuously; 3–4 days total)

**Objective:** Prove correctness of engines, API contracts, RBAC, crypto, and the main user journey.

### 12.1 Unit tests (`tests/unit/`)
| File | Coverage |
|---|---|
| `timetableEngine.test.ts` | gap finding, safety clearance math, overnight/multi-day, no-false-window, time parsing edges (00:00, 23:59) |
| `optimizer.test.ts` | clustering ≤8 km, duration math (`max + buffer`), **no passenger overlap (property test)**, unscheduled reporting, exact metrics, date ranges per horizon |
| `mlEngine.test.ts` | TCI bounds [10,99] on extremes, severity monotonicity, overdue saturation, explainability consistency |
| `preventiveMaintenanceEngine.test.ts` | cycle applicability by route class, OVERDUE/DUE status math |
| `security.test.ts` | sign→verify roundtrip, tamper detection, canonicalization invariance (key order), missing-secret throw |
| `auth.test.ts` | session create/verify, expiry, tampered cookie rejection, scope-containment checks |
| `db.test.ts` | migrations, seed idempotency, CRUD, transactional import |
| `validation.test.ts` | zod schemas: reject invalid, accept valid |

### 12.2 Integration tests (`tests/integration/api.test.ts`)
- Run against a temp DB file (or in-memory):
  1. POST login → cookie; GET `api/auth/me`.
  2. GET/POST/PATCH/DELETE `api/tasks` with and without session (401/403 matrix).
  3. POST `api/import` (valid / oversized / malformed) — transactions & dedupe.
  4. POST `api/optimize` → blocks persisted; 400 on bad horizon.
  5. POST `api/bdms/sanction` → row + signature; `api/bdms/verify` intact vs tamped payload.
  6. GET `api/reports/pending-works` reflects imported tasks (stale-data regression).
  7. Rate-limit → 429 after threshold.

### 12.3 E2E (`playwright` / `tests/e2e/`)
1. Login (admin) → dashboard shows real metrics.
2. Switch zone → optimizer re-runs with no stale flicker (DoD-6).
3. Create a task → appears in Task table + Pending Works report.
4. Import MULTI preset → shadow blocks appear in Gantt.
5. Sanction a block → signature shown; Verify → VALID_SANCTION.
6. Sign out → all API calls 401; UI returns to login.

### 12.4 CI wiring (with Phase 8)
- `npm test` runs unit+integration in CI; e2e runs on the built app; coverage ≥ 70% on `app/lib/**` and `app/api/**`.

### Acceptance criteria (DoD-7)
- `npm run test:ci` green with coverage report; e2e green in CI; no test depends on real `Date.now()` or randomness (deterministic fixtures).
---

## 13. Phase 8 — CI/CD & Deployment (2 days)

### 13.1 CI — `.github/workflows/ci.yml`
- Jobs: `lint` → `typecheck` → `build` → `test:ci` → `e2e` (Playwright on the standalone build). Run on push to `main` + PRs. Cache `node_modules` / `.next`.
- Secrets: `HMAC_SECRET_KEY`, `SESSION_SECRET` (test values).

### 13.2 Deployment artifacts
- `Dockerfile` (multi-stage):
  - Stage 1: `node:22-alpine` → `npm ci` → `npm run build`.
  - Stage 2: `node:22-alpine`, copy `.next/standalone`, `.next/static`, `public/`, run `node server.js` with `output: 'standalone'`.
  - Ensure `better-sqlite3` native binding matches alpine (pin Node 22 LTS; prebuilt binaries available).
- `docker-compose.yml`: service `app` with env, volume `./data:/app/data`, healthcheck on `/api/health`, restart policy.
- `next.config.ts`: add `output: 'standalone'`, `serverExternalPackages: ['pino', 'better-sqlite3']` (explicit), keep headers. Note: file-based DB means no horizontal scale-out without moving to Postgres (documented limitation).
- `.env.example` (from Phase 0) documented in README with a setup checklist.

### 13.3 README rewrite (important for credibility)
- Clearly mark the project as **demonstration/prototype**; remove "zero-trust", "live", "mTLS", fake AI-accuracy phrases.
- Add: architecture (with DB), setup steps, env vars, demo-data disclosure, security model, limitations, links to this plan and the review.

### Acceptance criteria (DoD-8)
- `docker compose up --build` → healthy app with seeded DB on :3000.
- Fresh clone → `npm ci && npm run build && npm start` works.
- CI green on a clean runner; README contains no fabricated claims.
---

## 14. Phase 9 — Observability & Operations (1–2 days)

### Steps
1. **`app/lib/logger.ts` (pino):** child loggers per request with `X-Request-Id`, `userId`, `action`. Route handlers log entry/exit with latency and status. Dev uses `pino-pretty`.
2. **`app/api/health/route.ts`:** public endpoint returning `{ ok, version, db: 'up', uptimeSec, counts: { tasks, blocks, sanctions, auditLogs } }`; used by the docker healthcheck.
3. **Audit logging everywhere:** every state-changing API action writes an `audit_logs` row; `CyberSecurityPanel` renders these real rows.
4. **Backup:** `npm run db:backup` → copy the SQLite file (with WAL checkpoint) to `data/backups/YYYYMMDD-HHmm.db`; document a nightly cron.
5. **Alerts (optional):** README note for wiring `/api/health` to uptime monitoring.

### Acceptance criteria (DoD-9)
- `/api/health` returns DB counts matching the UI after actions.
- Every mutation produces a readable audit log row with user + IP + result.
- `npm run db:backup` produces a restorable file; restore procedure documented.

---

## 15. Phase 10 — Final Acceptance Sweep (1 day)

1. **Blocker walkthrough:** re-check each of the 6 P0 blockers from `professional_use_review.md`:
   - persistence verified by restart test,
   - auth verified by 401/403 matrix,
   - no fabricated KPIs (greps clean),
   - crypto sign→verify→tamper loop verified,
   - scheduler no-passenger-overlap property test green,
   - tests + CI + Docker present.
2. **Secrets scan:** `grep -riE 'IR_RAILWAY_DEFAULT_DEV_KEY|BEGIN (RSA|EC) PRIVATE' .` → no hits in code (historical review docs may reference it; note the old key is rotated).
3. **Bundle check:** no `crypto`/`createHmac` in client chunks (`grep app/components` clean; `next build` output reviewed).
4. **Performance:** `next build` warnings ≤ 0; Lighthouse performance ≥ 85 on OVERVIEW.
5. **Docs update:** refresh `professional_use_review.md` verdict or add `RELEASES.md` recording improvements vs. the review date.

### Definition of Done recap
When phases 1–10 meet their acceptance criteria, update the project status: **"Production-ready for single-instance self-hosted deployment as a decision-support prototype"** — with documented limitations (single-node DB, simulation feeds until real source connectors).

---

## 16. Effort Summary

| Phase | Focus | Est. effort |
|---|---|---|
| 0 | Baseline & tooling | 0.5–1 day |
| 1 | Data integrity & honesty | 2–3 days |
| 2 | Persistence (SQLite) | 3–5 days |
| 3 | Auth, RBAC, API security | 3–5 days |
| 4 | Sanction cryptography | 1–2 days |
| 5 | Scheduler correctness | 3–5 days |
| 6 | Frontend UX & a11y | 2–3 days |
| 7 | Tests (parallel) | 3–4 days |
| 8 | CI/CD & deployment | 2 days |
| 9 | Observability & ops | 1–2 days |
| 10 | Acceptance sweep | 1 day |
| **Total** | Single engineer, sequential | **~5–6 weeks** |
| | Two engineers (2 ∥ 5, 6 ∥ 7) | **~3 weeks** |

## 17. Key Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `better-sqlite3` native build on alpine | Med | Pin Node 22 LTS; prebuilt binaries; fallback `node:22-slim` or `pg` |
| Proxy/session cookie issues behind TLS | Med | `Secure` flag when `NEXT_PUBLIC_APP_URL` is https; test behind reverse proxy; document cookie flags |
| UI still referencing `INITIAL_*` mock data | Med | Phase 1 grep sweep + Phase 6 hydration change + integration tests |
| Real timetable data unavailable for e2e | Med | Synthetic fixtures; realistic seed timetable; document real COA feeds as future work |
| Scope creep to multi-instance serverless | Low | Keep repository interface; swap to `pg` if required |

---

*Prepared to accompany `professional_use_review.md`. All file references are relative to `c:\Users\shekh\problem`.*