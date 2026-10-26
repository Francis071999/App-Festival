import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MESSAGES,
  buildRegistrationPayload,
  isNetworkError,
  messageForInsertError,
  normalizeAddress,
  normalizeDni,
  normalizeEmail,
  normalizeName,
  validateRegistration,
} from './registration.js'

const VALID = {
  fullName: 'Ana María Pérez',
  dni: '30123456',
  locality: 'BELLA VISTA',
  email: 'ana@ejemplo.com',
  address: 'Calle 123',
}

test('normaliza nombre, DNI, email y domicilio', () => {
  assert.equal(normalizeName('  Ana   María  '), 'Ana María')
  assert.equal(normalizeDni('30.123.456'), '30123456')
  assert.equal(normalizeEmail('  ANA@Ejemplo.COM '), 'ana@ejemplo.com')
  assert.equal(normalizeAddress('  Calle 123  '), 'Calle 123')
})

test('el DNI se recorta a 9 dígitos', () => {
  assert.equal(normalizeDni('1234567890'), '123456789')
})

test('un formulario vacío devuelve errores en los cuatro campos obligatorios', () => {
  const errors = validateRegistration({ fullName: '', dni: '', locality: '', email: '', address: '' })
  assert.deepEqual(Object.keys(errors).sort(), ['dni', 'email', 'fullName', 'locality'])
})

test('rechaza un DNI de menos de 7 dígitos', () => {
  const errors = validateRegistration({ ...VALID, dni: '123456' })
  assert.equal(errors.dni, 'El DNI debe tener entre 7 y 9 dígitos, sin puntos.')
})

test('rechaza un email sin formato válido', () => {
  const errors = validateRegistration({ ...VALID, email: 'ana-arroba-ejemplo' })
  assert.equal(errors.email, 'Ingresá un email válido.')
})

test('rechaza un nombre de un solo caracter', () => {
  const errors = validateRegistration({ ...VALID, fullName: 'A' })
  assert.equal(errors.fullName, 'El nombre debe tener al menos 2 caracteres.')
})

test('rechaza un domicilio de más de 120 caracteres', () => {
  const errors = validateRegistration({ ...VALID, address: 'x'.repeat(121) })
  assert.equal(errors.address, 'El domicilio no puede superar los 120 caracteres.')
})

test('un formulario válido no devuelve errores', () => {
  assert.deepEqual(validateRegistration(VALID), {})
})

test('el payload va normalizado y con address null si está vacío', () => {
  const payload = buildRegistrationPayload({ ...VALID, fullName: '  Ana   Pérez ', address: '   ' })
  assert.deepEqual(payload, {
    full_name: 'Ana Pérez',
    dni: '30123456',
    email: 'ana@ejemplo.com',
    locality: 'BELLA VISTA',
    address: null,
  })
})

test('23505 se traduce a DNI duplicado y 23503 a localidad inválida', () => {
  assert.equal(messageForInsertError({ code: '23505' }), MESSAGES.duplicateDni)
  assert.equal(messageForInsertError({ code: '23503' }), MESSAGES.invalidLocality)
  assert.equal(messageForInsertError({ code: '42501' }), MESSAGES.generic)
  assert.equal(messageForInsertError(null), MESSAGES.generic)
})

test('solo se considera error de red cuando no hay código de Postgres', () => {
  assert.equal(isNetworkError({ message: 'TypeError: Failed to fetch' }), true)
  assert.equal(isNetworkError({ message: 'TypeError: Failed to fetch', code: '23505' }), false)
  assert.equal(isNetworkError({ message: 'duplicate key value', code: '23505' }), false)
  assert.equal(isNetworkError(null), false)
})
