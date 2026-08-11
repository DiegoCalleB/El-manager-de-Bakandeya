import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Shirt, Tag, QrCode, Download, RefreshCw, Wand2, Type, Upload, Trash2, Scissors, Layers, Plus } from 'lucide-react';
import { ThemeColors, ThemeName } from '../types';
import QRCode from 'react-qr-code';
import { resolveAudioUrl, uploadFileToServer } from '../utils/audioStorage';

const ResolvedBgImage: React.FC<{ url: string, className?: string, style?: React.CSSProperties, onClick?: () => void }> = ({ url, className, style, onClick }) => {
  const [resolved, setResolved] = useState<string | null>(null);
  useEffect(() => {
    if (url) {
      resolveAudioUrl(url).then(res => setResolved(res)).catch(() => setResolved(null));
    } else {
      setResolved(null);
    }
  }, [url]);

  return <div className={className} style={{ ...style, backgroundImage: resolved ? `url(${resolved})` : 'none' }} onClick={onClick} />;
};

const isLightColor = (hex: string) => {
  const hexColor = hex.replace('#', '');
  if (hexColor.length !== 6) return false;
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
};

// Canvas background removal helper (recorte de fondo sin distorsión por capas)
async function processBackgroundRemoval(imageUrl: string, mode: 'white' | 'black' | 'none'): Promise<string> {
  if (mode === 'none') return imageUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageUrl);
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (mode === 'white' && r > 225 && g > 225 && b > 225) {
            data[i + 3] = 0; // Alpha 0
          } else if (mode === 'black' && r < 30 && g < 30 && b < 30) {
            data[i + 3] = 0; // Alpha 0
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn("Canvas background processing error:", err);
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

const SHIRT_COLORS = [
  { id: '#121111', name: 'Negro Noche' },
  { id: '#ffffff', name: 'Blanco Puro' },
  { id: '#4b5563', name: 'Gris Asfalto' },
  { id: '#7f1d1d', name: 'Rojo Vino' },
  { id: '#1e3a8a', name: 'Azul Marino' },
  { id: '#14532d', name: 'Verde Bosque' },
  { id: '#f59e0b', name: 'Ámbar (Bakandeya)' }
];

interface MerchanProps {
  colors: ThemeColors;
  currentTheme: ThemeName;
}

export default function Merchan({ colors, currentTheme }: MerchanProps) {
  const isStitchLight = false;
  
  const [productType, setProductType] = useState<'camiseta' | 'pegatina'>('camiseta');
  const [assetType, setAssetType] = useState<'logo' | 'portada' | 'custom'>('logo');
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [removeBgMode, setRemoveBgMode] = useState<'none' | 'white' | 'black'>('white');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);
  const [qrUrl, setQrUrl] = useState('https://instagram.com/bakandeya');
  const [shirtColor, setShirtColor] = useState('#121111');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesigns, setGeneratedDesigns] = useState<{
    id: string;
    type: string;
    url: string;
    processedUrl?: string;
    bg: string;
    text: string;
    assetType: string;
    shirtColor?: string;
    qrUrl?: string;
    date: string;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('bakandeya_merchan_designs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [albums, setAlbums] = useState<{name: string, url: string}[]>([
    { name: "Bakandeya (2025)", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80" },
    { name: "EP Cacharros", url: "https://images.unsplash.com/photo-1493225457124-a1a2a5f590bc?w=500&q=80" }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bakandeya_songs_catalog');
      if (saved) {
        const songs = JSON.parse(saved);
        const albumsMap = new Map<string, string>();
        songs.forEach((s: any) => {
          if (s.albumDisco && s.portadaUrl && s.portadaUrl !== '') {
            if (!albumsMap.has(s.albumDisco)) {
              albumsMap.set(s.albumDisco, s.portadaUrl);
            }
          }
        });
        
        if (albumsMap.size > 0) {
          const loadedAlbums = Array.from(albumsMap.entries()).map(([name, url]) => ({ name, url }));
          setAlbums(loadedAlbums);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bakandeya_merchan_designs', JSON.stringify(generatedDesigns));
  }, [generatedDesigns]);

  const handleDelete = (id: string) => {
    setGeneratedDesigns(prev => prev.filter(d => d.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('¿Seguro que deseas vaciar la galería de diseños de merchandising?')) {
      setGeneratedDesigns([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const serverUrl = await uploadFileToServer(file);
      setCustomImageUrl(serverUrl);
      setAssetType('custom');
    } catch (err) {
      console.error("Error al subir imagen:", err);
      // Fallback to local FileReader
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCustomImageUrl(ev.target.result as string);
          setAssetType('custom');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    let rawGraphicUrl = '/logo_bakandeya.jpg';
    if (assetType === 'portada' && albums[selectedAlbumIndex]) {
      rawGraphicUrl = albums[selectedAlbumIndex].url;
    } else if (assetType === 'custom' && customImageUrl) {
      rawGraphicUrl = customImageUrl;
    }

    // Process layer transparency on canvas before composition
    const processedUrl = await processBackgroundRemoval(rawGraphicUrl, removeBgMode);

    setTimeout(() => {
      const newDesign = {
        id: Date.now().toString(),
        type: productType,
        url: rawGraphicUrl,
        processedUrl: processedUrl,
        bg: 'bg-black',
        text: 'Generado con Capas Canvas',
        assetType,
        shirtColor: productType === 'camiseta' ? shirtColor : undefined,
        qrUrl: productType === 'pegatina' ? qrUrl : undefined,
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      };
      setGeneratedDesigns([newDesign, ...generatedDesigns]);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-wider font-display flex items-center gap-3 ${
            isStitchLight ? 'text-slate-900' : 'text-neutral-100'
          }`}>
            <Sparkles className={`w-8 h-8 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} />
            Taller de Merchandising IA
          </h1>
          <p className={`text-xs sm:text-sm font-mono max-w-2xl leading-relaxed ${
            isStitchLight ? 'text-slate-500' : 'text-neutral-400'
          }`}>
            Diseña camisetas y pegatinas oficiales con recorte de fondo automático por capas Canvas (sin distorsión de la prenda), subida de imágenes propias e integración de QR.
          </p>
        </div>
        {generatedDesigns.length > 0 && (
          <button
            onClick={handleClearAll}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono font-bold flex items-center gap-2 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Vaciar Galería ({generatedDesigns.length})
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel de Control */}
        <div className={`lg:col-span-4 p-5 rounded-2xl shadow-xl space-y-6 h-fit ${
          isStitchLight ? 'bg-white border border-slate-200' : 'bg-[#121111] border border-neutral-800'
        }`}>
          
          <div className="space-y-3">
            <label className={`block text-[10px] uppercase font-mono font-bold tracking-wider ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              1. Tipo de Producto
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setProductType('camiseta')}
                className={`py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase flex flex-col items-center justify-center gap-2 transition-all ${
                  productType === 'camiseta'
                    ? (isStitchLight ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-[#f2ca50] text-[#121111] shadow-lg shadow-[#f2ca50]/10')
                    : (isStitchLight ? 'bg-slate-50 text-slate-500 hover:bg-slate-100' : 'bg-[#1a1919] text-neutral-400 hover:bg-[#252525]')
                }`}
              >
                <Shirt className="w-6 h-6" />
                Camiseta
              </button>
              <button
                onClick={() => setProductType('pegatina')}
                className={`py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase flex flex-col items-center justify-center gap-2 transition-all ${
                  productType === 'pegatina'
                    ? (isStitchLight ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-[#f2ca50] text-[#121111] shadow-lg shadow-[#f2ca50]/10')
                    : (isStitchLight ? 'bg-slate-50 text-slate-500 hover:bg-slate-100' : 'bg-[#1a1919] text-neutral-400 hover:bg-[#252525]')
                }`}
              >
                <Tag className="w-6 h-6" />
                Pegatina / Sticker
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className={`block text-[10px] uppercase font-mono font-bold tracking-wider ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              2. Origen del Arte Gráfico
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setAssetType('logo')}
                className={`py-2 px-2 rounded-lg font-mono text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-all ${
                  assetType === 'logo'
                    ? (isStitchLight ? 'bg-indigo-100 text-indigo-700 border-indigo-200 border' : 'bg-[#f2ca50]/15 text-[#f2ca50] border-[#f2ca50]/30 border')
                    : (isStitchLight ? 'bg-slate-50 text-slate-500 border-slate-200 border hover:bg-slate-100' : 'bg-neutral-900 text-neutral-400 border-neutral-800 border hover:bg-neutral-800')
                }`}
              >
                <Type className="w-4 h-4" />
                Logo Oficial
              </button>
              <button
                onClick={() => setAssetType('portada')}
                className={`py-2 px-2 rounded-lg font-mono text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-all ${
                  assetType === 'portada'
                    ? (isStitchLight ? 'bg-indigo-100 text-indigo-700 border-indigo-200 border' : 'bg-[#f2ca50]/15 text-[#f2ca50] border-[#f2ca50]/30 border')
                    : (isStitchLight ? 'bg-slate-50 text-slate-500 border-slate-200 border hover:bg-slate-100' : 'bg-neutral-900 text-neutral-400 border-neutral-800 border hover:bg-neutral-800')
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Álbum
              </button>
              <button
                onClick={() => {
                  setAssetType('custom');
                  if (!customImageUrl) fileInputRef.current?.click();
                }}
                className={`py-2 px-2 rounded-lg font-mono text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-all ${
                  assetType === 'custom'
                    ? (isStitchLight ? 'bg-indigo-100 text-indigo-700 border-indigo-200 border' : 'bg-[#f2ca50]/15 text-[#f2ca50] border-[#f2ca50]/30 border')
                    : (isStitchLight ? 'bg-slate-50 text-slate-500 border-slate-200 border hover:bg-slate-100' : 'bg-neutral-900 text-neutral-400 border-neutral-800 border hover:bg-neutral-800')
                }`}
              >
                <Upload className="w-4 h-4" />
                Propia
              </button>
            </div>

            {/* Hidden File Input for Custom Image */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Custom Upload Preview / Selector */}
          {assetType === 'custom' && (
            <div className={`p-4 rounded-xl border space-y-3 ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1a1919] border-neutral-800'}`}>
              <div className="flex items-center justify-between">
                <label className={`text-[10px] uppercase font-mono font-bold tracking-wider ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Imagen Personalizada Subida
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs font-mono font-bold text-amber-500 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {customImageUrl ? 'Cambiar' : 'Subir'}
                </button>
              </div>

              {customImageUrl ? (
                <div className="relative w-full h-28 rounded-lg overflow-hidden bg-center bg-contain bg-no-repeat border border-slate-700/50 bg-black/40" style={{ backgroundImage: `url(${customImageUrl})` }} />
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-24 rounded-lg border-2 border-dashed border-slate-700 hover:border-amber-500 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-amber-400 transition"
                >
                  {isUploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-mono">Seleccionar archivo de tu dispositivo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {assetType === 'portada' && (
            <div className={`p-4 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1a1919] border-neutral-800'}`}>
              <label className={`block text-[10px] uppercase font-mono font-bold tracking-wider mb-2 ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Selecciona Álbum / EP
              </label>
              <div className="flex overflow-x-auto gap-3 pb-2 snap-x">
                {albums.map((album, idx) => (
                  <ResolvedBgImage
                    key={idx}
                    onClick={() => setSelectedAlbumIndex(idx)}
                    className={`shrink-0 w-20 h-20 rounded-lg bg-cover bg-center border-2 transition-all snap-start cursor-pointer ${
                      selectedAlbumIndex === idx
                        ? (isStitchLight ? 'border-indigo-600 shadow-md' : 'border-[#f2ca50] shadow-md shadow-[#f2ca50]/20')
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                    url={album.url}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Opción de recorte de fondo / rembg */}
          <div className={`p-4 rounded-xl border space-y-2 ${isStitchLight ? 'bg-indigo-50/60 border-indigo-100' : 'bg-indigo-950/20 border-indigo-800/30'}`}>
            <label className={`block text-[10px] uppercase font-mono font-bold tracking-wider flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
              <Scissors className="w-3.5 h-3.5 text-amber-400" /> Recorte de Fondo (Canvas Layering)
            </label>
            <p className="text-[10px] font-mono text-slate-400">
              Aplica el arte directamente en capas sobre la tela sin redibujar la prenda.
            </p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { id: 'white', label: 'Eliminar Blanco' },
                { id: 'black', label: 'Eliminar Negro' },
                { id: 'none', label: 'Mantener Fondo' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setRemoveBgMode(m.id as any)}
                  className={`py-1.5 px-1 rounded text-[10px] font-mono font-bold transition ${
                    removeBgMode === m.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {productType === 'camiseta' && (
            <div className="space-y-3">
              <label className={`font-mono text-[10px] font-bold uppercase tracking-widest ${isStitchLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                3. Color de la Prenda
              </label>
              <div className="flex flex-wrap gap-2">
                {SHIRT_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setShirtColor(c.id)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${shirtColor === c.id ? (isStitchLight ? 'border-indigo-500 scale-110' : 'border-[#f2ca50] scale-110') : 'border-transparent shadow-sm'}`}
                    style={{ backgroundColor: c.id }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {productType === 'pegatina' && (
            <div className={`p-4 rounded-xl border space-y-3 ${isStitchLight ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-900/10 border-indigo-500/20'}`}>
              <label className={`block text-[10px] uppercase font-mono font-bold tracking-wider flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                <QrCode className="w-3.5 h-3.5" /> Link de redirección del QR
              </label>
              <input
                type="url"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="https://instagram.com/bakandeya"
                className={`w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none ${
                  isStitchLight 
                    ? 'bg-white border-indigo-200 text-slate-800 focus:border-indigo-500' 
                    : 'bg-neutral-950 border-indigo-500/30 text-neutral-100 focus:border-indigo-500'
                }`}
              />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 rounded-xl font-mono text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isGenerating
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:scale-[1.01] shadow-xl'
            } ${
              isStitchLight
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-indigo-500/20'
                : 'bg-gradient-to-br from-[#f2ca50] to-[#e0a820] text-[#121111] shadow-[#f2ca50]/10'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Procesando Capas Canvas...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generar Diseño Mockup
              </>
            )}
          </button>

        </div>

        {/* Zona de Vista Previa y Galería */}
        <div className={`lg:col-span-8 p-6 rounded-2xl shadow-xl space-y-6 min-h-[500px] flex flex-col ${
          isStitchLight ? 'bg-white border border-slate-200' : 'bg-[#121111] border border-neutral-800'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`font-mono text-xs uppercase font-bold tracking-widest flex items-center gap-2 ${isStitchLight ? 'text-slate-400' : 'text-neutral-500'}`}>
              <Layers className="w-4 h-4 text-amber-500" /> Galería de Diseños Producidos ({generatedDesigns.length})
            </h2>
          </div>

          <div className="flex-1">
            {generatedDesigns.length === 0 && !isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-10">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed ${
                  isStitchLight ? 'border-slate-300 bg-slate-50 text-slate-300' : 'border-neutral-700 bg-neutral-900 text-neutral-600'
                }`}>
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className={`font-display text-lg font-bold mb-1 ${isStitchLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                    El taller está listo
                  </p>
                  <p className={`font-mono text-xs max-w-sm ${isStitchLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                    Configura las opciones, sube tu imagen o selecciona un logo y pulsa "Generar Diseño Mockup" para previsualizar los resultados.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedDesigns.map((design) => {
                  const displayGraphic = design.processedUrl || design.url;
                  return (
                    <div key={design.id} className={`group relative rounded-2xl overflow-hidden aspect-square border border-slate-800/60 hover:border-amber-500/50 transition-all shadow-xl flex flex-col items-center justify-center p-6 ${design.type === 'camiseta' ? (isStitchLight ? 'bg-slate-100' : 'bg-slate-950') : (isStitchLight ? 'bg-neutral-100' : 'bg-neutral-900')}`}>
                      
                      {design.type === 'pegatina' ? (
                        <div className="w-52 h-52 bg-white shadow-2xl flex flex-col relative transform group-hover:scale-105 transition-transform duration-500 border-4 border-white rounded-lg overflow-hidden">
                          {design.assetType === 'portada' || design.assetType === 'custom' ? (
                            <ResolvedBgImage className="h-36 w-full bg-cover bg-center" url={displayGraphic} />
                          ) : (
                            <div className="h-36 w-full bg-[#121111] flex items-center justify-center p-2">
                              <div className="w-full h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${displayGraphic})`, filter: 'invert(1)' }} />
                            </div>
                          )}
                          <div className="h-16 w-full bg-white flex items-center justify-between px-3 border-t border-slate-100">
                            <div className="font-mono text-[10px] text-neutral-900 uppercase font-black leading-tight">
                              BAKANDEYA<br/><span className="text-amber-600">SCAN QR</span>
                            </div>
                            <div className="relative w-12 h-12 flex items-center justify-center">
                              <QRCode value={design.qrUrl || qrUrl} size={44} level="H" />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-3.5 h-3.5 bg-white rounded-sm flex items-center justify-center overflow-hidden border border-white p-0.5">
                                  <img src="/logo_bakandeya.jpg" alt="Logo" className="w-full h-full object-cover rounded-sm" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full relative flex flex-col items-center justify-center z-10 pt-2">
                          <div className="relative w-44 h-56 transform group-hover:scale-105 transition-transform duration-500">
                            {/* Left Sleeve */}
                            <div className="absolute top-1 -left-6 w-12 h-14 rounded-xl rotate-[20deg]" style={{ backgroundColor: design.shirtColor || '#121111', zIndex: 1 }} />
                            {/* Right Sleeve */}
                            <div className="absolute top-1 -right-6 w-12 h-14 rounded-xl -rotate-[20deg]" style={{ backgroundColor: design.shirtColor || '#121111', zIndex: 1 }} />
                            
                            {/* Main Body */}
                            <div className="absolute inset-0 rounded-2xl shadow-2xl flex flex-col items-center justify-start pt-9 overflow-hidden" style={{ backgroundColor: design.shirtColor || '#121111', zIndex: 2 }}>
                               {/* Neck cut-out */}
                               <div className="absolute -top-4 w-16 h-8 rounded-[50%]" style={{ backgroundColor: isStitchLight ? '#f1f5f9' : '#090d16', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3)' }} />
                               
                               {/* Graphic on Layer */}
                               {design.assetType === 'portada' ? (
                                 <ResolvedBgImage className="w-24 h-24 rounded-lg shadow-md bg-cover bg-center border border-neutral-800/30" url={displayGraphic} />
                               ) : (
                                 <div 
                                   className="w-28 h-28 bg-contain bg-center bg-no-repeat transition-all" 
                                   style={{ 
                                     backgroundImage: `url(${displayGraphic})`,
                                     filter: (design.assetType === 'logo' && !isLightColor(design.shirtColor || '#121111')) ? 'invert(1) drop-shadow(0 4px 6px rgba(0,0,0,0.5))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))'
                                   }} 
                                 />
                               )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-xs gap-3 z-30">
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = `merchan-bakandeya-${design.id}.png`;
                            link.href = displayGraphic;
                            link.click();
                          }}
                          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase flex items-center gap-2 shadow-lg transition ${
                            isStitchLight ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-[#f2ca50] text-[#121111] hover:bg-white'
                          }`}
                        >
                          <Download className="w-4 h-4" />
                          Descargar Gráfico
                        </button>
                        <button 
                          onClick={() => handleDelete(design.id)}
                          className="px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase flex items-center gap-2 bg-rose-600/90 text-white hover:bg-rose-600 shadow-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                      
                      <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-md text-[9px] font-mono uppercase font-bold z-20 ${
                        isStitchLight ? 'bg-white/90 text-slate-700 shadow-sm' : 'bg-slate-900/90 text-slate-300 border border-slate-800'
                      }`}>
                        {design.type} • {design.assetType === 'custom' ? 'Imagen propia' : design.assetType}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
