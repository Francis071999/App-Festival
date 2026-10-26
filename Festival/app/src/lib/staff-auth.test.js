import test from 'node:test'
import assert from 'node:assert/strict'
import { MESSAGES, messageForAuthError, validateLogin } from './staff-auth.js'

test('un login vacío marca email y contraseña', () => {
  const errors = validateLogin({ email: '', password: '' })
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'password'])
})

test('rechaza un email con formato inválido', () => {
  const errors = validateLogin({ email: 'no-es-un-email', password: 'secreta' })
  assert.equal(errors.email, 'Ingresá un email válido.')
})

test('no exige una longitud mínima de contraseña en el login', () => {
  // La política de contraseñas la decide Supabase, no el formulario de entrada.
  assert.deepEqual(validateLogin({ email: 'staff@ejemplo.com', password: 'x' }), {})
})

test('credenciales incorrectas se traducen a un mensaje claro', () => {
  assert.equal(
    messageForAuthError({ code: 'invalid_credentials', status: 400 }),
    MESSAGES.invalidCredentials,
  )
})

test('email sin confirmar se distingue de credenciales incorrectas', () => {
  assert.equal(
    messageForAuthError({ code: 'email_not_confirmed' }),
    MESSAGES.emailNotConfirmed,
  )
})

test('exceso de intentos pide esperar', () => {
  assert.equal(
    messageForAuthError({ code: 'over_request_rate_limit', status: 429 }),
    MESSAGES.tooManyAttempts,
  )
  assert.equal(messageForAuthError({ code: 'over_email_send_rate_limit' }), MESSAGES.tooManyAttempts)
})

test('un error desconocido o nulo cae en el mensaje genérico', () => {
  assert.equal(messageForAuthError({ code: 'algo_raro' }), MESSAGES.generic)
  assert.equal(messageForAuthError(null), MESSAGES.generic)
  assert.equal(messageForAuthError(undefined), MESSAGES.generic)
})
