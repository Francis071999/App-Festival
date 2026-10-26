import test from 'node:test'
import assert from 'node:assert/strict'
import {
  VERIFICATION_LABELS,
  countRegistrations,
  listForStaff,
  matchesQuery,
  normalizeSearch,
  sortForStaff,
  verificationLabel,
} from './staff-list.js'

const row = (overrides) => ({
  id: 'x',
  full_name: 'Ana Pérez',
  dni: '30123456',
  email: 'ana@ejemplo.com',
  locality: 'BELLA VISTA',
  ticket_delivered: false,
  delivered_at: null,
  locality_verified: false,
  verify_note: null,
  ...overrides,
})

test('normaliza mayúsculas y acentos para buscar', () => {
  assert.equal(normalizeSearch('  JOSÉ  '), 'jose')
  assert.equal(normalizeSearch('Muñoz'), 'munoz')
  assert.equal(normalizeSearch(''), '')
})

test('encuentra por nombre parcial sin distinguir mayúsculas ni acentos', () => {
  const jose = row({ full_name: 'José Muñoz' })
  assert.equal(matchesQuery(jose, 'jose'), true)
  assert.equal(matchesQuery(jose, 'JOSÉ'), true)
  assert.equal(matchesQuery(jose, 'munoz'), true)
  assert.equal(matchesQuery(jose, 'perez'), false)
})

test('encuentra por DNI parcial', () => {
  const ana = row()
  assert.equal(matchesQuery(ana, '3012'), true)
  assert.equal(matchesQuery(ana, '30123456'), true)
  assert.equal(matchesQuery(ana, '999'), false)
})

test('una búsqueda vacía no filtra nada', () => {
  assert.equal(matchesQuery(row(), ''), true)
  assert.equal(matchesQuery(row(), '   '), true)
})

test('el contador cuenta registrados, entregadas y verificadas', () => {
  const rows = [
    row({ id: '1' }),
    row({ id: '2', ticket_delivered: true }),
    row({ id: '3', ticket_delivered: true, locality_verified: true }),
    row({ id: '4', locality_verified: true }),
  ]
  assert.deepEqual(countRegistrations(rows), { registered: 4, delivered: 2, verified: 2 })
})

test('el contador de una lista vacía da cero', () => {
  assert.deepEqual(countRegistrations([]), { registered: 0, delivered: 0, verified: 0 })
})

test('los pendientes y sin verificar van primero, después alfabético', () => {
  const rows = [
    row({ id: 'z', full_name: 'Zulema', ticket_delivered: true, locality_verified: true }),
    row({ id: 'b', full_name: 'Bruno', ticket_delivered: true, locality_verified: true }),
    row({ id: 'c', full_name: 'Carla', ticket_delivered: false, locality_verified: true }),
    row({ id: 'a', full_name: 'Ana' }),
  ]
  assert.deepEqual(
    sortForStaff(rows).map((r) => r.id),
    ['a', 'c', 'b', 'z'],
  )
})

test('el orden alfabético ignora acentos', () => {
  const rows = [
    row({ id: '1', full_name: 'Zoe', ticket_delivered: true, locality_verified: true }),
    row({ id: '2', full_name: 'Ángel', ticket_delivered: true, locality_verified: true }),
    row({ id: '3', full_name: 'Beatriz', ticket_delivered: true, locality_verified: true }),
  ]
  assert.deepEqual(
    sortForStaff(rows).map((r) => r.id),
    ['2', '3', '1'],
  )
})

test('ordenar no muta la lista original', () => {
  const rows = [row({ id: '2', full_name: 'Zoe' }), row({ id: '1', full_name: 'Ana' })]
  sortForStaff(rows)
  assert.deepEqual(
    rows.map((r) => r.id),
    ['2', '1'],
  )
})

test('listForStaff filtra y después ordena', () => {
  const rows = [
    row({ id: '1', full_name: 'José Pérez', ticket_delivered: true, locality_verified: true }),
    row({ id: '2', full_name: 'José Álvarez' }),
    row({ id: '3', full_name: 'Ana Gómez' }),
  ]
  assert.deepEqual(
    listForStaff(rows, 'JOSE').map((r) => r.id),
    ['2', '1'],
  )
})

test('el estado de verificación distingue los tres casos', () => {
  assert.equal(verificationLabel(row()), VERIFICATION_LABELS.unverified)
  assert.equal(
    verificationLabel(row({ locality_verified: true })),
    VERIFICATION_LABELS.verified,
  )
  assert.equal(
    verificationLabel(row({ locality_verified: true, verify_note: 'DNI de otra localidad' })),
    VERIFICATION_LABELS.exception,
  )
  assert.equal(verificationLabel(null), VERIFICATION_LABELS.unverified)
})
