"""
Run once to create the portal_users table and seed demo accounts.
  python seed_users.py
"""
from database import engine, Base, SessionLocal
from models import User
from auth import hash_password
import sqlalchemy as sa

USERS = [
    # Country admins
    {"username": "nga_admin",     "email": "nga.admin@who.int",     "full_name": "Nigeria Admin",           "role": "country_admin",  "country_code": "NGA", "subregion": None},
    {"username": "gha_admin",     "email": "gha.admin@who.int",     "full_name": "Ghana Admin",             "role": "country_admin",  "country_code": "GHA", "subregion": None},
    {"username": "ken_admin",     "email": "ken.admin@who.int",     "full_name": "Kenya Admin",             "role": "country_admin",  "country_code": "KEN", "subregion": None},
    {"username": "zaf_admin",     "email": "zaf.admin@who.int",     "full_name": "South Africa Admin",      "role": "country_admin",  "country_code": "ZAF", "subregion": None},
    {"username": "eth_admin",     "email": "eth.admin@who.int",     "full_name": "Ethiopia Admin",          "role": "country_admin",  "country_code": "ETH", "subregion": None},
    {"username": "cod_admin",     "email": "cod.admin@who.int",     "full_name": "DR Congo Admin",          "role": "country_admin",  "country_code": "COD", "subregion": None},
    {"username": "sen_admin",     "email": "sen.admin@who.int",     "full_name": "Senegal Admin",           "role": "country_admin",  "country_code": "SEN", "subregion": None},
    {"username": "cmr_admin",     "email": "cmr.admin@who.int",     "full_name": "Cameroon Admin",          "role": "country_admin",  "country_code": "CMR", "subregion": None},
    {"username": "tza_admin",     "email": "tza.admin@who.int",     "full_name": "Tanzania Admin",          "role": "country_admin",  "country_code": "TZA", "subregion": None},
    {"username": "uga_admin",     "email": "uga.admin@who.int",     "full_name": "Uganda Admin",            "role": "country_admin",  "country_code": "UGA", "subregion": None},
    # Regional admins
    {"username": "west_admin",    "email": "west.admin@who.int",    "full_name": "West Africa Regional",    "role": "regional_admin", "country_code": None,  "subregion": "West"},
    {"username": "central_admin", "email": "central.admin@who.int", "full_name": "Central Africa Regional", "role": "regional_admin", "country_code": None,  "subregion": "Central"},
    {"username": "east_admin",    "email": "east.admin@who.int",    "full_name": "East Africa Regional",    "role": "regional_admin", "country_code": None,  "subregion": "East"},
    {"username": "south_admin",   "email": "south.admin@who.int",   "full_name": "Southern Africa Regional","role": "regional_admin", "country_code": None,  "subregion": "Southern"},
    # Super admin
    {"username": "super_admin",   "email": "super.admin@who.int",   "full_name": "Super Administrator",     "role": "super_admin",    "country_code": None,  "subregion": None},
]

DEFAULT_PASSWORD = "password123"


if __name__ == "__main__":
    # Create tables (adds email column if schema changed)
    Base.metadata.create_all(bind=engine)

    # Add email column to existing table if it doesn't exist yet
    with engine.connect() as conn:
        try:
            conn.execute(sa.text("ALTER TABLE portal_users ADD COLUMN email VARCHAR UNIQUE"))
            conn.commit()
            print("Added email column to portal_users")
        except Exception:
            pass  # Column already exists

    db = SessionLocal()
    try:
        for u in USERS:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if existing:
                # Backfill email if missing
                if not existing.email:
                    existing.email = u["email"]
                    db.commit()
                    print(f"  Updated email for: {u['username']}")
                else:
                    print(f"  Skipped (exists): {u['username']}")
                continue
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=hash_password(DEFAULT_PASSWORD),
                full_name=u["full_name"],
                role=u["role"],
                country_code=u["country_code"],
                subregion=u["subregion"],
            )
            db.add(user)
        db.commit()
        print(f"\nSeeded {len(USERS)} users. Default password: {DEFAULT_PASSWORD}")
    finally:
        db.close()
