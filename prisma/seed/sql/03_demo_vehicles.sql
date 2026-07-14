-- Demo vehicle inventory. Ported from sgivu-vehicle's R__demo_data.sql.
-- `vehicles`/`cars`/`motorcycles` were 3 JOINED tables in sgivu; here they are
-- ONE single-table `vehicles` with a `type` discriminator, so the CAR/MOTO
-- subtype columns (body_type/fuel_type/number_of_doors vs motorcycle_type)
-- are set directly on the same row instead of a second INSERT.
--
-- Deterministic demand model shared with 04_demo_purchase_sales.sql (and
-- originally with sgivu-ml's generate_contracts.py) so that
-- vehicle.id == purchase.id for every PURCHASE contract:
--   ventas_objetivo(s, mb) = max(1, round(
--       v_base[s] * v_seasonality[mes_calendario(now(), mb)]
--       * (1 + 0.005 * (v_horizon - mb))
--       * (0.85 + 0.30 * pseudo_random(s, mb))))
--   pseudo_random(s, mb) = ((s * 7919 + mb * 31337) % 1000) / 1000.0
--
-- Idempotente: TRUNCATE ... RESTART IDENTITY CASCADE (también vacía
-- vehicle_images y purchase_sales vía FK — purchase_sales se reinserta en
-- 04, que corre después). Ejecutar siempre en el orden 01 -> 02 -> 03 -> 04.
DO $$
DECLARE
    -- Catálogo de 39 segmentos: 19 motos (idx 1..19) + 20 autos (idx 20..39).
    v_brand text[] := ARRAY['Yamaha', 'Yamaha', 'Yamaha', 'Yamaha', 'Honda', 'Honda', 'Honda', 'Honda', 'Bajaj', 'Bajaj', 'Bajaj', 'Bajaj', 'Suzuki', 'Suzuki', 'Suzuki', 'Suzuki', 'Kawasaki', 'Kawasaki', 'Kawasaki', 'Mazda', 'Mazda', 'Mazda', 'Mazda', 'Hyundai', 'Hyundai', 'Hyundai', 'Hyundai', 'Chevrolet', 'Chevrolet', 'Chevrolet', 'Chevrolet', 'Renault', 'Renault', 'Renault', 'Renault', 'Ford', 'Ford', 'Ford', 'Ford'];
    v_model text[] := ARRAY['FZ 2.0', 'FZ 2.0', 'NMAX', 'R3', 'CB 190R', 'Wave 110', 'XR 150L', 'PCX 150', 'Pulsar 200NS', 'Boxer CT100', 'Discover 125', 'Dominar 400', 'Gixxer 155', 'GN 125', 'AX4', 'DR 650', 'Z400', 'Ninja 300', 'Versys 650', '3 Touring', '3 Touring', 'CX-5', '2 Sedan', 'i25', 'i25', 'Tucson', 'Elantra', 'Onix', 'Tracker', 'Sail', 'Spark GT', 'Logan', 'Sandero', 'Duster', 'Kwid', 'Fiesta', 'Fiesta', 'Ranger', 'Explorer'];
    v_line text[] := ARRAY['FZN-150', 'FZ-S', 'NMAX 155', 'R3 ABS', 'CBR-R', 'Wave Alpha', 'XR Work', 'PCX Deluxe', 'NS', 'CT100 KS', 'Discover', 'Dominar UG', 'Gixxer', 'GN125', 'AX4 Work', 'DR650 Rally', 'Z400 Naked', 'Ninja 300 KRT', 'Versys LT', 'Touring LX', 'Touring Sport', 'CX-5 Sport', '2 Prime', 'i25 GL', 'i25 Sedan', 'Tucson GLS', 'Elantra Value', 'Onix LT', 'Tracker LS', 'Sail LS', 'Spark GT LT', 'Logan Zen', 'Sandero Life', 'Duster Zen', 'Kwid Zen', 'Fiesta SE', 'Fiesta Titanium', 'Ranger XLS', 'Explorer XLT'];
    v_base int[] := ARRAY[6, 4, 4, 2, 5, 6, 3, 2, 4, 6, 4, 2, 3, 4, 2, 2, 2, 4, 2, 3, 4, 5, 2, 5, 4, 3, 2, 4, 3, 2, 3, 3, 4, 4, 2, 3, 2, 3, 4];
    v_seasonality numeric[] := ARRAY[0.70, 0.80, 0.95, 1.10, 1.20, 1.25, 1.10, 0.90, 0.75, 0.85, 1.05, 1.30];
    v_horizon int := 36;
    v_moto_cutoff int := 19;
    v_colors text[] := ARRAY['Blanco', 'Rojo', 'Azul', 'Gris', 'Negro', 'Plateado', 'Verde', 'Naranja'];
    v_cities text[] := ARRAY['Medellín', 'Bogotá', 'Cali', 'Barranquilla', 'Bucaramanga', 'Pereira', 'Cartagena', 'Manizales'];
    v_car_bodies text[] := ARRAY['SEDAN', 'HATCHBACK', 'SUV', 'WAGON'];
    v_car_fuels text[] := ARRAY['GASOLINA', 'DIESEL', 'HIBRIDO'];
    v_moto_types text[] := ARRAY['NAKED', 'SPORT', 'TOURING', 'SCOOTER', 'DUAL'];
    v_now timestamptz := NOW();
BEGIN
    PERFORM
        setseed(0.42);
    TRUNCATE vehicles RESTART IDENTITY CASCADE;
    INSERT INTO vehicles(id, type, brand, model, capacity, line, plate, motor_number, serial_number, chassis_number, color, city_registered, year, mileage, transmission, status, purchase_price, sale_price, body_type, fuel_type, number_of_doors, motorcycle_type, updated_at)
    WITH seg_month AS (
        SELECT
            s_idx,
            mb,
            v_base[s_idx] AS base,
((extract(month FROM v_now)::int - mb - 1) % 12 + 12) % 12 + 1 AS cal_month
        FROM
            generate_series(1, 39) AS s_idx,
            generate_series(1, v_horizon) AS mb),
        cell AS (
            SELECT
                s_idx,
                mb,
                base,
                GREATEST(1, ROUND(base * v_seasonality[cal_month] *(1.0 + 0.005 *(v_horizon - mb)) *(0.85 + 0.30 *(((s_idx * 7919 + mb * 31337) % 1000)::numeric / 1000.0))))::int AS n_sales
            FROM
                seg_month),
            expanded AS (
                SELECT
                    c.s_idx,
                    c.mb,
                    c.n_sales,
                    instance,
                    row_number() OVER (ORDER BY c.mb DESC, c.s_idx, instance) AS id
                FROM
                    cell c,
                    LATERAL generate_series(1, c.n_sales + 1) AS instance
)
            SELECT
                e.id,
(
                    CASE WHEN e.s_idx <= v_moto_cutoff THEN
                        'MOTORCYCLE'
                    ELSE
                        'CAR'
                    END)::"VehicleType",
                v_brand[e.s_idx],
                v_model[e.s_idx],
                CASE WHEN e.s_idx <= v_moto_cutoff THEN
                    2
                ELSE
                    5
                END,
                v_line[e.s_idx],
                'DEMO-' || lpad(e.id::text, 5, '0'),
                'MTR-' || lpad(e.id::text, 9, '0'),
                'SER-' || lpad(e.id::text, 9, '0'),
                'CHS-' || lpad(e.id::text, 9, '0'),
                v_colors[1 +(e.id % 8)],
            v_cities[1 +((e.id * 3) % 8)],
    2018 +(e.id % 8),
((e.id * 257) % 120000),
    CASE WHEN e.s_idx <= v_moto_cutoff THEN
        'MANUAL'
    WHEN (e.id % 2) = 0 THEN
        'AUTOMATICO'
    ELSE
        'MANUAL'
    END,
    -- instance ∈ [1, n_sales] → SOLD; instance = n_sales+1 → inventario.
(
        CASE WHEN e.instance <= e.n_sales THEN
            'SOLD'
        ELSE
            (ARRAY['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'IN_USE', 'IN_MAINTENANCE'])[1 +(e.id % 5)]
        END)::"VehicleStatus",
((
        CASE v_brand[e.s_idx]
        WHEN 'Yamaha' THEN
            12000000
        WHEN 'Honda' THEN
            12000000
        WHEN 'Bajaj' THEN
            9000000
        WHEN 'Suzuki' THEN
            11000000
        WHEN 'Kawasaki' THEN
            20000000
        WHEN 'Mazda' THEN
            45000000
        WHEN 'Hyundai' THEN
            40000000
        WHEN 'Chevrolet' THEN
            35000000
        WHEN 'Renault' THEN
            32000000
        WHEN 'Ford' THEN
            50000000
        END) *(0.85 + random() * 0.30))::numeric(12, 2),
((
        CASE v_brand[e.s_idx]
        WHEN 'Yamaha' THEN
            12000000
        WHEN 'Honda' THEN
            12000000
        WHEN 'Bajaj' THEN
            9000000
        WHEN 'Suzuki' THEN
            11000000
        WHEN 'Kawasaki' THEN
            20000000
        WHEN 'Mazda' THEN
            45000000
        WHEN 'Hyundai' THEN
            40000000
        WHEN 'Chevrolet' THEN
            35000000
        WHEN 'Renault' THEN
            32000000
        WHEN 'Ford' THEN
            50000000
        END) *(1.10 + random() * 0.25))::numeric(12, 2),
    -- Subtipo CAR (NULL para motos)
    CASE WHEN e.s_idx > v_moto_cutoff THEN
        v_car_bodies[1 +(e.id % 4)]
    END,
    CASE WHEN e.s_idx > v_moto_cutoff THEN
        v_car_fuels[1 +(e.id % 3)]
    END,
    CASE WHEN e.s_idx > v_moto_cutoff THEN
    (
        CASE WHEN v_car_bodies[1 +(e.id % 4)] = 'HATCHBACK' THEN
            5
        ELSE
            4
        END)
    END,
    -- Subtipo MOTORCYCLE (NULL para autos)
    CASE WHEN e.s_idx <= v_moto_cutoff THEN
        v_moto_types[1 +(e.id % 5)]
    END,
    v_now
FROM
    expanded e;
    PERFORM
        setval('vehicles_id_seq',(
                SELECT
                    COALESCE(MAX(id), 1)
                FROM vehicles));
END
$$;

