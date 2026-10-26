# Avances del proyecto

Este archivo cuenta, en lenguaje simple, qué se hizo hasta ahora en la app del
festival: qué funciona, cómo está organizado el código y qué falta.

Última actualización: etapa 5 de 11.

---

## 1. ¿Qué hace la app?

Son dos pantallas separadas para dos públicos distintos:

- **`/` — Registro público.** Cualquier persona completa sus datos y queda
  anotada para el evento. Se usa desde el celular, en la calle, con una mano.
- **`/staff` — Panel de staff.** Las personas de la organización (que tienen
  usuario y contraseña) ven la lista de anotados, buscan a alguien y, más
  adelante, le marcan la entrada como entregada.

La app no tiene servidor propio. Todo lo que es guardar y leer datos lo hace
**Supabase**, que es una base de datos Postgres con login incluido.

---

## 2. Lo que ya está hecho

### Etapa 1 — Base del proyecto

Creamos el proyecto con Vite + React en JavaScript puro (sin TypeScript) y
dejamos las tres rutas andando: `/`, `/staff/login` y `/staff`.

También agregamos un archivo `vercel.json` con una regla que hace que, al
recargar la página en `/staff`, no aparezca un error 404. Eso pasa porque la app
es de una sola página: el servidor tiene que devolver siempre el mismo
`index.html` y React se encarga de mostrar la pantalla correcta.

### Etapa 2 — Base de datos y seguridad

Acá está la parte más importante del proyecto. Como la clave que usa el
navegador es **pública** (cualquiera puede verla si abre el código de la
página), la seguridad no puede depender del frontend. Tiene que estar en la
base de datos.

Hicimos dos tablas:

- **`localities`**: la lista de localidades habilitadas para el evento.
- **`registrations`**: una fila por persona anotada.

Y configuramos tres cosas para que nadie pueda hacer de más:

1. **RLS (Row Level Security).** Son reglas por fila. El usuario anónimo
   (o sea, el navegador de cualquiera) **solo puede insertar**, y solo en
   estado inicial: no puede leer nada, no puede modificar nada, y no puede
   crearse una entrada ya marcada como entregada.
2. **Permisos por columna.** Aunque alguien tenga usuario de staff, no puede
   escribir `delivered_at`, `delivered_by`, `verified_at` ni `verified_by`.
   Esas cuatro columnas las completa la base de datos sola.
3. **Un trigger.** Es una función que se ejecuta automáticamente antes de cada
   modificación. Cuando el staff marca una entrada como entregada, el trigger
   escribe **quién** la entregó y **cuándo**, usando el usuario logueado. Así el
   dato no se puede falsificar desde el navegador.

Lo probamos de verdad contra la API, no solo leyendo el código: el usuario
anónimo recibe "permiso denegado" al intentar leer, el DNI repetido se rechaza,
y una localidad que no está en la lista también.

### Etapa 3 — Registro público

Es el formulario que ve la gente. Pide nombre y apellido, DNI, localidad, email
y domicilio (opcional).

Cosas que resolvimos y vale la pena contar:

- **Validación en vivo.** Al salir de un campo, si algo está mal, aparece el
  mensaje debajo de ese campo y no del formulario entero.
- **Los errores de la base se traducen a castellano.** Esto tuvo una vuelta
  interesante: Postgres devuelve el mismo código HTTP (409) tanto para "ese DNI
  ya existe" como para "esa localidad no existe". Si nos guiábamos por el código
  HTTP, le íbamos a mostrar el mensaje equivocado a la mitad de la gente. La
  solución fue mirar el **código de error de Postgres** (`23505` es DNI
  repetido, `23503` es localidad inválida) en vez del código HTTP.
- **Anti-spam sin backend.** El PRD prohíbe un servidor propio, así que no hay
  forma de poner un captcha de verdad (verificarlo requiere un servidor). Lo que
  sí hicimos: un campo trampa invisible para las personas, un control de tiempo
  mínimo de 3 segundos, y el captcha quedó como opción apagada en `config.js`.
- **El campo trampa tuvo un problema real.** Al principio se llamaba `company`
  con la etiqueta "Empresa". Ese es exactamente el nombre que el autocompletado
  de Chrome busca para rellenar la organización del usuario: una persona real
  con autocompletado activo habría quedado bloqueada sin entender por qué. Lo
  renombramos a algo que el navegador no reconoce.
- **Reintentos.** Si el envío falla por un problema de red, la app reintenta dos
  veces, esperando cada vez un poco más. Y si después de un reintento la base
  dice "ese DNI ya existe", el mensaje **no** afirma que el DNI es de otra
  persona: puede ser que el primer intento se haya guardado y se haya perdido
  solo la respuesta. En ese caso avisa que probablemente ya esté anotado.

### Etapa 4 — Login de staff

Pantalla de ingreso con email y contraseña, y una protección en `/staff`: si no
hay sesión, te manda al login.

Dos detalles que parecen menores y no lo son:

- **"Cargando…" antes de decidir.** Al recargar la página, la sesión tarda un
  instante en resolverse. Sin esperar ese instante, la app ve "no hay sesión" y
  te expulsa al login en cada recarga. Agregamos un estado de carga para
  esperar.
- **Si falla la comprobación de sesión, no te expulsa.** Te muestra un mensaje
  con un botón para recargar. Expulsarte sería mentirte: podés tener sesión y
  estar sin red un segundo.

### Etapa 5 — Panel de staff

La lista de personas anotadas, con:

- **Tres contadores**: Entregadas, Verificadas y Registradas.
- **Buscador** por nombre o DNI que ignora mayúsculas y acentos. Buscar `jose`
  encuentra a "José", y buscar `JOSE` también.
- **Orden útil**: primero las personas a las que les falta algo (entregar la
  entrada o verificar la localidad), y después por orden alfabético.
- **Tabla en la computadora, tarjetas en el celular**, usando el mismo marcado y
  cambiando solo el CSS.
- **Estados de carga, de error y de lista vacía**, con botón para reintentar.

---

## 3. Cómo está organizado el código

La idea es separar lo que se puede probar solo (funciones puras) de lo que
necesita el navegador.

| Archivo | Qué hace |
| --- | --- |
| `src/pages/Register.jsx` | Pantalla del registro público |
| `src/pages/StaffLogin.jsx` | Pantalla de ingreso |
| `src/pages/StaffPanel.jsx` | Panel con lista, buscador y contadores |
| `src/components/ProtectedRoute.jsx` | Protege `/staff` si no hay sesión |
| `src/lib/registration.js` | Validar, normalizar y traducir errores del registro |
| `src/lib/staff-auth.js` | Validar el login y traducir errores de Supabase Auth |
| `src/lib/staff-list.js` | Buscar, ordenar, contar y etiquetas del panel |
| `src/lib/useSession.js` | Saber si hay sesión, si está cargando y si falló |
| `src/lib/supabase.js` | Conexión con Supabase |
| `src/config.js` | Todo lo que cambia entre eventos: nombre, color, reglas |
| `supabase/schema.sql` | Las tablas, las reglas de seguridad y el trigger |

Los archivos `*.test.js` prueban las funciones de `src/lib`. No prueban
pantallas, prueban la lógica: por ejemplo, que `30.123.456` se convierta en
`30123456`, o que el error `23505` se traduzca al mensaje correcto.

---

## 4. Cómo probarlo

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env` a partir de `.env.example` y completarlo con la URL y
   la clave pública del proyecto de Supabase.

   > Ojo: ese archivo tiene que estar guardado **sin BOM**. Con BOM, Vite ignora
   > las variables sin avisar, el build sigue diciendo "ok" y la app queda en
   > blanco. Nos pasó y nos costó una hora encontrarlo.

3. Aplicar `supabase/schema.sql` en el SQL Editor de Supabase, una sola vez.

4. Crear a mano el usuario de staff en **Authentication → Users → Add user**,
   tildando **"Auto Confirm User"**. Sin esa tilde, el login rechaza al usuario
   para siempre.

5. Levantar el entorno:

   ```bash
   npm run dev
   ```

6. Correr los tests:

   ```bash
   npm test
   ```

---

## 5. Estado de las pruebas

| Prueba | Estado |
| --- | --- |
| Tests unitarios (`npm test`) | 37 de 37 |
| Build de producción (`npm run build`) | Funciona |
| Registro público desde el celular | Falta probar |
| Login de staff con usuario real | Falta probar |
| Tests de seguridad del PRD | 4 de 8 |
| Prueba de carga (100 usuarios) | Falta |
| Deploy en Vercel | Falta |

De los 8 tests de seguridad que pide el PRD, ya pasan cuatro: que el anónimo no
pueda leer, que sí pueda registrarse, que no pueda marcar entregas, y que una
localidad inexistente sea rechazada. Aparte comprobamos que un DNI repetido no
cree una segunda fila. Los otros cuatro necesitan un usuario de staff real
logueado.

---

## 6. Lo que falta

1. **Entregar entrada y deshacer.** El botón grande, con confirmación extra si
   la localidad todavía no está verificada.
2. **Verificar localidad.** Los botones "Localidad OK" y "Excepción", con nota
   obligatoria cuando hay excepción.
3. **Alta en puerta.** Registrar a alguien que llegó sin anotarse.
4. **Sincronización.** Que dos celulares del staff vean los cambios sin
   recargar.
5. **Deploy en Vercel.**
6. **Prueba de carga** con 100 usuarios simulados.

---

## 7. Problemas que encontramos y cómo los resolvimos

Los anotamos porque son la parte que más se aprende:

- **El `.env` con BOM.** PowerShell 5.1, con `Set-Content -Encoding utf8`,
  escribe tres bytes invisibles al principio del archivo. Vite entonces lee la
  primera variable con un nombre raro y la ignora. El build no falla: genera una
  app que no funciona. Desde ahí escribimos ese archivo con
  `[System.IO.File]::WriteAllText` y comprobamos que el build contenga un texto
  de la interfaz.
- **409 significa dos cosas distintas.** Ver el punto de los errores de la base,
  arriba.
- **`company` y el autocompletado.** Ver el punto del campo trampa.
- **Un modelo de IA que dejó de existir.** La revisión automática de código
  quedó trabada porque el modelo que usaban los revisores había sido retirado
  del catálogo. No era un problema del proyecto, era del entorno. Se cambió el
  modelo y la revisión terminó aprobada.
