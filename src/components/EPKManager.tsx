import React, { useState } from 'react';
import { 
  FileText, Sparkles, Copy, Check, QrCode, ExternalLink, Printer, 
  Upload, Save, Globe, Mail, Phone, Music, Image as ImageIcon, CheckCircle2 
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { EPKConfig, Song } from '../types';

interface EPKManagerProps {
  epkConfig?: EPKConfig;
  songs?: Song[];
  onSave?: (newConfig: EPKConfig) => void;
  colors?: any;
  currentTheme?: any;
}

const DEFAULT_EPK_CONFIG: EPKConfig = {
  biografia: 'Bakandeya es un grupo musical de fusión y ska-rock con energía en directo...',
  logoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
  bandPhotos: [],
  temasDestacadosIds: ['song-1', 'song-2'],
  contactoBooking: {
    nombre: 'Diego / Filgue (Mánagers)',
    email: 'booking@bakandeya.es',
    telefono: '+34 600 000 000'
  },
  enlacesRedes: {
    spotify: 'https://open.spotify.com',
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com'
  },
  riderTecnico: 'PA adecuada al aforo, 4 envíos de monitor, microfonía estándar...'
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

  const publicEpkUrl = typeof window !== 'undefined' ? `${window.location.origin}/epk` : '/epk';

  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Kit de Prensa Automático
          </div>
          <h2 className="text-2xl font-black text-white">EPK / Dossier Promocional</h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Genera automáticamente un dossier público listo para mandar a salas, festivales y medios.
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

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>¡Configuración del EPK actualizada con éxito!</span>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-800 text-sm font-bold">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition ${activeTab === 'editor' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <FileText className="w-4 h-4" /> Editar Datos del EPK
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
          {/* BIOGRAPHY & BAND INFO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5" /> Biografía de la Banda
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Biografía Oficial / Presentación</label>
              <textarea
                rows={6}
                value={config.biografia}
                onChange={e => setConfig({ ...config, biografia: e.target.value })}
                placeholder="Escribe la biografía de Bakandeya..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm text-slate-200 outline-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-300">URL del Logo Oficial</label>
              <input
                type="text"
                value={config.logoUrl}
                onChange={e => setConfig({ ...config, logoUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none"
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
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5" /> Rider Técnico Básico Resumido
            </h3>
            <textarea
              rows={5}
              value={config.riderTecnico}
              onChange={e => setConfig({ ...config, riderTecnico: e.target.value })}
              placeholder="Especifica necesidades de PA, monitores, canales, micros..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm font-mono text-slate-200 outline-none leading-relaxed"
            />
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
