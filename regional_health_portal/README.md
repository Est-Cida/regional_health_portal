# WHO AFRO Regional Health Surveillance Portal

A full-stack web application for monitoring and managing public health surveillance data across African countries, built for the WHO Africa Regional Office (AFRO).

## Overview

The portal provides role-based dashboards for country-level and regional disease surveillance, outbreak tracking, laboratory capacity, health workforce, and funding data. Data is bundled from CSV at build time (no runtime DB queries for reads) and kept editable in-browser via a mutable DataStore context with `localStorage` persistence.

### User Roles

| Role | Access |
|------|--------|
| `country_admin` | Single-country dashboard with full CRUD |
| `regional_admin` | Regional choropleth map + multi-country charts (read-only) |
| `super_admin` | All countries, all regions (read-only overview) |

---

## Tech Stack

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 19.2.6 | UI framework |
| Vite | 8.0.x (Rolldown) | Build tool + dev server |
| React Router DOM | 7.x | Client-side routing |
| Recharts | 3.x | Charts (line, bar, area) |
| React Leaflet + Leaflet | 5.x / 1.9.x | Choropleth map |
| PapaParse | 5.x | CSV parsing (bundled via `?raw` imports) |
| react-is | 19.x | Required peer dep for Recharts on Vite 8 |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.115.0 | REST API framework |
| Uvicorn | 0.32.0 | ASGI server |
| SQLAlchemy | 2.0.36 | ORM |
| Psycopg2 | 2.9.10 | PostgreSQL driver |
| python-jose | 3.3.0 | JWT token generation/validation |
| passlib[bcrypt] | 1.7.4 | Password hashing (requires bcrypt==4.2.1) |
| pydantic | 2.9.2 | Request/response validation |
| python-dotenv | 1.0.1 | `.env` file loading |
| python-multipart | 0.0.17 | Form data parsing |

### Database
- PostgreSQL (port **5433** by default)
- Database name: `regional_surveillance`

---

## Prerequisites

- **Node.js** >= 18.x and npm
- **Python** >= 3.10
- **PostgreSQL** >= 14 running on port 5433

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd "WHO TASKS/GIS specialist/GIS project"
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Fix bcrypt compatibility (passlib 1.7.4 requires bcrypt <=4.x)
pip install "bcrypt==4.2.1"
```

### 3. Configure environment variables

Copy the example env file and fill in your database credentials:

```bash
# In the project root (GIS project/)
cp .env.example .env
```

Edit `.env`:

```env
FASTAPI_ENV=development
HOST=127.0.0.1
PORT=8000

DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5433
DB_NAME=regional_surveillance
```

### 4. Create the database

In PostgreSQL:

```sql
CREATE DATABASE regional_surveillance;
```

### 5. Seed demo users

From the `backend/` directory (with venv active):

```bash
python seed_users.py
```

This creates the `portal_users` table and seeds 15 demo accounts, all with password `password123`:

| Username | Role | Country/Region |
|----------|------|----------------|
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

API docs available at: `http://localhost:8000/docs`

### 7. Frontend setup

```bash
cd regional_health_portal

# Install dependencies (use --legacy-peer-deps for react-leaflet v5 peer dep resolution)
npm install --legacy-peer-deps
```

The frontend `.env` is already configured:

```env
VITE_API_URL=http://localhost:8000
```

### 8. Start the frontend dev server

```bash
npm run dev
```

App available at: `http://localhost:5173`

---

## Build for production

```bash
cd regional_health_portal
npm run build
```

Output goes to `regional_health_portal/dist/`. Preview with:

```bash
npm run preview
```

---

## Project Structure

```
GIS project/
├── .env                        # Backend environment variables
├── .env.example                # Template for .env
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── auth.py                 # JWT auth + password hashing
│   ├── database.py             # SQLAlchemy engine + session
│   ├── models.py               # ORM models
│   ├── seed_users.py           # One-time user seeding script
│   ├── requirements.txt        # Python dependencies
│   └── routers/                # API route modules
│       ├── auth.py
│       ├── surveillance.py
│       ├── countries.py
│       ├── outbreaks.py
│       └── capacity.py
└── regional_health_portal/     # Vite + React frontend
    ├── .env                    # Frontend env (VITE_API_URL)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── context/
        │   ├── AuthContext.jsx      # JWT auth state
        │   ├── CountryContext.jsx   # Multi-select country/year filters
        │   └── DataStore.jsx        # Mutable data + localStorage persistence
        ├── components/
        │   └── MultiSelectDropdown.jsx  # Checkbox dropdown with Select All
        ├── data/
        │   └── dataService.js       # CSV loaders (PapaParse + ?raw imports)
        └── pages/
            ├── RegionalDashboard.jsx
            └── country/
                ├── CountryLayout.jsx
                ├── CountryOverview.jsx
                ├── DiseaseDashboard.jsx
                ├── OutbreaksDashboard.jsx
                ├── LaboratoryDashboard.jsx
                ├── CapacityDashboard.jsx
                └── FundingDashboard.jsx
```

---

## Known Issues & Notes

- **bcrypt compatibility**: `passlib==1.7.4` is incompatible with `bcrypt>=5.x`. Pin `bcrypt==4.2.1` explicitly after installing requirements.
- **react-leaflet peer deps**: react-leaflet v5 declares a peer dep on React 18. Use `npm install --legacy-peer-deps` to bypass this on React 19.
- **Vite 8 / Rolldown**: Recharts requires `react-is` which is not auto-bundled by Rolldown. It is listed as an explicit dependency in `package.json`.
- **Data persistence**: All edits are stored in `localStorage` under key `who_portal_store`. Clearing browser storage resets data to the bundled CSV defaults.
- **Auth token**: JWT is stored in `localStorage` under key `who_afro_portal_token`.
