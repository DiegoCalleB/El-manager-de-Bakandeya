/**
 * Helper prompt builders and response sanitizers for the AI Agent system
 */

export function sanitizeAIResponse(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```html\s*/i, '')
    .replace(/^```markdown\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function buildPitchPrompt(
  venueName: string,
  city: string,
  capacity: number,
  genre: string,
  bandBio: string,
  estimatedCache: number = 800
): string {
  return `
Eres un Booking Manager profesional con más de 15 años de experiencia negociando fechas para bandas independientes.
Genera un correo de pitch personalizado, profesional, persuasivo y respetuoso para la sala/organizador:

DATOS DE LA SALA:
- Nombre: ${venueName}
- Ciudad: ${city}
- Aforo: ${capacity} pax
- Género/Estilo habitual de la sala: ${genre}

DATOS DE LA BANDA:
- Biografía breve: ${bandBio}
- Cache propuesto estimativo: ${estimatedCache}€

INSTRUCCIONES:
1. Mantén un tono profesional, cercano y apasionado por la música en directo.
2. Destaca por qué la banda encaja perfectamente en la programación de ${venueName}.
3. Propón fechas flexibles o intercambio de fecha con banda local si aplica.
4. Incluye llamadas a la acción claras para revisar el EPK o escuchar el single destacado.
5. NO uses palabras vacías o clichés de ventas agresivas.
`.trim();
}

export function buildPressReleasePrompt(
  bandName: string,
  releaseTitle: string,
  releaseDate: string,
  genre: string,
  keyHighlights: string
): string {
  return `
Eres un Jefe de Prensa Musical (PR Manager). Redacta una Nota de Prensa oficial atractiva para medios de comunicación, blogs y radios musicales.

DATOS DEL LANZAMIENTO:
- Banda/Artista: ${bandName}
- Título del Lanzamiento: ${releaseTitle}
- Fecha de Lanzamiento: ${releaseDate}
- Estilo Musical: ${genre}
- Puntos Clave: ${keyHighlights}

ESTRUCTURA REQUERIDA:
1. Titular llamativo e impactante.
2. Subtitular resumen.
3. Cuerpo principal (3 párrafos cortos):
   - Párrafo 1: El concepto musical y la propuesta sonora.
   - Párrafo 2: La historia detrás del tema o álbum.
   - Párrafo 3: Fechas de gira o eventos de presentación.
4. Ficha técnica y contacto para acreditaciones / entrevistas.
`.trim();
}

export function buildReelScriptPrompt(
  songTitle: string,
  conceptAngle: string,
  targetPlatform: 'TikTok' | 'Instagram' | 'YouTube Shorts' = 'Instagram'
): string {
  return `
Eres un Director Creativo especialista en contenido viral para artistas en ${targetPlatform}.
Crea un guion detallado de 15 a 30 segundos para promocionar la canción "${songTitle}".

ÁNGULO CREATIVO: ${conceptAngle}

ESTRUCTURA DEL GUION:
- HOOK (Segundos 0-3): Gancho visual y auditivo para detener el scroll.
- DESARROLLO (Segundos 3-12): Escena clave, ensayo, back stage o interpretación emocional.
- CLÍMAX (Segundos 12-20): Momento cumbre de la canción con texto superpuesto impactante.
- CALL TO ACTION (Segundos 20-25): Indicación clara para escuchar en Spotify/Guardar el audio.
`.trim();
}
