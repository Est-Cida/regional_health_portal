from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import get_current_user
from models import User

router = APIRouter(prefix="/api/capacity", tags=["capacity"])


def _check_country_access(user: User, iso3: str):
    if user.role == "country_admin" and user.country_code != iso3:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")


@router.get("/labs")
def lab_capacity(
    iso3: str = Query(...),
    year: int = Query(2024),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_country_access(current_user, iso3)
    row = db.execute(
        text("SELECT * FROM laboratory_capacity WHERE iso_3_code = :iso3 AND year = :year"),
        {"iso3": iso3, "year": year},
    ).mappings().first()
    return dict(row) if row else {}


@router.get("/reporting")
def reporting_metrics(
    iso3: str = Query(...),
    year: int = Query(2024),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_country_access(current_user, iso3)
    row = db.execute(
        text("SELECT * FROM reporting_metrics WHERE iso_3_code = :iso3 AND year = :year"),
        {"iso3": iso3, "year": year},
    ).mappings().first()
    return dict(row) if row else {}


@router.get("/workforce")
def workforce(
    iso3: str = Query(...),
    year: int = Query(2024),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_country_access(current_user, iso3)
    row = db.execute(
        text("SELECT * FROM workforce WHERE iso_3_code = :iso3 AND year = :year"),
        {"iso3": iso3, "year": year},
    ).mappings().first()
    return dict(row) if row else {}


@router.get("/funding")
def funding(
    iso3: str = Query(...),
    year: int = Query(2024),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_country_access(current_user, iso3)
    row = db.execute(
        text("SELECT * FROM funding WHERE iso_3_code = :iso3 AND year = :year"),
        {"iso3": iso3, "year": year},
    ).mappings().first()
    return dict(row) if row else {}


@router.get("/population")
def population(
    iso3: str = Query(...),
    year: int = Query(2024),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_country_access(current_user, iso3)
    row = db.execute(
        text("SELECT * FROM population WHERE iso_3_code = :iso3 AND year = :year"),
        {"iso3": iso3, "year": year},
    ).mappings().first()
    return dict(row) if row else {}
