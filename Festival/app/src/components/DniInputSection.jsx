import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabase';

const DniInputSection = forwardRef(({ dni, setDni, error }, ref) => {
  const [dniFile, setDniFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleDniChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setDni(value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert('Por favor selecciona una imagen (JPG, PNG) o un PDF.');
        return;
      }
      setDniFile(file);

      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setDniFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  useImperativeHandle(ref, () => ({
    async uploadFoto() {
      if (!dniFile) return null;

      try {
        setUploading(true);
        const fileExt = dniFile.name.split('.').pop();
        const fileName = `${dni || Date.now()}_dni.${fileExt}`;
        const filePath = `dnis/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(filePath, dniFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('documentos')
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      } catch (err) {
        console.error('Error al subir la foto del DNI:', err);
        alert('Error al subir la foto del DNI');
        return null;
      } finally {
        setUploading(false);
      }
    }
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Entrada manual de DNI */}
      <div>
        <label htmlFor="dni" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.375rem', color: '#1e293b' }}>
          DNI
        </label>
        <input
          type="text"
          id="dni"
          name="dni"
          value={dni}
          onChange={handleDniChange}
          placeholder="Ej: 40123456"
          maxLength={9}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            borderRadius: '0.5rem',
            border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
            outline: 'none',
            fontSize: '0.95rem',
            backgroundColor: '#ffffff'
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'dni-error' : 'dni-hint'}
        />
        {error ? (
          <p id="dni-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {error}
          </p>
        ) : (
          <p id="dni-hint" style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Sin puntos, entre 7 y 9 dígitos.
          </p>
        )}
      </div>

      {/* Adjuntar o tomar foto del DNI */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.375rem', color: '#1e293b' }}>
          Foto del DNI (Opcional)
        </label>

        {!dniFile ? (
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem 1rem',
            border: '2px dashed #0284c7',
            borderRadius: '0.75rem',
            backgroundColor: '#f0f9ff',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease, border-color 0.2s ease'
          }}>
            <svg
              style={{ width: '28px', height: '28px', color: '#0284c7', marginBottom: '0.5rem' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0369a1' }}>
              Tomar foto o adjuntar archivo
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
              JPG, PNG o PDF
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        ) : (
          <div style={{ position: 'relative', border: '1px solid #cbd5e1', borderRadius: '0.75rem', padding: '0.5rem', backgroundColor: '#f8fafc' }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa DNI"
                style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '0.5rem' }}
              />
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#334155' }}>
                📄 {dniFile.name}
              </div>
            )}
            <button
              type="button"
              onClick={handleRemoveFile}
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Quitar foto"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {uploading && <p style={{ fontSize: '0.8rem', color: '#0284c7', margin: 0 }}>Subiendo imagen...</p>}
    </div>
  );
});

export default DniInputSection;