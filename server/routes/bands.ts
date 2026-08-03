import express from "express";
import { requireAuth } from "../state.js";
import { loadState, saveState } from "../state.js";
import { updateBandInSheet, fetchBandsFromSheet, deleteBandInSheet, appendBandToSheet } from "../sheets.js";

const router = express.Router();

router.get("/bands", requireAuth, async (req, res) => {
  const state = loadState();
  state.bands = await fetchBandsFromSheet(state.bands || []);
  saveState(state);
  res.json({ bands: state.bands });
});

router.post("/bands", requireAuth, async (req, res) => {
  const newBand = req.body;
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

export default router;
