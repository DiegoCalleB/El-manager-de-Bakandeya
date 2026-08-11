import React, { useState } from 'react';
import { BandContact } from '../../types';
import { Sparkles, X, Check, Copy, MessageSquare, Radio, Flame, MessageCircle, HeartHandshake } from 'lucide-react';

export interface ToneAnalysisData {
  nombre_entidad?: string;
  es_emisor?: boolean;
  redes_rastreadas?: string[];
  tono_comunicacion?: string;
  tratamiento_habitual?: string;
  nivel_energia?: string;
  vocabulario_clave?: string[];
  frases_emblematicas_extraidas?: string[];
  emojis_frecuentes?: string[];
  valores_e_intereses?: string[];
  puntos_fuertes_para_conectar?: string;
  recomendacion_pitch?: string;
  pitch_personalizado_ejemplo?: string;
}

interface BandToneModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: BandContact | null;
  isStitchLight?: boolean;
  toneData: ToneAnalysisData | null;
  isLoading: boolean;
  onReAnalyze: () => void;
  onUseTailoredPitch?: (text: string) => void;
}

export const BandToneModal: React.FC<BandToneModalProps> = ({
  isOpen,
  onClose,
  band,
  isStitchLight = false,
  toneData,
  isLoading,
  onReAnalyze,
  onUseTailoredPitch
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !band) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
        isStitchLight ? 'bg-white text-slate-800' : 'bg-[#1c1b1b] text-neutral-100'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-amber-400">
                Análisis de ADN de Expresión y Tono: {band.nombre_banda}
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                Rastreo IA Grounding de redes sociales y notas de prensa oficiales
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-spin">
              <Radio className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-widest">
                Scrapeando redes sociales de {band.nombre_banda}...
              </h4>
              <p className="text-[10px] text-neutral-400 font-mono max-w-md">
                Analizando publicaciones de Instagram, TikTok, estilo de comunicación, muletillas y tono de voz con Gemini Search Grounding...
              </p>
            </div>
          </div>
        ) : toneData ? (
          <div className="space-y-4">
            {/* 1. Main Tone Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10px] font-mono">
              <div className={`p-3 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-neutral-800'}`}>
                <span className="text-neutral-500 uppercase tracking-wider block text-[9px]">Tono General</span>
                <span className="font-bold text-amber-400 block text-xs mt-0.5">
                  {toneData.tono_comunicacion || 'No especificado'}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-neutral-800'}`}>
                <span className="text-neutral-500 uppercase tracking-wider block text-[9px]">Tratamiento</span>
                <span className="font-bold text-sky-400 block text-xs mt-0.5">
                  {toneData.tratamiento_habitual || 'Tú / Informal'}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-neutral-800'}`}>
                <span className="text-neutral-500 uppercase tracking-wider block text-[9px]">Nivel de Energía</span>
                <span className="font-bold text-emerald-400 block text-xs mt-0.5">
                  {toneData.nivel_energia || 'Alta / Explosiva'}
                </span>
              </div>
            </div>

            {/* 2. Key Vocabulary, Quotes & Emojis */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Vocabulario Clave & Muletillas
                </span>
                {toneData.emojis_frecuentes && toneData.emojis_frecuentes.length > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase mr-1">Emojis:</span>
                    {toneData.emojis_frecuentes.map((e, idx) => (
                      <span key={idx}>{e}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {toneData.vocabulario_clave && toneData.vocabulario_clave.length > 0 ? (
                  toneData.vocabulario_clave.map((word, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 rounded-md text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    >
                      #{word}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500">No se detectaron términos específicos.</span>
                )}
              </div>

              {/* Extracted Quotes from Reels/Posts */}
              {toneData.frases_emblematicas_extraidas && toneData.frases_emblematicas_extraidas.length > 0 && (
                <div className="pt-1.5 border-t border-neutral-800 space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400/90 block">
                    💬 Expresiones extraídas de sus Reels & Posts:
                  </span>
                  <div className="space-y-1">
                    {toneData.frases_emblematicas_extraidas.map((quote, idx) => (
                      <p key={idx} className="text-[10px] font-mono italic text-neutral-300 bg-black/30 p-1.5 rounded border border-neutral-800/60">
                        "{quote}"
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Pitch Recommendation & Connection Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
              <div className={`p-3 rounded-xl border space-y-1 ${isStitchLight ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-900/40 text-amber-200'}`}>
                <span className="font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 text-[9px]">
                  <Flame className="w-3 h-3" /> Punto de Conexión con Bakandeya
                </span>
                <p className="font-sans leading-relaxed text-[11px]">
                  {toneData.puntos_fuertes_para_conectar || 'Intercambio de público festivo y potencia en directo.'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${isStitchLight ? 'bg-sky-50/50 border-sky-200 text-sky-900' : 'bg-sky-950/20 border-sky-900/40 text-sky-200'}`}>
                <span className="font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1 text-[9px]">
                  <HeartHandshake className="w-3 h-3" /> Recomendación de Contacto
                </span>
                <p className="font-sans leading-relaxed text-[11px]">
                  {toneData.recomendacion_pitch || 'Escríbeles con energía, sin rodeos y proponiendo directo compartido.'}
                </p>
              </div>
            </div>

            {/* 4. Tailored Pitch Example */}
            {toneData.pitch_personalizado_ejemplo && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Pitch Adaptado a su Forma de Expresarse
                  </label>
                  <button
                    onClick={() => handleCopy(toneData.pitch_personalizado_ejemplo || '')}
                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? '¡Copiado!' : 'Copiar Texto'}
                  </button>
                </div>

                <textarea
                  readOnly
                  rows={6}
                  value={toneData.pitch_personalizado_ejemplo}
                  className={`w-full p-3 rounded-xl font-mono text-[10px] leading-relaxed focus:outline-none ${
                    isStitchLight
                      ? 'bg-slate-50 border border-slate-200 text-slate-800'
                      : 'bg-black/60 border border-neutral-800 text-neutral-200'
                  }`}
                />

                {onUseTailoredPitch && (
                  <button
                    onClick={() => {
                      onUseTailoredPitch(toneData.pitch_personalizado_ejemplo || '');
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Usar este Pitch Personalizado en Co-Booking
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-neutral-400 font-mono">No hay análisis generado para esta banda todavía.</p>
            <button
              onClick={onReAnalyze}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Iniciar Análisis de Tono
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
