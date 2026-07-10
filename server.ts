import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import { INITIAL_LEADS, INITIAL_REHEARSALS, INITIAL_CONCERTS, INITIAL_SOCIAL_POSTS, INITIAL_PAYMENTS, INITIAL_MESSAGES } from "./src/db_seed";
import { Lead, Rehearsal, Concert, SocialPost, Payment, Message } from "./src/types";

// Setup dotenv
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "data.json");

// Helper to load state
function loadState() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Error reading data.json, falling back to seed data", e);
    }
  }
  
  // Default state if file doesn't exist or is corrupted
  const defaultState = {
    leads: INITIAL_LEADS,
    rehearsals: INITIAL_REHEARSALS,
    concerts: INITIAL_CONCERTS,
    posts: INITIAL_SOCIAL_POSTS,
    payments: INITIAL_PAYMENTS,
    messages: INITIAL_MESSAGES
  };
  saveState(defaultState);
  return defaultState;
}

// Helper to save state
function saveState(state: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving data.json", e);
  }
}

// GOOGLE SHEETS INTEGRATION HELPERS

// Get Google Sheets API client using service account credentials from environment
function getSheetsClient() {
  let email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) {
    return null;
  }
  
  try {
    let formattedKey = privateKey.trim();
    
    // Check if the private key is actually a full Service Account JSON
    if (formattedKey.startsWith("{") && formattedKey.endsWith("}")) {
      try {
        const parsed = JSON.parse(formattedKey);
        if (parsed.private_key) {
          formattedKey = parsed.private_key;
        }
        if (parsed.client_email && !email) {
          email = parsed.client_email;
        }
      } catch (e) {
        console.warn("Attempted to parse private key as JSON but failed:", e);
      }
    }
    
    // Remove surrounding quotes if they were added in the environment configuration
    if ((formattedKey.startsWith('"') && formattedKey.endsWith('"')) || 
        (formattedKey.startsWith("'") && formattedKey.endsWith("'"))) {
      formattedKey = formattedKey.substring(1, formattedKey.length - 1);
    }
    
    // Handle leading corrupted character (often "n" if "\n" was stripped of backslash during env injection)
    if (formattedKey.startsWith("nMII")) {
      formattedKey = formattedKey.substring(1);
    }
    
    // Replace literal escaped newlines with actual newlines to locate and strip headers
    let tempKey = formattedKey.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n").replace(/\r/g, "").trim();
    
    // Strip headers and extract only clean Base64 characters
    const lines = tempKey.split("\n").filter(l => !l.includes("-----"));
    const cleanB64 = lines.join("").replace(/[^A-Za-z0-9+/=]/g, "");
    let derBuffer = Buffer.from(cleanB64, "base64");
    
    // Check ASN.1 sequence boundary to truncate any trailing environment variable data leaks (such as SPREADSHEET_ID)
    if (derBuffer.length > 0 && derBuffer[0] === 0x30) {
      let len = derBuffer[1];
      let headerSize = 2;
      if (len & 0x80) {
        const bytesCount = len & 0x7f;
        len = 0;
        for (let i = 0; i < bytesCount; i++) {
          len = (len << 8) | derBuffer[2 + i];
        }
        headerSize = 2 + bytesCount;
      }
      const totalSize = headerSize + len;
      if (totalSize > 0 && totalSize < derBuffer.length) {
        derBuffer = derBuffer.subarray(0, totalSize);
      }
    }
    
    // Load as DER and natively export to standard RFC-compliant PEM
    const keyObject = crypto.createPrivateKey({
      key: derBuffer,
      format: "der",
      type: "pkcs8"
    });
    
    const nativePem = keyObject.export({
      type: "pkcs8",
      format: "pem"
    }) as string;
    
    if (!email) {
      console.error("Google Service Account Email is missing.");
      return null;
    }
    
    const auth = new google.auth.JWT({
      email: email,
      key: nativePem,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  } catch (error) {
    console.error("Error creating Google Sheets auth client with native PEM key conversion:", error);
    return null;
  }
}

// Map Google Sheet Row to Lead
function rowToLead(row: any[]): Lead {
  return {
    id: String(row[0] || ""),
    nombre_sala: String(row[1] || ""),
    ciudad: String(row[2] || ""),
    region: String(row[3] || ""),
    aforo: Number(row[4]) || 0,
    genero: String(row[5] || ""),
    email_contacto: String(row[6] || ""),
    fuente: String(row[7] || ""),
    estado: (row[8] || "nuevo") as any,
    pitch_generado: String(row[9] || ""),
    fecha_envio: row[10] ? String(row[10]) : undefined,
    fecha_ultima_respuesta: row[11] ? String(row[11]) : undefined,
    notas: String(row[12] || ""),
    telefono: String(row[13] || ""),
    instagram: String(row[14] || ""),
  };
}

// Map Lead to Google Sheet Row
function leadToRow(lead: Lead): any[] {
  return [
    lead.id || "",
    lead.nombre_sala || "",
    lead.ciudad || "",
    lead.region || "",
    lead.aforo || 0,
    lead.genero || "",
    lead.email_contacto || "",
    lead.fuente || "",
    lead.estado || "nuevo",
    lead.pitch_generado || "",
    lead.fecha_envio || "",
    lead.fecha_ultima_respuesta || "",
    lead.notas || "",
    lead.telefono || "",
    lead.instagram || "",
  ];
}

// Pull leads from Google Sheet if configured, else return local state leads
async function fetchLeadsFromSheet(localLeads: Lead[]): Promise<Lead[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    console.log("Google Sheets credentials not set. Operating in local sandbox mode.");
    return localLeads;
  }
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "leads!A2:O",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("Sheet is empty. Bootstrapping with headers and default leads...");
      await bootstrapSheet(sheets, spreadsheetId, localLeads);
      return localLeads;
    }
    return rows.map(rowToLead);
  } catch (error: any) {
    console.error("Error fetching leads from Google Sheet, falling back to local:", error.message || error);
    return localLeads;
  }
}

// Bootstrap Google Sheet with headers and seed leads
async function bootstrapSheet(sheets: any, spreadsheetId: string, leads: Lead[]) {
  try {
    const headers = [
      "id", "nombre_sala", "ciudad", "region", "aforo", "genero", 
      "email_contacto", "fuente", "estado", "pitch_generado", 
      "fecha_envio", "fecha_ultima_respuesta", "notas", "telefono", "instagram"
    ];
    const values = [headers, ...leads.map(leadToRow)];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "leads!A1",
      valueInputOption: "RAW",
      requestBody: { values },
    });
    console.log("Successfully bootstrapped Google Sheet with headers and seed data.");
  } catch (error) {
    console.error("Error bootstrapping Google Sheet:", error);
  }
}

// Push a single updated lead to Google Sheet
async function updateLeadInSheet(lead: Lead) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    return;
  }
  
  try {
    // Find the row index of the lead by fetching the IDs column (A)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "leads!A:A",
    });
    const rows = response.data.values;
    if (rows) {
      const rowIndex = rows.findIndex(row => row[0] === lead.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `leads!A${sheetRowNumber}:O${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [leadToRow(lead)]
          }
        });
        console.log(`Successfully updated Lead ${lead.id} at sheet row ${sheetRowNumber}`);
        return;
      }
    }
    // If not found, append it
    await appendLeadToSheet(lead);
  } catch (error) {
    console.error(`Error updating Lead ${lead.id} in Google Sheet:`, error);
  }
}

// Append a new lead to Google Sheet
async function appendLeadToSheet(lead: Lead) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    return;
  }
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "leads!A:O",
      valueInputOption: "RAW",
      requestBody: {
        values: [leadToRow(lead)]
      }
    });
    console.log(`Successfully appended Lead ${lead.id} to Google Sheet`);
  } catch (error) {
    console.error(`Error appending Lead ${lead.id} to Google Sheet:`, error);
  }
}

// Verify lead status in Sheet before writing, avoiding race conditions
async function verifyLeadStatusAndWrite(
  id: string, 
  expectedStatus: string | undefined, 
  updatedFields: Partial<Lead>
): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  const state = loadState();
  const idx = state.leads.findIndex((l: Lead) => l.id === id);
  if (idx === -1) {
    return { success: false, error: "Lead no encontrado localmente." };
  }
  
  const currentLead = state.leads[idx];
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  
  if (sheets && spreadsheetId) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "leads!A:I", // Fetch up to column I (estado)
      });
      const rows = response.data.values;
      if (rows) {
        const rowIndex = rows.findIndex(row => row[0] === id);
        if (rowIndex !== -1) {
          const sheetEstado = rows[rowIndex][8] || "nuevo";
          
          if (expectedStatus && sheetEstado !== expectedStatus) {
            console.warn(`Race condition avoided: Lead ${id} is in state '${sheetEstado}', but expected '${expectedStatus}'`);
            
            // Sync current state from Google Sheet to avoid stale local cache
            const fullRowResponse = await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `leads!A${rowIndex + 1}:O${rowIndex + 1}`,
            });
            if (fullRowResponse.data.values && fullRowResponse.data.values[0]) {
              state.leads[idx] = rowToLead(fullRowResponse.data.values[0]);
              saveState(state);
            }
            
            return { 
              success: false, 
              error: `El estado de la sala en Google Sheets ha cambiado a '${sheetEstado}' en paralelo por otro usuario o cron job. Se han sincronizado los datos locales. Por favor, cancela y recarga.`,
              lead: state.leads[idx]
            };
          }
        }
      }
    } catch (error) {
      console.error("Error verifying lead status in Google Sheet, continuing with local persistence:", error);
    }
  }
  
  // Apply changes to local cache and save
  state.leads[idx] = { ...currentLead, ...updatedFields };
  saveState(state);
  
  // Save to Google Sheet
  if (sheets && spreadsheetId) {
    await updateLeadInSheet(state.leads[idx]);
  }
  
  return { success: true, lead: state.leads[idx] };
}

// REST endpoints for the state
app.get("/api/state", async (req, res) => {
  const state = loadState();
  state.leads = await fetchLeadsFromSheet(state.leads);
  saveState(state);
  res.json(state);
});

// Update a single lead
app.put("/api/leads/:id", async (req, res) => {
  const { id } = req.params;
  const { expectedStatus, ...updatedFields } = req.body;
  
  const result = await verifyLeadStatusAndWrite(id, expectedStatus, updatedFields);
  if (result.success) {
    res.json({ success: true, lead: result.lead });
  } else {
    res.status(409).json({ error: result.error, lead: result.lead });
  }
});

// Create a lead
app.post("/api/leads", async (req, res) => {
  const newLead: Lead = req.body;
  const state = loadState();
  state.leads.push(newLead);
  saveState(state);
  
  await appendLeadToSheet(newLead);
  res.json({ success: true, lead: newLead });
});

// Update rehearsal
app.put("/api/rehearsals/:id", (req, res) => {
  const { id } = req.params;
  const updated: Partial<Rehearsal> = req.body;
  const state = loadState();
  const idx = state.rehearsals.findIndex((r: Rehearsal) => r.id === id);
  if (idx !== -1) {
    state.rehearsals[idx] = { ...state.rehearsals[idx], ...updated };
    saveState(state);
    res.json({ success: true, rehearsal: state.rehearsals[idx] });
  } else {
    res.status(404).json({ error: "Rehearsal not found" });
  }
});

// Create rehearsal
app.post("/api/rehearsals", (req, res) => {
  const newRehearsal: Rehearsal = req.body;
  const state = loadState();
  state.rehearsals.push(newRehearsal);
  saveState(state);
  res.json({ success: true, rehearsal: newRehearsal });
});

// Update concert
app.put("/api/concerts/:id", (req, res) => {
  const { id } = req.params;
  const updated: Partial<Concert> = req.body;
  const state = loadState();
  const idx = state.concerts.findIndex((c: Concert) => c.id === id);
  if (idx !== -1) {
    state.concerts[idx] = { ...state.concerts[idx], ...updated };
    saveState(state);
    res.json({ success: true, concert: state.concerts[idx] });
  } else {
    res.status(404).json({ error: "Concert not found" });
  }
});

// Create concert
app.post("/api/concerts", (req, res) => {
  const newConcert: Concert = req.body;
  const state = loadState();
  state.concerts.push(newConcert);
  saveState(state);
  res.json({ success: true, concert: newConcert });
});

// Update social post
app.put("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const updated: Partial<SocialPost> = req.body;
  const state = loadState();
  const idx = state.posts.findIndex((p: SocialPost) => p.id === id);
  if (idx !== -1) {
    state.posts[idx] = { ...state.posts[idx], ...updated };
    saveState(state);
    res.json({ success: true, post: state.posts[idx] });
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// Create social post
app.post("/api/posts", (req, res) => {
  const newPost: SocialPost = req.body;
  const state = loadState();
  state.posts.push(newPost);
  saveState(state);
  res.json({ success: true, post: newPost });
});

// Create payment
app.post("/api/payments", (req, res) => {
  const newPayment: Payment = req.body;
  const state = loadState();
  state.payments.push(newPayment);
  saveState(state);
  res.json({ success: true, payment: newPayment });
});

// Update payment status
app.put("/api/payments/:id", (req, res) => {
  const { id } = req.params;
  const updated: Partial<Payment> = req.body;
  const state = loadState();
  const idx = state.payments.findIndex((p: Payment) => p.id === id);
  if (idx !== -1) {
    state.payments[idx] = { ...state.payments[idx], ...updated };
    saveState(state);
    res.json({ success: true, payment: state.payments[idx] });
  } else {
    res.status(444).json({ error: "Payment not found" });
  }
});

// Create logistics message
app.post("/api/messages", (req, res) => {
  const newMessage: Message = req.body;
  const state = loadState();
  state.messages.push(newMessage);
  saveState(state);
  res.json({ success: true, message: newMessage });
});

// Reset database to initial seeds
app.post("/api/reset", (req, res) => {
  const defaultState = {
    leads: INITIAL_LEADS,
    rehearsals: INITIAL_REHEARSALS,
    concerts: INITIAL_CONCERTS,
    posts: INITIAL_SOCIAL_POSTS,
    payments: INITIAL_PAYMENTS,
    messages: INITIAL_MESSAGES
  };
  saveState(defaultState);
  res.json({ success: true, state: defaultState });
});

// Chatbot Assistant using Gemini API
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({ apiKey });
    } else {
      console.warn("GEMINI_API_KEY environment variable is not configured correctly. Using fallback simulator.");
    }
  }
  return aiClient;
}

app.post("/api/chat", async (req, res) => {
  const { message, chatHistory } = req.body;
  const state = loadState();
  
  const client = getAiClient();
  
  if (!client) {
    // Elegant fallback simulation if no Gemini API Key is configured
    setTimeout(() => {
      const lower = message.toLowerCase();
      let reply = "¡Hola! Estoy funcionando en modo simulación (sin clave GEMINI_API_KEY). Puedo responderte de manera estática.\n\n";
      let proposedActions: any[] = [];
      
      if (lower.includes("madrid") || lower.includes("pendiente")) {
        const pendingMadrid = state.leads.filter((l: Lead) => l.ciudad.toLowerCase().includes("madrid") || l.estado === "pendiente_aprobacion");
        reply += `He analizado la base de datos y tienes **${pendingMadrid.length} salas** que coinciden. Por ejemplo, **Sala Apolo** en Barcelona (pendiente de aprobación) y **Sala El Tren** en Granada (pendiente de aprobación). En Madrid tienes a **Ochoymedio Club** como "nuevo".`;
        if (state.leads.some((l: Lead) => l.id === "lead-1" && l.estado === "pendiente_aprobacion")) {
          proposedActions.push({
            type: "propose_lead_approval",
            leadId: "lead-1",
            leadName: "Sala Apolo",
            description: "Aprobar el pitch generado para la mítica Sala Apolo de Barcelona."
          });
        }
      } else if (lower.includes("resumen") || lower.includes("estado") || lower.includes("hoy") || lower.includes("tareas")) {
        const pendingApp = state.leads.filter((l: Lead) => l.estado === "pendiente_aprobacion").length;
        const newLeads = state.leads.filter((l: Lead) => l.estado === "nuevo").length;
        const interesting = state.leads.filter((l: Lead) => l.estado === "interesado").length;
        reply += `Aquí tienes el resumen de tu bandeja para hoy:\n- Tienes **${pendingApp} pitches pendientes** de revisión en el panel de aprobación.\n- Hay **${newLeads} salas nuevas** recién descubiertas por el agente Scout.\n- Tienes **${interesting} respuestas con interés** pendientes de clasificar o responder.\n\nTe sugiero revisar el pitch de **Sala Apolo** o **Sala El Tren** para que el agente Enviador lo mande esta tarde.`;
        if (state.leads.some((l: Lead) => l.id === "lead-3" && l.estado === "pendiente_aprobacion")) {
          proposedActions.push({
            type: "propose_lead_approval",
            leadId: "lead-3",
            leadName: "Sala El Tren",
            description: "Aprobar el pitch preparado para Sala El Tren en Granada."
          });
        }
      } else if (lower.includes("reggae") || lower.includes("ska")) {
        const count = state.leads.filter((l: Lead) => l.genero.toLowerCase().includes("reggae") || l.genero.toLowerCase().includes("ska")).length;
        reply += `Tienes actualmente **${count} salas** especializadas en Ska/Reggae en la base de datos (por ejemplo, *Kafe Antzokia* en Bilbao, *Sala El Tren* en Granada y *Viña Rock*).`;
      } else {
        reply += `Entendido. Como tu Manager Virtual de Bakandeya, monitorizo la hoja de cálculo. Tienes:\n- **${state.leads.length} leads** en total\n- **${state.rehearsals.filter((r: Rehearsal) => r.estado === 'programado').length} ensayos programados**\n- **${state.concerts.filter((c: Concert) => c.fecha >= '2026-07-09').length} próximos conciertos** (incluyendo Cabo de Plata el 18 de julio).\n\n¿Quieres que revisemos los pitches pendientes o agendemos un ensayo?`;
      }
      
      res.json({ text: reply, proposedActions });
    }, 1000);
    return;
  }

  try {
    // We create a concise but complete overview of the current database state to feed into Gemini's prompt context
    const stateSummary = {
      leads: state.leads.map((l: Lead) => ({
        id: l.id,
        nombre_sala: l.nombre_sala,
        ciudad: l.ciudad,
        region: l.region,
        aforo: l.aforo,
        genero: l.genero,
        estado: l.estado,
        notas: l.notas,
        hasPitch: !!l.pitch_generado
      })),
      rehearsals: state.rehearsals,
      concerts: state.concerts.map((c: Concert) => ({
        id: c.id,
        fecha: c.fecha,
        ciudad: c.ciudad,
        sala: c.sala,
        cache: c.cache,
        contrato_firmado: c.contrato_firmado,
        estado_pago: c.estado_pago
      })),
      recentMessages: state.messages.slice(-5)
    };

    const systemPrompt = `Eres el "Manager Virtual de Bakandeya", un asistente de Inteligencia Artificial para la banda de música española "Bakandeya".
Tu labor es ayudar a Diego, Larra, Filgue y el resto de la banda a organizarse, consultar sus datos de Google Sheets de leads de salas, ver el calendario de ensayos, conciertos y resolver dudas en lenguaje natural.

Estilo de comunicación:
- Habla en español de España.
- Usa un tono amigable, cercano, entusiasta y muy profesional del mundo de la música y backstage (un colega con criterio, nada de corporativo aburrido).
- Sé directo y conciso. Evita parrafadas innecesarias.

Aquí tienes el estado actual de los datos reales de la banda recopilados en tiempo real:
${JSON.stringify(stateSummary, null, 2)}

Tu respuesta debe estar estructurada de tal manera que puedas proponer acciones si el usuario lo solicita o si detectas una acción lógica (como aprobar un lead, agendar ensayo, cambiar clasificación).
Debes devolver la respuesta en formato JSON estrictamente para que la app pueda renderizar el texto en Markdown y ofrecer botones interactivos.

El JSON de respuesta debe tener la siguiente forma exacta:
{
  "text": "Tu respuesta redactada en Markdown con formato elegante, negritas, listas si es necesario, etc.",
  "proposedActions": [
    {
      "type": "propose_lead_approval",
      "leadId": "id-del-lead",
      "leadName": "Nombre de la Sala",
      "description": "Breve texto explicativo de la acción, Ej: Aprobar pitch para Sala Apolo."
    }
  ]
}

Puedes proponer acciones como 'propose_lead_approval' para leads en 'pendiente_aprobacion', o 'propose_rehearsal' para proponer un ensayo, o 'propose_status_change' con 'leadId' y 'newStatus' si el usuario te pide cambiar el estado de algo.
Si no hay ninguna acción lógica que proponer, devuelve 'proposedActions' como una lista vacía [].

Nunca inventories datos. Si el usuario pregunta por algo que no está en el JSON de estado, indícale amablemente que no tienes registro de ello.
RECUERDA: La banda nunca envía emails directamente desde la app (lo hace un agente Python independiente en background), solo cambias estados.`;

    // Prepare full contents for model
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] }
    ];

    // Add chat history to the conversation
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((h: any) => {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: typeof h.text === 'string' ? h.text : JSON.stringify(h.text) }]
        });
      });
    }

    // Append the last user message
    contents.push({ role: 'user', parts: [{ text: message }] });

    // We use gemini-2.5-flash as it is extremely fast and perfect for this structured chat
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const textResult = response.text || "{}";
    const parsed = JSON.parse(textResult);
    res.json(parsed);

  } catch (error) {
    console.error("Error in Gemini API chat proxy:", error);
    res.status(500).json({ error: "Fallo en la comunicación con el asistente virtual", details: String(error) });
  }
});


// Vite middleware integration for full-stack SPA
async function startServer() {
  if (process.env.VERCEL) {
    // On Vercel, we let Vercel serve static assets and just export the app for serverless function handling
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bakandeya Virtual Manager server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
