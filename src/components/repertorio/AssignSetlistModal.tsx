import React from 'react';
import { X } from 'lucide-react';
import { ThemeColors, Setlist, Concert, Rehearsal } from '../../types';

interface AssignSetlistModalProps {
  assigningSetlist: Setlist | null;
  colors: ThemeColors;
  isStitchLight: boolean;
  concerts: Concert[];
  rehearsals: Rehearsal[];
  selectedConcertToAssign: string;
  onSelectEvent: (id: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function AssignSetlistModal({
  assigningSetlist,
  colors,
  isStitchLight,
  concerts,
  rehearsals,
  selectedConcertToAssign,
  onSelectEvent,
  onClose,
  onSave
}: AssignSetlistModalProps) {
  if (!assigningSetlist) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-md p-5 rounded-2xl space-y-4 shadow-2xl ${colors.card}`}>
        <div className="flex justify-between items-center pb-3">
          <h3 className={`text-sm font-bold font-mono uppercase ${colors.text}`}>
            Asignar Repertorio a Concierto / Ensayo
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-neutral-300 font-sans">
          Selecciona el concierto o ensayo al que deseas vincular el repertorio{' '}
          <strong className="text-[#d1b375] font-mono">"{assigningSetlist.nombre}"</strong>:
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-[10px] font-mono">
          <div className="text-[10px] text-[#d1b375] uppercase font-bold pt-1">Próximos Conciertos:</div>
          {concerts.length === 0 ? (
            <div className="text-neutral-500 italic text-[10px]">No hay conciertos programados</div>
          ) : (
            concerts.map(c => (
              <label
                key={c.id}
                className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer ${
                  selectedConcertToAssign === c.id
                    ? 'border-amber-400 bg-[#d1b375]/15'
                    : 'border-neutral-800 bg-neutral-900/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="event_assign"
                    value={c.id}
                    checked={selectedConcertToAssign === c.id}
                    onChange={() => onSelectEvent(c.id)}
                  />
                  <div>
                    <div className="font-bold text-white">{c.sala} ({c.ciudad})</div>
                    <div className="text-[10px] text-neutral-400">{c.fecha}</div>
                  </div>
                </div>
              </label>
            ))
          )}

          <div className="text-[10px] text-[#10b981] uppercase font-bold pt-3">Próximos Ensayos:</div>
          {rehearsals.length === 0 ? (
            <div className="text-neutral-500 italic text-[10px]">No hay ensayos programados</div>
          ) : (
            rehearsals.map(r => (
              <label
                key={r.id}
                className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer ${
                  selectedConcertToAssign === r.id
                    ? 'border-emerald-400 bg-[#10b981]/15'
                    : 'border-neutral-800 bg-neutral-900/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="event_assign"
                    value={r.id}
                    checked={selectedConcertToAssign === r.id}
                    onChange={() => onSelectEvent(r.id)}
                  />
                  <div>
                    <div className="font-bold text-white">Ensayo en {r.lugar}</div>
                    <div className="text-[10px] text-neutral-400">{r.fecha} a las {r.hora}</div>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="pt-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg text-neutral-300 text-[10px] font-mono"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!selectedConcertToAssign}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold disabled:opacity-40 ${
              isStitchLight ? 'bg-sky-500/15 text-white' : 'bg-[#f2ca50] text-black'
            }`}
          >
            Guardar Asignación
          </button>
        </div>
      </div>
    </div>
  );
}
