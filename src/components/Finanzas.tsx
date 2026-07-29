import React, { useState } from 'react';
import { ThemeColors, Payment } from '../types';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Filter, Search,
  CheckCircle2, AlertCircle, RefreshCw, Trash2, Calendar, FileText, Check, ArrowRight
} from 'lucide-react';

interface FinanzasProps {
  colors: ThemeColors;
  payments: Payment[];
  onAddPayment: (payment: Payment) => Promise<void>;
  onUpdatePayment: (id: string, updatedFields: Partial<Payment>) => Promise<void>;
}

export default function Finanzas({ colors, payments = [], onAddPayment, onUpdatePayment }: FinanzasProps) {
  // Tabs: 'analytics' vs 'ledger' (todas las transacciones)
  const [activeTab, setActiveTab] = useState<'analytics' | 'ledger'>('ledger');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'pagado'>('todos');

  // Form State for Add Transaction
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('ingreso');
  const [categoria, setCategoria] = useState<'concierto' | 'merchandising' | 'subvencion' | 'transporte' | 'alojamiento' | 'comida' | 'promo' | 'otros'>('concierto');
  const [concepto, setConcepto] = useState('');
  const [importe, setImporte] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [estado, setEstado] = useState<'pendiente' | 'pagado'>('pagado');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState('');
  const [syncError, setSyncError] = useState('');

  const handleSyncFinanzas = async () => {
    setIsSyncing(true);
    setSyncSuccess('');
    setSyncError('');
    try {
      const res = await fetch('/api/payments/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncSuccess(data.message || 'Finanzas sincronizadas con éxito en Google Sheets.');
        setTimeout(() => setSyncSuccess(''), 6000);
      } else {
        setSyncError(data.error || 'Error al intentar sincronizar las finanzas.');
      }
    } catch (error) {
      console.error('Error synchronizing finances:', error);
      setSyncError('Error de conexión con el servidor de Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto || !importe) return;

    const newPayment: Payment = {
      id: 'pay-' + Date.now(),
      tipo,
      categoria,
      concepto,
      importe: parseFloat(importe) || 0,
      fecha,
      estado
    };

    await onAddPayment(newPayment);
    setIsAddOpen(false);
    
    // Reset form
    setConcepto('');
    setImporte('');
    setFecha(new Date().toISOString().split('T')[0]);
    setEstado('pagado');
  };

  const handleToggleEstado = async (payment: Payment) => {
    const nuevoEstado = payment.estado === 'pendiente' ? 'pagado' : 'pendiente';
    await onUpdatePayment(payment.id, { estado: nuevoEstado });
  };

  // Calculations
  const totalIngresos = payments
    .filter(p => p.tipo === 'ingreso' && p.estado === 'pagado')
    .reduce((sum, p) => sum + p.importe, 0);

  const totalGastos = payments
    .filter(p => p.tipo === 'gasto' && p.estado === 'pagado')
    .reduce((sum, p) => sum + p.importe, 0);

  const balanceNeto = totalIngresos - totalGastos;

  const totalPendienteIngresos = payments
    .filter(p => p.tipo === 'ingreso' && p.estado === 'pendiente')
    .reduce((sum, p) => sum + p.importe, 0);

  const totalPendienteGastos = payments
    .filter(p => p.tipo === 'gasto' && p.estado === 'pendiente')
    .reduce((sum, p) => sum + p.importe, 0);

  // Filter Payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'todos' || p.tipo === typeFilter;
    const matchesCategory = categoryFilter === 'todos' || p.categoria === categoryFilter;
    const matchesStatus = statusFilter === 'todos' || p.estado === statusFilter;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(payments.map(p => p.categoria)));

  const isStitchLight = colors.accent === 'text-indigo-600';
  const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
  const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
  const textMuted = isStitchLight ? 'text-slate-400' : 'text-neutral-500';
  const cardBorder = isStitchLight ? 'border-slate-200' : 'border-neutral-800';

  return (
    <div className={`space-y-6 ${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans w-full max-w-full overflow-x-hidden`}>
      
      {/* Header con Sincronización en Excel */}
      <div className={`flex justify-between items-start md:items-center border-b pb-4 mb-2 gap-4 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
        <div>
          <h4 className={`text-xs font-mono uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Finanzas & Libro Contable</h4>
          <h2 className={`text-xl font-bold font-display uppercase tracking-wider mt-1 ${textTitle}`}>CONTABILIDAD DE BANDA</h2>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <button
            id="sync-finanzas-excel-btn"
            onClick={handleSyncFinanzas}
            disabled={isSyncing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 border ${
              isSyncing
                ? 'bg-neutral-800 text-neutral-500 border-neutral-700 animate-pulse'
                : isStitchLight
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                  : 'bg-[#f2ca50]/10 hover:bg-[#f2ca50]/20 text-[#f2ca50] border-[#f2ca50]/30 shadow-md'
            }`}
            title="Sincronizar todas las transacciones financieras en Google Sheets (Excel)"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Actualizar en Excel'}
          </button>
          
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
            isStitchLight ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'bg-[#b8d6b8]/10 border border-[#b8d6b8]/20 text-[#b8d6b8]'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" /> Auto-sync
          </span>
        </div>
      </div>

      {/* Notificaciones de Sincronización */}
      {syncSuccess && (
        <div className={`p-2 px-3 border rounded-lg text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
          isStitchLight 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="flex-1 font-mono text-[10px]">{syncSuccess}</span>
          <button onClick={() => setSyncSuccess('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
        </div>
      )}
      {syncError && (
        <div className={`p-2 px-3 border rounded-lg text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
          isStitchLight 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1 font-mono text-[10px]">{syncError}</span>
          <button onClick={() => setSyncError('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
        </div>
      )}

      {/* KPI Cards (Financial Overview) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total revenue */}
        <div className={`${colors.card} p-5 space-y-1.5 relative overflow-hidden`}>
          <div className="flex justify-between items-center text-xs font-mono font-bold text-emerald-500 uppercase tracking-wider">
            <span>Ingresos Cobrados</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className={`text-2xl font-black font-display tracking-tight ${textTitle}`}>
            +{totalIngresos.toLocaleString('es-ES')}€
          </h3>
          <p className={`text-[10px] font-mono ${textSub}`}>
            {totalPendienteIngresos > 0 ? `+${totalPendienteIngresos.toLocaleString('es-ES')}€ pendientes de cobro` : 'Al día'}
          </p>
          <div className="absolute right-[-10px] bottom-[-15px] opacity-5 pointer-events-none text-emerald-500">
            <DollarSign className="w-24 h-24" />
          </div>
        </div>

        {/* Total expenses */}
        <div className={`${colors.card} p-5 space-y-1.5 relative overflow-hidden`}>
          <div className="flex justify-between items-center text-xs font-mono font-bold text-rose-500 uppercase tracking-wider">
            <span>Gastos Liquidados</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <h3 className={`text-2xl font-black font-display tracking-tight ${textTitle}`}>
            -{totalGastos.toLocaleString('es-ES')}€
          </h3>
          <p className={`text-[10px] font-mono ${textSub}`}>
            {totalPendienteGastos > 0 ? `-${totalPendienteGastos.toLocaleString('es-ES')}€ pendientes de pago` : 'Al día'}
          </p>
          <div className="absolute right-[-10px] bottom-[-15px] pointer-events-none opacity-5 text-rose-500">
            <DollarSign className="w-24 h-24" />
          </div>
        </div>

        {/* Net balance */}
        <div className={`${colors.card} p-5 space-y-1.5 relative overflow-hidden border-2 ${
          balanceNeto >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'
        }`}>
          <div className={`flex justify-between items-center text-xs font-mono font-bold uppercase tracking-wider ${
            balanceNeto >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            <span>Balance de Caja Neto</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <h3 className={`text-2xl font-black font-display tracking-tight ${textTitle}`}>
            {balanceNeto >= 0 ? `+${balanceNeto.toLocaleString('es-ES')}€` : `${balanceNeto.toLocaleString('es-ES')}€`}
          </h3>
          <p className={`text-[10px] font-mono ${textSub}`}>
            Caja total real cobrada menos gastos pagados
          </p>
        </div>
      </div>

      {/* Tabs / Filter Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-2 gap-4 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? colors.primary
                : isStitchLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Libro Diario (Historial)
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? colors.primary
                : isStitchLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Análisis de Costes (Categorías)
          </button>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
            isStitchLight 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
              : 'bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] shadow-md'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Registrar Operación
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'ledger' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Ledger List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Ledger Filters */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-3 ${colors.card} ${cardBorder}`}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar transacciones por concepto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full border rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none font-mono transition-all ${
                    isStitchLight 
                      ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-450' 
                      : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1] focus:border-[#f2ca50]/50 placeholder:text-neutral-600'
                  }`}
                />
              </div>

              <div className="flex gap-2 flex-wrap md:flex-nowrap">
                {/* Type filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className={`border rounded-lg text-xs py-1.5 px-3 font-mono focus:outline-none ${
                    isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1]'
                  }`}
                >
                  <option value="todos">Tipo: Todos</option>
                  <option value="ingreso">Ingreso (+)</option>
                  <option value="gasto">Gasto (-)</option>
                </select>

                {/* Category filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`border rounded-lg text-xs py-1.5 px-3 font-mono focus:outline-none ${
                    isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1]'
                  }`}
                >
                  <option value="todos">Categoría: Todas</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                </select>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={`border rounded-lg text-xs py-1.5 px-3 font-mono focus:outline-none ${
                    isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131313] border-[#99907c]/25 text-[#e5e2e1]'
                  }`}
                >
                  <option value="todos">Estado: Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
            </div>

            {/* Ledger Transactions Grid */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-16 border rounded-xl font-mono text-xs text-neutral-500">
                  No hay transacciones que coincidan con los filtros actuales.
                </div>
              ) : (
                filteredPayments.map(p => (
                  <div
                    key={p.id}
                    className={`p-3 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isStitchLight
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-[#131313] border-[#99907c]/15 hover:border-[#99907c]/30'
                    }`}
                  >
                    <div className="flex gap-3 items-center min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 border ${
                        p.tipo === 'ingreso'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold font-display truncate ${textTitle}`}>{p.concepto}</h4>
                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider ${
                            isStitchLight ? 'bg-slate-100 text-slate-500' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {p.categoria}
                          </span>
                        </div>
                        <div className={`flex gap-3 text-[10px] font-mono mt-1 ${textSub}`}>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0" /> {p.fecha}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      {/* Amount */}
                      <span className={`text-sm font-black font-mono tracking-tight ${
                        p.tipo === 'ingreso' ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {p.tipo === 'ingreso' ? '+' : '-'}{p.importe.toLocaleString('es-ES')}€
                      </span>

                      {/* Status checkbox toggle */}
                      <button
                        onClick={() => handleToggleEstado(p)}
                        className={`px-2.5 py-1 text-[9px] font-mono rounded font-bold uppercase transition-all flex items-center gap-1 border cursor-pointer active:scale-95 ${
                          p.estado === 'pagado'
                            ? isStitchLight
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : isStitchLight
                              ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15'
                        }`}
                        title="Hacer clic para cambiar el estado de pago"
                      >
                        {p.estado === 'pagado' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3 animate-pulse" />}
                        {p.estado.toUpperCase()}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats sidebar panel */}
          <div className="space-y-4">
            <div className={`p-4 border rounded-xl ${colors.card} ${cardBorder} space-y-4`}>
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${textTitle}`}>Resumen Contable</h3>
              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between pb-2 border-b border-dashed border-neutral-800">
                  <span className={textSub}>Operaciones Registradas</span>
                  <span className={`${textTitle} font-bold`}>{payments.length}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-dashed border-neutral-800">
                  <span className={textSub}>Pendiente de Cobro</span>
                  <span className="text-emerald-500 font-bold">+{totalPendienteIngresos.toLocaleString('es-ES')}€</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-dashed border-neutral-800">
                  <span className={textSub}>Pendiente de Pago</span>
                  <span className="text-rose-500 font-bold">-{totalPendienteGastos.toLocaleString('es-ES')}€</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1">
                  <span className={textTitle}>Faltas Pendientes Neto</span>
                  <span className={totalPendienteIngresos - totalPendienteGastos >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    {(totalPendienteIngresos - totalPendienteGastos).toLocaleString('es-ES')}€
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-4 border rounded-xl ${colors.card} ${cardBorder} text-xs leading-relaxed space-y-2`}>
              <div className={`flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
                <FileText className="w-4 h-4" />
                <strong className="font-mono uppercase tracking-wider">Libro en Excel</strong>
              </div>
              <p className={textSub}>
                Cualquier cambio que realices desde este panel de control se guardará localmente y se sincronizará automáticamente en la pestaña <strong>"finanzas"</strong> de Google Sheets.
              </p>
              <p className={textSub}>
                Los agentes inteligentes de Bakandeya leen este libro diario para optimizar ofertas de caché en salas o calcular presupuestos de giras de forma automatizada.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Analytics of Expenses by Categories */
        <div className={`p-5 border rounded-xl ${colors.card} ${cardBorder} space-y-6`}>
          <div>
            <h3 className={`text-sm font-bold font-display uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>Análisis de Gastos por Categoría</h3>
            <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>Proporciones totales liquidadas para cada categoría de costes operativos de Bakandeya</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Custom SVG/HTML Bar Proportions Chart */}
            <div className="space-y-3.5">
              {[
                { cat: 'concierto', color: 'bg-indigo-500' },
                { cat: 'transporte', color: 'bg-[#f2ca50]' },
                { cat: 'alojamiento', color: 'bg-[#ffb596]' },
                { cat: 'comida', color: 'bg-emerald-500' },
                { cat: 'promo', color: 'bg-rose-500' },
                { cat: 'merchandising', color: 'bg-cyan-500' },
                { cat: 'otros', color: 'bg-slate-500' }
              ].map(item => {
                const totalInCat = payments
                  .filter(p => p.categoria === item.cat && p.estado === 'pagado')
                  .reduce((sum, p) => sum + p.importe, 0);
                
                const percent = totalGastos > 0 ? (totalInCat / totalGastos) * 100 : 0;

                return (
                  <div key={item.cat} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className={`uppercase font-bold ${textTitle}`}>{item.cat}</span>
                      <span className={`${textSub}`}>{totalInCat.toLocaleString('es-ES')}€ ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${isStitchLight ? 'bg-slate-100' : 'bg-neutral-900'}`}>
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${Math.max(percent, totalInCat > 0 ? 3 : 0)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-slate-100' : 'bg-neutral-900/40 border-neutral-800'} space-y-3 text-xs leading-relaxed`}>
                <h4 className={`font-mono font-bold uppercase tracking-wider ${textTitle}`}>Auditoría Operativa</h4>
                <div className="space-y-2 text-[11px] font-mono text-neutral-400">
                  <div className="flex justify-between">
                    <span>Gasto en Viajes (Transporte/Hotel):</span>
                    <span className={`${textTitle}`}>
                      {(payments
                        .filter(p => (p.categoria === 'transporte' || p.categoria === 'alojamiento') && p.estado === 'pagado')
                        .reduce((sum, p) => sum + p.importe, 0)).toLocaleString('es-ES')}€
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inversión en Promo:</span>
                    <span className={`${textTitle}`}>
                      {(payments.filter(p => p.categoria === 'promo' && p.estado === 'pagado').reduce((sum, p) => sum + p.importe, 0)).toLocaleString('es-ES')}€
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ingresos de Conciertos:</span>
                    <span className="text-emerald-500 font-bold">
                      {(payments.filter(p => p.categoria === 'concierto' && p.tipo === 'ingreso' && p.estado === 'pagado').reduce((sum, p) => sum + p.importe, 0)).toLocaleString('es-ES')}€
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nueva Operación */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`w-full max-w-md border rounded-2xl p-6 space-y-4 shadow-2xl relative overflow-hidden ${
            isStitchLight ? 'bg-white border-slate-200 text-slate-850' : 'bg-[#1c1b1b] border-neutral-800 text-neutral-100'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-neutral-800">
              <h3 className={`text-sm font-bold font-display uppercase tracking-widest ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
                Registrar Operación Contable
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-neutral-500 hover:text-neutral-300 text-sm font-mono cursor-pointer">Cerrar</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {/* Tipo selector buttons */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('ingreso')}
                    className={`py-2 px-3 rounded-lg border font-mono font-bold uppercase transition-all cursor-pointer ${
                      tipo === 'ingreso'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Ingreso (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('gasto')}
                    className={`py-2 px-3 rounded-lg border font-mono font-bold uppercase transition-all cursor-pointer ${
                      tipo === 'gasto'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                        : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Gasto (-)
                  </button>
                </div>
              </div>

              {/* Concepto input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">Concepto o Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Caché Concierto Sala Apolo, Alquiler Furgoneta, etc."
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none font-mono ${
                    isStitchLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#f2ca50]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Importe input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">Importe (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1200"
                    value={importe}
                    onChange={(e) => setImporte(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none font-mono ${
                      isStitchLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#f2ca50]'
                    }`}
                  />
                </div>

                {/* Fecha input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">Fecha</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none font-mono ${
                      isStitchLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#f2ca50]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Categoria dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as any)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none font-mono ${
                      isStitchLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#f2ca50]'
                    }`}
                  >
                    <option value="concierto">Concierto</option>
                    <option value="merchandising">Merchandising</option>
                    <option value="subvencion">Subvención</option>
                    <option value="transporte">Transporte</option>
                    <option value="alojamiento">Alojamiento</option>
                    <option value="comida">Comida / Dietas</option>
                    <option value="promo">Promo / Cartelería</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                {/* Estado selector */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">Estado de Operación</label>
                  <div className="grid grid-cols-2 gap-1.5 h-9">
                    <button
                      type="button"
                      onClick={() => setEstado('pendiente')}
                      className={`rounded-lg border font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                        estado === 'pendiente'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 text-[10px]'
                          : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 text-[10px] hover:text-neutral-300'
                      }`}
                    >
                      Pendiente
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstado('pagado')}
                      className={`rounded-lg border font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                        estado === 'pagado'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 text-[10px]'
                          : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 text-[10px] hover:text-neutral-300'
                      }`}
                    >
                      Liquido
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className={`w-1/3 py-2 border font-mono rounded-lg transition-all text-center cursor-pointer ${
                    isStitchLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 font-mono font-bold uppercase rounded-lg transition-all text-center cursor-pointer ${
                    isStitchLight ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-[#f2ca50] text-[#3c2f00] hover:bg-[#ffe088]'
                  }`}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
