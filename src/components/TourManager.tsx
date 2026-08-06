import React, { useState } from 'react';
import { ThemeColors, Tour, TourRouteStop, Concert, Lead } from '../types';
import { Plus, Edit3, Trash2, MapPin, Truck, Calendar, DollarSign, Activity, TrendingUp, Calculator } from 'lucide-react';

interface TourManagerProps {
  colors: ThemeColors;
  tours: Tour[];
  concerts: Concert[];
  leads?: Lead[];
  onAddLead?: (lead: Lead) => void;
  onSaveTour: (tour: Tour) => void;
  onDeleteTour: (id: string) => void;
}

export default function TourManager({ colors, tours, concerts, leads = [], onSaveTour, onDeleteTour }: TourManagerProps) {
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Default new tour state
  const [formNombre, setFormNombre] = useState('');
  const [formVehiculo, setFormVehiculo] = useState('Furgoneta Sprinter / Master (Grande)');
  const [formConsumoL100km, setFormConsumoL100km] = useState<number>(9.5);
  const [formPrecioCarburanteEUR, setFormPrecioCarburanteEUR] = useState<number>(1.55);
  const [formTipoCombustible, setFormTipoCombustible] = useState<'diesel' | 'gasolina95' | 'gasolina98' | 'electrico'>('diesel');
  const [formEstado, setFormEstado] = useState<'planificacion' | 'confirmada' | 'completada' | 'cancelada'>('planificacion');
  const [formStops, setFormStops] = useState<TourRouteStop[]>([]);

  // Vehicle Presets
  const VEHICLE_PRESETS = [
    { label: '🚐 Furgoneta Grande (Sprinter, Crafter, Master)', name: 'Furgoneta Sprinter / Master (Grande)', l100km: 9.5, fuel: 'diesel' },
    { label: '🚐 Furgoneta Mediana (Transit Custom, Transporter, Vito)', name: 'Furgoneta Transit / Transporter (Mediana)', l100km: 7.8, fuel: 'diesel' },
    { label: '🚐 Furgoneta Pequeña (Berlingo, Kangoo, Partner)', name: 'Furgoneta Berlingo / Kangoo (Pequeña)', l100km: 6.2, fuel: 'diesel' },
    { label: '🚗 Turismo / Coche con Remolque', name: 'Turismo / Coche de Banda', l100km: 6.8, fuel: 'gasolina95' },
    { label: '⚡ Furgoneta Eléctrica', name: 'Furgoneta Eléctrica', l100km: 22.0, fuel: 'electrico' }, // 22 kWh/100km
    { label: '⚙️ Personalizado', name: 'Vehículo Personalizado', l100km: 9.0, fuel: 'diesel' },
  ];

  const handleSelectVehiclePreset = (presetLabel: string) => {
    const p = VEHICLE_PRESETS.find(item => item.label === presetLabel);
    if (p) {
      setFormVehiculo(p.name);
      setFormConsumoL100km(p.l100km);
      setFormTipoCombustible(p.fuel as any);
      if (p.fuel === 'electrico') setFormPrecioCarburanteEUR(0.25);
      else if (p.fuel === 'gasolina95') setFormPrecioCarburanteEUR(1.62);
      else if (p.fuel === 'gasolina98') setFormPrecioCarburanteEUR(1.78);
      else setFormPrecioCarburanteEUR(1.55);
    }
  };

  const recalculateAllFuelStops = (consumo = formConsumoL100km, precio = formPrecioCarburanteEUR) => {
    setFormStops(prev => prev.map(s => {
      const km = s.distanciaAnteriorKm || 0;
      const calcGas = Math.round((km / 100) * consumo * precio);
      return { ...s, gastosGasolina: calcGas };
    }));
  };

  const handleOpenCreateModal = () => {
    setEditingTour(null);
    setFormNombre('');
    setFormVehiculo('Furgoneta Sprinter / Master (Grande)');
    setFormConsumoL100km(9.5);
    setFormPrecioCarburanteEUR(1.55);
    setFormTipoCombustible('diesel');
    setFormEstado('planificacion');
    setFormStops([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tour: Tour) => {
    setEditingTour(tour);
    setFormNombre(tour.nombre);
    setFormVehiculo(tour.vehiculo || 'Furgoneta 9 Plazas');
    setFormConsumoL100km(tour.consumoL100km ?? 9.5);
    setFormPrecioCarburanteEUR(tour.precioCarburanteEUR ?? 1.55);
    setFormTipoCombustible(tour.tipoCombustible ?? 'diesel');
    setFormEstado(tour.estado);
    setFormStops([...tour.stops]);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert("Por favor introduce el nombre de la gira.");
      return;
    }

    const startDate = formStops.length > 0 ? [...formStops].sort((a,b) => a.fecha.localeCompare(b.fecha))[0].fecha : new Date().toISOString().split('T')[0];
    const endDate = formStops.length > 0 ? [...formStops].sort((a,b) => b.fecha.localeCompare(a.fecha))[0].fecha : new Date().toISOString().split('T')[0];

    const totalGastos = formStops.reduce((sum, stop) => 
      sum + (stop.gastosAlojamiento || 0) + (stop.gastosGasolina || 0) + (stop.gastosDietas || 0), 0);

    const tourData: Tour = {
      id: editingTour ? editingTour.id : `tour-${Date.now()}`,
      nombre: formNombre.trim(),
      vehiculo: formVehiculo,
      consumoL100km: formConsumoL100km,
      precioCarburanteEUR: formPrecioCarburanteEUR,
      tipoCombustible: formTipoCombustible,
      estado: formEstado,
      fechaInicio: startDate,
      fechaFin: endDate,
      presupuestoLogistica: totalGastos,
      stops: formStops
    };

    onSaveTour(tourData);
    setIsModalOpen(false);
  };

  const addStop = () => {
    setFormStops([...formStops, {
      id: `stop-${Date.now()}`,
      ciudad: '',
      sala: '',
      fecha: new Date().toISOString().split('T')[0],
      distanciaAnteriorKm: 0,
      tiempoConduccionHoras: 0,
      gastosAlojamiento: 0,
      gastosGasolina: 0,
      gastosDietas: 0,
      ingresoCacheEstimated: 0,
    }]);
  };

  const updateStop = (index: number, field: keyof TourRouteStop, value: any) => {
    const newStops = [...formStops];
    const currentStop = { ...newStops[index], [field]: value };
    
    // Auto-calculate fuel & driving time based on vehicle parameters
    if (field === 'distanciaAnteriorKm') {
      const km = Number(value) || 0;
      currentStop.gastosGasolina = Math.round((km / 100) * formConsumoL100km * formPrecioCarburanteEUR);
      currentStop.tiempoConduccionHoras = Math.round((km / 85) * 10) / 10; // Avg 85 km/h
    }

    newStops[index] = currentStop;
    setFormStops(newStops);
  };

  const handleSelectVenueForStop = (index: number, leadId: string) => {
    const selectedLead = leads.find(l => l.id === leadId);
    if (!selectedLead) return;

    const newStops = [...formStops];
    newStops[index] = {
      ...newStops[index],
      sala: selectedLead.nombre_sala,
      ciudad: selectedLead.ciudad || newStops[index].ciudad
    };
    setFormStops(newStops);
  };

  const removeStop = (index: number) => {
    setFormStops(formStops.filter((_, i) => i !== index));
  };

  // Delete Confirmation Modal state
  const [tourToDelete, setTourToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setTourToDelete({ id, name });
  };

  const confirmDelete = () => {
    if (tourToDelete) {
      onDeleteTour(tourToDelete.id);
      setTourToDelete(null);
    }
  };

  return (
    <div className={`space-y-6 ${colors.text}`}>
      {/* Header */}
      <div className={`p-5 sm:p-6 rounded-2xl ${colors.card} shadow-sm border border-white/5`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <Truck className="w-6 h-6 text-sky-400" />
              Gestor Logístico & Financiero de Giras
            </h2>
            <p className={`text-xs ${colors.textMuted} mt-1`}>
              Planifica rutas, presupuestos de transporte, alojamientos, dietas y cálculo de beneficio neto por tour.
            </p>
          </div>
          
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#f2ca50] text-[#3c2f00] hover:bg-[#e0b83e] transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nueva Gira</span>
          </button>
        </div>
      </div>

      {/* Tour List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tours.length === 0 ? (
          <div className="col-span-full p-8 text-center rounded-2xl bg-black/20 border border-white/5">
            <MapPin className={`w-12 h-12 mx-auto mb-4 ${colors.textMuted} opacity-50`} />
            <h3 className={`text-lg font-bold ${colors.text} mb-2`}>No hay giras organizadas</h3>
            <p className={`text-sm ${colors.textMuted} max-w-md mx-auto mb-4`}>
              Agrupa tus conciertos en giras para calcular mejor los gastos logísticos, gasolina, dietas, alojamientos y el margen de beneficio.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Crear primera gira
            </button>
          </div>
        ) : (
          tours.map(tour => {
            const totalGastos = tour.stops.reduce((sum, s) => sum + (s.gastosAlojamiento || 0) + (s.gastosGasolina || 0) + (s.gastosDietas || 0), 0);
            const totalIngresos = tour.stops.reduce((sum, s) => sum + (s.ingresoCacheEstimated || 0), 0);
            const beneficioNeto = totalIngresos - totalGastos;
            const totalKm = tour.stops.reduce((sum, s) => sum + (s.distanciaAnteriorKm || 0), 0);

            return (
              <div key={tour.id} className={`p-5 rounded-2xl ${colors.card} border border-white/5 shadow-sm group hover:border-white/10 transition-colors`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg font-display">{tour.nombre}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold
                        ${tour.estado === 'confirmada' ? colors.badgeGreen : 
                        tour.estado === 'planificacion' ? colors.badgeYellow :
                        tour.estado === 'cancelada' ? colors.badgeRed : 'bg-neutral-800 text-neutral-300'}`}>
                        {tour.estado}
                      </span>
                      <span className={`text-[10px] ${colors.textMuted} flex items-center gap-1 font-mono`}>
                        <Calendar className="w-3 h-3" />
                        {tour.fechaInicio} — {tour.fechaFin}
                      </span>
                      {totalKm > 0 && (
                        <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded font-mono">
                          {totalKm} km totales
                        </span>
                      )}
                      {tour.vehiculo && (
                        <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded font-mono flex items-center gap-1 border border-amber-500/20">
                          <Truck className="w-3 h-3" />
                          {tour.vehiculo} {tour.consumoL100km ? `(${tour.consumoL100km} L/100km @ ${tour.precioCarburanteEUR || 1.55}€)` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEditModal(tour)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors" title="Editar">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(tour.id, tour.nombre)} className="p-1.5 rounded-lg hover:bg-rose-500/15 text-neutral-400 hover:text-rose-400 transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wider block font-mono">Logística</span>
                    <div className="text-xs font-bold text-rose-400 mt-0.5">
                      -{totalGastos} €
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wider block font-mono">Caché Est.</span>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">
                      +{totalIngresos} €
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${beneficioNeto >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    <span className="text-[9px] opacity-80 uppercase tracking-wider block font-mono">Margen Neto</span>
                    <div className="text-xs font-extrabold mt-0.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {beneficioNeto >= 0 ? `+${beneficioNeto}` : beneficioNeto} €
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-mono text-neutral-400 mb-2 flex justify-between items-center">
                    <span>Ruta ({tour.stops.length} paradas)</span>
                    <span className="text-neutral-500">{tour.vehiculo}</span>
                  </h4>
                  <div className="space-y-1.5">
                    {tour.stops.length === 0 ? (
                      <span className="text-[10px] text-neutral-500 italic">Sin paradas</span>
                    ) : (
                      tour.stops.slice(0, 4).map((stop, idx) => (
                        <div key={stop.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-black/20 border border-white/5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sky-400 font-mono text-[10px] font-bold">{idx + 1}.</span>
                            <span className="font-bold truncate text-slate-200">{stop.ciudad || 'Por determinar'}</span>
                            <span className="text-neutral-400 text-[10px] truncate">({stop.sala || 'Sala tbd'})</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                            {stop.ingresoCacheEstimated ? (
                              <span className="text-emerald-400 font-semibold">+{stop.ingresoCacheEstimated}€</span>
                            ) : null}
                            <span className="text-neutral-400">{stop.fecha}</span>
                          </div>
                        </div>
                      ))
                    )}
                    {tour.stops.length > 4 && (
                      <div className="text-[10px] text-center text-neutral-500 pt-1 font-mono">+ {tour.stops.length - 4} paradas adicionales</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl ${colors.bg} border border-white/10 shadow-2xl flex flex-col max-h-[90vh]`}>
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-black/40 shrink-0">
              <h3 className="text-lg font-bold font-display flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-400" />
                {editingTour ? 'Editar Gira' : 'Nueva Gira'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="tour-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-wider ${colors.textMuted}`}>Nombre de la Gira *</label>
                    <input
                      required
                      value={formNombre}
                      onChange={e => setFormNombre(e.target.value)}
                      placeholder="Ej. Tour Peninsular Primavera 2026"
                      className={`w-full p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 ${colors.text} focus:outline-none focus:border-sky-500 transition-colors text-sm`}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-wider ${colors.textMuted}`}>Estado</label>
                    <select
                      value={formEstado}
                      onChange={e => setFormEstado(e.target.value as any)}
                      className={`w-full p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 ${colors.text} focus:outline-none focus:border-sky-500 transition-colors text-sm`}
                    >
                      <option value="planificacion">En Planificación</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>

                  {/* Vehicle & Fuel Calculation Settings */}
                  <div className="sm:col-span-3 p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-500/20 pb-2">
                      <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-sky-400" /> Configuración de Vehículo & Consumo de Carburante
                      </span>
                      <button
                        type="button"
                        onClick={() => recalculateAllFuelStops()}
                        className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 text-[11px] font-mono font-bold flex items-center gap-1 transition-all"
                        title="Aplica la fórmula de consumo a las distancias de todas las paradas actuales"
                      >
                        <Calculator className="w-3 h-3" /> Recalcular todas las paradas
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">Plantilla de Vehículo</label>
                        <select
                          onChange={(e) => handleSelectVehiclePreset(e.target.value)}
                          defaultValue=""
                          className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:border-sky-500"
                        >
                          <option value="" disabled>-- Selecciona Modelo --</option>
                          {VEHICLE_PRESETS.map((p, idx) => (
                            <option key={idx} value={p.label}>{p.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">Nombre / Modelo Exacto</label>
                        <input
                          value={formVehiculo}
                          onChange={e => setFormVehiculo(e.target.value)}
                          placeholder="Ej. Mercedes Sprinter 9 Plazas"
                          className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-amber-300 uppercase block mb-1">Consumo Medio ({formTipoCombustible === 'electrico' ? 'kWh/100km' : 'L/100km'})</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={formConsumoL100km}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setFormConsumoL100km(val);
                            recalculateAllFuelStops(val, formPrecioCarburanteEUR);
                          }}
                          className="w-full p-2 rounded-lg bg-black/60 border border-amber-500/40 text-xs font-bold text-amber-300 focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-emerald-300 uppercase block mb-1">Precio Combustible (€/{formTipoCombustible === 'electrico' ? 'kWh' : 'Litro'})</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formPrecioCarburanteEUR}
                            onChange={e => {
                              const val = Number(e.target.value) || 0;
                              setFormPrecioCarburanteEUR(val);
                              recalculateAllFuelStops(formConsumoL100km, val);
                            }}
                            className="w-full p-2 rounded-lg bg-black/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 focus:border-emerald-400"
                          />
                          <select
                            value={formTipoCombustible}
                            onChange={e => setFormTipoCombustible(e.target.value as any)}
                            className="p-2 rounded-lg bg-black/60 border border-white/10 text-[10px] text-neutral-300"
                          >
                            <option value="diesel">Diésel</option>
                            <option value="gasolina95">G95</option>
                            <option value="gasolina98">G98</option>
                            <option value="electrico">kWh</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-neutral-300">
                        📐 <strong className="text-white">Fórmula:</strong> (Km / 100) × {formConsumoL100km} {formTipoCombustible === 'electrico' ? 'kWh' : 'L'} × {formPrecioCarburanteEUR} €
                      </span>
                      <span className="text-sky-300 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        Estimación: 100 km ≈ {((formConsumoL100km * formPrecioCarburanteEUR)).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stops / Ruta */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 font-display">
                      <MapPin className="w-4 h-4 text-sky-400" />
                      Ruta & Paradas
                    </h4>
                    <button
                      type="button"
                      onClick={addStop}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir Parada
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formStops.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-black/20 border border-white/5 text-neutral-400 text-sm italic">
                        Añade paradas para calcular automáticamente kilometraje, estimación de combustible y margen financiero.
                      </div>
                    ) : (
                      formStops.map((stop, idx) => (
                        <div key={stop.id} className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 relative group">
                          <button
                            type="button"
                            onClick={() => removeStop(idx)}
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 transition-colors"
                            title="Eliminar parada"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="text-xs font-bold text-sky-400 font-mono mb-3 flex items-center gap-2">
                            <span>PARADA #{idx + 1}</span>
                            {leads.length > 0 && (
                              <select 
                                onChange={(e) => handleSelectVenueForStop(idx, e.target.value)}
                                defaultValue=""
                                className="ml-auto text-[10px] bg-black/50 border border-sky-500/30 text-sky-300 p-1 rounded focus:outline-none"
                              >
                                <option value="" disabled>-- Cargar desde Salas BD --</option>
                                {leads.map(lead => (
                                  <option key={lead.id} value={lead.id}>
                                    {lead.nombre_sala} ({lead.ciudad})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono text-neutral-400 block">Ciudad</label>
                              <input
                                value={stop.ciudad}
                                onChange={e => updateStop(idx, 'ciudad', e.target.value)}
                                placeholder="Ciudad"
                                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:border-sky-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono text-neutral-400 block">Sala / Festival</label>
                              <input
                                value={stop.sala}
                                onChange={e => updateStop(idx, 'sala', e.target.value)}
                                placeholder="Nombre de la sala"
                                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:border-sky-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono text-neutral-400 block">Fecha</label>
                              <input
                                type="date"
                                value={stop.fecha}
                                onChange={e => updateStop(idx, 'fecha', e.target.value)}
                                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:border-sky-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-mono text-neutral-400 block flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <span>Distancia (Km)</span>
                                  <Calculator className="w-3 h-3 text-sky-400" title="Calcula gasolina aprox automáticamente" />
                                </span>
                                {stop.distanciaAnteriorKm && stop.distanciaAnteriorKm > 0 ? (
                                  <span className="text-[9px] text-amber-300 font-normal">
                                    {((stop.distanciaAnteriorKm / 100) * formConsumoL100km).toFixed(1)} {formTipoCombustible === 'electrico' ? 'kWh' : 'L'}
                                  </span>
                                ) : null}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={stop.distanciaAnteriorKm || ''}
                                onChange={e => updateStop(idx, 'distanciaAnteriorKm', Number(e.target.value))}
                                placeholder="Km desde anterior"
                                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:border-sky-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
                            <div>
                              <label className="text-[10px] text-emerald-400 block font-mono">Caché / Taquilla (€)</label>
                              <input
                                type="number"
                                min="0"
                                value={stop.ingresoCacheEstimated || ''}
                                onChange={e => updateStop(idx, 'ingresoCacheEstimated', Number(e.target.value))}
                                placeholder="0 €"
                                className="w-full p-1.5 rounded bg-black/40 border border-emerald-500/30 text-xs text-emerald-300 font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-amber-300 block font-mono flex items-center justify-between">
                                <span>Gasolina / Peajes (€)</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={stop.gastosGasolina || ''}
                                onChange={e => updateStop(idx, 'gastosGasolina', Number(e.target.value))}
                                placeholder="0 €"
                                className="w-full p-1.5 rounded bg-black/40 border border-amber-500/30 text-xs text-amber-200 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-neutral-400 block font-mono">Alojamiento (€)</label>
                              <input
                                type="number"
                                min="0"
                                value={stop.gastosAlojamiento || ''}
                                onChange={e => updateStop(idx, 'gastosAlojamiento', Number(e.target.value))}
                                placeholder="0 €"
                                className="w-full p-1.5 rounded bg-black/40 border border-white/10 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-neutral-400 block font-mono">Dietas (€)</label>
                              <input
                                type="number"
                                min="0"
                                value={stop.gastosDietas || ''}
                                onChange={e => updateStop(idx, 'gastosDietas', Number(e.target.value))}
                                placeholder="0 €"
                                className="w-full p-1.5 rounded bg-black/40 border border-white/10 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Balance General de Gira */}
                {formStops.length > 0 && (() => {
                  const totalIngresos = formStops.reduce((sum, stop) => sum + (stop.ingresoCacheEstimated || 0), 0);
                  const totalGastos = formStops.reduce((sum, stop) => sum + (stop.gastosAlojamiento || 0) + (stop.gastosGasolina || 0) + (stop.gastosDietas || 0), 0);
                  const neto = totalIngresos - totalGastos;

                  return (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono block">Caché Total Est.</span>
                        <span className="text-lg font-bold text-emerald-400">+{totalIngresos} €</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono block">Gastos Logística</span>
                        <span className="text-lg font-bold text-rose-400">-{totalGastos} €</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono block">Margen Neto Gira</span>
                        <span className={`text-lg font-extrabold ${neto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {neto >= 0 ? `+${neto}` : neto} €
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-white/10 flex justify-end gap-3 bg-black/40 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="tour-form"
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[#f2ca50] text-[#3c2f00] hover:bg-[#e0b83e] shadow-lg active:scale-95 transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                {editingTour ? 'Guardar Cambios' : 'Crear Gira'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Deletion */}
      {tourToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl ${colors.card} border border-rose-500/30 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150`}>
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white font-display">¿Eliminar esta gira?</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Esta acción eliminará la gira y no se puede deshacer.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-sm text-neutral-200">
              Gira: <strong className="text-white">{tourToDelete.name}</strong>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTourToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Sí, Eliminar Gira
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
