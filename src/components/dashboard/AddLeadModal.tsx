import React from 'react';
import { LeadType } from '../../types';
import { Plus, X } from 'lucide-react';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubmit: (e: React.FormEvent) => void;
  newSala: string;
  setNewSala: (val: string) => void;
  newCiudad: string;
  setNewCiudad: (val: string) => void;
  newRegion: string;
  setNewRegion: (val: string) => void;
  newAforo: number;
  setNewAforo: (val: number) => void;
  newGenero: string;
  setNewGenero: (val: string) => void;
  newTipo: LeadType;
  setNewTipo: (val: LeadType) => void;
  newEmail: string;
  setNewEmail: (val: string) => void;
  newInstagram: string;
  setNewInstagram: (val: string) => void;
  newNotas: string;
  setNewNotas: (val: string) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onAddSubmit,
  newSala,
  setNewSala,
  newCiudad,
  setNewCiudad,
  newRegion,
  setNewRegion,
  newAforo,
  setNewAforo,
  newGenero,
  setNewGenero,
  newTipo,
  setNewTipo,
  newEmail,
  setNewEmail,
  newInstagram,
  setNewInstagram,
  newNotas,
  setNewNotas
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1b1b] rounded-xl w-full max-w-lg overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
        <div className="p-4 flex justify-between items-center bg-[#1A1918]">
          <h3 className="text-sm font-bold font-display uppercase tracking-widest text-zinc-100 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Agregar Nueva Sala a la Hoja
          </h3>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onAddSubmit} className="p-5 space-y-4 text-[10px] font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Nombre de la Sala*</label>
              <input
                id="new-lead-sala"
                type="text"
                required
                value={newSala}
                onChange={(e) => setNewSala(e.target.value)}
                placeholder="Ej: Sala Apolo"
                className="w-full bg-[#1A1918] rounded px-2 py-1 focus:outline-none focus:-zinc-500/50 text-zinc-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Ciudad*</label>
              <input
                id="new-lead-ciudad"
                type="text"
                required
                value={newCiudad}
                onChange={(e) => setNewCiudad(e.target.value)}
                placeholder="Ej: Barcelona"
                className="w-full bg-[#1A1918] rounded px-2 py-1 focus:outline-none focus:-zinc-500/50 text-zinc-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Región / Provincia</label>
              <input
                id="new-lead-region"
                type="text"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                placeholder="Ej: Cataluña"
                className="w-full bg-[#1A1918] rounded px-2 py-1 focus:outline-none focus:-zinc-500/50 text-zinc-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Aforo Estimado (Pax)</label>
              <input
                id="new-lead-aforo"
                type="number"
                value={newAforo}
                onChange={(e) => setNewAforo(Number(e.target.value))}
                className="w-full bg-[#1A1918] rounded px-2 py-1 focus:outline-none focus:-zinc-500/50 text-zinc-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Género Musical Preferente</label>
              <input
                id="new-lead-genero"
                type="text"
                value={newGenero}
                onChange={(e) => setNewGenero(e.target.value)}
                className="w-full bg-[#1A1918] rounded px-2 py-1 focus:outline-none focus:-zinc-500/50 text-zinc-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Categoría de Contacto</label>
              <select
                id="new-lead-tipo"
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value as LeadType)}
                className="w-full bg-[#1A1918] rounded px-2 py-1 focus:outline-none focus:-zinc-500/50 text-zinc-100 font-mono cursor-pointer"
              >
                <option value="sala">🏛️ Sala / Teatro (Booking directo)</option>
                <option value="festival">🎪 Festival (Escenarios / Carteles)</option>
                <option value="ayuntamiento">🎆 Ayuntamiento / Fiestas Patronales</option>
                <option value="grupo">🎸 Grupo / Artista (Colaboración)</option>
                <option value="productora">💼 Productora / Agencia Management</option>
                <option value="medio">📻 Medio de Comunicación (Radio 3 / Prensa / TV)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Usuario de Instagram (@)</label>
              <input
                id="new-lead-instagram"
                type="text"
                value={newInstagram}
                onChange={(e) => setNewInstagram(e.target.value)}
                placeholder="Ej: @sala_apolo"
                className="w-full bg-[#1A1918] rounded px-2 py-1 focus:outline-none focus:-zinc-500/50 text-zinc-100 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2">
            <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Email de Contacto (Opcional, sino Scout lo buscará)</label>
            <input
              id="new-lead-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Ej: booking@salaapolo.com"
              className="w-full bg-[#1A1918] rounded px-2 py-1 focus:outline-none focus:-zinc-500/50 text-zinc-100 font-mono"
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Notas Iniciales</label>
            <textarea
              id="new-lead-notes"
              rows={3}
              value={newNotas}
              onChange={(e) => setNewNotas(e.target.value)}
              placeholder="Alguna instrucción de booking, contacto recomendado..."
              className="w-full bg-[#1A1918] rounded p-3 focus:outline-none focus:-zinc-500/50 text-zinc-100 font-sans leading-relaxed"
            />
          </div>

          <div className="flex gap-3 justify-end pt-3">
            <button
              id="btn-add-cancel"
              type="button"
              onClick={onClose}
              className="px-2 py-1 bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase rounded-lg transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-add-submit"
              type="submit"
              className="px-2 py-1 bg-zinc-100 hover:bg-white text-zinc-900 font-mono font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer shadow-lg shadow-zinc-500/10"
            >
              Confirmar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
