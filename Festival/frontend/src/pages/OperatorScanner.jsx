import React, { useState } from 'react';
import ConnectionStatus from '../components/ConnectionStatus';
import AttendanceCounter from '../components/AttendanceCounter';
import AccessResult from '../components/AccessResult';
import { QRScanner } from '../components/QRScanner';
import { useQRScanner } from '../hooks/useQRScanner';
import { validateTicket } from '../services/api';

export default function OperatorScanner() {
  const [count, setCount] = useState(0);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = async (qrData) => {
    setIsLoading(true);
    try {
      const response = await validateTicket(qrData);
      setResult(response);
      if (response.status === 'valid' || response.success) {
        setCount(prev => prev + 1);
      }
    } catch (err) {
      setResult({ status: 'error', message: 'Error al conectar con el servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  const { isScanning, startScanner, stopScanner, error } = useQRScanner(handleScan);

  return (
    <div className="app-container">
      {/* 1. ENCABEZADO SUPERIOR */}
      <ConnectionStatus stationName="Puesto 01" />

      {/* 2. TARJETA DEL CONTADOR */}
      <AttendanceCounter count={count} />

      {/* 3. TARJETA PRINCIPAL DEL ESCÁNER DE CÁMARA */}
      {result ? (
        <AccessResult result={result} onReset={() => setResult(null)} />
      ) : (
        <QRScanner
          isScanning={isScanning}
          loading={isLoading}
          error={error}
          onStart={() => startScanner('reader')}
          onStop={stopScanner}
        />
      )}

      {/* 4. ZONA DE SIMULACIÓN DE PRUEBAS REDISEÑADA */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '0.85rem' 
        }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            SIMULACIÓN DE PRUEBAS:
          </span>
          <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: '#60A5FA', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.2)' }}>
            Modo Dev
          </span>
        </div>

        {/* Entrada Válida */}
        <button className="sim-button" onClick={() => handleScan('QR-VALIDO-001')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }}></span>
            <span style={{ color: '#F8FAFC', fontWeight: '600' }}>Entrada Válida <span style={{ color: '#34D399' }}>(Franco Osores)</span></span>
          </div>
          <span className="badge badge-success">OK</span>
        </button>

        {/* Entrada Ya Utilizada */}
        <button className="sim-button" onClick={() => handleScan('QR-USADO-002')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B', boxShadow: '0 0 6px #F59E0B' }}></span>
            <span style={{ color: '#F8FAFC', fontWeight: '600' }}>Entrada Ya Utilizada</span>
          </div>
          <span className="badge badge-warning">Duplicada</span>
        </button>

        {/* Código Inválido */}
        <button className="sim-button" onClick={() => handleScan('QR-FALSO-003')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444', boxShadow: '0 0 6px #EF4444' }}></span>
            <span style={{ color: '#F8FAFC', fontWeight: '600' }}>Código Inválido / Falso</span>
          </div>
          <span className="badge badge-danger">Error</span>
        </button>
      </div>

      {/* 5. PIE DE PÁGINA INSTITUCIONAL Y CRÉDITOS */}
      <footer className="card" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: '1.6' }}>
        <p style={{ color: '#F8FAFC', fontWeight: '700', fontSize: '0.8rem' }}>
          Municipalidad de Bella Vista <span style={{ color: '#60A5FA' }}>—</span> Sistema CIAC
        </p>
        <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>
          Festival Provincial 2026
        </p>
        
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem' }}>
          <p style={{ color: '#94A3B8', marginBottom: '0.25rem' }}>
            © 2026 Todos los derechos reservados.
          </p>
          <p style={{ color: '#CBD5E1', fontWeight: '500' }}>
            Desarrollado por: <span style={{ color: '#F8FAFC', fontWeight: '700' }}>Walter Santillán, Franco Fabián Osores Vergara y Víctor Molina</span>
          </p>
        </div>
      </footer>
    </div>
  );
}