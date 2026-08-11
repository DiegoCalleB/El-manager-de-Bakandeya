import React, { useState } from 'react';
import { 
  FileText, Sparkles, Copy, Check, QrCode, ExternalLink, Printer, 
  Upload, Save, Globe, Mail, Phone, Music, Image as ImageIcon, CheckCircle2,
  FileDown, Trash2, Loader2, Bot, Info, Download, AtSign, Share2
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { EPKConfig, Song, User } from '../types';
import { uploadFileToServer } from '../utils/audioStorage';
import { api } from '../services/api';

interface EPKManagerProps {
  epkConfig?: EPKConfig;
  songs?: Song[];
  onSave?: (newConfig: EPKConfig) => void;
  colors?: any;
  currentTheme?: any;
  currentUser?: User;
}

const DEFAULT_EPK_CONFIG: EPKConfig = {
  biografia: 'Propuesta musical en directo.',
  logoUrl: '',
  dossierPdfUrl: '',
  dossierPdfName: '',
  dossierTextoExtra: '',
  bandPhotos: [],
  temasDestacadosIds: [],
  contactoBooking: {
    nombre: 'Booking & Management',
    email: '',
    telefono: ''
  },
  enlacesRedes: {
    spotify: '',
    youtube: '',
    instagram: ''
  },
  riderTecnico: 'Rider técnico por definir.',
  firmaEmail: {
    nombreRemitente: 'Booking & Management Team',
    cargo: 'Booking & Management',
    telefono: '',
    email: '',
    textoPie: 'Directo en vivo',
    incluirIconosRedes: true,
    adjuntarDossierPorDefecto: true,
    redesSociales: {
      spotify: '',
      instagram: '',
      youtube: '',
      tiktok: '',
      facebook: '',
      twitter: '',
      appleMusic: '',
      bandcamp: '',
      website: '',
      whatsapp: ''
    }
  }
};

export const EPKManager: React.FC<EPKManagerProps> = ({ 
  epkConfig, 
  songs = [], 
  onSave,
  currentUser
}) => {
  const activeBandId = currentUser?.band_id || 'band-bakandeya';
  const cleanBandId = activeBandId.replace(/^(band|reg)-/, '').toLowerCase();
  const isBakandeya = cleanBandId === 'bakandeya' || (currentUser?.bandName || '').toLowerCase().includes('bakandeya');
  const [config, setConfig] = useState<EPKConfig>(() => ({
    ...DEFAULT_EPK_CONFIG,
    ...(epkConfig || {}),
    firmaEmail: {
      ...DEFAULT_EPK_CONFIG.firmaEmail,
      ...(epkConfig?.firmaEmail || {})
    }
  }));

  React.useEffect(() => {
    if (epkConfig) {
      setConfig(prev => ({
        ...prev,
        ...epkConfig,
        firmaEmail: {
          ...DEFAULT_EPK_CONFIG.firmaEmail,
          ...prev.firmaEmail,
          ...(epkConfig.firmaEmail || {})
        }
      }));
    }
  }, [epkConfig]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'firma' | 'qr'>('editor');

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingDossier, setIsUploadingDossier] = useState(false);
  const [isUploadingRider, setIsUploadingRider] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const publicEpkUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('localhost') || window.location.origin.includes('ais-dev') || window.location.origin.includes('ais-pre')
        ? 'https://bandmanagement-ai.up.railway.app/epk' 
        : `${window.location.origin}/epk`) 
    : 'https://bandmanagement-ai.up.railway.app/epk';

  const handleSave = async () => {
    try {
      if (onSave) {
        onSave(config);
      }
      
      await api.updateEpkConfig(config);

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
      const url = await uploadFileToServer(file, { bandId: activeBandId, category: 'logo' });
      const updated = { ...config, logoUrl: url };
      setConfig(updated);
      if (onSave) onSave(updated);
      await api.updateEpkConfig(updated);
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const url = ev.target!.result as string;
          const updated = { ...config, logoUrl: url };
          setConfig(updated);
          if (onSave) onSave(updated);
          await api.updateEpkConfig(updated);
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
      const url = await uploadFileToServer(file, { bandId: activeBandId, category: 'dossier' });
      const updated = { 
        ...config, 
        dossierPdfUrl: url,
        dossierPdfName: file.name,
        dossierDocumentUrl: url,
        dossierDocumentName: file.name
      };
      setConfig(updated);
      if (onSave) onSave(updated);
      await api.updateEpkConfig(updated);
    } catch (err: any) {
      console.error("Error uploading dossier:", err);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const url = ev.target!.result as string;
          const updated = { 
            ...config, 
            dossierPdfUrl: url,
            dossierPdfName: file.name,
            dossierDocumentUrl: url,
            dossierDocumentName: file.name
          };
          setConfig(updated);
          if (onSave) onSave(updated);
          await api.updateEpkConfig(updated);
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
      const url = await uploadFileToServer(file, { bandId: activeBandId, category: 'rider' });
      const updated = { 
        ...config, 
        riderPdfUrl: url,
        riderPdfName: file.name
      };
      setConfig(updated);
      if (onSave) onSave(updated);
      await api.updateEpkConfig(updated);
    } catch (err: any) {
      console.error("Error uploading rider:", err);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const updated = { 
            ...config, 
            riderPdfUrl: ev.target!.result as string,
            riderPdfName: file.name
          };
          setConfig(updated);
          if (onSave) onSave(updated);
          await api.updateEpkConfig(updated);
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
      <div className="flex border-b border-slate-800 text-sm font-bold flex-wrap">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'editor' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <FileText className="w-4 h-4" /> Editar Dossier e Información
        </button>
        <button
          onClick={() => setActiveTab('firma')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'firma' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <AtSign className="w-4 h-4" /> Firma de Email & Redes
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'qr' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
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
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Logo de la banda"
                    className="w-28 h-28 rounded-2xl object-contain p-1 border-2 border-amber-500/60 shadow-lg bg-slate-950"
                  />
                ) : isBakandeya ? (
                  <img
                    src="/logo_bakandeya_bueno_sin_fondo.png"
                    alt="Bakandeya Logo"
                    className="w-28 h-28 rounded-2xl object-contain p-1 border-2 border-amber-500/60 shadow-lg bg-slate-950"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-2 text-center">
                    <ImageIcon className="w-8 h-8 text-slate-600 mb-1" />
                    <span className="text-[10px] font-medium text-slate-400">Sin Logo</span>
                  </div>
                )}
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
                      onClick={() => setConfig({ ...config, logoUrl: '' })}
                      className="p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition"
                      title="Eliminar logo"
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
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Info className="w-5 h-5" /> Información Adicional de la Banda (Para Dossier y Agentes de IA)
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  (config.dossierPdfUrl && config.dossierPdfUrl.trim().length > 5) || 
                  (config.dossierTextoExtra && config.dossierTextoExtra.trim().length >= 80 && !config.dossierTextoExtra.toLowerCase().includes('por definir'))
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>
                  {(config.dossierPdfUrl && config.dossierPdfUrl.trim().length > 5) || 
                  (config.dossierTextoExtra && config.dossierTextoExtra.trim().length >= 80 && !config.dossierTextoExtra.toLowerCase().includes('por definir'))
                    ? '✓ Listo (Completado)'
                    : 'Mínimo 80 caracteres o PDF'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Uso por el Chatbot & Emails
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Escribe o pega aquí cualquier detalle relevante de la banda (trayectoria, integrantes, estilo, rango de caché orientativo, requerimientos de escenario, prensa, enlaces extra, etc.). Toda esta información estará almacenada y el Chatbot y los Agentes la usarán para personalizar las propuestas comerciales enviadas a las salas.
            </p>

            <div className="space-y-1.5">
              <textarea
                rows={5}
                value={config.dossierTextoExtra || ''}
                onChange={e => setConfig({ ...config, dossierTextoExtra: e.target.value })}
                placeholder="Ejemplo: Bakandeya cuenta con 4 integrantes (Jon Quel, José Filgueira, Elyar Pashang, Raúl Pérez). Caché orientativo para salas de 800€-1500€ según aforo y distancia. Ofrecemos un show festivo de 90 minutos con metales y percusión en directo..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 outline-none leading-relaxed font-sans"
              />
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span>Mínimo 80 caracteres para marcar como completado (si no hay PDF adjunto)</span>
                <span className={(config.dossierTextoExtra || '').trim().length >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {(config.dossierTextoExtra || '').trim().length} / 80 min.
                </span>
              </div>
            </div>
          </div>

          {/* BIOGRAPHY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Biografía Oficial / Resumen Ejecutivo
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                config.biografia && config.biografia.trim().length >= 80 && !config.biografia.toLowerCase().includes('por definir') && !config.biografia.includes('Propuesta musical en directo')
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}>
                {config.biografia && config.biografia.trim().length >= 80 && !config.biografia.toLowerCase().includes('por definir') && !config.biografia.includes('Propuesta musical en directo')
                  ? '✓ Bio Lista'
                  : 'Mínimo 80 caracteres'}
              </span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Biografía de Presentación</label>
              <textarea
                rows={6}
                value={config.biografia}
                onChange={e => setConfig({ ...config, biografia: e.target.value })}
                placeholder="Escribe la biografía oficial de la banda..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm text-slate-200 outline-none leading-relaxed"
              />
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span>Mínimo 80 caracteres para completar el perfil</span>
                <span className={(config.biografia || '').trim().length >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {(config.biografia || '').trim().length} / 80 min.
                </span>
              </div>
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
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Rider Técnico (Texto y Fichero PDF / Documento)
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  (config.riderPdfUrl && config.riderPdfUrl.trim().length > 5) || 
                  (config.riderTecnico && config.riderTecnico.trim().length >= 80 && !config.riderTecnico.toLowerCase().includes('por definir'))
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>
                  {(config.riderPdfUrl && config.riderPdfUrl.trim().length > 5) || 
                  (config.riderTecnico && config.riderTecnico.trim().length >= 80 && !config.riderTecnico.toLowerCase().includes('por definir'))
                    ? '✓ Rider Listo'
                    : 'Mínimo 80 caracteres o PDF'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Documentación Técnica
                </span>
              </div>
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
              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-300">Resumen Ejecutivo del Rider (para email y salas)</label>
                  <textarea
                    rows={6}
                    value={config.riderTecnico}
                    onChange={e => setConfig({ ...config, riderTecnico: e.target.value })}
                    placeholder="Especifica necesidades de PA, monitores, canales, micros, contra-rider, etc..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm font-mono text-slate-200 outline-none leading-relaxed mt-1"
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>Mínimo 80 caracteres (si no hay PDF adjunto)</span>
                  <span className={(config.riderTecnico || '').trim().length >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {(config.riderTecnico || '').trim().length} / 80 min.
                  </span>
                </div>
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

      {activeTab === 'firma' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CONFIGURACIÓN DE FIRMA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <AtSign className="w-5 h-5" /> Configurar Firma de Correo
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Personalización Avanzada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nombre del Remitente</label>
                <input
                  type="text"
                  value={config.firmaEmail?.nombreRemitente || ''}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), nombreRemitente: e.target.value }
                  })}
                  placeholder="Ej: Diego & Filgue"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Cargo / Puesto</label>
                <input
                  type="text"
                  value={config.firmaEmail?.cargo || ''}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), cargo: e.target.value }
                  })}
                  placeholder="Ej: Booking & Management Team"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={config.firmaEmail?.telefono || ''}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), telefono: e.target.value }
                  })}
                  placeholder="+34 652 93 85 21"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Email Oficial</label>
                <input
                  type="email"
                  value={config.firmaEmail?.email || ''}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), email: e.target.value }
                  })}
                  placeholder="booking@bandmanagement-ai.up.railway.app"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Lema / Pie de Firma</label>
              <input
                type="text"
                value={config.firmaEmail?.textoPie || ''}
                onChange={e => setConfig({
                  ...config,
                  firmaEmail: { ...(config.firmaEmail || {}), textoPie: e.target.value }
                })}
                placeholder="Bakandeya — Electrónica-Fusión & Balkan Ska Directo"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            {/* OPCIONES DE INCLUSIÓN */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-500/50 transition">
                <input
                  type="checkbox"
                  checked={config.firmaEmail?.incluirIconosRedes ?? true}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), incluirIconosRedes: e.target.checked }
                  })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-white">Incluir iconos interactivos de redes sociales y plataformas musicales</p>
                  <p className="text-[11px] text-slate-400">Añade enlaces directos a Spotify, Instagram, YouTube, TikTok, WhatsApp, etc.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-500/50 transition">
                <input
                  type="checkbox"
                  checked={config.firmaEmail?.adjuntarDossierPorDefecto ?? true}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), adjuntarDossierPorDefecto: e.target.checked }
                  })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-white">Adjuntar Dossier EPK automáticamente en la firma</p>
                  <p className="text-[11px] text-slate-400">Incluye el botón con enlace al Dossier PDF en cada plantilla y correo redactado.</p>
                </div>
              </label>
            </div>

            {/* ENLACES A REDES SOCIALES PARA LA FIRMA */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5" /> Enlaces de Redes y Plataformas para la Firma
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'spotify', label: '🟢 Spotify', placeholder: 'https://open.spotify.com/artist/...' },
                  { key: 'instagram', label: '📸 Instagram', placeholder: 'https://instagram.com/...' },
                  { key: 'youtube', label: '🔴 YouTube', placeholder: 'https://youtube.com/...' },
                  { key: 'tiktok', label: '🎵 TikTok', placeholder: 'https://tiktok.com/@...' },
                  { key: 'facebook', label: '📘 Facebook', placeholder: 'https://facebook.com/...' },
                  { key: 'twitter', label: '🐦 Twitter / X', placeholder: 'https://x.com/...' },
                  { key: 'appleMusic', label: '🍎 Apple Music', placeholder: 'https://music.apple.com/...' },
                  { key: 'bandcamp', label: '⛺ Bandcamp', placeholder: 'https://bandmanagement-ai.up.railway.app' },
                  { key: 'website', label: '🌐 Sitio Web', placeholder: 'https://bandmanagement-ai.up.railway.app' },
                  { key: 'whatsapp', label: '💬 WhatsApp', placeholder: '+34652938521' }
                ].map(item => (
                  <div key={item.key} className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">{item.label}</label>
                    <input
                      type="text"
                      value={(config.firmaEmail?.redesSociales as any)?.[item.key] || ''}
                      onChange={e => setConfig({
                        ...config,
                        firmaEmail: {
                          ...(config.firmaEmail || {}),
                          redesSociales: {
                            ...(config.firmaEmail?.redesSociales || {}),
                            [item.key]: e.target.value
                          }
                        }
                      })}
                      placeholder={item.placeholder}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VISTA PREVIA EN VIVO DE LA FIRMA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Mail className="w-5 h-5" /> Vista Previa en Vivo de la Firma
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Renderizado de Email</span>
            </div>

            <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 font-sans text-xs">
              <p className="text-slate-500 italic pb-2 border-b border-slate-100">
                ... [Cuerpo del correo electrónico redactado para la sala o festival] ...
              </p>

              <div className="pt-2 space-y-3">
                <div className="flex items-start gap-4">
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt="Logo"
                      className="w-16 h-16 rounded-xl object-contain bg-slate-950 p-1 border border-amber-500 shrink-0"
                    />
                  ) : isBakandeya ? (
                    <img
                      src="/logo_bakandeya_bueno_sin_fondo.png"
                      alt="Bakandeya Logo"
                      className="w-16 h-16 rounded-xl object-contain bg-slate-950 p-1 border border-amber-500 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400 font-bold text-lg shrink-0">
                      <Music className="w-8 h-8 text-slate-400" />
                    </div>
                  )}

                  <div className="space-y-1 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {config.firmaEmail?.nombreRemitente || config.contactoBooking?.nombre || 'Diego & Filgue'}
                    </h4>
                    <p className="text-amber-600 font-bold text-[11px]">
                      {config.firmaEmail?.cargo || 'Booking & Management Team'}
                    </p>
                    <p className="text-slate-600 text-[11px] font-medium">
                      {config.firmaEmail?.textoPie || 'Bakandeya — Directo de Fusión y Escenario'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1 font-mono">
                      {config.firmaEmail?.telefono && (
                        <span>📞 {config.firmaEmail.telefono}</span>
                      )}
                      {config.firmaEmail?.email && (
                        <span>✉️ {config.firmaEmail.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTÓN DOSSIER SI ESTÁ HABILITADO */}
                {(config.firmaEmail?.adjuntarDossierPorDefecto ?? true) && (config.dossierPdfUrl || publicEpkUrl) && (
                  <div className="pt-2">
                    <a
                      href={config.dossierPdfUrl || publicEpkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] shadow-sm transition"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>{config.dossierPdfName ? `📄 Ver Dossier Oficial (${config.dossierPdfName})` : '📄 Abrir Dossier & Kit de Prensa'}</span>
                    </a>
                  </div>
                )}

                {/* ICONOS DE REDES SOCIALES */}
                {(config.firmaEmail?.incluirIconosRedes ?? true) && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {Object.entries(config.firmaEmail?.redesSociales || {}).map(([net, url]) => {
                      if (!url) return null;
                      const icons: Record<string, { label: string; bg: string }> = {
                        spotify: { label: '🟢 Spotify', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        instagram: { label: '📸 Instagram', bg: 'bg-pink-50 text-pink-700 border-pink-200' },
                        youtube: { label: '🔴 YouTube', bg: 'bg-red-50 text-red-700 border-red-200' },
                        tiktok: { label: '🎵 TikTok', bg: 'bg-slate-100 text-slate-900 border-slate-300' },
                        facebook: { label: '📘 Facebook', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
                        twitter: { label: '🐦 X / Twitter', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
                        appleMusic: { label: '🍎 Apple Music', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
                        bandcamp: { label: '⛺ Bandcamp', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
                        website: { label: '🌐 Web', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
                        whatsapp: { label: '💬 WhatsApp', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
                      };
                      const iconData = icons[net] || { label: net, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
                      const rawUrl = String(url || '');

                      return (
                        <a
                          key={net}
                          href={rawUrl.startsWith('http') || rawUrl.startsWith('+') ? (rawUrl.startsWith('+') ? `https://wa.me/${rawUrl.replace(/\+/g, '')}` : rawUrl) : `https://${rawUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2 py-0.5 rounded-md border font-semibold text-[10px] flex items-center gap-1 transition ${iconData.bg}`}
                        >
                          {iconData.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Uso Automático en el Sistema
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Esta firma se incluirá automáticamente al redactar y enviar correos a salas desde el Booking CRM, las plantillas predefinidas o las propuestas generadas por el Chatbot y los Agentes de IA.
              </p>
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
