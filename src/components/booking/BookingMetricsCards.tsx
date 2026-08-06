import React from 'react';
import { ThemeColors } from '../../types';
import { BookingMetrics } from '../../utils/bookingUtils';
import { Building2, CheckCircle2, MessageSquare, TrendingUp } from 'lucide-react';

interface BookingMetricsCardsProps {
  colors: ThemeColors;
  metrics: BookingMetrics;
}

export const BookingMetricsCards: React.FC<BookingMetricsCardsProps> = ({ colors, metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div
        id="booking-kpi-total"
        className="p-5 rounded-2xl border transition-all"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Leads / Salas
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {metrics.totalLeads}
        </div>
        <p className="text-xs text-slate-400 mt-1">En pipeline activo</p>
      </div>

      <div
        id="booking-kpi-aprobados"
        className="p-5 rounded-2xl border transition-all"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Fechas Aprobadas
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-500">
          {metrics.leadsPorEstado['aprobado'] || 0}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Tasa conversión: <span className="text-emerald-400 font-semibold">{metrics.tasaConversion}%</span>
        </p>
      </div>

      <div
        id="booking-kpi-respuesta"
        className="p-5 rounded-2xl border transition-all"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tasa de Respuesta
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-400">
          {metrics.tasaRespuesta}%
        </div>
        <p className="text-xs text-slate-400 mt-1">Feedback de programadores</p>
      </div>

      <div
        id="booking-kpi-aforo"
        className="p-5 rounded-2xl border transition-all"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Aforo Total Potencial
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {metrics.aforoTotalPotencial.toLocaleString('es-ES')} pax
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Promedio: ~{metrics.aforoPromedio} pax/sala
        </p>
      </div>
    </div>
  );
};
