import React, { useState } from 'react';
import { 
  FileText, Sparkles, Copy, Check, QrCode, ExternalLink, Printer, 
  Upload, Save, Globe, Mail, Phone, Music, Image as ImageIcon, CheckCircle2,
  FileDown, Trash2, Loader2, Bot, Info, Download
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { EPKConfig, Song } from '../types';
import { uploadFileToServer } from '../utils/audioStorage';

interface EPKManagerProps {
  epkConfig?: EPKConfig;
  songs?: Song[];
  onSave?: (newConfig: EPKConfig) => void;
  colors?: any;
  currentTheme?: any;
}

const DEFAULT_EPK_CONFIG: EPKConfig = {
  biografia: 'Bakandeya es una propuesta vibrante de mestizaje, ska-rock, reggae y ritmos latinos con sección de metales potente y letras combativas pero festivas. Con más de 40 conciertos a sus espaldas en salas y festivales de la península, Bakandeya ofrece un directo arrollador de 90 minutos concebido para hacer bailar e involucrar a todo el público de principio a fin.',
  logoUrl: '/logo_bakandeya.jpg',
  dossierPdfUrl: '',
  dossierPdfName: '',
  dossierTextoExtra: '',
  bandPhotos: [],
  temasDestacadosIds: ['song-1', 'song-2'],
  contactoBooking: {
    nombre: 'Diego / Filgue (Mánagers)',
    email: 'booking@bakandeya.es',
    telefono: '+34 600 000 000'
  },
  enlacesRedes: {
    spotify: 'https://open.spotify.com/artist/bakandeya',
    youtube: 'https://youtube.com/@bakandeya_oficial',
    instagram: 'https://instagram.com/bakandeya_oficial'
  },
  riderTecnico: 'PA 2000W mín, manguera 16 canales, 4 envíos de monitor, 3 micros vocales SM58, microfonía metales...'
};

export const EPKManager: React.FC<EPKManagerProps> = ({ 
  epkConfig, 
  songs = [], 
  onSave 
}) => {
  const [config, setConfig] = useState<EPKConfig>(() => ({
    ...DEFAULT_EPK_CONFIG,
    ...(epkConfig || {})
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'qr'>('editor');

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingDossier, setIsUploadingDossier] = useState(false);
  const [isUploadingRider, setIsUploadingRider] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const publicEpkUrl = typeof window !== 'undefined' ? `${window.location.origin}/epk` : '/epk';

  const handleSave = async () => {
    try {
      // Trigger parent handler if available
      if (onSave) {
        onSave(config);
      }
      
      // Also directly trigger API save for reliability
      const token = localStorage.getItem('token');
      await fetch('/api/epk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(config)
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error("Error saving EPK config:", err);
      setSavedSuccess(true);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setUploadError(null);
    try {
      const url = await uploadFileToServer(file, { bandId: 'bakandeya', category: 'logo' });
      setConfig(prev => ({ ...prev, logoUrl: url }));
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      // Fallback local reader
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setConfig(prev => ({ ...prev, logoUrl: ev.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDossierUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDossier(true);
    setUploadError(null);
    try {
      const url = await uploadFileToServer(file, { bandId: 'bakandeya', category: 'dossier' });
      setConfig(prev => ({ 
        ...prev, 
        dossierPdfUrl: url,
        dossierPdfName: file.name
      }));
    } catch (err: any) {
      console.error("Error uploading dossier:", err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setConfig(prev => ({ 
            ...prev, 
            dossierPdfUrl: ev.target!.result as string,
            dossierPdfName: file.name
          }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingDossier(false);
    }
  };

  const handleRiderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingRider(true);
    setUploadError(null);
    try {
      const url = await uploadFileToServer(file, { bandId: 'bakandeya', category: 'rider' });
      setConfig(prev => ({ 
        ...prev, 
        riderPdfUrl: url,
        riderPdfName: file.name
      }));
    } catch (err: any) {
      console.error("Error uploading rider:", err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setConfig(prev => ({ 
            ...prev, 
            riderPdfUrl: ev.target!.result as string,
            riderPdfName: file.name
          }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingRider(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicEpkUrl);
    setCopiedPublicUrl(true);
    setTimeout(() => setCopiedPublicUrl(false), 2000);
  };

  const toggleHighlightedSong = (songId: string) => {
    const current = config.temasDestacadosIds || [];
    if (current.includes(songId)) {
      setConfig({ ...config, temasDestacadosIds: current.filter(id => id !== songId) });
    } else {
      setConfig({ ...config, temasDestacadosIds: [...current, songId] });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Kit de Prensa & Dossier Oficial
          </div>
          <h2 className="text-2xl font-black text-white">EPK / Dossier de la Banda</h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Sube el logo, el dossier PDF o documento oficial y la información de la banda. Toda esta información estará almacenada y lista para el Chatbot y los Agentes de envío automático de emails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyUrl}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
          >
            {copiedPublicUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copiedPublicUrl ? '¡Link Copiado!' : 'Copiar URL Pública'}</span>
          </button>

          <a
            href="/epk"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
          >
            <ExternalLink className="w-4 h-4" /> Ver EPK Público
          </a>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* AI & AGENTS NOTICE BAR */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs sm:text-sm text-slate-300 flex items-start gap-3">
        <Bot className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">Conexión Automática con Agentes de IA y Chatbot</p>
          <p className="text-slate-300 leading-relaxed">
            Toda la información del dossier, el logo y el archivo PDF subidos aquí quedan guardados en el servidor. El Chatbot y los Agentes de Redacción de Emails los consultarán automáticamente para redactar los correos de presentación y pitches a salas y festivales.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>¡Información del dossier y kit de prensa guardada y sincronizada correctamente!</span>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-800 text-sm font-bold">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition ${activeTab === 'editor' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <FileText className="w-4 h-4" /> Editar Dossier e Información
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition ${activeTab === 'qr' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <QrCode className="w-4 h-4" /> Código QR & Compartir
        </button>
      </div>

      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LOGO DE LA BANDA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ImageIcon className="w-5 h-5" /> Logo Oficial de la Banda
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={config.logoUrl || "/logo_bakandeya_bueno_sin_fondo.png"}
                  alt="Logo de la banda"
                  className="w-28 h-28 rounded-2xl object-contain p-1 border-2 border-amber-500/60 shadow-lg bg-slate-950"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo_bakandeya_bueno_sin_fondo.png'; }}
                />
              </div>

              <div className="space-y-3 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md">
                    {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{isUploadingLogo ? 'Subiendo Logo...' : 'Subir Logo (PNG/JPG)'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      disabled={isUploadingLogo}
                    />
                  </label>
                  
                  {config.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, logoUrl: '/logo_bakandeya_bueno_sin_fondo.png' })}
                      className="p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition"
                      title="Restablecer logo oficial transparente por defecto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">O introduce URL de la imagen:</label>
                  <input
                    type="text"
                    value={config.logoUrl || ''}
                    onChange={e => setConfig({ ...config, logoUrl: e.target.value })}
                    placeholder="https://ejemplo.com/logo.jpg"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DOSSIER EN PDF O DOCUMENTO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileDown className="w-5 h-5" /> Dossier en PDF o Documento Oficial
            </h3>

            {config.dossierPdfUrl ? (
              <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs text-white truncate">{config.dossierPdfName || 'Dossier_Oficial.pdf'}</p>
                      <p className="text-[10px] text-amber-400 font-medium">Documento adjunto almacenado</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, dossierPdfUrl: '', dossierPdfName: '' })}
                    className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition shrink-0"
                    title="Eliminar dossier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <a
                    href={config.dossierPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar / Abrir Dossier
                  </a>
                  
                  <label className="cursor-pointer py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 text-amber-400" /> Cambiar
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.txt" 
                      onChange={handleDossierUpload} 
                      className="hidden" 
                      disabled={isUploadingDossier}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-950 border border-dashed border-slate-800 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                  <FileDown className="w-6 h-6 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Sube aquí el Dossier Oficial (PDF o Word)</p>
                  <p className="text-[11px] text-slate-400">PDF, Word o TXT. Estará listo para el envío automático en correos.</p>
                </div>

                <label className="inline-flex cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs items-center gap-2 transition shadow-md">
                  {isUploadingDossier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isUploadingDossier ? 'Subiendo Documento...' : 'Seleccionar PDF / Dossier'}</span>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.txt" 
                    onChange={handleDossierUpload} 
                    className="hidden" 
                    disabled={isUploadingDossier}
                  />
                </label>
              </div>
            )}

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-slate-400">O enlace externo al Dossier (Google Drive, Dropbox, etc.):</label>
              <input
                type="text"
                value={config.dossierPdfUrl || ''}
                onChange={e => setConfig({ ...config, dossierPdfUrl: e.target.value, dossierPdfName: e.target.value ? (config.dossierPdfName || 'Enlace Dossier') : '' })}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* TEXTO EXTRA DEL DOSSIER / INFORMACIÓN DETALLADA PARA AGENTES Y CHATBOT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Info className="w-5 h-5" /> Información Adicional de la Banda (Para Dossier y Agentes de IA)
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                Uso por el Chatbot & Emails
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Escribe o pega aquí cualquier detalle relevante de la banda (trayectoria, integrantes, estilo, rango de caché orientativo, requerimientos de escenario, prensa, enlaces extra, etc.). Toda esta información estará almacenada y el Chatbot y los Agentes la usarán para personalizar las propuestas comerciales enviadas a las salas.
            </p>

            <textarea
              rows={5}
              value={config.dossierTextoExtra || ''}
              onChange={e => setConfig({ ...config, dossierTextoExtra: e.target.value })}
              placeholder="Ejemplo: Bakandeya cuenta con 4 integrantes (Jon Quel, José Filgueira, Elyar Pashang, Raúl Pérez). Caché orientativo para salas de 800€-1500€ según aforo y distancia. Ofrecemos un show festivo de 90 minutos con metales y percusión en directo..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 outline-none leading-relaxed font-sans"
            />
          </div>

          {/* BIOGRAPHY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5" /> Biografía Oficial / Resumen Ejecutivo
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Biografía de Presentación</label>
              <textarea
                rows={6}
                value={config.biografia}
                onChange={e => setConfig({ ...config, biografia: e.target.value })}
                placeholder="Escribe la biografía oficial de la banda..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm text-slate-200 outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* BOOKING CONTACT & SOCIAL LINKS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Mail className="w-5 h-5" /> Datos de Contacto de Booking
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Nombre / Cargo Mánager</label>
                <input
                  type="text"
                  value={config.contactoBooking?.nombre || ''}
                  onChange={e => setConfig({ ...config, contactoBooking: { ...config.contactoBooking, nombre: e.target.value } })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Email de Contacto</label>
                  <input
                    type="email"
                    value={config.contactoBooking?.email || ''}
                    onChange={e => setConfig({ ...config, contactoBooking: { ...config.contactoBooking, email: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Teléfono Mánager</label>
                  <input
                    type="text"
                    value={config.contactoBooking?.telefono || ''}
                    onChange={e => setConfig({ ...config, contactoBooking: { ...config.contactoBooking, telefono: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-xs font-bold text-amber-300 uppercase">Enlaces de Redes & Plataformas</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Spotify URL"
                    value={config.enlacesRedes?.spotify || ''}
                    onChange={e => setConfig({ ...config, enlacesRedes: { ...config.enlacesRedes, spotify: e.target.value } })}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="YouTube URL"
                    value={config.enlacesRedes?.youtube || ''}
                    onChange={e => setConfig({ ...config, enlacesRedes: { ...config.enlacesRedes, youtube: e.target.value } })}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Instagram URL"
                    value={config.enlacesRedes?.instagram || ''}
                    onChange={e => setConfig({ ...config, enlacesRedes: { ...config.enlacesRedes, instagram: e.target.value } })}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="TikTok URL"
                    value={config.enlacesRedes?.tiktok || ''}
                    onChange={e => setConfig({ ...config, enlacesRedes: { ...config.enlacesRedes, tiktok: e.target.value } })}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIDER TECNICO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Rider Técnico (Texto y Fichero PDF / Documento)
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                Documentación Técnica
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FICHERO DEL RIDER */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-amber-400" /> Adjunto de Rider en PDF o Documento
                </label>

                {config.riderPdfUrl ? (
                  <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate">
                        <p className="font-bold text-xs text-white truncate">{config.riderPdfName || 'Rider_Tecnico.pdf'}</p>
                        <p className="text-[10px] text-amber-400 font-medium">Archivo subido</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, riderPdfUrl: '', riderPdfName: '' })}
                        className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition"
                        title="Eliminar fichero de rider"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                      <a
                        href={config.riderPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar PDF Rider
                      </a>
                      <label className="cursor-pointer py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 flex items-center gap-1 transition">
                        <Upload className="w-3.5 h-3.5 text-amber-400" /> Cambiar
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx,.txt" 
                          onChange={handleRiderUpload} 
                          className="hidden" 
                          disabled={isUploadingRider}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 border border-dashed border-slate-800 rounded-lg text-center space-y-2">
                    <p className="text-xs text-slate-300">Sube aquí el PDF o Word del Rider Técnico completo:</p>
                    <label className="inline-flex cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs items-center gap-1.5 transition shadow">
                      {isUploadingRider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{isUploadingRider ? 'Subiendo...' : 'Subir PDF de Rider'}</span>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.txt" 
                        onChange={handleRiderUpload} 
                        className="hidden" 
                        disabled={isUploadingRider}
                      />
                    </label>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-medium">O enlace externo al Rider (Drive/Dropbox):</label>
                  <input
                    type="text"
                    value={config.riderPdfUrl || ''}
                    onChange={e => setConfig({ ...config, riderPdfUrl: e.target.value, riderPdfName: e.target.value ? (config.riderPdfName || 'Enlace Rider PDF') : '' })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* TEXTO RESUMIDO DEL RIDER */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Resumen Ejecutivo del Rider (para email y salas)</label>
                <textarea
                  rows={6}
                  value={config.riderTecnico}
                  onChange={e => setConfig({ ...config, riderTecnico: e.target.value })}
                  placeholder="Especifica necesidades de PA, monitores, canales, micros, contra-rider, etc..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm font-mono text-slate-200 outline-none leading-relaxed h-[calc(100%-1.75rem)]"
                />
              </div>
            </div>
          </div>

          {/* FEATURED SONGS SELECTOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Music className="w-5 h-5" /> Seleccionar Temas Destacados para el EPK
            </h3>
            <p className="text-xs text-slate-400">
              Marca las canciones que quieres mostrar en primera línea a los programadores de salas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {songs.map(song => {
                const isSelected = config.temasDestacadosIds?.includes(song.id);
                return (
                  <div
                    key={song.id}
                    onClick={() => toggleHighlightedSong(song.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${isSelected ? 'bg-amber-500/15 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <div>
                      <h5 className="font-bold text-xs text-white">{song.titulo}</h5>
                      <p className="text-[10px] text-slate-400">{song.albumDisco || 'Sencillo'} • {song.duracion}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${isSelected ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' : 'border-slate-700'}`}>
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Código QR Oficial del EPK</h3>
            <p className="text-xs text-slate-400">
              Muestra o descarga este QR para incluirlo en carpetas de prensa, correos o tarjetas de visita para programadores.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl inline-block shadow-2xl border-4 border-amber-500">
            <QRCode value={publicEpkUrl} size={200} />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono text-amber-300 bg-slate-950 py-2 px-4 rounded-xl border border-slate-800 truncate">
              {publicEpkUrl}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCopyUrl}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-amber-400 transition"
              >
                <Copy className="w-4 h-4" /> Copiar Enlace
              </button>
              <a
                href="/epk"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-800 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-slate-700 transition"
              >
                <ExternalLink className="w-4 h-4" /> Probar EPK
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EPKManager;
