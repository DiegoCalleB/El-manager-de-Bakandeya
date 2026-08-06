import { describe, it, expect } from 'vitest';
import {
  calculateBookingMetrics,
  filterLeads,
  calculateLeadScore,
  normalizeStatus,
  normalizeType,
  autoDetectVenueAddress,
} from '../bookingUtils';
import { Lead } from '../../types';

describe('bookingUtils', () => {
  const mockLeads: Lead[] = [
    {
      id: 'l1',
      nombre_sala: 'Sala Apollo',
      ciudad: 'Barcelona',
      region: 'Cataluña',
      aforo: 500,
      genero: 'Rock/Indie',
      tipo: 'sala',
      email_contacto: 'booking@apolo.com',
      telefono: '600111222',
      instagram: '@apolo',
      fuente: 'scout_ai',
      estado: 'aprobado',
      pitch_generado: 'Hola Apolo...',
      notas: '',
      contacto_nombre: 'Carlos',
    },
    {
      id: 'l2',
      nombre_sala: 'Wurlitzer Ballroom',
      ciudad: 'Madrid',
      region: 'Madrid',
      aforo: 200,
      genero: 'Punk/Garage',
      tipo: 'sala',
      email_contacto: 'info@wurlitzer.com',
      telefono: '600333444',
      instagram: '@wurlitzer',
      fuente: 'manual',
      estado: 'negociando',
      pitch_generado: '',
      notas: '',
    },
    {
      id: 'l3',
      nombre_sala: 'Festival Viña Rock',
      ciudad: 'Villarrobledo',
      region: 'Castilla La Mancha',
      aforo: 15000,
      genero: 'Rock/Ska',
      tipo: 'festival',
      email_contacto: 'prensa@vinarock.com',
      telefono: '',
      instagram: '@vinarock',
      fuente: 'scout_ai',
      estado: 'nuevo',
      pitch_generado: '',
      notas: '',
    },
  ];

  it('calculates booking pipeline metrics accurately', () => {
    const metrics = calculateBookingMetrics(mockLeads);

    expect(metrics.totalLeads).toBe(3);
    expect(metrics.leadsPorEstado['aprobado']).toBe(1);
    expect(metrics.leadsPorEstado['negociando']).toBe(1);
    expect(metrics.leadsPorEstado['nuevo']).toBe(1);
    expect(metrics.tasaRespuesta).toBe(66.7); // 2 responded out of 3 = 66.7%
    expect(metrics.tasaConversion).toBe(33.3); // 1 approved out of 3 = 33.3%
    expect(metrics.aforoTotalPotencial).toBe(15700);
  });

  it('filters leads by search query and type', () => {
    const madridLeads = filterLeads(mockLeads, 'madrid', 'todos', 'todos');
    expect(madridLeads.length).toBe(1);
    expect(madridLeads[0].nombre_sala).toBe('Wurlitzer Ballroom');

    const festivalLeads = filterLeads(mockLeads, '', 'todos', 'festival');
    expect(festivalLeads.length).toBe(1);
    expect(festivalLeads[0].nombre_sala).toBe('Festival Viña Rock');
  });

  it('calculates lead quality score', () => {
    const scoreApolo = calculateLeadScore(mockLeads[0]);
    expect(scoreApolo).toBeGreaterThan(70);

    const scoreVina = calculateLeadScore(mockLeads[2]);
    expect(scoreVina).toBeLessThan(scoreApolo);
  });

  it('normalizes status and type correctly', () => {
    expect(normalizeStatus('Por Contactar')).toBe('nuevo');
    expect(normalizeStatus('Aprobados')).toBe('aprobado');
    expect(normalizeType('Festival de Música')).toBe('festival');
    expect(normalizeType('Discoteca / Club')).toBe('discoteca');
  });

  it('auto detects venue addresses from database', () => {
    const addr = autoDetectVenueAddress('Sala Apolo', 'Barcelona');
    expect(addr).toContain('Nou de la Rambla');
  });
});
