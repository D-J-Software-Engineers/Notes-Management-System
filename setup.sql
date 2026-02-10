-- ==========================================
-- Notes Management System Postgres Setup
-- ==========================================

-- 1. Create or reset the user
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'notes_admin') THEN
      CREATE USER notes_admin WITH LOGIN PASSWORD 'secure_password_123';
   ELSE
      ALTER USER notes_admin WITH PASSWORD 'secure_password_123';
   END IF;
END
$do$;

-- 2. Create the database (must be run as standalone - cannot be inside a DO block)
-- If you get "database already exists", that's fine - skip to step 3
CREATE DATABASE notes_management OWNER notes_admin;

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE notes_management TO notes_admin;
