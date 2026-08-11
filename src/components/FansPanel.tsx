import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Heart, QrCode, Download, Search, Plus, Trash2, Sparkles, 
  Copy, Check, FileSpreadsheet, ShieldCheck, Mail, MapPin, Calendar, ExternalLink,
  Filter, LayoutGrid, List, Map as MapIcon, X, TrendingUp, Printer, Share2, MessageCircle
} from 'lucide-react';
import QRCode from 'react-qr-code';
import * as XLSX from 'xlsx';
import { Fan, Concert, EPKConfig } from '../types';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FansPanelProps {
  fans: Fan[];
  concerts: Concert[];
  epkConfig: EPKConfig;
  onAddFan: (fan: Fan) => void;
  onDeleteFan: (id: string) => void;
  onUpdateIncentive: (newIncentive: EPKConfig['incentivoFans']) => void;
  onUpdateEpkConfig?: (newConfig: Partial<EPKConfig>) => void;
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const FansPanel: React.FC<FansPanelProps> = ({
  fans = [],
  concerts = [],
  epkConfig,
  onAddFan,
  onDeleteFan,
  onUpdateIncentive,
  onUpdateEpkConfig
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fans' | 'qr' | 'incentives'>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrigen, setFilterOrigen] = useState<string>('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
  const [selectedConcertId, setSelectedConcertId] = useState<string>('');

  // Configurable City Tabs state (synced with DB epkConfig.ciudadesConfig)
  const [customCityChips, setCustomCityChips] = useState<string[]>(() => {
    if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
      return epkConfig.ciudadesConfig;
    }
    try {
      const saved = localStorage.getItem('bakandeya_custom_cities');
      return saved ? JSON.parse(saved) : ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
    } catch {
      return ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
    }
  });

  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCityInput, setNewCityInput] = useState('');

  useEffect(() => {
    if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
      setCustomCityChips(epkConfig.ciudadesConfig);
    }
  }, [epkConfig?.ciudadesConfig]);

  const handleAddCityTab = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCityInput.trim()) return;
    const formatted = newCityInput.trim();
    if (!customCityChips.includes(formatted)) {
      const updated = [...customCityChips, formatted];
      setCustomCityChips(updated);
      try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
      if (onUpdateEpkConfig) {
        onUpdateEpkConfig({ ciudadesConfig: updated });
      }
    }
    setSelectedCityFilter(formatted);
    setNewCityInput('');
    setIsAddingCity(false);
  };

  const handleRemoveCityTab = (cityToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customCityChips.filter(c => c !== cityToRemove);
    setCustomCityChips(updated);
    try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
    if (selectedCityFilter === cityToRemove) {
      setSelectedCityFilter('');
    }
    if (onUpdateEpkConfig) {
      onUpdateEpkConfig({ ciudadesConfig: updated });
    }
  };
  
  // Incentive state
  const [incentivo, setIncentivo] = useState(epkConfig?.incentivoFans || {
    mensajeAgradecimiento: "¡Muchas gracias por unirte a la familia de la banda!",
    enlaceDescarga: "https://bands-manager.up.railway.app/descargas/tema-inedito-directo.mp3",
    codigoDescuento: "BAKANDEYA-FAN-10"
  });
  const [savedIncentive, setSavedIncentive] = useState(false);

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCiudad, setNewCiudad] = useState('');
  const [newOrigen, setNewOrigen] = useState('Manual');

  const filteredFans = useMemo(() => {
    return fans.filter(f => {
      const matchQuery = f.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.ciudad && f.ciudad.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.conciertoOrigenNombre && f.conciertoOrigenNombre.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchFilter = filterOrigen 
        ? (f.conciertoOrigenId === filterOrigen || (filterOrigen === 'Otros' && !f.conciertoOrigenId))
        : true;

      const matchCity = selectedCityFilter
        ? (f.ciudad && f.ciudad.toLowerCase().includes(selectedCityFilter.toLowerCase()))
        : true;

      return matchQuery && matchFilter && matchCity;
    });
  }, [fans, searchQuery, filterOrigen, selectedCityFilter]);

  // Analytics Data - Channel of Origin (robust categorization)
  const originData = useMemo(() => {
    if (!fans || fans.length === 0) return [];
    const counts: Record<string, number> = {};
    
    fans.forEach(f => {
      let raw = (f.comoConocio || f.conciertoOrigenNombre || '').trim();
      if (!raw) {
        if (f.conciertoOrigenId) raw = 'Concierto en Directo';
        else raw = 'Registro Directo / QR';
      }

      let category = raw;
      const lower = raw.toLowerCase();
      if (lower.includes('sala') || lower.includes('concierto') || lower.includes('festival') || lower.includes('directo') || lower.includes('bolo') || lower.includes('caracol') || lower.includes('viña')) {
        category = 'Conciertos / Directo';
      } else if (lower.includes('insta') || lower.includes('ig')) {
        category = 'Instagram';
      } else if (lower.includes('tik')) {
        category = 'TikTok';
      } else if (lower.includes('qr') || lower.includes('escenario')) {
        category = 'Escaneo QR';
      } else if (lower.includes('amigo') || lower.includes('boca')) {
        category = 'Boca a Boca / Amigos';
      } else if (lower.includes('spot') || lower.includes('you') || lower.includes('web')) {
        category = 'Web / Streaming';
      } else if (lower.includes('manual')) {
        category = 'Registro Manual';
      }

      counts[category] = (counts[category] || 0) + 1;
    });

    const total = fans.length;
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100)
    })).sort((a, b) => b.value - a.value);
  }, [fans]);

  // Analytics Data - Evolutionary Cumulative Growth Chart
  const evolutionaryGrowthData = useMemo(() => {
    if (!fans || fans.length === 0) return [];

    const monthMap: Record<string, number> = {};
    fans.forEach(f => {
      const month = f.fechaCaptura ? f.fechaCaptura.substring(0, 7) : '2026-05';
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthMap).sort();
    let runningTotal = 0;
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return sortedMonths.map(month => {
      const newCount = monthMap[month];
      runningTotal += newCount;
      const [y, m] = month.split('-');
      const mIdx = m ? parseInt(m, 10) - 1 : 0;
      const label = `${monthNames[mIdx] || m} '${y ? y.slice(2) : '26'}`;
      return {
        month,
        date: label,
        nuevos: newCount,
        total: runningTotal
      };
    });
  }, [fans]);

  const uniqueConcertIds = useMemo(() => {
    const ids = new Set<string>();
    fans.forEach(f => {
      if (f.conciertoOrigenId) ids.add(f.conciertoOrigenId);
    });
    return Array.from(ids).map(id => {
      const concert = concerts.find(c => c.id === id);
      return { id, name: concert ? `${concert.sala} (${concert.fecha})` : id };
    });
  }, [fans, concerts]);

  const handleExportCSV = () => {
    const dataToExport = filteredFans.map(f => ({
      ID: f.id,
      Nombre: f.nombre,
      Email: f.email,
      Ciudad: f.ciudad || '',
      Origen: f.comoConocio || f.conciertoOrigenNombre || '',
      'Concierto ID': f.conciertoOrigenId || '',
      'Fecha Registro': f.fechaCaptura,
      'Consentimiento RGPD': f.consentimientoRGPD ? 'SÍ' : 'NO'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fans Bakandeya");
    XLSX.writeFile(workbook, `Fans_Bakandeya_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newEmail.trim()) return;

    const fan: Fan = {
      id: `fan-${Date.now()}`,
      nombre: newNombre.trim(),
      email: newEmail.trim(),
      ciudad: newCiudad.trim() || undefined,
      comoConocio: newOrigen,
      fechaCaptura: new Date().toISOString().split('T')[0],
      consentimientoRGPD: true
    };
    onAddFan(fan);
    setShowAddModal(false);
    setNewNombre(''); setNewEmail(''); setNewCiudad(''); setNewOrigen('Manual');
  };

  const handleSaveIncentive = () => {
    onUpdateIncentive(incentivo);
    setSavedIncentive(true);
    setTimeout(() => setSavedIncentive(false), 2500);
  };

  const selectedConcert = concerts.find(c => c.id === selectedConcertId);
  const [customSlug, setCustomSlug] = useState('');
  const [useCustomDomain, setUseCustomDomain] = useState(true); // Default to clean custom domain like bands-manager.up.railway.app
  const defaultDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('railway.app')
    ? window.location.hostname
    : 'bands-manager.up.railway.app';
  const [customDomain, setCustomDomain] = useState(defaultDomain);
  const [routePrefix, setRoutePrefix] = useState('unete');

  useEffect(() => {
    if (selectedConcert) {
      const defaultSlug = `${selectedConcert.ciudad}-${selectedConcert.sala}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
      setCustomSlug(defaultSlug);
    } else {
      setCustomSlug('');
    }
  }, [selectedConcertId]);

  // Build clean target URL
  const rawDomain = useCustomDomain 
    ? (customDomain.trim().startsWith('http') ? customDomain.trim() : `https://${customDomain.trim().replace(/\/$/, '')}`)
    : (typeof window !== 'undefined' ? window.location.origin : 'https://bands-manager.up.railway.app');

  const cleanPrefix = routePrefix.trim().replace(/^\/+|\/+$/g, '');
  const cleanSlugVal = customSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

  const pathFormatted = cleanSlugVal 
    ? (cleanPrefix ? `/${cleanPrefix}/${cleanSlugVal}` : `/${cleanSlugVal}`)
    : (cleanPrefix ? `/${cleanPrefix}` : '/unete');

  const qrConcertUrl = `${rawDomain}${pathFormatted}`;

  const copyLink = () => {
    navigator.clipboard.writeText(qrConcertUrl);
    alert("Enlace copiado al portapapeles.");
  };

  const [copiedQrUrl, setCopiedQrUrl] = useState(false);

  const handleCopyQrUrl = () => {
    navigator.clipboard.writeText(qrConcertUrl);
    setCopiedQrUrl(true);
    setTimeout(() => setCopiedQrUrl(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const concertTitle = selectedConcert ? `${selectedConcert.sala} (${selectedConcert.ciudad})` : 'Bakandeya';
    const text = `¡Únete a Bakandeya en ${concertTitle}! 🎶 Escanea o entra en el enlace para recibir sorpresas exclusivas y estar al día:\n\n${qrConcertUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Únete a Bakandeya',
          text: 'Escanea o entra para unirte a nuestra comunidad.',
          url: qrConcertUrl,
        });
      } catch (err) {
        console.log('Share canceled or not supported', err);
      }
    } else {
      handleCopyQrUrl();
    }
  };

  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const concertTitle = selectedConcert ? `${selectedConcert.sala} — ${selectedConcert.ciudad} (${selectedConcert.fecha})` : 'Bakandeya';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Código - ${concertTitle}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #fff; color: #111; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .card { width: 100%; max-width: 480px; margin: 0 auto; border: 6px solid #f59e0b; border-radius: 28px; padding: 40px 32px; box-shadow: 0 15px 40px rgba(0,0,0,0.12); background: #ffffff; }
            .header-logo { height: 95px; width: auto; max-width: 280px; margin: 0 auto 16px auto; display: block; object-fit: contain; }
            h1 { font-size: 22px; font-weight: 900; margin: 12px 0 8px 0; color: #111; text-transform: uppercase; letter-spacing: 0.5px; }
            p.desc { font-size: 14px; color: #475569; margin-bottom: 24px; font-weight: 500; line-height: 1.4; }
            .url { font-size: 12px; color: #475569; margin-top: 24px; word-break: break-all; font-family: monospace; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; font-weight: 600; }
            
            .qr-box { position: relative; display: inline-block; padding: 16px; background: #ffffff; border-radius: 20px; border: 4px solid #f59e0b; }
            .qr-center-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
            .badge-logo { width: 68px; height: 68px; background: #ffffff; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.18); padding: 4px; }
            .badge-logo img { width: 100%; height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="card">
            ${epkConfig?.logoUrl ? `<img src="${epkConfig.logoUrl}" class="header-logo" alt="Logo" />` : (epkConfig?.contactoBooking?.nombre || '').toLowerCase().includes('bakandeya') ? `<img src="/logo_bakandeya.jpg" class="header-logo" alt="Bakandeya" />` : ''}
            <h1>${concertTitle}</h1>
            <p class="desc">Escanea este código QR para unirte a la comunidad, recibir contenido exclusivo y no perder el contacto.</p>
            <div class="qr-box">
              <div id="print-qr-svg"></div>
              ${(epkConfig?.logoUrl || (epkConfig?.contactoBooking?.nombre || '').toLowerCase().includes('bakandeya')) ? `
              <div class="qr-center-overlay">
                <div class="badge-logo">
                  <img src="${epkConfig?.logoUrl || '/logo_bakandeya.jpg'}" alt="Logo" />
                </div>
              </div>` : ''}
            </div>
            <div class="url">${qrConcertUrl}</div>
          </div>
          <script>
            setTimeout(() => {
              const mainQrSvg = window.opener.document.querySelector('#qr-code-svg-container svg');
              if (mainQrSvg) {
                document.getElementById('print-qr-svg').appendChild(mainQrSvg.cloneNode(true));
              }
              window.print();
            }, 400);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-black text-white font-display flex items-center gap-3">
            <Heart className="w-8 h-8 text-amber-500" />
            Captura & Fidelización de Fans
          </h2>
          <p className="text-slate-400 font-mono text-sm mt-1">
            Captura datos de fans en directos o redes, cumple RGPD y mantén el contacto directo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={copyLink}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono rounded-xl border border-slate-700 flex items-center gap-2 transition cursor-pointer"
          >
            <Copy className="w-4 h-4" /> Enlace de Captura Corto
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold font-mono rounded-xl border border-slate-700 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Fan Manual
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold font-mono rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 hide-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'dashboard' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Heart className="w-4 h-4" /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('fans')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'fans' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Users className="w-4 h-4" /> Base de Datos ({fans.length})
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'qr' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <QrCode className="w-4 h-4" /> Generador de QR
        </button>
        <button
          onClick={() => setActiveTab('incentives')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'incentives' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Sparkles className="w-4 h-4" /> Regalos & Descargas
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Total Fans Registrados</p>
              <h3 className="text-5xl font-black text-white font-display">{fans.length}</h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Consentimiento RGPD</p>
              <h3 className="text-4xl font-black text-emerald-400 font-display flex items-center gap-2">
                <ShieldCheck className="w-8 h-8" />
                100%
              </h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Ciudades Activas</p>
              <h3 className="text-4xl font-black text-amber-400 font-display flex items-center gap-2">
                <MapPin className="w-8 h-8" />
                {new Set(fans.map(f => f.ciudad).filter(Boolean)).size}
              </h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crecimiento Evolutivo de Fans */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-88 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Crecimiento Evolutivo de Fans
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">Curva acumulativa de la comunidad Bakandeya</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  Total: {fans.length} fans
                </span>
              </div>
              
              <div className="flex-1 min-h-0">
                {evolutionaryGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionaryGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fanGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '12px', color: '#fff'}}
                        formatter={(val: any, name: any) => [
                          name === 'total' ? `${val} fans acumulados` : `${val} nuevos capturados`,
                          name === 'total' ? 'Comunidad Total' : 'Capturados en el mes'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#fanGrowthGrad)" 
                        name="total" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">No hay datos suficientes</div>
                )}
              </div>
            </div>
            
            {/* Canal de Origen (Fixed & Visual) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-88 flex flex-col">
              <div className="mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Canal de Origen de Fans</p>
                <p className="text-[11px] text-slate-500 font-mono">De dónde provienen los registros</p>
              </div>

              <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center gap-4">
                {originData.length > 0 ? (
                  <>
                    <div className="w-full sm:w-1/2 h-48 sm:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={originData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {originData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '12px', color: '#fff'}}
                            formatter={(val: any, name: any) => [`${val} fans (${Math.round((val / (fans.length || 1)) * 100)}%)`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Channel Legend List */}
                    <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-48 hide-scrollbar pr-1">
                      {originData.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800/80 text-xs font-mono">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-slate-200 font-bold truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-amber-400 font-bold">{item.value}</span>
                            <span className="text-slate-500 text-[10px]">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-500 text-xs font-mono">No hay datos suficientes</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fans' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          {/* Configurable City Tabs Bar */}
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                Filtrar por Ciudad (Pestañas Configurables Guardadas en BBDD)
              </span>
              {selectedCityFilter && (
                <button
                  onClick={() => setSelectedCityFilter('')}
                  className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
                >
                  Limpiar filtro ciudad
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCityFilter('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedCityFilter === ''
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                Todas ({fans.length})
              </button>

              {customCityChips.map(city => {
                const count = fans.filter(f => f.ciudad && f.ciudad.toLowerCase().includes(city.toLowerCase())).length;
                const isSelected = selectedCityFilter.toLowerCase() === city.toLowerCase();
                return (
                  <div
                    key={city}
                    onClick={() => setSelectedCityFilter(city)}
                    className={`group/city inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{city}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'
                    }`}>
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCityTab(city, e)}
                      className={`p-0.5 rounded-full hover:bg-rose-500/30 transition opacity-60 group-hover/city:opacity-100 ${
                        isSelected ? 'hover:text-rose-950 text-slate-950' : 'hover:text-rose-300 text-slate-400'
                      }`}
                      title={`Eliminar pestaña ${city}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {isAddingCity ? (
                <form onSubmit={handleAddCityTab} className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nueva ciudad..."
                    value={newCityInput}
                    onChange={e => setNewCityInput(e.target.value)}
                    className="bg-slate-950 border border-amber-500 rounded-xl px-2.5 py-1 text-xs text-white font-mono outline-none w-36"
                  />
                  <button
                    type="submit"
                    className="p-1 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition cursor-pointer"
                    title="Guardar ciudad"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCity(false); setNewCityInput(''); }}
                    className="p-1 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCity(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/30 border-dashed flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir ciudad</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o ciudad..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div className="relative w-full sm:w-64">
                <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={filterOrigen}
                  onChange={e => setFilterOrigen(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none appearance-none font-mono"
                >
                  <option value="">Todos los orígenes</option>
                  {uniqueConcertIds.map(c => (
                    <option key={c.id} value={c.id}>Concierto: {c.name}</option>
                  ))}
                  <option value="Otros">Redes Sociales / Amigos / Otros</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista en Tarjetas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tarjetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista en Detalles / Tabla"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Detalles</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'map' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista en Mapa por Ciudades"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Mapa</span>
                </button>
              </div>

              <span className="text-xs text-slate-400 font-mono shrink-0 hidden sm:inline">
                {filteredFans.length} resultados
              </span>
            </div>
          </div>

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFans.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-500 font-mono bg-slate-950/50 rounded-xl border border-slate-800">
                  No hay fans registrados que coincidan con los filtros aplicados.
                </div>
              ) : (
                filteredFans.map(fan => (
                  <div key={fan.id} className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all space-y-3 relative group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold uppercase text-sm">
                          {fan.nombre.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm truncate max-w-[160px]">{fan.nombre}</h4>
                          <p className="text-[11px] font-mono text-slate-400 truncate max-w-[160px]">{fan.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
                            onDeleteFan(fan.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Eliminar Fan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800/80">
                      <div className="bg-slate-900/80 p-2 rounded-lg">
                        <span className="text-slate-500 text-[9px] block uppercase">Ciudad</span>
                        <span className="text-slate-200 flex items-center gap-1 font-semibold">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{fan.ciudad || 'No especificada'}</span>
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg">
                        <span className="text-slate-500 text-[9px] block uppercase">Origen / Canal</span>
                        <span className="text-amber-400 truncate block font-semibold">{fan.comoConocio || fan.conciertoOrigenNombre || 'Directo'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <span>Registrado: {fan.fechaCaptura || 'Reciente'}</span>
                      {fan.consentimientoRGPD && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Check className="w-3 h-3" /> RGPD Ok
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {viewMode === 'map' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-3">
                  <MapIcon className="w-4 h-4" />
                  <span>Distribución Geográfica de la Comunidad de Fans por Ciudades</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(
                    filteredFans.reduce((acc, f) => {
                      const city = f.ciudad || 'Ciudad no indicada';
                      acc[city] = (acc[city] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                  .sort((a,b) => (b[1] as number) - (a[1] as number))
                  .map(([city, count]) => (
                    <div key={city} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-bold text-white truncate">{city}</span>
                      </div>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        {count} {count === 1 ? 'fan' : 'fans'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-amber-400 uppercase font-bold border-b border-slate-800 font-mono">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Correo Electrónico</th>
                  <th className="p-3">Ciudad</th>
                  <th className="p-3">Canal</th>
                  <th className="p-3">Concierto Asociado</th>
                  <th className="p-3 text-center">RGPD</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredFans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                      No hay fans registrados que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredFans.map(fan => (
                    <tr key={fan.id} className="hover:bg-slate-800/20 transition group">
                      <td className="p-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold uppercase text-[10px]">
                            {fan.nombre.charAt(0)}
                          </div>
                          {fan.nombre}
                        </div>
                      </td>
                      <td className="p-3 font-mono">{fan.email}</td>
                      <td className="p-3">
                        {fan.ciudad ? (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {fan.ciudad}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                        {fan.comoConocio || '-'}
                      </td>
                      <td className="p-3 text-[11px] text-emerald-400 font-mono">
                        {fan.conciertoOrigenNombre || '-'}
                      </td>
                      <td className="p-3 text-center">
                        {fan.consentimientoRGPD ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-500/10 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
                              onDeleteFan(fan.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:bg-rose-500 hover:text-white rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400" /> Generador de QR para Eventos
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Selecciona un concierto para personalizar la landing page. Imprime o muestra este QR en la mesa de merchan o proyéctalo.
                </p>
              </div>

              <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                <label className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider block">1. Dominio Base del Enlace</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setUseCustomDomain(true)}
                    className={`p-2.5 rounded-xl border text-left font-mono transition flex flex-col gap-1 ${
                      useCustomDomain
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>🌐 Dominio Web Oficial</span>
                    <span className="text-[10px] text-slate-400 font-normal">Para impresiones/carteles (ej. bands-manager.up.railway.app)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomDomain(false)}
                    className={`p-2.5 rounded-xl border text-left font-mono transition flex flex-col gap-1 ${
                      !useCustomDomain
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>🧪 Servidor Dev</span>
                    <span className="text-[10px] text-slate-400 font-normal">Para pruebas directas en este visor</span>
                  </button>
                </div>

                {useCustomDomain && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-mono text-slate-400">Web / Dominio del Proyecto:</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-800">https://</span>
                      <input
                        type="text"
                        value={customDomain}
                        onChange={e => setCustomDomain(e.target.value)}
                        placeholder="bands-manager.up.railway.app"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider">2. Vincular a Concierto (Opcional)</label>
                <select
                  value={selectedConcertId}
                  onChange={e => setSelectedConcertId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                >
                  <option value="">-- QR Genérico (Sin concierto asociado) --</option>
                  {concerts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fecha} — {c.sala} ({c.ciudad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider">3. Ruta Limpia y Slug (URL Amigable)</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 px-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500">/</span>
                    <input
                      type="text"
                      value={routePrefix}
                      onChange={e => setRoutePrefix(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      className="w-16 bg-transparent text-amber-400 text-xs font-mono py-3 font-bold outline-none"
                      placeholder="unete"
                    />
                    <span className="text-[11px] font-mono text-slate-500">/</span>
                  </div>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''))}
                    placeholder="ej. madrid-sala-siroco"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Genera direcciones legibles y atractivas como <span className="text-amber-400 font-bold">/unete/madrid-siroco</span> o <span className="text-amber-400 font-bold">/unete</span>.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 uppercase font-mono tracking-widest text-[10px]">URL Destino que tendrá el QR:</span>
                  <button
                    type="button"
                    onClick={handleCopyQrUrl}
                    className="text-[10px] text-amber-400 hover:underline font-mono"
                  >
                    {copiedQrUrl ? '¡Copiado!' : 'Copiar URL'}
                  </button>
                </div>
                <p className="font-mono text-amber-300 font-bold break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                  {qrConcertUrl}
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                  💡 <strong className="text-slate-300">¿Por qué aparecía la URL previa larga?</strong> La URL <code className="text-amber-400/80">ais-dev-...run.app</code> es la dirección técnica interna del contenedor de pruebas en la nube. Con la opción de <strong>Dominio Web Oficial</strong> activada, el QR impreso en tus carteles llevará tu dominio limpio (<strong className="text-slate-200">bands-manager.up.railway.app/unete</strong>).
                </p>
              </div>

              <a
                href={qrConcertUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold font-mono text-xs uppercase tracking-widest rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" /> Probar Vista de Captura de Fan
              </a>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center">
              <div id="qr-code-svg-container" className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-amber-500 inline-block relative">
                <QRCode value={qrConcertUrl} size={220} level="H" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {epkConfig?.logoUrl ? (
                    <div className="w-16 h-16 bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border-2 border-amber-500 shadow-xl p-0.5">
                      <img 
                        src={epkConfig.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain rounded-lg" 
                      />
                    </div>
                  ) : (epkConfig?.contactoBooking?.nombre || '').toLowerCase().includes('bakandeya') ? (
                    <div className="w-16 h-16 bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border-2 border-amber-500 shadow-xl p-0.5">
                      <img 
                        src="/logo_bakandeya_bueno_sin_fondo.png" 
                        alt="Logo Bakandeya" 
                        className="w-full h-full object-contain rounded-lg" 
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center border-2 border-slate-950 shadow-xl">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center space-y-1 mt-2">
                <h4 className="font-black text-white font-display text-lg uppercase tracking-wider">
                  {selectedConcert ? `${selectedConcert.sala}` : 'Únete a Bakandeya'}
                </h4>
                <p className="text-xs text-slate-400 font-mono">Escanea para no perder el contacto</p>
              </div>

              {/* Action Buttons for Print & Share */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-800 w-full">
                <button
                  type="button"
                  onClick={handlePrintQr}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleShareNative}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold font-mono text-xs uppercase tracking-wider rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-lg"
                >
                  <Share2 className="w-4 h-4" /> {copiedQrUrl ? '¡Copiado!' : 'Compartir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'incentives' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display uppercase tracking-widest">
              <Sparkles className="w-5 h-5 text-amber-400" /> Recompensas para Fans
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Personaliza el mensaje de agradecimiento y los premios que recibirá el fan al instante.
            </p>
          </div>

          {savedIncentive && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" /> ¡Recompensas actualizadas!
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest">Mensaje de Agradecimiento</label>
              <textarea
                rows={3}
                value={incentivo.mensajeAgradecimiento || ''}
                onChange={e => setIncentivo({ ...incentivo, mensajeAgradecimiento: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono leading-relaxed"
                placeholder="¡Gracias por formar parte!"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest">Enlace de Descarga MP3 (Inédito)</label>
                <input
                  type="text"
                  value={incentivo.enlaceDescarga || ''}
                  onChange={e => setIncentivo({ ...incentivo, enlaceDescarga: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs font-mono text-white outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest">Código Descuento Merch</label>
                <input
                  type="text"
                  value={incentivo.codigoDescuento || ''}
                  onChange={e => setIncentivo({ ...incentivo, codigoDescuento: e.target.value })}
                  placeholder="BAKANDEYA-FAN-10"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs font-mono text-white outline-none uppercase"
                />
              </div>
            </div>
            
            <button
              onClick={handleSaveIncentive}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black font-mono text-xs uppercase tracking-widest rounded-xl shadow-lg transition cursor-pointer"
            >
              Guardar Recompensas
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-white font-display uppercase tracking-widest border-b border-slate-800 pb-3">Añadir Fan Manual</h3>
            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Nombre *</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={e => setNewNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Ciudad</label>
                <input
                  type="text"
                  value={newCiudad}
                  onChange={e => setNewCiudad(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-mono text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition hover:bg-amber-400 cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FansPanel;
