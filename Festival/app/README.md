# Festival — app

Registro público de asistentes y panel de staff para controlar la entrega de entradas. React + Vite (JavaScript puro) sobre Supabase, pensado para celular y desplegado en Vercel.

## Requisitos

- Node.js 20 o superior
- Un proyecto de Supabase (plan gratuito)

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env` a partir de `.env.example` y completar con los datos de **Supabase → Project Settings → API Keys**:

   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```

   En `VITE_SUPABASE_ANON_KEY` va la **publishable key** (`sb_publishable_...`) o, si el proyecto todavía tiene la legacy, la `anon key` (`eyJ...`). Las dos son públicas y están protegidas por RLS. **Nunca** la secret key (`sb_secret_...`) ni la `service_role`: esas bypassean RLS.

3. Aplicar el esquema: abrir **Supabase → SQL Editor**, pegar el contenido completo de [`supabase/schema.sql`](supabase/schema.sql) y ejecutarlo una sola vez. Después, reemplazar las localidades de ejemplo por las reales:

   ```sql
   delete from public.localities;
   insert into public.localities (name) values ('Localidad real 1'), ('Localidad real 2');
   ```

4. Desactivar el alta pública de usuarios en **Authentication → Sign In / Providers → Email**: apagar "Allow new users to sign up".

5. Crear a mano los usuarios del staff en **Authentication → Users → Add user**, con "Auto Confirm User" activado.

6. Levantar el entorno local:

   ```bash
   npm run dev
   ```

   Rutas: `/` (registro público), `/staff/login` (ingreso de staff), `/staff` (panel).

## Configuración del evento

Todo lo que cambia entre eventos vive en [`src/config.js`](src/config.js): nombre, logo, color de acento, modo de verificación de localidad (`strict` / `flexible`), captcha y foto del DNI.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build para probarlo |

## Seguridad

- Los datos personales están protegidos por RLS y por grants a nivel de columna: el usuario anónimo solo puede insertar registros en estado inicial, y no puede leer nada.
- `delivered_at`, `delivered_by`, `verified_at` y `verified_by` los completa un trigger en la base, nunca el cliente.
- Los 8 tests de curl del PRD (§14) deben pasar antes de considerar el deploy terminado.

## Deploy

Ver la sección de deploy en el README de la raíz del repo (se completa en la etapa de despliegue).
