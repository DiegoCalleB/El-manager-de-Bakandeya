export interface ReelCard {
  id: string;
  title: string;
  duration: string;
  category: string;
  stage: 'draft' | 'edit' | 'ready';
  ideas: string;
}

export interface HighlightClip {
  id: string;
  range: string;
  title: string;
  description?: string;
  reason?: string;
  virality?: number;
  confidence?: number;
  energyLevel?: string;
  recommendedCopy?: string;
  hashtags?: string[];
}

export interface OptimalTime {
  day: string;
  date: string;
  time: string;
  reason: string;
}

/**
 * Extracts YouTube video ID from a URL
 */
export function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Parses time range string like "01:15 - 01:45" to start time in seconds
 */
export function getStartTimeInSeconds(rangeStr?: string): number {
  if (!rangeStr) return 0;
  const firstPart = rangeStr.split('-')[0].trim();
  const timeParts = firstPart.split(':');
  if (timeParts.length === 2) {
    const mins = parseInt(timeParts[0], 10) || 0;
    const secs = parseInt(timeParts[1], 10) || 0;
    return mins * 60 + secs;
  } else if (timeParts.length === 1) {
    return parseInt(timeParts[0], 10) || 0;
  }
  return 0;
}

/**
 * Formats seconds into MM:SS format
 */
export function formatSecondsToTime(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
