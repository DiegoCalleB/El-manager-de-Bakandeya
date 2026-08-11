import { EPKConfig, Song } from '../types';

export interface EPKCompletenessResult {
  score: number; // 0-100
  missingItems: string[];
}

export function isBioComplete(epk?: Partial<EPKConfig>): boolean {
  if (!epk?.biografia) return false;
  const bio = epk.biografia.trim();
  if (bio.length < 80) return false;
  const lower = bio.toLowerCase();
  if (lower.includes('propuesta musical en directo') && bio.length < 100) return false;
  if (lower.includes('por definir')) return false;
  return true;
}

export function isDossierComplete(epk?: Partial<EPKConfig>): boolean {
  if (!epk) return false;
  if (epk.dossierPdfUrl && epk.dossierPdfUrl.trim().length > 5) return true;
  if (epk.dossierDocumentUrl && epk.dossierDocumentUrl.trim().length > 5) return true;
  if (!epk.dossierTextoExtra) return false;
  const text = epk.dossierTextoExtra.trim();
  if (text.length < 80) return false;
  const lower = text.toLowerCase();
  if (lower.includes('por definir') || lower.includes('propuesta musical')) return false;
  return true;
}

export function isRiderComplete(epk?: Partial<EPKConfig>): boolean {
  if (!epk) return false;
  if (epk.riderPdfUrl && epk.riderPdfUrl.trim().length > 5) return true;
  if (!epk.riderTecnico) return false;
  const text = epk.riderTecnico.trim();
  if (text.length < 80) return false;
  const lower = text.toLowerCase();
  if (lower.includes('por definir') || lower === 'rider técnico' || lower === 'rider técnico por definir.') return false;
  return true;
}

/**
 * Calculates the completeness score of an Electronic Press Kit (EPK)
 */
export function calculateEPKCompletenessScore(epk: EPKConfig): EPKCompletenessResult {
  let score = 0;
  const missingItems: string[] = [];

  // Biography (20 pts)
  if (isBioComplete(epk)) {
    score += 20;
  } else {
    missingItems.push('Biografía detallada (mínimo 80 caracteres redactados)');
  }

  // Band Photos (20 pts)
  if (epk.bandPhotos && epk.bandPhotos.length >= 2) {
    score += 20;
  } else if (epk.bandPhotos && epk.bandPhotos.length === 1) {
    score += 10;
    missingItems.push('Añadir al menos 2 fotos en alta resolución');
  } else {
    missingItems.push('Fotos oficiales de la banda');
  }

  // Logo (10 pts)
  if (epk.logoUrl && epk.logoUrl.trim().length > 0) {
    score += 10;
  } else {
    missingItems.push('Logo vectorizado / transparente');
  }

  // Technical Rider (15 pts)
  if (isRiderComplete(epk)) {
    score += 15;
  } else {
    missingItems.push('Rider técnico completo (PDF subido o resumen técnico de mín. 80 caracteres)');
  }

  // Contact Info (15 pts)
  if (epk.contactoBooking && epk.contactoBooking.email && epk.contactoBooking.telefono) {
    score += 15;
  } else {
    missingItems.push('Datos completos de contacto booking');
  }

  // Featured Tracks (10 pts)
  if (epk.temasDestacadosIds && epk.temasDestacadosIds.length >= 1) {
    score += 10;
  } else {
    missingItems.push('Temas destacados seleccionados');
  }

  // Social Links (10 pts)
  if (epk.enlacesRedes && (epk.enlacesRedes.spotify || epk.enlacesRedes.youtube || epk.enlacesRedes.instagram)) {
    score += 10;
  } else {
    missingItems.push('Enlaces a plataformas (Spotify, YouTube, Instagram)');
  }

  return {
    score: Math.min(100, score),
    missingItems,
  };
}

/**
 * Formats EPK information into a press kit summary snippet
 */
export function generateEPKPressKitSummary(epk: EPKConfig, featuredSongs: Song[] = []): string {
  const socialList = [
    epk.enlacesRedes?.spotify && `Spotify: ${epk.enlacesRedes.spotify}`,
    epk.enlacesRedes?.youtube && `YouTube: ${epk.enlacesRedes.youtube}`,
    epk.enlacesRedes?.instagram && `Instagram: ${epk.enlacesRedes.instagram}`,
  ].filter(Boolean).join('\n');

  const songList = featuredSongs.map(s => `- ${s.titulo} (${s.duracion}) [Tonalidad: ${s.tonalidad}]`).join('\n');

  return `
=== PRESS KIT COMPACTO ===
${epk.biografia ? epk.biografia.slice(0, 300) + '...' : ''}

🎵 TEMAS DESTACADOS:
${songList || 'Sin canciones asignadas'}

🔗 ENLACES OFICIALES:
${socialList || 'Sin redes configuradas'}

📞 CONTACTO BOOKING:
${epk.contactoBooking?.nombre || 'Mánager'} (${epk.contactoBooking?.email || ''} / ${epk.contactoBooking?.telefono || ''})
`.trim();
}
