from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import User  # ensure table is created
from routers import auth, surveillance, countries, outbreaks, capacity, boundaries

app = FastAPI(
    title="WHO AFRO Regional Surveillance Portal",
    description="API for the WHO AFRO Regional Health Surveillance Portal",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create portal_users table on startup (does NOT touch existing surveillance tables)
Base.metadata.create_all(bind=engine, tables=[User.__table__])

app.include_router(auth.router)
app.include_router(surveillance.router)
app.include_router(countries.router)
app.include_router(outbreaks.router)
app.include_router(capacity.router)
app.include_router(boundaries.router)


@app.get("/")
def root():
    return {"message": "WHO AFRO Regional Surveillance Portal API", "docs": "/docs"}
