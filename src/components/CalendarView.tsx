import React, { useState, useEffect } from 'react';
import { Rehearsal, Concert, ThemeColors } from '../types';
import { Calendar, Clock, MapPin, CheckSquare, Sparkles, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Plus, Trash2, Download } from 'lucide-react';

interface CalendarViewProps {
  colors: ThemeColors;
  rehearsals: Rehearsal[];
  concerts: Concert[];
  onUpdateRehearsal: (id: string, updatedFields: Partial<Rehearsal>) => void;
  onUpdateConcert: (id: string, updatedFields: Partial<Concert>) => void;
  onAddRehearsal?: (rehearsal: Rehearsal) => void;
  onAddConcert?: (concert: Concert) => void;
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
  onAddConcert
}: CalendarViewProps) {
  const realToday = new Date();
  const [viewDate, setViewDate] = useState<Date>(() => new Date(2026, 6, 1)); // Default to July 2026
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 6, 28));
  const [twoMonthsMode, setTwoMonthsMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'runofshow' | 'gear'>('runofshow');

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

  // Helper function to get events for any date string "YYYY-MM-DD"
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

  const selectedEventDetails = selectedEvents.concerts.length > 0
    ? {
        type: 'concert',
        time: '21:30',
        lugar: `${selectedEvents.concerts[0].sala}, ${selectedEvents.concerts[0].ciudad}`,
        fee: `${selectedEvents.concerts[0].cache} € (Caché Pactado)`,
        notes: selectedEvents.concerts[0].notas,
      }
    : selectedEvents.rehearsals.length > 0
      ? {
          type: isGeneralRehearsal ? 'rehearsal_general' : 'rehearsal',
          time: selectedEvents.rehearsals[0].hora,
          lugar: selectedEvents.rehearsals[0].lugar,
          fee: 'Gratuito',
          notes: selectedEvents.rehearsals[0].notas,
        }
      : {
          type: 'free',
          time: '--:--',
          lugar: 'Sin evento agendado',
          fee: '--',
          notes: 'Día de descanso de la banda para composing o ensayos individuales.',
        };

  const isStitchLight = colors.accent === 'text-indigo-600';
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
          <div className={`text-center font-bold font-display uppercase tracking-wider text-xs mb-3 pb-1 border-b ${
            isStitchLight ? 'text-indigo-600 border-slate-200' : 'text-[#f2ca50] border-neutral-800'
          }`}>
            {monthNames[month]} {year}
          </div>
        )}

        {/* Weekday Labels */}
        <div className={`grid grid-cols-7 gap-1.5 text-center text-[11px] font-mono mb-2 font-bold uppercase ${textSub}`}>
          {weekdays.map(day => (
            <div key={day} className="py-0.5">{day}</div>
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

            return (
              <button
                id={`calendar-day-${formattedDate}`}
                key={`day-${formattedDate}`}
                onClick={() => setSelectedDate(new Date(year, month, cell.day))}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-between p-1 relative transition-all cursor-pointer ${
                  isToday ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-neutral-900 z-10' : ''
                } ${
                  isSelected
                    ? isStitchLight
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md shadow-indigo-150 scale-[1.03]'
                      : 'bg-[#f2ca50] border-[#f2ca50] text-[#3c2f00] font-bold shadow-lg shadow-[#f2ca50]/15 scale-[1.03]'
                    : isToday
                      ? isStitchLight
                        ? 'bg-amber-100/80 border-amber-500 text-amber-900 font-bold'
                        : 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                      : isStitchLight
                        ? 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
                        : 'bg-[#131313] border-[#99907c]/15 hover:border-[#99907c]/35 hover:bg-[#1c1b1b]'
                }`}
              >
                {isToday && (
                  <span className={`absolute -top-1.5 -right-1 text-[6.5px] font-mono font-black uppercase px-0.8 py-0.2 rounded shadow-md z-20 ${
                    isStitchLight ? 'bg-amber-600 text-white' : 'bg-amber-500 text-stone-950'
                  }`}>
                    HOY
                  </span>
                )}
                <span className={`text-xs ${
                  isSelected 
                    ? isStitchLight ? 'text-white' : 'text-[#3c2f00]' 
                    : isToday
                      ? isStitchLight ? 'text-amber-950 font-black' : 'text-amber-300 font-black'
                      : isStitchLight ? 'text-slate-800' : 'text-neutral-100'
                }`}>
                  {cell.day}
                </span>
                
                {/* Glowing Dots Indicator */}
                <div className="flex gap-1 justify-center w-full mb-0.5">
                  {hasConcert && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isSelected 
                        ? isStitchLight ? 'bg-white' : 'bg-[#3c2f00]' 
                        : isStitchLight ? 'bg-indigo-500' : 'bg-[#f2ca50] shadow-[0_0_8px_#f2ca50]'
                    }`} />
                  )}
                  {hasRehearsal && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isSelected 
                        ? isStitchLight ? 'bg-white' : 'bg-[#3c2f00]' 
                        : isStitchLight ? 'bg-emerald-500' : 'bg-[#b8d6b8] shadow-[0_0_8px_#b8d6b8]'
                    }`} />
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
          <div className={`flex justify-between items-start md:items-center border-b pb-4 mb-4 gap-4 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
            <div>
              <h4 className={`text-xs font-mono uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Calendario de Directos</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <h2 className={`text-xl font-bold font-display uppercase tracking-wider ${textTitle}`}>
                  {twoMonthsMode ? (
                    <>
                      {monthNames[currentMonth]} - {monthNames[nextMonth]} <span className="text-amber-400 font-mono text-base">{currentYear === nextMonthYear ? currentYear : `${currentYear}/${nextMonthYear}`}</span>
                    </>
                  ) : (
                    <>
                      {monthNames[currentMonth]} <span className="text-amber-400 font-mono text-base">{currentYear}</span>
                    </>
                  )}
                </h2>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={handlePrevMonth}
                    className={`p-1 rounded-lg border transition-all cursor-pointer ${
                      isStitchLight ? 'border-slate-200 hover:bg-slate-100 text-slate-700' : 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                    }`}
                    title="Meses anteriores"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className={`p-1 rounded-lg border transition-all cursor-pointer ${
                      isStitchLight ? 'border-slate-200 hover:bg-slate-100 text-slate-700' : 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                    }`}
                    title="Meses siguientes"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleGoToday}
                    className="text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer"
                    title="Ir al mes y día actual"
                  >
                    Hoy
                  </button>

                  {/* Mode Toggle: 1 Mes vs 2 Meses */}
                  <div className={`flex items-center rounded-lg border p-0.5 ml-2 ${
                    isStitchLight ? 'border-slate-200 bg-slate-100' : 'border-neutral-800 bg-neutral-900'
                  }`}>
                    <button
                      onClick={() => setTwoMonthsMode(false)}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                        !twoMonthsMode
                          ? isStitchLight ? 'bg-indigo-600 text-white shadow-sm' : 'bg-amber-500 text-stone-950 shadow-sm'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Ver 1 mes"
                    >
                      1 Mes
                    </button>
                    <button
                      onClick={() => setTwoMonthsMode(true)}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                        twoMonthsMode
                          ? isStitchLight ? 'bg-indigo-600 text-white shadow-sm' : 'bg-amber-500 text-stone-950 shadow-sm'
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
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 border ${
                  isStitchLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 shadow-sm'
                }`}
                title="Crear un nuevo ensayo para la fecha seleccionada"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Crear Ensayo</span>
              </button>

              <button
                id="create-concert-btn"
                onClick={() => setShowCreateModal('concert')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 border ${
                  isStitchLight
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-sm'
                }`}
                title="Crear un nuevo concierto para la fecha seleccionada"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Crear Concierto</span>
              </button>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold ${
                isStitchLight ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'bg-[#b8d6b8]/10 border border-[#b8d6b8]/20 text-[#b8d6b8]'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" /> Sincronización Automática
              </span>
            </div>
          </div>

          {/* Sync Notifications */}
          {syncSuccessMessage && (
            <div className={`mb-4 p-2 px-3 border rounded-lg text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
              isStitchLight 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="flex-1 font-mono text-[10px]">{syncSuccessMessage}</span>
              <button onClick={() => setSyncSuccessMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
            </div>
          )}
          {syncErrorMessage && (
            <div className={`mb-4 p-2 px-3 border rounded-lg text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
              isStitchLight 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
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
        <div className={`flex flex-wrap gap-4 text-[10px] font-mono border-t pt-4 mt-6 ${isStitchLight ? 'text-slate-400 border-slate-100' : 'text-[#99907c]/15 text-neutral-500 border-[#99907c]/15'}`}>
          <div className="flex items-center gap-1.5">
            <span className={`text-[8px] font-mono font-extrabold uppercase px-1 py-0.2 rounded ${
              isStitchLight ? 'bg-amber-600 text-white' : 'bg-amber-500 text-stone-950'
            }`}>HOY</span>
            <span>Día Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isStitchLight ? 'bg-indigo-500' : 'bg-[#f2ca50] shadow-[0_0_8px_#f2ca50]'}`} />
            <span>Concierto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isStitchLight ? 'bg-emerald-500' : 'bg-[#b8d6b8] shadow-[0_0_8px_#b8d6b8]'}`} />
            <span>Ensayo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-emerald-400 ${isStitchLight ? 'bg-emerald-600' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'}`} />
            <span>Ensayo General</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded inline-block ${isStitchLight ? 'bg-indigo-600' : 'bg-[#f2ca50]'}`} />
            <span>Seleccionado</span>
          </div>
        </div>
      </div>

      {/* RIGHT: LOGISTICS & CHECKLISTS SIDEBAR (1/3 width) */}
      <div className={`${colors.card} p-5 flex flex-col justify-between lg:col-span-1`}>
        <div>
          {/* Day details */}
          <div className={`border-b pb-4 mb-4 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
            <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`}>Logística de Ensayos y Conciertos</div>
            <h3 className={`text-lg font-bold font-display tracking-wide mt-1 ${textTitle}`}>{selectedEventTitle}</h3>
            <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>
              {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
            </p>
          </div>

          {/* Core Info */}
          <div className={`space-y-3 mb-6 border rounded-lg p-3 ${
            isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131313]/60 border-[#99907c]/15'
          }`}>
            <div className="flex items-center gap-2 text-xs">
              <Clock className={`w-4 h-4 shrink-0 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} />
              <span className={`font-mono ${textSub}`}>Hora:</span>
              <span className={`font-bold font-mono ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>{selectedEventDetails.time}</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`} />
              <div>
                <span className={`font-mono ${textSub}`}>Lugar:</span>
                <p className={`font-medium font-sans mt-0.5 ${textTitle}`}>{selectedEventDetails.lugar}</p>
              </div>
            </div>
            {selectedEventDetails.type === 'concert' && (
              <div className={`flex items-center gap-2 text-xs border-t pt-2 mt-1 ${isStitchLight ? 'border-slate-100' : 'border-neutral-900'}`}>
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className={`font-mono ${textSub}`}>Compensación:</span>
                <span className="text-emerald-600 dark:text-[#b8d6b8] font-bold font-mono">{selectedEventDetails.fee}</span>
              </div>
            )}
            <div className={`text-[11px] font-sans italic border-t pt-2 leading-relaxed ${isStitchLight ? 'border-slate-100 text-slate-500' : 'border-neutral-900 text-neutral-400'}`}>
              &ldquo;{selectedEventDetails.notes}&rdquo;
            </div>
          </div>

          {/* Subtabs for Checklist */}
          <div className={`flex border-b mb-4 ${isStitchLight ? 'border-slate-100' : 'border-neutral-900'}`}>
            <button
              id="calendar-subtab-runofshow"
              onClick={() => setActiveTab('runofshow')}
              className={`flex-1 pb-2 text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors ${
                activeTab === 'runofshow'
                  ? isStitchLight
                    ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                    : 'border-b-2 border-[#f2ca50] text-[#f2ca50] font-bold'
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
                    ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                    : 'border-b-2 border-[#ffb596] text-[#ffb596] font-bold'
                  : isStitchLight
                    ? 'text-slate-400 hover:text-slate-600'
                    : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Cacharros & Backline
            </button>
          </div>

          {/* Form to add new item */}
          <div className="mb-3">
            {activeTab === 'runofshow' ? (
              <form onSubmit={handleAddRunOfShow} className="flex gap-1.5 items-center">
                <input
                  type="text"
                  placeholder="17:30"
                  value={newRunTime}
                  onChange={(e) => setNewRunTime(e.target.value)}
                  className={`w-16 px-2 py-1 text-xs font-mono rounded border outline-none ${
                    isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Nueva actividad/horario..."
                  value={newRunActivity}
                  onChange={(e) => setNewRunActivity(e.target.value)}
                  className={`flex-1 px-2.5 py-1 text-xs rounded border outline-none ${
                    isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                  }`}
                />
                <button
                  type="submit"
                  className={`p-1.5 rounded border transition-colors cursor-pointer ${
                    isStitchLight ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' : 'bg-amber-500 text-stone-950 border-amber-500 hover:bg-amber-400 font-bold'
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
                  className={`flex-1 px-2.5 py-1 text-xs rounded border outline-none ${
                    isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                  }`}
                />
                <button
                  type="submit"
                  className={`p-1.5 rounded border transition-colors cursor-pointer ${
                    isStitchLight ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' : 'bg-amber-500 text-stone-950 border-amber-500 hover:bg-amber-400 font-bold'
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
                <p className={`text-xs italic text-center py-4 ${textMuted}`}>No hay horarios registrados para este día.</p>
              ) : (
                currentRunOfShow.map((item) => {
                  const isItemDone = item.done;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleToggleRunOfShow(item.id)}
                      className={`p-2 rounded-md border flex items-center gap-2.5 cursor-pointer transition-colors group ${
                        isItemDone 
                          ? isStitchLight
                            ? 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                            : 'bg-[#131313]/50 border-neutral-800 text-neutral-500 line-through'
                          : isStitchLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                            : 'bg-[#131313] border-[#99907c]/15 text-neutral-200 hover:border-[#99907c]/35'
                      }`}
                    >
                      <span className={`font-mono text-xs font-bold shrink-0 ${
                        isItemDone 
                          ? isStitchLight ? 'text-slate-300' : 'text-neutral-600' 
                          : isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'
                      }`}>
                        {item.time}
                      </span>
                      <p className="text-[11px] font-sans leading-normal flex-1">{item.activity}</p>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRunOfShow(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 transition-opacity"
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
                <p className={`text-xs italic text-center py-4 ${textMuted}`}>No hay material registrado para este día.</p>
              ) : (
                currentGear.map(item => {
                  const isChecked = item.checked;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleToggleGear(item.id)}
                      className={`p-2 rounded-md border flex items-center gap-2.5 cursor-pointer transition-colors group ${
                        isChecked 
                          ? isStitchLight
                            ? 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                            : 'bg-[#131313]/50 border-neutral-800 text-neutral-500 line-through'
                          : isStitchLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                            : 'bg-[#131313] border-[#99907c]/15 text-neutral-200 hover:border-[#99907c]/35'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by div click
                        className={`rounded focus:ring-0 cursor-pointer h-3.5 w-3.5 ${
                          isStitchLight
                            ? 'border-slate-300 text-indigo-600 bg-white'
                            : 'border-[#99907c]/40 text-[#f2ca50] bg-neutral-900'
                        }`}
                      />
                      <p className="text-[11px] font-sans leading-normal flex-1">{item.label}</p>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGear(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 transition-opacity"
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
        </div>

        {/* Footer info */}
        <div className={`border-t pt-4 mt-6 flex justify-between items-center text-[10px] font-mono ${
          isStitchLight ? 'border-slate-100 text-slate-400' : 'border-[#99907c]/15 text-neutral-500'
        }`}>
          <span>Huso Horario: Madrid (UTC+2)</span>
          <span className="text-emerald-500 dark:text-[#b8d6b8]">● Sincronizado</span>
        </div>
      </div>

      {/* CREATE REHEARSAL MODAL */}
      {showCreateModal === 'rehearsal' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
            isStitchLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#181818] border-neutral-800 text-neutral-100'
          }`}>
            <button
              onClick={() => setShowCreateModal(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-base font-display">Crear Nuevo Ensayo</h3>
                <p className="text-xs font-mono text-neutral-400">
                  Fecha: {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveNewRehearsal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Horario del Ensayo</label>
                <input
                  type="text"
                  value={rehTime}
                  onChange={(e) => setRehTime(e.target.value)}
                  placeholder="ej. 18:00 - 21:00"
                  required
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Lugar / Local</label>
                <input
                  type="text"
                  value={rehLugar}
                  onChange={(e) => setRehLugar(e.target.value)}
                  placeholder="ej. Rock Palace, Madrid (Local 4)"
                  required
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Convocados / Asistentes</label>
                <input
                  type="text"
                  value={rehAsistentes}
                  onChange={(e) => setRehAsistentes(e.target.value)}
                  placeholder="ej. Banda completa / Sección rítmica"
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Estado</label>
                <select
                  value={rehEstado}
                  onChange={(e) => setRehEstado(e.target.value as any)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                >
                  <option value="programado">Programado</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Notas / Objetivo del Ensayo</label>
                <textarea
                  value={rehNotas}
                  onChange={(e) => setRehNotas(e.target.value)}
                  rows={3}
                  placeholder="ej. Montar la estructura de la canción nueva y probar dinámicas de volumen."
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(null)}
                  className="px-4 py-2 text-xs font-mono rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    isStitchLight ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold'
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
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
            isStitchLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#181818] border-neutral-800 text-neutral-100'
          }`}>
            <button
              onClick={() => setShowCreateModal(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-base font-display">Crear Nuevo Concierto</h3>
                <p className="text-xs font-mono text-neutral-400">
                  Fecha: {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveNewConcert} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={concCiudad}
                    onChange={(e) => setConcCiudad(e.target.value)}
                    placeholder="ej. Madrid"
                    required
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Sala / Evento</label>
                  <input
                    type="text"
                    value={concSala}
                    onChange={(e) => setConcSala(e.target.value)}
                    placeholder="ej. Sala El Sol"
                    required
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Caché (€)</label>
                  <input
                    type="number"
                    value={concCache}
                    onChange={(e) => setConcCache(e.target.value)}
                    placeholder="1200"
                    required
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Aforo Máximo</label>
                  <input
                    type="number"
                    value={concAforo}
                    onChange={(e) => setConcAforo(e.target.value)}
                    placeholder="300"
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Tipo de Evento</label>
                  <select
                    value={concTipo}
                    onChange={(e) => setConcTipo(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  >
                    <option value="propio">Concierto Propio</option>
                    <option value="festival">Festival / Macroevento</option>
                    <option value="privado">Evento Privado / Boda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Estado de Pago</label>
                  <select
                    value={concEstadoPago}
                    onChange={(e) => setConcEstadoPago(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
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
                  className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="concContrato" className="text-xs font-mono cursor-pointer select-none">
                  Contrato firmado y verificado
                </label>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Notas / Cláusulas Técnicas</label>
                <textarea
                  value={concNotas}
                  onChange={(e) => setConcNotas(e.target.value)}
                  rows={2}
                  placeholder="ej. Prueba de sonido a las 18:30h. Catering frío y 4 camerinos incluidos."
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(null)}
                  className="px-4 py-2 text-xs font-mono rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    isStitchLight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
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
