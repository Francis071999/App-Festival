// src/components/AttendanceCounter.jsx
import React from 'react';
import { Users } from 'lucide-react';

export const AttendanceCounter = ({ totalEntered, estimatedCapacity }) => {
  const percentage = estimatedCapacity > 0 
    ? Math.min(Math.round((totalEntered / estimatedCapacity) * 100), 100) 
    : 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Ingresos Confirmados</span>
            <span className="text-xl font-bold text-white transition-all duration-300">
              {totalEntered.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Capacidad Est.</span>
          <span className="text-xs font-semibold text-slate-300">{estimatedCapacity.toLocaleString()}</span>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400">
        <span>Ocupación actual</span>
        <span className="font-bold text-indigo-400">{percentage}%</span>
      </div>
    </div>
  );
};