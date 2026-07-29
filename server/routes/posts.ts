import express from "express";
import { SocialPost } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { getSheetsClient, updatePostInSheet, appendPostToSheet, ensureSheetTabExists, socialPostToRow } from "../sheets.js";

const router = express.Router();

// Update social post
router.put("/posts/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updated: Partial<SocialPost> = req.body;
  const state = loadState();
  const idx = state.posts.findIndex((p: SocialPost) => p.id === id);
  if (idx !== -1) {
    state.posts[idx] = { ...state.posts[idx], ...updated };
    saveState(state);
    
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (sheets && spreadsheetId) {
      await updatePostInSheet(state.posts[idx]);
    }
    
    res.json({ success: true, post: state.posts[idx] });
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// Create social post
router.post("/posts", requireAuth, async (req, res) => {
  const newPost: SocialPost = req.body;
  const state = loadState();
  state.posts.push(newPost);
  saveState(state);
  
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (sheets && spreadsheetId) {
    await appendPostToSheet(newPost);
  }
  
  res.json({ success: true, post: newPost });
});

// Sync all social posts with Google Sheet
router.post("/posts/sync", requireAuth, async (req, res) => {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    return res.status(400).json({
      success: false,
      error: "Google Sheets o SPREADSHEET_ID no configurados en el servidor."
    });
  }
  
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "redes_sociales");
    const state = loadState();
    
    const headers = ["id", "fecha", "plataforma", "contenido", "estado", "responsable"];
    const values = [headers, ...state.posts.map(socialPostToRow)];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "redes_sociales!A1",
      valueInputOption: "RAW",
      requestBody: { values },
    });
    
    console.log(`Successfully synced ${state.posts.length} posts to Google Sheet 'redes_sociales'`);
    res.json({
      success: true,
      message: `¡Se han sincronizado correctamente ${state.posts.length} publicaciones de redes sociales en Google Sheets!`,
      posts: state.posts
    });
  } catch (error: any) {
    console.error("Error in /api/posts/sync:", error);
    res.status(500).json({
      success: false,
      error: `Error al escribir en Google Sheets: ${error.message || error}`
    });
  }
});

export default router;
