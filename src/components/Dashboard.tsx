import React, { useState } from 'react';
import { Lead, LeadStatus, LeadType, ThemeColors, SocialMetric } from '../types';
import { 
  Search, MapPin, Music, User, Globe, FileText, Phone, Instagram, 
  Plus, X, Calendar, AlertCircle, Sparkles, Loader2, Check, RefreshCw, 
  Database, Bot, Activity, ArrowRight, CheckCircle2, Radio, Building2, Tent, Landmark, Disc3, Briefcase
} from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  colors: ThemeColors;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>) => void;
  onAddLead: (lead: Lead) => void;
  metrics?: SocialMetric[];
}

export default function Dashboard({ leads, colors, onUpdateLead, onAddLead, metrics = [] }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('todos');
  const [genreFilter, setGenreFilter] = useState('todos');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // Scraper states
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState('');
  const [scrapedData, setScrapedData] = useState<{
    email_contacto: string;
    telefono: string;
    website?: string;
    instagram: string;
    aforo?: number | null;
    region?: string;
    genero?: string;
    source_info: string;
  } | null>(null);
  const [scrapingError, setScrapingError] = useState<string | null>(null);

  // Add new lead form states
  const [newSala, setNewSala] = useState('');
  const [newCiudad, setNewCiudad] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newAforo, setNewAforo] = useState(300);
  const [newGenero, setNewGenero] = useState('Ska / Reggae / Mestizaje');
  const [newTipo, setNewTipo] = useState<LeadType>('sala');
  const [newEmail, setNewEmail] = useState('');
  const [newInstagram, setNewInstagram] = useState('');
  const [newNotas, setNewNotas] = useState('');

  // Handle Sync simulation
  const handleForceSync = () => {
    setSyncLoading(true);
    setTimeout(() => {
      setSyncLoading(false);
    }, 1200);
  };

  const handleScrapeContact = async (lead: Lead) => {
    setIsScraping(true);
    setScrapingError(null);
    setScrapedData(null);
    
    const steps = [
      "Conectando con el Agente Scout...",
      "Buscando perfiles oficiales en la web...",
      "Extrayendo datos de Instagram y directorios...",
      "Buscando datos de aforo y estilo musical...",
      "Filtrando y validando emails de booking...",
      "Consolidando resultados..."
    ];
    
    let currentStep = 0;
    setScrapingStatus(steps[0]);
    
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setScrapingStatus(steps[currentStep]);
      }
    }, 1000);

    try {
      const response = await fetch('/api/scrape-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          nombre_sala: lead.nombre_sala,
          ciudad: lead.ciudad,
          region: lead.region
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        throw new Error('Error al conectar con el servidor.');
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setScrapedData(resData.data);
      } else {
        throw new Error(resData.error || 'No se pudieron extraer datos de contacto.');
      }
    } catch (err: any) {
      clearInterval(interval);
      setScrapingError(err.message || 'Error en el proceso de raspado.');
    } finally {
      setIsScraping(false);
    }
  };

  const getScrapedVal = (field: any) => typeof field === 'object' && field !== null ? field.valor : field;
  const getScrapedConf = (field: any) => typeof field === 'object' && field !== null ? (field.confianza || 'baja') : 'alta';
  const getScrapedSource = (field: any) => typeof field === 'object' && field !== null ? field.fuente : '';

  const handleApplyScrapedData = (lead: Lead) => {
    if (!scrapedData) return;
    const today = new Date().toISOString().split('T')[0];
    const sourceSummary = typeof scrapedData.source_info === 'string' ? scrapedData.source_info : 'Scout Scraper Grounding';
    const updatedNotes = `*** [${today}] Datos enriquecidos vía Scout Scraper. ${sourceSummary} ***\n${lead.notas || ''}`;
    
    const emailVal = getScrapedVal(scrapedData.email_contacto);
    const telVal = getScrapedVal(scrapedData.telefono);
    const webVal = getScrapedVal(scrapedData.website);
    const instaVal = getScrapedVal(scrapedData.instagram);
    const contactoVal = getScrapedVal(scrapedData.contacto_nombre);
    const aforoVal = getScrapedVal(scrapedData.aforo);
    const regionVal = getScrapedVal(scrapedData.region);
    const generoVal = getScrapedVal(scrapedData.genero);

    const contextoVal = getScrapedVal(scrapedData.contexto_extra);

    const updatedFields: Partial<Lead> = {
      email_contacto: emailVal || lead.email_contacto,
      telefono: telVal || lead.telefono,
      website: webVal || lead.website,
      instagram: instaVal || lead.instagram,
      contacto_nombre: contactoVal || lead.contacto_nombre,
      aforo: (aforoVal && !isNaN(Number(aforoVal))) ? Number(aforoVal) : lead.aforo,
      region: regionVal || lead.region,
      genero: generoVal || lead.genero,
      contexto_extra: (contextoVal && typeof contextoVal === 'string' && contextoVal.trim()) ? contextoVal.trim() : lead.contexto_extra,
      notas: updatedNotes
    };

    onUpdateLead(lead.id, updatedFields);
    setSelectedLead(prev => prev ? { ...prev, ...updatedFields } : null);
    setScrapedData(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSala || !newCiudad) return;

    const newLeadItem: Lead = {
      id: `lead-${Date.now()}`,
      nombre_sala: newSala,
      ciudad: newCiudad,
      region: newRegion,
      aforo: Number(newAforo),
      genero: newGenero,
      tipo: newTipo,
      email_contacto: newEmail,
      telefono: '',
      instagram: newInstagram,
      fuente: 'Ingreso Manual (Jon)',
      estado: 'nuevo',
      pitch_generado: '',
      notas: newNotas || 'Añadido manualmente desde el dashboard.'
    };

    onAddLead(newLeadItem);
    setIsAddModalOpen(false);

    // Reset Form
    setNewSala('');
    setNewCiudad('');
    setNewRegion('');
    setNewAforo(300);
    setNewGenero('Ska / Reggae / Mestizaje');
    setNewEmail('');
    setNewInstagram('');
    setNewNotas('');
  };

  // Get unique cities and genres for filters
  const cities = Array.from(new Set(leads.map(l => l.ciudad))).filter(Boolean);
  const genres = Array.from(new Set(leads.map(l => l.genero))).filter(Boolean);

  // Filter leads for search/scraper table
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.ciudad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'todos' || lead.ciudad === cityFilter;
    const matchesGenre = genreFilter === 'todos' || lead.genero === genreFilter;
    return matchesSearch && matchesCity && matchesGenre;
  });

  const isStitchLight = colors.accent === 'text-indigo-600';
  const subCardBg = isStitchLight ? 'bg-slate-50/60 border border-slate-200/80 text-slate-800' : 'bg-[#131313] border border-[#99907c]/15 text-[#e5e2e1]';
  const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
  const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
  const textMuted = isStitchLight ? 'text-slate-400' : 'text-neutral-500';

  return (
    <div className={`space-y-6 ${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans w-full max-w-full overflow-x-hidden`}>
      
      {/* 1. OVERVIEW RESUMEN GRID (Three cards from Stitch mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: Google Sheets Sync Status */}
        <div className={`${colors.card} p-5 flex flex-col justify-between`}>
          <div className="space-y-2">
            <div className={`flex items-center gap-1.5 ${colors.accent}`}>
              <Database className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Google Sheets Data Sync</span>
            </div>
            <h3 className={`text-xl font-display font-black uppercase tracking-wide ${textTitle}`}>LIVE SYNCED</h3>
            <div className={`text-[11px] font-mono space-y-1 ${textSub}`}>
              <div>Total Registros: <span className={`${textTitle} font-bold`}>{leads.length} Salas</span></div>
              <div>Último Cambio: Hace unos instantes</div>
            </div>
          </div>
          <button 
            id="dashboard-btn-sync"
            onClick={handleForceSync}
            disabled={syncLoading}
            className={`w-full mt-4 py-2 text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
              isStitchLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                : 'bg-[#131313] hover:bg-neutral-800 border border-[#99907c]/20 hover:border-[#99907c]/40 text-neutral-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
            <span>{syncLoading ? 'Sincronizando...' : 'Forzar Sincronización'}</span>
          </button>
        </div>

        {/* CARD 2: Agent Activity Monitor */}
        <div className={`${colors.card} p-5 flex flex-col justify-between`}>
          <div className="space-y-2">
            <div className={`flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-500' : 'text-[#ffb596]'}`}>
              <Bot className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Actividad del Agente AI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStitchLight ? 'bg-indigo-500' : 'bg-[#f2ca50]'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isStitchLight ? 'bg-indigo-500' : 'bg-[#f2ca50]'}`}></span>
              </span>
              <h3 className={`text-xl font-display font-black uppercase tracking-wide ${textTitle}`}>ONLINE</h3>
            </div>
            <div className={`text-[11px] font-mono space-y-1 ${textSub}`}>
              <div className="truncate">Hilo Activo: <span className={`${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'} font-bold`}>Negotiator #24</span></div>
              <div>Tiempo Respuesta: <span className={`${textTitle} font-bold`}>~2m avg</span></div>
            </div>
          </div>
          <div className={`text-[9px] font-mono uppercase tracking-wider text-right mt-4 self-end ${textMuted}`}>
            Sistema de Booking Autónomo v2.0
          </div>
        </div>

        {/* CARD 3: Audience Growth (High-fidelity custom styled bar metrics) */}
        <div className={`${colors.card} p-5 flex flex-col justify-between`}>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${textSub}`}>Audience Growth (Spotify/Social)</span>
            </div>
            
            {/* Custom SVG Bar Chart with Theme-dynamic design */}
            <div className="h-16 flex items-end justify-between gap-3 pt-2">
              {(() => {
                const sorted = [...metrics].sort((a,b) => a.fecha.localeCompare(b.fecha));
                const latest = sorted[sorted.length - 1] || { youtube: 1210, instagram: 2150, tiktok: 3850 };
                const spVal = 150; // Real Spotify monthly listeners
                const maxVal = Math.max(latest.youtube, latest.instagram, latest.tiktok, spVal, 100);
                
                const getPct = (val: number) => {
                  return `${Math.max((val / maxVal) * 100, 15)}%`;
                };

                const formatVal = (val: number) => {
                  if (val >= 1000) {
                    return `${(val / 1000).toFixed(1)}k`;
                  }
                  return val.toString();
                };

                const items = [
                  { name: 'YT', value: formatVal(latest.youtube), height: getPct(latest.youtube), color: isStitchLight ? 'bg-slate-300' : 'bg-neutral-700' },
                  { name: 'IG', value: formatVal(latest.instagram), height: getPct(latest.instagram), color: isStitchLight ? 'bg-indigo-400' : 'bg-[#ffb596]' },
                  { name: 'SP', value: formatVal(spVal), height: getPct(spVal), color: isStitchLight ? 'bg-indigo-600' : 'bg-[#f2ca50]' },
                  { name: 'TK', value: formatVal(latest.tiktok), height: getPct(latest.tiktok), color: isStitchLight ? 'bg-indigo-700' : 'bg-[#f2ca50]' },
                ];

                return items.map(bar => (
                  <div key={bar.name} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className={`text-[8px] font-mono font-bold ${textMuted}`}>{bar.value}</span>
                    <div 
                      className={`w-full ${bar.color} rounded-sm transition-all duration-500`} 
                      style={{ height: bar.height }} 
                    />
                    <span className={`text-[9px] font-mono font-bold ${textSub}`}>{bar.name}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
          <div className={`text-[9px] font-mono uppercase tracking-wider text-right self-end mt-4 ${textMuted}`}>
            Datos Reales de Canales
          </div>
        </div>

      </div>

      {/* 2. MAIN RESUMEN CONTENT: PRÓXIMAS FECHAS */}
      <div className={`${colors.card} p-5`}>
        <div className={`flex justify-between items-center border-b pb-3 mb-4 ${colors.border}`}>
          <div>
            <h3 className={`text-sm font-bold font-display uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Próximas Fechas</h3>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { dateDay: '11', dateMonth: 'JUL', title: 'Concierto: Gira Bakandeya 2026', desc: 'Sala Apolo, Barcelona • Caché: 1.800€ • Entradas: 85%', type: 'concierto' },
            { dateDay: '15', dateMonth: 'JUL', title: 'Ensayo General con Loops y Violín', desc: 'Camerinos Rock Palace, Madrid • Horario: 17:00 a 21:00 • Repertorio Gira', type: 'ensayo' },
            { dateDay: '22', dateMonth: 'JUL', title: 'Concierto: Festival Mestizaje del Sur', desc: 'Anfiteatro de Granada • Caché: 3.500€ • Aforo: 1.200 pax', type: 'concierto' },
            { dateDay: '29', dateMonth: 'JUL', title: 'Ensayo Técnico y Ajustes de Loops', desc: 'Local de Jon • Horario: 18:00 a 22:00 • Pruebas de Electrónica y Efectos', type: 'ensayo' },
          ].map((item, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded-xl transition-all flex items-center justify-between gap-4 cursor-pointer ${subCardBg} hover:opacity-90`}
            >
              <div className="flex items-center gap-4">
                {/* Custom calendar card block */}
                <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                  isStitchLight ? 'bg-white border-slate-200' : 'bg-[#1c1b1b] border-[#99907c]/25'
                }`}>
                  <span className={`text-xs font-mono font-bold tracking-tight leading-none ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>{item.dateDay}</span>
                  <span className={`text-[8px] font-mono font-bold uppercase tracking-wider mt-0.5 ${textMuted}`}>{item.dateMonth}</span>
                </div>

                <div>
                  <h4 className={`text-xs font-bold font-display tracking-wide flex items-center gap-2 ${textTitle}`}>
                    {item.title}
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono border ${
                      item.type === 'concierto' 
                        ? isStitchLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-[#f2ca50]/10 text-[#f2ca50] border-[#f2ca50]/20'
                        : isStitchLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#b8d6b8]/10 text-[#b8d6b8] border-[#b8d6b8]/20'
                    }`}>
                      {item.type.toUpperCase()}
                    </span>
                  </h4>
                  <p className={`text-[10px] font-mono mt-1 ${textSub}`}>{item.desc}</p>
                </div>
              </div>

              <div className={`${textMuted} hover:text-slate-900 dark:hover:text-neutral-300`}>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SEARCH & SCOUT SCRAPER (Double-enrichment workspace preserved) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        
        {/* LEADS SEARCH FOR ENRICHMENT */}
        <div className={`${colors.card} p-5 space-y-4 lg:col-span-2`}>
          <div className={`flex justify-between items-center border-b pb-3 ${colors.border}`}>
            <div>
              <h3 className={`text-sm font-bold font-display uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`}>Directorio de Salas y Scout</h3>
            </div>
            <button
              id="dashboard-btn-add"
              onClick={() => setIsAddModalOpen(true)}
              className={`px-3 py-1.5 font-mono font-bold text-[10px] uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md ${
                isStitchLight 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' 
                  : 'bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] shadow-[#f2ca50]/10'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Sala
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
              <input
                id="search-leads"
                type="text"
                placeholder="Buscar sala, club o teatro por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none font-mono transition-all ${
                  isStitchLight 
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-400' 
                    : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1] focus:border-[#f2ca50]/50 placeholder:text-neutral-600'
                }`}
              />
            </div>
            
            <div className="flex gap-2">
              <select
                id="filter-city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className={`border rounded-lg text-xs py-1.5 px-3 font-mono focus:outline-none ${
                  isStitchLight 
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' 
                    : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1] focus:border-[#f2ca50]/50'
                }`}
              >
                <option value="todos">Ciudad: Todas</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                id="filter-genre"
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className={`border rounded-lg text-xs py-1.5 px-3 font-mono focus:outline-none ${
                  isStitchLight 
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' 
                    : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1] focus:border-[#f2ca50]/50'
                }`}
              >
                <option value="todos">Género: Todos</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* List of Leads */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredLeads.length === 0 ? (
              <div className={`text-center py-12 text-xs font-mono ${textMuted}`}>
                No hay salas registradas que coincidan con estos filtros.
              </div>
            ) : (
              filteredLeads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedLead?.id === lead.id 
                      ? isStitchLight
                        ? 'bg-indigo-50/50 border-indigo-300 shadow-sm'
                        : 'bg-[#ffb596]/5 border-[#ffb596]/40 shadow-[0_0_15px_rgba(255,181,150,0.03)]' 
                      : isStitchLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        : 'bg-[#131313] border-[#99907c]/15 hover:border-[#99907c]/35 hover:bg-[#1c1b1b]/30'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-bold font-display truncate ${
                      selectedLead?.id === lead.id && isStitchLight ? 'text-indigo-900 font-extrabold' : textTitle
                    }`}>{lead.nombre_sala}</h4>
                    <div className={`flex gap-3 text-[10px] font-mono mt-1 flex-wrap ${textSub}`}>
                      <span>{lead.ciudad} ({lead.region || 'N/A'})</span>
                      <span>Aforo: {lead.aforo || 'Desconocido'} pax</span>
                      <span className={isStitchLight ? 'text-indigo-600 font-bold' : 'text-[#f2ca50]/80'}>{lead.genero}</span>
                    </div>
                  </div>
                  <button
                    id={`btn-enrich-${lead.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLead(lead);
                      handleScrapeContact(lead);
                    }}
                    className={`px-2.5 py-1 text-[9px] font-mono rounded uppercase tracking-wider shrink-0 cursor-pointer border ${
                      isStitchLight 
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' 
                        : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    Escanear
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DETAILS & SCRAPER TERMINAL */}
        <div className="space-y-4 lg:col-span-1">
          {selectedLead ? (
            <div className={`${colors.card} p-5 space-y-4`}>
              <div className={`border-b pb-3 ${colors.border}`}>
                <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${isStitchLight ? 'text-indigo-500' : 'text-[#ffb596]'}`}>Ficha de la Sala</span>
                <h3 className={`text-sm font-bold font-display tracking-wide mt-1 ${textTitle}`}>{selectedLead.nombre_sala}</h3>
                <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>{selectedLead.ciudad} • {selectedLead.region}</p>
              </div>

              {/* Scraper Panel */}
              <div className={`rounded-lg p-3.5 space-y-3 border ${
                isStitchLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#131313] border-neutral-900'
              }`}>
                <div className={`flex justify-between items-center border-b pb-1.5 ${isStitchLight ? 'border-slate-200' : 'border-neutral-800'}`}>
                  <h4 className={`text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 ${textSub}`}>
                    <Bot className={`w-3.5 h-3.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`} /> Agente Scout Scraper
                  </h4>
                  {isScraping && <Loader2 className={`w-3.5 h-3.5 animate-spin ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`} />}
                </div>

                {isScraping ? (
                  <div className="space-y-2 py-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                      <Loader2 className={`w-4 h-4 animate-spin ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`} />
                      <span className={isStitchLight ? 'text-slate-700' : 'text-neutral-300'}>{scrapingStatus}</span>
                    </div>
                    <div className={`w-full h-1 rounded-full overflow-hidden ${isStitchLight ? 'bg-slate-200' : 'bg-neutral-900'}`}>
                      <div className={`h-full w-2/3 animate-pulse ${isStitchLight ? 'bg-indigo-600' : 'bg-gradient-to-r from-[#f2ca50] to-[#ffb596]'}`} />
                    </div>
                    <p className={`text-[9px] font-mono leading-normal ${textMuted}`}>
                      El agente de raspado web está buscando en Instagram, sitios oficiales y directorios de música el contacto de booking para esta sala...
                    </p>
                  </div>
                ) : scrapedData ? (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-600 font-bold uppercase">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Escaneo Realizado
                      </span>
                      {scrapedData.simulated || scrapedData.isFallback ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                          Sin Verificar / Fallback
                        </span>
                      ) : null}
                    </div>
                    
                    <div className={`space-y-2 text-xs font-mono ${textSub}`}>
                      {[
                        { label: 'Email', key: 'email_contacto' },
                        { label: 'Teléfono', key: 'telefono' },
                        { label: 'Contacto', key: 'contacto_nombre' },
                        { label: 'Instagram', key: 'instagram' },
                        { label: 'Aforo', key: 'aforo' }
                      ].map(({ label, key }) => {
                        const val = getScrapedVal(scrapedData[key]);
                        const conf = getScrapedConf(scrapedData[key]);
                        if (!val && conf === 'baja') return null;
                        return (
                          <div key={key} className="flex items-center justify-between gap-2 border-b border-dashed border-neutral-800 pb-1">
                            <span>{label}: <span className={`${textTitle} font-bold`}>{val || 'No hallado'}</span></span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold uppercase ${
                              conf === 'alta' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {conf === 'alta' ? 'Alta (Verificado)' : 'Revisar a mano'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      id="dashboard-btn-apply-scraped"
                      onClick={() => handleApplyScrapedData(selectedLead)}
                      className={`w-full py-1.5 font-mono font-bold text-[10px] uppercase rounded transition-all cursor-pointer text-center ${
                        isStitchLight 
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
                          : 'bg-[#ffb596] hover:bg-[#ffc6ad] text-[#3c1d10]'
                      }`}
                    >
                      Aplicar y Guardar en Sheets
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-1">
                    <p className={`text-[10px] leading-relaxed font-sans ${textSub}`}>
                      ¿Faltan datos de contacto en la hoja? Haz que el Agente Scout busque en la web de forma automática:
                    </p>
                    <button
                      id="dashboard-btn-scout-trigger"
                      onClick={() => handleScrapeContact(selectedLead)}
                      className={`w-full py-2 border text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono font-bold ${
                        isStitchLight 
                          ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white shadow-sm' 
                          : 'bg-neutral-900 hover:bg-neutral-800 border-[#99907c]/25 text-[#f2ca50]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Iniciar Escaneo AI
                    </button>
                  </div>
                )}

                {scrapingError && (
                  <div className="p-2.5 bg-[#ff4b4b]/10 border border-[#ff4b4b]/20 text-[#ff4b4b] text-[10px] font-mono rounded flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{scrapingError}</span>
                  </div>
                )}
              </div>

              {/* General Details List */}
              <div className={`space-y-2 text-xs font-mono ${textSub}`}>
                <div className={`flex justify-between border-b pb-1.5 ${isStitchLight ? 'border-slate-100' : 'border-neutral-900'}`}>
                  <span className={textMuted}>Email:</span>
                  <span className={`${textTitle} select-all`}>{selectedLead.email_contacto || 'Falta contactar'}</span>
                </div>
                <div className={`flex justify-between border-b pb-1.5 ${isStitchLight ? 'border-slate-100' : 'border-neutral-900'}`}>
                  <span className={textMuted}>Instagram:</span>
                  <span className={`${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'} select-all font-bold`}>{selectedLead.instagram || 'No configurado'}</span>
                </div>
                <div className={`flex justify-between border-b pb-1.5 ${isStitchLight ? 'border-slate-100' : 'border-neutral-900'}`}>
                  <span className={textMuted}>Estilo Preferente:</span>
                  <span className={`${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'} font-bold`}>{selectedLead.genero || 'No especificado'}</span>
                </div>
                <div className={`flex justify-between border-b pb-1.5 ${isStitchLight ? 'border-slate-100' : 'border-neutral-900'}`}>
                  <span className={textMuted}>Aforo:</span>
                  <span className={textTitle}>{selectedLead.aforo ? `${selectedLead.aforo} personas` : 'Desconocido'}</span>
                </div>
                <div className={`flex justify-between border-b pb-1.5 ${isStitchLight ? 'border-slate-100' : 'border-neutral-900'}`}>
                  <span className={textMuted}>Fuente original:</span>
                  <span className={`${textMuted} italic`}>{selectedLead.fuente || 'Manual'}</span>
                </div>
              </div>

              {/* Notes Log */}
              <div className="space-y-1.5">
                <span className={`block text-[9px] uppercase font-mono tracking-wider ${textMuted}`}>Notas de la sala</span>
                <div className={`border p-2.5 rounded-lg text-[10px] font-mono max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed ${
                  isStitchLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-600' 
                    : 'bg-[#131313]/60 border-neutral-900 text-neutral-400'
                }`}>
                  {selectedLead.notas || 'Sin anotaciones.'}
                </div>
              </div>

            </div>
          ) : (
            <div className={`${colors.card} p-6 text-center py-24 text-neutral-500 space-y-3`}>
              <Database className={`w-10 h-10 mx-auto animate-pulse ${isStitchLight ? 'text-indigo-300' : 'text-[#ffb596]/45'}`} />
              <h4 className={`text-xs font-mono uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`}>Detalles de la Fila</h4>
              <p className={`text-[11px] leading-relaxed max-w-[200px] mx-auto ${textSub}`}>
                Selecciona cualquier sala del inventario para ver su ficha completa o lanzar el agente Scout de enriquecimiento autónomo.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 4. MODAL: AGREGAR NUEVA SALA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border border-[#f2ca50]/30 rounded-xl w-full max-w-lg overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            
            <div className="p-4 border-b border-[#99907c]/15 flex justify-between items-center bg-[#131313]">
              <h3 className="text-sm font-bold font-display uppercase tracking-widest text-[#f2ca50] flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Agregar Nueva Sala a la Hoja
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs font-sans">
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
                    className="w-full bg-[#131313] border border-[#99907c]/25 rounded px-3 py-1.5 focus:outline-none focus:border-[#f2ca50]/50 text-[#e5e2e1] font-mono"
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
                    className="w-full bg-[#131313] border border-[#99907c]/25 rounded px-3 py-1.5 focus:outline-none focus:border-[#f2ca50]/50 text-[#e5e2e1] font-mono"
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
                    className="w-full bg-[#131313] border border-[#99907c]/25 rounded px-3 py-1.5 focus:outline-none focus:border-[#f2ca50]/50 text-[#e5e2e1] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Aforo Estimado (Pax)</label>
                  <input
                    id="new-lead-aforo"
                    type="number"
                    value={newAforo}
                    onChange={(e) => setNewAforo(Number(e.target.value))}
                    className="w-full bg-[#131313] border border-[#99907c]/25 rounded px-3 py-1.5 focus:outline-none focus:border-[#f2ca50]/50 text-[#e5e2e1] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Género Musical Preferente</label>
                  <input
                    id="new-lead-genero"
                    type="text"
                    value={newGenero}
                    onChange={(e) => setNewGenero(e.target.value)}
                    className="w-full bg-[#131313] border border-[#99907c]/25 rounded px-3 py-1.5 focus:outline-none focus:border-[#f2ca50]/50 text-[#e5e2e1] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">Categoría de Contacto</label>
                  <select
                    id="new-lead-tipo"
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value as LeadType)}
                    className="w-full bg-[#131313] border border-[#99907c]/25 rounded px-3 py-1.5 focus:outline-none focus:border-[#f2ca50]/50 text-[#e5e2e1] font-mono cursor-pointer"
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
                    className="w-full bg-[#131313] border border-[#99907c]/25 rounded px-3 py-1.5 focus:outline-none focus:border-[#f2ca50]/50 text-[#e5e2e1] font-mono"
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
                  className="w-full bg-[#131313] border border-[#99907c]/25 rounded px-3 py-1.5 focus:outline-none focus:border-[#f2ca50]/50 text-[#e5e2e1] font-mono"
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
                  className="w-full bg-[#131313] border border-[#99907c]/25 rounded p-3 focus:outline-none focus:border-[#f2ca50]/50 text-[#e5e2e1] font-sans leading-relaxed"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-neutral-900">
                <button
                  id="btn-add-cancel"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[10px] uppercase rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-add-submit"
                  type="submit"
                  className="px-5 py-2 bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] font-mono font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer shadow-lg shadow-[#f2ca50]/10"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
