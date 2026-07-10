import React from 'react';
import { ThemeName, ThemeColors } from '../types';
import { THEMES } from '../utils/theme';
import { Paintbrush, Disc, Sparkles } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  colors: ThemeColors;
}

export default function ThemeSelector({ currentTheme, onThemeChange, colors }: ThemeSelectorProps) {
  return (
    <div className={`p-4 rounded-xl border ${colors.card} ${colors.neonShadow} mb-6 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paintbrush className={`w-5 h-5 ${colors.accent}`} />
          <h3 className="font-bold tracking-tight">Estilo Visual Bakandeya</h3>
        </div>
        <span className="text-xs font-mono bg-neutral-800/80 px-2 py-0.5 rounded-md text-neutral-400 border border-neutral-700/50 flex items-center gap-1">
          <Disc className="w-3.5 h-3.5 animate-spin" /> Live Tour Style
        </span>
      </div>
      <p className={`text-xs ${colors.textMuted} mb-4`}>
        Personaliza la estética de la plataforma según la vibra o campaña musical actual. Cada estilo adapta tipografía, colores y brillos de backstage.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {(Object.keys(THEMES) as ThemeName[]).map((themeKey) => {
          const t = THEMES[themeKey];
          const isActive = currentTheme === themeKey;
          return (
            <button
              id={`theme-btn-${themeKey}`}
              key={themeKey}
              onClick={() => onThemeChange(themeKey)}
              className={`flex flex-col text-left p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                isActive 
                  ? 'border-neutral-100 bg-neutral-800 ring-2 ring-offset-2 ring-offset-black ring-neutral-100' 
                  : 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800/60 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-neutral-200">{t.name.split(' (')[0]}</span>
                {isActive && <Sparkles className="w-3.5 h-3.5 text-yellow-400" />}
              </div>
              
              <div className="flex items-center gap-1.5 mt-auto">
                <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block border border-black/30" style={{ backgroundColor: themeKey === 'backstage_neon' ? '#06b6d4' : themeKey === 'roots_ska' ? '#f59e0b' : themeKey === 'indie_velvet' ? '#f43f5e' : '#facc15' }} />
                <span className="w-3 h-3 rounded-full inline-block border border-black/30" style={{ backgroundColor: themeKey === 'backstage_neon' ? '#d946ef' : themeKey === 'roots_ska' ? '#10b981' : themeKey === 'indie_velvet' ? '#818cf8' : '#27272a' }} />
                <span className="text-[10px] text-neutral-400 font-mono ml-auto">
                  {themeKey === 'backstage_neon' ? 'NEON' : themeKey === 'roots_ska' ? 'SKA' : themeKey === 'indie_velvet' ? 'INDIE' : 'PUNK'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
