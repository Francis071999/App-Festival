-- ============================================================================
-- Festival — esquema de Supabase (v1)
-- Pegar completo en Supabase → SQL Editor y ejecutar UNA sola vez.
-- Si necesitás empezar de cero, borrá antes las tablas:
--   drop table if exists public.registrations;
--   drop table if exists public.localities;
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Localidades habilitadas para el evento
--    El cliente edita esta lista. Reemplazar los valores de ejemplo por las
--    localidades reales ANTES de abrir el registro público.
-- ----------------------------------------------------------------------------
create table public.localities (
  name text primary key
);

insert into public.localities (name) values
  ('LOCALIDAD 1'),
  ('LOCALIDAD 2');
-- ⚠️ Reemplazar por las localidades reales antes del evento.

-- ----------------------------------------------------------------------------
-- 2. Registros
-- ----------------------------------------------------------------------------
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  dni text not null unique check (dni ~ '^[0-9]{7,9}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'), -- legado: ya no se pide
  phone text check (phone is null or phone ~ '^[0-9]{10}$'),
  locality text not null references public.localities(name),
  address text check (address is null or char_length(address) <= 120),
  dni_photo_url text,
  ticket_delivered boolean not null default false,
  delivered_at timestamptz,
  delivered_by uuid references auth.users(id),
  locality_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  verify_note text check (verify_note is null or char_length(verify_note) <= 300),
  created_at timestamptz not null default now()
);

create index registrations_full_name_idx on public.registrations (lower(full_name));
create index registrations_locality_idx on public.registrations (locality);

-- ----------------------------------------------------------------------------
-- 3. Seguridad a nivel de fila y de columna
--    La anon key es pública: estas policies y estos grants son lo único que
--    separa los datos personales de cualquiera que tenga la key.
-- ----------------------------------------------------------------------------
alter table public.registrations enable row level security;
alter table public.localities enable row level security;

-- Público (anon): solo puede INSERTAR, y siempre en estado inicial
-- (sin entrega, sin verificación, sin foto de metadatos falsos)
create policy "anon can register"
on public.registrations
for insert
to anon
with check (
  ticket_delivered = false
  and delivered_at is null
  and delivered_by is null
  and locality_verified = false
  and verified_at is null
  and verified_by is null
);

-- Staff (authenticated): puede leer todo
create policy "staff can read"
on public.registrations
for select
to authenticated
using (true);

-- Staff (authenticated): puede registrar en puerta (alta en puerta)
create policy "staff can register walk-in"
on public.registrations
for insert
to authenticated
with check (
  ticket_delivered = false
  and delivered_at is null
  and delivered_by is null
);

-- Staff (authenticated): puede actualizar
create policy "staff can update"
on public.registrations
for update
to authenticated
using (true)
with check (true);

-- Localidades: cualquiera puede leer la lista habilitada (la necesita el select público)
create policy "anyone can read localities"
on public.localities
for select
to anon, authenticated
using (true);

-- Permisos a nivel tabla/columna
revoke all on public.registrations from anon, authenticated;
grant insert (full_name, dni, phone, locality, address, dni_photo_url) on public.registrations to anon;
grant insert (full_name, dni, phone, locality, address, dni_photo_url) on public.registrations to authenticated;
grant select on public.registrations to authenticated;
-- El staff NO puede escribir delivered_at/delivered_by ni verified_at/verified_by:
-- los completa el trigger. No hay grant sobre esas columnas.
grant update (ticket_delivered, locality_verified, verify_note, locality, address) on public.registrations to authenticated;

revoke all on public.localities from anon, authenticated;
grant select on public.localities to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Trigger: la base decide quién y cuándo entregó/verificó.
--    El frontend nunca envía delivered_at/delivered_by/verified_at/verified_by.
-- ----------------------------------------------------------------------------
create or replace function public.set_staff_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Datos de entrega
  if new.ticket_delivered is distinct from old.ticket_delivered then
    if new.ticket_delivered = true then
      new.delivered_by := auth.uid();
      new.delivered_at := now();
    else
      -- Deshacer entrega: limpiar los datos
      new.delivered_by := null;
      new.delivered_at := null;
    end if;
  else
    -- Si no cambió el estado, no permitir tocar quién/cuándo entregó
    new.delivered_by := old.delivered_by;
    new.delivered_at := old.delivered_at;
  end if;

  -- Datos de verificación de localidad
  if new.locality_verified is distinct from old.locality_verified then
    if new.locality_verified = true then
      new.verified_by := auth.uid();
      new.verified_at := now();
    else
      -- Desmarcar verificación: limpiar los datos
      new.verified_by := null;
      new.verified_at := null;
    end if;
  else
    new.verified_by := old.verified_by;
    new.verified_at := old.verified_at;
  end if;

  return new;
end;
$$;

create trigger trg_set_staff_metadata
before update on public.registrations
for each row execute function public.set_staff_metadata();

-- ----------------------------------------------------------------------------
-- 5. Realtime: solo el staff se suscribe. El registro público es un insert
--    REST simple y no abre conexiones Realtime.
--    Configurarlo también desde el Dashboard:
--    Database → Replication → supabase_realtime → agregar registrations.
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.registrations;
