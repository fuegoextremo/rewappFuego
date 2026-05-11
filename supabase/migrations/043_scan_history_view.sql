-- Vista unificada de historial de escaneos: check-ins + redemptions en un solo stream
-- ordenado cronológicamente. Permite paginación global correcta con OFFSET/LIMIT.
--
-- Por qué una vista: paginación desde la app sobre dos tablas independientes
-- produce offsets incorrectos (cada tabla se pagina por separado y luego se mezcla).
-- La vista hace el UNION ALL en la base de datos, dejando que Postgres ordene
-- y pagine sobre el conjunto completo antes de devolver filas.

CREATE OR REPLACE VIEW scan_history AS
  SELECT
    id,
    created_at                AS timestamp,
    'checkin'::text           AS type,
    user_id,
    verified_by               AS verified_by_id,
    branch_id,
    NULL::uuid                AS prize_id,
    NULL::text                AS coupon_code
  FROM check_ins

  UNION ALL

  SELECT
    id,
    redeemed_at               AS timestamp,
    'redemption'::text        AS type,
    user_id,
    redeemed_by               AS verified_by_id,
    branch_id,
    prize_id,
    unique_code               AS coupon_code
  FROM coupons
  WHERE redeemed_at IS NOT NULL;

-- Comentario: esta vista no requiere RLS propia porque el acceso se hace
-- siempre con el admin client (service_role), que bypasea RLS.
-- Si en el futuro se expone con el anon client, agregar RLS sobre las tablas base.
