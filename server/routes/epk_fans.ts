import express from "express";
import { loadState, saveState, requireAuth, getEpkConfigForBand, getAutonomyConfigForBand, BAKANDEYA_BAND_ID } from "../state.js";
import { EPKConfig, Fan } from "../../src/types.js";
import { appendFanToSheet, deleteFanInSheet } from "../sheets.js";
import { googleSheetsService } from "../services/googleSheets.service.js";

const router = express.Router();

// Get Autonomy Config
router.get("/autonomy", async (req, res) => {
  const state = loadState();
  const user = (req as any).user;
  const userBandId = user?.band_id || BAKANDEYA_BAND_ID;
  
  try {
    const sheetAutonomies = await googleSheetsService.fetchAutonomyConfigs(state.autonomyConfigsByBand || {});
    state.autonomyConfigsByBand = { ...state.autonomyConfigsByBand, ...sheetAutonomies };
  } catch (e) {
    // Keep local state fallback
  }

  const autonomy = getAutonomyConfigForBand(state, userBandId);
  res.json(autonomy);
});

// Update Autonomy Config
router.post("/autonomy", requireAuth, async (req, res) => {
  try {
    const updatedConfig = req.body;
    const state = loadState();
    const user = (req as any).user;
    const userBandId = user?.band_id || BAKANDEYA_BAND_ID;
    const cleanUserBandId = userBandId.replace(/^(band|reg)-/, '');
    const current = getAutonomyConfigForBand(state, userBandId);
    
    const newAutonomyConfig = { ...current, ...updatedConfig };
    
    const possibleKeys = [userBandId, cleanUserBandId, `band-${cleanUserBandId}`, `reg-${cleanUserBandId}`];
    if (!state.autonomyConfigsByBand) state.autonomyConfigsByBand = {};
    possibleKeys.forEach(k => {
      state.autonomyConfigsByBand[k] = newAutonomyConfig;
    });

    saveState(state);

    googleSheetsService.updateAutonomy(cleanUserBandId, newAutonomyConfig).catch(err => {
      console.warn("Notice syncing autonomy config to Google Sheets:", err?.message || err);
    });

    res.json({ success: true, autonomyConfig: newAutonomyConfig });
  } catch (err: any) {
    console.error("Error updating autonomy config:", err);
    res.status(500).json({ error: err?.message || "Error al actualizar la configuración de autonomía." });
  }
});

router.put("/autonomy", requireAuth, async (req, res) => {
  try {
    const updatedConfig = req.body;
    const state = loadState();
    const user = (req as any).user;
    const userBandId = user?.band_id || BAKANDEYA_BAND_ID;
    const cleanUserBandId = userBandId.replace(/^(band|reg)-/, '');
    const current = getAutonomyConfigForBand(state, userBandId);
    
    const newAutonomyConfig = { ...current, ...updatedConfig };
    
    const possibleKeys = [userBandId, cleanUserBandId, `band-${cleanUserBandId}`, `reg-${cleanUserBandId}`];
    if (!state.autonomyConfigsByBand) state.autonomyConfigsByBand = {};
    possibleKeys.forEach(k => {
      state.autonomyConfigsByBand[k] = newAutonomyConfig;
    });

    saveState(state);

    googleSheetsService.updateAutonomy(cleanUserBandId, newAutonomyConfig).catch(err => {
      console.warn("Notice syncing autonomy config to Google Sheets:", err?.message || err);
    });

    res.json({ success: true, autonomyConfig: newAutonomyConfig });
  } catch (err: any) {
    console.error("Error updating autonomy config:", err);
    res.status(500).json({ error: err?.message || "Error al actualizar la configuración de autonomía." });
  }
});

// Get EPK Config (Authenticated)
router.get("/epk", async (req, res) => {
  const state = loadState();
  const user = (req as any).user;
  const userBandId = (req.query.bandId as string) || (req.headers['x-band-id'] as string) || user?.band_id || BAKANDEYA_BAND_ID;
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
    const userBandId = (req.body as any).bandId || (req.headers['x-band-id'] as string) || user?.band_id || BAKANDEYA_BAND_ID;
    const cleanUserBandId = userBandId.replace(/^(band|reg)-/, '');
    const userBandName = user?.bandName || user?.name || 'Tu Banda';
    const current = getEpkConfigForBand(state, userBandId, userBandName, user?.email);
    
    const newEpkConfig = { ...current, ...updatedConfig };
    
    // Assign across all key variations
    const possibleKeys = [userBandId, cleanUserBandId, `band-${cleanUserBandId}`, `reg-${cleanUserBandId}`];
    possibleKeys.forEach(k => {
      state.epkConfigsByBand[k] = newEpkConfig;
    });

    if (cleanUserBandId === 'bakandeya') {
      state.epkConfig = newEpkConfig;
    }

    if (updatedConfig.logoUrl) {
      if (state.registeredBands && Array.isArray(state.registeredBands)) {
        state.registeredBands.forEach((b: any) => {
          const bClean = (b.band_id || b.id || '').replace(/^(band|reg)-/, '');
          if (bClean === cleanUserBandId || b.band_id === userBandId || b.id === userBandId) {
            b.logo_url = updatedConfig.logoUrl;
            b.imagen_url = updatedConfig.logoUrl;
          }
        });
      }
    }

    saveState(state);

    // Sync to Google Sheets tab 'dossier_epk'
    googleSheetsService.updateEpk(cleanUserBandId, newEpkConfig).catch(err => {
      console.warn("Notice syncing EPK config to Google Sheets:", err?.message || err);
    });

    res.json({ success: true, epkConfig: newEpkConfig });
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
  const matchBand = (f: any) => {
    if (!f) return false;
    const bid = f.band_id || f.bandId;
    if (bid) return bid === userBandId;
    return userBandId === 'band-bakandeya' || userBandId === 'reg-bakandeya';
  };

  const allFans = state.fans || [];
  const filtered = allFans.filter(matchBand);

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
    const { nombre, email, ciudad, comoConocio, conciertoOrigenId, conciertoOrigenNombre, consentimientoRGPD, band_id } = req.body;
    const targetBandId = (req.query.band_id as string) || (req.query.band as string) || band_id || BAKANDEYA_BAND_ID;

    if (!nombre || !email) {
      return res.status(400).json({ error: "Por favor, introduce tu nombre y correo electrónico." });
    }

    if (!consentimientoRGPD) {
      return res.status(400).json({ error: "Es obligatorio aceptar la casilla de consentimiento de privacidad RGPD para registrarte." });
    }

    const state = loadState();
    if (!state.fans) state.fans = [];

    // Check if email already registered for this band to avoid duplicates
    const existing = state.fans.find((f: Fan) =>
      f.email.toLowerCase().trim() === String(email).toLowerCase().trim() &&
      ((f as any).band_id === targetBandId || (!(f as any).band_id && targetBandId === BAKANDEYA_BAND_ID))
    );
    if (existing) {
      const epkConf = getEpkConfigForBand(state, targetBandId);
      return res.json({
        success: true,
        alreadyRegistered: true,
        message: "¡Ya estabas registrado en la comunidad! Gracias por seguir apoyándonos.",
        incentivo: epkConf?.incentivoFans || {}
      });
    }

    const newFan: Fan & { band_id?: string } = {
      id: `fan-${Date.now()}`,
      band_id: targetBandId,
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
