// src/components/AccessResult.jsx
import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const AccessResult = ({ result, onReset }) => {
  if (!result) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center backdrop-blur-md flex flex-col items-center justify-center min-h-[180px]">
        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mb-2 animate-pulse">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-slate-400 text-sm font-medium">Listo para escanear código QR</p>
        <span className="text-slate-500 text-xs mt-1">Apunta la cámara a la entrada</span>
      </div>
    );
  }

  const isSuccess = result.type === 'SUCCESS';
  const isNetworkError = result.type === 'NETWORK_ERROR';

  return (
    <div 
      className={`rounded-2xl p-6 text-center backdrop-blur-md border shadow-2xl transition-all duration-300 transform scale-100 ${
        isSuccess 
          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100 shadow-emerald-950/50' 
          : isNetworkError
          ? 'bg-amber-950/80 border-amber-500/50 text-amber-100 shadow-amber-950/50'
          : 'bg-rose-950/80 border-rose-500/50 text-rose-100 shadow-rose-950/50'
      }`}
    >
      <div className="flex justify-center mb-3">
        {isSuccess && (
          <CheckCircle2 className="w-20 h-20 text-emerald-400 animate-bounce" />
        )}
        {!isSuccess && !isNetworkError && (
          <XCircle className="w-20 h-20 text-rose-400 animate-shake" />
        )}
        {isNetworkError && (
          <AlertCircle className="w-20 h-20 text-amber-400 animate-pulse" />
        )}
      </div>

      <h2 className="text-2xl font-black tracking-tight mb-1">
        {isSuccess ? 'ACCESO CONCEDIDO' : isNetworkError ? 'ERROR DE CONEXIÓN' : 'ACCESO DENEGADO'}
      </h2>

      <p className="text-sm font-semibold opacity-90 mb-2">
        {result.message}
      </p>

      {result.sector && (
        <span className="inline-block bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          Sector: {result.sector}
        </span>
      )}

      {result.timestamp && (
        <p className="text-[11px] opacity-60">Hora: {result.timestamp}</p>
      )}

      <button
        onClick={onReset}
        className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-xs font-bold rounded-lg transition-colors border border-white/10"
      >
        Escanear Siguiente
      </button>
    </div>
  );
};