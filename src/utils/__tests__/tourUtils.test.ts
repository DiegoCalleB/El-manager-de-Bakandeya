import { describe, it, expect } from 'vitest';
import {
  calculateFuelCost,
  calculateDrivingTimeHours,
  calculateTourSummary,
  TourStop
} from '../tourUtils';

describe('tourUtils', () => {
  describe('calculateFuelCost', () => {
    it('calculates fuel cost at 0.18 €/km by default', () => {
      expect(calculateFuelCost(100)).toBe(18);
      expect(calculateFuelCost(350)).toBe(63);
      expect(calculateFuelCost(0)).toBe(0);
    });

    it('handles negative distance safely', () => {
      expect(calculateFuelCost(-50)).toBe(0);
    });
  });

  describe('calculateDrivingTimeHours', () => {
    it('calculates driving hours based on 85 km/h avg speed', () => {
      expect(calculateDrivingTimeHours(170)).toBe(2.0); // 170 / 85 = 2.0
      expect(calculateDrivingTimeHours(85)).toBe(1.0);
      expect(calculateDrivingTimeHours(0)).toBe(0);
    });
  });

  describe('calculateTourSummary', () => {
    it('summarizes total distances, costs, income, and profit margin', () => {
      const stops: TourStop[] = [
        {
          ciudad: 'Madrid',
          distanciaAnteriorKm: 350,
          gastosGasolina: 63,
          gastosAlojamiento: 120,
          gastosDietas: 80,
          ingresoCacheEstimated: 800
        },
        {
          ciudad: 'Barcelona',
          distanciaAnteriorKm: 620,
          gastosGasolina: 112,
          gastosAlojamiento: 150,
          gastosDietas: 100,
          ingresoCacheEstimated: 1200
        }
      ];

      const summary = calculateTourSummary(stops);

      expect(summary.totalKm).toBe(970);
      expect(summary.totalGastos).toBe(625); // (63+120+80) + (112+150+100) = 263 + 362 = 625
      expect(summary.totalIngresos).toBe(2000);
      expect(summary.beneficioNeto).toBe(1375); // 2000 - 625 = 1375
      expect(summary.margenPorcentaje).toBe(68.8); // (1375/2000)*100 = 68.75 -> 68.8
    });

    it('handles empty stops gracefully', () => {
      const summary = calculateTourSummary([]);
      expect(summary).toEqual({
        totalKm: 0,
        totalGastos: 0,
        totalIngresos: 0,
        beneficioNeto: 0,
        margenPorcentaje: 0
      });
    });
  });
});
