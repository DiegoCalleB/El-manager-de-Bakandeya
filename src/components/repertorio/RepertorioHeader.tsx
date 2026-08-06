import React from 'react';
import { ThemeColors } from '../../types';
import { Music, Layers, Search, Plus, Sparkles, Printer } from 'lucide-react';

interface RepertorioHeaderProps {
  colors: ThemeColors;
  activeTab: 'canciones' | 'setlists';
  setActiveTab: (tab: 'canciones' | 'setlists') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  songCount: number;
  setlistCount: number;
  onOpenNewSongModal: () => void;
  onOpenNewSetlistModal: () => void;
}

export const RepertorioHeader: React.FC<RepertorioHeaderProps> = ({
  colors,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  songCount,
  setlistCount,
  onOpenNewSongModal,
  onOpenNewSetlistModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: `${colors.primary}15`,
            color: colors.primary,
          }}
        >
          <Music className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            Repertorio & Setlists
          </h1>
          <p className="text-xs text-slate-400">
            {songCount} canciones en catálogo • {setlistCount} setlists de concierto
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Navigation Tabs */}
        <div
          className="flex items-center p-1 rounded-xl border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <button
            id="tab-btn-canciones"
            onClick={() => setActiveTab('canciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'canciones' ? 'shadow-sm' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: activeTab === 'canciones' ? colors.primary : 'transparent',
              color: activeTab === 'canciones' ? '#ffffff' : colors.text,
            }}
          >
            <Music className="w-4 h-4" />
            Canciones ({songCount})
          </button>
          <button
            id="tab-btn-setlists"
            onClick={() => setActiveTab('setlists')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'setlists' ? 'shadow-sm' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: activeTab === 'setlists' ? colors.primary : 'transparent',
              color: activeTab === 'setlists' ? '#ffffff' : colors.text,
            }}
          >
            <Layers className="w-4 h-4" />
            Setlists ({setlistCount})
          </button>
        </div>

        {/* Action Button */}
        {activeTab === 'canciones' ? (
          <button
            id="btn-nueva-cancion"
            onClick={onOpenNewSongModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus className="w-4 h-4" />
            Nueva Canción
          </button>
        ) : (
          <button
            id="btn-nuevo-setlist"
            onClick={onOpenNewSetlistModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus className="w-4 h-4" />
            Crear Setlist
          </button>
        )}
      </div>
    </div>
  );
};
