import React from 'react';
import { Song, Setlist, SetlistItem } from '../../types';
import { 
  Printer, Music, Mic, Radio, SkipBack, SkipForward, Play, Pause, Repeat, Heart
} from 'lucide-react';
import { SHOW_ITEM_TYPES, formatSecondsToMmSs } from '../RepertorioSetlists';

interface EscenarioViewProps {
  activeSetlist: Setlist | null;
  setlists: Setlist[];
  activeSetlistId: string;
  setActiveSetlistId: (id: string) => void;
  songs: Song[];
  setShowPdfPreview: (val: boolean) => void;
  stageAudioRef: React.RefObject<HTMLAudioElement | null>;
  stagePlayingIndex: number | null;
  setStagePlayingIndex: (idx: number | null) => void;
  stageIsPlaying: boolean;
  setStageIsPlaying: (playing: boolean) => void;
  stageCurrentTime: number;
  setStageCurrentTime: (time: number) => void;
  stageItemDuration: number;
  stageResolvedUrl: string | null;
  stageAutoplayNext: boolean;
  setStageAutoplayNext: (val: boolean) => void;
  handleStageAudioEnded: () => void;
  handleStageSeek: (val: number) => void;
  handleStagePrev: () => void;
  handleStageNext: () => void;
  toggleStagePlayPause: () => void;
  toggleFavoriteSong: (id: string) => void;
  setEditingShowItem: (item: SetlistItem | null) => void;
  setShowItemAudioUrl: (url: string) => void;
  setShowShowItemModal: (val: boolean) => void;
  formatItemDuration: (item: SetlistItem) => string;
}

export const EscenarioView: React.FC<EscenarioViewProps> = ({
  activeSetlist,
  setlists,
  activeSetlistId,
  setActiveSetlistId,
  songs,
  setShowPdfPreview,
  stageAudioRef,
  stagePlayingIndex,
  setStagePlayingIndex,
  stageIsPlaying,
  setStageIsPlaying,
  stageCurrentTime,
  setStageCurrentTime,
  stageItemDuration,
  stageResolvedUrl,
  stageAutoplayNext,
  setStageAutoplayNext,
  handleStageAudioEnded,
  handleStageSeek,
  handleStagePrev,
  handleStageNext,
  toggleStagePlayPause,
  toggleFavoriteSong,
  setEditingShowItem,
  setShowItemAudioUrl,
  setShowShowItemModal,
  formatItemDuration
}) => {
  const currentStageItem = (stagePlayingIndex !== null && activeSetlist) ? activeSetlist.items[stagePlayingIndex] : null;
  const currentStageSong = currentStageItem && currentStageItem.tipoItem === 'cancion' 
    ? songs.find(s => s.id === currentStageItem.songId) 
    : null;
  const isCurrentSongFavorited = currentStageSong?.favoritoGeneral || false;
  const stageProgressPct = stageItemDuration > 0 ? Math.min(100, (stageCurrentTime / stageItemDuration) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-black space-y-6 text-white shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#1db954]/20 border border-[#1db954]/40 text-[#1ed760] font-mono text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#1db954] animate-ping" />
            Directo & Concierto Completo
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            {activeSetlist ? activeSetlist.nombre : 'Sin Setlist Seleccionado'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeSetlistId}
            onChange={(e) => setActiveSetlistId(e.target.value)}
            className="bg-neutral-900 text-[#d1b375] text-[10px] font-mono py-2 px-3 rounded-xl focus:outline-none"
          >
            {setlists.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>

          <button
            onClick={() => setShowPdfPreview(true)}
            className="px-2 py-1 bg-[#f2ca50] text-black font-mono font-extrabold text-[10px] rounded-xl hover:bg-[#d1b375]/15 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Exportar</span>
          </button>
        </div>
      </div>

      <audio
        ref={stageAudioRef as any}
        onEnded={handleStageAudioEnded}
        onTimeUpdate={(e) => setStageCurrentTime(Math.round(e.currentTarget.currentTime))}
      />

      {/* CONCERT PLAYER CONSOLE (SPOTIFY LIVE BAR) */}
      {activeSetlist && activeSetlist.items.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#181818] border border-white/10 space-y-4 shadow-2xl relative overflow-hidden">
          {/* Subtle top glow line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1db954]/60 to-transparent" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Active Track Metadata & Heart Favorite */}
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className="w-13 h-13 rounded-xl bg-[#282828] border border-white/10 flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden group">
                {currentStageSong?.portadaUrl ? (
                  <img src={currentStageSong.portadaUrl} alt={currentStageSong.titulo} className="w-full h-full object-cover" />
                ) : stagePlayingIndex !== null ? (
                  currentStageItem?.tipoItem === 'cancion' ? (
                    <Music className="w-6 h-6 text-[#1ed760] animate-bounce" />
                  ) : (
                    <Mic className="w-6 h-6 text-sky-400 animate-pulse" />
                  )
                ) : (
                  <Radio className="w-6 h-6 text-zinc-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-2">
                  <span>
                    {stagePlayingIndex !== null 
                      ? `En Directo (${stagePlayingIndex + 1}/${activeSetlist.items.length})`
                      : 'Reproductor de Concierto'}
                  </span>
                  {stageResolvedUrl ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#1db954]/20 text-[#1ed760] border border-[#1db954]/30 font-bold">
                      Audio Real
                    </span>
                  ) : stagePlayingIndex !== null ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      Simulación
                    </span>
                  ) : null}
                </div>

                <div className="text-base sm:text-lg font-extrabold font-mono text-white truncate max-w-xs sm:max-w-md flex items-center gap-2">
                  <span>
                    {currentStageItem
                      ? (currentStageItem.tipoItem === 'cancion'
                          ? currentStageSong?.titulo || 'Canción'
                          : currentStageItem.tituloCustom || 'Interludio / Presentación')
                      : 'Listos para iniciar el concierto'}
                  </span>
                </div>

                {currentStageSong && (
                  <div className="text-xs font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span>{currentStageSong.tonalidad || 'Am'}</span>
                    <span>•</span>
                    <span>{currentStageSong.bpm || 120} BPM</span>
                    {currentStageSong.afinacion && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400/90">{currentStageSong.afinacion}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Heart Favorite Button (Spotify Style) */}
              {currentStageSong && (
                <button
                  onClick={() => toggleFavoriteSong(currentStageSong.id)}
                  className="p-2.5 rounded-full hover:bg-zinc-800 transition-all cursor-pointer group flex items-center justify-center shrink-0 ml-1"
                  title={isCurrentSongFavorited ? "Quitar de tus temas favoritos" : "Guardar en tus favoritos (Spotify)"}
                >
                  <Heart 
                    className={`w-5 h-5 transition-all transform group-active:scale-125 ${
                      isCurrentSongFavorited 
                        ? 'fill-[#1db954] text-[#1db954] drop-shadow-[0_0_8px_rgba(29,185,84,0.5)] scale-110' 
                        : 'text-zinc-400 group-hover:text-white'
                    }`}
                  />
                </button>
              )}

              {/* Modify Audio Button for Show Items in Stage Mode */}
              {currentStageItem && currentStageItem.tipoItem !== 'cancion' && (
                <button
                  onClick={() => {
                    setEditingShowItem(currentStageItem);
                    setShowItemAudioUrl(currentStageItem.audioUrl || '');
                    setShowShowItemModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-500/40 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ml-1 hover:scale-105 shadow-md"
                  title="Grabar o subir audio para esta presentación / interludio"
                >
                  <Mic className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">{currentStageItem.audioUrl ? 'Modificar Audio' : '+ Subir / Grabar Audio'}</span>
                </button>
              )}
            </div>

            {/* Minimalist Circular Playback Controls */}
            <div className="flex items-center gap-3">
              {/* Previous Track */}
              <button
                onClick={handleStagePrev}
                className="w-10 h-10 rounded-full bg-[#282828] hover:bg-[#3e3e3e] text-zinc-300 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                title="Pista anterior"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Play / Pause Circular Main Button */}
              <button
                onClick={toggleStagePlayPause}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold flex items-center justify-center shadow-xl shadow-[#1db954]/25 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                title={stageIsPlaying ? "Pausar show" : "Iniciar directo"}
              >
                {stageIsPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" strokeWidth={2.5} />
                )}
              </button>

              {/* Next Track */}
              <button
                onClick={handleStageNext}
                className="w-10 h-10 rounded-full bg-[#282828] hover:bg-[#3e3e3e] text-zinc-300 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                title="Pista siguiente"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* Autoplay / Repeat Continuous Link */}
              <button
                onClick={() => setStageAutoplayNext(!stageAutoplayNext)}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  stageAutoplayNext 
                    ? 'bg-[#1db954]/20 text-[#1ed760] border border-[#1db954]/50 shadow-sm' 
                    : 'bg-[#282828] text-zinc-400 border border-transparent hover:text-white'
                }`}
                title={stageAutoplayNext ? "Autoplay continuo activado" : "Autoplay desactivado"}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Striated / Ridged Progress Seeker Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400 font-bold px-0.5">
              <span>{formatSecondsToMmSs(stageCurrentTime)}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                {stageIsPlaying ? '• EN REPRODUCCIÓN' : 'PAUSADO'}
              </span>
              <span>{formatSecondsToMmSs(stageItemDuration)}</span>
            </div>

            {/* Ridged Progress Track */}
            <div className="relative w-full h-3.5 rounded-full bg-[#242424] border border-white/5 overflow-hidden group cursor-pointer shadow-inner flex items-center">
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1.5px, transparent 1.5px, transparent 7px)'
                }}
              />

              <div 
                className="h-full bg-gradient-to-r from-[#1db954] via-[#1ed760] to-[#20df64] transition-all duration-150 relative shadow-[0_0_12px_rgba(29,185,84,0.4)]"
                style={{ width: `${stageProgressPct}%` }}
              >
                <div 
                  className="absolute inset-0 opacity-40 pointer-events-none" 
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(0, 0, 0, 0.5) 3px, rgba(0, 0, 0, 0.5) 6px)'
                  }}
                />
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff] opacity-90" />
              </div>

              <input
                type="range"
                min={0}
                max={stageItemDuration || 100}
                value={stageCurrentTime}
                onChange={(e) => handleStageSeek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
            </div>
          </div>
        </div>
      )}

      {activeSetlist ? (
        <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6">
          <div className="overflow-x-auto">
            <div className="min-w-[650px] space-y-2">
              <div className="grid grid-cols-12 text-[11px] font-mono font-extrabold text-[#b3b3b3] uppercase pb-3 border-b border-zinc-800/80 px-3">
                <div className="col-span-1">#</div>
                <div className="col-span-6">TÍTULO DEL TEMA / EVENTO</div>
                <div className="col-span-2 text-center">TONO / CATEGORÍA</div>
                <div className="col-span-1 text-center">BPM</div>
                <div className="col-span-2 text-right">DURACIÓN</div>
              </div>

              {activeSetlist.items.map((it, idx) => {
                if (it.tipoItem === 'cancion' && it.songId) {
                  const s = songs.find(x => x.id === it.songId);
                  if (!s) return null;

                  const isPlayingThis = stagePlayingIndex === idx && stageIsPlaying;
                  const isSelectedThis = stagePlayingIndex === idx;

                  return (
                    <div
                      key={it.id}
                      className={`grid grid-cols-12 items-center py-3.5 px-3 rounded-xl transition-all cursor-pointer ${
                        isSelectedThis
                          ? 'bg-[#1db954]/15 border-l-4 border-[#1db954] text-white' 
                          : 'hover:bg-zinc-800/60 text-zinc-300'
                      }`}
                    >
                      <div className="col-span-1 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setStagePlayingIndex(idx);
                            setStageIsPlaying(!(stagePlayingIndex === idx && stageIsPlaying));
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                            isPlayingThis
                              ? 'bg-[#1db954] text-black font-bold scale-105 shadow-md' 
                              : 'bg-[#282828] text-[#1db954] hover:bg-[#1db954] hover:text-black'
                          }`}
                          title={isPlayingThis ? 'Pausar' : 'Reproducir este tema'}
                        >
                          {isPlayingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                        <span className="font-mono text-xs font-bold text-zinc-500">{idx + 1}</span>
                      </div>

                      <div className="col-span-6">
                        <div className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
                          <span>{s.titulo}</span>
                          {isPlayingThis && (
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 h-full bg-[#1db954] animate-pulse" />
                              <span className="w-0.5 h-2/3 bg-[#1db954] animate-pulse delay-75" />
                              <span className="w-0.5 h-4/5 bg-[#1db954] animate-pulse delay-150" />
                            </div>
                          )}
                        </div>
                        {it.notaTema && (
                          <div className="text-[11px] font-mono text-amber-400 mt-0.5 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>{it.notaTema}</span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-2 text-center">
                        <span className="px-2.5 py-1 bg-[#1db954]/20 text-[#1ed760] border border-[#1db954]/30 rounded-md text-xs font-mono font-black">
                          {s.tonalidad || 'Am'}
                        </span>
                      </div>

                      <div className="col-span-1 text-center font-mono text-xs text-zinc-400 font-bold">
                        {s.bpm || '—'}
                      </div>

                      <div className="col-span-2 text-right font-mono text-xs text-zinc-300 font-bold">
                        {s.duracion}
                      </div>
                    </div>
                  );
                } else if (it.tipoItem === 'bloque_header') {
                  return (
                    <div
                      key={it.id}
                      className="py-3 px-4 bg-gradient-to-r from-[#1db954]/20 via-[#181818] to-black border-l-4 border-[#1db954] rounded-xl font-mono text-[#1ed760] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 my-2 shadow-md"
                    >
                      <span className="text-sm">⚡</span>
                      <span>{it.tituloCustom || 'SECCIÓN DEL SHOW'}</span>
                    </div>
                  );
                } else {
                  const typeConfig = SHOW_ITEM_TYPES[it.tipoItem] || SHOW_ITEM_TYPES.otro;
                  const durationText = formatItemDuration(it);
                  const isPlayingThis = stagePlayingIndex === idx && stageIsPlaying;
                  const isSelectedThis = stagePlayingIndex === idx;

                  return (
                    <div
                      key={it.id}
                      className={`grid grid-cols-12 items-center py-3.5 px-3 rounded-xl transition-all cursor-pointer ${
                        isSelectedThis 
                          ? 'bg-sky-500/15 border-l-4 border-sky-400 text-white' 
                          : 'hover:bg-zinc-800/60 text-zinc-300'
                      }`}
                      onClick={() => {
                        setStagePlayingIndex(idx);
                        if (stagePlayingIndex === idx) {
                          setStageIsPlaying(!stageIsPlaying);
                        } else {
                          setStageIsPlaying(true);
                        }
                      }}
                    >
                      <div className="col-span-1 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStagePlayingIndex(idx);
                            setStageIsPlaying(!isPlayingThis);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                            isPlayingThis 
                              ? 'bg-sky-400 text-black font-bold scale-105 shadow-md' 
                              : 'bg-[#282828] text-sky-400 hover:bg-sky-400 hover:text-black'
                          }`}
                          title={isPlayingThis ? 'Pausar' : 'Reproducir discurso / audio'}
                        >
                          {isPlayingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                        <span className="font-mono text-xs font-bold text-zinc-500">{idx + 1}</span>
                      </div>

                      <div className="col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold font-mono text-white">
                              {typeConfig.icon} {it.tituloCustom || 'Interludio / Evento del Show'}
                            </span>
                            {it.audioUrl && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold flex items-center gap-1">
                                <Mic className="w-3 h-3" /> Audio Real
                              </span>
                            )}
                          </div>
                          {it.notaTema && (
                            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              📝 {it.notaTema}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingShowItem(it);
                            setShowItemAudioUrl(it.audioUrl || '');
                            setShowShowItemModal(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-sky-950/70 hover:bg-sky-900 border border-sky-500/30 text-sky-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 shrink-0 self-start sm:self-auto"
                          title="Modificar Audio o Grabación de este evento"
                        >
                          <Mic className="w-3 h-3 text-sky-400" />
                          <span>{it.audioUrl ? 'Modificar Audio' : '+ Audio'}</span>
                        </button>
                      </div>

                      <div className="col-span-2 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${typeConfig.text} ${typeConfig.border}`}>
                          {typeConfig.label}
                        </span>
                      </div>

                      <div className="col-span-1 text-center font-mono text-xs text-zinc-500">
                        —
                      </div>

                      <div className="col-span-2 text-right font-mono text-xs text-amber-300 font-bold">
                        ⏱️ {durationText}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
