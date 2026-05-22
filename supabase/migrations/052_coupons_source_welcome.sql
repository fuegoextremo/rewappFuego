-- Extender el CHECK constraint de coupons.source para incluir 'welcome'
-- El constraint original solo permitía: roulette, streak, manual
ALTER TABLE public.coupons
  DROP CONSTRAINT coupons_source_check,
  ADD CONSTRAINT coupons_source_check
    CHECK (source = ANY (ARRAY['roulette'::text, 'streak'::text, 'manual'::text, 'welcome'::text]));
