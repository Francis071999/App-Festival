import React from 'react';

export const QRScanner = ({ isScanning, loading, error, onStart, onStop }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)', 
        border: '1px solid rgba(59, 130, 246, 0.3)', 
        borderRadius: '16px', 
        padding: '0.85rem', 
        marginBottom: '0.85rem',
        color: '#60A5FA',
        boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)'
      }}>
        <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      </div>

      <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.35rem', letterSpacing: '0.2px' }}>
        Control de Acceso QR
      </h2>
      
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.4', maxWidth: '300px' }}>
        Escanee la entrada oficial emitida por la Municipalidad en la Casa de la Cultura.
      </p>

      {/* Contenedor del Visor de Cámara */}
      <div id="reader" style={{ width: '100%', maxWidth: '260px', borderRadius: '14px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}></div>

      {error && (
        <div style={{ color: 'var(--danger-color)', fontSize: '0.78rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ width: '100%' }}>
        {!isScanning ? (
          <button className="btn-primary" onClick={onStart} disabled={loading}>
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h0.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            <span>{loading ? 'PROCESANDO...' : 'INICIAR ESCÁNER DE CÁMARA'}</span>
          </button>
        ) : (
          <button className="btn-primary btn-danger" onClick={onStop}>
            DETENER ESCÁNER
          </button>
        )}
      </div>
    </div>
  );
};