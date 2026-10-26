import React from 'react';
import { Users, Calendar } from 'lucide-react';

export default function AttendanceCounter({ count }) {
  return (
    <div className="card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        <Users size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1.2px' }}>ASISTENTES INGRESADOS</span>
      </div>
      
      <div style={{ fontSize: '3.75rem', fontWeight: '800', lineHeight: '1.1', letterSpacing: '2px', color: '#FFFFFF', textShadow: '0 0 25px rgba(255, 255, 255, 0.15)' }}>
        {String(count).padStart(4, '0')}
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        <Calendar size={13} />
        <span>Sábado 31 de Octubre de 2026 — Cancha Bella Vista</span>
      </div>
    </div>
  );
}