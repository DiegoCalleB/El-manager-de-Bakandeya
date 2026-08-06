import React from 'react';
import { Trash2, FolderMinus, X } from 'lucide-react';

export interface ConfirmDeleteAlbumData {
  albumName: string;
  songCount: number;
}

interface ConfirmDeleteAlbumModalProps {
  data: ConfirmDeleteAlbumData | null;
  onClose: () => void;
  onUnassignSongs: (albumName: string) => void;
  onDeleteAlbumAndSongs: (albumName: string) => void;
}

export function ConfirmDeleteAlbumModal({
  data,
  onClose,
  onUnassignSongs,
  onDeleteAlbumAndSongs,
}: ConfirmDeleteAlbumModalProps) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Eliminar Disco</h3>
              <p className="text-xs text-rose-300 font-mono mt-0.5">"{data.albumName}"</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-800/60 p-3 rounded-xl border border-white/5">
          Este disco contiene <strong className="text-white font-bold">{data.songCount} {data.songCount === 1 ? 'canción' : 'canciones'}</strong>. Selecciona la opción que prefieras para las canciones:
        </p>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              onUnassignSongs(data.albumName);
              onClose();
            }}
            className="w-full text-left p-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer group flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
              <FolderMinus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">Desvincular canciones (Recomendado)</div>
              <div className="text-[11px] text-amber-200/70 mt-0.5">
                Elimina el disco de la discografía pero mantiene sus canciones en el catálogo como "Sin Disco".
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onDeleteAlbumAndSongs(data.albumName);
              onClose();
            }}
            className="w-full text-left p-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer group flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-300">Eliminar disco y todas sus canciones</div>
              <div className="text-[11px] text-rose-200/70 mt-0.5">
                Elimina permanentemente el disco y sus {data.songCount} canciones del catálogo y repertorios.
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
