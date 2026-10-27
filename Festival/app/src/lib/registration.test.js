import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MESSAGES,
  RETRY_DELAYS_MS,
  buildRegistrationPayload,
  isNetworkError,
  messageForInsertError,
  normalizeAddress,
  normalizeDni,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  planSubmit,
  validateRegistration,
} from './registration.js'

const VALID = {
  fullName: 'Ana María Pérez',
  dni: '30123456',
  locality: 'BELLA VISTA',
  phone: '3777412345',
  address: 'Calle 123',
}

test('normaliza nombre, DNI, celular y domicilio', () => {
  assert.equal(normalizeName('  Ana   María  '), 'Ana María')
  assert.equal(normalizeDni('30.123.456'), '30123456')
  assert.equal(normalizePhone(' 3777 412 345 '), '3777412345')
  assert.equal(normalizeAddress('  Calle 123  '), 'Calle 123')
})

test('el celular se normaliza sin 0 ni código de país', () => {
  assert.equal(normalizePhone('03777-412345'), '3777412345')
  assert.equal(normalizePhone('+54 9 3777 412345'), '3777412345')
  // normalizeEmail queda para el login del staff, no para el registro público.
  assert.equal(normalizeEmail('  STAFF@Ejemplo.COM '), 'staff@ejemplo.com')
})

test('el DNI se recorta a 9 dígitos', () => {
  assert.equal(normalizeDni('1234567890'), '123456789')
})

test('un formulario vacío devuelve errores en los cuatro campos obligatorios', () => {
  const errors = validateRegistration({ fullName: '', dni: '', locality: '', phone: '', address: '' })
  assert.deepEqual(Object.keys(errors).sort(), ['dni', 'fullName', 'locality', 'phone'])
})

test('rechaza un DNI de menos de 7 dígitos', () => {
  const errors = validateRegistration({ ...VALID, dni: '123456' })
  assert.equal(errors.dni, 'El DNI debe tener entre 7 y 9 dígitos, sin puntos.')
})

test('rechaza un celular que no tiene 10 dígitos', () => {
  const errors = validateRegistration({ ...VALID, phone: '377741234' })
  assert.equal(errors.phone, 'Ingresá un número de celular de 10 dígitos, sin 0 ni 15.')
})

test('acepta el celular escrito con 0 o con código de país', () => {
  assert.deepEqual(validateRegistration({ ...VALID, phone: '03777412345' }), {})
  assert.deepEqual(validateRegistration({ ...VALID, phone: '+54 9 3777 412345' }), {})
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
    phone: '3777412345',
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

test('el reintento automático espera cada vez más entre intentos', () => {
  assert.equal(RETRY_DELAYS_MS.length, 2)
  assert.ok(RETRY_DELAYS_MS.every((ms) => ms > 0))
  assert.ok(RETRY_DELAYS_MS[1] > RETRY_DELAYS_MS[0])
})

test('un 23505 después de un reintento no asegura que el DNI estaba duplicado', () => {
  // El primer intento pudo llegar al servidor y perderse la respuesta: en ese
  // caso el reintento choca con nuestra propia fila, no con otra persona.
  assert.equal(
    messageForInsertError({ code: '23505' }, { retried: true }),
    MESSAGES.maybeRegistered,
  )
  assert.notEqual(MESSAGES.maybeRegistered, MESSAGES.duplicateDni)
})

test('un 23505 sin reintento sí es un DNI duplicado', () => {
  assert.equal(messageForInsertError({ code: '23505' }, { retried: false }), MESSAGES.duplicateDni)
  assert.equal(messageForInsertError({ code: '23505' }), MESSAGES.duplicateDni)
})

test('un envío válido se deja pasar', () => {
  assert.deepEqual(planSubmit({ values: VALID, honeypot: '', elapsedMs: 5000, timeTrapMs: 3000 }), {
    action: 'submit',
  })
})

test('el honeypot bloquea el envío con un mensaje visible', () => {
  const plan = planSubmit({ values: VALID, honeypot: 'spam', elapsedMs: 5000, timeTrapMs: 3000 })
  assert.equal(plan.action, 'blocked')
  assert.equal(plan.message, MESSAGES.honeypotBlocked)
})

test('un envío demasiado rápido se bloquea con su propio mensaje', () => {
  const plan = planSubmit({ values: VALID, honeypot: '', elapsedMs: 500, timeTrapMs: 3000 })
  assert.equal(plan.action, 'blocked')
  assert.equal(plan.message, MESSAGES.tooFast)
})

test('el honeypot gana sobre el time-trap y sobre la validación', () => {
  const plan = planSubmit({ values: {}, honeypot: 'spam', elapsedMs: 0, timeTrapMs: 3000 })
  assert.equal(plan.message, MESSAGES.honeypotBlocked)
})

test('un formulario inválido devuelve los errores por campo', () => {
  const plan = planSubmit({
    values: { ...VALID, dni: '' },
    honeypot: '',
    elapsedMs: 5000,
    timeTrapMs: 3000,
  })
  assert.equal(plan.action, 'invalid')
  assert.deepEqual(Object.keys(plan.errors), ['dni'])
})
