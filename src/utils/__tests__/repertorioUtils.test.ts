import { describe, it, expect } from 'vitest';
import {
  parseMmSsToSeconds,
  formatSecondsToMmSs,
  calculateSetlistStats,
  sortSongs,
  SongLike,
  SetlistItemLike
} from '../repertorioUtils';

describe('repertorioUtils', () => {
  describe('parseMmSsToSeconds', () => {
    it('converts MM:SS to seconds', () => {
      expect(parseMmSsToSeconds('3:30')).toBe(210);
      expect(parseMmSsToSeconds('4:12')).toBe(252);
      expect(parseMmSsToSeconds('0:45')).toBe(45);
      expect(parseMmSsToSeconds('')).toBe(0);
    });
  });

  describe('formatSecondsToMmSs', () => {
    it('converts seconds to M:SS', () => {
      expect(formatSecondsToMmSs(210)).toBe('3:30');
      expect(formatSecondsToMmSs(252)).toBe('4:12');
      expect(formatSecondsToMmSs(45)).toBe('0:45');
      expect(formatSecondsToMmSs(0)).toBe('0:00');
    });
  });

  describe('calculateSetlistStats', () => {
    it('calculates total duration in seconds and average BPM', () => {
      const songsMap = new Map<string, SongLike>([
        ['s1', { id: 's1', titulo: 'Canción 1', duracionSegundos: 200, bpm: 120 }],
        ['s2', { id: 's2', titulo: 'Canción 2', duracionSegundos: 240, bpm: 140 }]
      ]);

      const items: SetlistItemLike[] = [
        { id: 'i1', songId: 's1' },
        { id: 'i2', duracionEstimadaSegundos: 60 }, // Intro/speech
        { id: 'i3', songId: 's2' }
      ];

      const stats = calculateSetlistStats(items, songsMap);

      expect(stats.totalDurationSeconds).toBe(500); // 200 + 60 + 240
      expect(stats.averageBpm).toBe(130); // (120+140)/2
      expect(stats.songCount).toBe(2);
    });
  });

  describe('sortSongs', () => {
    const mockSongs: SongLike[] = [
      { id: '1', titulo: 'Noches de Garaje', bpm: 120, tonalidad: 'Am', duracionSegundos: 210 },
      { id: '2', titulo: 'Fuego Indie', bpm: 140, tonalidad: 'Em', duracionSegundos: 180 },
      { id: '3', titulo: 'Ayer Tarde', bpm: 95, tonalidad: 'C Major', duracionSegundos: 240 }
    ];

    it('sorts songs by BPM ascending and descending', () => {
      const byBpmAsc = sortSongs(mockSongs, 'bpm', 'asc');
      expect(byBpmAsc.map(s => s.bpm)).toEqual([95, 120, 140]);

      const byBpmDesc = sortSongs(mockSongs, 'bpm', 'desc');
      expect(byBpmDesc.map(s => s.bpm)).toEqual([140, 120, 95]);
    });

    it('sorts songs by title alphabetically', () => {
      const byTitle = sortSongs(mockSongs, 'titulo', 'asc');
      expect(byTitle.map(s => s.titulo)).toEqual(['Ayer Tarde', 'Fuego Indie', 'Noches de Garaje']);
    });

    it('sorts songs by duration', () => {
      const byDuration = sortSongs(mockSongs, 'duracion', 'asc');
      expect(byDuration.map(s => s.duracionSegundos)).toEqual([180, 210, 240]);
    });
  });
});
