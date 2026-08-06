import { useState, useMemo } from 'react';
import { Song, Setlist } from '../types';
import { calculateSetlistStats } from '../utils/repertorioUtils';

export function useRepertorio(songs: Song[], setlists: Setlist[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'canciones' | 'setlists'>('canciones');

  const songMap = useMemo(() => {
    const map = new Map<string, Song>();
    songs.forEach((s) => map.set(s.id, s));
    return map;
  }, [songs]);

  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return songs.filter((s) => {
      const matchesQuery = !q || s.titulo.toLowerCase().includes(q) || (s.tonalidad && s.tonalidad.toLowerCase().includes(q));
      return matchesQuery;
    });
  }, [songs, searchQuery]);

  const setlistsWithMetrics = useMemo(() => {
    return setlists.map((setlist) => {
      const stats = calculateSetlistStats(setlist.items || [], songMap);
      const totalMinutos = Math.round(stats.totalDurationSeconds / 60);
      return {
        ...setlist,
        totalSegundos: stats.totalDurationSeconds,
        totalMinutos,
        averageBpm: stats.averageBpm,
        songCount: stats.songCount,
      };
    });
  }, [setlists, songMap]);

  return {
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    activeTab,
    setActiveTab,
    filteredSongs,
    setlistsWithMetrics,
  };
}
