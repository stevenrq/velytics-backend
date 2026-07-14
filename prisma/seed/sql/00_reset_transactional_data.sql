-- Runs before 01_demo_users.sql. Contracts reference users/clients/vehicles
-- with ON DELETE RESTRICT (a real business rule, not relaxed for seeding),
-- so re-running the seed on a non-fresh database must clear contracts FIRST
-- or the subsequent DELETE/TRUNCATE of users/clients/vehicles would fail
-- with a foreign-key violation.
TRUNCATE
    contract_status_history,
    purchase_sales
RESTART IDENTITY
CASCADE;

