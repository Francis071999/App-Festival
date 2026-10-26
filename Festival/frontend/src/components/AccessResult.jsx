import React, { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function AccessResult({ result, onReset }) {
  // Verificación de nulidad al principio, antes de cualquier hook que use 'result'
  if (!result) return null;

  useEffect(() => {
    if (navigator.vibrate) {
      if (result.status === 'valid') {
        navigator.vibrate(200);
      } else {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [result]);

  const isValid = result.status === 'valid';
  const bgOverlay = isValid ? 'rgba(6, 78, 59, 0.96)' : 'rgba(127, 29, 29, 0.96)';
  const borderColor = isValid ? '#10B981' : '#EF4444';

  return (
    <div 
      className="animate-result"
      onClick={onReset}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: bgOverlay,
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        cursor: 'pointer'
      }}
    >
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        borderRadius: '50%', 
        padding: '1.5rem', 
        marginBottom: '1.5rem',
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 30px ${borderColor}`
      }}>
        {isValid ? (
          <CheckCircle2 size={80} color="#34D399" />
        ) : (
          <XCircle size={80} color="#F87171" />
        )}
      </div>

      <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>
        {isValid ? 'ACCESO CONCEDIDO' : 'ACCESO DENEGADO'}
      </h1>

      <p style={{ fontSize: '1.15rem', color: '#E2E8F0', maxWidth: '320px', lineHeight: '1.5', marginBottom: '2rem' }}>
        {isValid && `Ingreso autorizado — Titular: ${result.name}`}
        {result.status === 'used' && 'ENTRADA YA UTILIZADA EN OTRO PUESTO'}
        {result.status === 'invalid' && 'Código QR inválido, falso o no registrado.'}
        {result.status === 'error' && 'Error de comunicación con el servidor.'}
      </p>

      <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.6rem 1.25rem', borderRadius: '30px' }}>
        Toque en cualquier parte para continuar
      </div>
    </div>
  );
}