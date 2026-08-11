import React, { useState } from 'react';
import { BandContact } from '../../types';
import { Repeat, X, Check, Copy, MessageCircle, Send } from 'lucide-react';

interface BandPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: BandContact | null;
  isStitchLight?: boolean;
  proposedBakandeyaCity: 'Madrid' | 'Sevilla' | 'Ambas';
  setProposedBakandeyaCity: (val: 'Madrid' | 'Sevilla' | 'Ambas') => void;
  proposedVenueBakandeya: string;
  setProposedVenueBakandeya: (val: string) => void;
  proposedMonth: string;
  setProposedMonth: (val: string) => void;
  generatePitchText: (band: BandContact) => string;
  customPitchText?: string;
}

export const BandPitchModal: React.FC<BandPitchModalProps> = ({
  isOpen,
  onClose,
  band,
  isStitchLight = false,
  proposedBakandeyaCity,
  setProposedBakandeyaCity,
  proposedVenueBakandeya,
  setProposedVenueBakandeya,
  proposedMonth,
  setProposedMonth,
  generatePitchText,
  customPitchText
}) => {
  const [copiedPitch, setCopiedPitch] = useState(false);

  if (!isOpen || !band) return null;

  const pitchText = customPitchText || generatePitchText(band);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
        isStitchLight ? 'bg-white text-slate-800' : 'bg-[#1c1b1b] text-neutral-100'
      }`}>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold font-display uppercase tracking-wider text-sky-400">
              Generador de Pitch Date Swap: Bakandeya x {band.nombre_banda}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Config Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-900 text-[10px] font-mono">
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase mb-1">Ciudad de Bakandeya</label>
            <select
              value={proposedBakandeyaCity}
              onChange={(e) => setProposedBakandeyaCity(e.target.value as 'Madrid' | 'Sevilla' | 'Ambas')}
              className="w-full bg-neutral-800 text-white px-2 py-1 rounded-lg text-[10px]"
            >
              <option value="Madrid">Madrid</option>
              <option value="Sevilla">Sevilla</option>
              <option value="Ambas">Madrid & Sevilla</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 uppercase mb-1">Sala propuesta en Madrid/Sevilla</label>
            <input
              type="text"
              value={proposedVenueBakandeya}
              onChange={(e) => setProposedVenueBakandeya(e.target.value)}
              className="w-full bg-neutral-800 text-white px-2 py-1 rounded-lg text-[10px]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 uppercase mb-1">Periodo / Mes Estimado</label>
            <input
              type="text"
              value={proposedMonth}
              onChange={(e) => setProposedMonth(e.target.value)}
              className="w-full bg-neutral-800 text-white px-2 py-1 rounded-lg text-[10px]"
            />
          </div>
        </div>

        {/* Generated Pitch Preview Box */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#d1b375] flex items-center justify-between">
            <span>Mensaje de Propuesta Generado (Músico a Músico)</span>
            <span className="text-[10px] text-neutral-500 lowercase">editable & listo para enviar</span>
          </label>

          <div className="p-4 rounded-xl bg-neutral-950 text-[10px] font-mono text-neutral-200 whitespace-pre-wrap leading-relaxed select-text max-h-72 overflow-y-auto">
            {pitchText}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-[10px] font-mono text-neutral-500">
            Destinatario: <strong className="text-white">{band.contacto_nombre || band.nombre_banda}</strong>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy to Clipboard */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(pitchText);
                setCopiedPitch(true);
                setTimeout(() => setCopiedPitch(false), 2000);
              }}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-mono text-[10px] transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copiedPitch ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPitch ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            {/* WhatsApp Link if phone is present */}
            {band.telefono && (
              <a
                href={`https://wa.me/${band.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(pitchText)}`}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 bg-[#10b981]/15 hover:bg-[#10b981]/15 text-white font-mono text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar WhatsApp</span>
              </a>
            )}

            {/* Mailto Link if email is present */}
            {band.email && (
              <a
                href={`mailto:${band.email}?subject=${encodeURIComponent(`Propuesta Date Swap: Bakandeya x ${band.nombre_banda}`)}&body=${encodeURIComponent(pitchText)}`}
                className="px-2 py-1 bg-sky-500/15 hover:bg-sky-500/15 text-white font-mono text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Email</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
