import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import get_current_user
from models import User

router = APIRouter(prefix="/api/boundaries", tags=["boundaries"])


@router.get("/")
def get_afro_boundaries(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.execute(text("""
        SELECT iso_3_code, adm0_name,
               ST_AsGeoJSON(ST_SimplifyPreserveTopology(geometry, 0.01), 5) AS geom
        FROM admin_boundaries
        WHERE who_region = 'AFRO'
        ORDER BY iso_3_code
    """)).fetchall()

    features = [
        {
            "type": "Feature",
            "properties": {"iso3": row.iso_3_code, "name": row.adm0_name},
            "geometry": json.loads(row.geom),
        }
        for row in rows
    ]
    return {"type": "FeatureCollection", "features": features}
