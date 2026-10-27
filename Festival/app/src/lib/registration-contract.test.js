import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildRegistrationPayload,
  normalizePhone,
  validateRegistration,
} from './registration.js'

const VALID = {
  fullName: 'Ana Pérez',
  dni: '30123456',
  locality: 'BELLA VISTA',
  phone: '3777412345',
  address: '',
}

test('el celular acepta 10 dígitos, 0 inicial, +54 9 y separadores', () => {
  const cases = [
    ['3777412345', '3777412345'],
    ['03777412345', '3777412345'],
    ['03777-412-345', '3777412345'],
    ['+54 9 3777 412345', '3777412345'],
    ['5493777412345', '3777412345'],
  ]
  for (const [input, expected] of cases) assert.equal(normalizePhone(input), expected)
  for (const [input] of cases) assert.deepEqual(validateRegistration({ ...VALID, phone: input }), {})
})

test('rechaza largos incorrectos sin recortar el número', () => {
  assert.equal(normalizePhone('377741234'), '377741234')
  assert.equal(normalizePhone('37774123456'), '37774123456')
  for (const phone of ['377741234', '37774123456', '0377741234']) {
    const errors = validateRegistration({ ...VALID, phone })
    assert.equal(errors.phone, 'Ingresá un número de celular de 10 dígitos, sin 0 ni 15.')
  }
  assert.equal(
    validateRegistration({ ...VALID, phone: '' }).phone,
    'Ingresá tu número de celular.',
  )
})

test('ningún número de más de 10 dígitos se guarda como si fuera válido', () => {
  for (const phone of ['37774123450', '037774123450', '54937774123450']) {
    assert.notEqual(normalizePhone(phone).length, 10, `${phone} no debe quedar en 10 dígitos`)
    assert.ok(validateRegistration({ ...VALID, phone }).phone, `${phone} debe rechazarse`)
  }
})

test('celulares válidos distintos no colapsan al mismo valor', () => {
  const numbers = ['3777412345', '3777412346', '1144440000', '3515551234', '2615551234']
  const normalized = numbers.map((phone) => normalizePhone(phone))
  assert.deepEqual(normalized, numbers)
  assert.equal(new Set(normalized).size, numbers.length)
})

const insertColumnsFor = (file, role) => {
  const sql = fs.readFileSync(new URL(file, import.meta.url), 'utf8')
  const grants = [
    ...sql.matchAll(/grant\s+insert\s*\(([^)]*)\)\s+on\s+public\.registrations\s+to\s+([^;]+);/gi),
  ].filter((match) => match[2].split(',').map((value) => value.trim()).includes(role))
  assert.ok(grants.length > 0, `${file} no otorga INSERT a ${role}`)
  return grants.at(-1)[1].split(',').map((value) => value.trim())
}

test('el payload solo usa columnas que anon puede insertar (schema y migración)', () => {
  const payload = buildRegistrationPayload(VALID)
  for (const file of ['../../supabase/schema.sql', '../../supabase/migracion-celular.sql']) {
    const granted = insertColumnsFor(file, 'anon')
    for (const key of Object.keys(payload)) {
      assert.ok(granted.includes(key), `${file}: falta el grant de ${key} para anon`)
    }
  }
})

test('el registro público ya no inserta email', () => {
  const payload = buildRegistrationPayload({ ...VALID, email: 'ana@ejemplo.com' })
  assert.equal('email' in payload, false)
  assert.equal(payload.phone, '3777412345')
})
