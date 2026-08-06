import React from 'react';
import { Navigation, ExternalLink } from 'lucide-react';

interface DirectionsCardProps {
  query: string;
  locationName: string;
  address?: string;
  className?: string;
  isStitchLight?: boolean;
}

export default function DirectionsCard({
  query,
  locationName,
  address,
  className = '',
  isStitchLight = false,
}: DirectionsCardProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex relative max-w-full w-full sm:w-auto mx-auto justify-center items-center overflow-hidden rounded-xl border transition-all duration-200 group cursor-pointer ${
        isStitchLight
          ? 'bg-slate-900 border-slate-700/70 shadow-sm hover:border-indigo-500/60 hover:shadow-indigo-500/10'
          : 'bg-[#181716] border-[#2c2a29] shadow-md hover:border-purple-500/50 hover:shadow-purple-500/10'
      } ${className}`}
    >
      {/* Tactile Simulated Map Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`map-grid-${locationName.replace(/\s+/g, '-')}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={isStitchLight ? '#475569' : '#3f3f46'} strokeWidth="0.5" strokeDasharray="2 2" />
              <circle cx="10" cy="10" r="1" fill={isStitchLight ? '#94a3b8' : '#71717a'} opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#map-grid-${locationName.replace(/\s+/g, '-')})`} />
        </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-2.5 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 bg-gradient-to-r from-[#121110] via-[#121110]/95 to-transparent text-center w-full">
        {address && (
          <span className="text-[10px] font-sans text-zinc-400 truncate leading-tight max-w-[220px]" title={address}>
            {address}
          </span>
        )}

        {/* Action: Cómo llegar Button */}
        <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all shrink-0 ${
          isStitchLight
            ? 'bg-slate-800 border-slate-700 text-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500'
            : 'bg-zinc-800/90 border-zinc-700/80 text-zinc-200 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500'
        }`}>
          <Navigation className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          <span className="inline">Cómo llegar</span>
          <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </a>
  );
}
