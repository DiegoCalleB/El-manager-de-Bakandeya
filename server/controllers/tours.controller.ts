import { Request, Response } from "express";
import { loadState, saveState } from "../state.js";
import { googleSheetsService } from "../services/googleSheets.service.js";
import { Tour } from "../../src/types.js";

export const toursController = {
  async getTours(req: Request, res: Response) {
    try {
      const state = loadState();
      state.tours = await googleSheetsService.fetchTours(state.tours || []);
      saveState(state);

      const userBandId = (req as any).user?.band_id || 'band-bakandeya';
      const isBakandeyaOrAdmin = userBandId === 'band-bakandeya' || userBandId === 'reg-bakandeya' || (req as any).user?.role === 'admin';

      const allTours = state.tours || [];
      const filtered = isBakandeyaOrAdmin
        ? allTours
        : allTours.filter((t: Tour) => (t as any).band_id === userBandId || (t as any).bandId === userBandId || !(t as any).band_id);

      res.json({ tours: filtered });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener giras" });
    }
  },

  async createTour(req: Request, res: Response) {
    try {
      const newTour: Tour = req.body;
      const userBandId = (req as any).user?.band_id || 'band-bakandeya';
      if (!(newTour as any).band_id) {
        (newTour as any).band_id = userBandId;
      }
      const state = loadState();
      state.tours = state.tours || [];
      state.tours.push(newTour);
      saveState(state);
      await googleSheetsService.appendTour(newTour);
      res.json(newTour);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al crear la gira" });
    }
  },

  async updateTour(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedTour: Tour = req.body;
      const state = loadState();
      state.tours = state.tours || [];
      state.tours = state.tours.map((t: Tour) => t.id === id ? updatedTour : t);
      saveState(state);
      await googleSheetsService.updateTour(updatedTour);
      res.json(updatedTour);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al actualizar la gira" });
    }
  },

  async deleteTour(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const state = loadState();
      state.tours = state.tours || [];
      state.tours = state.tours.filter((t: Tour) => t.id !== id);
      saveState(state);
      await googleSheetsService.deleteTour(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al eliminar la gira" });
    }
  }
};
