import { describe, it, expect } from 'vitest';
import { calculateFanEngagementMetrics, filterFans } from '../fanUtils';
import { Fan } from '../../types';

describe('fanUtils', () => {
  const mockFans: Fan[] = [
    {
      id: 'f1',
      nombre: 'María López',
      email: 'maria@gmail.com',
      ciudad: 'Madrid',
      comoConocio: 'Concierto Wurlitzer',
      conciertoOrigenNombre: 'Wurlitzer Madrid',
      fechaCaptura: '2025-04-12',
      consentimientoRGPD: true,
    },
    {
      id: 'f2',
      nombre: 'Alex Gómez',
      email: 'alex@hotmail.com',
      ciudad: 'Barcelona',
      comoConocio: 'Instagram Reel',
      fechaCaptura: '2025-04-15',
      consentimientoRGPD: true,
    },
    {
      id: 'f3',
      nombre: 'Carlos Ruiz',
      email: 'carlos@yahoo.com',
      ciudad: 'Madrid',
      comoConocio: 'Spotify',
      fechaCaptura: '2025-04-20',
      consentimientoRGPD: false,
    },
  ];

  it('calculates fan engagement metrics', () => {
    const metrics = calculateFanEngagementMetrics(mockFans);
    expect(metrics.totalFans).toBe(3);
    expect(metrics.consentimientoRGPDPercent).toBe(66.7);
    expect(metrics.fansPorCiudad[0].ciudad).toBe('Madrid');
    expect(metrics.fansPorCiudad[0].total).toBe(2);
  });

  it('filters fans correctly', () => {
    const filtered = filterFans(mockFans, 'maria', 'todas');
    expect(filtered.length).toBe(1);
    expect(filtered[0].nombre).toBe('María López');

    const madridFans = filterFans(mockFans, '', 'madrid');
    expect(madridFans.length).toBe(2);
  });
});
