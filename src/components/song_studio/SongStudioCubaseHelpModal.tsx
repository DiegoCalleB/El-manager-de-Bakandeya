import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface SongStudioCubaseHelpModalProps {
  onClose: () => void;
}

export const SongStudioCubaseHelpModal: React.FC<SongStudioCubaseHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#12111d] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-zinc-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Atajos de Teclado Tipo Cubase DAW
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-500/40">
                Modo Studio
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Controla la reproducción y grabación multipista directamente con tu teclado en tiempo real.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Play / Pausa</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
              Espacio
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Pausar Mantenida</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold shadow">
              P
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Detener e ir a Inicio (Stop)</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-rose-500/40 text-rose-300 font-bold shadow">
              0 / Stop / Home
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Alternar Bucle (Loop ON/OFF)</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
              L / /
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Fijar Cue In (Inicio Bucle)</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-indigo-500/40 text-indigo-300 font-bold shadow">
              I
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Fijar Cue Out (Fin Bucle)</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
              O
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Grabar Pista Overdub</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-rose-500/40 text-rose-300 font-bold shadow">
              R / Numpad *
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Nueva Idea / Proyecto</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-emerald-500/40 text-emerald-300 font-bold shadow">
              N
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Retroceder 5s / 15s</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
              ←  /  Shift + ←
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Avanzar 5s / 15s</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
              →  /  Shift + →
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Alternar Silencio (Mute)</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold shadow">
              M
            </kbd>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-neutral-300">Alternar Solo</span>
            <kbd className="px-2 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold shadow">
              S
            </kbd>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-white/10">
          <span className="text-[11px] text-neutral-500 font-mono">
            💡 Presiona <kbd className="px-1 py-0.5 rounded bg-black/50 border border-white/20 text-neutral-300">K</kbd> o <kbd className="px-1 py-0.5 rounded bg-black/50 border border-white/20 text-neutral-300">?</kbd> en cualquier momento para abrir este menú.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all cursor-pointer shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
