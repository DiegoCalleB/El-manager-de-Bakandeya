import React from 'react';
import { Globe, Phone, ExternalLink } from 'lucide-react';

export interface SocialLinks {
  spotify?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  facebook?: string;
  twitter?: string;
  appleMusic?: string;
  bandcamp?: string;
  website?: string;
  whatsapp?: string;
  [key: string]: string | undefined;
}

interface SocialPlatformsListProps {
  links?: SocialLinks;
  variant?: 'grid' | 'pills' | 'compact';
  title?: string;
  showTitle?: boolean;
}

export const SocialIcons: Record<string, React.FC<{ className?: string }>> = {
  spotify: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.899 4.62-1.02 8.52-.6 11.64 1.32.42.18.479.659.301 1.019zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.38-1.38 9.841-.72 13.56 1.56.36.18.54.78.18 1.261zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/>
    </svg>
  ),
  instagram: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  youtube: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tiktok: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.27 1.76-.23 1.03.03 2.17.7 2.91.7.77 1.8 1.15 2.83 1.02.97-.09 1.88-.66 2.37-1.52.42-.71.55-1.57.54-2.38.01-4.71.01-9.42 0-14.13z"/>
    </svg>
  ),
  appleMusic: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.5-13.882v6.382c0 1.25-1.12 2.15-2.38 1.95-1.01-.16-1.74-.98-1.74-1.95 0-1.07.87-1.93 1.94-1.93.38 0 .73.11 1.03.29V8.882l5.5-1.38v5.38c0 1.25-1.12 2.15-2.38 1.95-1.01-.16-1.74-.98-1.74-1.95 0-1.07.87-1.93 1.94-1.93.38 0 .73.11 1.03.29V6.25l-7.3 1.868z"/>
    </svg>
  ),
  bandcamp: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/>
    </svg>
  ),
  facebook: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  twitter: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  website: Globe,
  whatsapp: Phone
};

export const PLATFORM_CONFIG: Record<string, { label: string; colorClass: string; bgClass: string; borderClass: string; hoverClass: string }> = {
  spotify: {
    label: 'Spotify',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    hoverClass: 'hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-300'
  },
  instagram: {
    label: 'Instagram',
    colorClass: 'text-pink-400',
    bgClass: 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10',
    borderClass: 'border-pink-500/30',
    hoverClass: 'hover:from-purple-500/20 hover:via-pink-500/20 hover:to-amber-500/20 hover:border-pink-500/50 hover:text-pink-300'
  },
  youtube: {
    label: 'YouTube',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    hoverClass: 'hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300'
  },
  tiktok: {
    label: 'TikTok',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/30',
    hoverClass: 'hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-300'
  },
  appleMusic: {
    label: 'Apple Music',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    hoverClass: 'hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-300'
  },
  bandcamp: {
    label: 'Bandcamp',
    colorClass: 'text-teal-300',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/30',
    hoverClass: 'hover:bg-teal-500/20 hover:border-teal-500/50 hover:text-teal-200'
  },
  facebook: {
    label: 'Facebook',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    hoverClass: 'hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-300'
  },
  twitter: {
    label: 'X / Twitter',
    colorClass: 'text-slate-200',
    bgClass: 'bg-slate-800/80',
    borderClass: 'border-slate-700',
    hoverClass: 'hover:bg-slate-700 hover:border-slate-600 hover:text-white'
  },
  website: {
    label: 'Sitio Web',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    hoverClass: 'hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-300'
  },
  whatsapp: {
    label: 'WhatsApp',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-600/10',
    borderClass: 'border-emerald-500/30',
    hoverClass: 'hover:bg-emerald-600/20 hover:border-emerald-500/50 hover:text-emerald-300'
  }
};

export const SocialPlatformsList: React.FC<SocialPlatformsListProps> = ({
  links,
  variant = 'grid',
  title = 'Síguenos en nuestras plataformas',
  showTitle = true
}) => {
  if (!links) return null;

  const validEntries = Object.entries(links).filter(([_, url]) => url && url.trim() !== '');

  if (validEntries.length === 0) return null;

  if (variant === 'pills') {
    return (
      <div className="space-y-2">
        {showTitle && (
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider text-center">
            {title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {validEntries.map(([key, url]) => {
            const config = PLATFORM_CONFIG[key] || {
              label: key,
              colorClass: 'text-slate-300',
              bgClass: 'bg-slate-800',
              borderClass: 'border-slate-700',
              hoverClass: 'hover:bg-slate-700'
            };
            const IconComp = SocialIcons[key] || Globe;

            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 shadow-sm ${config.bgClass} ${config.borderClass} ${config.colorClass} ${config.hoverClass}`}
              >
                <IconComp className="w-4 h-4" />
                <span>{config.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="text-center">
          <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
            {title}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Únete a nuestra comunidad y escucha nuestra música en directo
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {validEntries.map(([key, url]) => {
          const config = PLATFORM_CONFIG[key] || {
            label: key,
            colorClass: 'text-slate-300',
            bgClass: 'bg-slate-800',
            borderClass: 'border-slate-700',
            hoverClass: 'hover:bg-slate-700'
          };
          const IconComp = SocialIcons[key] || Globe;

          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all duration-200 shadow-md group ${config.bgClass} ${config.borderClass} ${config.colorClass} ${config.hoverClass}`}
            >
              <div className="flex items-center gap-2.5">
                <IconComp className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                <span>{config.label}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
          );
        })}
      </div>
    </div>
  );
};
