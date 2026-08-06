// Utility for chord parsing, transposition, notation conversion, and chord diagrams

const NOTE_NAMES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_EN_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_NAMES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const NOTE_NAMES_ES_FLATS = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];

const ES_TO_EN_MAP: Record<string, string> = {
  'Do': 'C', 'Do#': 'C#', 'Reb': 'Db',
  'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb',
  'Mi': 'E',
  'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb',
  'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab',
  'La': 'A', 'La#': 'A#', 'Sib': 'Bb',
  'Si': 'B'
};

const EN_TO_ES_MAP: Record<string, string> = {
  'C': 'Do', 'C#': 'Do#', 'Db': 'Reb',
  'D': 'Re', 'D#': 'Re#', 'Eb': 'Mib',
  'E': 'Mi',
  'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Solb',
  'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Lab',
  'A': 'La', 'A#': 'La#', 'Bb': 'Sib',
  'B': 'Si'
};

// Known chord shapes for guitar (fret numbers: string 6 to 1: low E to high E, -1 = muted, 0 = open)
export interface GuitarChordShape {
  name: string;
  frets: number[]; // e.g. [0, 2, 2, 0, 0, 0] for Em
  fingers?: number[]; // finger numbers 1-4
  baseFret?: number;
}

export const GUITAR_CHORD_DATABASE: Record<string, GuitarChordShape> = {
  // C / Do
  'C': { name: 'C', frets: [-1, 3, 2, 0, 1, 0] },
  'Do': { name: 'Do', frets: [-1, 3, 2, 0, 1, 0] },
  'Cm': { name: 'Cm', frets: [-1, 3, 5, 5, 4, 3], baseFret: 3 },
  'Dom': { name: 'Dom', frets: [-1, 3, 5, 5, 4, 3], baseFret: 3 },
  'C7': { name: 'C7', frets: [-1, 3, 2, 3, 1, 0] },
  'Do7': { name: 'Do7', frets: [-1, 3, 2, 3, 1, 0] },

  // D / Re
  'D': { name: 'D', frets: [-1, -1, 0, 2, 3, 2] },
  'Re': { name: 'Re', frets: [-1, -1, 0, 2, 3, 2] },
  'Dm': { name: 'Dm', frets: [-1, -1, 0, 2, 3, 1] },
  'Rem': { name: 'Rem', frets: [-1, -1, 0, 2, 3, 1] },
  'D7': { name: 'D7', frets: [-1, -1, 0, 2, 1, 2] },
  'Re7': { name: 'Re7', frets: [-1, -1, 0, 2, 1, 2] },

  // E / Mi
  'E': { name: 'E', frets: [0, 2, 2, 1, 0, 0] },
  'Mi': { name: 'Mi', frets: [0, 2, 2, 1, 0, 0] },
  'Em': { name: 'Em', frets: [0, 2, 2, 0, 0, 0] },
  'Mim': { name: 'Mim', frets: [0, 2, 2, 0, 0, 0] },
  'E7': { name: 'E7', frets: [0, 2, 0, 1, 0, 0] },
  'Mi7': { name: 'Mi7', frets: [0, 2, 0, 1, 0, 0] },

  // F / Fa
  'F': { name: 'F', frets: [1, 3, 3, 2, 1, 1], baseFret: 1 },
  'Fa': { name: 'Fa', frets: [1, 3, 3, 2, 1, 1], baseFret: 1 },
  'Fm': { name: 'Fm', frets: [1, 3, 3, 1, 1, 1], baseFret: 1 },
  'Fam': { name: 'Fam', frets: [1, 3, 3, 1, 1, 1], baseFret: 1 },
  'F#m': { name: 'F#m', frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },
  'Fa#m': { name: 'Fa#m', frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },

  // G / Sol
  'G': { name: 'G', frets: [3, 2, 0, 0, 0, 3] },
  'Sol': { name: 'Sol', frets: [3, 2, 0, 0, 0, 3] },
  'Gm': { name: 'Gm', frets: [3, 5, 5, 3, 3, 3], baseFret: 3 },
  'Solm': { name: 'Solm', frets: [3, 5, 5, 3, 3, 3], baseFret: 3 },
  'G7': { name: 'G7', frets: [3, 2, 0, 0, 0, 1] },
  'Sol7': { name: 'Sol7', frets: [3, 2, 0, 0, 0, 1] },

  // A / La
  'A': { name: 'A', frets: [-1, 0, 2, 2, 2, 0] },
  'La': { name: 'La', frets: [-1, 0, 2, 2, 2, 0] },
  'Am': { name: 'Am', frets: [-1, 0, 2, 2, 1, 0] },
  'Lam': { name: 'Lam', frets: [-1, 0, 2, 2, 1, 0] },
  'A7': { name: 'A7', frets: [-1, 0, 2, 0, 2, 0] },
  'La7': { name: 'La7', frets: [-1, 0, 2, 0, 2, 0] },

  // B / Si
  'B': { name: 'B', frets: [-1, 2, 4, 4, 4, 2], baseFret: 2 },
  'Si': { name: 'Si', frets: [-1, 2, 4, 4, 4, 2], baseFret: 2 },
  'Bm': { name: 'Bm', frets: [-1, 2, 4, 4, 3, 2], baseFret: 2 },
  'Sim': { name: 'Sim', frets: [-1, 2, 4, 4, 3, 2], baseFret: 2 },
  'Bb': { name: 'Bb', frets: [-1, 1, 3, 3, 3, 1], baseFret: 1 },
  'Sib': { name: 'Sib', frets: [-1, 1, 3, 3, 3, 1], baseFret: 1 },
};

// Regex to identify root note at start of chord token
// Order Spanish multi-char root notes first (Sol#, Sol, Do#, Do, Re#, Re, Fa#, Fa, La#, La, Sib, Si, Mi)
const ROOT_NOTE_REGEX = /^(Sol#|Solb|Sol|Do#|Dom|Do|Re#|Reb|Rem|Re|Fa#|Fam|Fa|La#|Lab|Lam|La|Sib|Sim|Si|Mib|Mim|Mi|[A-G][#b]?)/i;

export function parseRootNote(chordToken: string): { root: string; suffix: string } | null {
  // Check Spanish root notes first
  const spanishRoots = ['Sol#', 'Solb', 'Sol', 'Do#', 'Do', 'Re#', 'Reb', 'Re', 'Fa#', 'Fa', 'La#', 'Lab', 'La', 'Sib', 'Si', 'Mib', 'Mi'];
  for (const root of spanishRoots) {
    if (chordToken.startsWith(root)) {
      return { root, suffix: chordToken.slice(root.length) };
    }
  }

  // English root notes
  const englishMatch = chordToken.match(/^([A-G][#b]?)(.*)$/);
  if (englishMatch) {
    return { root: englishMatch[1], suffix: englishMatch[2] };
  }

  return null;
}

export function transposeSingleNote(rootNote: string, semitones: number, targetNotation: 'ES' | 'EN'): string {
  if (semitones === 0 && ((targetNotation === 'ES' && ES_TO_EN_MAP[rootNote] === undefined) || (targetNotation === 'EN' && EN_TO_ES_MAP[rootNote] === undefined))) {
    // Check if notation change needed
    if (targetNotation === 'ES' && EN_TO_ES_MAP[rootNote]) return EN_TO_ES_MAP[rootNote];
    if (targetNotation === 'EN' && ES_TO_EN_MAP[rootNote]) return ES_TO_EN_MAP[rootNote];
    return rootNote;
  }

  // Convert rootNote to standard EN index
  let normEn = ES_TO_EN_MAP[rootNote] || rootNote;
  let idx = NOTE_NAMES_EN.indexOf(normEn);
  if (idx === -1) {
    idx = NOTE_NAMES_EN_FLATS.indexOf(normEn);
  }
  if (idx === -1) return rootNote;

  // Calculate new index
  let newIdx = (idx + semitones) % 12;
  if (newIdx < 0) newIdx += 12;

  if (targetNotation === 'ES') {
    return NOTE_NAMES_ES[newIdx];
  } else {
    return NOTE_NAMES_EN[newIdx];
  }
}

export function transposeChordToken(chord: string, semitones: number, notation: 'ES' | 'EN'): string {
  // Handle bass slash chords like C/G or Do/Sol
  if (chord.includes('/')) {
    const parts = chord.split('/');
    return parts.map(p => transposeChordToken(p, semitones, notation)).join('/');
  }

  const parsed = parseRootNote(chord);
  if (!parsed) return chord;

  const newRoot = transposeSingleNote(parsed.root, semitones, notation);
  return `${newRoot}${parsed.suffix}`;
}

// Replaces chords in a block of text
export function processChordText(
  text: string,
  semitones: number,
  notation: 'ES' | 'EN'
): string {
  if (!text) return '';

  // Process inline bracket notation [Do] or [C#m]
  let result = text.replace(/\[([A-Za-z0-9#\/]+)\]/g, (match, chord) => {
    const transposed = transposeChordToken(chord, semitones, notation);
    return `[${transposed}]`;
  });

  // Also process standalone lines where tokens look like chords (e.g. "MI      DO     RE/DO")
  const lines = result.split('\n');
  const processedLines = lines.map(line => {
    // If line contains bracketed chords, it's already handled
    if (line.includes('[')) return line;

    // Check if line is purely a chord line (mostly uppercase chord tokens with spaces)
    const tokens = line.trim().split(/\s+/);
    if (tokens.length === 0 || line.trim() === '') return line;

    // Count how many tokens look like chords
    const chordCount = tokens.filter(t => parseRootNote(t) !== null).length;
    const isChordLine = chordCount > 0 && chordCount / tokens.length >= 0.7;

    if (!isChordLine) return line;

    // Replace each chord token preserving spacing
    return line.replace(/([A-Za-z0-9#\/]+)/g, (match) => {
      if (parseRootNote(match)) {
        return transposeChordToken(match, semitones, notation);
      }
      return match;
    });
  });

  return processedLines.join('\n');
}

// Extract all unique chords found in text
export function extractUniqueChords(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();

  // Bracketed chords
  const bracketMatches = text.match(/\[([A-Za-z0-9#\/]+)\]/g);
  if (bracketMatches) {
    bracketMatches.forEach(m => {
      const clean = m.replace('[', '').replace(']', '').trim();
      if (clean) found.add(clean);
    });
  }

  // Chord lines
  const lines = text.split('\n');
  lines.forEach(line => {
    if (line.includes('[')) return;
    const tokens = line.trim().split(/\s+/);
    tokens.forEach(t => {
      if (parseRootNote(t)) {
        found.add(t);
      }
    });
  });

  return Array.from(found);
}
