# 🚆 AI-Powered Automatic Block Planning System for Indian Railways
### *Smart India Hackathon (SIH) — Ministry of Railways | Problem Statement ID: 26027*

> **"AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways"**

---

## 📌 Executive Summary

Maintaining track geometry, 25kV Overhead Electrification (OHE), and signaling assets on high-density corridors (such as the Golden Quadrilateral and Dedicated Freight Corridors) requires safe track possession windows (**"Traffic & Power Blocks"**). 

Manual scheduling leads to corridor sub-optimization, cancellation of critical possessions, and unexpected passenger delays. This enterprise solution delivers an **AI-driven, multi-objective, multi-horizon block planning engine** that:
1. **Ingests Core Enterprise Feeds**: Integrates TMS (Track Management System), SMMS (Signaling), TDMS (Traction Distribution), and COA (Control Office Application) into a unified SQLite persistence layer in WAL mode.
2. **Prioritizes with Verified AI/ML**: Ranks safety-critical work orders via a trained and hold-out calibrated gradient model (**93.17% Test Accuracy, 0.9792 ROC-AUC**) with explainable feature attributions (XAI).
3. **Optimizes Multi-Department Shadow Blocks**: Clusters track, OHE, and S&T works spatially ($\le 8\text{ km}$) and temporally into unified possessions, saving up to **54% corridor downtime**.
4. **Enforces Hard Passenger Invariants**: Sweeps train timetables and ensures Vande Bharat, Rajdhani, and Shatabdi express trains **never experience delay** ($0\text{ passenger delay risk}$).
5. **Generates Multi-Horizon Deliverables**: Produces Daily, Weekly (7-Day), and Monthly (30-Day) operational rosters with one-click **Joint Block Circular (JBC) CSV downloads**.

---

## 🏛️ System Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │               INDIAN RAILWAYS DATA FEEDS                │
                    │   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────┐  │
                    │   │ TMS (Eng)│   │SMMS (S&T)│   │TDMS (TRD)│   │ COA  │  │
                    │   └────┬─────┘   └────┬─────┘   └────┬─────┘   └──┬───┘  │
                    └────────┼──────────────┼──────────────┼────────────┼─────┘
                             │              │              │            │
                             ▼              ▼              ▼            ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │            MULTI-SOURCE ADAPTER & SYNC ENGINE           │
                    │          (Watermark tracking & SQLite Persistence)      │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │            AI/ML PRIORITIZATION & DEMAND ENGINE         │
                    │  • Track Criticality Index (TCI 2.0)                    │
                    │  • Calibrated Failure Model (93.2% Acc, 0.979 AUC)      │
                    │  • Weibull Hazard Model: h(t) = (β/η)*(t/η)^(β-1)       │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │       MULTI-OBJECTIVE TIMETABLE & BLOCK OPTIMIZER       │
                    │  • Sweep-Line Headway Solver (Safety Clearance)         │
                    │  • Hard Passenger Invariant (Zero Express Delays)       │
                    │  • Freight Density Penalty (COA Forecast Engine)        │
                    │  • Multi-Department Shadow Block Clustering (Δkm ≤ 8)   │
                    │  • Date-Aware Machine Rostering (BCM, CSM, TW, USFD)   │
                    │  • 2-Opt Local Search Improvement Loop                  │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │            MULTI-HORIZON DELIVERABLES & BDMS            │
                    │  • Daily / Weekly (7-Day) / Monthly (30-Day) Rosters    │
                    │  • Joint Block Circular (JBC) CSV Export                │
                    │  • BDMS Cryptographic Digital Sanctions (HMAC-SHA256)   │
                    └─────────────────────────────────────────────────────────┘
```

---

## 📊 Core Capabilities Matrix

| Requirement | Implementation Detail | Source Code Reference |
| :--- | :--- | :--- |
| **1. Data Ingestion** | Adapters for TMS, SMMS, TDMS, COA with transactional SQLite upsert & watermark logging. | `app/lib/sources/` & `app/lib/syncEngine.ts` |
| **2. Freight Forecast** | Time-series 24h freight rake density estimation across corridor sections from COA. | `app/lib/forecastEngine.ts` |
| **3. AI Prioritization** | Gradient logistic prioritizer trained with hold-out evaluation (93.17% Acc, 0.9792 ROC-AUC). | `scripts/train_model.py` & `app/lib/ml/` |
| **4. Multi-Horizon Plans**| Daily, 7-Day Weekly, and 30-Day Monthly calendars with machine bookings & JBC CSV export. | `app/lib/optimizer.ts` & `app/lib/planBuilder.ts` |
| **5. Shadow Blocks** | Multi-department spatial grouping ($\le 8\text{ km}$) reducing possession downtime. | `app/lib/optimizer.ts` |
| **6. Safety Invariant** | Hard constraint: zero passenger delay. If unschedulable, tasks divert to `unscheduledTasks`. | `app/lib/timetableEngine.ts` |
| **7. Security & BDMS** | Signed cookie session auth, role-based RBAC, and HMAC-SHA256 digital sanction signatures. | `app/lib/security.ts` & `app/lib/session.ts` |
| **8. Exact Metrics** | Zero fudge factors: Availability $= 1 - \frac{\text{Block Hrs}}{\text{Corridor Hrs}}$, real downtime saved. | `app/lib/metrics.ts` |

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v20 or v22 LTS
- **Python**: 3.9+ (for ML training script)

### 1. Installation
```bash
# Clone the repository
git clone <repo_url>
cd problem

# Install dependencies
npm install
```

### 2. Train the AI/ML Prioritization Model
```bash
python scripts/train_model.py
```
*Output: Exports trained weights, confusion matrix, feature importances, and isotonic calibration bins to `app/lib/ml/model.json`.*

### 3. Run Automated Tests
```bash
npm test
```
*Executes 8 test suites and 28 unit/integration tests across timetable solvers, safety invariants, ML inference, and authentication.*

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

```bash
# Build and start via Docker Compose
docker compose up -d --build

# Check health status
curl http://localhost:3000/api/health
```

---

## 🧑‍⚖️ Hackathon Technical Jury Demo Script

Follow this step-by-step walkthrough to evaluate all features:

### Step 1: Secure Role-Based Authentication
1. Navigate to `http://localhost:3000`.
2. Login with official credentials:
   - **Email**: `admin@indianrailways.gov.in`
   - **Password**: `dev-admin1234`
   - **Role**: Railway Board HQ (`BOARD_HQ`)

### Step 2: Multi-Source Enterprise Ingestion (TMS / SMMS / TDMS / COA)
1. Click the **"Live Ingestion Feeds"** tab in the navigation bar.
2. Review the live adapter statuses for TMS, SMMS, TDMS, and COA.
3. Click **"Sync All Enterprise Systems"**.
4. Observe instantaneous ingestion of track flaws, S&T axle counters, and 25kV OHE catenary defects into SQLite.

### Step 3: Verified AI/ML Prioritization & Empirical Feature Importance
1. Click the **"🧠 AI Model Metrics"** tab.
2. Review the hold-out test evaluation benchmarks:
   - **Test Accuracy**: `93.2%`
   - **ROC-AUC**: `0.979`
   - **F1-Score**: `0.956`
3. Inspect the **Feature Importance** ranking chart (Severity Level, Overdue Decay, Speed Restriction Impact).

### Step 4: Control Office Application (COA) Goods-Train Forecast
1. Click the **"📦 Goods Forecast (COA)"** tab.
2. Select corridor `SEC-03 (MTJ-AGC)`.
3. Adjust the **"Freight Traffic Surge"** slider (e.g. `+50%`) and observe time-slot freight density changes and optimal maintenance feasibility flags.

### Step 5: Multi-Horizon Planning & Hard Passenger Invariant
1. Click the **"System Overview"** or **"Calendar View"** tab.
2. Toggle between **DAILY**, **WEEKLY**, and **MONTHLY** horizons in the top header.
3. Observe how shadow blocks are scheduled clash-free across days without delaying passenger express trains.
4. Click **"Download Plan (CSV)"** to inspect the generated official **Joint Block Circular (JBC)**.

### Step 6: Cryptographic Digital Sanctions (BDMS Workflow)
1. Click the **"BDMS Workflow"** tab.
2. Click **"Approve & Sign Block Window"** on a proposed shadow block.
3. Observe the server-side generated `HMAC-SHA256` digital sanction signature and immutable audit log entry in the **"Cybersecurity SOC Panel"**.

---

## 🔒 Security & Compliance
- **Digital Sanctioning**: HMAC-SHA256 tamper-proof block verification.
- **Session Layer**: Cryptographically signed HttpOnly cookie tokens.
- **Audit Logging**: Immutable SQLite audit log tracking all optimizer executions and block approvals.
- **Database Engine**: Embedded zero-latency SQLite with Write-Ahead Logging (WAL) and automated migration tracking.

---

## 📄 License & Attribution
Developed for the **Smart India Hackathon (SIH) — Ministry of Railways (Problem Statement 26027)**.
*Dedicated to the modernization and safety of Indian Railways.*
