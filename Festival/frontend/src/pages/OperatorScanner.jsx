// src/pages/OperatorScanner.jsx
import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { AttendanceCounter } from '../components/AttendanceCounter';
import { QRScanner } from '../components/QRScanner';
import { AccessResult } from '../components/AccessResult';
import { validateTicket, fetchAttendanceStats, checkServerHealth } from '../services/api';

export const OperatorScanner = () => {
  const [time, setTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('ONLINE');
  const [validationResult, setValidationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attendance, setAttendance] = useState({ totalEntered: 0, estimatedCapacity: 10000 });

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar estadísticas iniciales y monitorear salud de red
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await fetchAttendanceStats();
        setAttendance(stats);
      } catch (err) {
        setConnectionStatus('OFFLINE');
      }
    };

    const interval = setInterval(async () => {
      const isHealthy = await checkServerHealth();
      setConnectionStatus(isHealthy ? 'ONLINE' : 'OFFLINE');
    }, 10000);

    loadStats();
    return () => clearInterval(interval);
  }, []);

  const handleScanSuccess = async (qrCode) => {
    setIsLoading(true);
    setConnectionStatus('VALIDATING');

    try {
      const response = await validateTicket(qrCode);
      setConnectionStatus('ONLINE');

      if (response.success) {
        setValidationResult({
          type: 'SUCCESS',
          message: response.message,
          sector: response.sector,
          timestamp: response.timestamp
        });
        if (response.totalEntered !== undefined) {
          setAttendance(prev => ({ ...prev, totalEntered: response.totalEntered }));
        }
      } else {
        setValidationResult({
          type: 'DENIED',
          message: response.reason || 'Acceso Denegado'
        });
      }
    } catch (err) {
      setConnectionStatus('ERROR');
      setValidationResult({
        type: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el servidor. Verifique su red.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Encabezado compacto */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/img/logo-ciac.png" alt="CIAC Logo" className="h-8 w-auto object-contain" />
          <div>
            <h1 className="text-sm font-black tracking-wider text-white uppercase leading-none">Festival Bella Vista</h1>
            <span className="text-[10px] text-slate-400 font-medium">Puesto de Control #1</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            {time.toLocaleTimeString()}
          </span>
          <ConnectionStatus status={connectionStatus} />
        </div>
      </header>

      {/* Cuerpo principal */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col gap-4">
        <AttendanceCounter 
          totalEntered={attendance.totalEntered} 
          estimatedCapacity={attendance.estimatedCapacity} 
        />

        <AccessResult 
          result={validationResult} 
          onReset={() => setValidationResult(null)} 
        />

        <QRScanner 
          onScanSuccess={handleScanSuccess} 
          isLoading={isLoading} 
        />
      </main>
    </div>
  );
};