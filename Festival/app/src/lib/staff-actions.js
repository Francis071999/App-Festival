// Lógica pura de la entrega de entradas: qué payload se envía y cuándo hace
// falta una confirmación antes de tocar la base. Sin React ni Supabase.

export const ACTION_MESSAGES = {
  deliverUnverified:
    'La localidad de esta persona todavía no está verificada. ¿Entregar la entrada igual?',
  undo: '¿Deshacer la entrega? La entrada vuelve a quedar pendiente.',
  saveError: 'No pudimos guardar el cambio. Revisá la conexión e intentá de nuevo.',
}

/**
 * El payload de la entrega lleva una sola columna. `delivered_at` y
 * `delivered_by` los completa el trigger en la base: si los mandáramos, la
 * base los ignoraría igual, pero además no tenemos permiso de escribirlos.
 */
export const ticketPayload = (delivered) => ({ ticket_delivered: Boolean(delivered) })

/**
 * Decide si la acción está permitida y si hace falta confirmar antes.
 *
 * En modo estricto, entregar una entrada cuya localidad no fue verificada
 * pide una confirmación extra: es la única barrera antes de que alguien se
 * lleve una entrada sin cumplir la regla del evento.
 */
export function planTicketAction(row, action, { strict = false } = {}) {
  const delivered = Boolean(row?.ticket_delivered)

  if (action === 'deliver') {
    if (delivered) return { allowed: false, confirmation: null }
    return {
      allowed: true,
      confirmation: strict && !row?.locality_verified ? ACTION_MESSAGES.deliverUnverified : null,
    }
  }

  if (action === 'undo') {
    if (!delivered) return { allowed: false, confirmation: null }
    return { allowed: true, confirmation: ACTION_MESSAGES.undo }
  }

  return { allowed: false, confirmation: null }
}
