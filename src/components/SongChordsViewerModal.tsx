import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Edit3,
  Save,
  Printer,
  Music2,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Zap,
  Info,
  Wand2,
  Copy,
  Check,
  ListMusic,
  Share2,
  MessageSquare
} from 'lucide-react';
import { Song, SongSubstituteGuide } from '../types';
import { ShareModal } from './ShareModal';
import { formatSongShareText } from '../utils/shareUtils';
import {
  processChordText,
  extractUniqueChords,
  GUITAR_CHORD_DATABASE,
  GuitarChordShape,
  transposeChordToken
} from '../utils/chordUtils';

interface SongChordsViewerModalProps {
  song: Song;
  onClose: () => void;
  onUpdateSong: (updated: Song) => void;
}

export function SongChordsViewerModal({
  song,
  onClose,
  onUpdateSong
}: SongChordsViewerModalProps) {
  const [activeTab, setActiveTab] = useState<'chords' | 'substitute' | 'edit'>('chords');
  const [notation, setNotation] = useState<'ES' | 'EN'>('ES');
  const [transpose, setTranspose] = useState<number>(0);
  
  // Auto-scroll state
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(2); // 1 = slow, 3 = fast
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Show Chord Diagrams drawer/panel
  const [showChordDiagrams, setShowChordDiagrams] = useState<boolean>(true);

  // Edit form state
  const [cifradoTexto, setCifradoTexto] = useState<string>(
    song.cifradoTexto || getSampleCifrado(song)
  );
  const [guiaSustituto, setGuiaSustituto] = useState<SongSubstituteGuide>(
    song.guiaSustituto || getSampleSubstituteGuide(song)
  );

  // AI Generation loading state
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Auto-scroll timer effect
  useEffect(() => {
    let interval: any = null;
    if (isAutoScrolling) {
      interval = setInterval(() => {
        if (scrollContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
          if (scrollTop + clientHeight >= scrollHeight - 5) {
            setIsAutoScrolling(false);
          } else {
            scrollContainerRef.current.scrollTop += scrollSpeed * 0.8;
          }
        }
      }, 50);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isAutoScrolling, scrollSpeed]);

  // Handle AI chord generation
  const handleGenerateWithAi = async () => {
    try {
      setIsGeneratingAi(true);
      setAiSuccessMsg(null);

      const token = localStorage.getItem('token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/generate-song-chords', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          songId: song.id,
          titulo: song.titulo,
          tonalidad: song.tonalidad,
          bpm: song.bpm,
          afinacion: song.afinacion,
          notasInternas: song.notasInternas,
          esVersionCovers: song.esVersionCovers,
          artista: song.albumDisco
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al generar acordes con IA');
      }

      setCifradoTexto(data.cifradoTexto);
      if (data.guiaSustituto) {
        setGuiaSustituto(data.guiaSustituto);
      }

      const updatedSong: Song = {
        ...song,
        cifradoTexto: data.cifradoTexto,
        guiaSustituto: data.guiaSustituto
      };
      onUpdateSong(updatedSong);

      setAiSuccessMsg('¡Cifrado y Ficha de Sustituto generados con éxito por Gemini!');
      setTimeout(() => setAiSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error generating with AI:', err);
      alert(`No se pudieron generar los acordes: ${err.message || 'Error de conexión'}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save manual edit changes
  const handleSaveEdits = () => {
    const updatedSong: Song = {
      ...song,
      cifradoTexto,
      guiaSustituto
    };

    // Save to server
    const token = localStorage.getItem('token') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/songs/${song.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatedSong)
    }).catch(err => console.error('Error saving song chords:', err));

    onUpdateSong(updatedSong);
    setActiveTab('chords');
    setAiSuccessMsg('¡Cambios guardados con éxito!');
    setTimeout(() => setAiSuccessMsg(null), 3000);
  };

  // Process text according to current transpose and notation
  const processedText = processChordText(cifradoTexto, transpose, notation);
  const uniqueChords = extractUniqueChords(processedText);

  // Copy chords to clipboard
  const handleCopyChords = () => {
    navigator.clipboard.writeText(processedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-purple-950/40 p-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Music2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{song.titulo}</h2>
                {song.esVersionCovers && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-500/30">
                    Cover
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono mt-0.5">
                <span>Tonalidad: <strong className="text-amber-400">{song.tonalidad || 'Mim'}</strong></span>
                <span>•</span>
                <span>Tempo: <strong className="text-emerald-400">{song.bpm || 120} BPM</strong></span>
                {song.afinacion && (
                  <>
                    <span>•</span>
                    <span>Afinación: <strong className="text-purple-300">{song.afinacion}</strong></span>
                  </>
                )}
                {song.duracion && (
                  <>
                    <span>•</span>
                    <span>Duración: <strong className="text-neutral-300">{song.duracion}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share WhatsApp / Apps Button */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
              title="Compartir canción y acordes por WhatsApp o App"
            >
              <MessageSquare className="w-4 h-4 fill-white/20" />
              <span>Compartir</span>
            </button>

            {/* AI Generate Button Header */}
            <button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={isGeneratingAi}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-950/50 disabled:opacity-50"
              title="Generar cifrado y guía con IA"
            >
              <Wand2 className={`w-4 h-4 text-purple-200 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'Generando...' : 'IA Cifrado'}</span>
            </button>

            {/* Print / Clean View */}
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Imprimir Cifrado"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOOLBAR CONTROLS BAR (LaCuerda / Ultimate Guitar Toolbar) */}
        <div className="bg-neutral-950/80 px-4 py-2.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
          
          {/* TABS SELECTOR */}
          <div className="flex items-center bg-black/50 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('chords')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'chords'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Letra y Acordes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('substitute')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'substitute'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Ficha Sustituto URGENTE</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-neutral-800 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>

          {/* INTERACTIVE CONTROLS (Only visible on chords tab) */}
          {activeTab === 'chords' && (
            <div className="flex flex-wrap items-center gap-3">
              
              {/* TRANSPOSITION CONTROL */}
              <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-xl border border-neutral-800">
                <span className="text-[11px] text-neutral-400 mr-1">Tono:</span>
                <button
                  type="button"
                  onClick={() => setTranspose(prev => prev - 1)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
                  title="Bajar 1 semitono"
                >
                  -1
                </button>
                <span className={`w-8 text-center font-bold ${transpose !== 0 ? 'text-amber-400' : 'text-neutral-300'}`}>
                  {transpose > 0 ? `+${transpose}` : transpose}
                </span>
                <button
                  type="button"
                  onClick={() => setTranspose(prev => prev + 1)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
                  title="Subir 1 semitono"
                >
                  +1
                </button>
                {transpose !== 0 && (
                  <button
                    type="button"
                    onClick={() => setTranspose(0)}
                    className="p-1 rounded text-neutral-400 hover:text-amber-400 transition cursor-pointer ml-1"
                    title="Restablecer Tono Original"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* NOTATION TOGGLE (Latino / C-D-E) */}
              <button
                type="button"
                onClick={() => setNotation(prev => prev === 'ES' ? 'EN' : 'ES')}
                className="px-2.5 py-1 rounded-xl bg-black/40 border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white font-bold transition cursor-pointer flex items-center gap-1"
                title="Cambiar entre Cifrado Latino (Do, Re, Mi) e Inglés (C, D, E)"
              >
                <span>Cifrado:</span>
                <span className="text-amber-400">{notation === 'ES' ? 'Do - Re - Mi' : 'C - D - E'}</span>
              </button>

              {/* AUTO-SCROLL CONTROLLER */}
              <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                    isAutoScrolling
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-white/10 text-neutral-300 hover:text-white'
                  }`}
                  title="Iniciar/Pausar Desfile Automático"
                >
                  {isAutoScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>Autoscroll</span>
                </button>

                {isAutoScrolling && (
                  <div className="flex items-center gap-1 ml-1">
                    <span className="text-[10px] text-neutral-400">Vel:</span>
                    {[1, 2, 3].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setScrollSpeed(v)}
                        className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition cursor-pointer ${
                          scrollSpeed === v ? 'bg-emerald-500 text-black' : 'bg-white/10 text-neutral-400'
                        }`}
                      >
                        {v}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TOGGLE CHORD DIAGRAMS */}
              <button
                type="button"
                onClick={() => setShowChordDiagrams(!showChordDiagrams)}
                className={`px-2.5 py-1 rounded-xl border font-bold transition cursor-pointer ${
                  showChordDiagrams
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                    : 'bg-black/40 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                🎸 Diagramas
              </button>

              {/* COPY BUTTON */}
              <button
                type="button"
                onClick={handleCopyChords}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
                title="Copiar texto de acordes"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* AI SUCCESS NOTIFICATION BANNER */}
        {aiSuccessMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 text-xs font-mono text-emerald-300 flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              {aiSuccessMsg}
            </span>
            <button onClick={() => setAiSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* MAIN CONTENT AREA */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
          >
            {/* TAB 1: CHORDS & LYRICS SHEET (LaCuerda style) */}
            {activeTab === 'chords' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                
                {/* SUBSTITUTE QUICK SUMMARY BANNER */}
                {guiaSustituto?.estructura && (
                  <div className="bg-gradient-to-r from-purple-950/40 via-neutral-900 to-black p-3.5 rounded-xl border border-purple-500/30 text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Estructura Rápida para el Músico:
                      </span>
                      <button
                        onClick={() => setActiveTab('substitute')}
                        className="text-[10px] underline text-purple-400 hover:text-white"
                      >
                        Ver Ficha Completa →
                      </button>
                    </div>
                    <p className="text-neutral-200 text-sm font-semibold tracking-wide bg-black/40 p-2 rounded-lg border border-white/5">
                      {guiaSustituto.estructura}
                    </p>
                  </div>
                )}

                {/* THE CHORD SHEET DISPLAY */}
                <div className="bg-black/60 p-6 rounded-2xl border border-neutral-800 shadow-inner font-mono text-sm leading-relaxed whitespace-pre-wrap select-text">
                  {renderFormattedChordSheet(processedText)}
                </div>
              </div>
            )}

            {/* TAB 2: SUBSTITUTE QUICK GUIDE (FICHA PARA MÚSICO SUSTITUTO) */}
            {activeTab === 'substitute' && (
              <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
                <div className="bg-gradient-to-br from-purple-950/60 to-neutral-900 p-6 rounded-2xl border border-purple-500/40 shadow-xl space-y-5">
                  <div className="flex items-center gap-3 border-b border-purple-500/30 pb-4">
                    <div className="p-3 rounded-xl bg-purple-600 text-white shadow-lg">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Ficha de Sustitución Urgente</h3>
                      <p className="text-xs text-purple-300 font-mono">
                        Resumen express para tocar el tema correctamente en directo o ensayo sin margen de error.
                      </p>
                    </div>
                  </div>

                  {/* GUIDES GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-amber-400 font-bold block text-[11px] uppercase tracking-wider">
                        1. Estructura Exacta del Tema
                      </span>
                      <p className="text-white text-sm font-semibold leading-relaxed">
                        {guiaSustituto.estructura || 'Sin estructura definida.'}
                      </p>
                    </div>

                    <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-emerald-400 font-bold block text-[11px] uppercase tracking-wider">
                        2. Progresión Armónica Clave
                      </span>
                      <p className="text-white text-sm font-semibold leading-relaxed">
                        {guiaSustituto.progresionClave || 'Ver cifrado completo.'}
                      </p>
                    </div>

                    <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-rose-400 font-bold block text-[11px] uppercase tracking-wider">
                        3. Cortes, Entradas y Claves
                      </span>
                      <p className="text-neutral-200 leading-relaxed">
                        {guiaSustituto.cortesYClaves || 'Sin indicaciones especiales de cortes.'}
                      </p>
                    </div>

                    <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-purple-300 font-bold block text-[11px] uppercase tracking-wider">
                        4. Capo / Afinación
                      </span>
                      <p className="text-neutral-200 leading-relaxed">
                        {guiaSustituto.capoTraste || 'Standard / Sin Capo'}
                      </p>
                    </div>

                    <div className="sm:col-span-2 bg-black/50 p-4 rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-cyan-400 font-bold block text-[11px] uppercase tracking-wider">
                        5. Protagonismo de Instrumentos / Arreglos
                      </span>
                      <p className="text-neutral-200 leading-relaxed">
                        {guiaSustituto.instrumentosClave || 'Seguir el pulso principal de batería y bajo.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Editar esta Ficha de Sustitución</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EDIT MODE */}
            {activeTab === 'edit' && (
              <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
                <div className="bg-neutral-900/90 p-5 rounded-2xl border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm font-mono">
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      Editor de Cifrado y Ficha
                    </h3>
                    <button
                      type="button"
                      onClick={handleSaveEdits}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-amber-400 block mb-1">
                      Texto con Letra y Acordes (Formato LaCuerda o [Acorde] inline):
                    </label>
                    <textarea
                      value={cifradoTexto}
                      onChange={(e) => setCifradoTexto(e.target.value)}
                      rows={14}
                      className="w-full p-3 bg-black border border-neutral-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
                      placeholder={`[Intro]\nMim  Do  Re  Mim\n\n[Estribillo]\n[Sol] Que tiene tu [Re] veneno [Mim] ...`}
                    />
                  </div>

                  <div className="pt-3 border-t border-neutral-800 space-y-3">
                    <h4 className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
                      Campos de la Ficha del Músico Sustituto:
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <label className="text-neutral-400 block mb-0.5">Estructura Exacta del Tema:</label>
                        <input
                          type="text"
                          value={guiaSustituto.estructura || ''}
                          onChange={(e) => setGuiaSustituto({ ...guiaSustituto, estructura: e.target.value })}
                          className="w-full p-2 bg-black border border-neutral-700 rounded-lg text-white"
                          placeholder="Intro -> Verso -> Estribillo -> Outro"
                        />
                      </div>

                      <div>
                        <label className="text-neutral-400 block mb-0.5">Progresiones Clave:</label>
                        <input
                          type="text"
                          value={guiaSustituto.progresionClave || ''}
                          onChange={(e) => setGuiaSustituto({ ...guiaSustituto, progresionClave: e.target.value })}
                          className="w-full p-2 bg-black border border-neutral-700 rounded-lg text-white"
                          placeholder="Verso: Mim - Do | Estribillo: Sol - Re"
                        />
                      </div>

                      <div>
                        <label className="text-neutral-400 block mb-0.5">Cortes y Claves en Vivo:</label>
                        <input
                          type="text"
                          value={guiaSustituto.cortesYClaves || ''}
                          onChange={(e) => setGuiaSustituto({ ...guiaSustituto, cortesYClaves: e.target.value })}
                          className="w-full p-2 bg-black border border-neutral-700 rounded-lg text-white"
                          placeholder="Parón en compás 8..."
                        />
                      </div>

                      <div>
                        <label className="text-neutral-400 block mb-0.5">Capo / Afinación:</label>
                        <input
                          type="text"
                          value={guiaSustituto.capoTraste || ''}
                          onChange={(e) => setGuiaSustituto({ ...guiaSustituto, capoTraste: e.target.value })}
                          className="w-full p-2 bg-black border border-neutral-700 rounded-lg text-white"
                          placeholder="Capo 2º traste"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: CHORD DIAGRAMS DRAWER */}
          {activeTab === 'chords' && showChordDiagrams && (
            <div className="w-full md:w-64 bg-neutral-950 border-t md:border-t-0 md:border-l border-neutral-800 p-4 overflow-y-auto shrink-0 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  🎸 Posiciones de Acordes ({uniqueChords.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowChordDiagrams(false)}
                  className="text-neutral-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {uniqueChords.length === 0 ? (
                <p className="text-xs text-neutral-500 font-mono italic">
                  No se detectaron acordes en el texto.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                  {uniqueChords.map(chord => (
                    <ChordDiagramBox key={chord} chord={chord} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SHARE MODAL FOR WHATSAPP / APPS */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={song.titulo}
        subtitle="Canción y cifrado para WhatsApp"
        initialText={formatSongShareText(song, { includeChords: true, includeGuide: true })}
        itemType="song"
      />
    </div>
  );
}

// RENDER FUNCTION FOR FORMATTED CHORD SHEET WITH HIGHLIGHTED CHORDS
function renderFormattedChordSheet(text: string) {
  if (!text) return <span className="text-neutral-500 italic">Sin cifrado disponible. Usa el botón de IA para generarlo.</span>;

  const lines = text.split('\n');

  return lines.map((line, idx) => {
    // Check if section header like [Intro], [Estribillo], [Solo], etc.
    if (/^\[(Intro|Verso|Estribillo|Coro|Puente|Solo|Outro|Coda|Final|Intro\s\d+|Verso\s\d+)\]/i.test(line.trim())) {
      return (
        <div key={idx} className="text-purple-400 font-bold text-base my-2 pt-2 border-t border-neutral-800/60 flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300">
            {line.trim()}
          </span>
        </div>
      );
    }

    // Check if inline bracket chord format: [Do] Que tiene tu [Sol] veneno
    if (line.includes('[')) {
      const parts = line.split(/(\[[A-Za-z0-9#\/]+\])/g);
      return (
        <div key={idx} className="py-0.5">
          {parts.map((part, pIdx) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              const chordName = part.slice(1, -1);
              return (
                <span
                  key={pIdx}
                  className="font-bold text-amber-400 bg-amber-950/40 px-1 py-0.5 rounded border border-amber-500/30 mx-0.5 text-xs shadow-sm"
                >
                  {chordName}
                </span>
              );
            }
            return <span key={pIdx} className="text-neutral-200">{part}</span>;
          })}
        </div>
      );
    }

    // Otherwise check if line contains chords separated by spaces
    const tokens = line.trim().split(/\s+/);
    const chordCount = tokens.filter(t => /^(Sol#|Solb|Sol|Do#|Do|Re#|Reb|Re|Fa#|Fa|La#|Lab|La|Sib|Si|Mib|Mi|[A-G][#b]?)/.test(t)).length;
    const isChordLine = chordCount > 0 && chordCount / tokens.length >= 0.6;

    if (isChordLine) {
      return (
        <div key={idx} className="font-bold text-amber-400 text-sm tracking-wide py-0.5 leading-none select-none">
          {line}
        </div>
      );
    }

    // Standard lyrics line
    return (
      <div key={idx} className="text-neutral-200 py-0.5">
        {line || '\u00A0'}
      </div>
    );
  });
}

// COMPONENT TO RENDER A SINGLE GUITAR CHORD BOX/FRETBOARD DIAGRAM
const ChordDiagramBox: React.FC<{ chord: string }> = ({ chord }) => {
  // Look up in database or clean name
  const shape: GuitarChordShape | undefined = GUITAR_CHORD_DATABASE[chord];

  return (
    <div className="bg-black/60 p-2.5 rounded-xl border border-neutral-800 text-center space-y-1.5 hover:border-amber-500/40 transition">
      <div className="text-xs font-bold text-amber-400 font-mono flex items-center justify-center gap-1">
        <span>{chord}</span>
      </div>

      {shape ? (
        <div className="flex justify-center pt-1">
          {/* Simple 6-string Guitar Fretboard Grid Representation */}
          <div className="w-24 bg-neutral-900 border border-neutral-700 p-1.5 rounded text-[9px] font-mono">
            {shape.baseFret && shape.baseFret > 1 && (
              <div className="text-[8px] text-amber-400 font-bold text-left pl-1">
                Traste {shape.baseFret}
              </div>
            )}
            <div className="grid grid-cols-6 gap-0.5 my-1 text-neutral-400 border-b border-neutral-600 pb-0.5">
              {['E', 'A', 'D', 'G', 'B', 'E'].map((s, i) => (
                <span key={i} className="text-center">{s}</span>
              ))}
            </div>

            <div className="grid grid-cols-6 gap-0.5 my-1">
              {shape.frets.map((fret, stringIdx) => (
                <div key={stringIdx} className="flex flex-col items-center">
                  <span className={`font-bold ${
                    fret === -1 ? 'text-rose-400' : fret === 0 ? 'text-emerald-400' : 'text-amber-300'
                  }`}>
                    {fret === -1 ? 'x' : fret === 0 ? 'o' : fret}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-neutral-500 font-mono">
          [Acorde Estándar]
        </p>
      )}
    </div>
  );
}

// SAMPLE DEFAULT CHORD SHEETS FOR DEMO SONGS
function getSampleCifrado(song: Song): string {
  if (song.titulo.toLowerCase().includes('brisa') || song.titulo.toLowerCase().includes('rojitas')) {
    return `[Intro]
Lam   Fa   Sol   Lam
Lam   Fa   Sol   Lam

[Verso 1]
Lam                Fa
Que tiene tu veneno
             Sol                 Lam
Que me quita la vida, solo con un beso
            Fa                Sol
Y me lleva a la luna y me ofrece la droga
              Lam
Que todo lo cura.

[Estribillo]
Lam                Fa
Dependencia bendita
            Sol                 Lam
Invisible cadena que me ata a la vida
                 Fa               Sol
Y en momentos oscuros palmadita en la espalda
              Lam
Y ya estoy más seguro.

[Solo]
Fa   Sol   Lam   Lam
Fa   Sol   Lam   Lam

[Outro]
Fa        Sol        Lam
Rojitas las orejas...`;
  }

  return `[Intro]
Mim   Do   Re   Mim
Mim   Do   Re   Mim

[Verso 1]
[Mim] Arrancamos la noche en la [Do] ciudad
[Re] Buscando el sonido de la [Mim] libertad
[Mim] Guitarras encendidas y el [Do] viento a favor
[Re] Marcando el ritmo con el [Mim] corazón.

[Estribillo]
[Sol] Siente la fuerza del [Re] rock en las venas
[Mim] Rompiendo juntos todas las [Do] cadenas
[Sol] Noche de garaje, [Re] fuego y pasión
[Mim] Cantando juntos la [Do] misma canción.

[Solo]
Mim   Do   Re   Mim

[Outro]
[Mim] Cierre con final seco en [Do] [Re] [Mim]`;
}

function getSampleSubstituteGuide(song: Song): SongSubstituteGuide {
  return {
    estructura: 'Intro (4T) -> Verso 1 -> Estribillo -> Verso 2 -> Estribillo -> Solo de Guitarra -> Outro',
    progresionClave: 'Verso: Mim - Do - Re - Mim | Estribillo: Sol - Re - Mim - Do',
    cortesYClaves: 'Corte seco en el compás 8 del solo. Entrada de voz sola en el verso 2.',
    capoTraste: 'Sin Capo / Afinación Standard E',
    instrumentosClave: 'Entrada potente de vientos en el estribillo. Redoble de batería para paso a solo.'
  };
}
