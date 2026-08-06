import { describe, it, expect } from 'vitest';
import { calculateEPKCompletenessScore, generateEPKPressKitSummary } from '../epkUtils';
import { EPKConfig, Song } from '../../types';

describe('epkUtils', () => {
  const completeEPK: EPKConfig = {
    biografia: 'Bakandeya es una banda de ska-fusion y reggae rock formada en 2021. Con más de 50 conciertos a sus espaldas en salas de España...',
    logoUrl: 'https://example.com/logo.png',
    bandPhotos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    riderTecnico: '4 canales de microfonía, 2 retornos de monitor, amplificador de guitarra...',
    enlacesRedes: {
      spotify: 'https://spotify.com/artist/bakandeya',
      youtube: 'https://youtube.com/@bakandeya',
      instagram: 'https://instagram.com/bakandeyaband',
    },
    contactoBooking: {
      nombre: 'Diego de la Calle',
      email: 'booking@bakandeya.com',
      telefono: '600123456',
    },
    temasDestacadosIds: ['song1', 'song2'],
  };

  it('calculates 100% score for complete EPK', () => {
    const result = calculateEPKCompletenessScore(completeEPK);
    expect(result.score).toBe(100);
    expect(result.missingItems.length).toBe(0);
  });

  it('identifies missing items in incomplete EPK', () => {
    const emptyEPK: EPKConfig = {
      biografia: 'Corta',
      logoUrl: '',
      bandPhotos: [],
      riderTecnico: '',
      enlacesRedes: {},
      contactoBooking: { nombre: '', email: '', telefono: '' },
      temasDestacadosIds: [],
    };

    const result = calculateEPKCompletenessScore(emptyEPK);
    expect(result.score).toBeLessThan(50);
    expect(result.missingItems.length).toBeGreaterThan(3);
  });

  it('generates formatted press kit summary', () => {
    const mockSongs: Song[] = [
      {
        id: 'song1',
        titulo: 'Cacharros y Sueños',
        duracion: '3:30',
        duracionSegundos: 210,
        tonalidad: 'Am',
        bpm: 128,
      },
    ];

    const summary = generateEPKPressKitSummary(completeEPK, mockSongs);
    expect(summary).toContain('PRESS KIT COMPACTO');
    expect(summary).toContain('Cacharros y Sueños');
    expect(summary).toContain('booking@bakandeya.com');
  });
});
