import React, { useState } from 'react';
import { Guitar, Check, Plus, Sparkles, X, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { User } from '../types';

interface BandSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  availableBands: Array<{ band_id: string; bandName: string; role?: string; logoUrl?: string; style?: string }>;
  onSwitchBand: (bandId: string) => Promise<any>;
  onOpenRegisterBand?: () => void;
  epkConfig?: any;
}

export const BandSwitcherModal: React.FC<BandSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  availableBands,
  onSwitchBand,
  onOpenRegisterBand,
  epkConfig,
}) => {
  const [switchingBandId, setSwitchingBandId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentActiveBandId = currentUser?.band_id || 'band-bakandeya';

  // Ensure unique list of bands
  const bandListMap = new Map<string, { band_id: string; bandName: string; role?: string; logoUrl?: string }>();
  
  if (availableBands && availableBands.length > 0) {
    availableBands.forEach((b) => {
      const bid = b.band_id;
      if (bid) {
        let logo = b.logoUrl || (b as any).logo_url || (b as any).imagen_url || '';
        if (bid === currentActiveBandId && epkConfig?.logoUrl) {
          logo = epkConfig.logoUrl;
        }
        if (!logo && (bid === 'band-bakandeya' || bid === 'reg-bakandeya')) {
          logo = '/logo_bakandeya_bueno_sin_fondo.png';
        }
        bandListMap.set(bid, {
          band_id: bid,
          bandName: b.bandName || 'Banda',
          role: b.role || 'member',
          logoUrl: logo
        });
      }
    });
  }

  // Ensure active band is present
  if (!bandListMap.has(currentActiveBandId)) {
    let logo = epkConfig?.logoUrl || '';
    if (!logo && (currentActiveBandId === 'band-bakandeya' || currentActiveBandId === 'reg-bakandeya')) {
      logo = '/logo_bakandeya_bueno_sin_fondo.png';
    }
    bandListMap.set(currentActiveBandId, {
      band_id: currentActiveBandId,
      bandName: currentUser?.bandName || currentUser?.name || 'BAKANDEYA',
      role: currentUser?.role || 'leader',
      logoUrl: logo
    });
  }

  const uniqueBands = Array.from(bandListMap.values());

  const handleSelectBand = async (bandId: string) => {
    if (bandId === currentActiveBandId) {
      onClose();
      return;
    }

    setSwitchingBandId(bandId);
    setErrorMessage(null);

    try {
      await onSwitchBand(bandId);
      setTimeout(() => {
        setSwitchingBandId(null);
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Error switching band:', err);
      setErrorMessage(err.message || 'Error al cambiar de banda');
      setSwitchingBandId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl bg-[#121110] border border-[#2b2927] rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 md:p-10 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={!!switchingBandId}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white bg-[#1a1918] hover:bg-[#282624] border border-[#2b2927] rounded-full transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Perfil & Selección de Banda</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white uppercase">
            ¿Quién toca hoy?
          </h2>
          <p className="text-neutral-400 text-xs md:text-sm font-sans max-w-md mt-2">
            Selecciona tu proyecto musical para cargar al instante su calendario, finanzas, repertorio y dossier de prensa.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        {/* Band Cards Grid (Netflix Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 justify-center items-stretch max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
          {uniqueBands.map((band) => {
            const isActive = band.band_id === currentActiveBandId;
            const isSwitching = switchingBandId === band.band_id;

            return (
              <div
                key={`netflix-band-${band.band_id}`}
                onClick={() => !switchingBandId && handleSelectBand(band.band_id)}
                className={`group relative flex flex-col items-center p-5 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-b from-amber-500/20 to-[#1a1918] border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-[1.02]'
                    : 'bg-[#181716] border-[#2b2927] hover:border-amber-500/80 hover:bg-[#201e1d] hover:scale-105 hover:shadow-xl'
                } ${switchingBandId && !isSwitching ? 'opacity-40 grayscale pointer-events-none' : ''}`}
              >
                {/* Active Indicator Badge */}
                {isActive && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span className="hidden sm:inline">Activa</span>
                  </div>
                )}

                {/* Avatar / Logo Container */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-neutral-950 border border-[#333130] group-hover:border-amber-400 transition-all flex items-center justify-center p-2 shadow-lg mb-3 shrink-0">
                  {band.logoUrl ? (
                    <img
                      src={band.logoUrl}
                      alt={band.bandName}
                      className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex flex-col items-center justify-center text-amber-400 gap-1 border border-amber-500/30">
                      <Guitar className="w-8 h-8 opacity-80 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-black font-mono text-zinc-200">
                        {band.bandName.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Switching Spinner Overlay */}
                  {isSwitching && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center text-amber-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Band Info */}
                <h3 className="text-sm sm:text-base font-bold font-display tracking-wide uppercase text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {band.bandName}
                </h3>

                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                  <Shield className="w-3 h-3 text-amber-500/80" />
                  <span className="capitalize">{band.role === 'leader' ? 'Mánager / Líder' : 'Miembro'}</span>
                </div>

                {/* Hover CTA Pill */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    isActive ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isActive ? 'En uso' : 'Cambiar aquí'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Option Card: Add/Register Band */}
          <div
            onClick={() => {
              onClose();
              if (onOpenRegisterBand) onOpenRegisterBand();
            }}
            className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-[#333130] bg-[#141312] hover:border-amber-500/80 hover:bg-[#1a1918] transition-all duration-300 cursor-pointer text-neutral-400 hover:text-amber-300 hover:scale-105 min-h-[160px]"
          >
            <div className="w-14 h-14 rounded-full bg-[#1e1d1b] border border-[#333130] group-hover:border-amber-500/60 flex items-center justify-center text-neutral-300 group-hover:text-amber-400 transition-all mb-3 shadow-inner">
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold font-display uppercase tracking-wider text-center">
              Añadir Proyecto
            </span>
            <span className="text-[10px] font-mono text-neutral-500 mt-0.5 text-center">
              Registrar otra banda
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 pt-4 border-t border-[#2b2927]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <span className="font-mono">
            {uniqueBands.length} {uniqueBands.length === 1 ? 'proyecto disponible' : 'proyectos disponibles'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1a1918] hover:bg-[#282624] text-neutral-300 hover:text-white border border-[#2b2927] transition-all cursor-pointer font-medium"
          >
            Mantener banda actual
          </button>
        </div>
      </div>
    </div>
  );
};
