import React, { useState } from 'react';
import { ThemeColors, Tour, TourRouteStop, Concert } from '../types';
import { Plus, Edit3, Trash2, MapPin, Truck, Calendar, DollarSign, Activity } from 'lucide-react';

interface TourManagerProps {
 colors: ThemeColors;
 tours: Tour[];
 concerts: Concert[];
 onSaveTour: (tour: Tour) => void;
 onDeleteTour: (id: string) => void;
}

export default function TourManager({ colors, tours, concerts, onSaveTour, onDeleteTour }: TourManagerProps) {
 const [editingTour, setEditingTour] = useState<Tour | null>(null);
 const [isModalOpen, setIsModalOpen] = useState(false);

 // Default new tour state
 const [formNombre, setFormNombre] = useState('');
 const [formVehiculo, setFormVehiculo] = useState('Furgoneta 9 Plazas');
 const [formEstado, setFormEstado] = useState<'planificacion' | 'confirmada' | 'completada' | 'cancelada'>('planificacion');
 const [formStops, setFormStops] = useState<TourRouteStop[]>([]);

 const handleOpenCreateModal = () => {
 setEditingTour(null);
 setFormNombre('');
 setFormVehiculo('Furgoneta 9 Plazas');
 setFormEstado('planificacion');
 setFormStops([]);
 setIsModalOpen(true);
 };

 const handleOpenEditModal = (tour: Tour) => {
 setEditingTour(tour);
 setFormNombre(tour.nombre);
 setFormVehiculo(tour.vehiculo);
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

 const startDate = formStops.length > 0 ? formStops.sort((a,b) => a.fecha.localeCompare(b.fecha))[0].fecha : new Date().toISOString().split('T')[0];
 const endDate = formStops.length > 0 ? formStops.sort((a,b) => b.fecha.localeCompare(a.fecha))[0].fecha : new Date().toISOString().split('T')[0];

 const totalGastos = formStops.reduce((sum, stop) => 
 sum + (stop.gastosAlojamiento || 0) + (stop.gastosGasolina || 0) + (stop.gastosDietas || 0), 0);

 const tourData: Tour = {
 id: editingTour ? editingTour.id : `tour-${Date.now()}`,
 nombre: formNombre.trim(),
 vehiculo: formVehiculo,
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
 }]);
 };

 const updateStop = (index: number, field: keyof TourRouteStop, value: any) => {
 const newStops = [...formStops];
 newStops[index] = { ...newStops[index], [field]: value };
 setFormStops(newStops);
 };

 const removeStop = (index: number) => {
 setFormStops(formStops.filter((_, i) => i !== index));
 };

 const handleDelete = (id: string, name: string) => {
 if (window.confirm(`¿Estás seguro de eliminar la gira"${name}"?`)) {
 onDeleteTour(id);
 }
 };

 return (
 <div className={`space-y-6 ${colors.text}`}>
 {/* Header */}
 <div className={`p-5 sm:p-6 rounded-2xl ${colors.card}  shadow-sm`}>
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div></div>
 
 <button
 onClick={handleOpenCreateModal}
 className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f2ca50] text-[#3c2f00] transition-all shadow-md active:scale-95 flex items-center gap-2`}
 >
 <Plus className="w-4 h-4 shrink-0" />
 <span>Nueva Gira</span>
 </button>
 </div>
 </div>

 {/* Tour List */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {tours.length === 0 ? (
 <div className={`col-span-full p-8 text-center  rounded-2xl bg-black/20`}>
 <MapPin className={`w-12 h-12 mx-auto mb-4 ${colors.textMuted} opacity-50`} />
 <h3 className={`text-lg font-bold ${colors.text} mb-2`}>No hay giras organizadas</h3>
 <p className={`text-sm ${colors.textMuted} max-w-md mx-auto`}>
 Agrupa tus conciertos en giras para calcular mejor los gastos logísticos, gasolina, dietas y alojamientos.
 </p>
 </div>
 ) : (
 tours.map(tour => (
 <div key={tour.id} className={`p-5 rounded-2xl  ${colors.card} shadow-sm group hover:-neutral-700 transition-colors`}>
 <div className="flex justify-between items-start mb-4">
 <div>
 <h3 className="font-bold text-lg">{tour.nombre}</h3>
 <div className="flex items-center gap-2 mt-1">
 <span className={`px-2 py-1 rounded text-[10px] uppercase font-mono font-bold
 ${tour.estado === 'confirmada' ? colors.badgeGreen : 
 tour.estado === 'planificacion' ? colors.badgeYellow :
 tour.estado === 'cancelada' ? colors.badgeRed : 'bg-neutral-800 text-neutral-300'}`}>
 {tour.estado}
 </span>
 <span className={`text-[10px] ${colors.textMuted} flex items-center gap-1`}>
 <Calendar className="w-3 h-3" />
 {tour.fechaInicio} / {tour.fechaFin}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => handleOpenEditModal(tour)} className={`p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors`} title="Editar">
 <Edit3 className="w-4 h-4" />
 </button>
 <button onClick={() => handleDelete(tour.id, tour.nombre)} className={`p-1.5 rounded-lg hover:bg-rose-500/15 text-neutral-400 hover:text-rose-400 transition-colors`} title="Eliminar">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-3 mb-4">
 <div className="p-3 rounded-xl bg-black/40">
 <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Vehículo</span>
 <div className="flex items-center gap-1.5 text-sm font-medium">
 <Truck className="w-4 h-4 text-sky-400" />
 {tour.vehiculo}
 </div>
 </div>
 <div className="p-3 rounded-xl bg-black/40">
 <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Presupuesto Logística</span>
 <div className="flex items-center gap-1.5 text-sm font-medium">
 <DollarSign className="w-4 h-4 text-[10b981]" />
 {tour.presupuestoLogistica || 0} €
 </div>
 </div>
 </div>

 <div>
 <h4 className="text-[10px] uppercase font-mono text-neutral-500 mb-2">Ruta ({tour.stops.length} paradas)</h4>
 <div className="space-y-2">
 {tour.stops.length === 0 ? (
 <span className="text-[10px] text-neutral-600 italic">Sin paradas</span>
 ) : (
 tour.stops.slice(0, 3).map((stop, idx) => (
 <div key={stop.id} className="flex items-center justify-between text-sm py-1.5 last:">
 <div className="flex items-center gap-2">
 <span className="text-neutral-500 font-mono text-[10px]">{idx + 1}.</span>
 <span className="font-medium">{stop.ciudad}</span>
 <span className="text-neutral-500 text-[10px]">({stop.sala})</span>
 </div>
 <span className="text-[10px] text-neutral-400">{stop.fecha}</span>
 </div>
 ))
 )}
 {tour.stops.length > 3 && (
 <div className="text-[10px] text-center text-neutral-500 pt-1">+ {tour.stops.length - 3} paradas más</div>
 )}
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Modal form */}
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
 <div className={`w-full max-w-4xl rounded-2xl  ${colors.bg} shadow-2xl flex flex-col max-h-[90vh]`}>
 {/* Modal Header */}
 <div className={`p-4 sm:p-6  flex justify-between items-center bg-black/20 shrink-0`}>
 <h3 className="text-lg font-bold font-display flex items-center gap-2">
 <Truck className="w-5 h-5 text-sky-400" />
 {editingTour ? 'Editar Gira' : 'Nueva Gira'}
 </h3>
 <button 
 onClick={() => setIsModalOpen(false)}
 className={`p-2 rounded-xl hover:bg-neutral-800 transition-colors`}
 >
 <Trash2 className="w-5 h-5 opacity-0 absolute" /> {/* placeholder for spacing if needed, but we use an X typically, wait, let's just use text"Cerrar" or standard X */}
 <span className="text-xl leading-none">&times;</span>
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
 placeholder="Ej. Tour Peninsular 2026"
 className={`w-full p-2.5 sm:p-3 rounded-xl bg-black/40 ${colors.text} focus:outline-none focus:-indigo-500 transition-colors text-sm`}
 />
 </div>
 
 <div className="space-y-1.5">
 <label className={`text-[10px] font-mono uppercase tracking-wider ${colors.textMuted}`}>Estado</label>
 <select
 value={formEstado}
 onChange={e => setFormEstado(e.target.value as any)}
 className={`w-full p-2.5 sm:p-3 rounded-xl bg-black/40 ${colors.text} focus:outline-none focus:-indigo-500 transition-colors text-sm`}
 >
 <option value="planificacion">En Planificación</option>
 <option value="confirmada">Confirmada</option>
 <option value="completada">Completada</option>
 <option value="cancelada">Cancelada</option>
 </select>
 </div>

 <div className="sm:col-span-3 space-y-1.5">
 <label className={`text-[10px] font-mono uppercase tracking-wider ${colors.textMuted}`}>Vehículo Logístico</label>
 <input
 value={formVehiculo}
 onChange={e => setFormVehiculo(e.target.value)}
 placeholder="Ej. Furgoneta 9 Plazas, Coche 1, Vuelos..."
 className={`w-full p-2.5 sm:p-3 rounded-xl bg-black/40 ${colors.text} focus:outline-none focus:-indigo-500 transition-colors text-sm`}
 />
 </div>
 </div>

 {/* Stops / Ruta */}
 <div className="pt-4">
 <div className="flex items-center justify-between mb-4">
 <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
 <MapPin className="w-4 h-4 text-sky-400" />
 Ruta & Paradas
 </h4>
 <button
 type="button"
 onClick={addStop}
 className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 hover:bg-sky-500/15 transition-colors flex items-center gap-1"
 >
 <Plus className="w-3 h-3" /> Añadir Parada
 </button>
 </div>

 <div className="space-y-4">
 {formStops.length === 0 ? (
 <div className="p-6 text-center rounded-xl bg-black/20 text-neutral-500 text-sm italic">
 Añade paradas para estructurar la ruta y calcular gastos.
 </div>
 ) : (
 formStops.map((stop, idx) => (
 <div key={stop.id} className="p-4 rounded-xl bg-neutral-900/30 relative group">
 <button
 type="button"
 onClick={() => removeStop(idx)}
 className="absolute p-1.5 rounded-full bg-rose-500/15 text-white hover:bg-rose-500/15 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
 title="Eliminar parada"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
 <div className="space-y-1">
 <label className="text-[10px] uppercase font-mono text-neutral-500 block">Ciudad</label>
 <input
 value={stop.ciudad}
 onChange={e => updateStop(idx, 'ciudad', e.target.value)}
 placeholder="Ciudad"
 className="w-full p-2 rounded-lg bg-black/40 text-sm focus:-indigo-500"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[10px] uppercase font-mono text-neutral-500 block">Sala / Festival</label>
 <div className="flex items-center gap-2">
 <input
 value={stop.sala}
 onChange={e => updateStop(idx, 'sala', e.target.value)}
 placeholder="Nombre de la sala"
 className="w-full p-2 rounded-lg bg-black/40 text-sm focus:-indigo-500"
 />
 </div>
 </div>
 <div className="space-y-1">
 <label className="text-[10px] uppercase font-mono text-neutral-500 block">Fecha</label>
 <input
 type="date"
 value={stop.fecha}
 onChange={e => updateStop(idx, 'fecha', e.target.value)}
 className="w-full p-2 rounded-lg bg-black/40 text-sm focus:-indigo-500"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[10px] uppercase font-mono text-neutral-500 block">Dist. Anterior (Km)</label>
 <input
 type="number"
 min="0"
 value={stop.distanciaAnteriorKm}
 onChange={e => updateStop(idx, 'distanciaAnteriorKm', Number(e.target.value))}
 className="w-full p-2 rounded-lg bg-black/40 text-sm focus:-indigo-500"
 />
 </div>
 </div>

 <div className="grid grid-cols-3 gap-3 pt-3">
 <div className="flex items-center gap-2">
 <span className="w-6 h-6 rounded flex items-center justify-center bg-sky-500/15 text-sky-400 shrink-0">⛽</span>
 <div className="w-full">
 <label className="text-[10px] text-neutral-500 block">Gasolina (€)</label>
 <input
 type="number"
 min="0"
 value={stop.gastosGasolina}
 onChange={e => updateStop(idx, 'gastosGasolina', Number(e.target.value))}
 className="w-full p-1.5 rounded bg-black/40 text-[10px]"
 />
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-6 h-6 rounded flex items-center justify-center bg-orange-900/30 text-orange-400 shrink-0">🏨</span>
 <div className="w-full">
 <label className="text-[10px] text-neutral-500 block">Alojamiento (€)</label>
 <input
 type="number"
 min="0"
 value={stop.gastosAlojamiento}
 onChange={e => updateStop(idx, 'gastosAlojamiento', Number(e.target.value))}
 className="w-full p-1.5 rounded bg-black/40 text-[10px]"
 />
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-6 h-6 rounded flex items-center justify-center bg-[10b981]/15 text-[10b981] shrink-0">🍔</span>
 <div className="w-full">
 <label className="text-[10px] text-neutral-500 block">Dietas (€)</label>
 <input
 type="number"
 min="0"
 value={stop.gastosDietas}
 onChange={e => updateStop(idx, 'gastosDietas', Number(e.target.value))}
 className="w-full p-1.5 rounded bg-black/40 text-[10px]"
 />
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Resumen Gastos */}
 <div className="p-4 rounded-xl bg-sky-500/15">
 <div className="flex items-center justify-between">
 <span className="text-sm text-sky-400">Presupuesto Logístico Estimado:</span>
 <span className="text-xl font-bold text-sky-400">
 {formStops.reduce((sum, stop) => sum + (stop.gastosAlojamiento || 0) + (stop.gastosGasolina || 0) + (stop.gastosDietas || 0), 0)} €
 </span>
 </div>
 </div>

 </form>
 </div>

 {/* Modal Footer */}
 <div className={`p-4 sm:p-6  flex justify-end gap-3 bg-black/20 shrink-0`}>
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className={`px-2 py-1 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors`}
 >
 Cancelar
 </button>
 <button
 type="submit"
 form="tour-form"
 className={`px-2 py-1 rounded-xl text-sm font-bold bg-[#f2ca50] text-[#3c2f00] shadow-lg active:scale-95 transition-all flex items-center gap-2`}
 >
 <Activity className="w-4 h-4" />
 {editingTour ? 'Guardar Cambios' : 'Crear Gira'}
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 );
}
