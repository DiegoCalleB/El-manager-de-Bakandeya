import React, { useState } from 'react';
import { Song, ThemeColors } from '../../types';
import { Disc3, Star, Play, Pause, Trash2, ArrowUp, ArrowDown, Edit3, Plus, Music, Clock, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { AlbumCover } from '../AlbumCover';
import { uploadFileToServer, saveSongsToLocalStorageSafely } from '../../utils/audioStorage';
import { apiFetch } from '../../utils/api';

interface DiscografiaViewProps {
  songs: Song[];
  albumsList: string[];
  colors: ThemeColors;
  isStitchLight: boolean;
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  toggleFavoriteSong: (id: string) => void;
  activePlayerSong?: Song | null;
  isPlayerPlaying?: boolean;
  onSelectSong?: (song: Song | null, autoPlay?: boolean) => void;
  onRequestDeleteAlbum?: (albumName: string, songCount: number) => void;
  onEditAlbum?: (albumName: string) => void;
  onCreateAlbum?: () => void;
}

const formatTotalDuration = (songs: Song[]): string => {
  const totalSeconds = songs.reduce((acc, s) => {
    if (typeof s.duracionSegundos === 'number' && s.duracionSegundos > 0) {
      return acc + s.duracionSegundos;
    }
    if (s.duracion && s.duracion.includes(':')) {
      const parts = s.duracion.split(':');
      const m = parseInt(parts[0], 10) || 0;
      const sec = parseInt(parts[1], 10) || 0;
      return acc + (m * 60 + sec);
    }
    return acc;
  }, 0);

  if (totalSeconds <= 0) return '0 min';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} h ${remMins} min`;
  }
  return `${mins} min ${secs > 0 ? `${secs} s` : ''}`;
};

export const DiscografiaView: React.FC<DiscografiaViewProps> = ({
  songs = [],
  albumsList = [],
  colors,
  isStitchLight,
  setSongs,
  toggleFavoriteSong,
  activePlayerSong,
  isPlayerPlaying = false,
  onSelectSong,
  onRequestDeleteAlbum,
  onEditAlbum,
  onCreateAlbum,
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<'todos' | 'albumes' | 'singles'>('todos');
  const [expandedAlbums, setExpandedAlbums] = useState<Record<string, boolean>>({});

  const safeSongs = (songs || []).filter((s): s is Song => Boolean(s && typeof s === 'object' && s.id));
  const safeAlbumsList = (albumsList || []).filter((a): a is string => Boolean(a && typeof a === 'string'));

  const allNonEmptyAlbums = safeAlbumsList.filter((a) => a !== 'todos');

  const filteredAlbums = allNonEmptyAlbums.filter((album) => {
    if (activeFilterTab === 'albumes') {
      return album !== 'Singles / Sin Disco';
    }
    if (activeFilterTab === 'singles') {
      return album === 'Singles / Sin Disco';
    }
    return true;
  });

  const toggleAlbumExpand = (albumName: string) => {
    setExpandedAlbums((prev) => ({
      ...prev,
      [albumName]: !prev[albumName],
    }));
  };

  const areAllExpanded = filteredAlbums.length > 0 && filteredAlbums.every((a) => expandedAlbums[a] === true);

  const toggleAllAlbums = () => {
    const nextState = !areAllExpanded;
    const newMap: Record<string, boolean> = {};
    filteredAlbums.forEach((a) => {
      newMap[a] = nextState;
    });
    setExpandedAlbums(newMap);
  };

  const handleMoveSongInAlbum = (albumName: string, sortedAlbumSongs: Song[], songId: string, direction: 'up' | 'down') => {
    const index = sortedAlbumSongs.findIndex((s) => s.id === songId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedAlbumSongs.length) return;

    const newAlbumSongs = [...sortedAlbumSongs];
    const temp = newAlbumSongs[index];
    newAlbumSongs[index] = newAlbumSongs[targetIndex];
    newAlbumSongs[targetIndex] = temp;

    const updatedSongsOrder = new Map<string, number>();
    newAlbumSongs.forEach((s, idx) => {
      updatedSongsOrder.set(s.id, idx + 1);
    });

    const updatedAllSongs = safeSongs.map((s) => {
      if (updatedSongsOrder.has(s.id)) {
        return { ...s, ordenAlbum: updatedSongsOrder.get(s.id) };
      }
      return s;
    });

    setSongs(updatedAllSongs);
    saveSongsToLocalStorageSafely(updatedAllSongs);

    // Persist order updates to backend database
    newAlbumSongs.forEach((s) => {
      const newOrd = updatedSongsOrder.get(s.id);
      const updatedSong = { ...s, ordenAlbum: newOrd };
      apiFetch(`/api/songs/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSong),
      }).catch((err) => console.error('Error updating song order in album on server:', err));
    });
  };

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl shadow-2xl transition-all ${
        isStitchLight ? 'bg-white border border-slate-200' : 'bg-[#121212] border border-neutral-800'
      }`}
    >
      {/* Top Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1db954]/15 border border-[#1db954]/30 flex items-center justify-center shadow-inner">
              <Disc3 className="w-6 h-6 text-[#1db954]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight" style={{ color: colors.text }}>
                Discografía
              </h2>
              <p className="text-xs font-mono opacity-60 mt-0.5">
                {allNonEmptyAlbums.length} {allNonEmptyAlbums.length === 1 ? 'lanzamiento' : 'lanzamientos'} • {safeSongs.length} temas catalogados
              </p>
            </div>
          </div>
        </div>

        {/* Filter Pills, Expand All, & Create Album */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tabs */}
          <div className={`p-1 rounded-full border flex items-center gap-1 ${isStitchLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-900 border-neutral-800'}`}>
            <button
              type="button"
              onClick={() => setActiveFilterTab('todos')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilterTab === 'todos'
                  ? 'bg-[#1db954] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('albumes')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilterTab === 'albumes'
                  ? 'bg-[#1db954] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Álbumes
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('singles')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilterTab === 'singles'
                  ? 'bg-[#1db954] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sencillos y EP
            </button>
          </div>

          {/* Expand/Collapse All Button */}
          {filteredAlbums.length > 0 && (
            <button
              type="button"
              onClick={toggleAllAlbums}
              className={`px-3.5 py-2 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isStitchLight
                  ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  : 'bg-neutral-800 border-neutral-700 text-zinc-300 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#1db954]" />
              <span>{areAllExpanded ? 'Plegar Todos' : 'Desplegar Todos'}</span>
            </button>
          )}

          {onCreateAlbum && (
            <button
              type="button"
              onClick={onCreateAlbum}
              className="px-4 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nuevo Disco</span>
            </button>
          )}
        </div>
      </div>

      {/* Albums Stack */}
      <div className="space-y-4">
        {filteredAlbums.map((album) => {
          const rawAlbumSongs = safeSongs.filter((s) => {
            const songAlbum = s.albumDisco || s.album || '';
            if (album === 'Singles / Sin Disco') {
              return !songAlbum || songAlbum === 'Singles / Sin Disco';
            }
            return songAlbum === album;
          });

          const sortedAlbumSongs = [...rawAlbumSongs].sort((a, b) => {
            const oA = typeof a.ordenAlbum === 'number' ? a.ordenAlbum : 999;
            const oB = typeof b.ordenAlbum === 'number' ? b.ordenAlbum : 999;
            return oA - oB;
          });

          const coverUrl = rawAlbumSongs.find((s) => s.portadaUrl)?.portadaUrl;
          const isExpanded = expandedAlbums[album] === true;

          const isPlayingAlbum = !!(
            activePlayerSong &&
            isPlayerPlaying &&
            rawAlbumSongs.some((s) => s.id === activePlayerSong.id)
          );

          const handlePlayAlbum = (e?: React.MouseEvent) => {
            if (e) e.stopPropagation();
            if (onSelectSong && sortedAlbumSongs.length > 0) {
              if (isPlayingAlbum) {
                onSelectSong(sortedAlbumSongs[0], false);
              } else {
                onSelectSong(sortedAlbumSongs[0], true);
              }
            }
          };

          return (
            <div
              key={album}
              className={`rounded-2xl overflow-hidden border transition-all duration-200 shadow-md ${
                isStitchLight
                  ? 'border-slate-200 bg-slate-50 shadow-slate-200/50'
                  : 'border-neutral-800/90 bg-[#161616] hover:border-neutral-700'
              }`}
            >
              {/* Compact Album Header Bar */}
              <div
                onClick={() => toggleAlbumExpand(album)}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                  isStitchLight
                    ? 'hover:bg-slate-100/80 border-b border-slate-200'
                    : 'hover:bg-neutral-800/40 border-b border-neutral-800/80'
                }`}
              >
                {/* Left: Cover & Information */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="shrink-0 relative group" onClick={(e) => e.stopPropagation()}>
                    <AlbumCover
                      url={coverUrl}
                      onPlay={onSelectSong ? handlePlayAlbum : undefined}
                      isPlaying={isPlayingAlbum}
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl shadow-xl border border-white/10 object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1db954]/15 text-[#1ed760] border border-[#1db954]/30 text-[9px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1">
                        <Disc3 className="w-3 h-3" />
                        {album === 'Singles / Sin Disco' ? 'SENCILLOS & INÉDITAS' : 'ÁLBUM OFICIAL'}
                      </span>
                    </div>

                    <h3
                      className="text-lg sm:text-xl font-bold font-display tracking-tight truncate leading-snug"
                      style={{ color: colors.text }}
                      title={album}
                    >
                      {album}
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mt-1 flex-wrap">
                      <span className="font-semibold text-[#1ed760]">Balandeya</span>
                      <span>•</span>
                      <span>{sortedAlbumSongs.length} {sortedAlbumSongs.length === 1 ? 'canción' : 'canciones'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {formatTotalDuration(sortedAlbumSongs)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Controls & Fold/Unfold Chevron */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                  {sortedAlbumSongs.length > 0 && onSelectSong && (
                    <button
                      type="button"
                      onClick={handlePlayAlbum}
                      className="px-3.5 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs font-mono flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title={isPlayingAlbum ? 'Pausar disco' : 'Reproducir disco'}
                    >
                      {isPlayingAlbum ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          <span className="hidden sm:inline">Reproducir</span>
                        </>
                      )}
                    </button>
                  )}

                  {onEditAlbum && (
                    <button
                      type="button"
                      onClick={() => onEditAlbum(album)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isStitchLight
                          ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Gestionar las canciones de este álbum"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Gestionar</span>
                    </button>
                  )}

                  {onRequestDeleteAlbum && album !== 'Singles / Sin Disco' && (
                    <button
                      type="button"
                      onClick={() => onRequestDeleteAlbum(album, sortedAlbumSongs.length)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer shrink-0"
                      title="Eliminar álbum"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Expand / Collapse Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleAlbumExpand(album)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isExpanded
                        ? 'bg-[#1db954]/20 border-[#1db954]/40 text-[#1ed760]'
                        : isStitchLight
                        ? 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-300'
                        : 'bg-white/10 border-white/10 text-zinc-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <span>{isExpanded ? 'Ocultar' : `Ver temas (${sortedAlbumSongs.length})`}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Tracklist Section */}
              {isExpanded && (
                <div className={`p-4 sm:p-5 border-t ${isStitchLight ? 'bg-white border-slate-200' : 'bg-[#121212] border-neutral-800'}`}>
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-2 text-neutral-400 border-b border-white/10 mb-2">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-6 sm:col-span-6 flex items-center gap-1">
                      <Music className="w-3 h-3 text-neutral-500" />
                      <span>Título</span>
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-center">Tono / BPM</div>
                    <div className="col-span-2 sm:col-span-2 text-right pr-2">Acciones</div>
                  </div>

                  {/* Songs List */}
                  <div className="space-y-1">
                    {sortedAlbumSongs.map((s, idx) => {
                      const isCurrentTrack = activePlayerSong?.id === s.id;
                      const isTrackPlaying = isCurrentTrack && isPlayerPlaying;

                      return (
                        <div
                          key={s.id}
                          className={`grid grid-cols-12 gap-2 items-center py-2 px-3 rounded-xl transition-all border-b last:border-0 group/track ${
                            isStitchLight ? 'border-slate-200/60' : 'border-white/5'
                          } ${
                            isCurrentTrack
                              ? isStitchLight
                                ? 'bg-emerald-100/90 text-emerald-950 font-semibold shadow-sm'
                                : 'bg-[#1db954]/15 text-[#1ed760] font-semibold border-[#1db954]/30'
                              : isStitchLight
                              ? 'hover:bg-slate-100/80 text-slate-800'
                              : 'hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          {/* Track Number / Play state */}
                          <div className="col-span-1 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectSong) {
                                  onSelectSong(s, true);
                                }
                              }}
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                isTrackPlaying
                                  ? 'bg-[#1db954] text-black shadow-md scale-105'
                                  : 'bg-zinc-800/80 hover:bg-[#1db954] hover:text-black text-zinc-400 opacity-90 group-hover/track:opacity-100'
                              }`}
                              title={isTrackPlaying ? 'Pausar canción' : 'Reproducir canción'}
                            >
                              {isTrackPlaying ? (
                                <Pause className="w-3 h-3 fill-current" />
                              ) : (
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              )}
                            </button>
                          </div>

                          {/* Song Title & Status Badges */}
                          <div className="col-span-6 flex items-center gap-2 truncate pr-1">
                            <span className="text-xs font-mono text-neutral-500 w-4 shrink-0 text-right">
                              {idx + 1}
                            </span>
                            <span
                              className={`truncate font-medium text-xs cursor-pointer hover:underline ${
                                isCurrentTrack ? 'text-[#1ed760] font-bold' : ''
                              }`}
                              onClick={() => onSelectSong?.(s, false)}
                              title="Ver detalles de la canción"
                            >
                              {s.titulo}
                            </span>

                            {s.estadoTema && (
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                  s.estadoTema === 'listo'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : s.estadoTema === 'ensayando'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-zinc-700/50 text-zinc-400'
                                }`}
                              >
                                {s.estadoTema}
                              </span>
                            )}
                          </div>

                          {/* Key & BPM */}
                          <div className="col-span-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                                isStitchLight
                                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                                  : 'bg-white/5 border-white/10 text-zinc-400'
                              }`}
                            >
                              {s.tonalidad || '—'} {s.bpm ? `• ${s.bpm} BPM` : ''}
                            </span>
                          </div>

                          {/* Actions Column */}
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col opacity-0 group-hover/track:opacity-100 transition-opacity">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveSongInAlbum(album, sortedAlbumSongs, s.id, 'up')}
                                className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
                                title="Subir orden"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === sortedAlbumSongs.length - 1}
                                onClick={() => handleMoveSongInAlbum(album, sortedAlbumSongs, s.id, 'down')}
                                className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
                                title="Bajar orden"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Favorite Button */}
                            <button
                              type="button"
                              onClick={() => toggleFavoriteSong(s.id)}
                              className={`p-1 rounded-full transition-all cursor-pointer ${
                                s.favoritoGeneral
                                  ? 'text-amber-400 hover:text-amber-300 scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                                  : 'text-zinc-500 hover:text-amber-400'
                              }`}
                              title={
                                s.favoritoGeneral
                                  ? 'Quitar de favoritos'
                                  : 'Marcar como favorita'
                              }
                            >
                              <Star className={`w-3.5 h-3.5 ${s.favoritoGeneral ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {sortedAlbumSongs.length === 0 && (
                      <div className="text-center py-6 text-neutral-500 text-xs italic font-mono bg-white/5 rounded-2xl border border-dashed border-white/10">
                        Disco sin canciones asignadas. Haz clic en "Gestionar" para añadir temas a este álbum.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredAlbums.length === 0 && (
          <div className="text-center py-16 opacity-60">
            <Disc3 className="w-12 h-12 mx-auto mb-3 text-neutral-500" />
            <p className="text-sm font-mono">No hay discos creados en esta categoría.</p>
          </div>
        )}
      </div>
    </div>
  );
};
