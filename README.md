# FUJITRACK AI – Intelligent Tourism Demand Forecasting & Transportation Analytics Platform
### 富士山観光需要予測・交通計画プラットフォーム (富士急行株式会社 DX推進ポートフォリオ)

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%20%7C%203.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Executive Summary & Business Context

**FUJITRACK AI** is an enterprise-grade full-stack transportation analytics and tourism demand forecasting platform designed as a flagship portfolio system demonstrating Digital Transformation (DX) capabilities for **Fuji Kyuko Co., Ltd. (富士急行株式会社)**, Japan.

### The Business Challenge
The Mount Fuji region (Lake Kawaguchiko, Mt. Fuji 5th Station, Oshino Hakkai, Chureito Pagoda, Lake Yamanakako) experiences acute passenger demand fluctuations:
- **Severe Weekend & Seasonal Surges:** Summer climbing season (July–August), spring Shibazakura/cherry blossoms, and autumn foliage drive passenger volume up to +180% above baseline.
- **Weather Sensitivity:** Heavy precipitation or typhoons suppress sightseeing lines (Subaru Line 5th Station) by up to -35%, while shifting demand toward indoor venues like Gotemba Premium Outlets.
- **Manual Fleet Dispatch Inefficiencies:** Traditional manual data aggregation delayed bus capacity dispatch, leading to passenger queues and overcrowding.

### The AI/DX Solution
FUJITRACK AI automates the end-to-end operational pipeline:
1. **Automated ETL & Quality Auditing:** Validates, normalizes, deduplicates, and imputes incoming station and bus datasets (CSV/Excel).
2. **AI Passenger Demand Forecasting:** Trains GBDT, Random Forest, and Ridge models with time-series lag features (t-1, t-7), rolling windows, Japanese holiday calendars, and weather indices to predict demand 1-day, 7-days, and 30-days ahead with 95% confidence intervals without future data leakage.
3. **Smart Bus Capacity Recommendation Engine:** Calculates exact bus fleet requirements with a 15% operational safety reserve margin, flags overcrowding risk levels, and presents actionable dispatch recommendations subject to authorized manager sign-off.
4. **Automated Business Reporting:** Exports publication-ready PDF, Excel, and CSV reports.

---

## 2. Platform Architecture

```
                                  +---------------------------------------+
                                  |   React 18 + TypeScript + Tailwind    |
                                  |   (Fuji Kyuko Enterprise UI / UX)     |
                                  +-------------------+-------------------+
                                                      | REST (Axios)
                                                      v
                                  +---------------------------------------+
                                  |         FastAPI REST Backend          |
                                  |  (Pydantic V2 + JWT Auth + RBAC)      |
                                  +---+-------+-------+-------+-------+---+
                                      |       |       |       |       |
                 +--------------------+       |       |       |       +--------------------+
                 |                            |       |       |                            |
                 v                            v       |       v                            v
      +----------------------+   +-----------------+  |  +---------------------+   +---------------------+
      |  ETL Data Pipeline   |   | Scikit-Learn ML |  |  | Capacity Simulator  |   | Report Generator    |
      | - Schema Validation  |   | - GBDT Regressor|  |  | - Safety Margin 15% |   | - ReportLab (PDF)   |
      | - Date Normalization |   | - Random Forest |  |  | - Crowding Risk     |   | - OpenPyXL (Excel)  |
      | - Quality Scoring    |   | - Time Lags     |  |  | - Manager Sign-Off  |   | - CSV Formatter     |
      +----------+-----------+   +--------+--------+  |  +----------+----------+   +----------+----------+
                 |                        |           |             |                         |
                 +-------------------\    |           |    /--------+                         |
                                     |    |           |    |                                  |
                                     v    v           v    v                                  v
                            +------------------------------------+               +-------------------------+
                            |    Dual Database Architecture      |               | Persisted File Storage  |
                            | - SQLite (Zero-Setup Local Dev)    |               | - data/samples/         |
                            | - PostgreSQL (Neon / Render Prod)  |               | - data/cleaned/         |
                            | - SQLAlchemy 2.0 ORM + Alembic     |               | - data/models/ (.joblib)|
                            | - 15 Normalized Database Tables    |               | - data/reports/         |
                            +------------------------------------+               +-------------------------+
```

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Recharts, Lucide React, Vite |
| **Backend** | Python 3.11 / 3.13, FastAPI, Pydantic V2, Uvicorn, Passlib (PBKDF2/Bcrypt), Python-JOSE (JWT) |
| **Data Engineering** | Pandas, NumPy, OpenPyXL, ReportLab |
| **Machine Learning** | Scikit-learn (HistGradientBoostingRegressor, RandomForestRegressor, Ridge), Joblib |
| **Database & ORM** | PostgreSQL (Neon / Render), SQLite local fallback, SQLAlchemy 2.0, Alembic |
| **Container & Cloud** | Docker (Multi-stage), Docker Compose, Render (`render.yaml`), Vercel (`vercel.json`) |

---

## 4. Main Application Modules

### Module 1: Executive Dashboard (役員・統括ダッシュボード)
- Real-time KPIs: Today's ridership, tomorrow's forecast, MTD volume, average daily passengers, peak operating hours, fleet utilization rate, demand growth %.
- AI model benchmark pill ($R^2$, MAE).
- 30-day passenger demand curve with 3-day forecast preview.
- Route demand share pie chart.
- High-demand congestion alerts and under-utilized route notifications.

### Module 2: Data Engineering & Upload Pipeline (データ検証・ETLパイプライン)
- Drag-and-drop file upload for **CSV**, **XLSX**, and **XLS**.
- 12-step validation pipeline:
  1. File integrity & format check.
  2. Mandatory column schema inspection (`date`, `route_code`, `passenger_count`, `hour`).
  3. Automatic date normalization to ISO-8601 (`YYYY-MM-DD`).
  4. Context-aware missing value imputation (median of route).
  5. Composite deduplication (`date + route_code + hour`).
  6. Outlier clamping for negative/extreme counts.
  7. Data Quality Score calculation (0–100%).
  8. Instant download of cleaned, standardized CSV.
  9. Non-destructive audit trail logged to `data_quality_logs`.
- Includes **1-Click Sample CSV & Excel Downloads** for instant testing.

### Module 3: Passenger Traffic Analytics (旅客動態分析)
- Slicing by route (all 6 Mt. Fuji routes) and custom dates.
- Boardings vs Alightings daily area trends.
- Operating hour histogram (07:00 to 20:00).
- Monthly seasonality bar chart showing Summer climbing, Autumn leaves, and Spring cherry blossom surges.
- Weekend vs Weekday surge calculator (+45% tourist concentration).

### Module 4: AI Demand Forecasting Engine (AI需要予測エンジン)
- **Zero Data Leakage:** Strict chronological train/test split.
- **Engineered Features:** Lags ($t-1, t-7$), rolling moving averages (7-day, 14-day), calendar indicators (day of week, month, weekend, Japanese national holidays, Golden Week, Obon), and weather conditions (temperature, precipitation).
- **Models:** Gradient Boosting Regressor (primary), Random Forest, and Ridge baseline.
- **Horizon Selection:** 1-Day, 7-Day, and 30-Day out-of-sample recursive forecasting with 95% confidence intervals.
- **Interactive Retraining:** 1-click model retraining trigger with instant MAE/RMSE/$R^2$ evaluation updates.

### Module 5: Weather & Seasonal Analysis (天候・祝祭日分析)
- Live Open-Meteo API connector for Fujikawaguchiko meteorological observation station.
- Rainfall vs Ridership correlation scatter plot (-28% demand drop during heavy precipitation on scenic lines).
- Four seasons tourist volume distribution.
- Explicit analytical non-causation disclaimer (*correlation does not imply causation*).

### Module 6: Smart Bus Capacity Recommendation Engine (バス配車適正化)
- What-If dispatch simulator: Adjust predicted passengers, available buses, bus seat capacity, and safety margin % (5% to 30%).
- Real-time mathematical calculation:
  $$\text{Required Buses} = \left\lceil \frac{\text{Demand} \times (1 + \text{Safety Margin})}{\text{Bus Capacity}} \right\rceil$$
  $$\text{Capacity Gap} = (\text{Required Buses} - \text{Available Buses}) \times \text{Bus Capacity}$$
- Risk alert rating: Normal (Green), Moderate (Yellow), High (Orange), Critical Overcrowding (Red).
- Formal bilingual dispatch commentary.
- **Human-in-the-loop Managerial Sign-Off:** Authorize, revise, or reject dispatch plans with manager notes, recorded to immutable audit trails.

### Module 7: Route Performance Analytics (路線別採算・稼働率)
- Comparison of all 6 Mt. Fuji routes:
  1. `ROUTE-FS5`: 富士スバルライン五合目直行バス (Fuji Subaru Line 5th Station Shuttle)
  2. `ROUTE-KWR`: 河口湖周遊バス レッドライン (Kawaguchiko Sightseeing Red Line)
  3. `ROUTE-KWG`: 西湖周遊バス グリーンライン (Saiko Sightseeing Green Line)
  4. `ROUTE-SNK`: 富士五湖〜新宿 高速バス (Shinjuku - Mt. Fuji Highway Express)
  5. `ROUTE-GOT`: 河口湖〜御殿場アウトレット特急 (Kawaguchiko - Gotemba Outlets Express)
  6. `ROUTE-YMN`: 山中湖周遊・忍野八海シャトル (Lake Yamanakako & Oshino Hakkai Shuttle)
- Utilization rates, hourly peak slots, system ranking, and efficiency badges.

### Module 8: AI Business Insights (AI運行インサイト)
- Safe, controlled natural language query interface (zero destructive SQL exposure).
- Quick prompt queries:
  - *Which route has the highest passenger demand?*
  - *What are the busiest days of the week?*
  - *How many additional buses may be needed tomorrow?*
  - *Which month has the highest tourism traffic?*
  - *What is the impact of rainfall on passenger demand?*
- Delivers executive summary text, numerical evidence, and operational recommendations.

### Module 9: Automated Business Reporting (定型業務レポート出力)
- 6 standard report types: Daily, Weekly, Monthly, Forecast, Route Performance, Bus Capacity.
- Formats:
  - **PDF:** Styled with ReportLab (bilingual headers, KPI cards, route breakdown table, manager sign-off box).
  - **Excel (.xlsx):** Multi-tab workbook with openpyxl formatting.
  - **CSV:** Direct data export.
- Historical download archive with instant file retrieval.

### Module 10: User Management, RBAC & Audit Logging (ユーザー管理と監査)
- Three predefined roles:
  - `ADMIN` (`admin@fujikyu.co.jp` / `admin123`): Full system configuration & user oversight.
  - `MANAGER` (`manager@fujikyu.co.jp` / `manager123`): Fleet dispatch sign-off & operational revisions.
  - `ANALYST` (`analyst@fujikyu.co.jp` / `analyst123`): Read-only analytics, forecasting, and report generation.
- Role-switcher bar in the top navigation for frictionless evaluator testing.
- Comprehensive security audit log table tracking uploads, model training, and dispatch approvals.

---

## 5. Database Architecture (15 Normalized Tables)

| # | Table Name | Purpose |
|---|---|---|
| 1 | `users` | User accounts, hashed passwords, roles, and departments |
| 2 | `routes` | Route codes, Japanese/English names, distance, standard duration |
| 3 | `stations` | Station codes, names, GPS coordinates, elevation, terminal flags |
| 4 | `buses` | Fleet inventory, license plates, capacities, bus types, maintenance |
| 5 | `passenger_records` | Hourly/daily ridership, boardings, alightings, synthetic flags |
| 6 | `tourism_records` | Foreign vs domestic visitor estimates, hotel occupancy rates, events |
| 7 | `weather_records` | Weather conditions, temperature, rainfall, snowfall, wind speed |
| 8 | `holiday_calendar` | Japanese national holidays, Golden Week, Obon, long weekends |
| 9 | `uploaded_datasets` | Uploaded CSV/Excel history, total/valid/invalid row counts, file paths |
| 10 | `data_quality_logs` | Audit trail of missing value imputations and duplicate cleanups |
| 11 | `forecasting_models` | Serialized model metadata, MAE, RMSE, R², feature configurations |
| 12 | `forecast_results` | Recursive prediction points, lower/upper 95% bounds |
| 13 | `capacity_recommendations` | Fleet allocations, safety buffer margins, manager approval notes |
| 14 | `generated_reports` | Generated PDF, Excel, and CSV files metadata and download links |
| 15 | `audit_logs` | Immutable audit log of user logins, ETL jobs, retrains, and sign-offs |

---

## 6. Quick Start Guide (Local Setup)

### Prerequisites
- Python 3.10+ (Tested on Python 3.11 & 3.13)
- Node.js 18+ (Tested on Node 20 & 25)

### Step 1: Clone & Seed Database
```bash
# Clone the repository
git clone https://github.com/your-username/fujitrack-ai.git
cd fujitrack-ai

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Run database seed (generates 14 months of Mt. Fuji transit data, trains ML models, and creates test files)
python -c "import sys; sys.path.insert(0, '.'); from seeds.seed_fuji_data import seed_database; seed_database()"
cd ..
```

### Step 2: Run Backend Server
```bash
# In backend/ directory:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### Step 3: Run Frontend Server
```bash
# In frontend/ directory:
cd frontend
npm install
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 7. Running with Docker Compose

To launch the full production stack with PostgreSQL, FastAPI, and React in a single command:
```bash
docker-compose up --build -d
```
Access the application at: `http://localhost:8000`

---

## 8. Automated Testing

Run the full pytest test suite covering API endpoints, data cleaning pipelines, ML model forecasting, capacity calculations, and JWT authentication:
```bash
python -m pytest backend/tests/test_suite.py -v
```

Output:
```
backend/tests/test_suite.py::test_health_check PASSED                    [ 12%]
backend/tests/test_suite.py::test_dashboard_summary PASSED               [ 25%]
backend/tests/test_suite.py::test_routes_list PASSED                     [ 37%]
backend/tests/test_suite.py::test_auth_login PASSED                      [ 50%]
backend/tests/test_suite.py::test_capacity_engine_calculation PASSED     [ 62%]
backend/tests/test_suite.py::test_ml_forecasting_prediction PASSED       [ 75%]
backend/tests/test_suite.py::test_ai_insights_highest_demand PASSED      [ 87%]
backend/tests/test_suite.py::test_data_cleaning_pipeline PASSED          [100%]
======================= 8 passed in 7.10s ========================
```

---

## 9. Deployment Configuration

### Backend Deployment (Render)
1. Push this repository to GitHub.
2. In Render, select **New Blueprint Instance** and connect the repository.
3. Render automatically detects `render.yaml` and deploys the FastAPI backend and Neon PostgreSQL database.

### Frontend Deployment (Vercel)
1. In Vercel, import the repository.
2. The root `vercel.json` automatically configures Vite build and API rewrites to your Render backend URL.

---

## 10. Default Credentials for Portfolio Evaluation

| Role | Email | Password | Permissions |
|---|---|---|---|
| **DX Admin** | `admin@fujikyu.co.jp` | `admin123` | Full access, user management, retrain models |
| **Operations Manager** | `manager@fujikyu.co.jp` | `manager123` | Capacity simulations, dispatch approvals, reporting |
| **Data Analyst** | `analyst@fujikyu.co.jp` | `analyst123` | Analytics exploration, forecasting previews, exports |

*(Use the Role Switcher in the top navigation bar to test different permission tiers instantly without re-logging in.)*

---

## 11. Disclaimer & Compliance

*All passenger and operational records provided in this demonstration platform are synthetically modeled around historical Mount Fuji tourism patterns for portfolio and technical evaluation purposes. The system adheres to safety-critical transit principles: AI-generated bus capacity recommendations are advisory and require review and authorization by an authorized transportation manager prior to physical dispatch.*

---

**Developed for Fuji Kyuko Co., Ltd. Digital Transformation (DX) Portfolio Demonstration**
