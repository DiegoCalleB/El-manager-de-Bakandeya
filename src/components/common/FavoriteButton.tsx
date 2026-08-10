import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface FavoriteButtonProps {
  isFavorite?: boolean;
  onToggle: (newStatus: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite = false,
  onToggle,
  size = 'md',
  className = ''
}) => {
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(!isFavorite);
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
      className={`p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 ${
        isFavorite
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10 hover:bg-amber-500/30'
          : 'bg-neutral-800/60 text-neutral-400 border border-neutral-700/50 hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10'
      } ${className}`}
    >
      <Star
        className={`${iconSizes[size]} transition-all duration-200 ${
          isFavorite || hovered ? 'fill-amber-400 text-amber-400 scale-105' : 'text-neutral-400'
        }`}
      />
    </button>
  );
};
