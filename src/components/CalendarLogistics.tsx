import React, { useState } from 'react';
import { Rehearsal, Concert, SocialPost, Message, ThemeColors } from '../types';
import { Calendar, Users, MapPin, Plus, CheckCircle2, MessageSquare, AlertCircle, Sparkles, Send, Music, Film, Share2 } from 'lucide-react';

interface CalendarLogisticsProps {
  rehearsals: Rehearsal[];
  concerts: Concert[];
  posts: SocialPost[];
  messages: Message[];
  colors: ThemeColors;
  onAddRehearsal: (rehearsal: Rehearsal) => void;
  onUpdateRehearsal: (id: string, updated: Partial<Rehearsal>) => void;
  onAddConcert: (concert: Concert) => void;
  onUpdateConcert: (id: string, updated: Partial<Concert>) => void;
  onAddPost: (post: SocialPost) => void;
  onUpdatePost: (id: string, updated: Partial<SocialPost>) => void;
  onSendMessage: (msg: Message) => void;
}

export default function CalendarLogistics({
  rehearsals,
  concerts,
  posts,
  messages,
  colors,
  onAddRehearsal,
  onUpdateRehearsal,
  onAddConcert,
  onUpdateConcert,
  onAddPost,
  onUpdatePost,
  onSendMessage
}: CalendarLogisticsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ensayos' | 'conciertos' | 'redes' | 'mensajes'>('ensayos');
  
  // Forms states
  const [showAddRehearsal, setShowAddRehearsal] = useState(false);
  const [rehFecha, setRehFecha] = useState('');
  const [rehHora, setRehHora] = useState('18:00 - 21:00');
  const [rehlugar, setRehLugar] = useState('Locales Rock Palace, Madrid');
  const [rehAsistentes, setRehAsistentes] = useState('Diego, Filgue, Larra, Carlos (Batería), Sonia (Trombón), Dani (Trompeta)');
  const [rehNotes, setRehNotes] = useState('');

  const [showAddConcert, setShowAddConcert] = useState(false);
  const [conFecha, setConFecha] = useState('');
  const [conCiudad, setConCiudad] = useState('');
  const [conSala, setConSala] = useState('');
  const [conCache, setConCache] = useState(1500);
  const [conAforoTotal, setConAforoTotal] = useState(500);
  const [conTipo, setConTipo] = useState<'sala' | 'festival' | 'ayuntamiento'>('sala');
  const [conNotes, setConNotes] = useState('');

  const [showAddPost, setShowAddPost] = useState(false);
  const [postFecha, setPostFecha] = useState('');
  const [postPlatform, setPostPlatform] = useState<'Instagram' | 'TikTok' | 'YouTube' | 'Facebook'>('Instagram');
  const [postContenido, setPostContenido] = useState('');
  const [postResp, setPostResp] = useState('Diego');

  const [newLogMsg, setNewLogMsg] = useState('');
  const [msgSender, setMsgSender] = useState('Diego');

  // Handlers
  const handleAddRehearsalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rehFecha) return;
    const newReh: Rehearsal = {
      id: `reh-${Date.now()}`,
      fecha: rehFecha,
      hora: rehHora,
      lugar: rehlugar,
      asistentes: rehAsistentes.split(',').map(s => s.trim()).filter(Boolean),
      notas: rehNotes,
      estado: 'programado'
    };
    onAddRehearsal(newReh);
    setShowAddRehearsal(false);
    setRehFecha('');
    setRehNotes('');
  };

  const handleAddConcertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conFecha || !conCiudad || !conSala) return;
    const newCon: Concert = {
      id: `con-${Date.now()}`,
      fecha: conFecha,
      ciudad: conCiudad,
      sala: conSala,
      cache: Number(conCache),
      aforo_vendido: 0,
      aforo_total: Number(conAforoTotal),
      contrato_firmado: false,
      estado_pago: 'pendiente',
      notas: conNotes,
      tipo: conTipo
    };
    onAddConcert(newCon);
    setShowAddConcert(false);
    setConFecha('');
    setConCiudad('');
    setConSala('');
    setConNotes('');
  };

  const handleAddPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postFecha || !postContenido) return;
    const newP: SocialPost = {
      id: `post-${Date.now()}`,
      fecha: postFecha,
      plataforma: postPlatform,
      contenido: postContenido,
      estado: 'borrador',
      responsable: postResp
    };
    onAddPost(newP);
    setShowAddPost(false);
    setPostFecha('');
    setPostContenido('');
  };

  const handleSendLogMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogMsg) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      remitente: msgSender,
      mensaje: newLogMsg,
      fecha: new Date().toISOString().replace('Z', ''),
      leido: false
    };
    onSendMessage(newMsg);
    setNewLogMsg('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Sub tabs list */}
      <div className="flex gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
        {[
          { id: 'ensayos', label: '📅 Ensayos de Banda', icon: Users },
          { id: 'conciertos', label: '🎸 Gira y Conciertos', icon: Calendar },
          { id: 'redes', label: '📱 Agenda de Redes', icon: Share2 },
          { id: 'mensajes', label: '💬 Tablón Interno', icon: MessageSquare }
        ].map((subTab) => {
          const isSelected = activeSubTab === subTab.id;
          return (
            <button
              id={`btn-subtab-${subTab.id}`}
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                isSelected 
                  ? `${colors.primary} text-neutral-950 font-bold` 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <span>{subTab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: ENSAYOS */}
      {activeSubTab === 'ensayos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs uppercase font-mono font-black text-neutral-400 tracking-wider">
              Ensayos Programados ({rehearsals.length})
            </h4>
            <button
              id="show-add-rehearsal-btn"
              onClick={() => setShowAddRehearsal(!showAddRehearsal)}
              className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-md"
            >
              {showAddRehearsal ? 'Cerrar Formulario' : '＋ Programar Ensayo'}
            </button>
          </div>

          {showAddRehearsal && (
            <form onSubmit={handleAddRehearsalSubmit} className={`p-4 rounded-xl border ${colors.card} space-y-3 text-xs`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Fecha *</label>
                  <input
                    id="reh-date-input"
                    type="date"
                    required
                    value={rehFecha}
                    onChange={(e) => setRehFecha(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Horario</label>
                  <input
                    id="reh-time-input"
                    type="text"
                    value={rehHora}
                    onChange={(e) => setRehHora(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Lugar de Ensayo</label>
                  <input
                    id="reh-location-input"
                    type="text"
                    value={rehlugar}
                    onChange={(e) => setRehLugar(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Músicos Asistentes</label>
                <input
                  id="reh-attendees-input"
                  type="text"
                  value={rehAsistentes}
                  onChange={(e) => setRehAsistentes(e.target.value)}
                  placeholder="Separados por comas"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Objetivos del Ensayo</label>
                <textarea
                  id="reh-notes-input"
                  rows={2}
                  value={rehNotes}
                  onChange={(e) => setRehNotes(e.target.value)}
                  placeholder="Qué temas repasar, riders, material..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  id="submit-rehearsal"
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-600 text-neutral-950 px-4 py-1.5 rounded text-xs font-bold font-mono"
                >
                  Confirmar Ensayo
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rehearsals.map((reh) => (
              <div key={reh.id} className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-neutral-300">
                      📅 {reh.fecha} — {reh.hora}
                    </span>
                    <h5 className="font-bold text-sm text-neutral-100 mt-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" /> {reh.lugar}
                    </h5>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold border ${
                    reh.estado === 'completado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                  }`}>
                    {reh.estado}
                  </span>
                </div>

                {/* Attendees */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono text-neutral-500">Músicos Convocados</span>
                  <div className="flex flex-wrap gap-1">
                    {reh.asistentes.map((as, idx) => (
                      <span key={idx} className="text-[10px] bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-neutral-400 font-sans">
                        👤 {as}
                      </span>
                    ))}
                  </div>
                </div>

                {reh.notas && (
                  <div className="bg-neutral-950 p-2.5 rounded border border-neutral-900 text-xs text-neutral-400 italic">
                    {reh.notas}
                  </div>
                )}

                {/* Mark completed */}
                {reh.estado === 'programado' && (
                  <button
                    id={`complete-rehearsal-${reh.id}`}
                    onClick={() => onUpdateRehearsal(reh.id, { estado: 'completado' })}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 hover:text-white text-xs py-1.5 rounded font-mono border border-neutral-700 transition-colors"
                  >
                    Marcar como Realizado ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CONCIERTOS */}
      {activeSubTab === 'conciertos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs uppercase font-mono font-black text-neutral-400 tracking-wider">
              Gira "Fusión Sintética" — Conciertos ({concerts.length})
            </h4>
            <button
              id="show-add-concert-btn"
              onClick={() => setShowAddConcert(!showAddConcert)}
              className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-md"
            >
              {showAddConcert ? 'Cerrar Formulario' : '＋ Agendar Nuevo Bolo'}
            </button>
          </div>

          {showAddConcert && (
            <form onSubmit={handleAddConcertSubmit} className={`p-4 rounded-xl border ${colors.card} space-y-3 text-xs`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Fecha Bolo *</label>
                  <input
                    id="con-date-input"
                    type="date"
                    required
                    value={conFecha}
                    onChange={(e) => setConFecha(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Ciudad *</label>
                  <input
                    id="con-city-input"
                    type="text"
                    required
                    value={conCiudad}
                    onChange={(e) => setConCiudad(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Sala / Recinto / Plaza *</label>
                  <input
                    id="con-venue-input"
                    type="text"
                    required
                    value={conSala}
                    onChange={(e) => setConSala(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Caché Pactado (€)</label>
                  <input
                    id="con-cache-input"
                    type="number"
                    value={conCache}
                    onChange={(e) => setConCache(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Aforo Total Recinto</label>
                  <input
                    id="con-cap-input"
                    type="number"
                    value={conAforoTotal}
                    onChange={(e) => setConAforoTotal(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Tipo de Evento</label>
                  <select
                    id="con-type-select"
                    value={conTipo}
                    onChange={(e) => setConTipo(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  >
                    <option value="sala">Concierto en Sala</option>
                    <option value="festival">Festival</option>
                    <option value="ayuntamiento">Ayuntamiento (Evento Público)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Logística / Detalles de Contrato</label>
                <textarea
                  id="con-notes-input"
                  rows={2}
                  value={conNotes}
                  onChange={(e) => setConNotes(e.target.value)}
                  placeholder="Anticipos, catering, horarios de carga y pruebas de sonido..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  id="submit-concert"
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-4 py-1.5 rounded text-xs font-bold font-mono"
                >
                  Agendar Bolo
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4">
            {concerts.map((con) => (
              <div key={con.id} className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/20 flex flex-col md:flex-row gap-4 justify-between items-stretch">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-neutral-400">
                      📅 {con.fecha}
                    </span>
                    <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase">
                      {con.tipo}
                    </span>
                  </div>

                  <h5 className="font-bold text-base text-neutral-100">{con.sala}</h5>
                  <p className="text-xs text-neutral-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" /> {con.ciudad}
                  </p>

                  {con.notas && (
                    <div className="bg-neutral-950/80 p-2.5 rounded border border-neutral-900 text-xs text-neutral-400 leading-relaxed font-sans">
                      {con.notas}
                    </div>
                  )}
                </div>

                <div className="md:w-64 border-t md:border-t-0 md:border-l border-neutral-800/60 pt-4 md:pt-0 md:pl-4 flex flex-col justify-between gap-3 text-xs">
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Caché Pactado:</span>
                      <strong className="text-neutral-200">{con.cache.toLocaleString()} €</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Contrato Firmado:</span>
                      <span className={con.contrato_firmado ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {con.contrato_firmado ? 'SÍ ✓' : 'NO ✗'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Estado de Pago:</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                        con.estado_pago === 'pagado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        con.estado_pago === 'anticipo' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {con.estado_pago}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mt-auto">
                    {!con.contrato_firmado && (
                      <button
                        id={`sign-contract-${con.id}`}
                        onClick={() => onUpdateConcert(con.id, { contrato_firmado: true })}
                        className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-[10px] py-1 rounded border border-neutral-700 text-neutral-300 font-mono"
                      >
                        Firmar Contrato
                      </button>
                    )}
                    {con.estado_pago !== 'pagado' && (
                      <button
                        id={`pay-concert-${con.id}`}
                        onClick={() => onUpdateConcert(con.id, { estado_pago: 'pagado' })}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] py-1 rounded border border-emerald-500/20 font-mono font-bold"
                      >
                        Cobrar Bolo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: REDES SOCIALES */}
      {activeSubTab === 'redes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs uppercase font-mono font-black text-neutral-400 tracking-wider">
              Planificación de Contenidos ({posts.length})
            </h4>
            <button
              id="show-add-post-btn"
              onClick={() => setShowAddPost(!showAddPost)}
              className="text-xs font-mono text-fuchsia-400 hover:underline flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-md"
            >
              {showAddPost ? 'Cerrar Formulario' : '＋ Nueva Publicación'}
            </button>
          </div>

          {showAddPost && (
            <form onSubmit={handleAddPostSubmit} className={`p-4 rounded-xl border ${colors.card} space-y-3 text-xs`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Fecha Programada *</label>
                  <input
                    id="post-date-input"
                    type="date"
                    required
                    value={postFecha}
                    onChange={(e) => setPostFecha(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Plataforma</label>
                  <select
                    id="post-platform-select"
                    value={postPlatform}
                    onChange={(e) => setPostPlatform(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Responsable</label>
                  <input
                    id="post-resp-input"
                    type="text"
                    value={postResp}
                    onChange={(e) => setPostResp(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Idea / Copy del Contenido *</label>
                <textarea
                  id="post-content-input"
                  rows={3}
                  required
                  value={postContenido}
                  onChange={(e) => setPostContenido(e.target.value)}
                  placeholder="Redacta el texto del post, hashtags o la idea para el reel/TikTok..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  id="submit-post"
                  type="submit"
                  className="bg-fuchsia-500 hover:bg-fuchsia-600 text-neutral-950 px-4 py-1.5 rounded text-xs font-bold font-mono"
                >
                  Crear Borrador Post
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-neutral-950 px-2.5 py-0.5 rounded border border-neutral-800 text-neutral-300">
                      📱 {post.fecha}
                    </span>
                    <span className="text-[9px] font-mono bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 px-1.5 py-0.5 rounded">
                      {post.plataforma}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold border ${
                    post.estado === 'publicado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    post.estado === 'aprobado' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}>
                    {post.estado}
                  </span>
                </div>

                <div className="bg-neutral-950/80 p-3 rounded border border-neutral-900 text-xs text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {post.contenido}
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                  <span>Responsable: <strong className="text-neutral-400">{post.responsable}</strong></span>
                  
                  <div className="flex gap-1.5">
                    {post.estado === 'borrador' && (
                      <button
                        id={`approve-post-${post.id}`}
                        onClick={() => onUpdatePost(post.id, { estado: 'aprobado' })}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20"
                      >
                        Aprobar
                      </button>
                    )}
                    {post.estado !== 'publicado' && (
                      <button
                        id={`publish-post-${post.id}`}
                        onClick={() => onUpdatePost(post.id, { estado: 'publicado' })}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold"
                      >
                        Publicado ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LOGÍSTICA / MENSAJES INTERNOS */}
      {activeSubTab === 'mensajes' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex gap-3 items-center">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            <p className="text-xs text-neutral-400 leading-normal">
              <strong>Tablón de Comunicación Backstage:</strong> Mensajería directa entre los miembros de Bakandeya para coordinar furgonetas, hoteles, comidas o imprevistos técnicos del rider.
            </p>
          </div>

          <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 flex flex-col h-[400px]">
            {/* Messages box */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col justify-end">
              {messages.map((msg) => {
                const isMe = msg.remitente === msgSender;
                return (
                  <div key={msg.id} className={`max-w-[85%] flex flex-col gap-1 ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-neutral-400">{msg.remitente}</span>
                      <span className="text-[8px] font-mono text-neutral-600">
                        {msg.fecha.includes('T') ? msg.fecha.split('T')[1].slice(0, 5) : 'Hace un rato'}
                      </span>
                    </div>

                    <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-neutral-800 text-neutral-100 rounded-tr-none border border-neutral-700/60' 
                        : 'bg-neutral-900 text-neutral-200 rounded-tl-none border border-neutral-800'
                    }`}>
                      {msg.mensaje}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input message form */}
            <form onSubmit={handleSendLogMsg} className="bg-neutral-900 border-t border-neutral-800 p-3 flex gap-2 items-center">
              {/* Sender Select */}
              <select
                id="message-sender-select"
                value={msgSender}
                onChange={(e) => setMsgSender(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-300 focus:outline-none"
              >
                <option value="Diego">Diego</option>
                <option value="Larra">Larra</option>
                <option value="Filgue">Filgue</option>
                <option value="Sonia">Sonia (Vientos)</option>
                <option value="Carlos">Carlos (Batería)</option>
              </select>

              <input
                id="message-text-input"
                type="text"
                value={newLogMsg}
                onChange={(e) => setNewLogMsg(e.target.value)}
                placeholder="Escribe un mensaje de coordinación..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700 font-sans"
              />

              <button
                id="send-message-btn"
                type="submit"
                className="p-1.5 rounded bg-cyan-500 hover:bg-cyan-600 text-neutral-950 transition-colors"
              >
                <Send className="w-4 h-4 text-zinc-950" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
