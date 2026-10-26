// Lógica pura del login de staff: validación del formulario y traducción de
// los errores de Supabase Auth a mensajes en español. Sin React ni Supabase
// para poder testearla con `node --test`.

import { EMAIL_PATTERN, normalizeEmail } from './registration.js'

export const MESSAGES = {
  invalidCredentials: 'Email o contraseña incorrectos.',
  emailNotConfirmed: 'Este usuario todavía no confirmó el email. Avisá a la organización.',
  tooManyAttempts: 'Demasiados intentos. Esperá unos minutos y volvé a probar.',
  generic: 'No pudimos iniciar sesión. Intentá de nuevo.',
}

/**
 * Valida lo mínimo para no golpear el endpoint de Auth con un formulario
 * incompleto. La política de contraseñas la decide Supabase, así que acá no
 * se exige longitud: una contraseña correcta pero corta debe llegar al server.
 */
export function validateLogin({ email = '', password = '' } = {}) {
  const errors = {}

  const normalized = normalizeEmail(email)
  if (!normalized) {
    errors.email = 'Ingresá tu email.'
  } else if (!EMAIL_PATTERN.test(normalized)) {
    errors.email = 'Ingresá un email válido.'
  }

  if (!password) {
    errors.password = 'Ingresá tu contraseña.'
  }

  return errors
}

export function messageForAuthError(error) {
  const code = error?.code

  if (code === 'invalid_credentials') return MESSAGES.invalidCredentials
  if (code === 'email_not_confirmed') return MESSAGES.emailNotConfirmed
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') {
    return MESSAGES.tooManyAttempts
  }
  if (error?.status === 429) return MESSAGES.tooManyAttempts

  return MESSAGES.generic
}
