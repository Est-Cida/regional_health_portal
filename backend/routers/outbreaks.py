from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import get_current_user
from models import User

router = APIRouter(prefix="/api/outbreaks", tags=["outbreaks"])


@router.get("/")
def list_outbreaks(
    iso3: str = Query(...),
    year: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "country_admin" and current_user.country_code != iso3:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    sql = "SELECT * FROM outbreaks WHERE iso_3_code = :iso3"
    params = {"iso3": iso3}
    if year:
        sql += " AND year = :year"
        params["year"] = year
    sql += " ORDER BY start_date DESC"

    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]
