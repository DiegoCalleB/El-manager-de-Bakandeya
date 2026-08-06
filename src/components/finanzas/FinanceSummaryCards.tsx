import React from 'react';
import { ThemeColors } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react';
import { FinancialSummary } from '../../utils/financeUtils';

interface FinanceSummaryCardsProps {
  colors: ThemeColors;
  summary: FinancialSummary;
}

export const FinanceSummaryCards: React.FC<FinanceSummaryCardsProps> = ({ colors, summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div
        id="finances-kpi-ingresos"
        className="p-5 rounded-2xl border transition-all"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
            Ingresos Totales
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {summary.totalIngresos.toLocaleString('es-ES')} €
        </div>
        {summary.pagosPendientesIngreso > 0 && (
          <p className="text-xs text-amber-500 mt-1 font-medium">
            +{summary.pagosPendientesIngreso.toLocaleString('es-ES')} € pendientes
          </p>
        )}
      </div>

      <div
        id="finances-kpi-gastos"
        className="p-5 rounded-2xl border transition-all"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
            Gastos Totales
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {summary.totalGastos.toLocaleString('es-ES')} €
        </div>
        {summary.pagosPendientesGasto > 0 && (
          <p className="text-xs text-rose-400 mt-1 font-medium">
            +{summary.pagosPendientesGasto.toLocaleString('es-ES')} € por pagar
          </p>
        )}
      </div>

      <div
        id="finances-kpi-beneficio"
        className="p-5 rounded-2xl border transition-all"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
            Beneficio Neto
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div
          className={`text-2xl font-bold ${summary.beneficioNeto >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
        >
          {summary.beneficioNeto.toLocaleString('es-ES')} €
        </div>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Cashflow acumulado
        </p>
      </div>

      <div
        id="finances-kpi-margen"
        className="p-5 rounded-2xl border transition-all"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
            Margen de Beneficio
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <Calculator className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.text }}>
          {summary.margenBeneficioPorcentaje} %
        </div>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Rentabilidad sobre ingresos
        </p>
      </div>
    </div>
  );
};
