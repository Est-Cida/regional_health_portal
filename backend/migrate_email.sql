-- Migration: add email column and seed emails for all demo users
-- Run this in pgAdmin Query Tool or psql against the regional_surveillance database
-- psql: psql -U postgres -p 5433 -d regional_surveillance -f migrate_email.sql

-- Step 1: Add email column (safe to re-run — skips if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_users' AND column_name = 'email'
  ) THEN
    ALTER TABLE portal_users ADD COLUMN email VARCHAR;
    CREATE UNIQUE INDEX ix_portal_users_email ON portal_users (email);
    RAISE NOTICE 'email column added';
  ELSE
    RAISE NOTICE 'email column already exists, skipping';
  END IF;
END $$;

-- Step 2: Backfill emails for all existing demo users
UPDATE portal_users SET email = 'nga.admin@who.int'     WHERE username = 'nga_admin';
UPDATE portal_users SET email = 'gha.admin@who.int'     WHERE username = 'gha_admin';
UPDATE portal_users SET email = 'ken.admin@who.int'     WHERE username = 'ken_admin';
UPDATE portal_users SET email = 'zaf.admin@who.int'     WHERE username = 'zaf_admin';
UPDATE portal_users SET email = 'eth.admin@who.int'     WHERE username = 'eth_admin';
UPDATE portal_users SET email = 'cod.admin@who.int'     WHERE username = 'cod_admin';
UPDATE portal_users SET email = 'sen.admin@who.int'     WHERE username = 'sen_admin';
UPDATE portal_users SET email = 'cmr.admin@who.int'     WHERE username = 'cmr_admin';
UPDATE portal_users SET email = 'tza.admin@who.int'     WHERE username = 'tza_admin';
UPDATE portal_users SET email = 'uga.admin@who.int'     WHERE username = 'uga_admin';
UPDATE portal_users SET email = 'west.admin@who.int'    WHERE username = 'west_admin';
UPDATE portal_users SET email = 'central.admin@who.int' WHERE username = 'central_admin';
UPDATE portal_users SET email = 'east.admin@who.int'    WHERE username = 'east_admin';
UPDATE portal_users SET email = 'south.admin@who.int'   WHERE username = 'south_admin';
UPDATE portal_users SET email = 'super.admin@who.int'   WHERE username = 'super_admin';

-- Step 3: Verify — shows all users with their emails
SELECT username, email, role, country_code, subregion
FROM portal_users
ORDER BY role, username;
