import React from 'react';
import { Type, Check, X, Sparkles, SlidersHorizontal, Info } from 'lucide-react';
import { FONT_PRESETS, FontPresetKey, applyFontPreset, getStoredFontPreset } from '../utils/typography';

interface FontSelectorModalProps {
 onClose: () => void;
 isStitchLight?: boolean;
 currentFont: FontPresetKey;
 onSelectFont: (fontKey: FontPresetKey) => void;
}

export const FontSelectorModal: React.FC<FontSelectorModalProps> = ({
 onClose,
 isStitchLight,
 currentFont,
 onSelectFont,
}) => {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
 <div 
 className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
 isStitchLight 
 ? 'bg-white -slate-200 text-slate-800' 
 : 'bg-neutral-900 -neutral-800 text-neutral-100'
 }`}
 >
 {/* Header */}
 <div className={`px-6 py-4 flex justify-between items-center shrink-0 ${
 isStitchLight ? '-slate-200 bg-slate-50' : '-neutral-800 bg-neutral-950/60'
 }`}>
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-inner shrink-0 ${
 isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-[#d1b375]/15 text-[#d1b375] -amber-500/20'
 }`}>
 <Type className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
 <span>Selección de Tipografía & Fuente</span>
 <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] -emerald-500/20">
 En tiempo real
 </span>
 </h3>
 <p className="text-[11px] text-neutral-400 font-mono">
 Elige la fuente que mejor se adapte a tu gusto visual
 </p>
 </div>
 </div>

 <button
 onClick={onClose}
 className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Informative banner */}
 <div className={`px-6 py-3 text-xs flex items-center gap-2.5 ${
 isStitchLight ? 'bg-indigo-50/70 -indigo-100 text-indigo-900' : 'bg-neutral-950/40 -neutral-800 text-neutral-300'
 }`}>
 <Info className="w-4 h-4 text-amber-400 shrink-0" />
 <p className="text-[11px] leading-relaxed font-mono">
 ¿La fuente original te resultaba demasiado intensa o pesada? Prueba con <strong className="text-amber-400">Plus Jakarta Sans</strong> u <strong className="text-amber-400">Outfit</strong> para una lectura mucho más suave y ligera.
 </p>
 </div>

 {/* Font List */}
 <div className="p-6 overflow-y-auto space-y-3 scrollbar-thin">
 {FONT_PRESETS.map((preset) => {
 const isSelected = currentFont === preset.id;

 return (
 <div
 key={preset.id}
 onClick={() => onSelectFont(preset.id)}
 className={`p-4 rounded-xl transition-all cursor-pointer relative group ${
 isSelected
 ? isStitchLight
 ? 'bg-indigo-50/80 -indigo-500 ring-2 ring-indigo-500/20 shadow-md'
 : 'bg-amber-500/10 -amber-500 ring-2 ring-amber-500/20 shadow-lg'
 : isStitchLight
 ? 'bg-slate-50 -slate-200 hover:-slate-300 hover:bg-slate-100/80'
 : 'bg-neutral-950/60 -neutral-800 hover:-neutral-700 hover:bg-neutral-900'
 }`}
 >
 <div className="flex items-start justify-between gap-3 mb-2">
 <div>
 <div className="flex items-center gap-2">
 <span className="font-bold text-sm tracking-tight" style={{ fontFamily: preset.displayFont }}>
 {preset.name}
 </span>
 <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
 preset.id === 'plus_jakarta'
 ? 'bg-[#10b981]/15 text-[#10b981] -emerald-500/30'
 : preset.isSoft
 ? 'bg-sky-500/15 text-sky-400 -indigo-500/25'
 : 'bg-[#d1b375]/15 text-[#d1b375] -amber-500/25'
 }`}>
 {preset.badge}
 </span>
 </div>
 <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
 {preset.subtitle}
 </span>
 </div>

 <div className="flex items-center gap-2">
 {isSelected && (
 <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
 isStitchLight ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-stone-950'
 }`}>
 <Check className="w-3.5 h-3.5 stroke-[3]" />
 </span>
 )}
 </div>
 </div>

 <p className="text-xs text-neutral-400 leading-relaxed mb-3 font-mono">
 {preset.description}
 </p>

 {/* Live Preview Sample */}
 <div 
 className={`p-3 rounded-lg text-sm transition-all ${
 isStitchLight ? 'bg-white -slate-200 text-slate-800' : 'bg-neutral-900 -neutral-800/80 text-neutral-200'
 }`}
 style={{ fontFamily: preset.displayFont }}
 >
 <div className="font-bold text-base tracking-wide mb-1">
 Bakandeya Management Hub 2026
 </div>
 <div className="text-xs opacity-80" style={{ fontFamily: preset.bodyFont }}>
 El único panel de gestión inteligente para salas, festivales, ensayos y giras.
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* Footer */}
 <div className={`px-6 py-3 flex justify-between items-center shrink-0 ${
 isStitchLight ? '-slate-200 bg-slate-50' : '-neutral-800 bg-neutral-950/60'
 }`}>
 <span className="text-[10px] font-mono text-neutral-500">
 Cambio instantáneo guardado en tu navegador
 </span>
 <button
 onClick={onClose}
 className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
 isStitchLight 
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
 : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
 }`}
 >
 Aceptar & Cerrar
 </button>
 </div>
 </div>
 </div>
 );
};
