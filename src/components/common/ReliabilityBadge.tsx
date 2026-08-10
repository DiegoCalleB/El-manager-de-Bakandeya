import React, { useState } from 'react';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculateLeadReliability } from '../../utils/leadReliability';
import { Lead, BandContact } from '../../types';

interface ReliabilityBadgeProps {
  item: Lead | BandContact;
  size?: 'sm' | 'md';
  showDetails?: boolean;
  className?: string;
}

export const ReliabilityBadge: React.FC<ReliabilityBadgeProps> = ({
  item,
  size = 'md',
  showDetails = false,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { score, details } = calculateLeadReliability(item);

  // Color coding
  let badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  let barColor = 'bg-emerald-400';
  let levelText = 'Fiabilidad Alta';

  if (score < 50) {
    badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    barColor = 'bg-amber-400';
    levelText = 'Fiabilidad Media';
  }
  if (score < 30) {
    badgeColor = 'bg-red-500/15 text-red-300 border-red-500/30';
    barColor = 'bg-red-400';
    levelText = 'Fiabilidad Baja';
  }

  const isSmall = size === 'sm';

  return (
    <div 
      className={`relative inline-flex items-center gap-1.5 align-middle ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div 
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-mono font-semibold transition-all cursor-help ${badgeColor} ${
          isSmall ? 'text-[10px]' : 'text-xs'
        }`}
      >
        <Target className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{score}% Fiabilidad</span>
      </div>

      {/* Tooltip Breakdown */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-2xl bg-neutral-900/95 border border-neutral-700/80 text-neutral-200 text-xs shadow-2xl z-50 pointer-events-none backdrop-blur-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 mb-2">
            <span className="font-bold text-neutral-100 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Autodetector de Fiabilidad
            </span>
            <span className={`font-mono font-bold text-xs ${score >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {score}%
            </span>
          </div>

          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mb-2.5">
            <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${score}%` }} />
          </div>

          <p className="text-[11px] text-neutral-400 mb-2 font-sans leading-tight">
            Cálculo automático de completitud de datos y calidad de contacto:
          </p>

          <ul className="space-y-1">
            {details.map((detail, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-[11px] text-neutral-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
            {details.length === 0 && (
              <li className="flex items-center gap-1.5 text-[11px] text-amber-300">
                <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Datos de contacto limitados. Añade email o teléfono para subir la fiabilidad.</span>
              </li>
            )}
          </ul>

          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900/95" />
        </div>
      )}
    </div>
  );
};
