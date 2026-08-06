import React, { useState, useEffect } from 'react';
import { Rehearsal, Concert, ThemeColors } from '../types';
import DirectionsCard from './DirectionsCard';
import { Calendar, Clock, MapPin, CheckSquare, Sparkles, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Plus, Trash2, Download, Navigation, Disc3, Music } from 'lucide-react';

interface CalendarViewProps {
 colors: ThemeColors;
 rehearsals: Rehearsal[];
 concerts: Concert[];
 onUpdateRehearsal: (id: string, updatedFields: Partial<Rehearsal>) => void;
 onUpdateConcert: (id: string, updatedFields: Partial<Concert>) => void;
 onAddRehearsal?: (rehearsal: Rehearsal) => void;
 onAddConcert?: (concert: Concert) => void;
 initialSelectedEventId?: string;
 initialSelectedDate?: string;
}

interface RunOfShowItem {
 id: string;
 time: string;
 activity: string;
 done: boolean;
}

interface GearItem {
 id: string;
 label: string;
 checked: boolean;
}

export default function CalendarView({
 colors,
 rehearsals,
 concerts,
 onUpdateRehearsal,
 onUpdateConcert,
 onAddRehearsal,
 onAddConcert,
 initialSelectedEventId,
 initialSelectedDate
}: CalendarViewProps) {
 const realToday = new Date();
 const [viewDate, setViewDate] = useState<Date>(() => new Date(2026, 6, 1)); // Default to July 2026
 const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 6, 18)); // Default to July 18, 2026 (Cabo de Plata concert)

 // Handle initial selected date / event ID passed as props
 useEffect(() => {
 if (initialSelectedDate) {
 const parts = initialSelectedDate.split('-');
 if (parts.length === 3) {
 const y = parseInt(parts[0], 10);
 const m = parseInt(parts[1], 10) - 1;
 const d = parseInt(parts[2], 10);
 if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
 const dt = new Date(y, m, d);
 setSelectedDate(dt);
 setViewDate(new Date(y, m, 1));
 }
 }
 } else if (initialSelectedEventId) {
 const conc = concerts.find(c => c.id === initialSelectedEventId);
 const reh = rehearsals.find(r => r.id === initialSelectedEventId);
 const eventDate = conc?.fecha || reh?.fecha;
 if (eventDate) {
 const parts = eventDate.split('-');
 if (parts.length === 3) {
 const y = parseInt(parts[0], 10);
 const m = parseInt(parts[1], 10) - 1;
 const d = parseInt(parts[2], 10);
 if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
 const dt = new Date(y, m, d);
 setSelectedDate(dt);
 setViewDate(new Date(y, m, 1));
 }
 }
 }
 }
 }, [initialSelectedDate, initialSelectedEventId, concerts, rehearsals]);
 const [twoMonthsMode, setTwoMonthsMode] = useState<boolean>(true);
 const [activeTab, setActiveTab] = useState<'runofshow' | 'gear' | 'roadbook'>('runofshow');

 // Roadbooks state per event date
 interface RoadbookInfo {
 contactoPromotor: string;
 telefonoPromotor: string;
 tecnicoSonido: string;
 hotelNombre: string;
 hotelDireccion: string;
 cateringInfo: string;
 inputList: string;
 }

 const [allRoadbooks, setAllRoadbooks] = useState<Record<string, RoadbookInfo>>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_roadbooks');
 return saved ? JSON.parse(saved) : {
 '2026-07-18': {
 contactoPromotor: 'Manuel (Producción Cabo de Plata)',
 telefonoPromotor: '+34 654 321 987',
 tecnicoSonido: 'Carlos (FOH Bakandeya)',
 hotelNombre: 'Hotel Playa de Barbate ****',
 hotelDireccion: 'Avenida del Mar, 12, 11160 Barbate',
 cateringInfo: 'Cena tras prueba de sonido (21:00). 2 menús vegetarianos.',
 inputList: '1. Bombo (Beta 52)\n2. Caja Top (SM57)\n3. Bajo (DI Radial)\n4. Gtr L (e609)\n5. Teclado L/R\n6. Tpt (Clip)\n7. Voz Ppal (Beta 58)\n8. Coros (SM58)'
 }
 };
 } catch {
 return {};
 }
 });

 const saveRoadbook = (dateKey: string, info: RoadbookInfo) => {
 const updated = { ...allRoadbooks, [dateKey]: info };
 setAllRoadbooks(updated);
 try {
 localStorage.setItem('bakandeya_roadbooks', JSON.stringify(updated));
 } catch {}
 };

 // Creation Modals state
 const [showCreateModal, setShowCreateModal] = useState<'rehearsal' | 'concert' | null>(null);

 // Form fields for new Rehearsal
 const [rehTime, setRehTime] = useState('18:00 - 21:00');
 const [rehLugar, setRehLugar] = useState('Locales de Ensayo Rock Palace');
 const [rehAsistentes, setRehAsistentes] = useState('Banda Completa');
 const [rehNotas, setRehNotas] = useState('Ensayo general de repertorio directo');
 const [rehEstado, setRehEstado] = useState<'programado' | 'confirmado' | 'realizado' | 'cancelado'>('programado');

 // Form fields for new Concert
 const [concCiudad, setConcCiudad] = useState('Madrid');
 const [concSala, setConcSala] = useState('');
 const [concCache, setConcCache] = useState('1200');
 const [concAforo, setConcAforo] = useState('300');
 const [concContrato, setConcContrato] = useState(true);
 const [concEstadoPago, setConcEstadoPago] = useState<'pendiente' | 'cobrado' | 'parcial'>('pendiente');
 const [concTipo, setConcTipo] = useState<'propio' | 'festival' | 'privado'>('propio');
 const [concNotas, setConcNotas] = useState('Concierto agendado desde el calendario');

 const currentYear = viewDate.getFullYear();
 const currentMonth = viewDate.getMonth(); // 0 to 11

 // Second month calculations for dual month view
 const nextMonth = (currentMonth + 1) % 12;
 const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

 const monthNames = [
 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
 ];

 const handlePrevMonth = () => {
 setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
 };

 const handleNextMonth = () => {
 setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
 };

 const handleGoToday = () => {
 const now = new Date();
 setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
 setSelectedDate(now);
 };
 
 // Sync state
 const [isSyncingConcerts, setIsSyncingConcerts] = useState(false);
 const [syncSuccessMessage, setSyncSuccessMessage] = useState('');
 const [syncErrorMessage, setSyncErrorMessage] = useState('');

 const handleSaveNewRehearsal = (e: React.FormEvent) => {
 e.preventDefault();
 const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
 const newRehearsal: Rehearsal = {
 id: `reh-${Date.now()}`,
 fecha: formattedDate,
 hora: rehTime.trim() || '18:00 - 21:00',
 lugar: rehLugar.trim() || 'Locales de Ensayo',
 asistentes: rehAsistentes.trim() || 'Todos',
 notas: rehNotas.trim() || 'Ensayo general',
 estado: rehEstado
 };

 if (onAddRehearsal) {
 onAddRehearsal(newRehearsal);
 setSyncSuccessMessage(`¡Ensayo creado para el ${formattedDate} y guardado automáticamente en Excel!`);
 setTimeout(() => setSyncSuccessMessage(''), 5000);
 }
 setShowCreateModal(null);
 };

 const handleSaveNewConcert = (e: React.FormEvent) => {
 e.preventDefault();
 const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
 const newConcert: Concert = {
 id: `conc-${Date.now()}`,
 fecha: formattedDate,
 ciudad: concCiudad.trim() || 'Madrid',
 sala: concSala.trim() || 'Sala Directo',
 cache: Number(concCache) || 0,
 aforo_vendido: 0,
 aforo_total: Number(concAforo) || 200,
 contrato_firmado: concContrato,
 estado_pago: concEstadoPago,
 notas: concNotas.trim(),
 tipo: concTipo
 };

 if (onAddConcert) {
 onAddConcert(newConcert);
 setSyncSuccessMessage(`¡Concierto en ${newConcert.sala} (${newConcert.ciudad}) creado para el ${formattedDate} y guardado en Excel!`);
 setTimeout(() => setSyncSuccessMessage(''), 5000);
 }
 setShowCreateModal(null);
 };

 const handleSyncConcerts = async () => {
 setIsSyncingConcerts(true);
 setSyncSuccessMessage('');
 setSyncErrorMessage('');
 try {
 const res = await fetch('/api/concerts/sync', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' }
 });
 const data = await res.json();
 if (res.ok && data.success) {
 setSyncSuccessMessage(data.message || 'Conciertos sincronizados con éxito en Google Sheets.');
 // clear after 6 seconds
 setTimeout(() => setSyncSuccessMessage(''), 6000);
 } else {
 setSyncErrorMessage(data.error || 'Error al intentar sincronizar los conciertos.');
 }
 } catch (error) {
 console.error('Error synchronizing concerts:', error);
 setSyncErrorMessage('Error de conexión con el de servidor de Google Sheets.');
 } finally {
 setIsSyncingConcerts(false);
 }
 };

 // Dynamic state for per-date schedules and gear checklists with localStorage persistence
 const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

 const defaultInitialRunOfShow: Record<string, RunOfShowItem[]> = {
 '2026-07-23': [
 { id: 'ros-1', time: '17:00', activity: 'Llegada a la sala y descarga de bártulos', done: true },
 { id: 'ros-2', time: '17:30', activity: 'Montaje de escenario e in-ears', done: true },
 { id: 'ros-3', time: '18:15', activity: 'Prueba de sonido (Soundcheck de metales y bases)', done: true },
 { id: 'ros-4', time: '19:30', activity: 'Cena de la banda / Catering', done: false },
 { id: 'ros-5', time: '21:00', activity: 'Apertura de puertas', done: false },
 { id: 'ros-6', time: '21:30', activity: 'SHOWTIME: ¡Comienza el bolo de Bakandeya! 🎺💥', done: false },
 { id: 'ros-7', time: '23:30', activity: 'Merchandising, firmas y recogida de equipo', done: false },
 ],
 '2026-07-15': [
 { id: 'ros-10', time: '17:00', activity: 'Camerinos Rock Palace - Montaje y chequeo', done: true },
 { id: 'ros-11', time: '18:00', activity: 'Prueba de loops con Jon y violín', done: true },
 { id: 'ros-12', time: '20:30', activity: 'Cierre del ensayo y notas generales', done: false },
 ]
 };

 const defaultInitialGear: Record<string, GearItem[]> = {
 '2026-07-23': [
 { id: 'gear-1', label: 'Teclado Korg SV-2 + Stand', checked: true },
 { id: 'gear-2', label: 'Sección Metales (Sordinas y atril)', checked: true },
 { id: 'gear-3', label: 'Banderola de Escenario Bakandeya', checked: false },
 { id: 'gear-4', label: 'Merchandising (Camisetas, Pegatinas, CDs)', checked: false },
 { id: 'gear-5', label: 'Cables Jack / XLR de recambio', checked: true },
 { id: 'gear-6', label: 'DI-Box estéreo para teclados', checked: false },
 ]
 };

 const [allRunOfShow, setAllRunOfShow] = useState<Record<string, RunOfShowItem[]>>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_run_of_show');
 return saved ? JSON.parse(saved) : defaultInitialRunOfShow;
 } catch {
 return defaultInitialRunOfShow;
 }
 });

 const [allGear, setAllGear] = useState<Record<string, GearItem[]>>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_gear_checklists');
 return saved ? JSON.parse(saved) : defaultInitialGear;
 } catch {
 return defaultInitialGear;
 }
 });

 // Fetch server logistics state on mount
 useEffect(() => {
 fetch('/api/logistics')
 .then(res => res.ok ? res.json() : null)
 .then(data => {
 if (data) {
 if (data.runOfShow && Object.keys(data.runOfShow).length > 0) {
 setAllRunOfShow(prev => ({ ...prev, ...data.runOfShow }));
 }
 if (data.gearChecklists && Object.keys(data.gearChecklists).length > 0) {
 setAllGear(prev => ({ ...prev, ...data.gearChecklists }));
 }
 }
 })
 .catch(err => console.error("Error loading server logistics:", err));
 }, []);

 // Sync helpers to post server state
 const saveRunOfShowToServer = (dateKey: string, items: RunOfShowItem[]) => {
 fetch('/api/logistics/runofshow', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ dateKey, items })
 }).catch(err => console.error("Error saving run of show:", err));
 };

 const saveGearToServer = (dateKey: string, items: GearItem[]) => {
 fetch('/api/logistics/gear', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ dateKey, items })
 }).catch(err => console.error("Error saving gear checklist:", err));
 };

 // Inputs for adding new items
 const [newRunTime, setNewRunTime] = useState('');
 const [newRunActivity, setNewRunActivity] = useState('');
 const [newGearLabel, setNewGearLabel] = useState('');

 useEffect(() => {
 try {
 localStorage.setItem('bakandeya_run_of_show', JSON.stringify(allRunOfShow));
 } catch (e) {
 console.error(e);
 }
 }, [allRunOfShow]);

 useEffect(() => {
 try {
 localStorage.setItem('bakandeya_gear_checklists', JSON.stringify(allGear));
 } catch (e) {
 console.error(e);
 }
 }, [allGear]);

 // Current items for the selected day
 const currentRunOfShow = allRunOfShow[selectedDateKey] || [
 { id: 'ros-def-1', time: '17:00', activity: 'Llegada y descarga', done: false },
 { id: 'ros-def-2', time: '18:00', activity: 'Prueba de sonido', done: false },
 { id: 'ros-def-3', time: '21:00', activity: 'Comienzo de actuación / actividad', done: false }
 ];

 const currentGear = allGear[selectedDateKey] || [
 { id: 'gear-def-1', label: 'Instrumentos principales y fundas', checked: false },
 { id: 'gear-def-2', label: 'In-Ears y receptores', checked: false },
 { id: 'gear-def-3', label: 'Cables de audio y alimentación', checked: false }
 ];

 const handleToggleRunOfShow = (id: string) => {
 setAllRunOfShow(prev => {
 const dayList = prev[selectedDateKey] || currentRunOfShow;
 const updatedList = dayList.map(item => item.id === id ? { ...item, done: !item.done } : item);
 saveRunOfShowToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 };

 const handleAddRunOfShow = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newRunActivity.trim()) return;
 const timeVal = newRunTime.trim() || '12:00';
 const newItem: RunOfShowItem = {
 id: `ros-${Date.now()}`,
 time: timeVal,
 activity: newRunActivity.trim(),
 done: false
 };
 setAllRunOfShow(prev => {
 const dayList = prev[selectedDateKey] || currentRunOfShow;
 const updatedList = [...dayList, newItem];
 saveRunOfShowToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 setNewRunTime('');
 setNewRunActivity('');
 };

 const handleDeleteRunOfShow = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 setAllRunOfShow(prev => {
 const dayList = prev[selectedDateKey] || currentRunOfShow;
 const updatedList = dayList.filter(item => item.id !== id);
 saveRunOfShowToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 };

 const handleToggleGear = (id: string) => {
 setAllGear(prev => {
 const dayList = prev[selectedDateKey] || currentGear;
 const updatedList = dayList.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
 saveGearToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 };

 const handleAddGear = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newGearLabel.trim()) return;
 const newItem: GearItem = {
 id: `gear-${Date.now()}`,
 label: newGearLabel.trim(),
 checked: false
 };
 setAllGear(prev => {
 const dayList = prev[selectedDateKey] || currentGear;
 const updatedList = [...dayList, newItem];
 saveGearToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 setNewGearLabel('');
 };

 const handleDeleteGear = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 setAllGear(prev => {
 const dayList = prev[selectedDateKey] || currentGear;
 const updatedList = dayList.filter(item => item.id !== id);
 saveGearToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 };

 // Month generator with navigation
 const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

 // Helper function to get events for any date string"YYYY-MM-DD"
 const getEventsForDateStr = (formattedDate: string) => {
 const dayConcerts = concerts.filter(c => c.fecha === formattedDate);
 const dayRehearsals = rehearsals.filter(r => r.fecha === formattedDate);
 return { concerts: dayConcerts, rehearsals: dayRehearsals };
 };

 // Get current event for the selected day
 const selectedEvents = getEventsForDateStr(selectedDateKey);
 
 const currentRehearsal = selectedEvents.rehearsals[0];
 const isGeneralRehearsal = currentRehearsal && (
 currentRehearsal.notas.toLowerCase().includes('general') || 
 currentRehearsal.lugar.toLowerCase().includes('general')
 );
 const rehearsalTypeLabel = isGeneralRehearsal ? 'Ensayo General' : 'Ensayo';

 const selectedEventTitle = selectedEvents.concerts.length > 0 
 ? `Concierto: ${selectedEvents.concerts[0].sala}` 
 : selectedEvents.rehearsals.length > 0 
 ? `${rehearsalTypeLabel}: ${selectedEvents.rehearsals[0].lugar.split(',')[0]}` 
 : `Día Libre`;

 const selectedConcert = selectedEvents.concerts[0];
 const selectedRehearsal = selectedEvents.rehearsals[0];

 const availableSetlists = React.useMemo(() => {
 try {
 const saved = localStorage.getItem('bakandeya_setlists_data');
 return saved ? JSON.parse(saved) : [];
 } catch {
 return [];
 }
 }, []);

 const currentSetlistId = selectedConcert?.setlistId || selectedRehearsal?.setlistId;
 const assignedSetlist = availableSetlists.find((s: any) => s.id === currentSetlistId);

 const selectedEventDetails = selectedConcert
 ? {
 type: 'concert',
 time: '21:30',
 lugar: `${selectedConcert.sala}, ${selectedConcert.ciudad}`,
 direccion: selectedConcert.direccion,
 fee: `${selectedConcert.cache} € (Caché Pactado)`,
 notes: selectedConcert.notas,
 locationQuery: selectedConcert.direccion || `${selectedConcert.sala}, ${selectedConcert.ciudad}`
 }
 : selectedRehearsal
 ? {
 type: isGeneralRehearsal ? 'rehearsal_general' : 'rehearsal',
 time: selectedRehearsal.hora,
 lugar: selectedRehearsal.lugar,
 direccion: undefined,
 fee: 'Gratuito',
 notes: selectedRehearsal.notas,
 locationQuery: selectedRehearsal.lugar
 }
 : {
 type: 'free',
 time: '--:--',
 lugar: 'Sin evento agendado',
 direccion: undefined,
 fee: '--',
 notes: 'Día de descanso de la banda para composing o ensayos individuales.',
 locationQuery: undefined
 };

 const isStitchLight = colors.accent === 'text-sky-400';
 const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
 const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
 const textMuted = isStitchLight ? 'text-slate-400' : 'text-neutral-500';

 // Render month grid function
 const renderMonthGrid = (year: number, month: number, showMonthHeader: boolean = false) => {
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;

 const cells = [];
 for (let i = 0; i < startOffset; i++) {
 cells.push({ empty: true, day: 0 });
 }
 for (let d = 1; d <= daysInMonth; d++) {
 cells.push({ empty: false, day: d });
 }

 const isThisRealMonth = realToday.getFullYear() === year && realToday.getMonth() === month;

 return (
 <div key={`month-grid-${year}-${month}`} className="flex-1 min-w-[280px]">
 {showMonthHeader && (
 <div className={`text-center font-bold font-display uppercase tracking-wider text-[10px] mb-3 pb-1 ${
 isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'
 }`}>
 {monthNames[month]} {year}
 </div>
 )}

 {/* Weekday Labels */}
 <div className={`grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono mb-2.5 font-bold uppercase ${textSub} bg-slate-950/60 p-2 rounded-xl border border-slate-800/80`}>
 {weekdays.map(day => (
 <div key={day} className="py-0.5 tracking-wider">{day}</div>
 ))}
 </div>

 {/* Grid Cells */}
 <div className="grid grid-cols-7 gap-1.5">
 {cells.map((cell, index) => {
 if (cell.empty) {
 return <div key={`empty-${year}-${month}-${index}`} className="aspect-square bg-transparent rounded-lg" />;
 }

 const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
 const { concerts: dayConcerts, rehearsals: dayRehearsals } = getEventsForDateStr(formattedDate);
 const hasConcert = dayConcerts.length > 0;
 const hasRehearsal = dayRehearsals.length > 0;

 const isSelected = selectedDate.getFullYear() === year &&
 selectedDate.getMonth() === month &&
 selectedDate.getDate() === cell.day;

 const isToday = isThisRealMonth && cell.day === realToday.getDate();

 // Stylish border logic for non-selected vs event vs selected days
 let borderAndBgClass = "";
 if (isSelected) {
 borderAndBgClass = isStitchLight
 ? 'bg-sky-500 text-white font-extrabold border-2 border-sky-300 shadow-xl shadow-sky-500/20 scale-[1.05] z-20'
 : 'bg-amber-500 text-slate-950 font-black border-2 border-amber-300 shadow-xl shadow-amber-500/25 scale-[1.05] z-20';
 } else if (isToday) {
 borderAndBgClass = 'bg-amber-500/15 text-amber-300 font-bold border-2 border-amber-500/80 shadow-md shadow-amber-500/10 hover:border-amber-400 z-10';
 } else if (hasConcert && hasRehearsal) {
 borderAndBgClass = 'bg-gradient-to-br from-amber-950/40 to-emerald-950/40 border border-amber-500/50 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 text-white';
 } else if (hasConcert) {
 borderAndBgClass = 'bg-amber-950/20 border border-amber-500/40 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 text-amber-200';
 } else if (hasRehearsal) {
 borderAndBgClass = 'bg-emerald-950/20 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10 text-emerald-200';
 } else {
 borderAndBgClass = isStitchLight
 ? 'bg-white border border-slate-200 hover:border-sky-400 hover:bg-slate-50 text-slate-800 shadow-xs'
 : 'bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/80 hover:shadow-md hover:shadow-amber-500/10 text-slate-200 shadow-xs';
 }

 return (
 <button
 id={`calendar-day-${formattedDate}`}
 key={`day-${formattedDate}`}
 onClick={() => setSelectedDate(new Date(year, month, cell.day))}
 className={`aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 relative transition-all duration-150 cursor-pointer ${borderAndBgClass}`}
 >
 {isToday && (
 <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-mono font-black uppercase px-1.5 py-[1px] rounded-full border shadow-md z-30 ${
 isSelected 
 ? 'bg-slate-950 text-amber-400 border-amber-300' 
 : 'bg-amber-500 text-slate-950 border-amber-300'
 }`}>
 HOY
 </span>
 )}

 <span className={`text-xs font-mono font-bold ${
 isSelected 
 ? isStitchLight ? 'text-white' : 'text-slate-950 font-black' 
 : isToday
 ? 'text-amber-300 font-extrabold'
 : hasConcert
 ? 'text-amber-300 font-bold'
 : hasRehearsal
 ? 'text-emerald-300 font-bold'
 : isStitchLight ? 'text-slate-800' : 'text-slate-200'
 }`}>
 {cell.day}
 </span>
 
 {/* Glowing Dots Indicator */}
 <div className="flex gap-1 justify-center items-center w-full mb-0.5">
 {hasConcert && (
 <span className={`w-1.5 h-1.5 rounded-full ${
 isSelected 
 ? 'bg-slate-950 shadow-none' 
 : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
 }`} title="Concierto" />
 )}
 {hasRehearsal && (
 <span className={`w-1.5 h-1.5 rounded-full ${
 isSelected 
 ? 'bg-slate-950 shadow-none' 
 : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
 }`} title="Ensayo" />
 )}
 </div>
 </button>
 );
 })}
 </div>
 </div>
 );
 };

 return (
 <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans items-stretch w-full max-w-full overflow-x-hidden`}>
 
 {/* LEFT: MONTH GRID CALENDAR (2/3 width) */}
 <div className={`${colors.card} p-6 flex flex-col justify-between lg:col-span-2`}>
 <div>
 {/* Header */}
 <div className={`flex justify-between items-start md:items-center pb-4 mb-4 gap-4 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <div>
 <h4 className={`text-[10px] font-mono uppercase tracking-widest ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>Calendario de Directos</h4>
 <div className="flex flex-col items-start gap-2 mt-1">
 <h2 className={`text-xl font-bold font-display uppercase tracking-wider ${textTitle}`}>
 {twoMonthsMode ? (
 <>
 {monthNames[currentMonth]} - {monthNames[nextMonth]} <span className="text-[#d1b375] font-mono text-base">{currentYear === nextMonthYear ? currentYear : `${currentYear}/${nextMonthYear}`}</span>
 </>
 ) : (
 <>
 {monthNames[currentMonth]} <span className="text-[#d1b375] font-mono text-base">{currentYear}</span>
 </>
 )}
 </h2>
 <div className="flex items-center gap-1">
 <button
 onClick={handlePrevMonth}
 className={`p-1 rounded-lg transition-all cursor-pointer ${
 isStitchLight ? '-slate-200 hover:bg-slate-100 text-slate-700' : '-neutral-800 hover:bg-neutral-800 text-neutral-300'
 }`}
 title="Meses anteriores"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>
 <button
 onClick={handleNextMonth}
 className={`p-1 rounded-lg transition-all cursor-pointer ${
 isStitchLight ? '-slate-200 hover:bg-slate-100 text-slate-700' : '-neutral-800 hover:bg-neutral-800 text-neutral-300'
 }`}
 title="Meses siguientes"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 <button
 onClick={handleGoToday}
 className="text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-md bg-[#d1b375]/15 text-[#d1b375] hover:bg-[#d1b375]/15 transition-all cursor-pointer"
 title="Ir al mes y día actual"
 >
 Hoy
 </button>

 {/* Mode Toggle: 1 Mes vs 2 Meses */}
 <div className={`flex items-center rounded-lg p-0.5 ml-2 ${
 isStitchLight ? '-slate-200 bg-slate-100' : '-neutral-800 bg-neutral-900'
 }`}>
 <button
 onClick={() => setTwoMonthsMode(false)}
 className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
 !twoMonthsMode
 ? isStitchLight ? 'bg-sky-500/15 text-white shadow-sm' : 'bg-[#d1b375]/15 text-stone-950 shadow-sm'
 : 'text-neutral-400 hover:text-neutral-200'
 }`}
 title="Ver 1 mes"
 >
 1 Mes
 </button>
 <button
 onClick={() => setTwoMonthsMode(true)}
 className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
 twoMonthsMode
 ? isStitchLight ? 'bg-sky-500/15 text-white shadow-sm' : 'bg-[#d1b375]/15 text-stone-950 shadow-sm'
 : 'text-neutral-400 hover:text-neutral-200'
 }`}
 title="Ver 2 meses a la vez"
 >
 2 Meses
 </button>
 </div>
 </div>
 </div>
 </div>
 <div className="flex gap-2 items-center flex-wrap">
 <button
 id="create-rehearsal-btn"
 onClick={() => setShowCreateModal('rehearsal')}
 className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
 isStitchLight
 ? 'bg-[#10b981]/15 hover:bg-[#10b981]/15 text-white shadow-sm'
 : 'bg-[#10b981]/15 hover:bg-[#10b981]/15 text-[#10b981] shadow-sm'
 }`}
 title="Crear un nuevo ensayo para la fecha seleccionada"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>+ Crear Ensayo</span>
 </button>

 <button
 id="create-concert-btn"
 onClick={() => setShowCreateModal('concert')}
 className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
 isStitchLight
 ? 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-white shadow-sm'
 : 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-[#d1b375] shadow-sm'
 }`}
 title="Crear un nuevo concierto para la fecha seleccionada"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>+ Crear Concierto</span>
 </button>

 <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold ${
 isStitchLight ? 'bg-sky-500/15 text-sky-400' : 'bg-[#b8d6b8]/10 text-[#b8d6b8]'
 }`}>
 <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]/15 animate-ping shrink-0" /> Sincronización Automática
 </span>
 </div>
 </div>

 {/* Sync Notifications */}
 {syncSuccessMessage && (
 <div className={`mb-4 p-2 px-3 rounded-lg text-[10px] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') 
 : (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]')
 }`}>
 <CheckSquare className="w-4 h-4 text-[#10b981] shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncSuccessMessage}</span>
 <button onClick={() => setSyncSuccessMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}
 {syncErrorMessage && (
 <div className={`mb-4 p-2 px-3 rounded-lg text-[10px] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ? 'bg-rose-500/15 text-rose-400' 
 : 'bg-rose-500/15 text-rose-400'
 }`}>
 <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncErrorMessage}</span>
 <button onClick={() => setSyncErrorMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}

 {/* Month Grids Container (Single or Dual) */}
 <div className={`flex flex-col ${twoMonthsMode ? 'xl:flex-row gap-6' : 'gap-4'}`}>
 {renderMonthGrid(currentYear, currentMonth, twoMonthsMode)}
 {twoMonthsMode && renderMonthGrid(nextMonthYear, nextMonth, true)}
 </div>
 </div>

 {/* Legend */}
 <div className={`flex flex-wrap gap-4 text-[10px] font-mono pt-4 mt-6 ${isStitchLight ? 'text-slate-400' : 'text-[#99907c]/15 text-neutral-500'}`}>
 <div className="flex items-center gap-1.5">
 <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-1 rounded ${
 isStitchLight ? 'bg-[#d1b375]/15 text-white' : 'bg-[#d1b375]/15 text-stone-950'
 }`}>HOY</span>
 <span>Día Actual</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${isStitchLight ? 'bg-sky-500/15' : 'bg-[#f2ca50] shadow-[0_0_8px_#f2ca50]'}`} />
 <span>Concierto</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${isStitchLight ? 'bg-[#10b981]/15' : 'bg-[#b8d6b8] shadow-[0_0_8px_#b8d6b8]'}`} />
 <span>Ensayo</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-emerald-400 ${isStitchLight ? 'bg-[#10b981]/15' : 'bg-[#10b981]/15 shadow-[0_0_8px_#34d399]'}`} />
 <span>Ensayo General</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className={`w-2.5 h-2.5 rounded inline-block ${isStitchLight ? 'bg-sky-500/15' : 'bg-[#f2ca50]'}`} />
 <span>Seleccionado</span>
 </div>
 </div>
 </div>

 {/* RIGHT: LOGISTICS & CHECKLISTS SIDEBAR (1/3 width) */}
 <div className={`${colors.card} p-5 flex flex-col justify-between lg:col-span-1`}>
 {selectedEventDetails.type === 'free' ? (
 <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
 <div className={`p-3 rounded-full ${isStitchLight ? 'bg-slate-100 text-slate-400' : 'bg-neutral-800 text-neutral-500'}`}>
 <Calendar className="w-6 h-6" />
 </div>
 <div>
 <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
 {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 </p>
 <h4 className={`text-sm font-bold font-display mt-1 ${textTitle}`}>
 Día sin eventos agendados
 </h4>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Selecciona un día con concierto en el calendario para ver su logística y ubicación GPS.
 </p>
 </div>
 <button
 type="button"
 onClick={() => setShowCreateModal('rehearsal')}
 className={`py-1.5 px-3.5 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
 isStitchLight 
 ? 'bg-sky-500/15 text-sky-400 hover:bg-sky-500/15' 
 : 'bg-[#d1b375]/15 text-[#d1b375] hover:bg-[#d1b375]/15'
 }`}
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Agendar Ensayo en esta fecha</span>
 </button>

 {/* Quick GPS Concerts List */}
 {concerts.length > 0 && (
 <div className={`w-full text-left mt-4 pt-3 space-y-2.5 ${isStitchLight ? '-slate-200' : '-neutral-800'}`}>
 <div className={`flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>
 <MapPin className="w-3.5 h-3.5" />
 <span>Próximos Conciertos (Cómo llegar)</span>
 </div>
 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
 {concerts.map(conc => {
 const query = conc.direccion || `${conc.sala}, ${conc.ciudad}`;
 const parts = conc.fecha ? conc.fecha.split('-') : [];
 const dateFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : conc.fecha;
 return (
 <div
 key={conc.id}
 onClick={() => {
 if (conc.fecha) {
 const p = conc.fecha.split('-');
 if (p.length === 3) {
 setSelectedDate(new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)));
 setViewDate(new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, 1));
 }
 }
 }}
 className={`p-2.5 rounded-xl flex flex-col gap-1.5 transition-all cursor-pointer ${
 isStitchLight ? 'bg-white hover:-indigo-400 hover:shadow-sm' : 'bg-[#141414] hover:-neutral-700'
 }`}
 >
 <div className="flex items-center justify-between">
 <span className={`text-[10px] font-bold font-display ${textTitle}`}>{conc.sala} ({conc.ciudad})</span>
 <span className={`text-[10px] font-mono font-semibold ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>{dateFormatted}</span>
 </div>
 {conc.direccion && (
 <p className={`text-[10px] font-sans ${textSub}`}>📍 {conc.direccion}</p>
 )}
 <div className="mt-1 flex justify-center">
 <DirectionsCard 
 query={query} 
 locationName={conc.sala} 
 address={conc.direccion || conc.ciudad} 
 isStitchLight={isStitchLight} 
 />
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="concert-detail-view">
 {/* Day details */}
 <div className={` pb-4 mb-4 ${isStitchLight ? '-slate-100' : '-[#99907c]/15'}`}>
 <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`}>Logística de Ensayos y Conciertos</div>
 <h3 className={`text-lg font-bold font-display tracking-wide mt-1 ${textTitle}`}>{selectedEventTitle}</h3>
 <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>
 {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 </p>
 </div>

 {/* Core Info */}
 <div className={`space-y-3 mb-6 rounded-lg p-3 ${
 isStitchLight ? 'bg-slate-50' : 'bg-[#131313]/60'
 }`}>
 <div className="flex items-center gap-2 text-[10px]">
 <Clock className={`w-4 h-4 shrink-0 ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`} />
 <span className={`font-mono ${textSub}`}>Hora:</span>
 <span className={`font-bold font-mono ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>{selectedEventDetails.time}</span>
 </div>
 <div className="flex items-start gap-2 text-[10px]">
 <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`} />
 <div className="flex-1">
 <span className={`font-mono ${textSub}`}>Lugar:</span>
 <p className={`font-medium font-sans mt-0.5 ${textTitle}`}>{selectedEventDetails.lugar}</p>
 {selectedEventDetails.direccion && (
 <p className={`text-[10px] font-sans mt-1 ${isStitchLight ? 'text-slate-600' : 'text-neutral-300'}`}>
 <span className="font-semibold font-mono">Dirección:</span> {selectedEventDetails.direccion}
 </p>
 )}
 </div>
 </div>
 {selectedEventDetails.locationQuery && selectedEventDetails.type !== 'free' && (
 <div className="pt-3 mt-2.5 flex justify-center">
 <DirectionsCard 
 query={selectedEventDetails.locationQuery} 
 locationName={selectedEventDetails.lugar} 
 address={selectedEventDetails.direccion} 
 isStitchLight={isStitchLight} 
 />
 </div>
 )}
 {selectedEventDetails.type === 'concert' && (
 <div className={`flex items-center gap-2 text-[10px] pt-2 mt-1 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <Sparkles className="w-4 h-4 text-[#10b981] shrink-0" />
 <span className={`font-mono ${textSub}`}>Compensación:</span>
 <span className="text-[#10b981] dark:text-[#b8d6b8] font-bold font-mono">{selectedEventDetails.fee}</span>
 </div>
 )}
 {selectedEventDetails.type === 'concert' && selectedConcert && (() => {
 const g = selectedConcert.gastosDetalle;
 const totalG = g ? ((g.gasolina || 0) + (g.dietas || 0) + (g.alquilerVehiculo || 0) + (g.alojamiento || 0) + (g.otros || 0)) : (selectedConcert.gastosEstimadosTipicos || 150);
 const net = (selectedConcert.cache || 0) - totalG;
 return (
 <div className={`flex items-center justify-between text-[10px] pt-1.5 mt-1`}>
 <span className={`font-mono ${textSub}`}>Rentabilidad neta:</span>
 <span className={`font-bold font-mono px-2 py-0.5 rounded-full ${
 net < 0 ? 'bg-rose-950/80 text-rose-400' :
 net < 150 ? 'bg-amber-950/80 text-amber-300' :
 'bg-emerald-950/80 text-emerald-400'
 }`}>
 {net >= 0 ? `+${net}€ Neto` : `${net}€ En pérdidas`}
 </span>
 </div>
 );
 })()}
 {selectedEventDetails.notes && (
 <div className={`text-[10px] font-sans italic pt-2 leading-relaxed ${isStitchLight ? '-slate-100 text-slate-500' : '-neutral-900 text-neutral-400'}`}>
 &ldquo;{selectedEventDetails.notes}&rdquo;
 </div>
 )}

 {/* REPERTORIO / SETLIST ASIGNADO */}
 {(selectedConcert || selectedRehearsal) && (
 <div className={` pt-2.5 mt-2.5 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <div className="flex items-center justify-between gap-2 mb-1.5">
 <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#d1b375]">
 <Disc3 className="w-3.5 h-3.5 shrink-0 animate-spin-slow" />
 <span>Repertorio Asignado:</span>
 </div>
 {assignedSetlist && (
 <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#10b981]/15 text-[#10b981] font-bold">
 {assignedSetlist.items?.length || 0} canciones/ítems
 </span>
 )}
 </div>

 <select
 value={currentSetlistId || ''}
 onChange={(e) => {
 const val = e.target.value;
 if (selectedConcert) {
 onUpdateConcert(selectedConcert.id, { setlistId: val });
 } else if (selectedRehearsal) {
 onUpdateRehearsal(selectedRehearsal.id, { setlistId: val });
 }
 }}
 className={`w-full text-[10px] font-mono p-1.5 rounded-lg focus:outline-none cursor-pointer ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-[#d1b375] font-bold'
 }`}
 >
 <option value="">-- Sin repertorio asignado --</option>
 {availableSetlists.map((s: any) => (
 <option key={s.id} value={s.id}>
 {s.nombre} ({s.tipoFormato})
 </option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Subtabs for Checklist */}
 <div className={`flex mb-4 ${isStitchLight ? '-slate-100' : '-neutral-900'}`}>
 <button
 id="calendar-subtab-runofshow"
 onClick={() => setActiveTab('runofshow')}
 className={`flex-1 pb-2 text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors ${
 activeTab === 'runofshow'
 ? isStitchLight
 ? ' text-sky-400 font-bold'
 : ' text-[#f2ca50] font-bold'
 : isStitchLight
 ? 'text-slate-400 hover:text-slate-600'
 : 'text-neutral-500 hover:text-neutral-300'
 }`}
 >
 Timing del Bolo
 </button>
 <button
 id="calendar-subtab-gear"
 onClick={() => setActiveTab('gear')}
 className={`flex-1 pb-2 text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors ${
 activeTab === 'gear'
 ? isStitchLight
 ? ' text-sky-400 font-bold'
 : ' text-[#ffb596] font-bold'
 : isStitchLight
 ? 'text-slate-400 hover:text-slate-600'
 : 'text-neutral-500 hover:text-neutral-300'
 }`}
 >
 Cacharros
 </button>
 <button
 id="calendar-subtab-roadbook"
 onClick={() => setActiveTab('roadbook')}
 className={`flex-1 pb-2 text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors ${
 activeTab === 'roadbook'
 ? isStitchLight
 ? ' text-sky-400 font-bold'
 : ' text-[#10b981] font-bold'
 : isStitchLight
 ? 'text-slate-400 hover:text-slate-600'
 : 'text-neutral-500 hover:text-neutral-300'
 }`}
 >
 Hoja de Ruta & Rider
 </button>
 </div>

 {/* Content for Subtabs */}
 {activeTab === 'roadbook' ? (
 <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-[10px]">
 {(() => {
 const currentRb = allRoadbooks[selectedDateKey] || {
 contactoPromotor: 'Manuel (Producción)',
 telefonoPromotor: '+34 654 321 987',
 tecnicoSonido: 'FOH Bakandeya',
 hotelNombre: 'Hotel de Gira',
 hotelDireccion: selectedConcert?.ciudad || 'Por confirmar',
 cateringInfo: 'Cena tras prueba de sonido',
 inputList: '1. Bombo (Beta 52)\n2. Caja Top (SM57)\n3. Bajo (DI Radial)\n4. Gtr L (e609)\n5. Teclado L/R\n6. Tpt (Clip)\n7. Voz Ppal (Beta 58)\n8. Coros (SM58)'
 };

 return (
 <div className="space-y-3">
 <div className={`p-3 rounded-lg space-y-2 ${isStitchLight ? 'bg-slate-50' : 'bg-neutral-900/70'}`}>
 <div className="flex items-center justify-between">
 <span className={`text-[10px] font-mono uppercase font-bold ${isStitchLight ? 'text-sky-400' : 'text-[#10b981]'}`}>📞 Contacto Producción & Hotel</span>
 </div>
 <div className="grid grid-cols-2 gap-2 text-[10px]">
 <div>
 <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Promotor / Sala</label>
 <input
 type="text"
 value={currentRb.contactoPromotor}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, contactoPromotor: e.target.value })}
 className={`w-full px-2 py-1 rounded text-[10px] ${isStitchLight ? 'bg-white' : 'bg-black text-white'}`}
 />
 </div>
 <div>
 <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Teléfono</label>
 <input
 type="text"
 value={currentRb.telefonoPromotor}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, telefonoPromotor: e.target.value })}
 className={`w-full px-2 py-1 rounded text-[10px] ${isStitchLight ? 'bg-white' : 'bg-black text-white'}`}
 />
 </div>
 </div>

 <div>
 <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Hotel Alojamientos</label>
 <input
 type="text"
 value={currentRb.hotelNombre}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, hotelNombre: e.target.value })}
 className={`w-full px-2 py-1 rounded text-[10px] ${isStitchLight ? 'bg-white' : 'bg-black text-white'}`}
 />
 </div>

 <div>
 <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Catering & Menús</label>
 <input
 type="text"
 value={currentRb.cateringInfo}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, cateringInfo: e.target.value })}
 className={`w-full px-2 py-1 rounded text-[10px] ${isStitchLight ? 'bg-white' : 'bg-black text-white'}`}
 />
 </div>
 </div>

 <div className={`p-3 rounded-lg space-y-1.5 ${isStitchLight ? 'bg-slate-50' : 'bg-neutral-900/70'}`}>
 <span className={`text-[10px] font-mono uppercase font-bold ${isStitchLight ? 'text-sky-400' : 'text-[#d1b375]'}`}>🎸 Input List / Rider de Canales</span>
 <textarea
 rows={4}
 value={currentRb.inputList}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, inputList: e.target.value })}
 className={`w-full p-2 rounded font-mono text-[10px] ${isStitchLight ? 'bg-white text-slate-800' : 'bg-black text-neutral-200'}`}
 />
 </div>

 <button
 type="button"
 onClick={() => {
 const currentRbData = allRoadbooks[selectedDateKey] || currentRb;
 const printWindow = window.open('', '_blank');
 if (!printWindow) return;
 printWindow.document.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <title>Hoja de Ruta Bakandeya - ${selectedConcert ? selectedConcert.sala : 'Concierto'}</title>
 <style>
 body { font-family: system-ui, -apple-system, sans-serif; margin: 30px; color: #111; line-height: 1.5; }
 h1 { font-size: 22px; margin: 0; text-transform: uppercase; color: #d97706; }
 h2 { font-size: 14px; color: #555; margin-top: 2px; margin-bottom: 20px; font-weight: normal; }
 .badge { display: inline-block; padding: 4px 10px; background: #fef3c7; color: #92400e; font-weight: bold; border-radius: 4px; font-size: 11px; font-family: monospace; }
 .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
 .card { border: 1px solid #e5e7eb; padding: 12px 15px; border-radius: 8px; background: #fafafa; }
 .card-title { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 6px; }
 .item-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e5e7eb; font-size: 12px; }
 .time { font-weight: bold; font-family: monospace; color: #d97706; width: 60px; }
 pre { font-family: monospace; font-size: 11px; background: #fff; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; white-space: pre-wrap; margin: 0; }
 .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 10px; color: #888; text-align: center; }
 </style>
 </head>
 <body>
 <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f59e0b; padding-bottom:12px; margin-bottom:20px;">
 <div>
 <h1>Bakandeya — Hoja de Ruta de Gira</h1>
 <h2>${selectedConcert ? `${selectedConcert.sala} (${selectedConcert.ciudad})` : selectedEventTitle}</h2>
 </div>
 <div>
 <span class="badge">FECHA: ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}</span>
 </div>
 </div>

 <div class="grid">
 <div class="card">
 <div class="card-title">📍 Ubicación & Logística</div>
 <p style="margin:2px 0; font-size:13px; font-weight:bold;">${selectedEventDetails.lugar}</p>
 <p style="margin:2px 0; font-size:11px; color:#555;">${selectedEventDetails.direccion || 'Dirección no especificada'}</p>
 <p style="margin:8px 0 2px 0; font-size:11px;"><strong>Caché / Condición:</strong> ${selectedEventDetails.fee}</p>
 </div>

 <div class="card">
 <div class="card-title">📞 Contactos & Hotel</div>
 <p style="margin:2px 0; font-size:11px;"><strong>Promotor/Contacto:</strong> ${currentRbData.contactoPromotor} (${currentRbData.telefonoPromotor})</p>
 <p style="margin:2px 0; font-size:11px;"><strong>Técnico Sonido:</strong> ${currentRbData.tecnicoSonido}</p>
 <p style="margin:2px 0; font-size:11px;"><strong>Hotel:</strong> ${currentRbData.hotelNombre}</p>
 <p style="margin:2px 0; font-size:11px;"><strong>Catering:</strong> ${currentRbData.cateringInfo}</p>
 </div>
 </div>

 <div class="card" style="margin-bottom: 20px;">
 <div class="card-title">⏱️ Horarios / Run of Show</div>
 ${currentRunOfShow.length === 0 ? '<p style="font-size:11px; color:#888;">Sin horarios definidos.</p>' : currentRunOfShow.map(i => `
 <div class="item-row">
 <span class="time">${i.time}</span>
 <span style="flex:1;">${i.activity}</span>
 </div>
 `).join('')}
 </div>

 <div class="grid">
 <div class="card">
 <div class="card-title">🎸 Lista de Canales / Input List (Rider)</div>
 <pre>${currentRbData.inputList}</pre>
 </div>
 <div class="card">
 <div class="card-title">🎒 Check-list Cacharros & Backline</div>
 ${currentGear.length === 0 ? '<p style="font-size:11px; color:#888;">Sin material asignado.</p>' : currentGear.map(g => `
 <div class="item-row">
 <span>${g.checked ? '☑' : '☐'} ${g.label}</span>
 </div>
 `).join('')}
 </div>
 </div>

 <div class="footer">
 Documento Oficial de Gira • Generado por Bakandeya Band CRM
 </div>

 <script>
 window.onload = function() { window.print(); }
 </script>
 </body>
 </html>
 `);
 printWindow.document.close();
 }}
 className={`w-full py-2 px-3 rounded-xl font-mono text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
 isStitchLight
 ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
 : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-extrabold'
 }`}
 >
 <Download className="w-3.5 h-3.5" />
 <span>Imprimir / Exportar Hoja de Ruta (PDF)</span>
 </button>
 </div>
 );
 })()}
 </div>
 ) : (
 <>
 {/* Form to add new item */}
 <div className="mb-3">
 {activeTab === 'runofshow' ? (
 <form onSubmit={handleAddRunOfShow} className="flex gap-1.5 items-center">
 <input
 type="text"
 placeholder="17:30"
 value={newRunTime}
 onChange={(e) => setNewRunTime(e.target.value)}
 className={`w-16 px-2 py-1 text-[10px] font-mono rounded outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-neutral-200'
 }`}
 />
 <input
 type="text"
 placeholder="Nueva actividad/horario..."
 value={newRunActivity}
 onChange={(e) => setNewRunActivity(e.target.value)}
 className={`flex-1 px-2 py-1 text-[10px] rounded outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-neutral-200'
 }`}
 />
 <button
 type="submit"
 className={`p-1.5 rounded transition-colors cursor-pointer ${
 isStitchLight ? 'bg-sky-500/15 text-white hover:bg-sky-500/15' : 'bg-[#d1b375]/15 text-stone-950 hover:bg-[#d1b375]/15 font-bold'
 }`}
 title="Añadir horario"
 >
 <Plus className="w-3.5 h-3.5" />
 </button>
 </form>
 ) : (
 <form onSubmit={handleAddGear} className="flex gap-1.5 items-center">
 <input
 type="text"
 placeholder="Añadir instrumento, cable o cacharro de directo..."
 value={newGearLabel}
 onChange={(e) => setNewGearLabel(e.target.value)}
 className={`flex-1 px-2 py-1 text-[10px] rounded outline-none ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-neutral-200'
 }`}
 />
 <button
 type="submit"
 className={`p-1.5 rounded transition-colors cursor-pointer ${
 isStitchLight ? 'bg-sky-500/15 text-white hover:bg-sky-500/15' : 'bg-[#d1b375]/15 text-stone-950 hover:bg-[#d1b375]/15 font-bold'
 }`}
 title="Añadir material"
 >
 <Plus className="w-3.5 h-3.5" />
 </button>
 </form>
 )}
 </div>

 {/* Interactive Lists */}
 <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
 {activeTab === 'runofshow' ? (
 currentRunOfShow.length === 0 ? (
 <p className={`text-[10px] italic text-center py-4 ${textMuted}`}>No hay horarios registrados para este día.</p>
 ) : (
 currentRunOfShow.map((item) => {
 const isItemDone = item.done;
 return (
 <div 
 key={item.id}
 onClick={() => handleToggleRunOfShow(item.id)}
 className={`p-2 rounded-md flex items-center gap-2.5 cursor-pointer transition-colors group ${
 isItemDone 
 ? isStitchLight
 ? 'bg-slate-100 text-slate-400 line-through'
 : 'bg-[#131313]/50 text-neutral-500 line-through'
 : isStitchLight
 ? 'bg-white text-slate-700 hover:-indigo-300'
 : 'bg-[#131313] text-neutral-200 hover:-[#99907c]/35'
 }`}
 >
 <span className={`font-mono text-[10px] font-bold shrink-0 ${
 isItemDone 
 ? isStitchLight ? 'text-slate-300' : 'text-neutral-600' 
 : isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'
 }`}>
 {item.time}
 </span>
 <p className="text-[10px] font-sans leading-normal flex-1">{item.activity}</p>
 <button
 type="button"
 onClick={(e) => handleDeleteRunOfShow(item.id, e)}
 className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
 title="Eliminar"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 );
 })
 )
 ) : (
 currentGear.length === 0 ? (
 <p className={`text-[10px] italic text-center py-4 ${textMuted}`}>No hay material registrado para este día.</p>
 ) : (
 currentGear.map(item => {
 const isChecked = item.checked;
 return (
 <div 
 key={item.id}
 onClick={() => handleToggleGear(item.id)}
 className={`p-2 rounded-md flex items-center gap-2.5 cursor-pointer transition-colors group ${
 isChecked 
 ? isStitchLight
 ? 'bg-slate-100 text-slate-400 line-through'
 : 'bg-[#131313]/50 text-neutral-500 line-through'
 : isStitchLight
 ? 'bg-white text-slate-700 hover:-indigo-300'
 : 'bg-[#131313] text-neutral-200 hover:-[#99907c]/35'
 }`}
 >
 <input
 type="checkbox"
 checked={isChecked}
 onChange={() => {}} // handled by div click
 className={`rounded focus:ring-0 cursor-pointer h-3.5 w-3.5 ${
 isStitchLight
 ? '-slate-300 text-sky-400 bg-white'
 : '-[#99907c]/40 text-[#f2ca50] bg-neutral-900'
 }`}
 />
 <p className="text-[10px] font-sans leading-normal flex-1">{item.label}</p>
 <button
 type="button"
 onClick={(e) => handleDeleteGear(item.id, e)}
 className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
 title="Eliminar"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 );
 })
 )
 )}
 </div>
 </>
 )}
 </div>
 )}

 {/* Footer info */}
 <div className={` pt-4 mt-6 flex justify-between items-center text-[10px] font-mono ${
 isStitchLight ? '-slate-100 text-slate-400' : '-[#99907c]/15 text-neutral-500'
 }`}>
 <span>Huso Horario: Madrid (UTC+2)</span>
 <span className="text-[#10b981] dark:text-[#b8d6b8]">● Sincronizado</span>
 </div>
 </div>

 {/* CREATE REHEARSAL MODAL */}
 {showCreateModal === 'rehearsal' && (
 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
 <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-[#181818] text-neutral-100'
 }`}>
 <button
 onClick={() => setShowCreateModal(null)}
 className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
 >
 ✕
 </button>
 <div className="flex items-center gap-2 mb-4">
 <span className="p-2 rounded-lg bg-[#10b981]/15 text-[#10b981]">
 <Calendar className="w-5 h-5" />
 </span>
 <div>
 <h3 className="font-bold text-base font-display">Crear Nuevo Ensayo</h3>
 <p className="text-[10px] font-mono text-neutral-400">
 Fecha: {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 </p>
 </div>
 </div>

 <form onSubmit={handleSaveNewRehearsal} className="space-y-4">
 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Horario del Ensayo</label>
 <input
 type="text"
 value={rehTime}
 onChange={(e) => setRehTime(e.target.value)}
 placeholder="ej. 18:00 - 21:00"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none font-mono ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Lugar / Local</label>
 <input
 type="text"
 value={rehLugar}
 onChange={(e) => setRehLugar(e.target.value)}
 placeholder="ej. Rock Palace, Madrid (Local 4)"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Convocados / Asistentes</label>
 <input
 type="text"
 value={rehAsistentes}
 onChange={(e) => setRehAsistentes(e.target.value)}
 placeholder="ej. Banda completa / Sección rítmica"
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Estado</label>
 <select
 value={rehEstado}
 onChange={(e) => setRehEstado(e.target.value as any)}
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 >
 <option value="programado">Programado</option>
 <option value="confirmado">Confirmado</option>
 <option value="realizado">Realizado</option>
 <option value="cancelado">Cancelado</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Notas / Objetivo del Ensayo</label>
 <textarea
 value={rehNotas}
 onChange={(e) => setRehNotas(e.target.value)}
 rows={3}
 placeholder="ej. Montar la estructura de la canción nueva y probar dinámicas de volumen."
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowCreateModal(null)}
 className="px-2 py-1 text-[10px] font-mono rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
 isStitchLight ? 'bg-[#10b981]/15 hover:bg-[#10b981]/15 text-white' : 'bg-[#10b981]/15 hover:bg-[#10b981]/15 text-stone-950 font-bold'
 }`}
 >
 Guardar Ensayo
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* CREATE CONCERT MODAL */}
 {showCreateModal === 'concert' && (
 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
 <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
 isStitchLight ? 'bg-white text-slate-900' : 'bg-[#181818] text-neutral-100'
 }`}>
 <button
 onClick={() => setShowCreateModal(null)}
 className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
 >
 ✕
 </button>
 <div className="flex items-center gap-2 mb-4">
 <span className="p-2 rounded-lg bg-[#d1b375]/15 text-[#d1b375]">
 <Sparkles className="w-5 h-5" />
 </span>
 <div>
 <h3 className="font-bold text-base font-display">Crear Nuevo Concierto</h3>
 <p className="text-[10px] font-mono text-neutral-400">
 Fecha: {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 </p>
 </div>
 </div>

 <form onSubmit={handleSaveNewConcert} className="space-y-3.5">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Ciudad</label>
 <input
 type="text"
 value={concCiudad}
 onChange={(e) => setConcCiudad(e.target.value)}
 placeholder="ej. Madrid"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Sala / Evento</label>
 <input
 type="text"
 value={concSala}
 onChange={(e) => setConcSala(e.target.value)}
 placeholder="ej. Sala El Sol"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Caché (€)</label>
 <input
 type="number"
 value={concCache}
 onChange={(e) => setConcCache(e.target.value)}
 placeholder="1200"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none font-mono ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Aforo Máximo</label>
 <input
 type="number"
 value={concAforo}
 onChange={(e) => setConcAforo(e.target.value)}
 placeholder="300"
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none font-mono ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Tipo de Evento</label>
 <select
 value={concTipo}
 onChange={(e) => setConcTipo(e.target.value as any)}
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 >
 <option value="propio">Concierto Propio</option>
 <option value="festival">Festival / Macroevento</option>
 <option value="privado">Evento Privado / Boda</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Estado de Pago</label>
 <select
 value={concEstadoPago}
 onChange={(e) => setConcEstadoPago(e.target.value as any)}
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 >
 <option value="pendiente">Pendiente</option>
 <option value="parcial">Anticipo / Parcial</option>
 <option value="cobrado">Cobrado 100%</option>
 </select>
 </div>
 </div>

 <div className="flex items-center gap-2 py-1">
 <input
 type="checkbox"
 id="concContrato"
 checked={concContrato}
 onChange={(e) => setConcContrato(e.target.checked)}
 className="rounded text-[#d1b375] focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <label htmlFor="concContrato" className="text-[10px] font-mono cursor-pointer select-none">
 Contrato firmado y verificado
 </label>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-neutral-400 mb-1">Notas / Cláusulas Técnicas</label>
 <textarea
 value={concNotas}
 onChange={(e) => setConcNotas(e.target.value)}
 rows={2}
 placeholder="ej. Prueba de sonido a las 18:30h. Catering frío y 4 camerinos incluidos."
 className={`w-full px-2 py-1 text-[10px] rounded-lg outline-none ${
 isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
 }`}
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowCreateModal(null)}
 className="px-2 py-1 text-[10px] font-mono rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
 isStitchLight ? 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-white' : 'bg-[#d1b375]/15 hover:bg-[#d1b375]/15 text-stone-950 font-bold'
 }`}
 >
 Guardar Concierto
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 </div>
 );
}
