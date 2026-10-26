import { mockTickets } from '../mocks/mockTickets';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const MOCK_MODE = import.meta.env.VITE_USE_MOCK !== 'false'; // Se puede controlar desde .env o forzar en true

// Contador local simulado que inicia en 0 para las pruebas
let localAttendanceCount = 0;

export const validateTicket = async (qrData) => {
  if (MOCK_MODE) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const ticket = mockTickets[qrData] || { 
          status: "invalid", 
          message: "Código de entrada no registrado o falso." 
        };

        if (ticket.status === "valid") {
          // Marcamos como usada tras el primer ingreso exitoso
          mockTickets[qrData] = { 
            ...ticket, 
            status: "used",
            usedAt: new Date().toISOString()
          };
          
          localAttendanceCount += 1;

          resolve({
            success: true,
            status: "valid",
            message: "Ingreso Autorizado",
            ticketInfo: {
              holder: ticket.holder || "Titular Autorizado",
              id: ticket.id || "TK-2026-OK",
              validatedAt: new Date().toISOString()
            },
            newCount: localAttendanceCount
          });
        } else if (ticket.status === "used") {
          resolve({
            success: false,
            status: "used",
            message: "ENTRADA YA UTILIZADA",
            ticketInfo: {
              id: ticket.id || "TK-2026-USED",
              usedAt: ticket.usedAt || new Date().toISOString()
            }
          });
        } else {
          resolve({
            success: false,
            status: "invalid",
            message: "Código de entrada inválido o no reconocido."
          });
        }
      }, 500); // 500ms de latencia simulada para ver el estado de carga
    });
  }

  // Integración real con la API Backend de tus compañeros
  try {
    const response = await fetch(`${API_URL}/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData, puesto: 'Puesto 01' })
    });

    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }

    return await response.json();
  } catch (err) {
    return {
      success: false,
      status: "error",
      message: "No se pudo conectar con el servidor de validación."
    };
  }
};

/**
 * Consulta el contador de asistencias desde la API o de la simulación
 */
export const getAttendanceCount = async () => {
  if (MOCK_MODE) {
    return { count: localAttendanceCount };
  }

  try {
    const response = await fetch(`${API_URL}/attendance/count`);
    if (!response.ok) throw new Error('Error al obtener conteo');
    return await response.json();
  } catch (err) {
    return { count: localAttendanceCount };
  }
};