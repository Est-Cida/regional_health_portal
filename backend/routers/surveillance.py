from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import get_current_user
from models import User

router = APIRouter(prefix="/api/surveillance", tags=["surveillance"])


def _country_filter(user: User, iso3: str | None):
    """Return (iso3_to_use, error_or_None). Enforces role-based access."""
    if user.role == "country_admin":
        return user.country_code, None
    if user.role == "regional_admin":
        # Must be a country in their subregion — validated by the caller
        return iso3, None
    return iso3, None  # super_admin: anything goes


@router.get("/summary")
def surveillance_summary(
    iso3: str = Query(..., description="ISO-3 country code"),
    year: int = Query(2024),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce access
    if current_user.role == "country_admin" and current_user.country_code != iso3:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied for this country")

    rows = db.execute(
        text("""
            SELECT disease, cases_reported, deaths_reported,
                   attack_rate_per_100k, case_fatality_ratio_pct
            FROM disease_surveillance
            WHERE iso_3_code = :iso3 AND year = :year
            ORDER BY cases_reported DESC
        """),
        {"iso3": iso3, "year": year},
    ).mappings().all()

    breakdown = [dict(r) for r in rows]
    total_cases = sum(r["cases_reported"] for r in breakdown)
    total_deaths = sum(r["deaths_reported"] for r in breakdown)
    n = len(breakdown)

    return {
        "iso3": iso3,
        "year": year,
        "total_cases": total_cases,
        "total_deaths": total_deaths,
        "avg_attack_rate": round(sum(r["attack_rate_per_100k"] for r in breakdown) / n, 3) if n else 0,
        "avg_cfr": round(sum(r["case_fatality_ratio_pct"] for r in breakdown) / n, 2) if n else 0,
        "disease_breakdown": breakdown,
    }


@router.get("/trend")
def surveillance_trend(
    iso3: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "country_admin" and current_user.country_code != iso3:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    rows = db.execute(
        text("""
            SELECT year,
                   SUM(cases_reported)  AS total_cases,
                   SUM(deaths_reported) AS total_deaths
            FROM disease_surveillance
            WHERE iso_3_code = :iso3
            GROUP BY year
            ORDER BY year
        """),
        {"iso3": iso3},
    ).mappings().all()

    return [dict(r) for r in rows]


@router.get("/region-summary")
def region_summary(
    subregion: str = Query(...),
    year: int = Query(2024),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "country_admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "regional_admin" and current_user.subregion != subregion:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied for this region")

    rows = db.execute(
        text("""
            SELECT c.iso_3_code, c.country_name,
                   COALESCE(SUM(ds.cases_reported), 0)  AS total_cases,
                   COALESCE(SUM(ds.deaths_reported), 0) AS total_deaths
            FROM countries c
            LEFT JOIN disease_surveillance ds
              ON ds.iso_3_code = c.iso_3_code AND ds.year = :year
            WHERE c.afro_subregion = :subregion
            GROUP BY c.iso_3_code, c.country_name
            ORDER BY total_cases DESC
        """),
        {"subregion": subregion, "year": year},
    ).mappings().all()

    return [dict(r) for r in rows]
