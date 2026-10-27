-- ============================================================================
-- Migración: email → número de celular en el registro público
-- Ejecutar UNA sola vez en Supabase → SQL Editor sobre una base creada con la
-- versión anterior de schema.sql. Para una base nueva, alcanza con schema.sql.
-- ============================================================================

-- 1. Columna nueva. Queda nullable porque los registros históricos no tienen
--    celular; el formulario público lo exige igual.
alter table public.registrations
  add column if not exists phone text check (phone is null or phone ~ '^[0-9]{10}$');

-- 2. El registro público inserta phone y ya no inserta email.
revoke insert (email) on public.registrations from anon, authenticated;
grant insert (full_name, dni, phone, locality, address, dni_photo_url)
  on public.registrations to anon, authenticated;
