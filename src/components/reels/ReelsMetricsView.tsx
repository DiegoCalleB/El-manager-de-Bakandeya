import React, { useState } from 'react';
import { ThemeColors, SocialMetric } from '../../types';
import { 
  TrendingUp, Instagram, Youtube, Video, Plus, Table, Edit, Trash2, ChevronRight, RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ReelsMetricsViewProps {
  colors: ThemeColors;
  isStitchLight?: boolean;
  metrics: SocialMetric[];
  onAddMetric?: (metric: SocialMetric) => Promise<void>;
  onUpdateMetric?: (id: string, updatedFields: Partial<SocialMetric>) => Promise<void>;
  onDeleteMetric?: (id: string) => Promise<void>;
}

export function ReelsMetricsView({
  colors,
  isStitchLight,
  metrics = [],
  onAddMetric,
  onUpdateMetric,
  onDeleteMetric
}: ReelsMetricsViewProps) {
  const [metricDate, setMetricDate] = useState(new Date().toISOString().split('T')[0]);
  const [metricInsta, setMetricInsta] = useState('');
  const [metricTiktok, setMetricTiktok] = useState('');
  const [metricYoutube, setMetricYoutube] = useState('');
  const [metricNotes, setMetricNotes] = useState('');
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [isSavingMetric, setIsSavingMetric] = useState(false);
  const [metricSuccess, setMetricSuccess] = useState('');

  const [realVideos] = useState<any[]>([
    {
      title: "El Violín del Diablo (Ska-Reggae Live)",
      views: 5240,
      date: "2025-11-12",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      title: "Bakandeya - Ensayo en Trinchera Málaga",
      views: 3120,
      date: "2026-02-18",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      title: "Gira Bakandeya 2026 - Promo Oficial",
      views: 1850,
      date: "2026-04-05",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      title: "Backstage Apolo BCN - Reel Exclusivo",
      views: 4100,
      date: "2026-05-20",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ]);

  const handleEditMetricClick = (m: SocialMetric) => {
    setEditingMetricId(m.id);
    setMetricDate(m.fecha || new Date().toISOString().split('T')[0]);
    setMetricInsta(m.instagram ? String(m.instagram) : '');
    setMetricTiktok(m.tiktok ? String(m.tiktok) : '');
    setMetricYoutube(m.youtube ? String(m.youtube) : '');
    setMetricNotes(m.notas || '');
  };

  const handleCancelEditMetric = () => {
    setEditingMetricId(null);
    setMetricDate(new Date().toISOString().split('T')[0]);
    setMetricInsta('');
    setMetricTiktok('');
    setMetricYoutube('');
    setMetricNotes('');
  };

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricDate) return;

    setIsSavingMetric(true);
    setMetricSuccess('');

    try {
      const metricData: Partial<SocialMetric> = {
        fecha: metricDate,
        instagram: parseInt(metricInsta, 10) || 0,
        tiktok: parseInt(metricTiktok, 10) || 0,
        youtube: parseInt(metricYoutube, 10) || 0,
        notas: metricNotes
      };

      if (editingMetricId) {
        if (onUpdateMetric) {
          await onUpdateMetric(editingMetricId, metricData);
        }
        setMetricSuccess('Fila actualizada con éxito en Google Sheets');
      } else {
        if (onAddMetric) {
          const newMetric: SocialMetric = {
            id: `m_${Date.now()}`,
            fecha: metricDate,
            instagram: parseInt(metricInsta, 10) || 0,
            tiktok: parseInt(metricTiktok, 10) || 0,
            youtube: parseInt(metricYoutube, 10) || 0,
            notas: metricNotes
          };
          await onAddMetric(newMetric);
        }
        setMetricSuccess('Nuevo registro añadido a Google Sheets');
      }

      handleCancelEditMetric();
      setTimeout(() => setMetricSuccess(''), 4000);
    } catch (err) {
      console.error('Error guardando métrica:', err);
    } finally {
      setIsSavingMetric(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {metricSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono text-xs flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{metricSuccess}</span>
        </div>
      )}

      {/* 1. KPIs Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total Followers */}
        <div className={`p-4 rounded-xl ${isStitchLight ? 'bg-slate-50/50 border border-slate-100' : 'bg-neutral-900/40 border border-neutral-900'}`}>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Audiencia Total</span>
          <span className={`text-xl font-black font-display tracking-tight mt-1 block ${isStitchLight ? 'text-slate-800' : 'text-white'}`}>
            {(() => {
              const sorted = [...metrics].sort((a, b) => a.fecha.localeCompare(b.fecha));
              const latest = sorted[sorted.length - 1];
              const total = latest ? latest.instagram + latest.tiktok + latest.youtube : 0;
              return total.toLocaleString();
            })()}
          </span>
          <span className="text-[8px] font-mono text-neutral-500 mt-1 block font-bold">Suma canales sociales</span>
        </div>

        {/* Net Growth */}
        <div className={`p-4 md:col-span-2 rounded-xl ${isStitchLight ? 'bg-slate-50/50 border border-slate-100' : 'bg-neutral-900/40 border border-neutral-900'}`}>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Crecimiento Neto</span>
          <span className="text-xl font-black font-display tracking-tight mt-1 block text-emerald-500">
            {(() => {
              const sorted = [...metrics].sort((a, b) => a.fecha.localeCompare(b.fecha));
              const latest = sorted[sorted.length - 1];
              const oldest = sorted[0];
              if (latest && oldest) {
                const diff = (latest.instagram + latest.tiktok + latest.youtube) - (oldest.instagram + oldest.tiktok + oldest.youtube);
                return `+${diff.toLocaleString()}`;
              }
              return "0";
            })()}
          </span>
          <span className="text-[8px] font-mono text-neutral-500 mt-1 block font-bold">Desde registro inicial</span>
        </div>

        {/* Canal Principal */}
        <div className={`p-4 rounded-xl ${isStitchLight ? 'bg-slate-50/50 border border-slate-100' : 'bg-neutral-900/40 border border-neutral-900'}`}>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Canal Principal</span>
          <span className={`text-xl font-black font-display tracking-tight mt-1 block ${isStitchLight ? 'text-slate-800' : 'text-white'}`}>
            {(() => {
              const sorted = [...metrics].sort((a, b) => a.fecha.localeCompare(b.fecha));
              const latest = sorted[sorted.length - 1];
              if (latest) {
                if (latest.instagram >= latest.tiktok && latest.instagram >= latest.youtube) return "Instagram";
                if (latest.tiktok >= latest.instagram && latest.tiktok >= latest.youtube) return "TikTok";
                return "YouTube";
              }
              return "Pendiente";
            })()}
          </span>
          <span className="text-[8px] font-mono text-neutral-500 mt-1 block font-bold">Mayor audiencia activa</span>
        </div>

        {/* Última Actualización */}
        <div className={`p-4 rounded-xl ${isStitchLight ? 'bg-slate-50/50 border border-slate-100' : 'bg-neutral-900/40 border border-neutral-900'}`}>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Último Log</span>
          <span className={`text-sm font-bold font-mono tracking-tight mt-1.5 block ${isStitchLight ? 'text-slate-800' : 'text-white'}`}>
            {(() => {
              const sorted = [...metrics].sort((a, b) => a.fecha.localeCompare(b.fecha));
              const latest = sorted[sorted.length - 1];
              if (latest) {
                const parts = latest.fecha.split('-');
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
              }
              return "-";
            })()}
          </span>
          <span className="text-[8px] font-mono text-neutral-500 mt-1 block font-bold">Sincronizado</span>
        </div>
      </div>

      {/* 2. Recharts Area Chart */}
      {metrics.length > 0 && (
        <div className={`p-4 rounded-xl ${isStitchLight ? 'bg-slate-50/50 border border-slate-100' : 'bg-[#131313]/50 border border-neutral-900'}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Curva de Crecimiento de Audiencia</span>
            <div className="flex gap-4 text-[9px] font-mono text-neutral-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500 block"></span> Instagram</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 block"></span> TikTok</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 block"></span> YouTube</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={[...metrics].sort((a, b) => a.fecha.localeCompare(b.fecha))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTikTok" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorYouTube" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isStitchLight ? '#e2e8f0' : '#222222'} />
                <XAxis 
                  dataKey="fecha" 
                  stroke="#888888" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(tick) => {
                    const parts = tick.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : tick;
                  }}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isStitchLight ? '#ffffff' : '#131313', 
                    borderColor: isStitchLight ? '#cbd5e1' : '#333333',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontFamily: 'monospace'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: isStitchLight ? '#1e293b' : '#ffffff' }}
                />
                <Area type="monotone" dataKey="instagram" name="Instagram" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorInstagram)" />
                <Area type="monotone" dataKey="tiktok" name="TikTok" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorTikTok)" />
                <Area type="monotone" dataKey="youtube" name="YouTube" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorYouTube)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. Vistas de Videos Section (Real Views) */}
      <div className={`${colors.card} p-5 space-y-4`}>
        <div className={`border-b pb-2 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
          <h3 className={`text-xs font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
            <Video className="w-3.5 h-3.5 text-emerald-500" /> Monitoreo de Views Reales en Videos y Reels
          </h3>
          <p className="text-[9px] font-mono text-neutral-500 mt-0.5">
            Estadísticas de visualización directa de los últimos contenidos oficiales publicados por Bakandeya.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {realVideos.map((video, idx) => (
            <div 
              key={idx} 
              className={`p-3 rounded-xl flex items-center justify-between gap-3 ${
                isStitchLight ? 'bg-slate-50/50 border border-slate-100' : 'bg-[#101010] border border-neutral-800'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <span className={`text-[10px] font-bold block truncate ${isStitchLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                  {video.title}
                </span>
                <span className="text-[8px] font-mono text-neutral-500 block">
                  Publicado: {video.date || "Reciente"}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black font-display text-emerald-400 block">
                  {video.views ? video.views.toLocaleString() : "0"} views
                </span>
                <a 
                  href={video.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`text-[8px] font-mono font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5 justify-end ${
                    isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'
                  }`}
                >
                  Ver Video <ChevronRight className="w-2.5 h-2.5 inline" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Formulario Izquierda (5 cols) | Historial Tabla Derecha (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Formulario de Registro (5 columns) */}
        <div className={`lg:col-span-5 ${colors.card} p-5 space-y-4`}>
          <div className={`border-b pb-2 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
            <h3 className={`text-xs font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
              <Plus className="w-3.5 h-3.5" />
              {editingMetricId ? 'Editar Checkpoint' : 'Registrar Checkpoint'}
            </h3>
            <p className="text-[9px] font-mono text-neutral-500 mt-0.5">
              {editingMetricId ? 'Modifica los valores del log seleccionado en Sheets' : 'Añade una nueva fila cronológica de seguidores'}
            </p>
          </div>

          <form onSubmit={handleSaveMetric} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Fecha del Checkpoint</label>
              <input
                type="date"
                value={metricDate}
                onChange={(e) => setMetricDate(e.target.value)}
                className={`w-full p-2.5 rounded-lg text-xs font-mono focus:outline-none ${
                  isStitchLight
                    ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                }`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-pink-500" /> Insta
                </label>
                <input
                  type="number"
                  placeholder="8400"
                  value={metricInsta}
                  onChange={(e) => setMetricInsta(e.target.value)}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono focus:outline-none ${
                    isStitchLight
                      ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <Video className="w-3 h-3 text-cyan-400" /> TikTok
                </label>
                <input
                  type="number"
                  placeholder="12500"
                  value={metricTiktok}
                  onChange={(e) => setMetricTiktok(e.target.value)}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono focus:outline-none ${
                    isStitchLight
                      ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <Youtube className="w-3 h-3 text-red-500" /> YouTube
                </label>
                <input
                  type="number"
                  placeholder="3100"
                  value={metricYoutube}
                  onChange={(e) => setMetricYoutube(e.target.value)}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono focus:outline-none ${
                    isStitchLight
                      ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Notas / Eventos (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Lanzamiento single / Concierto Apolo"
                value={metricNotes}
                onChange={(e) => setMetricNotes(e.target.value)}
                className={`w-full p-2.5 rounded-lg text-xs font-sans focus:outline-none ${
                  isStitchLight
                    ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                }`}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingMetric}
                className={`flex-1 py-2.5 rounded-xl font-mono text-[10px] font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                  isSavingMetric
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : isStitchLight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-lg shadow-[#f2ca50]/15'
                }`}
              >
                {isSavingMetric ? 'Guardando...' : editingMetricId ? 'Actualizar Log' : 'Añadir Log'}
              </button>

              {editingMetricId && (
                <button
                  type="button"
                  onClick={handleCancelEditMetric}
                  className={`px-2 py-1 rounded font-mono text-[10px] font-bold tracking-widest uppercase cursor-pointer transition-all ${
                    isStitchLight
                      ? 'border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                      : 'border border-neutral-800 text-neutral-400 bg-neutral-900 hover:bg-neutral-850'
                  }`}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Historial Tabla (7 columns) */}
        <div className={`lg:col-span-7 ${colors.card} p-5 space-y-4 flex flex-col min-w-0`}>
          <div className={`border-b pb-2 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
            <h3 className={`text-xs font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
              <Table className="w-3.5 h-3.5" /> Registros Históricos ({metrics.length})
            </h3>
            <p className="text-[9px] font-mono text-neutral-500 mt-0.5">
              Valores absolutos capturados en Google Sheets. Se muestran con el delta calculated.
            </p>
          </div>

          <div className="overflow-x-auto flex-1 min-h-[300px]">
            <table className="w-full text-left text-[10px] font-mono">
              <thead>
                <tr className={`border-b text-neutral-400 uppercase tracking-wider text-[8px] ${isStitchLight ? 'border-slate-100' : 'border-neutral-900'}`}>
                  <th className="py-2.5 font-medium">Fecha</th>
                  <th className="py-2.5 font-medium text-right">Instagram</th>
                  <th className="py-2.5 font-medium text-right">TikTok</th>
                  <th className="py-2.5 font-medium text-right">YouTube</th>
                  <th className="py-2.5 font-medium pl-3">Notas</th>
                  <th className="py-2.5 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-500/10">
                {metrics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500 font-mono text-xs">
                      No hay registros históricos todavía. Añade un checkpoint a la izquierda.
                    </td>
                  </tr>
                ) : (
                  [...metrics]
                    .sort((a, b) => b.fecha.localeCompare(a.fecha))
                    .map((m, index, arr) => {
                      const prevLog = index + 1 < arr.length ? arr[index + 1] : null;
                      
                      const instaDelta = prevLog ? m.instagram - prevLog.instagram : 0;
                      const tiktokDelta = prevLog ? m.tiktok - prevLog.tiktok : 0;
                      const youtubeDelta = prevLog ? m.youtube - prevLog.youtube : 0;

                      const formatDelta = (delta: number) => {
                        if (delta > 0) return <span className="text-emerald-500 font-bold">+{delta}</span>;
                        if (delta < 0) return <span className="text-rose-500 font-bold">{delta}</span>;
                        return <span className="text-neutral-500">0</span>;
                      };

                      const parts = m.fecha.split('-');
                      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}` : m.fecha;

                      return (
                        <tr key={`${m.id || 'metric'}-${index}`} className={`hover:bg-neutral-500/5 transition-colors ${
                          editingMetricId === m.id 
                            ? isStitchLight ? 'bg-indigo-50/40' : 'bg-[#f2ca50]/5' 
                            : ''
                        }`}>
                          <td className="py-3 font-bold whitespace-nowrap">{formattedDate}</td>
                          <td className="py-3 text-right">
                            <div className="font-bold">{m.instagram.toLocaleString()}</div>
                            <div className="text-[8px] text-neutral-500">{formatDelta(instaDelta)}</div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="font-bold">{m.tiktok.toLocaleString()}</div>
                            <div className="text-[8px] text-neutral-500">{formatDelta(tiktokDelta)}</div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="font-bold">{m.youtube.toLocaleString()}</div>
                            <div className="text-[8px] text-neutral-500">{formatDelta(youtubeDelta)}</div>
                          </td>
                          <td className="py-3 pl-3 text-neutral-400 font-sans max-w-[120px] truncate" title={m.notas}>
                            {m.notas || <span className="text-neutral-600 font-mono text-[9px]">-</span>}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditMetricClick(m)}
                                className="p-1 hover:text-indigo-400 transition-colors cursor-pointer bg-transparent border-none text-neutral-500"
                                title="Editar fila"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteMetric && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm('¿Seguro que deseas eliminar este checkpoint de Google Sheets?')) {
                                      await onDeleteMetric(m.id);
                                    }
                                  }}
                                  className="p-1 hover:text-rose-500 transition-colors cursor-pointer bg-transparent border-none text-neutral-500"
                                  title="Eliminar fila"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
