import React, { useEffect, useState } from 'react';
import { resolveAudioUrl } from '../utils/audioStorage';
import { Disc3, Play, Pause } from 'lucide-react';

interface AlbumCoverProps {
  url?: string;
  coverUrl?: string;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlay?: (e: React.MouseEvent) => void;
  isPlaying?: boolean;
  showPlayButton?: boolean;
  title?: string;
  artist?: string;
  size?: number;
  className?: string;
}

export const AlbumCover: React.FC<AlbumCoverProps> = ({ 
  url, 
  coverUrl, 
  onUpload, 
  onPlay,
  isPlaying = false,
  showPlayButton = false,
  className = "" 
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const targetUrl = url || coverUrl || '/logo_bakandeya.jpg';

  useEffect(() => {
    if (targetUrl) {
      resolveAudioUrl(targetUrl).then(res => setResolvedUrl(res)).catch(() => setResolvedUrl(null));
    } else {
      setResolvedUrl(null);
    }
  }, [targetUrl]);

  return (
    <div 
      onClick={onPlay}
      className={`aspect-square bg-cover bg-center bg-neutral-800 flex items-center justify-center relative transition-all group overflow-hidden ${onPlay ? 'cursor-pointer' : ''} ${className || 'w-full h-full'}`} 
      style={{ backgroundImage: resolvedUrl ? `url(${resolvedUrl})` : 'none' }}
    >
      {!resolvedUrl && <Disc3 className="w-16 h-16 opacity-20 text-white" />}
      

      {/* Floating Green Play Button */}
      {(onPlay || showPlayButton) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onPlay) onPlay(e);
          }}
          className={`absolute bottom-3 right-3 w-12 h-12 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black shadow-2xl flex items-center justify-center transform transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 z-20 ${
            isPlaying 
              ? 'translate-y-0 opacity-100 ring-2 ring-white/50 scale-105' 
              : 'translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
          }`}
          title={isPlaying ? "Pausar reproductor" : "Reproducir álbum"}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>
      )}
    </div>
  );
};


