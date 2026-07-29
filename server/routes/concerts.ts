import express from "express";
import { Rehearsal, Concert, Payment, Message } from "../../src/types.js";
import { loadState, saveState, requireAuth, requireLeader } from "../state.js";
import {
  getSheetsClient,
  updateRehearsalInSheet,
  appendRehearsalToSheet,
  updateConcertInSheet,
  appendConcertToSheet,
  syncLogisticsToSheet,
  appendPaymentToSheet,
  updatePaymentInSheet,
  ensureSheetTabExists,
  concertToRow,
  paymentToRow
} from "../sheets.js";

const router = express.Router();

// Update rehearsal
router.put("/rehearsals/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updated: Partial<Rehearsal> = req.body;
  const state = loadState();
  const idx = state.rehearsals.findIndex((r: Rehearsal) => r.id === id);
  if (idx !== -1) {
    state.rehearsals[idx] = { ...state.rehearsals[idx], ...updated };
    saveState(state);
    await updateRehearsalInSheet(state.rehearsals[idx]);
    res.json({ success: true, rehearsal: state.rehearsals[idx] });
  } else {
    res.status(404).json({ error: "Rehearsal not found" });
  }
});

// Create rehearsal
router.post("/rehearsals", requireAuth, async (req, res) => {
  const newRehearsal: Rehearsal = req.body;
  const state = loadState();
  state.rehearsals.push(newRehearsal);
  saveState(state);
  await appendRehearsalToSheet(newRehearsal);
  res.json({ success: true, rehearsal: newRehearsal });
});

// Update concert
router.put("/concerts/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updated: Partial<Concert> = req.body;
  const state = loadState();
  const idx = state.concerts.findIndex((c: Concert) => c.id === id);
  if (idx !== -1) {
    state.concerts[idx] = { ...state.concerts[idx], ...updated };
    saveState(state);
    await updateConcertInSheet(state.concerts[idx]);
    res.json({ success: true, concert: state.concerts[idx] });
  } else {
    res.status(404).json({ error: "Concert not found" });
  }
});

// Create concert
router.post("/concerts", requireAuth, async (req, res) => {
  const newConcert: Concert = req.body;
  const state = loadState();
  state.concerts.push(newConcert);
  saveState(state);
  await appendConcertToSheet(newConcert);
  res.json({ success: true, concert: newConcert });
});

// Sync all concerts with Google Sheet
router.post("/concerts/sync", requireAuth, async (req, res) => {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    return res.status(400).json({
      success: false,
      error: "Google Sheets o SPREADSHEET_ID no configurados en el servidor."
    });
  }
  
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "conciertos");
    const state = loadState();
    
    const headers = [
      "id", "fecha", "ciudad", "sala", "cache", "aforo_vendido", 
      "aforo_total", "contrato_firmado", "estado_pago", "notas", "tipo"
    ];
    const values = [headers, ...state.concerts.map(concertToRow)];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "conciertos!A1",
      valueInputOption: "RAW",
      requestBody: { values },
    });

    await syncLogisticsToSheet(state.runOfShow, state.gearChecklists);
    
    console.log(`Successfully synced ${state.concerts.length} concerts and logistics to Google Sheet`);
    res.json({
      success: true,
      message: `¡Se han sincronizado correctamente los conciertos, horarios y checklist de equipo en Google Sheets!`,
      concerts: state.concerts
    });
  } catch (error: any) {
    console.error("Error in /api/concerts/sync:", error);
    res.status(500).json({
      success: false,
      error: `Error al escribir en Google Sheets: ${error.message || error}`
    });
  }
});

// Get logistics
router.get("/logistics", (req, res) => {
  const state = loadState();
  res.json({
    runOfShow: state.runOfShow || {},
    gearChecklists: state.gearChecklists || {}
  });
});

// Update/set run of show for a date
router.post("/logistics/runofshow", requireAuth, async (req, res) => {
  const { dateKey, items } = req.body;
  if (!dateKey || !Array.isArray(items)) {
    return res.status(400).json({ error: "dateKey and items array required" });
  }
  const state = loadState();
  if (!state.runOfShow) state.runOfShow = {};
  state.runOfShow[dateKey] = items;
  saveState(state);
  await syncLogisticsToSheet(state.runOfShow, state.gearChecklists);
  res.json({ success: true, dateKey, items });
});

// Update/set gear checklist for a date
router.post("/logistics/gear", requireAuth, async (req, res) => {
  const { dateKey, items } = req.body;
  if (!dateKey || !Array.isArray(items)) {
    return res.status(400).json({ error: "dateKey and items array required" });
  }
  const state = loadState();
  if (!state.gearChecklists) state.gearChecklists = {};
  state.gearChecklists[dateKey] = items;
  saveState(state);
  await syncLogisticsToSheet(state.runOfShow, state.gearChecklists);
  res.json({ success: true, dateKey, items });
});

// Get payments (Admin only)
router.get("/payments", requireAuth, requireLeader, (req, res) => {
  const state = loadState();
  res.json(state.payments || []);
});

// Create payment (Admin only)
router.post("/payments", requireAuth, requireLeader, async (req, res) => {
  const newPayment: Payment = req.body;
  const state = loadState();
  state.payments.push(newPayment);
  saveState(state);
  
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (sheets && spreadsheetId) {
    await appendPaymentToSheet(newPayment);
  }
  
  res.json({ success: true, payment: newPayment });
});

// Update payment status (Admin only)
router.put("/payments/:id", requireAuth, requireLeader, async (req, res) => {
  const { id } = req.params;
  const updated: Partial<Payment> = req.body;
  const state = loadState();
  const idx = state.payments.findIndex((p: Payment) => p.id === id);
  if (idx !== -1) {
    state.payments[idx] = { ...state.payments[idx], ...updated };
    saveState(state);
    
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (sheets && spreadsheetId) {
      await updatePaymentInSheet(state.payments[idx]);
    }
    
    res.json({ success: true, payment: state.payments[idx] });
  } else {
    res.status(404).json({ error: "Payment not found" });
  }
});

// Sync all payments/finances with Google Sheet (Admin only)
router.post("/payments/sync", requireAuth, requireLeader, async (req, res) => {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    return res.status(400).json({
      success: false,
      error: "Google Sheets o SPREADSHEET_ID no configurados en el servidor."
    });
  }
  
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "finanzas");
    const state = loadState();
    
    const headers = ["id", "tipo", "categoria", "concepto", "importe", "fecha", "estado"];
    const values = [headers, ...state.payments.map(paymentToRow)];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "finanzas!A1",
      valueInputOption: "RAW",
      requestBody: { values },
    });
    
    console.log(`Successfully synced ${state.payments.length} payments to Google Sheet 'finanzas'`);
    res.json({
      success: true,
      message: `¡Se han sincronizado correctamente ${state.payments.length} transacciones de finanzas en Google Sheets!`,
      payments: state.payments
    });
  } catch (error: any) {
    console.error("Error in /api/payments/sync:", error);
    res.status(500).json({
      success: false,
      error: `Error al escribir en Google Sheets: ${error.message || error}`
    });
  }
});

// Create logistics message
router.post("/messages", requireAuth, (req, res) => {
  const newMessage: Message = req.body;
  const state = loadState();
  state.messages.push(newMessage);
  saveState(state);
  res.json({ success: true, message: newMessage });
});

export default router;
