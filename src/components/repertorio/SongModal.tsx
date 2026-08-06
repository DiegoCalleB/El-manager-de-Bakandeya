import React, { useState, useRef } from 'react';
import { X, Upload, Disc3, CheckCircle2, Music } from 'lucide-react';
import { ThemeColors, Song } from '../../types';

interface SongModalProps {
  isOpen: boolean;
  editingSong: Song | null;
  colors: ThemeColors;
  isStitchLight: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  albumsList?: string[];
  defaultAlbum?: string;
  defaultAlbumForNewSong?: string;
}

export function SongModal({
  isOpen,
  editingSong,
  colors,
  isStitchLight,
  onClose,
  onSave,
  albumsList = [],
  defaultAlbum = '',
  defaultAlbumForNewSong = '',
}: SongModalProps) {
  if (!isOpen) return null;

  const effectiveDefaultAlbum = defaultAlbumForNewSong || defaultAlbum || '';

  const [minutos, setMinutos] = useState<number>(() =>
    editingSong ? Math.floor(editingSong.duracionSegundos / 60) : 3
  );
  const [segundos, setSegundos] = useState<number>(() =>
    editingSong ? editingSong.duracionSegundos % 60 : 30
  );
  const [detectedDurationMsg, setDetectedDurationMsg] = useState<string>('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>(() => {
    const albumVal = editingSong?.albumDisco || editingSong?.album || effectiveDefaultAlbum || '';
    if (!albumVal) return '';
    return albumsList.includes(albumVal) ? albumVal : '__CUSTOM__';
  });
  const [customAlbumInput, setCustomAlbumInput] = useState<string>(() => {
    const albumVal = editingSong?.albumDisco || editingSong?.album || effectiveDefaultAlbum || '';
    return albumsList.includes(albumVal) ? '' : albumVal;
  });
  const [audioFileUrl, setAudioFileUrl] = useState<string>(editingSong?.audioPrincipalUrl || (editingSong as any)?.audioUrl || '');
  const [audioFileName, setAudioFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setAudioFileUrl(objectUrl);

    // Auto-detect duration from audio metadata
    const tempAudio = new Audio(objectUrl);
    tempAudio.onloadedmetadata = () => {
      if (tempAudio.duration && !isNaN(tempAudio.duration)) {
        const totalSecs = Math.round(tempAudio.duration);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setMinutos(mins);
        setSegundos(secs);
        setDetectedDurationMsg(`✓ Duración detectada del audio: ${mins}m ${secs}s`);
      }
    };
  };

  const finalAlbumValue = selectedAlbum === '__CUSTOM__' ? customAlbumInput : selectedAlbum;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-lg p-5 rounded-2xl shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden border border-neutral-800 ${colors.card}`}>
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#1db954]" />
            <h3 className={`text-sm font-bold font-mono uppercase ${colors.text}`}>
              {editingSong ? 'Editar Canción' : 'Añadir Nueva Canción al Catálogo'}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3 text-[10px] font-mono flex flex-col flex-1 overflow-hidden pt-3">
          <input type="hidden" name="audioUrl" value={audioFileUrl} />
          <input type="hidden" name="albumDisco" value={finalAlbumValue} />

          <div className="space-y-3 overflow-y-auto pr-1 flex-1 pb-2">
            {/* Audio File Upload Box with Auto Duration Detection */}
            <div className={`p-3 rounded-xl border border-dashed transition-all ${
              isStitchLight ? 'bg-slate-50 border-slate-300' : 'bg-neutral-900/90 border-neutral-700'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#1db954]" />
                  <span className="font-bold text-xs text-white">Subir Fichero de Audio (mp3, wav, m4a)</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold cursor-pointer transition-transform active:scale-95"
                >
                  Examinar...
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="hidden"
              />
              {audioFileName && (
                <div className="mt-2 text-xs text-zinc-300 flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1db954]" />
                  <span className="truncate">Archivo: {audioFileName}</span>
                </div>
              )}
              {detectedDurationMsg && (
                <div className="mt-1 text-[11px] font-bold text-[#1db954]">
                  {detectedDurationMsg}
                </div>
              )}
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Título de la Canción *</label>
              <input
                name="titulo"
                type="text"
                required
                defaultValue={editingSong?.titulo || ''}
                className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
                  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                }`}
                placeholder="ej. Brisa y Cacharros"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Tonalidad / Clave</label>
                <input
                  name="tonalidad"
                  type="text"
                  defaultValue={editingSong?.tonalidad || ''}
                  className={`w-full p-2 rounded-lg focus:outline-none border border-neutral-800 ${
                    isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                  }`}
                  placeholder="ej. Lam / Am"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">BPM / Tempo</label>
                <input
                  name="bpm"
                  type="number"
                  defaultValue={editingSong?.bpm || 120}
                  className={`w-full p-2 rounded-lg focus:outline-none border border-neutral-800 ${
                    isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                  }`}
                  placeholder="ej. 128"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Duración (Min:Seg)</label>
                <div className="flex gap-1 items-center">
                  <input
                    name="duracionMin"
                    type="number"
                    min="0"
                    value={minutos}
                    onChange={(e) => setMinutos(parseInt(e.target.value) || 0)}
                    className={`w-1/2 p-2 rounded-lg focus:outline-none border border-neutral-800 text-center font-bold text-[#1db954] ${
                      isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                    }`}
                    placeholder="Min"
                  />
                  <span className="text-neutral-500 font-bold">:</span>
                  <input
                    name="duracionSeg"
                    type="number"
                    min="0"
                    max="59"
                    value={segundos}
                    onChange={(e) => setSegundos(parseInt(e.target.value) || 0)}
                    className={`w-1/2 p-2 rounded-lg focus:outline-none border border-neutral-800 text-center font-bold text-[#1db954] ${
                      isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                    }`}
                    placeholder="Seg"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1 flex items-center gap-1">
                  <Disc3 className="w-3 h-3 text-[#1db954]" />
                  <span>Álbum / Disco</span>
                </label>
                <select
                  value={selectedAlbum}
                  onChange={(e) => setSelectedAlbum(e.target.value)}
                  className={`w-full p-2 rounded-lg focus:outline-none border border-neutral-800 cursor-pointer font-bold ${
                    isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-[#1db954]'
                  }`}
                >
                  <option value="">Sin Disco (Single)</option>
                  {albumsList.filter(a => a && a !== 'todos' && a !== 'Singles / Sin Disco').map((alb) => (
                    <option key={alb} value={alb}>💿 {alb}</option>
                  ))}
                  <option value="__CUSTOM__">+ Nuevo Álbum (Escribir nombre)...</option>
                </select>

                {selectedAlbum === '__CUSTOM__' && (
                  <input
                    type="text"
                    value={customAlbumInput}
                    onChange={(e) => setCustomAlbumInput(e.target.value)}
                    placeholder="Escribe el nombre del nuevo disco..."
                    className={`w-full mt-1.5 p-2 rounded-lg focus:outline-none border border-[#1db954]/50 ${
                      isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                    }`}
                  />
                )}
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Género / Estilo</label>
                <input
                  name="genero"
                  type="text"
                  defaultValue={editingSong?.genero || ''}
                  className={`w-full p-2 rounded-lg focus:outline-none border border-neutral-800 ${
                    isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                  }`}
                  placeholder="ej. Rock Rumba"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Tipo de Tema</label>
                <select
                  name="tipo"
                  defaultValue={editingSong?.tipo || 'propio'}
                  className={`w-full p-2 rounded-lg focus:outline-none border border-neutral-800 ${
                    isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                  }`}
                >
                  <option value="propio">Propio / Original</option>
                  <option value="cover">Cover / Versión</option>
                  <option value="instrumental">Instrumental / Intro</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Estado de Madurez</label>
                <select
                  name="estado"
                  defaultValue={editingSong?.estado || 'listo_directo'}
                  className={`w-full p-2 rounded-lg focus:outline-none border border-neutral-800 ${
                    isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                  }`}
                >
                  <option value="listo_directo">⚡ Listo para Directo</option>
                  <option value="en_ensayo">🎸 En Ensayo / Montaje</option>
                  <option value="idea_borrador">💡 Idea / En Composición</option>
                  <option value="descartada">📦 Descartada / Archivo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Energía / Intensidad</label>
                <select
                  name="energia"
                  defaultValue={editingSong?.energia || 'alta'}
                  className={`w-full p-2 rounded-lg focus:outline-none border border-neutral-800 ${
                    isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                  }`}
                >
                  <option value="alta">🔥 Alta (Traca / Caña)</option>
                  <option value="media">⚡ Media (Groove / Ritmo)</option>
                  <option value="balada">🌙 Balada / Acústica</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Afinación Instrumentos</label>
                <input
                  name="afinacion"
                  type="text"
                  defaultValue={editingSong?.afinacion || 'E Standard'}
                  className={`w-full p-2 rounded-lg focus:outline-none border border-neutral-800 ${
                    isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                  }`}
                  placeholder="ej. Drop D, Eb Standard"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Notas Internas / Ejecución</label>
              <textarea
                name="notasInternas"
                rows={2}
                defaultValue={editingSong?.notasInternas || ''}
                className={`w-full p-2.5 rounded-lg focus:outline-none border border-neutral-800 ${
                  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
                }`}
                placeholder="ej. Intro solo con viento, estribillo fuerte..."
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2 shrink-0 bg-transparent">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 transition-colors font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] text-black transition-transform active:scale-95 cursor-pointer shadow-lg"
            >
              Guardar Canción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

