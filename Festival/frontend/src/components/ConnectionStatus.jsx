import React from 'react';

export default function ConnectionStatus({ stationName = "Puesto 01" }) {
  return (
    <header className="header-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Contenedor del Logo CIAC */}
        <div style={{ 
          background: 'radial-gradient(circle, rgba(30, 58, 138, 0.6) 0%, rgba(10, 15, 30, 0.9) 100%)', 
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '12px', 
          width: '42px', 
          height: '42px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '4px',
          boxShadow: '0 0 12px rgba(59, 130, 246, 0.2)'
        }}>
          <img 
            src="/img/logo-ciac.png.jpg" 
            alt="Logo CIAC" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#F8FAFC', letterSpacing: '0.3px' }}>
            CIAC <span style={{ color: '#60A5FA', fontWeight: '600' }}>Bella Vista</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Festival Provincial 2026
          </div>
        </div>
      </div>

      {/* Indicador del Puesto de Control */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.4rem', 
        background: 'rgba(16, 185, 129, 0.12)', 
        border: '1px solid rgba(16, 185, 129, 0.35)', 
        padding: '0.35rem 0.75rem', 
        borderRadius: '20px' 
      }}>
        <span style={{ 
          width: '7px', 
          height: '7px', 
          backgroundColor: '#10B981', 
          borderRadius: '50%', 
          display: 'inline-block', 
          boxShadow: '0 0 8px #10B981' 
        }}></span>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10B981' }}>
          {stationName}
        </span>
      </div>
    </header>
  );
}