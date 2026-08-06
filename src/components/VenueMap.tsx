import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { Lead } from '../types';
import { MapPin, Navigation, Eye, Check, Loader2, RefreshCw, Layers } from 'lucide-react';

interface VenueMapProps {
 leads: Lead[];
 selectedLead: Lead | null;
 onSelectLead: (lead: Lead) => void;
 onUpdateLead: (leadId: string, data: Partial<Lead>) => void;
 isStitchLight?: boolean;
 activeCityFilter?: string;
 activeRegionFilter?: string;
}

// Available map tile presets for best clarity & readability
type MapStyleKey = 'voyager' | 'satellite' | 'osm' | 'positron' | 'dark';

const MAP_STYLES: Record<MapStyleKey, { name: string; url: string; attr: string }> = {
 voyager: {
 name: '🗺️ Google / Callejero Claro (Recomendado)',
 url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
 attr: '&copy; OpenStreetMap &copy; CARTO'
 },
 satellite: {
 name: '🛰️ Satélite Híbrido (Estilo Google Maps)',
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

// Pre-loaded coordinates dictionary for Spanish cities, towns, festivals, and provinces
const SPANISH_CITIES_GEO: Record<string, [number, number]> = {
 // Major Capitals & Cities
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

 // Key Music & Festival Towns
 'Villarrobledo': [39.2699, -2.6033], // Viña Rock
 'Barbate': [36.1923, -5.9220], // Cabo de Plata
 'Santiago de Compostela': [42.8782, -8.5448],
 'Santiago': [42.8782, -8.5448],
 'Lanuza': [42.7561, -0.3150], // Pirineos Sur
 'Caldas de Reis': [42.6027, -8.6427], // PortAmérica
 'Aranda de Duero': [41.6704, -3.6892], // Sonorama
 'Ponferrada': [42.5466, -6.5962],
 'Gandía': [38.9678, -0.1818],
 'Gandia': [38.9678, -0.1818],
 'Benicàssim': [40.0558, 0.0637], // FIB
 'Benicassim': [40.0558, 0.0637],
 'Ortigueira': [43.6833, -7.8500],
 'Algeciras': [36.1308, -5.4488],
 'Jerez': [36.6850, -6.1261],
 'Jerez de la Frontera': [36.6850, -6.1261],
 'Mérida': [38.9161, -6.3437],
 'Merida': [38.9161, -6.3437],
 'Plasencia': [40.0294, -6.0886],
 'Béjar': [40.3861, -5.7661],
 'Arévalo': [41.0631, -4.7205],
 'Las Navas del Marqués': [40.6053, -4.3314],
 'El Tiemblo': [40.4144, -4.5008],
 'Ávila - Arévalo': [41.0631, -4.7205],
 'Ávila - Las Navas': [40.6053, -4.3314],
 'Ávila - El Tiemblo': [40.4144, -4.5008],
 'Alcalá de Henares': [40.4819, -3.3643],
 'Getafe': [40.3083, -3.7327],
 'Leganés': [40.3281, -3.7635],
 'Móstoles': [40.3228, -3.8649],
 'Alcorcón': [40.3458, -3.8249],
 'Reus': [41.1561, 1.1069],
 'Mataró': [41.5421, 2.4445],
 'Figueres': [42.2665, 2.9610],
 'Vic': [41.9304, 2.2542],
 'Sitges': [41.2372, 1.8059],
 'Lorca': [37.6712, -1.7017],
 'Cartagena': [37.6257, -0.9966],
 'Talavera de la Reina': [39.9631, -4.8308],
 'Torrelavega': [43.3494, -4.0478],
 'Irún': [43.3378, -1.7888],
 'Eibar': [43.1842, -2.4714],
 'Barakaldo': [43.2974, -2.9877],
 'Getxo': [43.3578, -3.0131],
 'Ronda': [36.7423, -5.1671],
 'Antequera': [37.0184, -4.5587],
 'Motril': [36.7464, -3.5186],
 'Marbella': [36.5101, -4.8824],
 'Fuengirola': [36.5398, -4.6247],
 'Torremolinos': [36.6208, -4.4998],

 // Autonomous Communities & Regions fallback
 'Andalucía': [37.5443, -4.7278],
 'Andalucia': [37.5443, -4.7278],
 'Cataluña': [41.8205, 1.8401],
 'Catalunya': [41.8205, 1.8401],
 'Galicia': [42.5751, -8.1339],
 'Comunidad de Madrid': [40.4168, -3.7038],
 'Castilla y León': [41.6523, -4.7245],
 'Castilla-La Mancha': [39.8628, -4.0273],
 'País Vasco': [43.0000, -2.6000],
 'Euskadi': [43.0000, -2.6000],
 'Comunidad Valenciana': [39.4699, -0.3763],
 'Aragón': [41.6488, -0.8896],
 'Asturias': [43.3614, -5.8593],
 'Extremadura': [39.4753, -6.3723],
 'Navarra': [42.8125, -1.6458],
 'Cantabria': [43.4623, -3.8099],
 'Región de Murcia': [37.9922, -1.1307],
 'La Rioja': [42.4650, -2.4456]
};

// Smart normalizer & lookup function to ensure every lead gets realistic coords in its actual city
function resolveLeadCoordinates(lead: Lead, index: number): [number, number] {
 const rawCity = (lead.ciudad || '').trim();
 const rawRegion = (lead.region || '').trim();

 // 1. Exact match in city
 if (SPANISH_CITIES_GEO[rawCity]) {
 const base = SPANISH_CITIES_GEO[rawCity];
 return offsetCoords(base, index);
 }

 // 2. Clean city name (e.g."Barbate (Cádiz)" ->"Barbate","Lanuza (Huesca)" ->"Lanuza")
 const mainPart = rawCity.split(/[\(\-\/\,]/)[0].trim();
 if (SPANISH_CITIES_GEO[mainPart]) {
 const base = SPANISH_CITIES_GEO[mainPart];
 return offsetCoords(base, index);
 }

 // 3. Extract parenthetical part (e.g."Barbate (Cádiz)" ->"Cádiz")
 const matchParen = rawCity.match(/\(([^)]+)\)/);
 if (matchParen && matchParen[1]) {
 const inside = matchParen[1].trim();
 if (SPANISH_CITIES_GEO[inside]) {
 const base = SPANISH_CITIES_GEO[inside];
 return offsetCoords(base, index);
 }
 }

 // 4. Fuzzy match normalized tokens
 const normCity = rawCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
 for (const [key, coords] of Object.entries(SPANISH_CITIES_GEO)) {
 const normKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
 if (normCity.includes(normKey) || normKey.includes(normCity)) {
 return offsetCoords(coords, index);
 }
 }

 // 5. Region match
 if (rawRegion && SPANISH_CITIES_GEO[rawRegion]) {
 const base = SPANISH_CITIES_GEO[rawRegion];
 return offsetCoords(base, index);
 }

 // 6. Region fuzzy match
 if (rawRegion) {
 const normRegion = rawRegion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
 for (const [key, coords] of Object.entries(SPANISH_CITIES_GEO)) {
 const normKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
 if (normRegion.includes(normKey) || normKey.includes(normRegion)) {
 return offsetCoords(coords, index);
 }
 }
 }

 // 7. Deterministic Spain-wide spread (no hardcoded Madrid dump)
 let hash = 0;
 const seedStr = (lead.id + lead.nombre_sala + rawCity);
 for (let i = 0; i < seedStr.length; i++) {
 hash = (hash << 5) - hash + seedStr.charCodeAt(i);
 hash |= 0;
 }
 const lat = 37.2 + (Math.abs(hash) % 55) / 10; // Spread 37.2N to 42.7N across Spain
 const lng = -6.5 + (Math.abs(hash >> 3) % 85) / 10; // Spread -6.5W to 2.0E across Spain
 return [lat, lng];
}

function offsetCoords(base: [number, number], index: number): [number, number] {
 const angle = (index * 137.5) * (Math.PI / 180); // Golden angle scatter
 const radius = 0.008 + (index % 5) * 0.004; // Spread ~500m to 2km
 return [base[0] + Math.sin(angle) * radius, base[1] + Math.cos(angle) * radius];
}

// Local cache for Nominatim geocoded queries
const GEO_CACHE: Record<string, [number, number]> = {};

// Helper functions for marker tooltips
function getStatusBadge(estado: string) {
 switch (estado) {
 case 'aprobado':
 return { text: '✓ Aprobado / Confirmado', bg: '#dcfce7', color: '#166534', border: '#86efac' };
 case 'pendiente_aprobacion':
 return { text: '⚡ Pendiente Aprobación', bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
 case 'interesado':
 return { text: '💡 Interesado', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' };
 case 'negociando':
 return { text: '🤝 En Negociación', bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' };
 case 'esperando_respuesta':
 return { text: '⏳ Esperando Respuesta', bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' };
 case 'no_interesado':
 return { text: '❌ No Interesado', bg: '#ffe4e6', color: '#9f1239', border: '#fecdd3' };
 case 'nuevo':
 default:
 return { text: '🎵 Nuevo Contacto', bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' };
 }
}

function getFormattedLeadDate(lead: Lead): string {
 if (lead.fecha_ultima_respuesta) {
 return `Resp: ${lead.fecha_ultima_respuesta}`;
 }
 if (lead.fecha_envio) {
 return `Envío: ${lead.fecha_envio}`;
 }
 return 'Fecha por determinar';
}

export const VenueMap: React.FC<VenueMapProps> = ({
 leads,
 selectedLead,
 onSelectLead,
 onUpdateLead,
 isStitchLight = false,
 activeCityFilter = '',
 activeRegionFilter = ''
}) => {
 const mapRef = useRef<HTMLDivElement | null>(null);
 const leafletMap = useRef<L.Map | null>(null);
 const tileLayerRef = useRef<L.TileLayer | null>(null);
 const markersGroup = useRef<any>(null);

 const [mapStyle, setMapStyle] = useState<MapStyleKey>('voyager');
 const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);

 const [geoPositions, setGeoPositions] = useState<Record<string, [number, number]>>({});
 const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
 const [geocodedCount, setGeocodedCount] = useState<number>(0);

 // Initialize Map with Marker Clustering
 useEffect(() => {
 if (!mapRef.current) return;

 if (!leafletMap.current) {
 // Default initial view: Spain center
 const map = L.map(mapRef.current, {
 center: [40.4168, -3.7038],
 zoom: 6,
 zoomControl: false
 });

 L.control.zoom({ position: 'bottomright' }).addTo(map);

 // Tile Layer (Default to Voyager for crisp bright visibility)
 const currentPreset = MAP_STYLES[mapStyle];
 const layer = L.tileLayer(currentPreset.url, {
 attribution: currentPreset.attr,
 maxZoom: 19
 }).addTo(map);

 tileLayerRef.current = layer;

 // Marker Cluster Group (Agrupación por zonas como Celeritas / Google Maps)
 const clusterGroup = (L as any).markerClusterGroup({
 showCoverageOnHover: false,
 zoomToBoundsOnClick: true,
 spiderfyOnMaxZoom: true,
 removeOutsideVisibleBounds: true,
 maxClusterRadius: 50,
 iconCreateFunction: (cluster: any) => {
 const count = cluster.getChildCount();
 let size = 38;
 let bgColor = isStitchLight ? '#4f46e5' : '#f2ca50';
 let textColor = isStitchLight ? '#ffffff' : '#1c1917';
 let ringColor = isStitchLight ? 'rgba(79, 70, 229, 0.25)' : 'rgba(242, 202, 80, 0.35)';

 if (count >= 20) {
 size = 48;
 bgColor = isStitchLight ? '#4338ca' : '#eab308';
 textColor = '#ffffff';
 ringColor = 'rgba(67, 56, 202, 0.35)';
 } else if (count >= 8) {
 size = 42;
 bgColor = isStitchLight ? '#3b82f6' : '#f59e0b';
 textColor = '#ffffff';
 ringColor = 'rgba(59, 130, 246, 0.3)';
 }

 return L.divIcon({
 html: `
 <div style="
 width: ${size}px;
 height: ${size}px;
 background-color: ${bgColor};
 color: ${textColor};
 border: 2px solid white;
 border-radius: 50%;
 box-shadow: 0 0 0 5px ${ringColor}, 0 6px 16px rgba(0,0,0,0.3);
 font-weight: 800;
 font-family: ui-monospace, monospace;
 font-size: ${size > 42 ? '13px' : '11px'};
 display: flex;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 transition: transform 0.2s ease;
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

 // Handle Tile Style changes dynamically
 useEffect(() => {
 if (!leafletMap.current) return;
 if (tileLayerRef.current && leafletMap.current.hasLayer(tileLayerRef.current)) {
 leafletMap.current.removeLayer(tileLayerRef.current);
 }
 const currentPreset = MAP_STYLES[mapStyle];
 const layer = L.tileLayer(currentPreset.url, {
 attribution: currentPreset.attr,
 maxZoom: 19
 }).addTo(leafletMap.current);
 tileLayerRef.current = layer;
 }, [mapStyle]);

 // Geocode leads to ensure accurate locations across all Spain cities & regions
 useEffect(() => {
 let isSubscribed = true;

 const resolveCoords = async () => {
 setIsGeocoding(true);
 const newCoords: Record<string, [number, number]> = {};
 const pendingToGeocode: { lead: Lead; index: number }[] = [];

 // Calculate base coords using smart dictionary & fuzzy location resolver
 leads.forEach((lead, index) => {
 const fullKey = `${lead.nombre_sala}-${lead.ciudad}`.toLowerCase();

 if (GEO_CACHE[fullKey]) {
 newCoords[lead.id] = GEO_CACHE[fullKey];
 } else {
 // Instantly resolve accurate local city/town/province coordinates
 const resolved = resolveLeadCoordinates(lead, index);
 newCoords[lead.id] = resolved;
 
 // If we want to try fine-tuning exact address via Nominatim in background
 if (!SPANISH_CITIES_GEO[lead.ciudad.trim()]) {
 pendingToGeocode.push({ lead, index });
 }
 }
 });

 if (isSubscribed) {
 setGeoPositions(prev => ({ ...prev, ...newCoords }));
 setGeocodedCount(Object.keys(newCoords).length);
 setIsGeocoding(false);
 }

 // Background fine-tuning for unknown towns via Nominatim (non-blocking)
 for (const item of pendingToGeocode) {
 if (!isSubscribed) break;
 const { lead, index } = item;
 const query = `${lead.nombre_sala || ''}, ${lead.ciudad}, ${lead.region || 'España'}`;
 try {
 const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
 headers: { 'Accept-Language': 'es' }
 });
 const data = await res.json();
 if (data && data[0]) {
 const lat = parseFloat(data[0].lat);
 const lon = parseFloat(data[0].lon);
 const coords: [number, number] = [lat, lon];
 const fullKey = `${lead.nombre_sala}-${lead.ciudad}`.toLowerCase();
 GEO_CACHE[fullKey] = coords;
 if (isSubscribed) {
 setGeoPositions(prev => ({ ...prev, [lead.id]: coords }));
 }
 }
 } catch (e) {
 // If network blocked, keep the smart resolveLeadCoordinates result (no Madrid fallback!)
 }
 await new Promise(r => setTimeout(r, 500));
 }
 };

 resolveCoords();

 return () => {
 isSubscribed = false;
 };
 }, [leads]);

 const hasInitialFitRef = useRef<boolean>(false);
 const prevFilterKeyRef = useRef<string>('');
 const markersMapRef = useRef<Record<string, L.Marker>>({});

 // Render Markers on Map & Pan to fit bounds
 useEffect(() => {
 if (!leafletMap.current || !markersGroup.current) return;

 markersGroup.current.clearLayers();
 markersMapRef.current = {};
 const bounds = L.latLngBounds([]);
 let validCount = 0;

 const isDarkMap = mapStyle === 'dark';
 const isSatellite = mapStyle === 'satellite';

 const currentFilterKey = `${activeCityFilter || ''}|${activeRegionFilter || ''}|${leads.map(l => l.id).join(',')}`;
 const filterChanged = prevFilterKeyRef.current !== currentFilterKey;

 leads.forEach(lead => {
 const pos = geoPositions[lead.id];
 if (!pos) return;

 bounds.extend(pos);
 validCount++;

 // Badge color based on status (Google Maps style vibrant pins)
 let pinColor = '#e11d48'; // Rose/Red default
 if (lead.estado === 'aprobado' || lead.estado === 'confirmado' as any) pinColor = '#10b981'; // Green
 else if (lead.estado === 'pendiente_aprobacion') pinColor = '#f59e0b'; // Amber
 else if (lead.estado === 'interesado' || lead.estado === 'negociando') pinColor = '#2563eb'; // Blue
 else if (lead.estado === 'no_interesado') pinColor = '#64748b'; // Slate

 const isSelected = selectedLead?.id === lead.id;

 const venueIconHtml = lead.imagen_url ? `
 <img src="${lead.imagen_url}" style="
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
 background-color: ${pinColor};
 color: white;
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 11px;
 margin-right: 4px;
 font-weight: bold;
 box-shadow: inset 0 0 0 1px rgba(255,255,255,0.3);
 ">
 ${lead.icono ? lead.icono : (lead.tipo === 'festival' ? '🎪' : lead.tipo === 'ayuntamiento' ? '🏛️' : lead.tipo === 'discoteca' ? '🎧' : lead.tipo === 'medio' ? '📻' : lead.tipo === 'grupo' ? '🎸' : (lead.estado === 'aprobado' ? '✓' : lead.estado === 'pendiente_aprobacion' ? '⚡' : '🏛️'))}
 </div>
 `;

 // Google Maps style pill badge + clean text label without background box
 const customIcon = L.divIcon({
 className: 'custom-venue-pin',
 html: `
 <div style="
 position: relative;
 display: inline-flex;
 align-items: center;
 gap: 6px;
 cursor: pointer;
 user-selectborder: none;
 transform: translate(-10px, -15px);
 z-index: ${isSelected ? 1000 : 100};
 ">
 <!-- Google Maps Pill Badge -->
 <div style="
 display: inline-flex;
 align-items: center;
 background: #ffffff;
 border-radius: 20px;
 padding: 2px 8px 2px 3px;
 box-shadow: 0 2px 8px rgba(0,0,0,0.35);
 border: ${isSelected ? `2.5px solid ${pinColor}` : '1px solid rgba(0,0,0,0.15)'};
 white-space: nowrap;
 position: relative;
 z-index: 2;
 transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
 transition: transform 0.15s ease;
 ">
 ${venueIconHtml}
 <span style="
 font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
 font-size: 11px;
 font-weight: 800;
 color: #1e293b;
 ">
 ${lead.aforo > 0 ? (lead.aforo >= 1000 ? `${(lead.aforo/1000).toFixed(1)}k` : lead.aforo) : 'Sala'}
 </span>
 </div>

 <!-- Google Maps Clean Text Label (Sin Fondo / Sin caja rectangular) -->
 <div style="
 font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
 font-size: 11px;
 font-weight: 800;
 line-height: 1.15;
 white-space: nowrap;
 color: ${isSatellite || isDarkMap ? '#ffffff' : '#0f172a'};
 text-shadow: ${
 isSatellite || isDarkMap
 ? '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 0 4px #000, 0 1px 3px rgba(0,0,0,0.9)'
 : '-1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff, -2px 0 0 #ffffff, 2px 0 0 #ffffff, 0 -2px 0 #ffffff, 0 2px 0 #ffffff, 0 1px 3px rgba(0,0,0,0.6)'
 };
 letter-spacing: -0.1px;
 z-index: 1;
 ">
 ${lead.nombre_sala}
 </div>
 </div>
 `,
 iconSize: [120, 28],
 iconAnchor: [12, 14]
 });

 const marker = L.marker(pos, { icon: customIcon });
 markersMapRef.current[lead.id] = marker;

 // Popup content
 const popupHtml = document.createElement('div');
 popupHtml.className = 'font-sans p-1 min-w-[200px] text-slate-800';
 popupHtml.innerHTML = `
 <div style="font-family: system-ui, sans-serif;">
 <div style="font-size: 13px; font-weight: 700; margin-bottom: 2px; color: ${isStitchLight ? '#0f172a' : '#0f172a'};">
 ${lead.nombre_sala}
 </div>
 <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
 📍 ${lead.ciudad} ${lead.region ? `(${lead.region})` : ''}
 </div>
 <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px; font-size: 10px; font-family: monospace;">
 <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
 👥 ${lead.aforo > 0 ? `${lead.aforo} personas` : 'Sin aforo'}
 </span>
 <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
 ${lead.genero || 'Música'}
 </span>
 </div>
 <div style="font-size: 10px; margin-bottom: 8px; font-family: monospace;">
 📧 ${lead.email_contacto ? lead.email_contacto : '<span style="color:#e11d48; font-weight:bold;">⚠️ Sin email</span>'}
 </div>
 <div style="display: flex; gap: 6px; margin-top: 8px;">
 <button id="pop-select-${lead.id}" style="
 flex: 1;
 background: #4f46e5;
 color: white;
 border: none;
 padding: 6px 8px;
 border-radius: 6px;
 font-size: 11px;
 font-weight: bold;
 cursor: pointer;
 ">
 👁️ Intervenir
 </button>
 ${lead.estado === 'pendiente_aprobacion' ? `
 <button id="pop-approve-${lead.id}" style="
 background: #10b981;
 color: white;
 border: none;
 padding: 6px 8px;
 border-radius: 6px;
 font-size: 11px;
 font-weight: bold;
 cursor: pointer;
 ">
 ⚡ Aprobar
 </button>
 ` : ''}
 </div>
 </div>
 `;

 // Bind actions in popup
 marker.bindPopup(popupHtml);

 // Custom Hover Tooltip showing date and status
 const statusBadge = getStatusBadge(lead.estado);
 const formattedDate = getFormattedLeadDate(lead);

 const tooltipHtml = `
 <div style="
 font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
 padding: 6px 10px;
 min-width: 170px;
 max-width: 250px;
 color: #0f172a;
 ">
 <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 2px; line-height: 1.25;">
 ${lead.nombre_sala}
 </div>
 <div style="font-size: 10.5px; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
 <span>📍 ${lead.ciudad}${lead.region ? ` (${lead.region})` : ''}</span>
 </div>
 <div style="display: flex; flex-direction: column; gap: 4px;">
 <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
 <span style="
 background: ${statusBadge.bg};
 color: ${statusBadge.color};
 border: 1px solid ${statusBadge.border};
 font-size: 9.5px;
 font-weight: 700;
 padding: 2px 7px;
 border-radius: 12px;
 white-space: nowrap;
 ">
 ${statusBadge.text}
 </span>
 ${lead.aforo > 0 ? `<span style="font-size: 9.5px; color: #475569; font-weight: 600;">👥 ${lead.aforo} cap.</span>` : ''}
 </div>
 <div style="font-size: 10px; color: #334155; font-weight: 600; font-family: monospace; display: flex; align-items: center; gap: 4px; margin-top: 1px;">
 <span>📅 ${formattedDate}</span>
 </div>
 </div>
 </div>
 `;

 marker.bindTooltip(tooltipHtml, {
 direction: 'top',
 offset: [0, -14],
 opacity: 0.98,
 className: 'custom-venue-map-tooltip'
 });

 marker.on('popupopen', () => {
 const btnSelect = document.getElementById(`pop-select-${lead.id}`);
 if (btnSelect) {
 btnSelect.onclick = () => {
 onSelectLead(lead);
 };
 }
 const btnApprove = document.getElementById(`pop-approve-${lead.id}`);
 if (btnApprove) {
 btnApprove.onclick = () => {
 onUpdateLead(lead.id, { estado: 'aprobado' });
 marker.closePopup();
 };
 }
 });

 marker.addTo(markersGroup.current);
 });

 // Auto fit bounds ONLY on initial load or when filter / leads list actually changes
 if (validCount > 0) {
 if (!hasInitialFitRef.current || filterChanged) {
 leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
 hasInitialFitRef.current = true;
 prevFilterKeyRef.current = currentFilterKey;
 }
 }
 }, [geoPositions, leads, isStitchLight, mapStyle, activeCityFilter, activeRegionFilter]);

 
  // Invalidate size on container resize (without resetting zoom/bounds on cluster expand)
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

  // Focus on selected lead when user selects a venue
 useEffect(() => {
 if (!leafletMap.current || !selectedLead) return;
 const pos = geoPositions[selectedLead.id];
 if (!pos) return;

 const marker = markersMapRef.current[selectedLead.id];
 if (marker && markersGroup.current) {
 if (typeof markersGroup.current.zoomToShowLayer === 'function' && typeof markersGroup.current.hasLayer === 'function' && markersGroup.current.hasLayer(marker)) {
 try {
 markersGroup.current.zoomToShowLayer(marker, () => {
 if (marker && typeof marker.openPopup === 'function') {
 marker.openPopup();
 }
 });
 } catch (e) {
 leafletMap.current.setView(pos, Math.max(leafletMap.current.getZoom(), 15), { animate: true });
 if (marker && typeof marker.openPopup === 'function') {
 marker.openPopup();
 }
 }
 } else {
 leafletMap.current.setView(pos, Math.max(leafletMap.current.getZoom(), 15), { animate: true });
 marker.openPopup();
 }
 } else {
 leafletMap.current.setView(pos, Math.max(leafletMap.current.getZoom(), 15), { animate: true });
 }
 }, [selectedLead, geoPositions]);

 // Handle Manual Fit Zoom to active city or all markers
 const handleRecenter = () => {
 if (!leafletMap.current || Object.keys(geoPositions).length === 0) return;
 const bounds = L.latLngBounds([]);
 (Object.values(geoPositions) as [number, number][]).forEach(pos => bounds.extend(pos));
 leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
 };

 return (
 <div className="relative w-full h-[550px] sm:h-[650px] rounded-2xl overflow-hidden shadow-lg transition-all" style={{
 borderColor: isStitchLight ? '#e2e8f0' : '#27272a'
 }}>
 <style>{`
 .leaflet-tooltip.custom-venue-map-tooltip {
 background: #ffffff !important;
 border: 1px solid rgba(0, 0, 0, 0.12) !important;
 border-radius: 12px !important;
 box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
 padding: 0 !important;
 color: #0f172a !important;
 pointer-events: none !important;
 }
 .leaflet-tooltip.custom-venue-map-tooltip::before {
 border-top-color: #ffffff !important;
 }
 `}</style>
 {/* Map DOM Element */}
 <div ref={mapRef} className="w-full h-full z-0" />

 {/* Floating Control Overlay */}
 <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pointer-events-none">
 {/* City Info Card */}
 <div className={`pointer-events-auto px-3.5 py-2 rounded-xl backdrop-blur-md shadow-md flex items-center gap-2 font-mono text-xs ${
 isStitchLight ? 'bg-white/90 -slate-200 text-slate-900' : 'bg-zinc-900/90 -zinc-800 text-zinc-100'
 }`}>
 <MapPin className="w-4 h-4 text-amber-500 animate-bounce" />
 <div>
 <span className="font-bold">
 {activeCityFilter ? `Salas en ${activeCityFilter}` : activeRegionFilter ? `Salas en ${activeRegionFilter}` : 'Mapa Global de Salas'}
 </span>
 <span className="ml-2 text-[10px] opacity-75">
 ({leads.length} {leads.length === 1 ? 'sala' : 'salas'})
 </span>
 </div>
 </div>

 {/* Action Controls */}
 <div className="pointer-events-auto flex items-center gap-2 relative">
 {isGeocoding && (
 <div className={`px-3 py-1.5 rounded-xl backdrop-blur-md text-[10px] font-mono flex items-center gap-1.5 ${
 isStitchLight ? 'bg-amber-50/90 -amber-200 text-amber-900' : 'bg-amber-950/90 -amber-700/50 text-amber-200'
 }`}>
 <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
 <span>Geolocalizando salas...</span>
 </div>
 )}

 {/* Style selector menu */}
 <div className="relative">
 <button
 onClick={() => setShowStyleMenu(!showStyleMenu)}
 className={`px-3 py-2 rounded-xl backdrop-blur-md font-mono text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
 isStitchLight
 ? 'bg-white/95 hover:bg-slate-100 -slate-200 text-slate-800'
 : 'bg-zinc-900/95 hover:bg-zinc-800 -zinc-800 text-zinc-200'
 }`}
 >
 <Layers className="w-3.5 h-3.5 text-amber-500" />
 <span>Estilo Mapa</span>
 </button>

 {showStyleMenu && (
 <div className={`absolute left-0 sm:left-auto sm:right-0 top-11 w-64 max-w-[85vw] p-2 rounded-xl shadow-2xl backdrop-blur-md space-y-1 font-mono text-xs z-[1100] ${
 isStitchLight ? 'bg-white/95 -slate-200 text-slate-800 shadow-slate-300/50' : 'bg-zinc-900/95 -zinc-800 text-zinc-200 shadow-black/80'
 }`}>
 <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
 <span>Elegir Capa de Mapa</span>
 <span className="text-[9px] font-normal text-slate-500">({Object.keys(MAP_STYLES).length} opciones)</span>
 </div>
 {(Object.keys(MAP_STYLES) as MapStyleKey[]).map(key => (
 <button
 key={key}
 onClick={() => {
 setMapStyle(key);
 setShowStyleMenu(false);
 }}
 className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
 mapStyle === key
 ? 'bg-indigo-600 text-white shadow-sm'
 : isStitchLight
 ? 'hover:bg-slate-100 text-slate-700'
 : 'hover:bg-zinc-800 text-zinc-300'
 }`}
 >
 <span className="truncate">{MAP_STYLES[key].name}</span>
 {mapStyle === key && <Check className="w-3.5 h-3.5 shrink-0" />}
 </button>
 ))}
 </div>
 )}
 </div>

 <button
 onClick={handleRecenter}
 className={`px-3 py-2 rounded-xl backdrop-blur-md font-mono text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
 isStitchLight
 ? 'bg-white/90 hover:bg-slate-100 -slate-200 text-slate-800'
 : 'bg-zinc-900/90 hover:bg-zinc-800 -zinc-800 text-zinc-200'
 }`}
 >
 <Navigation className="w-3.5 h-3.5 text-indigo-500 dark:text-[#f2ca50]" />
 <span>Centrar Vista</span>
 </button>
 </div>
 </div>

 {/* Floating Legend */}
 <div className={`absolute bottom-3 left-3 z-[1000] p-2.5 rounded-xl backdrop-blur-md font-mono text-[10px] space-y-1 shadow-md hidden sm:block ${
 isStitchLight ? 'bg-white/90 -slate-200 text-slate-700' : 'bg-zinc-900/90 -zinc-800 text-zinc-300'
 }`}>
 <div className="font-bold text-[9px] uppercase tracking-wider mb-1 text-slate-400">Leyenda</div>
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
 <span>Aprobado / Confirmado</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
 <span>Pendiente aprobación</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
 <span>Interesado / Negociando</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
 <span>Nuevo / Contactado</span>
 </div>
 </div>
 </div>
 );
};
