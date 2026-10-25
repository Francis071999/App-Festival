// src/components/ConnectionStatus.jsx
import React from 'react';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';

export const ConnectionStatus = ({ status }) => {
  // Configuración según los estados descritos
  const statusConfig = {
    ONLINE: { label: 'En línea', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Wifi },
    OFFLINE: { label: 'Sin conexión', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: WifiOff },
    VALIDATING: { label: 'Validando...', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Loader2, spin: true },
    ERROR: { label: 'Error red', color: 'bg-rose-600/20 text-rose-300 border-rose-600/30', icon: AlertTriangle }
  };

  const current = statusConfig[status] || statusConfig.OFFLINE;
  const Icon = current.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium backdrop-blur-md ${current.color}`}>
      <Icon className={`w-3.5 h-3.5 ${current.spin ? 'animate-spin' : ''}`} />
      <span>{current.label}</span>
    </div>
  );
};