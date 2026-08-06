import express from "express";
import { Song, Setlist } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";
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

// POST generate AI chord sheet and substitute guide
router.post("/generate-song-chords", requireAuth, async (req, res) => {
  try {
    const { songId, titulo, tonalidad, bpm, afinacion, notasInternas, esVersionCovers, artista } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: "El título de la canción es requerido." });
    }

    const aiClient = getAiClient();
    if (!aiClient) {
      return res.status(500).json({ error: "Gemini API key no configurada." });
    }

    const prompt = `Eres un músico profesional y arreglista. Genera el cifrado de acordes con letra completo al estilo LaCuerda.net / Ultimate Guitar para la siguiente canción:
Título: "${titulo}"
${artista ? `Artista/Banda: "${artista}"` : ''}
${tonalidad ? `Tonalidad Base: "${tonalidad}"` : ''}
${bpm ? `Tempo (BPM): ${bpm}` : ''}
${afinacion ? `Afinación: "${afinacion}"` : ''}
${notasInternas ? `Notas internas del grupo: "${notasInternas}"` : ''}
${esVersionCovers ? `Tipo: Versión / Cover` : `Tipo: Canción Original`}

Requisitos del formato cifradoTexto:
1. Pon los acordes en la línea inmediatamente superior a las sílabas donde cambian, usando espacios, O bien utiliza la notación inline [Acorde] justo delante de las palabras/sílabas clave. Prefiere poner nombres de acordes estándar (ej. Do, Re, Mim, Sol, Lam, Fa#m o C, D, Em, G, Am, F#m).
2. Incluye secciones claras: [Intro], [Verso 1], [Estribillo], [Verso 2], [Puente], [Solo], [Outro].
3. Si la canción es un tema conocido (cover), usa sus acordes reales. Si es un tema original, inventa una progresión melódica y armónica profesional, emotiva y muy coherente en la tonalidad indicada (${tonalidad || 'Mim'}).

Además, genera una Ficha de Sustitución Urgente (guiaSustituto) pensada para un músico nuevo o un sustituto de última hora que tiene que tocar el tema sin haberlo ensayado antes.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "cifradoTexto": "texto completo del cifrado con letra y acordes...",
  "guiaSustituto": {
    "estructura": "Intro (4T) -> Verso 1 -> Estribillo -> Verso 2 -> Estribillo -> Solo -> Outro",
    "progresionClave": "Verso: Mim - Do | Estribillo: Sol - Re - Mim - Do",
    "cortesYClaves": "Atención al corte seco en el compás 8 del puente. Bajar dinámica en el verso 2.",
    "capoTraste": "Sin Capo (o Capo 2º traste si aplica)",
    "instrumentosClave": "Batería entra en compás 5, teclado hace pad arpegiado en estribillo"
  }
}`;

    const aiRes = await generateContentWithFallback(aiClient, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = aiRes?.text || aiRes?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = safeParseJson(responseText);

    if (!parsed || !parsed.cifradoTexto) {
      return res.status(500).json({ error: "No se pudo interpretar la respuesta de la IA." });
    }

    // Optionally persist if songId provided
    if (songId) {
      const state = loadState();
      if (state.songs) {
        const songIndex = state.songs.findIndex((s: Song) => s.id === songId);
        if (songIndex !== -1) {
          state.songs[songIndex].cifradoTexto = parsed.cifradoTexto;
          state.songs[songIndex].guiaSustituto = parsed.guiaSustituto;
          saveState(state);
          updateSongInSheet(state.songs[songIndex]).catch(e => console.error(e));
        }
      }
    }

    res.json({
      success: true,
      cifradoTexto: parsed.cifradoTexto,
      guiaSustituto: parsed.guiaSustituto
    });
  } catch (err: any) {
    console.error("Error generating song chords with AI:", err);
    res.status(500).json({ error: "Error al generar los acordes con IA." });
  }
});

export default router;
