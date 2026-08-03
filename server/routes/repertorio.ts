import express from "express";
import { Song, Setlist } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import {
  appendSongToSheet,
  updateSongInSheet,
  deleteSongInSheet,
  appendSetlistToSheet,
  updateSetlistInSheet,
  deleteSetlistInSheet
} from "../sheets.js";

const router = express.Router();

// GET all songs
router.get("/songs", requireAuth, (req, res) => {
  try {
    const state = loadState();
    res.json({ success: true, songs: state.songs || [] });
  } catch (err: any) {
    console.error("Error fetching songs:", err);
    res.status(500).json({ error: "Error al obtener canciones." });
  }
});

// POST new song
router.post("/songs", requireAuth, (req, res) => {
  try {
    const newSong: Song = req.body;
    if (!newSong.titulo) {
      return res.status(400).json({ error: "El título del tema es obligatorio." });
    }
    const state = loadState();
    if (!state.songs) state.songs = [];
    
    // Check if ID exists or generate
    if (!newSong.id) {
      newSong.id = `song-${Date.now()}`;
    }
    
    state.songs.push(newSong);
    saveState(state);

    appendSongToSheet(newSong).catch(e => console.error("Error syncing new song to sheet:", e));

    res.json({ success: true, song: newSong });
  } catch (err: any) {
    console.error("Error creating song:", err);
    res.status(500).json({ error: "Error al guardar la canción." });
  }
});

// PUT update song
router.put("/songs/:id", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields: Partial<Song> = req.body;
    const state = loadState();
    if (!state.songs) state.songs = [];

    const index = state.songs.findIndex((s: Song) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Canción no encontrada." });
    }

    state.songs[index] = { ...state.songs[index], ...updatedFields };
    saveState(state);

    updateSongInSheet(state.songs[index]).catch(e => console.error("Error updating song in sheet:", e));

    res.json({ success: true, song: state.songs[index] });
  } catch (err: any) {
    console.error("Error updating song:", err);
    res.status(500).json({ error: "Error al actualizar la canción." });
  }
});

// DELETE song
router.delete("/songs/:id", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const state = loadState();
    if (!state.songs) state.songs = [];

    state.songs = state.songs.filter((s: Song) => s.id !== id);
    
    // Also clean up items in setlists referencing this song
    if (state.setlists) {
      state.setlists = state.setlists.map((sl: Setlist) => ({
        ...sl,
        items: sl.items.filter((item) => item.songId !== id)
      }));
    }

    saveState(state);

    deleteSongInSheet(id).catch(e => console.error("Error deleting song in sheet:", e));

    res.json({ success: true, id });
  } catch (err: any) {
    console.error("Error deleting song:", err);
    res.status(500).json({ error: "Error al eliminar la canción." });
  }
});

// GET all setlists
router.get("/setlists", requireAuth, (req, res) => {
  try {
    const state = loadState();
    res.json({ success: true, setlists: state.setlists || [] });
  } catch (err: any) {
    console.error("Error fetching setlists:", err);
    res.status(500).json({ error: "Error al obtener repertorios." });
  }
});

// POST new setlist
router.post("/setlists", requireAuth, (req, res) => {
  try {
    const newSetlist: Setlist = req.body;
    if (!newSetlist.nombre) {
      return res.status(400).json({ error: "El nombre del repertorio es obligatorio." });
    }
    const state = loadState();
    if (!state.setlists) state.setlists = [];

    if (!newSetlist.id) {
      newSetlist.id = `setlist-${Date.now()}`;
    }

    const today = new Date().toISOString().split('T')[0];
    newSetlist.fechaCreacion = newSetlist.fechaCreacion || today;
    newSetlist.fechaUltimaEdicion = today;

    state.setlists.push(newSetlist);
    saveState(state);

    appendSetlistToSheet(newSetlist).catch(e => console.error("Error syncing new setlist to sheet:", e));

    res.json({ success: true, setlist: newSetlist });
  } catch (err: any) {
    console.error("Error creating setlist:", err);
    res.status(500).json({ error: "Error al crear el repertorio." });
  }
});

// PUT update setlist
router.put("/setlists/:id", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields: Partial<Setlist> = req.body;
    const state = loadState();
    if (!state.setlists) state.setlists = [];

    const index = state.setlists.findIndex((s: Setlist) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Repertorio no encontrado." });
    }

    const today = new Date().toISOString().split('T')[0];
    state.setlists[index] = {
      ...state.setlists[index],
      ...updatedFields,
      fechaUltimaEdicion: today
    };

    saveState(state);

    updateSetlistInSheet(state.setlists[index]).catch(e => console.error("Error updating setlist in sheet:", e));

    res.json({ success: true, setlist: state.setlists[index] });
  } catch (err: any) {
    console.error("Error updating setlist:", err);
    res.status(500).json({ error: "Error al actualizar el repertorio." });
  }
});

// DELETE setlist
router.delete("/setlists/:id", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const state = loadState();
    if (!state.setlists) state.setlists = [];

    state.setlists = state.setlists.filter((s: Setlist) => s.id !== id);

    // If any concerts or rehearsals had this setlist assigned, clear it
    if (state.concerts) {
      state.concerts = state.concerts.map((c: any) => c.setlistId === id ? { ...c, setlistId: undefined } : c);
    }
    if (state.rehearsals) {
      state.rehearsals = state.rehearsals.map((r: any) => r.setlistId === id ? { ...r, setlistId: undefined } : r);
    }

    saveState(state);

    deleteSetlistInSheet(id).catch(e => console.error("Error deleting setlist in sheet:", e));

    res.json({ success: true, id });
  } catch (err: any) {
    console.error("Error deleting setlist:", err);
    res.status(500).json({ error: "Error al eliminar el repertorio." });
  }
});

export default router;
