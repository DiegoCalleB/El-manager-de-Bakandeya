import { describe, it, expect } from 'vitest';
import {
  calculateFinancialSummary,
  calculateConcertROI,
  calculateConcertExpenses,
  forecastConcertRevenue,
} from '../financeUtils';
import { Payment, Concert } from '../../types';

describe('financeUtils', () => {
  it('calculates financial summary correctly for paid payments', () => {
    const mockPayments: Payment[] = [
      {
        id: '1',
        tipo: 'ingreso',
        categoria: 'concierto',
        concepto: 'Caché Sala A',
        importe: 1000,
        fecha: '2025-05-10',
        estado: 'pagado',
      },
      {
        id: '2',
        tipo: 'ingreso',
        categoria: 'merchandising',
        concepto: 'Venta Camisetas',
        importe: 300,
        fecha: '2025-05-10',
        estado: 'pagado',
      },
      {
        id: '3',
        tipo: 'gasto',
        categoria: 'transporte',
        concepto: 'Furgoneta',
        importe: 200,
        fecha: '2025-05-10',
        estado: 'pagado',
      },
      {
        id: '4',
        tipo: 'gasto',
        categoria: 'alojamiento',
        concepto: 'Hotel Madrid',
        importe: 100,
        fecha: '2025-05-10',
        estado: 'pendiente',
      },
    ];

    const summary = calculateFinancialSummary(mockPayments);
    expect(summary.totalIngresos).toBe(1300);
    expect(summary.totalGastos).toBe(200);
    expect(summary.beneficioNeto).toBe(1100);
    expect(summary.pagosPendientesGasto).toBe(100);
    expect(summary.margenBeneficioPorcentaje).toBe(84.6);
    expect(summary.ingresosPorCategoria.length).toBe(2);
    expect(summary.gastosPorCategoria.length).toBe(1);
  });

  it('calculates concert ROI correctly', () => {
    const res = calculateConcertROI(1000, 400);
    expect(res.netProfit).toBe(600);
    expect(res.roi).toBe(150); // (600 / 400) * 100 = 150%
  });

  it('calculates concert detailed expenses correctly', () => {
    const concert: Concert = {
      id: 'c1',
      fecha: '2025-06-01',
      ciudad: 'Madrid',
      sala: 'Wurlitzer',
      cache: 800,
      aforo_vendido: 120,
      aforo_total: 150,
      contrato_firmado: true,
      estado_pago: 'pagado',
      notas: '',
      tipo: 'sala',
      gastosDetalle: {
        gasolina: 80,
        dietas: 50,
        alquilerVehiculo: 100,
        alojamiento: 120,
        otros: 30,
      },
    };

    const totalGastos = calculateConcertExpenses(concert);
    expect(totalGastos).toBe(380);
  });

  it('forecasts concert revenue correctly', () => {
    const rev = forecastConcertRevenue(500, 80, 10);
    expect(rev).toBe(1300); // 500 + (80 * 10) = 1300
  });
});
