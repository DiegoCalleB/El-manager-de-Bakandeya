import React, { useState } from 'react';
import { ShieldCheck, Check } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified = true,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <div 
      className={`relative inline-flex items-center gap-1.5 align-middle ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span 
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-neutral-950 font-black shadow-md shadow-amber-500/20 ring-1 ring-amber-300/50 ${sizeClasses[size]}`}
        title="Lead Verificado • Conversación activa mediante agentes de IA"
      >
        <Check className={`${iconSizes[size]} stroke-[3.5]`} />
      </span>

      {showLabel && (
        <span className="text-[11px] font-bold tracking-wide text-amber-300 uppercase bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
          Verificado
        </span>
      )}

      {/* Tooltip Popup */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2.5 rounded-xl bg-neutral-900/95 border border-amber-500/40 text-neutral-200 text-xs shadow-2xl z-50 pointer-events-none backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Lead Verificado por IA</span>
          </div>
          <p className="text-[11px] text-neutral-300 leading-tight">
            Este contacto ha sido verificado mediante interacción y conversación real lograda por los agentes de IA de Booking.
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900/95" />
        </div>
      )}
    </div>
  );
};
