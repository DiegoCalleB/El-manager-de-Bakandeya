import { Song, SongAudioIdea, Setlist, Rehearsal, Concert, Lead, EPKConfig } from '../types';

export interface SharePayload {
  title: string;
  text: string;
  url?: string;
  type?: 'song' | 'idea' | 'setlist' | 'rehearsal' | 'concert' | 'pitch' | 'epk' | 'custom';
}

/**
 * Uses Web Share API if supported by the browser/device (mobile phones, tablets, modern browsers).
 */
export async function shareViaWebShare(payload: SharePayload): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url || undefined
      });
      return true;
    } catch (err: any) {
      // User cancelled or share failed
      if (err.name !== 'AbortError') {
        console.error('Error sharing via Web Share API:', err);
      }
      return false;
    }
  }
  return false;
}

/**
 * Direct WhatsApp sharing link generator
 */
export function shareViaWhatsApp(text: string, phone?: string): void {
  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Email share link generator
 */
export function shareViaEmail(subject: string, body: string): void {
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, '_blank');
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

// ----------------------------------------------------------------------
// FORMATTERS FOR DIFFERENT APPS AND DATA TYPES
// ----------------------------------------------------------------------

/**
 * Format a Song for sharing (WhatsApp / SMS / Mail)
 */
export function formatSongShareText(
  song: Song,
  options: { includeChords?: boolean; includeGuide?: boolean; bandName?: string } = {}
): string {
  const parts: string[] = [];

  parts.push(`🎵 *${song.titulo.toUpperCase()}*${options.bandName ? ` - ${options.bandName}` : ''}`);
  if (song.albumDisco) parts.push(`💿 *Álbum/EP:* ${song.albumDisco}`);
  
  const details: string[] = [];
  if (song.tonalidad) details.push(`🎹 Tonalidad: ${song.tonalidad}`);
  if (song.bpm) details.push(`⏱️ ${song.bpm} BPM`);
  if (song.duracion) details.push(`⏳ ${song.duracion}`);
  if (song.afinacion) details.push(`🎸 Afinación: ${song.afinacion}`);
  if (details.length > 0) {
    parts.push(details.join(' | '));
  }

  if (song.estadoTema) {
    const estadoLabels: Record<string, string> = {
      listo: '✅ Listo para directo',
      ensayando: '🔥 En ensayo',
      componiendo: '💡 En composición',
      descartado: '📦 Archivado'
    };
    parts.push(`📌 *Estado:* ${estadoLabels[song.estadoTema] || song.estadoTema}`);
  }

  if (song.notasInternas) {
    parts.push(`\n📝 *Notas de la banda:* ${song.notasInternas}`);
  }

  if (song.audioPrincipalUrl) {
    parts.push(`\n🔊 *Escuchar audio demo:* ${song.audioPrincipalUrl}`);
  }

  if (options.includeChords && song.cifradoTexto) {
    parts.push(`\n🎼 *ACORDES Y LETRA:*\n\`\`\`\n${song.cifradoTexto.trim()}\n\`\`\``);
  }

  if (options.includeGuide && song.guiaSustituto) {
    const g = song.guiaSustituto;
    parts.push(`\n⚡ *GUÍA RÁPIDA PARA MÚSICOS / SUSTITUTOS:*`);
    if (g.progresionClave) parts.push(`• Progresión clave: ${g.progresionClave}`);
    if (g.estructura) parts.push(`• Estructura: ${g.estructura}`);
    if (g.capoTraste) parts.push(`• Capo/Traste: ${g.capoTraste}`);
    if (g.cortesYClaves) parts.push(`• Cortes/Claves: ${g.cortesYClaves}`);
    if (g.instrumentosClave) parts.push(`• Notas de instrumento: ${g.instrumentosClave}`);
  }

  parts.push(`\n_Enviado desde BandManager_ 🚀`);

  return parts.join('\n');
}

/**
 * Format a Song Audio Idea for sharing
 */
export function formatSongIdeaShareText(
  song: Song,
  idea: SongAudioIdea,
  bandName?: string
): string {
  const parts: string[] = [];

  const sectionLabel = idea.seccion ? idea.seccion.toUpperCase() : 'GENERAL';
  parts.push(`💡 *NUEVA IDEA DE AUDIO: ${idea.titulo.toUpperCase()}*`);
  parts.push(`🎵 *Canción:* ${song.titulo}${bandName ? ` (${bandName})` : ''}`);
  parts.push(`🏷️ *Sección:* [${sectionLabel}]`);
  parts.push(`👤 *Idea de:* ${idea.subidoPor}${idea.instrumento ? ` (${idea.instrumento})` : ''}`);
  if (idea.fecha) parts.push(`📅 *Fecha:* ${idea.fecha}`);

  if (idea.notas) {
    parts.push(`\n💬 *Comentario / Notas:* "${idea.notas}"`);
  }

  if (idea.audioUrl) {
    parts.push(`\n🔊 *Escuchar/Descargar Audio:* ${idea.audioUrl}`);
  }

  if (idea.pistas && idea.pistas.length > 1) {
    parts.push(`\n🎛️ *Pistas multipista (${idea.pistas.length}):*`);
    idea.pistas.forEach((p, idx) => {
      parts.push(`  ${idx + 1}. ${p.nombre}${p.instrumento ? ` (${p.instrumento})` : ''}`);
    });
  }

  parts.push(`\n_Enviado desde BandManager_ 🚀`);

  return parts.join('\n');
}

/**
 * Format a Setlist for sharing
 */
export function formatSetlistShareText(
  setlist: Setlist,
  songsMap: Record<string, Song> = {},
  bandName?: string
): string {
  const parts: string[] = [];

  parts.push(`📋 *REPERTORIO / SETLIST: ${setlist.nombre.toUpperCase()}*`);
  if (bandName) parts.push(`🎸 *Banda:* ${bandName}`);
  if (setlist.tipoFormato) {
    const formatLabels: Record<string, string> = {
      festival: '🎪 Festival',
      sala_larga: '🎸 Concierto Sala (Largo)',
      acustico: '🪕 Formato Acústico',
      ensayo: '🔊 Ensayo',
      otro: '📌 Especial'
    };
    parts.push(`🎭 *Formato:* ${formatLabels[setlist.tipoFormato] || setlist.tipoFormato}`);
  }

  if (setlist.duracionTotalEstimadaMinutos) {
    parts.push(`⏱️ *Duración estimada:* ~${setlist.duracionTotalEstimadaMinutos} minutos`);
  }

  if (setlist.descripcion) {
    parts.push(`📝 *Notas:* ${setlist.descripcion}`);
  }

  parts.push('\n----------------------------------------');

  if (!setlist.items || setlist.items.length === 0) {
    parts.push('(Sin canciones asignadas en el setlist)');
  } else {
    let songNum = 1;
    setlist.items.forEach((item) => {
      if (item.tipoItem === 'bloque_header') {
        parts.push(`\n⚡ *=== ${item.tituloCustom || 'BLOQUE'} ===*`);
      } else if (item.tipoItem === 'cancion' && item.songId && songsMap[item.songId]) {
        const s = songsMap[item.songId];
        const info: string[] = [];
        if (s.tonalidad) info.push(s.tonalidad);
        if (s.bpm) info.push(`${s.bpm} BPM`);
        if (s.duracion) info.push(s.duracion);
        if (s.afinacion && s.afinacion !== 'E Standard') info.push(`Af: ${s.afinacion}`);

        const infoStr = info.length > 0 ? ` (${info.join(' | ')})` : '';
        const notesStr = item.notaTema ? ` ➔ _${item.notaTema}_` : '';
        parts.push(`${songNum}. *${s.titulo}*${infoStr}${notesStr}`);
        songNum++;
      } else {
        // Speech / Break / Intro / Solo / etc
        const itemIcons: Record<string, string> = {
          chapa: '💬',
          descanso: '⏸️',
          bis: '💣',
          presentacion: '🎤',
          intro_tema: '🗣️',
          beatbox: '🥁',
          solo_performance: '🎸',
          cambio_instrumento: '🔧',
          interludio: '✨',
          otro: '📌'
        };
        const icon = itemIcons[item.tipoItem] || '📌';
        const title = item.tituloCustom || item.tipoItem;
        const dur = item.duracionEstimadaMinutos ? ` (${item.duracionEstimadaMinutos} min)` : '';
        const note = item.notas ? ` - _${item.notas}_` : '';
        parts.push(`  ${icon} _${title}${dur}_${note}`);
      }
    });
  }

  parts.push('----------------------------------------');
  parts.push(`_Enviado desde BandManager_ 🚀`);

  return parts.join('\n');
}

/**
 * Format a Rehearsal convocatoria for sharing
 */
export function formatRehearsalShareText(
  rehearsal: Rehearsal,
  setlistName?: string,
  bandName?: string
): string {
  const parts: string[] = [];

  parts.push(`🔊 *CONVOCATORIA DE ENSAYO* ${bandName ? `- ${bandName}` : ''}`);
  parts.push(`📅 *Fecha:* ${rehearsal.fecha}`);
  parts.push(`⏰ *Hora:* ${rehearsal.hora}`);
  parts.push(`📍 *Lugar:* ${rehearsal.lugar}`);

  if (rehearsal.convocados_nombres && rehearsal.convocados_nombres.length > 0) {
    parts.push(`👥 *Convocados:* ${rehearsal.convocados_nombres.join(', ')}`);
  } else if (rehearsal.asistentes && rehearsal.asistentes.length > 0) {
    parts.push(`👥 *Asistentes:* ${rehearsal.asistentes.join(', ')}`);
  }

  if (setlistName) {
    parts.push(`📋 *Setlist a ensayar:* ${setlistName}`);
  }

  if (rehearsal.notas) {
    parts.push(`\n📝 *Notas / Objetivos del ensayo:* ${rehearsal.notas}`);
  }

  parts.push(`\n_¡A darlo todo en el local!_ 🎸🔥`);

  return parts.join('\n');
}

/**
 * Format a Concert convocatoria for sharing
 */
export function formatConcertShareText(
  concert: Concert,
  setlistName?: string,
  bandName?: string
): string {
  const parts: string[] = [];

  parts.push(`🎸 *CONVOCATORIA DE CONCIERTO* ${bandName ? `- ${bandName}` : ''}`);
  parts.push(`📍 *Lugar:* ${concert.sala} (${concert.ciudad})`);
  if (concert.direccion) parts.push(`🏛️ *Dirección:* ${concert.direccion}`);
  parts.push(`📅 *Fecha:* ${concert.fecha}`);
  if (concert.cache > 0) parts.push(`💰 *Caché acordado:* ${concert.cache}€`);

  if (concert.convocados_nombres && concert.convocados_nombres.length > 0) {
    parts.push(`👥 *Músicos convocados:* ${concert.convocados_nombres.join(', ')}`);
  }

  if (setlistName) {
    parts.push(`📋 *Setlist del concierto:* ${setlistName}`);
  }

  if (concert.notas) {
    parts.push(`\n📝 *Notas y logística:* ${concert.notas}`);
  }

  parts.push(`\n_Enviado desde BandManager_ 🚀`);

  return parts.join('\n');
}

/**
 * Format a Lead Pitch for sharing
 */
export function formatPitchShareText(
  lead: Lead,
  bandName?: string
): string {
  const parts: string[] = [];

  if (lead.pitch_generado) {
    return lead.pitch_generado;
  }

  parts.push(`Hola! Somos *${bandName || 'la banda'}*. Nos gustaría proponeros tocar en *${lead.nombre_sala}* (${lead.ciudad}).`);
  parts.push(`¿Con quién podríamos hablar para cerrar fecha? ¡Muchas gracias!`);

  return parts.join('\n');
}

/**
 * Format EPK for sharing
 */
export function formatEPKShareText(
  bandName: string,
  epkConfig: EPKConfig
): string {
  const parts: string[] = [];

  parts.push(`🔥 *DOSSIER Y EPK OFICIAL DE ${bandName.toUpperCase()}*`);

  if (epkConfig.biografia) {
    const bioShort = epkConfig.biografia.length > 250 
      ? epkConfig.biografia.substring(0, 250) + '...'
      : epkConfig.biografia;
    parts.push(`\n📖 *Biografía:*\n${bioShort}`);
  }

  const links: string[] = [];
  if (epkConfig.enlacesRedes?.spotify) links.push(`🎧 Spotify: ${epkConfig.enlacesRedes.spotify}`);
  if (epkConfig.enlacesRedes?.youtube) links.push(`🎬 YouTube: ${epkConfig.enlacesRedes.youtube}`);
  if (epkConfig.enlacesRedes?.instagram) links.push(`📸 Instagram: ${epkConfig.enlacesRedes.instagram}`);
  if (links.length > 0) {
    parts.push(`\n🔗 *Enlaces:* \n${links.join('\n')}`);
  }

  if (epkConfig.dossierPdfUrl) {
    parts.push(`\n📁 *Descargar Dossier / EPK (PDF):* ${epkConfig.dossierPdfUrl}`);
  }

  if (epkConfig.riderPdfUrl) {
    parts.push(`⚙️ *Rider Técnico & Stage Plan:* ${epkConfig.riderPdfUrl}`);
  }

  if (epkConfig.contactoBooking?.nombre) {
    parts.push(`\n📞 *Contacto de Booking:*`);
    parts.push(`👤 ${epkConfig.contactoBooking.nombre}`);
    if (epkConfig.contactoBooking.telefono) parts.push(`📱 ${epkConfig.contactoBooking.telefono}`);
    if (epkConfig.contactoBooking.email) parts.push(`✉️ ${epkConfig.contactoBooking.email}`);
  }

  parts.push(`\n_Enviado desde BandManager_ 🚀`);

  return parts.join('\n');
}
