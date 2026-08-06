// Tour calculation utilities

export interface TourStop {
  id?: string;
  ciudad: string;
  salaNombre?: string;
  distanciaAnteriorKm?: number;
  gastosAlojamiento?: number;
  gastosGasolina?: number;
  gastosDietas?: number;
  ingresoCacheEstimated?: number;
  tiempoConduccionHoras?: number;
}

export interface TourSummary {
  totalKm: number;
  totalGastos: number;
  totalIngresos: number;
  beneficioNeto: number;
  margenPorcentaje: number;
}

/**
 * Calculates fuel cost based on distance in km, average consumption in L/100km, and price per liter in EUR.
 * If consumption or price is not passed, falls back to ratePerKm (default 0.18 €/km).
 */
export function calculateFuelCost(
  distanceKm: number,
  rateOrConsumptionL100km: number = 0.18,
  pricePerLiterEUR?: number
): number {
  if (distanceKm <= 0) return 0;
  if (pricePerLiterEUR !== undefined && pricePerLiterEUR > 0) {
    // Formula: (distance / 100) * L_per_100km * EUR_per_L
    const litersNeeded = (distanceKm / 100) * rateOrConsumptionL100km;
    return Math.round(litersNeeded * pricePerLiterEUR * 100) / 100;
  }
  return Math.round(distanceKm * rateOrConsumptionL100km);
}

/**
 * Calculates estimated driving time in hours based on distance in km (average speed 85 km/h)
 */
export function calculateDrivingTimeHours(distanceKm: number, avgSpeedKmH = 85): number {
  if (distanceKm <= 0 || avgSpeedKmH <= 0) return 0;
  return Math.round((distanceKm / avgSpeedKmH) * 10) / 10;
}

/**
 * Summarizes total expenses, revenues, net profit, and profit margin for a tour
 */
export function calculateTourSummary(stops: TourStop[]): TourSummary {
  if (!stops || stops.length === 0) {
    return {
      totalKm: 0,
      totalGastos: 0,
      totalIngresos: 0,
      beneficioNeto: 0,
      margenPorcentaje: 0
    };
  }

  const totalKm = stops.reduce((sum, s) => sum + (s.distanciaAnteriorKm || 0), 0);
  const totalGastos = stops.reduce(
    (sum, s) => sum + (s.gastosAlojamiento || 0) + (s.gastosGasolina || 0) + (s.gastosDietas || 0),
    0
  );
  const totalIngresos = stops.reduce((sum, s) => sum + (s.ingresoCacheEstimated || 0), 0);
  const beneficioNeto = totalIngresos - totalGastos;
  
  const margenPorcentaje = totalIngresos > 0 
    ? Math.round((beneficioNeto / totalIngresos) * 100 * 10) / 10 
    : 0;

  return {
    totalKm,
    totalGastos,
    totalIngresos,
    beneficioNeto,
    margenPorcentaje
  };
}
