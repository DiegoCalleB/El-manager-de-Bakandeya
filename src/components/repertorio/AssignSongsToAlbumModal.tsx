import React, { useState } from 'react';
import { X, Search, Plus, Check, Disc3, Upload, Image as ImageIcon } from 'lucide-react';
import { Song, ThemeColors } from '../../types';

interface AssignSongsToAlbumModalProps {
  isOpen: boolean;
  albumName: string;
  songs: Song[];
  colors: ThemeColors;
  isStitchLight: boolean;
  onClose: () => void;
  onSaveAlbumSongs: (albumName: string, selectedSongIds: string[], albumExtraInfo?: {
    año?: string;
    portadaUrl?: string;
    tipoTrabajo?: string;
    descripcion?: string;
  }) => void;
}

export function AssignSongsToAlbumModal({
  isOpen,
  albumName,
  songs,
  colors,
  isStitchLight,
  onClose,
  onSaveAlbumSongs,
}: AssignSongsToAlbumModalProps) {
  if (!isOpen) return null;

  const currentAlbumSongs = songs.filter(s => (s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(currentAlbumSongs.map(s => s.id)));
  const [search, setSearch] = useState('');
  const [customAlbumName, setCustomAlbumName] = useState(albumName);
  const [albumYear, setAlbumYear] = useState(new Date().getFullYear().toString());
  const [albumType, setAlbumType] = useState('Álbum Estudio');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');

  const filteredSongs = songs.filter(s =>
    s.titulo.toLowerCase().includes(search.toLowerCase()) ||
    (s.tonalidad && s.tonalidad.toLowerCase().includes(search.toLowerCase())) ||
    (s.albumDisco && s.albumDisco.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSong = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCoverUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAlbumName = customAlbumName.trim() || albumName || 'Nuevo Álbum';
    onSaveAlbumSongs(finalAlbumName, Array.from(selectedIds), {
      año: albumYear,
      portadaUrl: coverUrl,
      tipoTrabajo: albumType,
      descripcion: description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-2xl p-5 rounded-2xl shadow-2xl my-auto max-h-[92vh] flex flex-col border border-neutral-800 ${colors.card} text-white`}>
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-[#1db954]" />
            <h3 className="text-sm font-bold font-mono uppercase text-white">
              {albumName ? `Editar Disco: ${albumName}` : 'Crear Nuevo Disco / Lanzamiento'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden space-y-4 pt-4">
          <div className="space-y-3 overflow-y-auto pr-1 max-h-[220px]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-300 mb-1">Nombre del Álbum / Disco *</label>
                <input
                  type="text"
                  required
                  value={customAlbumName}
                  onChange={(e) => setCustomAlbumName(e.target.value)}
                  placeholder="ej. Lanzamiento Verano 2026"
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-none focus:border-[#1db954] ${
                    isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Año de Lanzamiento</label>
                <input
                  type="text"
                  value={albumYear}
                  onChange={(e) => setAlbumYear(e.target.value)}
                  placeholder="ej. 2026"
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-none focus:border-[#1db954] ${
                    isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Tipo de Trabajo</label>
                <select
                  value={albumType}
                  onChange={(e) => setAlbumType(e.target.value)}
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-none focus:border-[#1db954] ${
                    isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                  }`}
                >
                  <option value="Álbum Estudio">Álbum Estudio</option>
                  <option value="EP">EP (Extended Play)</option>
                  <option value="Single">Single / Sencillo</option>
                  <option value="Directo">Álbum en Directo</option>
                  <option value="Maqueta">Maqueta / Demo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Imagen de Portada (Upload o URL)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://... o sube imagen"
                    className={`flex-1 p-2.5 text-xs font-mono rounded-xl border focus:outline-none focus:border-[#1db954] ${
                      isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                    }`}
                  />
                  <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl cursor-pointer shrink-0 border border-white/10 flex items-center gap-1 text-xs">
                    <Upload className="w-3.5 h-3.5 text-[#1db954]" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1">Descripción / Notas de Lanzamiento</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notas sobre la producción, estudio de grabación, concepto..."
                className={`w-full p-2 text-xs font-mono rounded-xl border focus:outline-none focus:border-[#1db954] ${
                  isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                }`}
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-300 mb-2">
              <span className="font-bold flex items-center gap-1.5">
                <Disc3 className="w-4 h-4 text-[#1db954]" />
                <span>Seleccionar Canciones del Disco ({selectedIds.size} seleccionadas):</span>
              </span>
            </div>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar canción en el catálogo para incluir..."
                className={`w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border focus:outline-none ${
                  isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                }`}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[220px]">
              {filteredSongs.map((song) => {
                const isSelected = selectedIds.has(song.id);
                return (
                  <div
                    key={song.id}
                    onClick={() => toggleSong(song.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1db954]/20 border-[#1db954]/50 text-white'
                        : isStitchLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                        : 'bg-neutral-800/60 hover:bg-neutral-800 border-white/5 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#1db954] text-black' : 'bg-neutral-700 text-neutral-400'
                      }`}>
                        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate flex items-center gap-1.5">
                          <span>{song.titulo}</span>
                          {song.tonalidad && <span className="text-[10px] text-[#1db954] font-mono">({song.tonalidad})</span>}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {song.albumDisco ? `Álbum actual: ${song.albumDisco}` : 'Sin álbum asignado'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono opacity-60 shrink-0">{song.duracion}</span>
                  </div>
                );
              })}

              {filteredSongs.length === 0 && (
                <div className="text-center py-6 text-neutral-500 text-xs">
                  No se encontraron canciones que coincidan.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 transition-colors font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] text-black transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar Disco ({selectedIds.size} temas)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

