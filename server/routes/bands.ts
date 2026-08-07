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
  const isBakandeyaOrAdmin = userBandId === 'band-bakandeya' || userBandId === 'reg-bakandeya' || (req as any).user?.role === 'admin';

  const allBands = state.bands || [];
  const filtered = isBakandeyaOrAdmin
    ? allBands
    : allBands.filter((b: any) => b.band_id === userBandId || b.id === userBandId);

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

export default router;
