-- =============================================================================
-- UAS Fleet Management ERP — Database Initialization Script
-- =============================================================================
-- This script runs automatically when the PostgreSQL container starts for the
-- first time. It implements the "Database-per-Service" pattern by creating
-- isolated databases for each microservice.
--
-- HOW IT WORKS:
-- PostgreSQL's official Docker image executes all .sql files found in
-- /docker-entrypoint-initdb.d/ during the first container initialization.
-- The default database (postgres) is created automatically; this script
-- creates the additional per-service databases.
--
-- NOTE: The POSTGRES_USER defined in .env is automatically created as a
-- superuser by the Docker entrypoint, so we don't need to CREATE USER here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. auth_db — Stores user accounts, roles, permissions, and JWT tokens
-- ---------------------------------------------------------------------------
CREATE DATABASE auth_db
    WITH OWNER = CURRENT_USER
         ENCODING = 'UTF8'
         LC_COLLATE = 'en_US.utf8'
         LC_CTYPE = 'en_US.utf8'
         TEMPLATE = template0;

COMMENT ON DATABASE auth_db IS 'Authentication & Authorization service database — IAM, JWT, RBAC';

-- ---------------------------------------------------------------------------
-- 2. fleet_db — Stores UAV master data, specs, and maintenance records
-- ---------------------------------------------------------------------------
CREATE DATABASE fleet_db
    WITH OWNER = CURRENT_USER
         ENCODING = 'UTF8'
         LC_COLLATE = 'en_US.utf8'
         LC_CTYPE = 'en_US.utf8'
         TEMPLATE = template0;

COMMENT ON DATABASE fleet_db IS 'Fleet Management service database — UAV registry, specs, maintenance';

-- ---------------------------------------------------------------------------
-- 3. order_db — Stores logistics orders and delivery lifecycle
-- ---------------------------------------------------------------------------
CREATE DATABASE order_db
    WITH OWNER = CURRENT_USER
         ENCODING = 'UTF8'
         LC_COLLATE = 'en_US.utf8'
         LC_CTYPE = 'en_US.utf8'
         TEMPLATE = template0;

COMMENT ON DATABASE order_db IS 'Order Management service database — logistics orders, routing, assignments';

-- ---------------------------------------------------------------------------
-- 4. report_db — Stores flight history and operational summaries
-- ---------------------------------------------------------------------------
CREATE DATABASE report_db
    WITH OWNER = CURRENT_USER
         ENCODING = 'UTF8'
         LC_COLLATE = 'en_US.utf8'
         LC_CTYPE = 'en_US.utf8'
         TEMPLATE = template0;

COMMENT ON DATABASE report_db IS 'Reporting service database — flight history, operational analytics';

-- =============================================================================
-- Verification: List all created databases
-- =============================================================================
\echo '======================================================================'
\echo 'UAS Fleet ERP — Database initialization complete!'
\echo 'Created databases: auth_db, fleet_db, order_db, report_db'
\echo '======================================================================'
\l
