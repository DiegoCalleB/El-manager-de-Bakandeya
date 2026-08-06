import React, { useState, useEffect } from 'react';
import { Heart, Check, Download, Tag, Loader2, PartyPopper, Shield, X } from 'lucide-react';
import QRCode from 'react-qr-code';

export const FansLanding: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    ciudad: '',
    comoConocio: '',
    consentimiento: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [concertId, setConcertId] = useState('');
  const [concertName, setConcertName] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isConcertLink, setIsConcertLink] = useState(false);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let slug = '';

    if (pathParts.length > 1) {
      slug = pathParts[1];
    } else if (pathParts.length === 1 && !['unete', 'fans', 'directo', 'bakandeya', 'app'].includes(pathParts[0])) {
      slug = pathParts[0];
    }

    if (slug && slug !== 'directo') {
      const formattedName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setConcertName(formattedName);
      setFormData(prev => ({ ...prev, comoConocio: 'Concierto' }));
      setIsConcertLink(true);
    } else {
      setFormData(prev => ({ ...prev, comoConocio: 'Concierto' }));
      setIsConcertLink(true);
    }

    const params = new URLSearchParams(window.location.search);
    const cid = params.get('concertId');
    const cname = params.get('concertName');
    
    if (cid) setConcertId(cid);
    if (cname) {
      setConcertName(cname);
      setIsConcertLink(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.consentimiento) {
      setError("Por favor, rellena los campos obligatorios y acepta la política.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/public/fans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          ciudad: formData.ciudad,
          comoConocio: formData.comoConocio,
          conciertoOrigenId: concertId,
          conciertoOrigenNombre: concertName,
          consentimientoRGPD: formData.consentimiento
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrarte.');
      
      setSuccessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    const incentivo = successData.incentivo || {};
    
    return (
      <div className="min-h-screen bg-[#121111] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/20 shadow-inner">
            <Heart className="w-10 h-10 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-widest flex items-center justify-center gap-2">
              <PartyPopper className="w-6 h-6 text-amber-400" /> 
              ¡Bienvenido a Bakandeya!
            </h2>
            <p className="text-neutral-300 font-mono text-sm leading-relaxed max-w-xs mx-auto">
              {successData.alreadyRegistered 
                ? successData.message 
                : (incentivo.mensajeAgradecimiento || "¡Registro completado! Nos alegramos de que formes parte de nuestra familia.")}
            </p>
          </div>

          {(incentivo.enlaceDescarga || incentivo.codigoDescuento) && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 mt-6 space-y-4">
              <h3 className="text-amber-500 font-black uppercase tracking-widest text-xs font-mono">Tus Beneficios</h3>
              
              {incentivo.enlaceDescarga && (
                <div className="pt-2">
                  <a 
                    href={incentivo.enlaceDescarga}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 w-full p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono text-xs transition-colors"
                  >
                    <Download className="w-5 h-5 text-amber-400" />
                    <span className="font-bold">Descargar Tema Inédito</span>
                  </a>
                </div>
              )}
              
              {incentivo.codigoDescuento && (
                <div className="pt-2">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-1">Código Promocional de Merch</p>
                  <div className="flex items-center justify-center gap-2 p-3 bg-neutral-900 border border-neutral-700 border-dashed rounded-lg">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-emerald-400 font-bold tracking-widest">{incentivo.codigoDescuento}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="pt-4">
            <a href="/" className="text-xs font-mono text-neutral-500 hover:text-amber-500 underline transition-colors">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121111] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-neutral-800 to-neutral-700" />
        
        <div className="text-center space-y-4 pt-2">
          <img src="/logo_bakandeya.jpg" alt="Bakandeya" className="w-24 h-24 mx-auto object-cover rounded-2xl border-2 border-amber-500/40 shadow-xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white font-display uppercase tracking-widest drop-shadow-md">Únete a Bakandeya!</h1>
            <p className="text-amber-500/80 text-[10px] font-mono uppercase tracking-widest font-bold">Oficial Fan Club</p>
          </div>
          <p className="text-neutral-400 text-xs font-mono leading-relaxed pt-2">
            {isConcertLink ? (
              <span className="text-emerald-400 font-bold block mb-2 px-3 py-1 bg-emerald-400/10 rounded-full inline-block">
                ¡Gracias por venir al concierto{concertName ? ` de ${concertName}` : ''}! 🎸
              </span>
            ) : (
              <span className="text-amber-400 font-bold block mb-2 px-3 py-1 bg-amber-400/10 rounded-full inline-block">
                ¡Gracias por escucharnos! 🎶
              </span>
            )} 
            Déjanos tus datos para no perder el contacto, recibir acceso anticipado y enterarte de todo antes que nadie.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono rounded-xl text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">Nombre *</label>
            <input 
              type="text" 
              required
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">Email *</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">Ciudad (Opcional)</label>
            <input 
              type="text" 
              value={formData.ciudad}
              onChange={e => setFormData({...formData, ciudad: e.target.value})}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
              placeholder="¿De dónde nos escuchas?"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">¿Cómo nos conociste? *</label>
            <select 
              required
              value={formData.comoConocio}
              onChange={e => setFormData({...formData, comoConocio: e.target.value})}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors appearance-none"
            >
              <option value="">Selecciona una opción...</option>
              <option value="Concierto">En un concierto</option>
              <option value="Redes Sociales">Por Instagram / TikTok / Redes</option>
              <option value="Amigo">Por recomendación de un amigo</option>
              <option value="Spotify">Descubrimiento en Spotify / Streaming</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          <div className="pt-3 pb-2">
            <label className="flex items-start gap-3 cursor-pointer group p-3 bg-neutral-950/50 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors">
              <div className="relative flex items-center justify-center mt-0.5">
                <input 
                  type="checkbox" 
                  required
                  checked={formData.consentimiento}
                  onChange={e => setFormData({...formData, consentimiento: e.target.checked})}
                  className="peer appearance-none w-5 h-5 border-2 border-neutral-700 rounded bg-neutral-950 checked:bg-amber-500 checked:border-amber-500 transition-colors shrink-0 cursor-pointer"
                />
                <Check className="w-3.5 h-3.5 text-neutral-900 absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
              </div>
              <span className="text-[10px] text-neutral-400 font-mono leading-relaxed group-hover:text-neutral-300 transition-colors pt-0.5">
                He leído y acepto la <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-amber-400 underline hover:text-amber-300 font-bold inline">política de privacidad</button>, y doy mi <strong className="text-neutral-200">consentimiento explícito</strong> para que Bakandeya guarde mis datos y me envíe comunicaciones (obligatorio por RGPD).
              </span>
            </label>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-[#f2ca50] to-[#e0a820] hover:from-[#ffe088] hover:to-[#f2ca50] text-[#121111] font-black text-sm uppercase tracking-widest font-mono rounded-xl shadow-[0_0_20px_rgba(242,202,80,0.15)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registrando...
              </>
            ) : (
              'Unirme a Bakandeya'
            )}
          </button>
        </form>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2 text-amber-500 font-mono font-bold text-sm uppercase tracking-wider">
                <Shield className="w-5 h-5" /> Política de Privacidad y RGPD
              </div>
              <button onClick={() => setShowPrivacyModal(false)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-xs text-neutral-300 font-mono space-y-3 leading-relaxed">
              <p><strong className="text-white">1. Responsable del tratamiento:</strong> Bakandeya (Banda musical). Los datos facilitados a través de este código QR y formulario serán tratados con la única finalidad de gestionar tu alta en nuestro club de fans ("Bakandeya") e informarte sobre próximos conciertos, lanzamientos y novedades musicales.</p>
              
              <p><strong className="text-white">2. Legitimación:</strong> El tratamiento de tus datos se basa en tu <span className="text-amber-400">consentimiento explícito</span> al marcar la casilla de aceptación y enviar el formulario.</p>
              
              <p><strong className="text-white">3. Destinatarios:</strong> Los datos se almacenan de forma segura para uso exclusivo de Bakandeya en la gestión de su base de fans. No se cederán a terceros salvo obligación legal.</p>
              
              <p><strong className="text-white">4. Derechos:</strong> Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión y portabilidad escribiendo a nuestro correo de contacto o indicándolo en cualquiera de nuestros correos informativos.</p>
            </div>

            <div className="pt-4 border-t border-neutral-800 text-right">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FansLanding;
