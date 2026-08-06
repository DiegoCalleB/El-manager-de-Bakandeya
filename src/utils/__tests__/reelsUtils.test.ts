import { describe, it, expect } from 'vitest';
import { getYouTubeId, getStartTimeInSeconds, formatSecondsToTime } from '../reelsUtils';

describe('reelsUtils', () => {
  it('extracts YouTube video IDs correctly', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(getYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(getYouTubeId('invalid-url')).toBeNull();
  });

  it('parses time range string to seconds', () => {
    expect(getStartTimeInSeconds('01:30 - 02:00')).toBe(90);
    expect(getStartTimeInSeconds('00:45')).toBe(45);
    expect(getStartTimeInSeconds('')).toBe(0);
  });

  it('formats seconds to MM:SS', () => {
    expect(formatSecondsToTime(90)).toBe('01:30');
    expect(formatSecondsToTime(5)).toBe('00:05');
  });
});
