// src/mocks/mockTickets.js

export const INITIAL_COUNTER = {
  capacity: 10000, // Capacidad estimada configurable
  totalEntered: 0
};

export const MOCK_TICKETS = {
  "QR-FEST-001": { id: "QR-FEST-001", sector: "General", status: "VALID", used: false },
  "QR-FEST-002": { id: "QR-FEST-002", sector: "VIP", status: "VALID", used: false },
  "QR-FEST-USED": { id: "QR-FEST-USED", sector: "General", status: "VALID", used: true, usedAt: "20:15 Hs" },
  "QR-FEST-REVOKED": { id: "QR-FEST-REVOKED", sector: "General", status: "REVOKED", used: false },
  "QR-FEST-ERR": { id: "QR-FEST-ERR", status: "NETWORK_ERROR" }
};