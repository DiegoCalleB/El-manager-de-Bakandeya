import React, { useState } from 'react';
import { Search, MapPin, Phone, Globe, Star, Sparkles, Check, Loader2, X, PlusCircle, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Lead } from '../../types';
import { apiFetch } from '../../utils/api';

export interface PlaceResult {
  place_id: string;
  nombre_sala: string;
  ciudad: string;
  region: string;
  direccion: string;
  telefono: string;
  website: string;
  rating?: number | null;
  user_ratings_total?: number | null;
  tipo: string;
  imagen_url?: string;
  icono?: string;
  email_contacto?: string;
  instagram?: string;
  contacto_nombre?: string;
  fuente?: string;
  selected?: boolean;
  extractingEmail?: boolean;
}

interface GooglePlacesExplorerModalProps {
  isOpen: boolean;
  isStitchLight: boolean;
  onClose: () => void;
  onImportLeads: (leads: Lead[]) => void;
}

const QUICK_CITIES = [
  'Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Málaga', 'Bilbao', 
  'Granada', 'Zaragoza', 'Huelva', 'Alicante', 'Santiago', 'Vigo'
];

export function GooglePlacesExplorerModal({
  isOpen,
  isStitchLight,
  onClose,
  onImportLeads
}: GooglePlacesExplorerModalProps) {
  const [searchQuery, setSearchQuery] = useState('Salas de conciertos y festivales en Sevilla');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('Sala');

  const [isSearching, setIsSearching] = useState(false);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [searchSource, setSearchSource] = useState('');
  const [searchError, setSearchError] = useState('');

  const [isExtractingBatch, setIsExtractingBatch] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || searchQuery;
    if (!q.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setImportSuccessMsg('');
    setExtractStatus('');

    try {
      const res = await apiFetch('/api/leads/places-search', {
        method: 'POST',
        body: JSON.stringify({
          query: q,
          ciudad: selectedCity,
          tipo: selectedType
        })
      });

      if (res.success && Array.isArray(res.results)) {
        const mapped = res.results.map((p: any) => ({
          ...p,
          selected: true
        }));
        setPlaces(mapped);
        setSearchSource(res.source || (res.isPlacesApi ? 'Google Places API Direct' : 'Gemini Search Grounding'));
      } else {
        setSearchError(res.error || 'No se encontraron resultados para la búsqueda.');
      }
    } catch (err: any) {
      console.error('Error en Places Search:', err);
      setSearchError(err.message || 'Error de red al conectar con Google Places API.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickCityClick = (city: string) => {
    setSelectedCity(city);
    const q = `Salas de concierto y festivales en ${city}, España`;
    setSearchQuery(q);
    handleSearch(q);
  };

  const toggleSelectPlace = (placeId: string) => {
    setPlaces(prev =>
      prev.map(p => (p.place_id === placeId ? { ...p, selected: !p.selected } : p))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = places.every(p => p.selected);
    setPlaces(prev => prev.map(p => ({ ...p, selected: !allSelected })));
  };

  // Single venue email extraction
  const handleExtractSingleEmail = async (placeId: string) => {
    const target = places.find(p => p.place_id === placeId);
    if (!target) return;

    setPlaces(prev =>
      prev.map(p => (p.place_id === placeId ? { ...p, extractingEmail: true } : p))
    );

    try {
      const res = await apiFetch('/api/leads/extract-emails', {
        method: 'POST',
        body: JSON.stringify({
          places: [
            {
              place_id: target.place_id,
              nombre_sala: target.nombre_sala,
              ciudad: target.ciudad,
              website: target.website
            }
          ]
        })
      });

      if (res.success && Array.isArray(res.extracted) && res.extracted.length > 0) {
        const item = res.extracted[0];
        setPlaces(prev =>
          prev.map(p =>
            p.place_id === placeId
              ? {
                  ...p,
                  email_contacto: item.email_contacto || p.email_contacto || '',
                  instagram: item.instagram || p.instagram || '',
                  contacto_nombre: item.contacto_nombre || p.contacto_nombre || '',
                  extractingEmail: false
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Error extrayendo email individual:', err);
      setPlaces(prev =>
        prev.map(p => (p.place_id === placeId ? { ...p, extractingEmail: false } : p))
      );
    }
  };

  // Batch email extraction for selected places lacking email
  const handleExtractBatchEmails = async () => {
    const selectedPlaces = places.filter(p => p.selected);
    if (selectedPlaces.length === 0) return;

    setIsExtractingBatch(true);
    setExtractStatus(`Investigando webs y extrayendo correos de ${selectedPlaces.length} recintos con IA...`);

    try {
      const res = await apiFetch('/api/leads/extract-emails', {
        method: 'POST',
        body: JSON.stringify({
          places: selectedPlaces.map(p => ({
            place_id: p.place_id,
            nombre_sala: p.nombre_sala,
            ciudad: p.ciudad,
            website: p.website
          }))
        })
      });

      if (res.success && Array.isArray(res.extracted)) {
        const emailMap = new Map<string, any>();
        res.extracted.forEach((item: any) => {
          if (item.id) emailMap.set(item.id, item);
          if (item.nombre_sala) emailMap.set(item.nombre_sala.toLowerCase().trim(), item);
        });

        setPlaces(prev =>
          prev.map(p => {
            const match = emailMap.get(p.place_id) || emailMap.get(p.nombre_sala.toLowerCase().trim());
            if (match && match.email_contacto) {
              return {
                ...p,
                email_contacto: match.email_contacto,
                instagram: match.instagram || p.instagram,
                contacto_nombre: match.contacto_nombre || p.contacto_nombre
              };
            }
            return p;
          })
        );

        setExtractStatus(`✨ Proceso completado: Extraídos ${res.extractedCount} correos electrónicos verificados.`);
      }
    } catch (err: any) {
      console.error('Error extrayendo lote de emails:', err);
      setExtractStatus(`⚠️ Error al extraer emails: ${err.message || 'Fallo de conexión'}`);
    } finally {
      setIsExtractingBatch(false);
    }
  };

  // Import selected places directly to CRM & Google Sheets
  const handleImportToCRM = async () => {
    const selectedPlaces = places.filter(p => p.selected);
    if (selectedPlaces.length === 0) return;

    setIsImporting(true);
    setImportSuccessMsg('');

    try {
      const res = await apiFetch('/api/leads/import-places', {
        method: 'POST',
        body: JSON.stringify({
          leads: selectedPlaces
        })
      });

      if (res.success) {
        setImportSuccessMsg(`🎉 ¡${res.importedCount} salas y festivales importados con éxito a tu CRM y sincronizados con Google Sheets!`);
        if (Array.isArray(res.leads)) {
          onImportLeads(res.leads);
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      console.error('Error al importar recintos:', err);
      setSearchError(`Error al guardar en el CRM: ${err.message || 'Fallo del servidor'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = places.filter(p => p.selected).length;
  const emailsFoundCount = places.filter(p => p.email_contacto && p.email_contacto.trim() !== '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${
          isStitchLight
            ? 'bg-white text-slate-800 border-slate-200'
            : 'bg-[#18181b] text-[#e5e2e1] border-zinc-800'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#f2ca50]/10 border border-[#f2ca50]/30 text-[#f2ca50]">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display uppercase tracking-wider text-[#f2ca50]">
                  Explorador Google Places & Extraedor de Emails IA
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                  API Places + Extraedor
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Descubre salas de conciertos y festivales reales en cualquier ciudad de España y extrae sus correos de contacto verificados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Search Bar */}
          <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Ej. Salas de conciertos en Málaga, Festivales en Galicia, Teatros en Madrid..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#f2ca50]"
                />
              </div>

              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-[#f2ca50]"
              >
                <option value="Sala">🏛️ Salas de Concierto</option>
                <option value="Festival">🎪 Festivales</option>
                <option value="Discoteca">🪩 Discotecas / Clubs</option>
                <option value="Medio">📻 Medios de Prensa / Radio</option>
              </select>

              <button
                onClick={() => handleSearch()}
                disabled={isSearching}
                className="px-4 py-2 bg-[#f2ca50] hover:bg-[#d8b03e] text-[#2c2200] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{isSearching ? 'Buscando...' : 'Buscar'}</span>
              </button>
            </div>

            {/* Quick City Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-1">Ciudades rápidas:</span>
              {QUICK_CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => handleQuickCityClick(city)}
                  className={`px-2.5 py-0.5 text-[10px] rounded-lg transition-all cursor-pointer font-medium ${
                    selectedCity === city
                      ? 'bg-[#f2ca50] text-[#3c2f00] font-bold'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Status / Errors / Search Source */}
          {searchSource && (
            <div className="flex items-center justify-between text-[11px] px-2 text-zinc-400">
              <span>
                Fuente de búsqueda: <strong className="text-[#f2ca50]">{searchSource}</strong>
              </span>
              <span>
                Encontrados: <strong className="text-white">{places.length}</strong> | Con email: <strong className="text-emerald-400">{emailsFoundCount}</strong>
              </span>
            </div>
          )}

          {searchError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {extractStatus && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 animate-pulse" />
              <span>{extractStatus}</span>
            </div>
          )}

          {importSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{importSuccessMsg}</span>
            </div>
          )}

          {/* Places Results List */}
          {places.length > 0 ? (
            <div className="space-y-3">
              {/* Batch Actions Bar */}
              <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={places.length > 0 && places.every(p => p.selected)}
                      onChange={toggleSelectAll}
                      className="rounded accent-[#f2ca50] cursor-pointer"
                    />
                    <span>Seleccionar todos ({selectedCount}/{places.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExtractBatchEmails}
                    disabled={isExtractingBatch || selectedCount === 0}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Investiga las webs de las salas seleccionadas para hallar sus correos de contacto oficiales con IA"
                  >
                    {isExtractingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>✨ Extraer Emails con IA ({selectedCount})</span>
                  </button>

                  <button
                    onClick={handleImportToCRM}
                    disabled={isImporting || selectedCount === 0}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    <span>📥 Importar Seleccionados ({selectedCount})</span>
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {places.map(place => (
                  <div
                    key={place.place_id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                      place.selected
                        ? 'bg-zinc-900 border-[#f2ca50]/50 shadow-lg'
                        : 'bg-zinc-950/60 border-zinc-800/80 opacity-70'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={place.selected || false}
                            onChange={() => toggleSelectPlace(place.place_id)}
                            className="mt-1 rounded accent-[#f2ca50] cursor-pointer"
                          />
                          {place.imagen_url ? (
                            <img
                              src={place.imagen_url}
                              alt={place.nombre_sala}
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg shrink-0">
                              {place.icono || '🏛️'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-zinc-100 truncate">
                              {place.nombre_sala}
                            </h4>
                            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#f2ca50] shrink-0" />
                              <span className="truncate">{place.ciudad} ({place.region})</span>
                            </p>
                          </div>
                        </div>

                        {place.rating && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md text-[10px] font-bold shrink-0">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{place.rating}</span>
                            {place.user_ratings_total && (
                              <span className="text-[8px] text-zinc-400">({place.user_ratings_total})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Address & Phone */}
                      <div className="text-[10px] text-zinc-400 space-y-1 bg-zinc-950 p-2 rounded-lg border border-zinc-800/60 font-mono">
                        {place.direccion && (
                          <p className="truncate text-zinc-300">{place.direccion}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-zinc-400">
                          {place.telefono && (
                            <a href={`tel:${place.telefono}`} className="flex items-center gap-1 hover:text-white">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{place.telefono}</span>
                            </a>
                          )}
                          {place.website && (
                            <a
                              href={place.website}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-sky-400 hover:underline truncate max-w-[200px]"
                            >
                              <Globe className="w-3 h-3" />
                              <span className="truncate">{place.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Email Status & Extractor */}
                      <div className="pt-1">
                        {place.email_contacto ? (
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between font-mono">
                            <div className="flex items-center gap-1.5 truncate">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-bold truncate">{place.email_contacto}</span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded uppercase font-bold shrink-0">
                              Verificado
                            </span>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] flex items-center justify-between gap-2">
                            <span className="text-zinc-500 italic">Sin correo extraído aún</span>
                            <button
                              onClick={() => handleExtractSingleEmail(place.place_id)}
                              disabled={place.extractingEmail}
                              className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              {place.extractingEmail ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                              )}
                              <span>{place.extractingEmail ? 'Buscando...' : '✨ Extraer Email'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !isSearching ? (
            <div className="p-12 text-center space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
              <Building2 className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-300">Explora salas y festivales de España</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Haz una búsqueda por ciudad o género. Obtendrás datos reales de Google Places (dirección, teléfono, foto, reseñas) y nuestro agente IA investigará sus páginas para extraer los emails de contacto oficiales.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
