export type FontPresetKey = 'plus_jakarta' | 'outfit' | 'inter' | 'dm_sans' | 'lora' | 'space_grotesk' | 'sora';

export interface FontPreset {
  id: FontPresetKey;
  name: string;
  subtitle: string;
  displayFont: string;
  bodyFont: string;
  description: string;
  badge: string;
  isSoft: boolean;
}

export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'plus_jakarta',
    name: 'Plus Jakarta Sans',
    subtitle: 'Limpia & Equilibrada',
    displayFont: '"Plus Jakarta Sans", sans-serif',
    bodyFont: '"Plus Jakarta Sans", sans-serif',
    description: 'Limpia, equilibrada y muy suave a la vista. Elimina la dureza visual y le da un aspecto profesional y moderno.',
    badge: 'Recomendada',
    isSoft: true,
  },
  {
    id: 'outfit',
    name: 'Outfit',
    subtitle: 'Suave & Contemporánea',
    displayFont: '"Outfit", sans-serif',
    bodyFont: '"Plus Jakarta Sans", sans-serif',
    description: 'Curvas redondeadas y trazado contemporáneo. Transmite calidez, elegancia y lectura sin esfuerzo.',
    badge: 'Suave',
    isSoft: true,
  },
  {
    id: 'dm_sans',
    name: 'DM Sans',
    subtitle: 'Geométrica Fina',
    displayFont: '"DM Sans", sans-serif',
    bodyFont: '"DM Sans", sans-serif',
    description: 'Geometría pulida y estilizada. Excelente para aligerar la densidad en listados, tablas y fichas.',
    badge: 'Ligera',
    isSoft: true,
  },
  {
    id: 'inter',
    name: 'Inter Standard',
    subtitle: 'Clásica UI Neutra',
    displayFont: '"Inter", sans-serif',
    bodyFont: '"Inter", sans-serif',
    description: 'La tipografía estándar de las aplicaciones modernas: neutra, ultra precisa e hiperlegible.',
    badge: 'Clásica',
    isSoft: true,
  },
  {
    id: 'lora',
    name: 'Lora Editorial',
    subtitle: 'Editorial & Distinguida',
    displayFont: '"Lora", serif',
    bodyFont: '"Plus Jakarta Sans", sans-serif',
    description: 'Titulares en serifa editorial elegante combinados con un cuerpo sans-serif suave y moderno.',
    badge: 'Editorial',
    isSoft: true,
  },
  {
    id: 'space_grotesk',
    name: 'Space Grotesk',
    subtitle: 'Geométrica Intensa',
    displayFont: '"Space Grotesk", sans-serif',
    bodyFont: '"Inter", sans-serif',
    description: 'Estilo geométrico y potente con personalidad muy marcada (la opción inicial previa).',
    badge: 'Intensa',
    isSoft: false,
  },
  {
    id: 'sora',
    name: 'Sora',
    subtitle: 'Futurista & Tech',
    displayFont: '"Sora", sans-serif',
    bodyFont: '"DM Sans", sans-serif',
    description: 'Diseño tecnológico moderno, nítido y bien espaciado para un toque vanguardista.',
    badge: 'Tech',
    isSoft: true,
  }
];

export function getStoredFontPreset(): FontPresetKey {
  const saved = localStorage.getItem('bakandeya_font') as FontPresetKey;
  if (saved && FONT_PRESETS.some(p => p.id === saved)) {
    return saved;
  }
  return 'plus_jakarta'; // Default to Plus Jakarta Sans for a much cleaner, softer look
}

export function applyFontPreset(presetKey: FontPresetKey) {
  const preset = FONT_PRESETS.find(p => p.id === presetKey) || FONT_PRESETS[0];
  document.documentElement.style.setProperty('--font-display-current', preset.displayFont);
  document.documentElement.style.setProperty('--font-sans-current', preset.bodyFont);
  document.documentElement.setAttribute('data-font', preset.id);
  
  // Apply direct style properties to body and root to ensure instant recalculation
  document.body.style.fontFamily = preset.bodyFont;
  
  localStorage.setItem('bakandeya_font', preset.id);
}
