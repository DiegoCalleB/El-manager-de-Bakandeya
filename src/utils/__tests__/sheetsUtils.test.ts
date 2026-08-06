import { describe, it, expect } from 'vitest';
import {
  isValidStatusTransition,
  validateLeadConcurrency,
  filterLeads
} from '../sheetsUtils';
import { Lead } from '../../types';

describe('sheetsUtils', () => {
  describe('isValidStatusTransition', () => {
    it('allows pendiente_aprobacion -> aprobado', () => {
      expect(isValidStatusTransition('pendiente_aprobacion', 'aprobado')).toBe(true);
    });

    it('allows pendiente_aprobacion -> nuevo', () => {
      expect(isValidStatusTransition('pendiente_aprobacion', 'nuevo')).toBe(true);
    });

    it('disallows invalid jumps directly from pending approval panel', () => {
      expect(isValidStatusTransition('pendiente_aprobacion', 'negociando')).toBe(false);
      expect(isValidStatusTransition('pendiente_aprobacion', 'esperando_respuesta')).toBe(false);
    });
  });

  describe('validateLeadConcurrency', () => {
    const mockLead: Lead = {
      id: 'l1',
      nombre_sala: 'Sala Caracol',
      ciudad: 'Madrid',
      region: 'Madrid',
      aforo: 500,
      genero: 'Indie',
      email_contacto: 'info@salacaracol.com',
      telefono: '912345678',
      instagram: '@salacaracol',
      fuente: 'scout',
      estado: 'aprobado',
      pitch_generado: 'Hola Sala Caracol',
      notas: ''
    };

    it('returns no conflict when expectedStatus matches database state', () => {
      const result = validateLeadConcurrency(mockLead, 'aprobado');
      expect(result.isConflict).toBe(false);
    });

    it('returns conflict error message when expectedStatus differs', () => {
      const result = validateLeadConcurrency(mockLead, 'pendiente_aprobacion');
      expect(result.isConflict).toBe(true);
      expect(result.message).toContain('Sala Caracol');
      expect(result.message).toContain('cambió de estado en Google Sheets');
    });
  });

  describe('filterLeads', () => {
    const mockLeads: Lead[] = [
      {
        id: '1',
        nombre_sala: 'Sala Apolo',
        ciudad: 'Barcelona',
        region: 'Cataluña',
        aforo: 1000,
        genero: 'Indie',
        email_contacto: 'apolo@barcelona.com',
        telefono: '931234567',
        instagram: '@apolo',
        estado: 'pendiente_aprobacion',
        fuente: 'scout',
        pitch_generado: '',
        notas: ''
      },
      {
        id: '2',
        nombre_sala: 'Sala Sol',
        ciudad: 'Madrid',
        region: 'Madrid',
        aforo: 300,
        genero: 'Rock',
        email_contacto: 'sol@madrid.com',
        telefono: '911234567',
        instagram: '@sol',
        estado: 'aprobado',
        fuente: 'scout',
        pitch_generado: '',
        notas: ''
      },
      {
        id: '3',
        nombre_sala: 'Razzmatazz',
        ciudad: 'Barcelona',
        region: 'Cataluña',
        aforo: 2000,
        genero: 'Pop',
        email_contacto: 'razz@barcelona.com',
        telefono: '937654321',
        instagram: '@razz',
        estado: 'interesado',
        fuente: 'manual',
        pitch_generado: '',
        notas: ''
      }
    ];

    it('filters leads by status', () => {
      const filtered = filterLeads(mockLeads, { status: 'pendiente_aprobacion' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].nombre_sala).toBe('Sala Apolo');
    });

    it('filters leads by city', () => {
      const filtered = filterLeads(mockLeads, { city: 'Barcelona' });
      expect(filtered.length).toBe(2);
    });

    it('filters leads by text search query', () => {
      const filtered = filterLeads(mockLeads, { searchQuery: 'sol' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].nombre_sala).toBe('Sala Sol');
    });
  });
});
