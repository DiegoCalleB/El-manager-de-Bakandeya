import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { BandContact, BandRelationshipStatus } from '../types';
import { MapPin, Navigation, Check, Loader2, Layers, Music, Handshake, Repeat, Zap, Clock, Radio, X } from 'lucide-react';

interface BandMapProps {
  bands: BandContact[];
  onSelectBand: (band: BandContact) => void;
  isStitchLight?: boolean;
}

type MapStyleKey = 'voyager' | 'satellite' | 'osm' | 'positron' | 'dark';

const MAP_STYLES: Record<MapStyleKey, { name: string; url: string; attr: string }> = {
  voyager: {
    name: '🗺️ Callejero Claro (Recomendado)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attr: '&copy; OpenStreetMap &copy; CARTO'
  },
  satellite: {
    name: '🛰️ Satélite Híbrido',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri World Imagery'
  },
  osm: {
    name: '🏙️ OpenStreetMap Detallado',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap'
  },
  positron: {
    name: '⚪ Gris Minimalista',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; CARTO'
  },
  dark: {
    name: '🌙 Oscuro Nocturno',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; CARTO'
  }
};

// Pre-loaded coordinates dictionary for Spanish cities, towns, and provinces
const SPANISH_CITIES_GEO: Record<string, [number, number]> = {
  'Ávila': [40.6565, -4.6818],
  'Avila': [40.6565, -4.6818],
  'Madrid': [40.4168, -3.7038],
  'Barcelona': [41.3851, 2.1734],
  'Valencia': [39.4699, -0.3763],
  'Sevilla': [37.3891, -5.9845],
  'Zaragoza': [41.6488, -0.8896],
  'Málaga': [36.7213, -4.4214],
  'Malaga': [36.7213, -4.4214],
  'Murcia': [37.9922, -1.1307],
  'Palma': [39.5696, 2.6502],
  'Las Palmas': [28.1235, -15.4363],
  'Bilbao': [43.2630, -2.9350],
  'Alicante': [38.3452, -0.4810],
  'Córdoba': [37.8882, -4.7794],
  'Cordoba': [37.8882, -4.7794],
  'Valladolid': [41.6523, -4.7245],
  'Vigo': [42.2406, -8.7207],
  'Gijón': [43.5357, -5.6615],
  'Gijon': [43.5357, -5.6615],
  'Granada': [37.1773, -3.5986],
  'A Coruña': [43.3623, -8.4115],
  'Coruña': [43.3623, -8.4115],
  'Vitoria': [42.8467, -2.6716],
  'Vitoria-Gasteiz': [42.8467, -2.6716],
  'Badajoz': [38.8794, -6.9706],
  'Oviedo': [43.3614, -5.8593],
  'San Sebastián': [43.3183, -1.9812],
  'San Sebastian': [43.3183, -1.9812],
  'Donostia': [43.3183, -1.9812],
  'Pamplona': [42.8125, -1.6458],
  'Santander': [43.4623, -3.8099],
  'Burgos': [42.3440, -3.6969],
  'Salamanca': [40.9701, -5.6635],
  'Albacete': [38.9942, -1.8585],
  'Logroño': [42.4650, -2.4456],
  'Logrono': [42.4650, -2.4456],
  'Cáceres': [39.4753, -6.3723],
  'Caceres': [39.4753, -6.3723],
  'León': [42.5987, -5.5671],
  'Leon': [42.5987, -5.5671],
  'Cádiz': [36.5271, -6.2886],
  'Cadiz': [36.5271, -6.2886],
  'Jaén': [37.7796, -3.7849],
  'Jaen': [37.7796, -3.7849],
  'Ourense': [42.3358, -7.8639],
  'Lugo': [43.0099, -7.5560],
  'Girona': [41.9794, 2.8214],
  'Toledo': [39.8628, -4.0273],
  'Huelva': [37.2614, -6.9447],
  'Guadalajara': [40.6327, -3.1682],
  'Ciudad Real': [38.9863, -3.9273],
  'Zamora': [41.5063, -5.7446],
  'Segovia': [40.9429, -4.1088],
  'Cuenca': [40.0704, -2.1374],
  'Huesca': [42.1361, -0.4087],
  'Teruel': [40.3456, -1.1072],
  'Soria': [41.7640, -2.4688],
  'Almería': [36.8340, -2.4637],
  'Almeria': [36.8340, -2.4637],
  'Pontevedra': [42.4310, -8.6444],
  'Castellón': [39.9864, -0.0513],
  'Castellon': [39.9864, -0.0513],
  'Tarragona': [41.1189, 1.2445],
  'Reus': [41.1561, 1.1069],
  'Ontinyent': [38.8228, -0.6067],
  'Terrassa': [41.5632, 2.0089],
  'Sabadell': [41.5463, 2.1086],
  'Badalona': [41.4500, 2.2472],
  'Hospitalet': [41.3597, 2.1003],
  'Jerez': [36.6850, -6.1261],
  'Algeciras': [36.1308, -5.4488],
  'Merida': [38.9161, -6.3437],
  'Mérida': [38.9161, -6.3437],
  'Santiago': [42.8782, -8.5448],
  'Santiago de Compostela': [42.8782, -8.5448],
  'Andalucía': [37.5443, -4.7278],
  'Cataluña': [41.8205, 1.8401],
  'Galicia': [42.5751, -8.1339],
  'Comunidad de Madrid': [40.4168, -3.7038],
  'País Vasco': [43.0000, -2.6000]
};

function resolveBandCoordinates(band: BandContact, index: number): [number, number] {
  const rawLoc = (band.localizacion || band.ciudad_origen_swap || '').trim();

  if (SPANISH_CITIES_GEO[rawLoc]) {
    return offsetCoords(SPANISH_CITIES_GEO[rawLoc], index);
  }

  const parts = rawLoc.split(/[\(\-\/\,]/);
  for (const p of parts) {
    const trimmed = p.trim();
    if (SPANISH_CITIES_GEO[trimmed]) {
      return offsetCoords(SPANISH_CITIES_GEO[trimmed], index);
    }
  }

  const normLoc = rawLoc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, coords] of Object.entries(SPANISH_CITIES_GEO)) {
    const normKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normLoc.includes(normKey) || normKey.includes(normLoc)) {
      return offsetCoords(coords, index);
    }
  }

  let hash = 0;
  const seedStr = band.id + band.nombre_banda + rawLoc;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const lat = 37.5 + (Math.abs(hash) % 50) / 10;
  const lng = -6.0 + (Math.abs(hash >> 3) % 80) / 10;
  return [lat, lng];
}

function offsetCoords(base: [number, number], index: number): [number, number] {
  const angle = (index * 137.5) * (Math.PI / 180);
  const radius = 0.009 + (index % 5) * 0.005;
  return [base[0] + Math.sin(angle) * radius, base[1] + Math.cos(angle) * radius];
}

const GEO_CACHE: Record<string, [number, number]> = {};

function getStatusBadgeConfig(status: BandRelationshipStatus) {
  switch (status) {
    case 'colegas_aliados':
      return { text: '🤝 Colegas / Aliados', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    case 'concierto_agendado':
      return { text: '⚡ Concierto Agendado', color: '#d1b375', bg: 'rgba(209, 179, 117, 0.15)' };
    case 'intercambio_propuesto':
      return { text: '🔄 Date Swap Propuesto', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)' };
    case 'pendiente_respuesta':
      return { text: '⏳ Pendiente Respuesta', color: '#d946ef', bg: 'rgba(217, 70, 239, 0.15)' };
    case 'no_disponible':
      return { text: '❌ No Disponible', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };
    case 'sin_contactar':
    default:
      return { text: '📡 Sin Contactar', color: '#a3a3a3', bg: 'rgba(163, 163, 163, 0.15)' };
  }
}

export const BandMap: React.FC<BandMapProps> = ({
  bands,
  onSelectBand,
  isStitchLight = false
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroup = useRef<any>(null);

  const [mapStyle, setMapStyle] = useState<MapStyleKey>('voyager');
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);
  const [geoPositions, setGeoPositions] = useState<Record<string, [number, number]>>({});
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      const map = L.map(mapRef.current, {
        center: [40.4168, -3.7038],
        zoom: 6,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const currentPreset = MAP_STYLES[mapStyle];
      const layer = L.tileLayer(currentPreset.url, {
        attribution: currentPreset.attr,
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = layer;

      const clusterGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 50,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          const size = 42;
          const bgColor = '#f2ca50';
          const textColor = '#3c2f00';

          return L.divIcon({
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${bgColor};
                color: ${textColor};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-weight: 800;
                font-family: monospace;
                font-size: 13px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
              ">
                ${count}
              </div>
            `,
            className: 'custom-cluster-badge',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
          });
        }
      });

      markersGroup.current = clusterGroup;
      map.addLayer(clusterGroup);
      leafletMap.current = map;
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        tileLayerRef.current = null;
        markersGroup.current = null;
      }
    };
  }, []);

  // Map Tile Style Updates
  useEffect(() => {
    if (!leafletMap.current) return;
    if (tileLayerRef.current && leafletMap.current.hasLayer(tileLayerRef.current)) {
      leafletMap.current.removeLayer(tileLayerRef.current);
    }
    const currentPreset = MAP_STYLES[mapStyle];
    if (currentPreset && leafletMap.current) {
      const layer = L.tileLayer(currentPreset.url, {
        attribution: currentPreset.attr,
        maxZoom: 19
      }).addTo(leafletMap.current);
      tileLayerRef.current = layer;
    }
  }, [mapStyle]);

  // Geocode Bands
  useEffect(() => {
    let isSubscribed = true;

    const resolveCoords = async () => {
      setIsGeocoding(true);
      const newCoords: Record<string, [number, number]> = {};
      const pending: { band: BandContact; index: number }[] = [];

      bands.forEach((band, index) => {
        const fullKey = `${band.nombre_banda}-${band.localizacion}`.toLowerCase();
        if (GEO_CACHE[fullKey]) {
          newCoords[band.id] = GEO_CACHE[fullKey];
        } else {
          const coords = resolveBandCoordinates(band, index);
          newCoords[band.id] = coords;
          if (!SPANISH_CITIES_GEO[band.localizacion.trim()]) {
            pending.push({ band, index });
          }
        }
      });

      if (isSubscribed) {
        setGeoPositions(prev => ({ ...prev, ...newCoords }));
        setIsGeocoding(false);
      }

      for (const item of pending) {
        if (!isSubscribed) break;
        const { band } = item;
        const query = `${band.nombre_banda}, ${band.localizacion}, España`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
            headers: { 'Accept-Language': 'es' }
          });
          const data = await res.json();
          if (data && data[0]) {
            const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            const fullKey = `${band.nombre_banda}-${band.localizacion}`.toLowerCase();
            GEO_CACHE[fullKey] = coords;
            if (isSubscribed) {
              setGeoPositions(prev => ({ ...prev, [band.id]: coords }));
            }
          }
        } catch (err) {
          // Keep static geocode
        }
        await new Promise(r => setTimeout(r, 400));
      }
    };

    resolveCoords();

    return () => {
      isSubscribed = false;
    };
  }, [bands]);

  // Render Markers
  useEffect(() => {
    if (!leafletMap.current || !markersGroup.current) return;

    markersGroup.current.clearLayers();
    const bounds = L.latLngBounds([]);
    let validCount = 0;

    bands.forEach(band => {
      const pos = geoPositions[band.id];
      if (!pos) return;

      bounds.extend(pos);
      validCount++;

      const badgeCfg = getStatusBadgeConfig(band.estado_relacion);

      const bandIconHtml = band.imagen_url ? `
        <img src="${band.imagen_url}" style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid white;
          margin-right: 4px;
        " />
      ` : `
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: ${badgeCfg.color};
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          margin-right: 4px;
        ">
          ${band.icono || '🎸'}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-band-pin',
        html: `
          <div style="
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transform: translate(-10px, -15px);
          ">
            <div style="
              display: inline-flex;
              align-items: center;
              background: #18181b;
              border: 1.5px solid ${badgeCfg.color};
              border-radius: 20px;
              padding: 3px 8px 3px 4px;
              box-shadow: 0 4px 14px rgba(0,0,0,0.5);
              white-space: nowrap;
            ">
              ${bandIconHtml}
              <span style="
                font-family: system-ui, sans-serif;
                font-size: 11px;
                font-weight: 700;
                color: #f5f5f5;
              ">
                ${band.nombre_banda}
              </span>
            </div>
          </div>
        `,
        iconSize: [140, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker(pos, { icon: customIcon });

      const popupHtml = document.createElement('div');
      popupHtml.className = 'font-sans p-1 min-w-[220px] text-zinc-800';
      popupHtml.innerHTML = `
        <div style="font-family: system-ui, sans-serif;">
          <div style="font-size: 14px; font-weight: 800; color: #09090b; margin-bottom: 2px;">
            ${band.nombre_banda}
          </div>
          <div style="font-size: 11px; color: #52525b; margin-bottom: 6px;">
            📍 ${band.localizacion}
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #d1b375; margin-bottom: 8px;">
            🎵 ${band.estilo_musical}
          </div>
          <div style="margin-bottom: 8px;">
            <span style="
              background: ${badgeCfg.bg};
              color: ${badgeCfg.color};
              font-size: 10px;
              font-family: monospace;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 6px;
              display: inline-block;
            ">
              ${badgeCfg.text}
            </span>
          </div>
          ${band.contacto_nombre ? `
            <div style="font-size: 11px; color: #27272a; margin-bottom: 4px;">
              👤 <strong>Contacto:</strong> ${band.contacto_nombre}
            </div>
          ` : ''}
          ${band.email ? `
            <div style="font-size: 10px; font-family: monospace; color: #0284c7; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis;">
              ✉️ ${band.email}
            </div>
          ` : ''}
          <div style="margin-top: 10px;">
            <button id="pop-band-select-${band.id}" style="
              width: 100%;
              background: #18181b;
              color: #f2ca50;
              border: 1px solid #3f3f46;
              padding: 6px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: bold;
              font-family: monospace;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
            ">
              📋 Ver Ficha Técnica
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`pop-band-select-${band.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectBand(band);
          };
        }
      });

      marker.addTo(markersGroup.current);
    });

    if (validCount > 0 && leafletMap.current) {
      leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [geoPositions, bands]);

  // Handle Resize
  useEffect(() => {
    if (!leafletMap.current || !mapRef.current) return;
    const observer = new ResizeObserver(() => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const handleRecenter = () => {
    if (!leafletMap.current || Object.keys(geoPositions).length === 0) return;
    const bounds = L.latLngBounds([]);
    (Object.values(geoPositions) as [number, number][]).forEach(pos => bounds.extend(pos));
    leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  };

  return (
    <div className="relative w-full h-[550px] sm:h-[650px] rounded-2xl overflow-hidden shadow-lg border border-neutral-800">
      {/* Map Element */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pointer-events-none">
        <div className={`pointer-events-auto px-3.5 py-2 rounded-xl backdrop-blur-md shadow-md flex items-center gap-2 font-mono text-xs ${
          isStitchLight ? 'bg-white/90 text-slate-900' : 'bg-zinc-900/90 text-zinc-100'
        }`}>
          <MapPin className="w-4 h-4 text-[#f2ca50] animate-bounce" />
          <div>
            <span className="font-bold">Mapa de Bandas Amigas</span>
            <span className="ml-2 text-[10px] opacity-75">
              ({bands.length} {bands.length === 1 ? 'banda' : 'bandas'})
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 relative">
          {isGeocoding && (
            <div className="px-3 py-1.5 rounded-xl backdrop-blur-md text-[10px] font-mono flex items-center gap-1.5 bg-amber-950/90 text-amber-200">
              <Loader2 className="w-3 h-3 animate-spin text-[#f2ca50]" />
              <span>Geolocalizando bandas...</span>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className={`px-3 py-2 rounded-xl backdrop-blur-md font-mono text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                isStitchLight ? 'bg-white/95 text-slate-800' : 'bg-zinc-900/95 text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#f2ca50]" />
              <span>Capa</span>
            </button>

            {showStyleMenu && (
              <div className="absolute right-0 top-11 w-60 p-2 rounded-xl shadow-2xl backdrop-blur-md space-y-1 font-mono text-xs z-[1100] bg-zinc-900/95 text-zinc-200">
                {(Object.keys(MAP_STYLES) as MapStyleKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => {
                      setMapStyle(key);
                      setShowStyleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      mapStyle === key ? 'bg-[#f2ca50] text-[#3c2f00]' : 'hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <span>{MAP_STYLES[key].name}</span>
                    {mapStyle === key && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleRecenter}
            className={`px-3 py-2 rounded-xl backdrop-blur-md font-mono text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              isStitchLight ? 'bg-white/90 text-slate-800' : 'bg-zinc-900/90 text-zinc-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-[#f2ca50]" />
            <span>Centrar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BandMap;
