import { Payment, Concert } from '../types';

export interface CategoryBreakdown {
  categoria: string;
  total: number;
  porcentaje: number;
}

export interface FinancialSummary {
  totalIngresos: number;
  totalGastos: number;
  beneficioNeto: number;
  margenBeneficioPorcentaje: number;
  gastosPorCategoria: CategoryBreakdown[];
  ingresosPorCategoria: CategoryBreakdown[];
  pagosPendientesIngreso: number;
  pagosPendientesGasto: number;
}

/**
 * Calculates a complete financial summary from payments and concerts
 */
export function calculateFinancialSummary(payments: Payment[]): FinancialSummary {
  let totalIngresos = 0;
  let totalGastos = 0;
  let pagosPendientesIngreso = 0;
  let pagosPendientesGasto = 0;

  const gastosCatMap = new Map<string, number>();
  const ingresosCatMap = new Map<string, number>();

  for (const payment of payments) {
    const amount = Number(payment.importe) || 0;
    if (payment.tipo === 'ingreso') {
      if (payment.estado === 'pagado') {
        totalIngresos += amount;
        ingresosCatMap.set(payment.categoria, (ingresosCatMap.get(payment.categoria) || 0) + amount);
      } else {
        pagosPendientesIngreso += amount;
      }
    } else if (payment.tipo === 'gasto') {
      if (payment.estado === 'pagado') {
        totalGastos += amount;
        gastosCatMap.set(payment.categoria, (gastosCatMap.get(payment.categoria) || 0) + amount);
      } else {
        pagosPendientesGasto += amount;
      }
    }
  }

  const beneficioNeto = totalIngresos - totalGastos;
  const margenBeneficioPorcentaje = totalIngresos > 0 ? (beneficioNeto / totalIngresos) * 100 : 0;

  const mapToBreakdown = (map: Map<string, number>, total: number): CategoryBreakdown[] => {
    return Array.from(map.entries()).map(([categoria, subtotal]) => ({
      categoria,
      total: subtotal,
      porcentaje: total > 0 ? Number(((subtotal / total) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.total - a.total);
  };

  return {
    totalIngresos,
    totalGastos,
    beneficioNeto,
    margenBeneficioPorcentaje: Number(margenBeneficioPorcentaje.toFixed(1)),
    gastosPorCategoria: mapToBreakdown(gastosCatMap, totalGastos),
    ingresosPorCategoria: mapToBreakdown(ingresosCatMap, totalIngresos),
    pagosPendientesIngreso,
    pagosPendientesGasto,
  };
}

/**
 * Calculates concert ROI (Return On Investment) percentage
 */
export function calculateConcertROI(cache: number, gastosTotales: number): { netProfit: number; roi: number } {
  const netProfit = cache - gastosTotales;
  const roi = gastosTotales > 0 ? (netProfit / gastosTotales) * 100 : netProfit > 0 ? 100 : 0;
  return {
    netProfit,
    roi: Number(roi.toFixed(1)),
  };
}

/**
 * Total detailed expenses for a concert
 */
export function calculateConcertExpenses(concert: Concert): number {
  if (!concert.gastosDetalle) {
    return concert.gastosEstimadosTipicos || 0;
  }
  const { gasolina = 0, dietas = 0, alquilerVehiculo = 0, alojamiento = 0, otros = 0 } = concert.gastosDetalle;
  return gasolina + dietas + alquilerVehiculo + alojamiento + otros;
}

/**
 * Forecasts income based on sold tickets and cache
 */
export function forecastConcertRevenue(cache: number, aforoVendido: number, precioEntradaAvg: number = 0): number {
  return cache + (aforoVendido * precioEntradaAvg);
}
