import React, { useState } from 'react';
import { Rehearsal, Concert, ThemeColors } from '../types';
import { Calendar, Clock, MapPin, CheckSquare, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  colors: ThemeColors;
  rehearsals: Rehearsal[];
  concerts: Concert[];
  onUpdateRehearsal: (id: string, updatedFields: Partial<Rehearsal>) => void;
  onUpdateConcert: (id: string, updatedFields: Partial<Concert>) => void;
}

interface RunOfShowItem {
  time: string;
  activity: string;
  done: boolean;
}

export default function CalendarView({
  colors,
  rehearsals,
  concerts,
  onUpdateRehearsal,
  onUpdateConcert
}: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(11); // Default to July 11
  const [activeTab, setActiveTab] = useState<'runofshow' | 'gear'>('runofshow');
  
  // Sync state
  const [isSyncingConcerts, setIsSyncingConcerts] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState('');
  const [syncErrorMessage, setSyncErrorMessage] = useState('');

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

  // Interactive checklist in local state to showcase smooth functionality
  const [checklistItems, setChecklistItems] = useState([
    { id: 'item-1', label: 'Teclado Korg SV-2 + Stand', checked: true },
    { id: 'item-2', label: 'Sección Metales (Sordinas y atril)', checked: true },
    { id: 'item-3', label: 'Banderola de Escenario Bakandeya', checked: false },
    { id: 'item-4', label: 'Merchandising (Camisetas, Pegatinas, CDs)', checked: false },
    { id: 'item-5', label: 'Cables Jack / XLR de recambio', checked: true },
    { id: 'item-6', label: 'DI-Box estéreo para teclados', checked: false },
  ]);

  const [runOfShow, setRunOfShow] = useState<RunOfShowItem[]>([
    { time: '17:00', activity: 'Llegada a la sala y descarga de bártulos', done: true },
    { time: '17:30', activity: 'Montaje de escenario e in-ears', done: true },
    { time: '18:15', activity: 'Prueba de sonido (Soundcheck de metales y bases)', done: true },
    { time: '19:30', activity: 'Cena de la banda / Catering', done: false },
    { time: '21:00', activity: 'Apertura de puertas', done: false },
    { time: '21:30', activity: 'SHOWTIME: ¡Comienza el bolo de Bakandeya! 🎺💥', done: false },
    { time: '23:30', activity: 'Merchandising, firmas y recogida de equipo', done: false },
  ]);

  const handleToggleChecklist = (id: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleToggleRunOfShow = (idx: number) => {
    setRunOfShow(prev => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
  };

  // Simple Month generator for July 2026
  // July 2026 starts on a Wednesday
  const daysInJuly = 31;
  const startOffset = 2; // Wednesday is 2 if Sunday is 0, Monday is 1, Tuesday is 2 (Wait, let's say Monday starts grid, Monday is offset 0. Monday, Tuesday, Wednesday offset = 2)
  const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Check if a day has events
  const getDayEvents = (day: number) => {
    const formattedDate = `2026-07-${String(day).padStart(2, '0')}`;
    const dayConcerts = concerts.filter(c => c.fecha === formattedDate);
    const dayRehearsals = rehearsals.filter(r => r.fecha === formattedDate);
    return { concerts: dayConcerts, rehearsals: dayRehearsals };
  };

  // Create grid cells
  const gridCells = [];
  for (let i = 0; i < startOffset; i++) {
    gridCells.push({ empty: true, day: 0 });
  }
  for (let d = 1; d <= daysInJuly; d++) {
    gridCells.push({ empty: false, day: d });
  }

  // Get current event for the selected day
  const selectedEvents = getDayEvents(selectedDay);
  const selectedEventTitle = selectedEvents.concerts.length > 0 
    ? `Concierto: ${selectedEvents.concerts[0].sala}` 
    : selectedEvents.rehearsals.length > 0 
      ? `Ensayo: ${selectedEvents.rehearsals[0].lugar.split(',')[0]}` 
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
          type: 'rehearsal',
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

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans items-stretch`}>
      
      {/* LEFT: MONTH GRID CALENDAR (2/3 width) */}
      <div className={`${colors.card} p-6 flex flex-col justify-between`}>
        <div>
          {/* Header */}
          <div className={`flex justify-between items-start md:items-center border-b pb-4 mb-4 gap-4 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
            <div>
              <h4 className={`text-xs font-mono uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Calendario de Directos</h4>
              <h2 className={`text-xl font-bold font-display uppercase tracking-wider mt-1 ${textTitle}`}>Julio 2026</h2>
            </div>
            <div className="flex gap-2.5 items-center flex-wrap">
              <button
                id="sync-concerts-excel-btn"
                onClick={handleSyncConcerts}
                disabled={isSyncingConcerts}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 border ${
                  isSyncingConcerts
                    ? 'bg-neutral-800 text-neutral-500 border-neutral-700 animate-pulse'
                    : isStitchLight
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                      : 'bg-[#f2ca50]/10 hover:bg-[#f2ca50]/20 text-[#f2ca50] border-[#f2ca50]/30 shadow-md'
                }`}
                title="Sincronizar todos los conciertos en Google Sheets (Excel)"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingConcerts ? 'animate-spin' : ''}`} />
                {isSyncingConcerts ? 'Sincronizando...' : 'Actualizar en Excel'}
              </button>
              
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                isStitchLight ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'bg-[#b8d6b8]/10 border border-[#b8d6b8]/20 text-[#b8d6b8]'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" /> Auto-sync
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

          {/* Weekday Labels */}
          <div className={`grid grid-cols-7 gap-2 text-center text-xs font-mono mb-2 font-bold uppercase ${textSub}`}>
            {weekdays.map(day => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {gridCells.map((cell, index) => {
              if (cell.empty) {
                return <div key={`empty-${index}`} className="aspect-square bg-transparent rounded-lg border border-transparent" />;
              }

              const { concerts, rehearsals } = getDayEvents(cell.day);
              const hasConcert = concerts.length > 0;
              const hasRehearsal = rehearsals.length > 0;
              const isSelected = selectedDay === cell.day;

              return (
                <button
                  id={`calendar-day-${cell.day}`}
                  key={`day-${cell.day}`}
                  onClick={() => setSelectedDay(cell.day)}
                  className={`aspect-square rounded-lg border flex flex-col items-center justify-between p-1.5 relative transition-all cursor-pointer ${
                    isSelected
                      ? isStitchLight
                        ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md shadow-indigo-150 scale-[1.03]'
                        : 'bg-[#f2ca50] border-[#f2ca50] text-[#3c2f00] font-bold shadow-lg shadow-[#f2ca50]/15 scale-[1.03]'
                      : isStitchLight
                        ? 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
                        : 'bg-[#131313] border-[#99907c]/15 hover:border-[#99907c]/35 hover:bg-[#1c1b1b]'
                  }`}
                >
                  <span className={`text-xs ${isSelected ? isStitchLight ? 'text-white' : 'text-[#3c2f00]' : isStitchLight ? 'text-slate-800' : 'text-neutral-100'}`}>{cell.day}</span>
                  
                  {/* Glowing Dots Indicator */}
                  <div className="flex gap-1 justify-center w-full mb-1">
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

        {/* Legend */}
        <div className={`flex gap-4 text-[10px] font-mono border-t pt-4 mt-6 ${isStitchLight ? 'text-slate-400 border-slate-100' : 'text-[#99907c]/15 text-neutral-500 border-[#99907c]/15'}`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isStitchLight ? 'bg-indigo-500' : 'bg-[#f2ca50] shadow-[0_0_8px_#f2ca50]'}`} />
            <span>Concierto (Caché)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isStitchLight ? 'bg-emerald-500' : 'bg-[#b8d6b8] shadow-[0_0_8px_#b8d6b8]'}`} />
            <span>Ensayo General</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded inline-block ${isStitchLight ? 'bg-indigo-600' : 'bg-[#f2ca50]'}`} />
            <span>Seleccionado</span>
          </div>
        </div>
      </div>

      {/* RIGHT: LOGISTICS & CHECKLISTS SIDEBAR (1/3 width) */}
      <div className={`${colors.card} p-5 flex flex-col justify-between`}>
        <div>
          {/* Day details */}
          <div className={`border-b pb-4 mb-4 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
            <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isStitchLight ? 'text-indigo-600' : 'text-[#ffb596]'}`}>Logística y Plan de Vuelo</div>
            <h3 className={`text-lg font-bold font-display tracking-wide mt-1 ${textTitle}`}>{selectedEventTitle}</h3>
            <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>Día {selectedDay} de Julio, 2026</p>
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
              Horarios (Run of Show)
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
              Inventario & Gear
            </button>
          </div>

          {/* Interactive Lists */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {activeTab === 'runofshow' ? (
              runOfShow.map((item, idx) => {
                const isItemDone = item.done;
                return (
                  <div 
                    key={idx}
                    onClick={() => handleToggleRunOfShow(idx)}
                    className={`p-2.5 rounded-md border flex items-center gap-3 cursor-pointer transition-colors ${
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
                  </div>
                );
              })
            ) : (
              checklistItems.map(item => {
                const isChecked = item.checked;
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleChecklist(item.id)}
                    className={`p-2.5 rounded-md border flex items-center gap-3 cursor-pointer transition-colors ${
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
                  </div>
                );
              })
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

    </div>
  );
}
