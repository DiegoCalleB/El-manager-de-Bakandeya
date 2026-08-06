import { describe, it, expect } from 'vitest';
import {
  parseRootNote,
  transposeSingleNote,
  transposeChordToken,
  processChordText,
  extractUniqueChords
} from '../chordUtils';

describe('chordUtils', () => {
  describe('parseRootNote', () => {
    it('parses Spanish root notes correctly', () => {
      expect(parseRootNote('Do')).toEqual({ root: 'Do', suffix: '' });
      expect(parseRootNote('Sol#m')).toEqual({ root: 'Sol#', suffix: 'm' });
      expect(parseRootNote('Re7')).toEqual({ root: 'Re', suffix: '7' });
      expect(parseRootNote('Sib')).toEqual({ root: 'Sib', suffix: '' });
      expect(parseRootNote('Fa#m')).toEqual({ root: 'Fa#', suffix: 'm' });
    });

    it('parses English root notes correctly', () => {
      expect(parseRootNote('C')).toEqual({ root: 'C', suffix: '' });
      expect(parseRootNote('G#m')).toEqual({ root: 'G#', suffix: 'm' });
      expect(parseRootNote('D7')).toEqual({ root: 'D', suffix: '7' });
      expect(parseRootNote('Bbmaj7')).toEqual({ root: 'Bb', suffix: 'maj7' });
    });

    it('returns null for non-chords', () => {
      expect(parseRootNote('Hola')).toBeNull();
      expect(parseRootNote('123')).toBeNull();
    });
  });

  describe('transposeSingleNote', () => {
    it('transposes English notes by semitones', () => {
      expect(transposeSingleNote('C', 2, 'EN')).toBe('D');
      expect(transposeSingleNote('C', 1, 'EN')).toBe('C#');
      expect(transposeSingleNote('A', 3, 'EN')).toBe('C');
      expect(transposeSingleNote('B', 1, 'EN')).toBe('C');
    });

    it('transposes Spanish notes by semitones', () => {
      expect(transposeSingleNote('Do', 2, 'ES')).toBe('Re');
      expect(transposeSingleNote('Do', 1, 'ES')).toBe('Do#');
      expect(transposeSingleNote('La', 3, 'ES')).toBe('Do');
      expect(transposeSingleNote('Si', 1, 'ES')).toBe('Do');
    });

    it('converts between English and Spanish notations when semitones is 0', () => {
      expect(transposeSingleNote('C', 0, 'ES')).toBe('Do');
      expect(transposeSingleNote('Do', 0, 'EN')).toBe('C');
      expect(transposeSingleNote('G#', 0, 'ES')).toBe('Sol#');
    });
  });

  describe('transposeChordToken', () => {
    it('transposes simple chords', () => {
      expect(transposeChordToken('Am', 2, 'EN')).toBe('Bm');
      expect(transposeChordToken('Lam', 2, 'ES')).toBe('Sim');
    });

    it('handles slash / bass chords', () => {
      expect(transposeChordToken('C/G', 2, 'EN')).toBe('D/A');
      expect(transposeChordToken('Do/Sol', 2, 'ES')).toBe('Re/La');
    });
  });

  describe('processChordText', () => {
    it('transposes bracketed inline chords in song lyrics', () => {
      const text = 'Siento que el [Do]ritmo vuelve a [Sol]sonar en [Lam]mi mente';
      const result = processChordText(text, 2, 'ES');
      expect(result).toBe('Siento que el [Re]ritmo vuelve a [La]sonar en [Sim]mi mente');
    });

    it('transposes standalone chord lines', () => {
      const text = 'Do      Sol     Lam\nEsta es la letra de la canción';
      const result = processChordText(text, 2, 'ES');
      expect(result).toContain('Re');
      expect(result).toContain('La');
      expect(result).toContain('Sim');
      expect(result).toContain('Esta es la letra de la canción');
    });
  });

  describe('extractUniqueChords', () => {
    it('extracts all unique bracketed chords from text', () => {
      const text = '[Do] intro [Sol] verse [Do] chorus [Lam] bridge';
      const chords = extractUniqueChords(text);
      expect(chords).toEqual(['Do', 'Sol', 'Lam']);
    });
  });
});
