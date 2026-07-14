-- Demo users (empleados "responsable2".."responsable16"). Ported from
-- sgivu-user's R__seed_data.sql. Requires the RBAC roles (ADMIN/USER) and the
-- bootstrap admin user (id 1 on a fresh database) to already exist — the
-- seed runner guarantees this by reconciling RBAC before running this file.
--
-- Convención de ids (heredada de sgivu, ahora en una sola BD):
--   users: 1 (admin bootstrap) .. 16 (responsables 2..16)
-- Idempotente: borra el rango 2..16 antes de re-insertar.
-- Todo el archivo es un único statement (DO $$ ... $$) para que funcione con
-- $executeRawUnsafe sin depender de soporte multi-statement del driver.
DO $$
BEGIN
    DELETE FROM users_roles
    WHERE user_id BETWEEN 2 AND 16;
    DELETE FROM users
    WHERE id BETWEEN 2 AND 16;
    -- Direcciones de clientes ocupan 1..350 (02_demo_clients.sql); estas
    -- 15 direcciones de usuarios demo van justo después para no chocar.
    DELETE FROM addresses
    WHERE id BETWEEN 351 AND 365;
    INSERT INTO addresses(id, street, number, city)
    SELECT
        350 +(i - 1),
        'Calle ' ||(90 + i),
(10 + i) || '-' ||(20 + i),
        'Montería'
    FROM
        generate_series(2, 16) AS i;
    INSERT INTO users(id, national_id, first_name, last_name, phone_number, email, username, password, enabled, address_id, updated_at)
    SELECT
        i,
(1000000000 + i)::text,
(ARRAY['Javier', 'David', 'Luis', 'Daniel', 'Andrea', 'Pedro', 'Laura', 'Felipe', 'Sara', 'Manuel', 'Carmen', 'Veronica', 'Oscar', 'Paula', 'Camila'])[i - 1],
(ARRAY['Perez', 'Ramirez', 'Gonzalez', 'Flores', 'Camacho', 'Cardenas', 'Silva', 'Andrade', 'Rios', 'Rojas', 'Ruiz', 'Duarte', 'Castillo', 'Mendez', 'Torres'])[i - 1],
(3001000000 + i)::text,
        'responsable' || i || '@velytics.local',
        'responsable' || i,
        -- bcrypt($2b$12$, cost 12) de la contraseña 'Passw0rd1!' — misma
        -- clave para los 15 usuarios demo, solo para pruebas locales.
        '$2b$12$is5BcgmJA4C31/D6qCsCpOJDibiT/171K8mI2bwJZtbYKTXbqptwa',
        TRUE,
        350 +(i - 1),
        NOW()
    FROM
        generate_series(2, 16) AS i;
    -- Todos reciben USER; 2..9 también reciben ADMIN (paridad con sgivu).
    INSERT INTO users_roles(user_id, role_id)
    SELECT
        i,
(
            SELECT
                id
            FROM
                roles
            WHERE
                name = 'USER')
    FROM
        generate_series(2, 16) AS i
UNION ALL
SELECT
    i,
(
        SELECT
            id
        FROM
            roles
        WHERE
            name = 'ADMIN')
FROM
    generate_series(2, 9) AS i;
    PERFORM
        setval('addresses_id_seq', GREATEST((
                SELECT
                    MAX(id)
                FROM addresses), 1));
    PERFORM
        setval('users_id_seq', GREATEST((
                SELECT
                    MAX(id)
                FROM users), 1));
END
$$;

