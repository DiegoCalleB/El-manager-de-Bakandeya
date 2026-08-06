import React from 'react';
import { Song, ThemeColors } from '../../types';
import { Sparkles } from 'lucide-react';

interface FavoritosGeneralesViewProps {
  songs: Song[];
  colors: ThemeColors;
  isStitchLight: boolean;
  onUpdateSong: (updatedSong: Song) => void;
}

export const FavoritosGeneralesView: React.FC<FavoritosGeneralesViewProps> = ({
  songs,
  colors,
  isStitchLight,
  onUpdateSong,
}) => {
  return (
    <div
      className={`p-6 rounded-2xl shadow-xl ${
        isStitchLight ? 'bg-white border border-slate-200' : 'bg-[#121111] border border-neutral-800'
      }`}
    >
      <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
        <Sparkles className="w-5 h-5 text-yellow-500" />
        Favoritos Generales
      </h2>
      <p className="text-sm opacity-70 mb-6" style={{ color: colors.text }}>
        Selecciona las canciones imprescindibles del catálogo. Se añadirán automáticamente al crear un nuevo repertorio.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {songs.map((song) => (
          <div
            key={song.id}
            className={`p-4 rounded-xl border flex items-center justify-between ${
              song.favoritoGeneral
                ? isStitchLight
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'bg-indigo-900/20 border-indigo-500/30'
                : isStitchLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <div>
              <div className="font-bold" style={{ color: colors.text }}>{song.titulo}</div>
              <div className="text-xs opacity-60" style={{ color: colors.text }}>{song.albumDisco || 'Sin álbum'}</div>
            </div>
            <button
              onClick={() => {
                onUpdateSong({ ...song, favoritoGeneral: !song.favoritoGeneral });
              }}
              className={`p-2 rounded-full transition-colors ${
                song.favoritoGeneral
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-neutral-200 text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
