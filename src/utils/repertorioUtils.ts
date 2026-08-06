// Song & Setlist calculation utilities

export interface SongLike {
  id: string;
  titulo: string;
  duracion?: string; // "3:30"
  duracionSegundos?: number; // 210
  bpm?: number;
  tonalidad?: string;
}

export interface SetlistItemLike {
  id: string;
  tipoItem?: string;
  duracionEstimadaMinutos?: number;
  duracionEstimadaSegundos?: number;
  songId?: string;
}

/**
 * Parses "MM:SS" string into total seconds (e.g., "3:30" -> 210)
 */
export function parseMmSsToSeconds(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length === 1) {
    const parsed = parseInt(parts[0], 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  const min = parseInt(parts[0], 10) || 0;
  const sec = parseInt(parts[1], 10) || 0;
  return min * 60 + sec;
}

/**
 * Formats total seconds into "M:SS" or "MM:SS" (e.g., 210 -> "3:30")
 */
export function formatSecondsToMmSs(totalSeconds: number): string {
  if (totalSeconds <= 0 || isNaN(totalSeconds)) return '0:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates setlist total duration (in seconds) and average BPM
 */
export function calculateSetlistStats(
  items: SetlistItemLike[],
  songMap: Map<string, SongLike> | Record<string, SongLike>
): { totalDurationSeconds: number; averageBpm: number; songCount: number } {
  let totalDurationSeconds = 0;
  let bpmSum = 0;
  let bpmCount = 0;
  let songCount = 0;

  const getSong = (id: string) => {
    if (songMap instanceof Map) return songMap.get(id);
    return songMap[id];
  };

  items.forEach(item => {
    if (item.songId) {
      const song = getSong(item.songId);
      if (song) {
        songCount++;
        const songSecs = song.duracionSegundos || parseMmSsToSeconds(song.duracion) || 210;
        totalDurationSeconds += songSecs;
        if (song.bpm && song.bpm > 0) {
          bpmSum += song.bpm;
          bpmCount++;
        }
      }
    } else {
      // Non-song item (intro, presentation, break)
      const itemSecs = item.duracionEstimadaSegundos ?? ((item.duracionEstimadaMinutos || 0) * 60);
      totalDurationSeconds += itemSecs;
    }
  });

  return {
    totalDurationSeconds,
    averageBpm: bpmCount > 0 ? Math.round(bpmSum / bpmCount) : 0,
    songCount
  };
}

/**
 * Sorts songs by given criteria: tempo (BPM), tonality, title, or duration
 */
export type SongSortField = 'bpm' | 'tonalidad' | 'titulo' | 'duracion';
export type SortOrder = 'asc' | 'desc';

export function sortSongs<T extends SongLike>(
  songs: T[],
  sortBy: SongSortField,
  order: SortOrder = 'asc'
): T[] {
  const sorted = [...songs].sort((a, b) => {
    if (sortBy === 'bpm') {
      const bpmA = a.bpm || 0;
      const bpmB = b.bpm || 0;
      return bpmA - bpmB;
    }
    if (sortBy === 'duracion') {
      const secA = a.duracionSegundos || parseMmSsToSeconds(a.duracion);
      const secB = b.duracionSegundos || parseMmSsToSeconds(b.duracion);
      return secA - secB;
    }
    if (sortBy === 'tonalidad') {
      const keyA = (a.tonalidad || '').toLowerCase();
      const keyB = (b.tonalidad || '').toLowerCase();
      return keyA.localeCompare(keyB);
    }
    if (sortBy === 'titulo') {
      return a.titulo.localeCompare(b.titulo);
    }
    return 0;
  });

  return order === 'desc' ? sorted.reverse() : sorted;
}
