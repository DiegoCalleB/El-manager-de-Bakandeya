import express from "express";
import { requireAuth } from "../state.js";
import { loadState, saveState } from "../state.js";
import { updateBandInSheet, fetchBandsFromSheet, deleteBandInSheet, appendBandToSheet } from "../sheets.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";

const router = express.Router();

router.get("/bands", requireAuth, async (req, res) => {
  const state = loadState();
  state.bands = await fetchBandsFromSheet(state.bands || []);
  saveState(state);

  const userBandId = (req as any).user?.band_id || 'band-bakandeya';
  const cleanUser = userBandId.replace(/^(band|reg)-/, '');
  const matchBand = (b: any) => {
    if (!b) return false;
    const bid = b.band_id || b.bandId;
    if (bid) {
      if (bid === userBandId) return true;
      const cleanItem = bid.replace(/^(band|reg)-/, '');
      return cleanItem === cleanUser;
    }
    return cleanUser === 'bakandeya';
  };

  const allBands = state.bands || [];
  const filtered = allBands.filter(matchBand);

  res.json({ bands: filtered });
});

router.post("/bands", requireAuth, async (req, res) => {
  const userBandId = (req as any).user?.band_id || 'band-bakandeya';
  const newBand = req.body;
  if (!newBand.band_id) {
    newBand.band_id = userBandId;
  }
  const state = loadState();
  state.bands = state.bands || [];
  state.bands.push(newBand);
  saveState(state);
  await appendBandToSheet(newBand);
  res.json(newBand);
});

router.put("/bands/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updatedBand = req.body;
  const state = loadState();
  state.bands = state.bands || [];
  state.bands = state.bands.map((b: any) => b.id === id ? updatedBand : b);
  saveState(state);
  await updateBandInSheet(updatedBand);
  res.json(updatedBand);
});

router.delete("/bands/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const state = loadState();
  state.bands = state.bands || [];
  state.bands = state.bands.filter((b: any) => b.id !== id);
  saveState(state);
  await deleteBandInSheet(id);
  res.json({ success: true });
});

router.post("/bands/sync", requireAuth, async (req, res) => {
  const { bands } = req.body;
  if (!Array.isArray(bands)) {
    return res.status(400).json({ error: "Invalid data format." });
  }
  
  const state = loadState();
  state.bands = bands;
  saveState(state);

  for (const band of bands) {
    await updateBandInSheet(band);
  }

  res.json({ success: true, count: bands.length });
});

router.post("/bands/ai-lookup", requireAuth, async (req, res) => {
  const { nombre_banda, localizacion } = req.body;
  if (!nombre_banda) {
    return res.status(400).json({ error: "Nombre de banda requerido" });
  }

  const client = getAiClient();
  if (!client) {
    return res.status(500).json({ error: "Servicio de IA no disponible o API key no configurada." });
  }

  const prompt = `Busca información pública sobre la banda musical "${nombre_banda}" ${localizacion ? `de ${localizacion}` : ''} en España o a nivel internacional.
Devuelve EXCLUSIVAMENTE un objeto JSON con la estructura exacta:
{
  "estilo_musical": "estilo/género musical de la banda",
  "localizacion": "ciudad u origen de la banda",
  "biografia": "resumen breve de 2-3 frases sobre la banda",
  "instagram": "usuario o URL de instagram",
  "spotify_url": "enlace a spotify",
  "youtube_url": "enlace a canal de youtube",
  "contacto_nombre": "nombre de contacto/manager si está disponible",
  "email": "email público de contacto",
  "telefono": "teléfono público",
  "imagen_url": "URL pública del logo o foto de la banda (de Spotify, Instagram, Wikipedia o web oficial si existe)",
  "icono": "un emoji característico para la banda (ej: 🎸, 🎹, 🎤, 🎷, 🎺, 🎧, 🪕, 🎻, ⚡, 🔥, 🎶)"
}
Si no encuentras información exacta para algún campo de texto/URL, usa cadena vacía "". No inventes información sin base real.`;

  try {
    const response = await generateContentWithFallback(client, {
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    let data = {};
    if (jsonStart !== -1 && jsonEnd !== -1) {
      data = JSON.parse(cleanedText.substring(jsonStart, jsonEnd + 1));
    } else {
      data = JSON.parse(cleanedText);
    }
    
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in AI lookup:", err);
    res.status(500).json({ error: "No se pudo consultar información de la banda con IA.", details: err?.message || String(err) });
  }
});

router.post("/bands/analyze-tone", requireAuth, async (req, res) => {
  const { nombre_entidad, instagram, estilo_musical, localizacion, tipo, is_sender, save_to_band_id } = req.body;
  if (!nombre_entidad) {
    return res.status(400).json({ error: "Nombre de la entidad requerido" });
  }

  const client = getAiClient();
  if (!client) {
    return res.status(500).json({ error: "Servicio de IA no disponible o API key no configurada." });
  }

  const isBakandeyaOrSender = is_sender || nombre_entidad.toLowerCase().includes("bakandeya");

  const prompt = `Actúa como un experto lingüista y analista de comunicación musical especializado en redes sociales (Instagram Reels, Posts, TikTok, YouTube Shorts, entrevistas y notas de prensa).

OBJETIVO: Analizar en profundidad la FORMA DE HABLAR, EL ADN DE EXPRESIÓN Y EL TONO DE COMUNICACIÓN de la siguiente entidad musical:
- Nombre de la Entidad: "${nombre_entidad}"
- Rol: ${isBakandeyaOrSender ? "Banda EMISORA de la propuesta (nuestro perfil)" : "Entidad RECEPTORA / Objetivo"}
- Tipo: ${tipo || "Banda / Artista / Sala / Festival"}
- Instagram / Handle: ${instagram || "No especificado"}
- Estilo Musical: ${estilo_musical || "No especificado"}
- Localización: ${localizacion || "No especificada"}

INSTRUCCIONES DE BÚSQUEDA Y EXTRACCIÓN (SEARCH GROUNDING):
1. Rastrear con precisión sus publicaciones recientes en Instagram (@${instagram || nombre_entidad}), Reels, captions de vídeo, TikToks, entrevistas o canal oficial.
2. Extraer frases literales o expresiones muletillas reales que usen en sus Reels/Posts (ej: "chavales", "pogo en el barro", "aúpa familia", "nos vemos en las trincheras", "fuck yeah", "teatralidad e ironía", etc.).
3. Determinar su tono (¿informal/fiestero, provocador/gótico, elegante/institucional, enérgico, académico, callejero?), su nivel de energía, tratamiento habitual (Tú/Vosotros vs Usted) y vocabulario icónico.
4. Redactar una propuesta de contacto o correo electrónico en la que:
   - Si es la banda emisora (Bakandeya): El correo transmite fielmente la energía festiva y directa de Bakandeya (balkan-ska, violín enérgico, sustitución de metales por sintetizador).
   - Si es un grupo destino (ej: Marilyn Manson, Ska-P, etc.): La propuesta se adapta para utilizar referencias, vocabulario y tono que conecten con la personalidad del grupo destino sin perder la esencia de Bakandeya.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura exacta:

{
  "nombre_entidad": "${nombre_entidad}",
  "es_emisor": ${isBakandeyaOrSender ? "true" : "false"},
  "redes_rastreadas": ["Instagram Reels @...", "TikTok", "Prensa / Web oficial"],
  "tono_comunicacion": "Resumen conciso de 1-2 frases del ADN y estilo de voz",
  "tratamiento_habitual": "Tú / Colegueo",
  "nivel_energia": "Alta / Explosiva",
  "vocabulario_clave": ["palabra1", "palabra2", "palabra3", "palabra4"],
  "frases_emblematicas_extraidas": [
    "Frase literal extraída de sus Reels o publicaciones",
    "Otra expresión o muletilla característica"
  ],
  "emojis_frecuentes": ["🔥", "⚡", "🎷", "🍻"],
  "valores_e_intereses": ["autogestión", "música en directo", "directos potentes"],
  "puntos_fuertes_para_conectar": "Cómo conectar esta forma de hablar con una propuesta de concierto/co-booking",
  "recomendacion_pitch": "Consejo lingüístico para redactarles correos de forma auténtica",
  "pitch_personalizado_ejemplo": "Texto completo del email o mensaje de presentación adaptado exactamente a esta forma de expresarse"
}`;

  try {
    const response = await generateContentWithFallback(client, {
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    let data: any = {};
    if (jsonStart !== -1 && jsonEnd !== -1) {
      data = JSON.parse(cleanedText.substring(jsonStart, jsonEnd + 1));
    } else {
      data = JSON.parse(cleanedText);
    }

    // Persist in state if requested or if band_id provided
    if (save_to_band_id) {
      const state = loadState();
      state.bands = state.bands || [];
      const bandIdx = state.bands.findIndex((b: any) => b.id === save_to_band_id || b.band_id === save_to_band_id);
      if (bandIdx !== -1) {
        state.bands[bandIdx].estilo_comunicacion = data.tono_comunicacion || state.bands[bandIdx].estilo_comunicacion;
        state.bands[bandIdx].dna_expresion = data;
        saveState(state);
      }
    }
    
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in Tone Analysis:", err);
    res.status(500).json({ error: "No se pudo analizar el tono de comunicación.", details: err?.message || String(err) });
  }
});

export default router;
