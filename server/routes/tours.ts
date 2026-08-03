import express from "express";
import { requireAuth } from "../state.js";
import { loadState, saveState } from "../state.js";
import { updateTourInSheet, fetchToursFromSheet, deleteTourInSheet, appendTourToSheet } from "../sheets.js";

const router = express.Router();

router.get("/tours", requireAuth, async (req, res) => {
  const state = loadState();
  state.tours = await fetchToursFromSheet(state.tours || []);
  saveState(state);
  res.json({ tours: state.tours });
});

router.post("/tours", requireAuth, async (req, res) => {
  const newTour = req.body;
  const state = loadState();
  state.tours = state.tours || [];
  state.tours.push(newTour);
  saveState(state);
  await appendTourToSheet(newTour);
  res.json(newTour);
});

router.put("/tours/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updatedTour = req.body;
  const state = loadState();
  state.tours = state.tours || [];
  state.tours = state.tours.map((t: any) => t.id === id ? updatedTour : t);
  saveState(state);
  await updateTourInSheet(updatedTour);
  res.json(updatedTour);
});

router.delete("/tours/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const state = loadState();
  state.tours = state.tours || [];
  state.tours = state.tours.filter((t: any) => t.id !== id);
  saveState(state);
  await deleteTourInSheet(id);
  res.json({ success: true });
});

export default router;
