// src/components/QRScanner.jsx
import React, { useState } from 'react';
import { Camera, CameraOff, SwitchCamera, AlertTriangle, KeyRound } from 'lucide-react';
import { useQRScanner } from '../hooks/useQRScanner';

export const QRScanner = ({ onScanSuccess, isLoading }) => {
  const elementId = "qr-reader";
  const {
    isScanning,
    cameras,
    selectedCameraId,
    error,
    startScanner,
    stopScanner,
    switchCamera
  } = useQRScanner(elementId, onScanSuccess);

  const [manualCode, setManualCode] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-col items-center">
      {/* Selector de Cámaras */}
      {cameras.length > 1 && (
        <div className="w-full flex justify-end mb-2">
          <button
            onClick={() => {
              const nextCam = cameras.find(c => c.id !== selectedCameraId);
              if (nextCam) switchCamera(nextCam.id);
            }}
            className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-800/50 px-2.5 py-1 rounded-lg hover:bg-indigo-900/50 transition-colors"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            <span>Cambiar Cámara</span>
          </button>
        </div>
      )}

      {/* Visor de Cámara */}
      <div className="relative w-full aspect-square max-w-[280px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        <div id={elementId} className="w-full h-full object-cover" />

        {/* Marco y Animación de Escaneo */}
        {isScanning && !isLoading && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-indigo-500/80 rounded-2xl relative shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_8px_#818cf8] absolute top-0 animate-scanLine" />
            </div>
          </div>
        )}

        {!isScanning && (
          <div className="text-center p-4">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Cámara Inactiva</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-semibold text-indigo-400 animate-pulse">Procesando QR...</span>
          </div>
        )}
      </div>

      {/* Errores de Cámara */}
      {error && (
        <div className="mt-3 w-full bg-rose-950/50 border border-rose-800/50 rounded-lg p-2.5 flex items-start gap-2 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Botones de Control */}
      <div className="mt-4 w-full flex gap-2">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Iniciar Escáner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 font-semibold text-sm rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <CameraOff className="w-4 h-4" />
            Detener
          </button>
        )}
      </div>

      {/* Prueba de Ingreso Manual */}
      <form onSubmit={handleManualSubmit} className="mt-4 w-full pt-3 border-t border-slate-800/80 flex gap-2">
        <div className="relative flex-1">
          <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Código manual (ej: QR-FEST-001)"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
        >
          Probar
        </button>
      </form>
    </div>
  );
};