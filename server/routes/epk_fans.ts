import express from "express";
import { loadState, saveState, requireAuth, getEpkConfigForBand, BAKANDEYA_BAND_ID } from "../state.js";
import { EPKConfig, Fan } from "../../src/types.js";
import { appendFanToSheet, deleteFanInSheet } from "../sheets.js";
import { googleSheetsService } from "../services/googleSheets.service.js";

const router = express.Router();

// Get EPK Config (Authenticated)
router.get("/epk", async (req, res) => {
  const state = loadState();
  const user = (req as any).user;
  const userBandId = user?.band_id || BAKANDEYA_BAND_ID;
  const userBandName = user?.bandName || user?.name || 'Tu Banda';
  
  // Try loading from Google Sheets to ensure sync
  try {
    const sheetEpks = await googleSheetsService.fetchEpkConfigs(state.epkConfigsByBand || {});
    state.epkConfigsByBand = { ...state.epkConfigsByBand, ...sheetEpks };
  } catch (e) {
    // Keep local state fallback
  }

  const epk = getEpkConfigForBand(state, userBandId, userBandName, user?.email);
  res.json(epk);
});

// Update EPK Config (Authenticated)
router.put("/epk", requireAuth, async (req, res) => {
  try {
    const updatedConfig: Partial<EPKConfig> = req.body;
    const state = loadState();
    const user = (req as any).user;
    const userBandId = user?.band_id || BAKANDEYA_BAND_ID;
    const userBandName = user?.bandName || user?.name || 'Tu Banda';
    const current = getEpkConfigForBand(state, userBandId, userBandName, user?.email);
    state.epkConfigsByBand[userBandId] = { ...current, ...updatedConfig };
    if (userBandId === BAKANDEYA_BAND_ID) {
      state.epkConfig = state.epkConfigsByBand[userBandId];
    }
    saveState(state);

    // Sync to Google Sheets tab 'dossier_epk'
    googleSheetsService.updateEpk(userBandId, state.epkConfigsByBand[userBandId]).catch(err => {
      console.warn("Notice syncing EPK config to Google Sheets:", err?.message || err);
    });

    res.json({ success: true, epkConfig: state.epkConfigsByBand[userBandId] });
  } catch (err: any) {
    console.error("Error updating EPK config:", err);
    res.status(500).json({ error: err?.message || "Error al actualizar la configuración del EPK." });
  }
});

// Public EPK Data endpoint (No Auth required for public sharing)
router.get("/public/epk", (req, res) => {
  const state = loadState();
  const reqBandId = (req.query.band_id as string) || (req.query.band as string) || BAKANDEYA_BAND_ID;
  const epkConfig = getEpkConfigForBand(state, reqBandId);
  const songs = (state.songs || []).filter((s: any) => s.band_id === reqBandId || (!s.band_id && reqBandId === BAKANDEYA_BAND_ID));
  const concerts = (state.concerts || []).filter((c: any) => c.band_id === reqBandId || (!c.band_id && reqBandId === BAKANDEYA_BAND_ID));

  const regBand = (state.registeredBands || []).find((b: any) => b.band_id === reqBandId || b.id === reqBandId);
  const bandName = regBand?.nombre_banda || (reqBandId === BAKANDEYA_BAND_ID ? "Bakandeya" : "Banda");

  // Filter 2-3 highlighted songs
  const highlightedSongs = epkConfig.temasDestacadosIds?.length > 0
    ? songs.filter((s: any) => epkConfig.temasDestacadosIds.includes(s.id))
    : songs.slice(0, 3);

  // Upcoming and recent concerts
  const today = new Date().toISOString().split("T")[0];
  const upcomingConcerts = concerts.filter((c: any) => c.fecha >= today);

  res.json({
    bandName,
    epkConfig,
    highlightedSongs,
    upcomingConcerts: upcomingConcerts.slice(0, 5),
    totalConcertsCount: concerts.length
  });
});

// Get Fans List (Authenticated)
router.get("/fans", requireAuth, (req, res) => {
  const state = loadState();
  const userBandId = (req as any).user?.band_id || 'band-bakandeya';
  const isBakandeyaOrAdmin = userBandId === 'band-bakandeya' || userBandId === 'reg-bakandeya' || (req as any).user?.role === 'admin';

  const allFans = state.fans || [];
  const filtered = isBakandeyaOrAdmin
    ? allFans
    : allFans.filter((f: Fan) => (f as any).band_id === userBandId || !(f as any).band_id);

  res.json(filtered);
});

// Add Fan manually (Authenticated)
router.post("/fans", requireAuth, async (req, res) => {
  try {
    const newFan: Fan = req.body;
    if (!newFan.nombre || !newFan.email) {
      return res.status(400).json({ error: "Nombre y Email son obligatorios" });
    }
    const userBandId = (req as any).user?.band_id || 'band-bakandeya';
    if (!(newFan as any).band_id) {
      (newFan as any).band_id = userBandId;
    }
    const state = loadState();
    if (!state.fans) state.fans = [];
    state.fans.unshift(newFan);
    saveState(state);

    await appendFanToSheet(newFan);
    res.json({ success: true, fan: newFan });
  } catch (err: any) {
    console.error("Error adding fan:", err);
    res.status(500).json({ error: err?.message || "Error al registrar fan." });
  }
});

// Delete Fan (Authenticated)
router.delete("/fans/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const state = loadState();
  if (state.fans) {
    state.fans = state.fans.filter((f: Fan) => f.id !== id);
    saveState(state);
  }
  await deleteFanInSheet(id);
  res.json({ success: true });
});

// Public Fan Capture Endpoint (No Auth required - QR Code Submission)
router.post("/public/fans", async (req, res) => {
  try {
    const { nombre, email, ciudad, comoConocio, conciertoOrigenId, conciertoOrigenNombre, consentimientoRGPD } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: "Por favor, introduce tu nombre y correo electrónico." });
    }

    if (!consentimientoRGPD) {
      return res.status(400).json({ error: "Es obligatorio aceptar la casilla de consentimiento de privacidad RGPD para registrarte." });
    }

    const state = loadState();
    if (!state.fans) state.fans = [];

    // Check if email already registered to avoid duplicates
    const existing = state.fans.find((f: Fan) => f.email.toLowerCase().trim() === String(email).toLowerCase().trim());
    if (existing) {
      return res.json({
        success: true,
        alreadyRegistered: true,
        message: "¡Ya estabas registrado en la comunidad de Bakandeya! Gracias por seguir apoyándonos.",
        incentivo: state.epkConfig?.incentivoFans || {}
      });
    }

    const newFan: Fan = {
      id: `fan-${Date.now()}`,
      nombre: String(nombre).trim(),
      email: String(email).toLowerCase().trim(),
      ciudad: ciudad ? String(ciudad).trim() : undefined,
      comoConocio: comoConocio ? String(comoConocio).trim() : undefined,
      conciertoOrigenId: conciertoOrigenId ? String(conciertoOrigenId).trim() : undefined,
      conciertoOrigenNombre: conciertoOrigenNombre ? String(conciertoOrigenNombre).trim() : undefined,
      fechaCaptura: new Date().toISOString().split("T")[0],
      consentimientoRGPD: true
    };

    state.fans.unshift(newFan);
    saveState(state);

    await appendFanToSheet(newFan);

    res.json({
      success: true,
      message: "¡Registro completado con éxito! Bienvenido/a a la familia Bakandeya.",
      incentivo: state.epkConfig?.incentivoFans || {
        mensajeAgradecimiento: "¡Muchas gracias por unirte!",
        codigoDescuento: "BAKANDEYA-FAN-10"
      }
    });
  } catch (err: any) {
    console.error("Error in public fan registration:", err);
    res.status(500).json({ error: "Error al procesar el registro de fan." });
  }
});

export default router;
