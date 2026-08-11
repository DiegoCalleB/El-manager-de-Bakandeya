import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, CheckCircle2, Download, Copy, Check, ShieldCheck, Mail, User, MapPin, Music } from 'lucide-react';

export const PublicFanCapture: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [comoConocio, setComoConocio] = useState('');
  const [conciertoOrigenId, setConciertoOrigenId] = useState('');
  const [conciertoOrigenNombre, setConciertoOrigenNombre] = useState('');
  const [consentimientoRGPD, setConsentimientoRGPD] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [incentivoData, setIncentivoData] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [bandInfo, setBandInfo] = useState<{ name: string; logoUrl: string }>({ name: '', logoUrl: '' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cId = params.get('concertId') || params.get('cId') || '';
    const cName = params.get('concertName') || params.get('cName') || '';
    const bandId = params.get('band_id') || params.get('band') || '';

    if (cId) setConciertoOrigenId(cId);
    if (cName) {
      setConciertoOrigenNombre(cName);
      setComoConocio(`Concierto: ${cName}`);
    } else {
      setComoConocio("En directo / Concierto");
    }

    fetch(`/api/public/epk${bandId ? `?band_id=${encodeURIComponent(bandId)}` : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data?.bandName) {
          const isBkn = (data.bandId || '').includes('bakandeya') || data.bandName.toLowerCase().includes('bakandeya');
          setBandInfo({
            name: data.bandName,
            logoUrl: data.epkConfig?.logoUrl || (isBkn ? '/logo_bakandeya.jpg' : '')
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim() || !email.trim()) {
      setErrorMsg('Por favor, introduce tu nombre y tu correo electrónico.');
      return;
    }

    if (!consentimientoRGPD) {
      setErrorMsg('Debes aceptar la casilla de consentimiento de privacidad (RGPD) para continuar.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/public/fans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          email,
          ciudad,
          comoConocio,
          conciertoOrigenId,
          conciertoOrigenNombre,
          consentimientoRGPD
        })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Ocurrió un error al guardar tu registro.');
        return;
      }

      setIncentivoData(data.incentivo);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting fan form:", err);
      setLoading(false);
      setErrorMsg('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* LOGO & BRAND HEADER */}
        <div className="text-center space-y-3">
          <div className="inline-block relative">
            {bandInfo.logoUrl ? (
              <img
                src={bandInfo.logoUrl}
                alt={bandInfo.name || "Logo"}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl mx-auto object-cover border-2 border-amber-500 shadow-xl shadow-amber-500/20"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl mx-auto bg-slate-900 border-2 border-amber-500/80 flex items-center justify-center text-amber-400 shadow-xl">
                <Music className="w-10 h-10" />
              </div>
            )}
            <span className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-lg">
              <Heart className="w-4 h-4 fill-slate-950" />
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
            {bandInfo.name ? `¡SÚMATE A LA FAMILIA DE ${bandInfo.name.toUpperCase()}!` : '¡SÚMATE A NUESTRA COMUNIDAD!'}
          </h1>
          <p className="text-slate-300 text-sm max-w-xs mx-auto">
            {conciertoOrigenNombre ? (
              <span>Gracias por bailar con nosotros en <strong className="text-amber-400">{conciertoOrigenNombre}</strong>. Regístrate y llévate tu regalo exclusivo.</span>
            ) : (
              <span>Únete al club oficial para enterarte antes que nadie de conciertos, nuevos lanzamientos y regalos en cada gira.</span>
            )}
          </p>
        </div>

        {!submitted ? (
          /* FORM CARD */
          <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
            {errorMsg && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-200 text-xs rounded-xl font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Nombre y Apellidos *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Laura García"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" /> Ciudad
                </label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={e => setCiudad(e.target.value)}
                  placeholder="Ej: Madrid"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Music className="w-3 h-3 text-amber-400" /> ¿Origen?
                </label>
                <input
                  type="text"
                  value={comoConocio}
                  onChange={e => setComoConocio(e.target.value)}
                  placeholder="Ej: Directo / Instagram"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            {/* MANDATORY GDPR CHECKBOX */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 leading-relaxed select-none">
                <input
                  type="checkbox"
                  required
                  checked={consentimientoRGPD}
                  onChange={e => setConsentimientoRGPD(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <span>
                  Acepto recibir novedades, lanzamientos y fechas de conciertos de <strong>Bakandeya</strong>. 
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    Responsable: Bakandeya. Puedes darte de baja en cualquier momento con 1 clic.
                  </span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>UNIRME & CONSEGUIR MI REGALO</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* THANK YOU & INCENTIVE CARD */
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center backdrop-blur-md animate-fade-in">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full mx-auto flex items-center justify-center border border-amber-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">¡MUCHAS GRACIAS, {nombre.split(' ')[0].toUpperCase()}!</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {incentivoData?.mensajeAgradecimiento || "¡Ya formas parte oficialmente de la familia de Bakandeya! Gracias por apoyar la música independiente en directo."}
              </p>
            </div>

            {/* INCENTIVE BOX 1: EXCLUSIVE DOWNLOAD */}
            {incentivoData?.enlaceDescarga && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
                  <Download className="w-4 h-4" /> Regalo #1: Canción Inédita / Exclusiva
                </div>
                <p className="text-xs text-slate-400">Descarga directa en mp3 de alta calidad:</p>
                <a
                  href={incentivoData.enlaceDescarga}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-lg flex items-center justify-between transition"
                >
                  <span>Descargar Canción Exclusiva</span>
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* INCENTIVE BOX 2: DISCOUNT CODE */}
            {incentivoData?.codigoDescuento && (
              <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
                  <Sparkles className="w-4 h-4" /> Regalo #2: Descuento en Merchandising
                </div>
                <p className="text-xs text-slate-400">Usa este código en nuestro stand o tienda online para un 10% Dto.:</p>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-sm font-bold text-white">
                  <span className="tracking-widest text-amber-300">{incentivoData.codigoDescuento}</span>
                  <button
                    onClick={() => handleCopyCode(incentivoData.codigoDescuento)}
                    className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded hover:bg-amber-400 flex items-center gap-1 transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Tus datos están seguros con Bakandeya.
            </div>
          </div>
        )}

        <footer className="text-center text-[11px] text-slate-600">
          Bakandeya Official Community • Powered by BandManager.ai
        </footer>
      </div>
    </div>
  );
};

export default PublicFanCapture;
