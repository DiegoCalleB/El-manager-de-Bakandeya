import React, { useState, useEffect } from 'react';
import { 
  Download, Share2, Music, ExternalLink, FileText, Sparkles, 
  Copy, Check, Printer, Mail, Phone, Calendar, MapPin, Play, Pause,
  Instagram, Youtube, Disc
} from 'lucide-react';
import { EPKConfig, Song, Concert } from '../types';

interface PublicEPKProps {
  initialData?: {
    epkConfig: EPKConfig;
    highlightedSongs: Song[];
    upcomingConcerts: Concert[];
  };
}

export const PublicEPK: React.FC<PublicEPKProps> = ({ initialData }) => {
  const [epkData, setEpkData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [copiedLink, setCopiedLink] = useState(false);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) {
      fetch('/api/public/epk')
        .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json().catch(() => null) : null)
        .then(data => {
          if (data) setEpkData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching public EPK:", err);
          setLoading(false);
        });
    }
  }, [initialData]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 font-medium">Cargando Kit de Prensa de Bakandeya...</p>
      </div>
    );
  }

  const config: EPKConfig = epkData?.epkConfig || {
    biografia: "Bakandeya es una propuesta vibrante de mestizaje, ska-rock, reggae y ritmos latinos...",
    logoUrl: "/logo_bakandeya.jpg",
    bandPhotos: ["/logo_bakandeya.jpg"],
    riderTecnico: "PA 2000W mín, 16 canales, 3 micrófonos vocales, microfonía metales...",
    enlacesRedes: {},
    contactoBooking: { nombre: "Diego", email: "booking@bakandeya.es", telefono: "+34 612 345 678" },
    temasDestacadosIds: []
  };

  const songs: Song[] = epkData?.highlightedSongs || [];
  const concerts: Concert[] = epkData?.upcomingConcerts || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 print:bg-white print:text-black">
      {/* Top Floating Action Bar (Hidden on Print) */}
      <div className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 z-50 py-3 px-4 flex items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <img src={config.logoUrl || "/logo_bakandeya.jpg"} alt="Logo Bakandeya" className="w-8 h-8 rounded-full object-cover border border-amber-500/50" />
          <span className="font-bold text-amber-400 tracking-wide text-sm sm:text-base">BAKANDEYA — EPK / Press Kit</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
            <span>{copiedLink ? '¡Enlace Copiado!' : 'Compartir'}</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-lg transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar PDF / Imprimir</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 print:p-0 print:pt-4">
        {/* HERO SECTION */}
        <header className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-10 mb-8 print:border-none print:p-0 print:bg-none">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <img
                src={config.logoUrl || "/logo_bakandeya.jpg"}
                alt="Bakandeya Logo Oficial"
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl object-cover border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10"
              />
              <span className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 text-xs font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                Directo Rumba / Ska
              </span>
            </div>

            <div className="text-center md:text-left space-y-3 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Kit de Prensa Oficial 2026
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                BAKANDEYA
              </h1>
              <p className="text-amber-300 font-medium text-lg sm:text-xl">
                Ska-Rock, Mestizaje & Ritmos Latinos en Vivo
              </p>
              <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                Energía arrolladora, sección de metales en vivo y un directo de 90 minutos diseñado para llenar plazas, salas y escenarios de festivales.
              </p>

              {/* Quick links bar */}
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2 print:hidden">
                {config.enlacesRedes?.spotify && (
                  <a href={config.enlacesRedes.spotify} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition">
                    <Music className="w-3.5 h-3.5" /> Spotify
                  </a>
                )}
                {config.enlacesRedes?.youtube && (
                  <a href={config.enlacesRedes.youtube} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition">
                    <Youtube className="w-3.5 h-3.5" /> YouTube
                  </a>
                )}
                {config.enlacesRedes?.instagram && (
                  <a href={config.enlacesRedes.instagram} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-pink-950/60 border border-pink-500/40 text-pink-300 hover:bg-pink-900/60 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition">
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </a>
                )}
                {config.dossierPdfUrl && (
                  <a href={config.dossierPdfUrl} target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm">
                    <Download className="w-3.5 h-3.5" /> {config.dossierPdfName || 'Descargar Dossier PDF'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 2-COLUMN LAYOUT FOR BIO & CONTACT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* BIOGRAPHY (2 Cols) */}
          <section className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 print:border-none print:p-0">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5" /> Biografía & Propuesta Musical
            </h2>
            <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-3">
              {config.biografia}
            </div>
          </section>

          {/* CONTACT & BOOKING CARD (1 Col) */}
          <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-5 flex flex-col justify-between print:border-amber-400 print:bg-white print:text-black">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-amber-400 print:text-black flex items-center gap-2">
                <Mail className="w-5 h-5" /> Contacto de Booking
              </h3>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Atención directa a programadores de salas, comisiones de fiestas y festivales:
              </p>

              <div className="space-y-2.5 pt-2 text-sm">
                <div className="flex items-center gap-2.5 text-slate-200 print:text-black font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  <span>{config.contactoBooking?.nombre || "Mánager Bakandeya"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-amber-300 print:text-black font-mono">
                  <Mail className="w-4 h-4 shrink-0 text-amber-400" />
                  <a href={`mailto:${config.contactoBooking?.email}`} className="hover:underline">{config.contactoBooking?.email}</a>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 print:text-black font-mono">
                  <Phone className="w-4 h-4 shrink-0 text-amber-400" />
                  <a href={`tel:${config.contactoBooking?.telefono}`} className="hover:underline">{config.contactoBooking?.telefono}</a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-amber-500/20 print:border-slate-300">
              <a
                href={`mailto:${config.contactoBooking?.email}?subject=Contratación%20Bakandeya%202026`}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition print:hidden"
              >
                <Mail className="w-4 h-4" /> Solicitar Caché & Disponibilidad
              </a>
            </div>
          </section>
        </div>

        {/* FEATURED TRACKS / AUDIO PREVIEW */}
        {songs.length > 0 && (
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 space-y-4 print:border-none print:p-0">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Disc className="w-5 h-5" /> Temas Destacados / Repertorio Principal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {songs.map(song => (
                <div key={song.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white text-base">{song.titulo}</h4>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                        {song.tonalidad || '4/4'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {song.albumDisco || 'Sencillo'} • {song.duracion} • {song.bpm} BPM
                    </p>
                  </div>
                  {song.notasInternas && (
                    <p className="text-xs text-slate-500 italic mt-2 line-clamp-2">
                      "{song.notasInternas}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BAND PHOTOS & GALLERY */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 space-y-4 print:border-none print:p-0">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5" /> Galería de Imagen & Prensa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(config.bandPhotos || ["/logo_bakandeya.jpg"]).map((photoUrl, idx) => (
              <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                <img src={photoUrl} alt={`Foto oficial ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-4 flex items-end justify-between">
                  <span className="text-xs font-semibold text-white">Foto Promocional #{idx + 1}</span>
                  <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TECHNICAL RIDER */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 space-y-4 print:border-none print:p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Rider Técnico
            </h2>
            <div className="flex items-center gap-2 print:hidden">
              {config.riderPdfUrl && (
                <a
                  href={config.riderPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
                >
                  <Download className="w-3.5 h-3.5" /> {config.riderPdfName || 'Descargar PDF Rider'}
                </a>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(config.riderTecnico);
                  alert("¡Rider técnico copiado al portapapeles!");
                }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Texto
              </button>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-slate-300 text-sm font-mono whitespace-pre-line leading-relaxed">
            {config.riderTecnico}
          </div>
        </section>

        {/* UPCOMING SHOWS */}
        {concerts.length > 0 && (
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 space-y-4 print:border-none print:p-0">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calendar className="w-5 h-5" /> Próximas Fechas de Gira
            </h2>
            <div className="space-y-2.5">
              {concerts.map(c => (
                <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono text-xs font-bold shrink-0">
                      {c.fecha}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.sala}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500/80" /> {c.ciudad}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 capitalize">
                    {c.tipo}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="text-center text-xs text-slate-500 space-y-2 pt-6 border-t border-slate-800 print:text-black">
          <p>© 2026 Bakandeya — Todos los derechos reservados. Kit de prensa generado por BandManager.ai</p>
        </footer>
      </div>
    </div>
  );
};

export default PublicEPK;
