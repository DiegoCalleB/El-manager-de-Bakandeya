import React, { useState } from 'react';
import { Lead, LeadStatus, ThemeColors } from '../types';
import { Search, MapPin, Music, User, Globe, FileText, Phone, Instagram, Plus, X, Calendar, AlertCircle } from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  colors: ThemeColors;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>) => void;
  onAddLead: (lead: Lead) => void;
}

export default function Dashboard({ leads, colors, onUpdateLead, onAddLead }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [cityFilter, setCityFilter] = useState<string>('todos');
  const [genreFilter, setGenreFilter] = useState<string>('todos');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for manual lead
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formAforo, setFormAforo] = useState(300);
  const [formGenero, setFormGenero] = useState('Ska / Reggae / Mestizaje');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formInsta, setFormInsta] = useState('');
  const [formFuente, setFormFuente] = useState('Manual');
  const [formNotes, setFormNotes] = useState('');

  // Extract unique cities and genres
  const cities = Array.from(new Set(leads.map(l => l.ciudad))).filter(Boolean);
  const genres = ['Ska', 'Reggae', 'Mestizaje', 'Fusión', 'Indie', 'Rock', 'Electrónica'];

  // Count states
  const countByStatus = (status: LeadStatus) => leads.filter(l => l.estado === status).length;

  const statusList: { value: LeadStatus | 'todos'; label: string; color: string }[] = [
    { value: 'todos', label: 'Todos', color: colors.accent },
    { value: 'nuevo', label: 'Nuevo (Scout)', color: 'text-sky-400' },
    { value: 'pendiente_aprobacion', label: 'Pendientes Aprob.', color: 'text-amber-400' },
    { value: 'aprobado', label: 'Aprobados (Cola)', color: 'text-emerald-400' },
    { value: 'esperando_respuesta', label: 'Esperando Resp.', color: 'text-indigo-400' },
    { value: 'interesado', label: 'Interesado 🔥', color: 'text-rose-400' },
    { value: 'negociando', label: 'Negociando 💬', color: 'text-fuchsia-400' },
    { value: 'no_interesado', label: 'No Interesado', color: 'text-neutral-500' }
  ];

  // Filtering logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || lead.estado === statusFilter;
    const matchesCity = cityFilter === 'todos' || lead.ciudad === cityFilter;
    
    let matchesGenre = true;
    if (genreFilter !== 'todos') {
      matchesGenre = lead.genero.toLowerCase().includes(genreFilter.toLowerCase());
    }

    return matchesSearch && matchesStatus && matchesCity && matchesGenre;
  });

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'nuevo': return colors.badgeBlue;
      case 'pendiente_aprobacion': return colors.badgeYellow;
      case 'aprobado': return colors.badgeGreen;
      case 'esperando_respuesta': return 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400';
      case 'interesado': return 'bg-rose-500/10 border border-rose-500/20 text-rose-400';
      case 'negociando': return 'bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400';
      case 'no_interesado': return 'bg-neutral-500/10 border border-neutral-500/20 text-neutral-400';
    }
  };

  const getStatusLabel = (status: LeadStatus) => {
    switch (status) {
      case 'nuevo': return 'Nuevo (Scout)';
      case 'pendiente_aprobacion': return 'Pendiente Aprob.';
      case 'aprobado': return 'Aprobado';
      case 'esperando_respuesta': return 'Esperando Resp.';
      case 'interesado': return 'Interesado 🔥';
      case 'negociando': return 'Negociando 💬';
      case 'no_interesado': return 'No interesado';
    }
  };

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCity) return;

    // Build pitch default template
    const defaultPitch = `Hola equipo de booking de ${formName},

Somos Bakandeya, banda que fusiona reggae, ska, rock y electrónica analógica. Hemos visto su programación y creemos que nuestra propuesta encaja perfecto.

Disponemos de fechas para nuestra gira de otoño. Les invitamos a ver nuestros directos: https://youtube.com/bakandeya_live

Un saludo,
Larra (Manager de Bakandeya)`;

    const newLead: Lead = {
      id: `lead-manual-${Date.now()}`,
      nombre_sala: formName,
      ciudad: formCity,
      region: formRegion,
      aforo: Number(formAforo),
      genero: formGenero,
      email_contacto: formEmail,
      telefono: formPhone,
      instagram: formInsta,
      fuente: formFuente,
      estado: 'nuevo',
      pitch_generado: defaultPitch,
      notas: formNotes || 'Añadida manualmente.'
    };

    onAddLead(newLead);
    setIsAddModalOpen(false);
    
    // Reset form
    setFormName('');
    setFormCity('');
    setFormRegion('');
    setFormAforo(300);
    setFormGenero('Ska / Reggae / Mestizaje');
    setFormEmail('');
    setFormPhone('');
    setFormInsta('');
    setFormNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Counters banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {statusList.map((st) => {
          const count = st.value === 'todos' ? leads.length : countByStatus(st.value as LeadStatus);
          const isSelected = statusFilter === st.value;
          return (
            <button
              id={`status-counter-${st.value}`}
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected 
                  ? 'bg-neutral-800 border-neutral-300 ring-1 ring-neutral-400' 
                  : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-800/40'
              }`}
            >
              <div className="text-[10px] font-mono text-neutral-400 truncate uppercase tracking-wider">{st.label}</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-black font-mono leading-none ${st.color}`}>
                  {count}
                </span>
                <span className="text-[9px] text-neutral-500">leads</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Control bar */}
      <div className={`p-4 rounded-xl border ${colors.card} ${colors.neonShadow} flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center`}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              id="lead-search"
              type="text"
              placeholder="Buscar sala o ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 font-sans"
            />
          </div>

          {/* City Filter */}
          <div className="relative">
            <select
              id="city-filter-select"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 appearance-none font-sans"
            >
              <option value="todos">📍 Todas las Ciudades</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Genre Filter */}
          <div className="relative">
            <select
              id="genre-filter-select"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500 appearance-none font-sans"
            >
              <option value="todos">🎸 Todos los Géneros</option>
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'todos' || cityFilter !== 'todos' || genreFilter !== 'todos') && (
            <button
              id="clear-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setCityFilter('todos');
                setGenreFilter('todos');
              }}
              className="text-xs text-neutral-400 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-mono"
            >
              <X className="w-3.5 h-3.5" /> Limpiar Filtros
            </button>
          )}
        </div>

        {/* Add Lead Manual button */}
        <button
          id="open-add-lead-btn"
          onClick={() => setIsAddModalOpen(true)}
          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${colors.primary}`}
        >
          <Plus className="w-4 h-4 text-zinc-950" /> Añadir Lead Manual
        </button>
      </div>

      {/* Leads representation */}
      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
          <AlertCircle className="w-10 h-10 text-neutral-600 mb-3" />
          <p className="text-sm font-semibold text-neutral-400">No se encontraron salas con los filtros aplicados</p>
          <p className="text-xs text-neutral-500 mt-1">Prueba a buscar otro término o reiniciar los selectores.</p>
        </div>
      ) : (
        <div className={`border ${colors.border} rounded-xl overflow-hidden bg-neutral-900/30`}>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider font-mono border-b border-neutral-800">
                <tr>
                  <th className="px-5 py-3.5">Sala/Contacto</th>
                  <th className="px-5 py-3.5">Ubicación</th>
                  <th className="px-5 py-3.5">Aforo</th>
                  <th className="px-5 py-3.5">Género Predilecto</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5">Fuente</th>
                  <th className="px-5 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-neutral-100 text-sm">{lead.nombre_sala}</div>
                      <div className="text-neutral-500 text-[11px] font-mono mt-0.5">{lead.email_contacto || 'Sin email'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-neutral-300">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span>{lead.ciudad} ({lead.region})</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-neutral-300">
                      {lead.aforo ? `${lead.aforo.toLocaleString()} pax` : 'N/D'}
                    </td>
                    <td className="px-5 py-4 text-neutral-400 max-w-[180px] truncate">
                      {lead.genero}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(lead.estado)}`}>
                        {getStatusLabel(lead.estado)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950/60 px-1.5 py-0.5 rounded border border-neutral-800">
                        {lead.fuente}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        id={`view-lead-btn-${lead.id}`}
                        onClick={() => setSelectedLead(lead)}
                        className="text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded font-mono border border-neutral-700 transition-all"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 p-3 lg:hidden">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 rounded-lg bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-neutral-100 text-sm leading-tight">{lead.nombre_sala}</h4>
                    <span className="text-[10px] font-mono text-neutral-500">{lead.ciudad}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getStatusBadgeClass(lead.estado)}`}>
                    {getStatusLabel(lead.estado)}
                  </span>
                </div>

                <div className="text-xs text-neutral-400 space-y-1.5 font-sans border-t border-b border-neutral-800/50 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{lead.genero}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>Aforo: <strong className="font-mono">{lead.aforo ? lead.aforo.toLocaleString() : 'N/D'}</strong> pax</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 mt-auto">
                  <span className="text-[9px] font-mono text-neutral-500">Vía {lead.fuente}</span>
                  <button
                    id={`view-lead-mob-${lead.id}`}
                    onClick={() => setSelectedLead(lead)}
                    className="text-[11px] font-mono text-neutral-300 bg-neutral-800 px-2.5 py-1 rounded border border-neutral-700"
                  >
                    Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Slide-Over / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-xl bg-neutral-950 border-l border-neutral-800 h-full flex flex-col shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold border uppercase ${getStatusBadgeClass(selectedLead.estado)}`}>
                  {selectedLead.estado.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-bold mt-1 text-neutral-100">{selectedLead.nombre_sala}</h3>
              </div>
              <button
                id="close-lead-modal"
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-6 flex-1 font-sans">
              {/* Core Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-900/40 p-4 rounded-lg border border-neutral-900">
                <div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500">Ciudad</div>
                  <div className="text-sm font-semibold text-neutral-200 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-4 h-4 text-neutral-400 shrink-0" /> {selectedLead.ciudad}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500">Región</div>
                  <div className="text-sm font-medium text-neutral-300 mt-0.5">{selectedLead.region || 'N/D'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500">Aforo máximo</div>
                  <div className="text-sm font-bold text-neutral-200 mt-0.5 font-mono">
                    {selectedLead.aforo ? `${selectedLead.aforo.toLocaleString()} personas` : 'No definido'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500">Estilo Musical</div>
                  <div className="text-sm font-medium text-neutral-300 mt-0.5 flex items-center gap-1">
                    <Music className="w-4 h-4 text-neutral-400 shrink-0" /> {selectedLead.genero}
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-900 pb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> Datos de Contacto
                </h4>
                <div className="grid grid-cols-1 gap-2.5 text-xs text-neutral-300">
                  <div className="flex items-center gap-2 bg-neutral-900/30 p-2.5 rounded border border-neutral-900/60">
                    <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="font-mono text-neutral-400">Email:</span>
                    <a href={`mailto:${selectedLead.email_contacto}`} className="hover:underline text-cyan-400 font-medium">
                      {selectedLead.email_contacto || 'No registrado'}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-900/30 p-2.5 rounded border border-neutral-900/60">
                    <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="font-mono text-neutral-400">Teléfono:</span>
                    <span>{selectedLead.telefono || 'No registrado'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-900/30 p-2.5 rounded border border-neutral-900/60">
                    <Instagram className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="font-mono text-neutral-400">Instagram:</span>
                    <a href={`https://instagram.com/${selectedLead.instagram?.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:underline text-fuchsia-400">
                      {selectedLead.instagram || 'No registrado'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-900 pb-1">
                  Notas de Coordinación / Agentes
                </h4>
                <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {selectedLead.notas || 'No hay notas registradas para esta sala.'}
                </div>
              </div>

              {/* Audit trail */}
              <div className="flex justify-between items-center pt-4 border-t border-neutral-900 text-[10px] font-mono text-neutral-500">
                <span>Descubierto vía: <strong className="text-neutral-400">{selectedLead.fuente}</strong></span>
                <span>Ficha ID: {selectedLead.id}</span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="pt-4 border-t border-neutral-900 flex gap-2">
              <button
                id="modal-edit-status-draft"
                onClick={() => {
                  onUpdateLead(selectedLead.id, { estado: 'nuevo' });
                  setSelectedLead(prev => prev ? { ...prev, estado: 'nuevo' } : null);
                }}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs py-2 rounded font-mono transition-all"
              >
                Volver a Nuevo
              </button>
              <button
                id="modal-edit-status-approve"
                onClick={() => {
                  onUpdateLead(selectedLead.id, { estado: 'aprobado' });
                  setSelectedLead(prev => prev ? { ...prev, estado: 'aprobado' } : null);
                }}
                className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs py-2 rounded font-mono font-bold transition-all"
              >
                Aprobar Directo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Plus className={`w-5 h-5 ${colors.accent}`} />
                <h3 className="text-lg font-bold text-neutral-100">Ficha de Nueva Sala / Promotor</h3>
              </div>
              <button
                id="close-add-modal"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="py-4 space-y-4 text-xs font-sans text-neutral-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Nombre de la Sala / Evento *</label>
                  <input
                    id="form-name"
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Sala Caracol, Viña Rock"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Ciudad *</label>
                  <input
                    id="form-city"
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Ej: Madrid, Bilbao"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Región (CCAA o País)</label>
                  <input
                    id="form-region"
                    type="text"
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    placeholder="Ej: Comunidad de Madrid, Galicia"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Aforo Máximo</label>
                  <input
                    id="form-aforo"
                    type="number"
                    value={formAforo}
                    onChange={(e) => setFormAforo(Number(e.target.value))}
                    placeholder="Ej: 800"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Estilos / Géneros Musicales habituales</label>
                <input
                  id="form-genero"
                  type="text"
                  value={formGenero}
                  onChange={(e) => setFormGenero(e.target.value)}
                  placeholder="Ej: Reggae, Ska, Rock alternativo, Mestizaje"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Email de Contacto / Booking</label>
                  <input
                    id="form-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="booking@sala.com"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Teléfono</label>
                  <input
                    id="form-phone"
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Instagram (@usuario)</label>
                  <input
                    id="form-insta"
                    type="text"
                    value={formInsta}
                    onChange={(e) => setFormInsta(e.target.value)}
                    placeholder="@nombre_sala"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Origen / Fuente</label>
                  <select
                    id="form-source"
                    value={formFuente}
                    onChange={(e) => setFormFuente(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500 appearance-none"
                  >
                    <option value="Manual">Carga Manual (Diego/Larra)</option>
                    <option value="Recomendado">Recomendación Banda</option>
                    <option value="Scout AI (Simulado)">Agente Scout AI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Notas Internas</label>
                <textarea
                  id="form-notes"
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Añade algún detalle relevante: tipo de caché, contactos alternativos, etc..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  id="cancel-add-lead"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="submit-add-lead"
                  type="submit"
                  className={`px-4 py-2 rounded font-bold transition-all cursor-pointer ${colors.primary}`}
                >
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
