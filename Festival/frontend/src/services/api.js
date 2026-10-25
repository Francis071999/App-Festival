// src/services/api.js
import { MOCK_TICKETS, INITIAL_COUNTER } from '../mocks/mockTickets';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // Por defecto usa MOCK si no se especifica
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Memoria local para el contador en modo Demo
let localEnteredCount = INITIAL_COUNTER.totalEntered;
const localValidatedQRs = new Set();

export const validateTicket = async (qrCode) => {
  if (USE_MOCK) {
    // Simulación de latencia de red (400ms)
    await new Promise((resolve) => setTimeout(resolve, 400));

    const ticket = MOCK_TICKETS[qrCode];

    if (qrCode === "QR-FEST-ERR" || (ticket && ticket.status === "NETWORK_ERROR")) {
      throw new Error("ERR_NETWORK");
    }

    if (!ticket) {
      return {
        success: false,
        reason: "Código QR inexistente",
        code: "INVALID_CODE"
      };
    }

    if (ticket.status === "REVOKED") {
      return {
        success: false,
        reason: "Entrada revocada / anulada",
        code: "REVOKED"
      };
    }

    if (ticket.used || localValidatedQRs.has(qrCode)) {
      return {
        success: false,
        reason: "Entrada ya utilizada",
        code: "ALREADY_USED"
      };
    }

    // Si es válida
    ticket.used = true;
    localValidatedQRs.add(qrCode);
    localEnteredCount += 1;

    return {
      success: true,
      ticketId: ticket.id,
      sector: ticket.sector,
      message: "Entrada válida. Puede ingresar",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      totalEntered: localEnteredCount
    };
  }

  // Integración con Backend Real
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        reason: errorData.message || "Error al verificar la entrada",
        code: errorData.code || "SERVER_ERROR"
      };
    }

    return await response.json();
  } catch (error) {
    throw new Error("ERR_NETWORK");
  }
};

export const fetchAttendanceStats = async () => {
  if (USE_MOCK) {
    return {
      totalEntered: localEnteredCount,
      estimatedCapacity: INITIAL_COUNTER.capacity
    };
  }

  const response = await fetch(`${API_BASE_URL}/attendance/stats`);
  if (!response.ok) throw new Error("ERR_NETWORK");
  return await response.json();
};

export const checkServerHealth = async () => {
  if (USE_MOCK) return true;
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
};