import React from 'react';
import { X, Building2, Radio, Sparkles, Loader2, Upload } from 'lucide-react';
import { LeadType } from '../../types';

export interface NewLeadDataState {
  nombre_sala: string;
  ciudad: string;
  region: string;
  aforo: number;
  genero: string;
  tipo?: LeadType;
  email_contacto: string;
  telefono: string;
  instagram: string;
  fuente: string;
  pitch_generado: string;
  notas: string;
  icono?: string;
  imagen_url?: string;
}

interface AddLeadModalProps {
  isOpen: boolean;
  sectionTab: 'salas' | 'medios' | 'grupos';
  isStitchLight: boolean;
  textSub: string;
  newLeadData: NewLeadDataState;
  setNewLeadData: React.Dispatch<React.SetStateAction<NewLeadDataState>>;
  isModalScraping: boolean;
  modalScrapeStatus: string;
  modalScrapeError: string;
  modalScrapeSuccessMsg: string;
  isUploadingLeadLogo: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onModalScrape: () => void;
  onLeadLogoUpload: (file: File) => void;
}

export function AddLeadModal({
  isOpen,
  sectionTab,
  isStitchLight,
  textSub,
  newLeadData,
  setNewLeadData,
  isModalScraping,
  modalScrapeStatus,
  modalScrapeError,
  modalScrapeSuccessMsg,
  isUploadingLeadLogo,
  onClose,
  onSubmit,
  onModalScrape,
  onLeadLogoUpload
}: AddLeadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-lg p-5 rounded-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
          isStitchLight ? 'bg-white text-slate-800' : 'bg-[#18181b] text-[#e5e2e1]'
        }`}
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            {sectionTab === 'medios' ? (
              <Radio className="w-5 h-5 text-rose-400" />
            ) : (
              <Building2 className="w-5 h-5 text-[#d1b375]/80" />
            )}
            <h3
              className={`text-sm font-bold font-display uppercase tracking-widest ${
                isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'
              }`}
            >
              {sectionTab === 'medios'
                ? 'Añadir Nuevo Medio de Comunicación'
                : 'Añadir Nueva Sala o Festival'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
                {sectionTab === 'medios'
                  ? 'Nombre del Medio / Emisora / Revista *'
                  : 'Nombre de la Sala / Festival *'}
              </label>
              <button
                type="button"
                onClick={onModalScrape}
                disabled={isModalScraping || !newLeadData.nombre_sala}
                className={`px-2 py-1 text-[10px] font-sans rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isStitchLight
                    ? 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-[#d1b375] disabled:opacity-50'
                    : 'bg-[#f2ca50]/10 hover:bg-[#f2ca50]/20 text-[#f2ca50] disabled:opacity-50'
                }`}
                title="Buscar automáticamente email, teléfono y ubicación con el Agente Scout IA"
              >
                {isModalScraping ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#d1b375]/80" />
                ) : (
                  <Sparkles className="w-3 h-3 text-[#d1b375]/80 dark:text-[#f2ca50]" />
                )}
                <span>{isModalScraping ? 'Buscando datos...' : '✨ Autocompletar con IA Scout'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder={
                sectionTab === 'medios'
                  ? 'Ej. Radio 3, Mondosonoro, MariskalRock'
                  : 'Ej. Sala El Sol, Festival Cabo de Plata'
              }
              value={newLeadData.nombre_sala}
              onChange={e => setNewLeadData(prev => ({ ...prev, nombre_sala: e.target.value }))}
              className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
                isStitchLight
                  ? 'bg-slate-50 text-slate-800 focus:ring-indigo-500'
                  : 'bg-[#121215] text-[#e5e2e1] focus:ring-[#f2ca50]'
              }`}
            />
          </div>

          {/* Logo Selector */}
          <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className={`block text-[10px] uppercase font-sans tracking-wider ${textSub}`}>
                Icono o Logo del Medio / Sala
              </label>
              <label className="cursor-pointer px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] rounded-lg flex items-center gap-1.5 font-bold transition-all border border-zinc-700">
                <Upload className="w-3 h-3 text-[#f2ca50]" />
                <span>{isUploadingLeadLogo ? 'Subiendo...' : 'Subir Logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      onLeadLogoUpload(e.target.files[0]);
                    }
                  }}
                  disabled={isUploadingLeadLogo}
                />
              </label>
            </div>

            {newLeadData.imagen_url ? (
              <div className="flex items-center gap-3 p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                <img
                  src={newLeadData.imagen_url}
                  alt="Logo"
                  className="w-10 h-10 rounded-lg object-cover border border-[#f2ca50]/50 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-300 font-bold truncate">
                    {newLeadData.imagen_url}
                  </p>
                  <p className="text-[9px] text-zinc-500">Logo oficial guardado</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewLeadData(prev => ({ ...prev, imagen_url: '' }))}
                  className="text-[10px] text-rose-400 hover:underline px-2 py-1 cursor-pointer"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[9px] text-zinc-400">Selecciona un emoji característico:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['📻', '📰', '🌐', '🎙️', '📺', '🏛️', '🎪', '🪩', '🎸', '💼', '🎆', '⚡', '🔥'].map(
                    emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewLeadData(prev => ({ ...prev, icono: emoji }))}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                          newLeadData.icono === emoji
                            ? 'bg-[#f2ca50] text-[#3c2f00] font-bold scale-110 shadow-md border border-[#f2ca50]'
                            : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progress / Status Banner */}
          {isModalScraping && (
            <div
              className={`p-2.5 rounded-lg text-[10px] font-sans flex items-center gap-2 animate-pulse ${
                isStitchLight ? 'bg-[#d1b375]/15 text-[#d1b375]' : 'bg-[#1f1a10]/30 text-[#d1b375]'
              }`}
            >
              <Loader2 className="w-4 h-4 animate-spin text-[#d1b375]/80 shrink-0" />
              <span className="text-[10px] font-bold">{modalScrapeStatus}</span>
            </div>
          )}

          {modalScrapeError && (
            <div className="p-2.5 rounded-lg text-[10px] font-sans text-rose-400 bg-rose-500/15">
              ⚠️ {modalScrapeError}
            </div>
          )}

          {modalScrapeSuccessMsg && (
            <div className="p-2.5 rounded-lg text-[10px] font-sans text-[#10b981] bg-[#10b981]/15">
              {modalScrapeSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
                Ciudad
              </label>
              <input
                type="text"
                placeholder="Ej. Madrid, Barcelona"
                value={newLeadData.ciudad}
                onChange={e => setNewLeadData(prev => ({ ...prev, ciudad: e.target.value }))}
                className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
                  isStitchLight
                    ? 'bg-slate-50 text-slate-800 focus:ring-indigo-500'
                    : 'bg-[#121215] text-[#e5e2e1] focus:ring-[#f2ca50]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
                Región / Alcance
              </label>
              <input
                type="text"
                placeholder="Ej. Nacional, Cataluña, Andalucía"
                value={newLeadData.region}
                onChange={e => setNewLeadData(prev => ({ ...prev, region: e.target.value }))}
                className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
                  isStitchLight
                    ? 'bg-slate-50 text-slate-800 focus:ring-indigo-500'
                    : 'bg-[#121215] text-[#e5e2e1] focus:ring-[#f2ca50]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
                Correo de Contacto (Opcional)
              </label>
              <input
                type="email"
                placeholder="contacto@medio.com (o deja en blank)"
                value={newLeadData.email_contacto}
                onChange={e => setNewLeadData(prev => ({ ...prev, email_contacto: e.target.value }))}
                className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
                  isStitchLight
                    ? 'bg-slate-50 text-slate-800 focus:ring-indigo-500'
                    : 'bg-[#121215] text-[#e5e2e1] focus:ring-[#f2ca50]'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
                {sectionTab === 'medios' ? 'Tipo de Medio' : 'Tipo de Espacio'}
              </label>
              {sectionTab === 'medios' ? (
                <select
                  value={newLeadData.genero}
                  onChange={e => setNewLeadData(prev => ({ ...prev, genero: e.target.value }))}
                  className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
                    isStitchLight
                      ? 'bg-slate-50 text-slate-800 focus:ring-indigo-500'
                      : 'bg-[#121215] text-[#e5e2e1] focus:ring-[#f2ca50]'
                  }`}
                >
                  <option value="Radio">Radio / Programa</option>
                  <option value="Prensa Escrita">Prensa Escrita / Revista</option>
                  <option value="Web / Blog">Portal Web / Blog Musical</option>
                  <option value="Podcast">Podcast / Entrevistas</option>
                  <option value="TV / Vídeo">Televisión / Vídeo</option>
                </select>
              ) : (
                <select
                  value={newLeadData.tipo}
                  onChange={e =>
                    setNewLeadData(prev => ({ ...prev, tipo: e.target.value as LeadType }))
                  }
                  className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
                    isStitchLight
                      ? 'bg-slate-50 text-slate-800 focus:ring-indigo-500'
                      : 'bg-[#121215] text-[#e5e2e1] focus:ring-[#f2ca50]'
                  }`}
                >
                  <option value="sala">Sala de Conciertos</option>
                  <option value="festival">Festival</option>
                  <option value="ayuntamiento">Ayuntamiento / Fiestas</option>
                  <option value="productora">Productora / Booking</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
              {sectionTab === 'medios'
                ? 'Nota de Prensa / Propuesta de Presentación'
                : 'Propuesta de Concierto'}
            </label>
            <textarea
              rows={3}
              placeholder={
                sectionTab === 'medios'
                  ? 'Escribe o personaliza el texto de presentación...'
                  : 'Propuesta de fecha, condiciones de taquilla, etc.'
              }
              value={newLeadData.pitch_generado}
              onChange={e => setNewLeadData(prev => ({ ...prev, pitch_generado: e.target.value }))}
              className={`w-full rounded-xl p-3 text-[10px] focus:outline-none font-sans ${
                isStitchLight
                  ? 'bg-slate-50 text-slate-800 focus:ring-indigo-500'
                  : 'bg-[#121215] text-[#e5e2e1] focus:ring-[#f2ca50]'
              }`}
            />
          </div>

          <div>
            <label className={`block text-[10px] uppercase font-sans tracking-wider mb-1 ${textSub}`}>
              Notas Internas
            </label>
            <input
              type="text"
              placeholder="Ej. Redactor jefe Bruno, programa nocturno, etc."
              value={newLeadData.notas}
              onChange={e => setNewLeadData(prev => ({ ...prev, notas: e.target.value }))}
              className={`w-full rounded-xl px-2 py-1 text-[10px] focus:outline-none font-sans ${
                isStitchLight
                  ? 'bg-slate-50 text-slate-800 focus:ring-indigo-500'
                  : 'bg-[#121215] text-[#e5e2e1] focus:ring-[#f2ca50]'
              }`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-2 py-1 rounded-xl font-sans text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                isStitchLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl font-sans text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                isStitchLight
                  ? 'bg-sky-500 hover:bg-sky-400 text-white'
                  : 'bg-[#f2ca50] hover:bg-[#e2ba40] text-[#3c2f00]'
              }`}
            >
              {sectionTab === 'medios' ? 'Guardar Medio' : 'Guardar Sala'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
