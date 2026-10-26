// Lógica pura del panel de staff: normalización de la búsqueda, filtrado,
// orden y contadores. Sin React ni Supabase para poder testearla con
// `node --test`.

export const VERIFICATION_LABELS = {
  unverified: 'Sin verificar',
  verified: 'Verificada',
  exception: 'Excepción',
}

/** Minúsculas, sin acentos y sin espacios en los extremos. */
export const normalizeSearch = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

/** Busca por nombre o DNI, con coincidencia parcial. */
export function matchesQuery(registration, query = '') {
  const needle = normalizeSearch(query)
  if (!needle) return true

  const name = normalizeSearch(registration?.full_name ?? '')
  const dni = String(registration?.dni ?? '')

  return name.includes(needle) || dni.includes(needle)
}

export function countRegistrations(rows = []) {
  let delivered = 0
  let verified = 0

  for (const row of rows) {
    if (row.ticket_delivered) delivered += 1
    if (row.locality_verified) verified += 1
  }

  return { registered: rows.length, delivered, verified }
}

/** Le falta algo para estar completa: entregar la entrada o verificar la localidad. */
const needsAttention = (row) => !row.ticket_delivered || !row.locality_verified

/**
 * Pendientes y sin verificar primero; dentro de cada grupo, alfabético por
 * nombre sin distinguir acentos. No muta la lista recibida.
 */
export function sortForStaff(rows = []) {
  return [...rows].sort((a, b) => {
    const byAttention = Number(needsAttention(b)) - Number(needsAttention(a))
    if (byAttention !== 0) return byAttention

    return normalizeSearch(a.full_name).localeCompare(normalizeSearch(b.full_name), 'es')
  })
}

/** Filtra por la búsqueda y devuelve el resultado ya ordenado. */
export function listForStaff(rows = [], query = '') {
  return sortForStaff(rows.filter((row) => matchesQuery(row, query)))
}

/**
 * Tres estados con dos columnas: sin verificar; verificada sin nota; y
 * excepción, que es una verificación con motivo escrito.
 */
export function verificationLabel(registration) {
  if (!registration?.locality_verified) return VERIFICATION_LABELS.unverified
  return registration.verify_note ? VERIFICATION_LABELS.exception : VERIFICATION_LABELS.verified
}
