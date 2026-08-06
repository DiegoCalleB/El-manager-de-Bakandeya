import React, { useState, useEffect } from 'react';
import { X, Layers, Check } from 'lucide-react';
import { Setlist, ThemeColors } from '../../types';

interface SetlistModalProps {
  isOpen: boolean;
  setlistToEdit: Setlist | null;
  colors: ThemeColors;
  isStitchLight: boolean;
  onClose: () => void;
  onSave: (setlistData: { id?: string; nombre: string; descripcion: string; tipoFormato: 'festival' | 'sala_larga' | 'acustico' }) => void;
}

export function SetlistModal({
  isOpen,
  setlistToEdit,
  colors,
  isStitchLight,
  onClose,
  onSave,
}: SetlistModalProps) {
  if (!isOpen) return null;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoFormato, setTipoFormato] = useState<'festival' | 'sala_larga' | 'acustico'>('festival');

  useEffect(() => {
    if (setlistToEdit) {
      setNombre(setlistToEdit.nombre || '');
      setDescripcion(setlistToEdit.descripcion || '');
      setTipoFormato(setlistToEdit.tipoFormato || 'festival');
    } else {
      setNombre('Festival Verano 2026');
      setDescripcion('Repertorio optimizado para directo de alta energía');
      setTipoFormato('festival');
    }
  }, [setlistToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({
      id: setlistToEdit?.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      tipoFormato,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-md p-5 rounded-2xl shadow-2xl border border-neutral-800 ${colors.card} text-white`}>
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#f2ca50]" />
            <h3 className="text-sm font-bold font-mono uppercase text-white">
              {setlistToEdit ? 'Editar Repertorio' : 'Crear Nuevo Repertorio desde Cero'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs font-mono">
          <div>
            <label className="block text-neutral-300 font-bold mb-1">Nombre del Repertorio / Setlist *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Festival Rumba & Rock 2026"
              className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#f2ca50] ${
                isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
              }`}
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-bold mb-1">Formato / Tipo de Concierto</label>
            <select
              value={tipoFormato}
              onChange={(e) => setTipoFormato(e.target.value as any)}
              className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#f2ca50] cursor-pointer ${
                isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
              }`}
            >
              <option value="festival">🔥 Festival (45-60m Caña Directa)</option>
              <option value="sala_larga">🎸 Sala / Show Largo (90-120m)</option>
              <option value="acustico">🌙 Acústico / Intimo</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-300 font-bold mb-1">Descripción / Notas de Escenario</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="ej. Setlist pensado para festivales con ritmo alto sin pausas..."
              className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#f2ca50] ${
                isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
              }`}
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 transition-colors font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#f2ca50] hover:bg-[#e0b840] text-black transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{setlistToEdit ? 'Guardar Cambios' : 'Crear Repertorio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
