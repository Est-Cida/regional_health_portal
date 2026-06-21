from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import get_current_user
from models import User

router = APIRouter(prefix="/api/countries", tags=["countries"])


@router.get("/")
def list_countries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "country_admin":
        rows = db.execute(
            text("SELECT * FROM countries WHERE iso_3_code = :code"),
            {"code": current_user.country_code},
        ).mappings().all()
    elif current_user.role == "regional_admin":
        rows = db.execute(
            text("SELECT * FROM countries WHERE afro_subregion = :sub ORDER BY country_name"),
            {"sub": current_user.subregion},
        ).mappings().all()
    else:
        rows = db.execute(
            text("SELECT * FROM countries ORDER BY afro_subregion, country_name"),
        ).mappings().all()

    return [dict(r) for r in rows]


@router.get("/{iso3}")
def get_country(
    iso3: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "country_admin" and current_user.country_code != iso3:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    row = db.execute(
        text("SELECT * FROM countries WHERE iso_3_code = :iso3"),
        {"iso3": iso3},
    ).mappings().first()

    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Country not found")

    return dict(row)
