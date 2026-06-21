"""
Migration: add email column to portal_users and backfill all demo users.
Run from the backend/ directory:
  python migrate_email.py
"""
import os
import sys
from database import engine, SessionLocal
from models import User
from auth import hash_password
import sqlalchemy as sa

EMAILS = {
    "nga_admin":     "nga.admin@who.int",
    "gha_admin":     "gha.admin@who.int",
    "ken_admin":     "ken.admin@who.int",
    "zaf_admin":     "zaf.admin@who.int",
    "eth_admin":     "eth.admin@who.int",
    "cod_admin":     "cod.admin@who.int",
    "sen_admin":     "sen.admin@who.int",
    "cmr_admin":     "cmr.admin@who.int",
    "tza_admin":     "tza.admin@who.int",
    "uga_admin":     "uga.admin@who.int",
    "west_admin":    "west.admin@who.int",
    "central_admin": "central.admin@who.int",
    "east_admin":    "east.admin@who.int",
    "south_admin":   "south.admin@who.int",
    "super_admin":   "super.admin@who.int",
}

DEFAULT_PASSWORD = "password123"

USERS = [
    {"username": "nga_admin",     "full_name": "Nigeria Admin",           "role": "country_admin",  "country_code": "NGA", "subregion": None},
    {"username": "gha_admin",     "full_name": "Ghana Admin",             "role": "country_admin",  "country_code": "GHA", "subregion": None},
    {"username": "ken_admin",     "full_name": "Kenya Admin",             "role": "country_admin",  "country_code": "KEN", "subregion": None},
    {"username": "zaf_admin",     "full_name": "South Africa Admin",      "role": "country_admin",  "country_code": "ZAF", "subregion": None},
    {"username": "eth_admin",     "full_name": "Ethiopia Admin",          "role": "country_admin",  "country_code": "ETH", "subregion": None},
    {"username": "cod_admin",     "full_name": "DR Congo Admin",          "role": "country_admin",  "country_code": "COD", "subregion": None},
    {"username": "sen_admin",     "full_name": "Senegal Admin",           "role": "country_admin",  "country_code": "SEN", "subregion": None},
    {"username": "cmr_admin",     "full_name": "Cameroon Admin",          "role": "country_admin",  "country_code": "CMR", "subregion": None},
    {"username": "tza_admin",     "full_name": "Tanzania Admin",          "role": "country_admin",  "country_code": "TZA", "subregion": None},
    {"username": "uga_admin",     "full_name": "Uganda Admin",            "role": "country_admin",  "country_code": "UGA", "subregion": None},
    {"username": "west_admin",    "full_name": "West Africa Regional",    "role": "regional_admin", "country_code": None,  "subregion": "West"},
    {"username": "central_admin", "full_name": "Central Africa Regional", "role": "regional_admin", "country_code": None,  "subregion": "Central"},
    {"username": "east_admin",    "full_name": "East Africa Regional",    "role": "regional_admin", "country_code": None,  "subregion": "East"},
    {"username": "south_admin",   "full_name": "Southern Africa Regional","role": "regional_admin", "country_code": None,  "subregion": "Southern"},
    {"username": "super_admin",   "full_name": "Super Administrator",     "role": "super_admin",    "country_code": None,  "subregion": None},
]

def main():
    # Step 1: Add email column if it doesn't exist
    with engine.connect() as conn:
        try:
            conn.execute(sa.text("ALTER TABLE portal_users ADD COLUMN email VARCHAR"))
            conn.commit()
            print("✓ Added email column")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("  email column already exists, skipping ALTER")
            else:
                print(f"  ALTER TABLE warning: {e}")

        # Add unique index separately (won't fail if index already exists)
        try:
            conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_portal_users_email ON portal_users (email)"))
            conn.commit()
            print("✓ Created unique index on email")
        except Exception as e:
            print(f"  Index warning: {e}")

    # Step 2: Upsert users with emails
    db = SessionLocal()
    created = 0
    updated = 0
    try:
        for u in USERS:
            email = EMAILS[u["username"]]
            existing = db.query(User).filter(User.username == u["username"]).first()
            if existing:
                existing.email = email
                updated += 1
            else:
                db.add(User(
                    username=u["username"],
                    email=email,
                    hashed_password=hash_password(DEFAULT_PASSWORD),
                    full_name=u["full_name"],
                    role=u["role"],
                    country_code=u["country_code"],
                    subregion=u["subregion"],
                ))
                created += 1
        db.commit()
        print(f"✓ {created} users created, {updated} users updated with email")
    finally:
        db.close()

    # Step 3: Verify
    db = SessionLocal()
    try:
        rows = db.query(User.username, User.email, User.role).all()
        print("\nCurrent portal_users:")
        print(f"  {'USERNAME':<20} {'EMAIL':<35} {'ROLE'}")
        print(f"  {'-'*20} {'-'*35} {'-'*15}")
        for r in rows:
            print(f"  {r.username:<20} {r.email or '(no email)':<35} {r.role}")
    finally:
        db.close()

    print("\nDone. All users can now log in with their @who.int email + password123")

if __name__ == "__main__":
    main()
