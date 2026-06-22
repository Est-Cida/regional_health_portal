# WHO AFRO Regional Health Surveillance Portal

A full-stack web application for monitoring and managing public health surveillance data across WHO African Region (AFRO) member states, built for the WHO Africa Regional Office.

---

## Overview

The portal provides role-based dashboards for country-level and regional disease surveillance, outbreak tracking, laboratory capacity, health workforce, and funding data. Surveillance tables are bundled from CSV at build time and kept editable in-browser via a mutable DataStore context with `localStorage` persistence. The regional overview displays a live PostGIS choropleth map of AFRO boundaries with per-country hover panels.

---

## User Roles

| Role | Access |
|---|---|
| `country_admin` | Single-country dashboard with full CRUD on all tables |
| `regional_admin` | Multi-country charts + choropleth map (read-only) |
| `super_admin` | All countries, all sub-regions, map + full overview (read-only) |

---

## Features

### Regional Dashboard (`/region`)
- Interactive Leaflet choropleth map of 51 AFRO member states (PostGIS boundaries)
- Colour intensity based on selected metric: Total Cases · Total Deaths · Outbreaks
- Per-country hover panel showing: disease surveillance stats, top 5 diseases with mini-bars, outbreaks, domestic/external funding split, health capacity (epidemiologists, FELTP, lab technicians)
- Sub-region and disease filters; year selector (individual year or all years)
- KPI cards: total cases, total deaths, total outbreaks

### Country Dashboard (`/country/*`)
| Route | Page | Key Charts |
|---|---|---|
| `/country` | Country Overview | Summary KPIs, burden by country bar, funding by country bar |
| `/country/diseases` | Disease Surveillance | Disease summary table, cases by disease line chart (2021–2025), single-disease 5-year trend, **cases reported by country & year grouped bar** |
| `/country/outbreaks` | Outbreaks | Outbreaks by disease (Top N filter), outbreaks per year, **outbreaks by country (Top N filter)**, outbreak records table |
| `/country/laboratory` | Laboratory | Lab test volume, positivity rate, turnaround time, lab capacity by country |
| `/country/capacity` | Health Workforce | Workforce KPIs, workforce trend, **workforce capacity by country grouped bar** |
| `/country/funding` | Funding | Domestic/external funding split, funding trend, funding by country bar |

### Responsive Design
- Desktop: full sidebar, full-bleed map, multi-column KPI grids
- Tablet (≤ 1024px): sidebar collapses, 2-column grids, stacked page headers
- Mobile (< 768px): hamburger menu, overlay sidebar with backdrop, 2-column KPIs, single-column charts, bottom-sheet modals, login hero hidden

### CRUD (country_admin role)
- Edit and delete records on all 8 surveillance tables (disease surveillance, outbreaks, lab capacity, workforce, funding)
- Add new outbreak events via a modal form
- All changes persisted to `localStorage`; cleared on browser storage reset

---

## Tech Stack

### Frontend

| Library | Version | Purpose |
|---|---|---|
| React | 19.2.6 | UI framework |
| Vite | 8.x (Rolldown) | Build tool + dev server |
| React Router DOM | 7.x | Client-side routing |
| Recharts | 3.x | Line, bar, area, grouped bar charts |
| React Leaflet + Leaflet | 5.x / 1.9.x | Choropleth map with GeoJSON |
| PapaParse | 5.x | CSV parsing (`?raw` imports bundled at build time) |
| react-is | 19.x | Required peer dep for Recharts on Vite 8 / Rolldown |

### Backend

| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.0 | REST API framework |
| Uvicorn | 0.32.0 | ASGI server |
| SQLAlchemy | 2.0.36 | ORM + raw SQL execution |
| Psycopg2 | 2.9.10 | PostgreSQL driver |
| python-jose | 3.3.0 | JWT token generation / validation |
| passlib[bcrypt] | 1.7.4 | Password hashing (pinned bcrypt==4.2.1) |
| pydantic | 2.9.2 | Request / response schema validation |
| python-dotenv | 1.0.1 | `.env` file loading |
| python-multipart | 0.0.17 | Form data parsing |

### Database

- **PostgreSQL** ≥ 14 with the **PostGIS** extension (for `admin_boundaries` geometry)
- Default port: **5433**
- Database name: `regional_health_portal`

---

## Prerequisites

- **Node.js** ≥ 18.x and npm
- **Python** ≥ 3.10 (project uses Python 3.14 at `C:\Python314\python.exe`)
- **PostgreSQL** ≥ 14 with PostGIS extension, running on port **5433**

---

## Setup

### 1. Clone / open the repository

```
GIS project/
├── backend/
└── regional_health_portal/
```

### 2. Backend — install dependencies

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
```

> **Note:** `passlib 1.7.4` is incompatible with `bcrypt >= 5.x`. The requirements file pins `bcrypt==4.2.1` explicitly.

### 3. Configure environment variables

Create a `.env` file in the project root (`GIS project/`):

```env
FASTAPI_ENV=development
HOST=127.0.0.1
PORT=8000

DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5433
DB_NAME=regional_health_portal
```

### 4. Create the database and enable PostGIS

```sql
CREATE DATABASE regional_health_portal;
\c regional_health_portal
CREATE EXTENSION IF NOT EXISTS postgis;
```

The `admin_boundaries` table must be loaded with AFRO country polygon geometry before the map will render. The backend endpoint uses:

```sql
SELECT iso_3_code, adm0_name,
       ST_AsGeoJSON(ST_SimplifyPreserveTopology(geometry, 0.01), 5) AS geom
FROM admin_boundaries
WHERE who_region = 'AFRO'
```

### 5. Seed demo users

```bash
# From backend/ with venv active
python seed_users.py
```

Creates the `portal_users` table and seeds 15 accounts (all password: **`password123`**):

| Username | Role | Scope |
|---|---|---|
| `nga_admin` | country_admin | Nigeria |
| `gha_admin` | country_admin | Ghana |
| `ken_admin` | country_admin | Kenya |
| `zaf_admin` | country_admin | South Africa |
| `eth_admin` | country_admin | Ethiopia |
| `cod_admin` | country_admin | DR Congo |
| `sen_admin` | country_admin | Senegal |
| `cmr_admin` | country_admin | Cameroon |
| `tza_admin` | country_admin | Tanzania |
| `uga_admin` | country_admin | Uganda |
| `west_admin` | regional_admin | West Africa |
| `central_admin` | regional_admin | Central Africa |
| `east_admin` | regional_admin | East Africa |
| `south_admin` | regional_admin | Southern Africa |
| `super_admin` | super_admin | All regions |

### 6. Start the backend

```bash
# From backend/ with venv active
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Interactive API docs: `http://localhost:8000/docs`

### 7. Frontend — install dependencies

```bash
cd regional_health_portal
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because `react-leaflet` v5 declares a peer dep on React 18 while this project uses React 19.

### 8. Start the frontend dev server

```bash
npm run dev
```

App available at: `http://localhost:5173`

---

## Build for Production

```bash
cd regional_health_portal
npm run build     # outputs to regional_health_portal/dist/
npm run preview   # local preview of the production build
```

---

## Project Structure

```
GIS project/
├── .env                            # Backend environment variables
├── backend/
│   ├── main.py                     # FastAPI app, CORS, router registration
│   ├── auth.py                     # JWT creation/validation, password hashing
│   ├── database.py                 # SQLAlchemy engine + session factory
│   ├── models.py                   # ORM model: User (portal_users table)
│   ├── seed_users.py               # One-time script to create demo accounts
│   ├── requirements.txt            # Python dependencies
│   └── routers/
│       ├── auth.py                 # POST /api/auth/login
│       ├── surveillance.py         # GET /api/surveillance/
│       ├── countries.py            # GET /api/countries/
│       ├── outbreaks.py            # GET /api/outbreaks/
│       ├── capacity.py             # GET /api/capacity/
│       └── boundaries.py          # GET /api/boundaries/ (PostGIS GeoJSON)
│
└── regional_health_portal/         # Vite + React frontend
    ├── package.json
    ├── vite.config.js
    ├── data/                        # Raw CSV data files (bundled at build time)
    └── src/
        ├── main.jsx                 # App entry point, CSS import
        ├── App.jsx                  # Router, auth guard, route definitions
        ├── index.css                # CSS entry point — imports all style files
        │
        ├── styles/                  # Split CSS modules
        │   ├── variables.css        # CSS custom properties, reset, scrollbar
        │   ├── layout.css           # App shell, page-wrapper, section, states
        │   ├── sidebar.css          # Sidebar navigation component
        │   ├── navbar.css           # Top navbar, hamburger, role badges
        │   ├── page-header.css      # Page titles, controls, select inputs
        │   ├── cards.css            # Card, KPI grid/cards, charts grid, tooltips
        │   ├── dashboard-widgets.css # Capacity, funding, quicknav, disease KPI, lab
        │   ├── tables.css           # Data tables, pills, CRUD action buttons
        │   ├── login.css            # Login page layout, form, demo hints
        │   ├── modal.css            # Modal overlay, confirm dialog, form buttons
        │   ├── country.css          # Country sub-header, year tabs
        │   ├── components.css       # Page tabs, multi-select dropdown
        │   ├── map.css              # Choropleth map, Leaflet overrides, hover panel
        │   └── responsive.css       # All @media breakpoints
        │
        ├── context/
        │   ├── AuthContext.jsx      # JWT auth state, login/logout
        │   ├── CountryContext.jsx   # selectedIsos, selectedYears, selectedDiseases
        │   └── DataStore.jsx        # Mutable surveillance data + localStorage
        │
        ├── data/
        │   └── dataService.js       # CSV loaders via PapaParse + ?raw imports
        │
        ├── components/
        │   ├── Layout/
        │   │   ├── Sidebar.jsx      # Collapsible nav, mobile overlay
        │   │   └── Navbar.jsx       # Top bar, hamburger, user info
        │   ├── RegionalMap.jsx      # Leaflet choropleth + hover panel
        │   ├── MultiSelectDropdown.jsx
        │   ├── PageTabs.jsx
        │   ├── OutbreakTable.jsx
        │   ├── EditRecordModal.jsx
        │   ├── AddOutbreakModal.jsx
        │   ├── ConfirmDialog.jsx
        │   └── charts/
        │       ├── DiseaseBarChart.jsx
        │       └── TrendLineChart.jsx
        │
        └── pages/
            ├── LoginPage.jsx
            ├── RegionalDashboard.jsx    # /region — choropleth map + KPIs
            ├── SuperAdminDashboard.jsx  # /admin
            ├── CountryDashboard.jsx     # /country (shell)
            └── country/
                ├── CountryLayout.jsx    # Sub-header, year tabs, outlet
                ├── CountryOverview.jsx  # /country (index)
                ├── DiseaseDashboard.jsx # /country/diseases
                ├── OutbreaksDashboard.jsx # /country/outbreaks
                ├── LaboratoryDashboard.jsx # /country/laboratory
                ├── CapacityDashboard.jsx  # /country/capacity
                └── FundingDashboard.jsx   # /country/funding
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Returns JWT access token |
| GET | `/api/countries/` | Yes | Country metadata list |
| GET | `/api/surveillance/` | Yes | Disease surveillance records |
| GET | `/api/outbreaks/` | Yes | Outbreak event records |
| GET | `/api/capacity/` | Yes | Lab + workforce capacity records |
| GET | `/api/boundaries/` | Yes | AFRO country GeoJSON (PostGIS, simplified) |

All authenticated endpoints expect `Authorization: Bearer <token>` header.

---

## Data Architecture

| Layer | How data flows |
|---|---|
| CSV files in `data/` | Bundled into the JS bundle at build time via Vite `?raw` imports |
| `dataService.js` | PapaParse parses CSV strings; exports typed arrays and helper functions |
| `DataStore` context | Wraps surveillance arrays in React state; edits written to `localStorage` |
| `CountryContext` | Provides `selectedIsos`, `selectedYears`, `selectedDiseases` to all dashboards |
| PostGIS (map only) | `GET /api/boundaries/` fetched once and cached module-level in `RegionalMap.jsx` |

**localStorage keys:**
- `who_afro_portal_token` — JWT token
- `who_portal_store` — mutable surveillance data (cleared to CSV defaults on reset)

---

## Known Issues & Notes

- **bcrypt compatibility** — `passlib 1.7.4` does not support `bcrypt >= 5.x`. `requirements.txt` pins `bcrypt==4.2.1`.
- **react-leaflet peer deps** — react-leaflet v5 declares a peer dep on React 18. Use `npm install --legacy-peer-deps` on React 19.
- **Vite 8 / Rolldown** — Recharts requires `react-is` which Rolldown does not auto-bundle. It is listed as an explicit dependency in `package.json`.
- **FastAPI trailing slash** — The boundaries endpoint must be fetched at `/api/boundaries/` (with trailing slash). Without it, FastAPI issues a 307 redirect which browsers drop the `Authorization` header on.
- **PostGIS geometry size** — Raw AFRO boundary geometry is ~40 MB. `ST_SimplifyPreserveTopology(geometry, 0.01)` reduces the GeoJSON response to ~484 KB with no visible quality loss at regional zoom levels.
- **Leaflet stable callbacks** — `onEachFeature` in `RegionalMap.jsx` uses a `useRef` "latest-ref" pattern to avoid stale closures; `useCallback(fn, [])` callbacks read from `stateRef.current` rather than closed-over state values.
