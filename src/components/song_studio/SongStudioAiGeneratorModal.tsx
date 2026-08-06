import React from 'react';
import { Wand2, X, Sparkles, RefreshCw } from 'lucide-react';

interface SongStudioAiGeneratorModalProps {
  showGenModalForIdea: string | null;
  onClose: () => void;
  genBpm: number;
  setGenBpm: (bpm: number) => void;
  genKey: string;
  setGenKey: (key: string) => void;
  includeDrums: boolean;
  setIncludeDrums: (v: boolean) => void;
  includeBass: boolean;
  setIncludeBass: (v: boolean) => void;
  drumStyle: 'rock' | 'pop' | 'funk' | 'reggae';
  setDrumStyle: (style: 'rock' | 'pop' | 'funk' | 'reggae') => void;
  genDuration: number;
  setGenDuration: (duration: number) => void;
  isGeneratingAccompaniment: boolean;
  handleGenerateAccompaniment: () => void;
}

export const SongStudioAiGeneratorModal: React.FC<SongStudioAiGeneratorModalProps> = ({
  showGenModalForIdea,
  onClose,
  genBpm,
  setGenBpm,
  genKey,
  setGenKey,
  includeDrums,
  setIncludeDrums,
  includeBass,
  setIncludeBass,
  drumStyle,
  setDrumStyle,
  genDuration,
  setGenDuration,
  isGeneratingAccompaniment,
  handleGenerateAccompaniment,
}) => {
  if (!showGenModalForIdea) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-purple-500/40 bg-zinc-950 p-6 space-y-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Generar Base de Batería y Bajo</h3>
              <p className="text-xs text-purple-300 font-mono">Sintetizador Web Audio de Referencia</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Pista de Referencia Orientativa
          </p>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Genera una secuencia rítmica sintetizada de bajo y batería para escuchar cómo sonaría tu guitarra o voz con acompañamiento. Podrás añadirla como una pista más en el mezclador multipista.
          </p>
        </div>

        <div className="space-y-4">
          {/* BPM & Tonalidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-neutral-400 block mb-1">Tempo (BPM)</label>
              <input
                type="number"
                min={60}
                max={220}
                value={genBpm}
                onChange={(e) => setGenBpm(parseInt(e.target.value) || 120)}
                className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-neutral-400 block mb-1">Tonalidad (Raíz del Bajo)</label>
              <select
                value={genKey}
                onChange={(e) => setGenKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="Do">Do (C)</option>
                <option value="Re">Re (D)</option>
                <option value="Mi">Mi (E)</option>
                <option value="Fa">Fa (F)</option>
                <option value="Sol">Sol (G)</option>
                <option value="La">La (A)</option>
                <option value="Si">Si (B)</option>
              </select>
            </div>
          </div>

          {/* Instrument Checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-neutral-400 block">Instrumentos a incluir:</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                includeDrums ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-black/40 border-neutral-800 text-neutral-400'
              }`}>
                <input
                  type="checkbox"
                  checked={includeDrums}
                  onChange={(e) => setIncludeDrums(e.target.checked)}
                  className="accent-purple-500"
                />
                <span className="text-xs font-bold font-mono">🥁 Batería Synth</span>
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                includeBass ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-black/40 border-neutral-800 text-neutral-400'
              }`}>
                <input
                  type="checkbox"
                  checked={includeBass}
                  onChange={(e) => setIncludeBass(e.target.checked)}
                  className="accent-purple-500"
                />
                <span className="text-xs font-bold font-mono">🎸 Bajo Tónica</span>
              </label>
            </div>
          </div>

          {/* Drum Style Selector */}
          {includeDrums && (
            <div>
              <label className="text-xs font-mono text-neutral-400 block mb-1">Patrón Rítmico de Batería</label>
              <div className="grid grid-cols-4 gap-2">
                {(['rock', 'pop', 'funk', 'reggae'] as const).map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setDrumStyle(style)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                      drumStyle === style
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-black/40 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="text-xs font-mono text-neutral-400 block mb-1">Duración del Bucle ({genDuration} segundos)</label>
            <input
              type="range"
              min={10}
              max={120}
              step={10}
              value={genDuration}
              onChange={(e) => setGenDuration(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-neutral-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerateAccompaniment}
            disabled={isGeneratingAccompaniment || (!includeDrums && !includeBass)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
          >
            {isGeneratingAccompaniment ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sintetizando Pistas...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Sintetizar y Añadir al Mezclador
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
