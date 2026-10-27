import test from 'node:test'
import assert from 'node:assert/strict'
import { ACTION_MESSAGES, planTicketAction, ticketPayload } from './staff-actions.js'

const row = (overrides = {}) => ({
  id: '1',
  full_name: 'Ana Pérez',
  ticket_delivered: false,
  locality_verified: false,
  ...overrides,
})

test('entregar envía únicamente ticket_delivered', () => {
  // El trigger completa delivered_at y delivered_by: el cliente no los manda.
  assert.deepEqual(ticketPayload(true), { ticket_delivered: true })
  assert.deepEqual(Object.keys(ticketPayload(true)), ['ticket_delivered'])
})

test('deshacer envía únicamente ticket_delivered en false', () => {
  assert.deepEqual(ticketPayload(false), { ticket_delivered: false })
  assert.deepEqual(Object.keys(ticketPayload(false)), ['ticket_delivered'])
})

test('en modo estricto y sin verificar, entregar pide confirmación', () => {
  assert.deepEqual(planTicketAction(row(), 'deliver', { strict: true }), {
    allowed: true,
    confirmation: ACTION_MESSAGES.deliverUnverified,
  })
})

test('en modo estricto y verificada, entregar no pide confirmación', () => {
  assert.deepEqual(planTicketAction(row({ locality_verified: true }), 'deliver', { strict: true }), {
    allowed: true,
    confirmation: null,
  })
})

test('en modo flexible, entregar no pide confirmación aunque no esté verificada', () => {
  assert.deepEqual(planTicketAction(row(), 'deliver', { strict: false }), {
    allowed: true,
    confirmation: null,
  })
})

test('una entrada ya entregada no se puede volver a entregar', () => {
  assert.deepEqual(planTicketAction(row({ ticket_delivered: true }), 'deliver', { strict: true }), {
    allowed: false,
    confirmation: null,
  })
})

test('deshacer pide confirmación y solo vale si estaba entregada', () => {
  assert.deepEqual(planTicketAction(row({ ticket_delivered: true }), 'undo', { strict: true }), {
    allowed: true,
    confirmation: ACTION_MESSAGES.undo,
  })
  assert.deepEqual(planTicketAction(row(), 'undo', { strict: true }), {
    allowed: false,
    confirmation: null,
  })
})

test('una acción desconocida no se permite', () => {
  assert.deepEqual(planTicketAction(row(), 'borrar-todo', { strict: false }), {
    allowed: false,
    confirmation: null,
  })
})
