// Lógica pura del registro: normalización, validación y traducción de errores
// de Postgres a mensajes para la persona que se registra.
// Sin dependencias de React ni de Supabase para que sea fácil de testear.

export const MESSAGES = {
  success: '¡Listo, quedaste registrado!',
  duplicateDni: 'Este DNI ya está registrado.',
  invalidLocality: 'Elegí una localidad de la lista.',
  generic: 'Ocurrió un error. Intentá de nuevo en unos minutos.',
  busy: 'Estamos recibiendo muchos registros, esperá unos segundos e intentá de nuevo.',
  tooFast: 'El envío fue demasiado rápido. Esperá unos segundos e intentá de nuevo.',
  localitiesUnavailable: 'No pudimos cargar las localidades. Recargá la página.',
  noLocalities: 'Todavía no hay localidades habilitadas. Consultá con la organización.',
}

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const normalizeName = (value = '') => value.trim().replace(/\s+/g, ' ')

export const normalizeDni = (value = '') => value.replace(/\D/g, '').slice(0, 9)

export const normalizeEmail = (value = '') => value.trim().toLowerCase()

export const normalizeAddress = (value = '') => value.trim()

/**
 * Valida los campos del formulario público.
 * Devuelve un objeto con los nombres de campo que fallaron.
 */
export function validateRegistration(values) {
  const errors = {}

  const fullName = normalizeName(values.fullName)
  if (!fullName) {
    errors.fullName = 'Ingresá tu nombre y apellido.'
  } else if (fullName.length < 2) {
    errors.fullName = 'El nombre debe tener al menos 2 caracteres.'
  } else if (fullName.length > 120) {
    errors.fullName = 'El nombre no puede superar los 120 caracteres.'
  }

  const dni = normalizeDni(values.dni)
  if (!dni) {
    errors.dni = 'Ingresá tu DNI.'
  } else if (!/^\d{7,9}$/.test(dni)) {
    errors.dni = 'El DNI debe tener entre 7 y 9 dígitos, sin puntos.'
  }

  if (!values.locality) {
    errors.locality = 'Elegí tu localidad.'
  }

  const email = normalizeEmail(values.email)
  if (!email) {
    errors.email = 'Ingresá tu email.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Ingresá un email válido.'
  }

  const address = normalizeAddress(values.address)
  if (address.length > 120) {
    errors.address = 'El domicilio no puede superar los 120 caracteres.'
  }

  return errors
}

/**
 * Arma el payload que se envía a Supabase con los valores ya normalizados.
 * `address` va como null cuando está vacío.
 */
export function buildRegistrationPayload(values) {
  return {
    full_name: normalizeName(values.fullName),
    dni: normalizeDni(values.dni),
    email: normalizeEmail(values.email),
    locality: values.locality,
    address: normalizeAddress(values.address) || null,
  }
}

/**
 * Traduce el error de un insert a un mensaje en español.
 * Se mapea por `code` y no por status HTTP: PostgREST devuelve 409 tanto para
 * la violación de clave foránea (23503) como para la de unicidad (23505).
 */
export function messageForInsertError(error) {
  const code = error?.code

  if (code === '23505') return MESSAGES.duplicateDni
  if (code === '23503') return MESSAGES.invalidLocality
  if (code === '429' || error?.status === 429) return MESSAGES.busy

  return MESSAGES.generic
}

/**
 * Detecta fallas de red, donde no llegó a haber respuesta del servidor.
 * En ese caso tiene sentido un reintento automático.
 */
export function isNetworkError(error) {
  if (!error) return false
  if (error.code) return false
  return /failed to fetch|networkerror|load failed|network request failed|timeout/i.test(
    error.message ?? '',
  )
}
