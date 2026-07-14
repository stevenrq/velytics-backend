-- Demo clients: 350 clientes = 300 personas (ids 1..300) + 50 empresas
-- (ids 301..350). Ported from sgivu-client's R__demo_data.sql; personas y
-- empresas ahora viven en una única tabla `clients` con columna `type`.
--
-- Idempotente: TRUNCATE ... RESTART IDENTITY CASCADE antes de re-insertar
-- (también vacía purchase_sales vía FK — se reinsertan en 04, que corre
-- después). Ejecutar siempre en el orden 01 -> 02 -> 03 -> 04.
DO $$
BEGIN
       PERFORM
              setseed(0.42);
       TRUNCATE clients RESTART IDENTITY CASCADE;
       DELETE FROM addresses
       WHERE id BETWEEN 1 AND 350;
       -- ============================================================
       -- addresses: una dirección por cliente (ids 1..350)
       -- ============================================================
       INSERT INTO addresses(id, street, number, city)
       SELECT
              i,
              'Calle ' ||(10 +(i % 200)),
(1 +(i % 150))::text || '-' ||(1 +((i * 7) % 99))::text,
(ARRAY['Medellín', 'Bogotá', 'Cali', 'Barranquilla', 'Bucaramanga', 'Pereira', 'Cartagena', 'Manizales'])[1 +((i - 1) % 8)]
       FROM
              generate_series(1, 350) AS i;
       -- ============================================================
       -- clients: personas 1..300
       -- ============================================================
       INSERT INTO clients(id, type, address_id, phone_number, email, enabled, national_id, first_name, last_name, updated_at)
       SELECT
              i,
              'PERSON',
              i,
(3000000000 + i)::text,
              'client' || i || '@demo.velytics.local',
              TRUE,
(1010000000 + i)::text,
(ARRAY['María', 'Carlos', 'Laura', 'Ana', 'Andrés', 'Camila', 'Felipe', 'Sofía', 'Mateo', 'Daniel', 'Valentina', 'Javier', 'Luis', 'Isabella', 'Juan'])[1 +((i - 1) % 15)],
(ARRAY['García', 'Rodríguez', 'Martínez', 'Pérez', 'Gómez', 'Ramírez', 'Flores', 'Castro', 'Torres', 'Ruiz', 'Salazar', 'Fernández', 'Vargas', 'Silva', 'Morales'])[1 +((i * 7) % 15)],
              NOW()
       FROM
              generate_series(1, 300) AS i;
       -- ============================================================
       -- clients: empresas 301..350 (tax_id '9' + 9 dígitos, cabe en VARCHAR(10))
       -- ============================================================
       INSERT INTO clients(id, type, address_id, phone_number, email, enabled, tax_id, company_name, updated_at)
       SELECT
              i,
              'COMPANY',
              i,
(3000000000 + i)::text,
              'client' || i || '@demo.velytics.local',
              TRUE,
              '9' || lpad(i::text, 9, '0'),
              'Empresa Demo ' ||(i - 300),
              NOW()
       FROM
              generate_series(301, 350) AS i;
       PERFORM
              setval('addresses_id_seq', GREATEST((
                            SELECT
                                   MAX(id)
                            FROM addresses), 1));
       PERFORM
              setval('clients_id_seq', 350);
END
$$;

