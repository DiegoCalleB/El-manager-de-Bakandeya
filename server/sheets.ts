import { google } from "googleapis";
import { Lead, EmailMessage } from "../src/types.js";

export const DEFAULT_LEADS_HEADERS = [
  "id", "nombre_sala", "ciudad", "region", "aforo", "genero", "tipo",
  "email_contacto", "telefono", "website", "instagram", "contacto_nombre",
  "fuente", "estado", "pitch_generado", "fecha_envio", "fecha_ultima_respuesta",
  "contexto_extra", "notas", "hilo_emails"
];

export function getColumnLetter(colIndex: number): string {
  let temp: number;
  let letter = '';
  let col = colIndex + 1;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

export function buildHeaderMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  if (!Array.isArray(headers)) return map;
  headers.forEach((h, idx) => {
    if (h) {
      const normalized = String(h).trim().toLowerCase();
      map[normalized] = idx;
    }
  });
  return map;
}

function normalizeLeadStatus(status: any): any {
  if (!status) return 'nuevo';
  const s = String(status).trim().toLowerCase();
  if (s === 'sin_contacto') return 'nuevo';
  if (s === 'esperando') return 'esperando_respuesta';
  if (s === 'pendiente') return 'pendiente_aprobacion';
  if (s === 'enviado') return 'esperando_respuesta';
  if (s === 'por_contactar') return 'nuevo';
  if (s === 'por_aprobar') return 'pendiente_aprobacion';
  
  const valid = [
    'esperando_respuesta', 'pendiente_aprobacion', 'nuevo',
    'aprobado', 'interesado', 'negociando', 'no_interesado', 'rechazado'
  ];
  return valid.includes(s) ? s : 'nuevo';
}

function normalizeLeadType(type: any): string {
  if (!type) return 'sala';
  const s = String(type).trim().toLowerCase();
  if (s.includes('festi')) return 'festival';
  if (s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc')) return 'medio';
  return 'sala';
}

export function rowToLeadDynamic(row: any[], headerMap: Record<string, number>): Lead {
  const getVal = (colName: string) => {
    const idx = headerMap[colName.toLowerCase()];
    return idx !== undefined && idx < row.length ? row[idx] : undefined;
  };

  const idVal = String(getVal("id") || "");
  const nombreSalaVal = String(getVal("nombre_sala") || "");
  const ciudadVal = String(getVal("ciudad") || "");
  const regionVal = String(getVal("region") || "");
  const aforoVal = Number(getVal("aforo")) || 0;
  const generoVal = String(getVal("genero") || "");
  const tipoVal = normalizeLeadType(getVal("tipo"));
  const emailVal = String(getVal("email_contacto") || "");
  const telVal = String(getVal("telefono") || "");
  const webVal = String(getVal("website") || "");
  const instaVal = String(getVal("instagram") || "");
  const contactoNombreVal = getVal("contacto_nombre") ? String(getVal("contacto_nombre")) : undefined;
  const fuenteVal = String(getVal("fuente") || "");
  const estadoVal = normalizeLeadStatus(getVal("estado"));
  const pitchVal = String(getVal("pitch_generado") || "");
  const fechaEnvioVal = getVal("fecha_envio") ? String(getVal("fecha_envio")) : undefined;
  const fechaUltimaRespVal = getVal("fecha_ultima_respuesta") ? String(getVal("fecha_ultima_respuesta")) : undefined;
  const contextoExtraVal = getVal("contexto_extra") ? String(getVal("contexto_extra")) : undefined;
  const notasVal = String(getVal("notas") || "");

  const hiloRaw = getVal("hilo_emails");
  let hiloEmails: EmailMessage[] = [];
  if (hiloRaw && typeof hiloRaw === 'string' && !hiloRaw.startsWith("=")) {
    try {
      hiloEmails = JSON.parse(hiloRaw);
    } catch (e) {
      hiloEmails = [];
    }
  }

  return {
    id: idVal,
    nombre_sala: nombreSalaVal,
    ciudad: ciudadVal,
    region: regionVal,
    aforo: aforoVal,
    genero: generoVal,
    tipo: tipoVal,
    email_contacto: emailVal,
    telefono: telVal,
    website: webVal,
    instagram: instaVal,
    contacto_nombre: contactoNombreVal,
    fuente: fuenteVal,
    estado: estadoVal,
    pitch_generado: pitchVal,
    fecha_envio: fechaEnvioVal,
    fecha_ultima_respuesta: fechaUltimaRespVal,
    contexto_extra: contextoExtraVal,
    notas: notasVal,
    hilo_emails: hiloEmails,
  };
}

export function leadToRowDynamic(
  lead: Lead,
  headers: string[],
  hilosSheetId: number | null = null,
  existingRow?: any[]
): any[] {
  const rowLength = Math.max(headers.length, existingRow ? existingRow.length : 0);
  const row: any[] = new Array(rowLength).fill("");

  // Copy existing row data first so unknown/custom columns added by Python are preserved
  if (existingRow && Array.isArray(existingRow)) {
    for (let i = 0; i < existingRow.length; i++) {
      row[i] = existingRow[i];
    }
  }

  let hiloVal: string;
  if (hilosSheetId !== null) {
    hiloVal = `=IFERROR(HYPERLINK("#gid=${hilosSheetId}&range=A" & MATCH("${lead.id}", hilos_emails!B:B, 0), "Ver Hilo (${lead.hilo_emails?.length || 0} mensajes)"), "Ver Hilo (0 mensajes)")`;
  } else {
    hiloVal = lead.hilo_emails ? JSON.stringify(lead.hilo_emails) : "[]";
  }

  headers.forEach((h, idx) => {
    if (!h) return;
    const key = String(h).trim().toLowerCase();
    switch (key) {
      case "id":
        row[idx] = lead.id || "";
        break;
      case "nombre_sala":
        row[idx] = lead.nombre_sala || "";
        break;
      case "ciudad":
        row[idx] = lead.ciudad || "";
        break;
      case "region":
        row[idx] = lead.region || "";
        break;
      case "aforo":
        row[idx] = lead.aforo || 0;
        break;
      case "genero":
        row[idx] = lead.genero || "";
        break;
      case "tipo":
        row[idx] = lead.tipo || "";
        break;
      case "email_contacto":
        row[idx] = lead.email_contacto || "";
        break;
      case "telefono":
        row[idx] = lead.telefono || "";
        break;
      case "website":
        row[idx] = lead.website || "";
        break;
      case "instagram":
        row[idx] = lead.instagram || "";
        break;
      case "contacto_nombre":
        row[idx] = lead.contacto_nombre || "";
        break;
      case "fuente":
        row[idx] = lead.fuente || "";
        break;
      case "estado":
        row[idx] = normalizeLeadStatus(lead.estado);
        break;
      case "pitch_generado":
        row[idx] = lead.pitch_generado || "";
        break;
      case "fecha_envio":
        row[idx] = lead.fecha_envio || "";
        break;
      case "fecha_ultima_respuesta":
        row[idx] = lead.fecha_ultima_respuesta || "";
        break;
      case "contexto_extra":
        row[idx] = lead.contexto_extra || "";
        break;
      case "notas":
        row[idx] = lead.notas || "";
        break;
      case "hilo_emails":
        row[idx] = hiloVal;
        break;
      default:
        break;
    }
  });

  return row;
}

export function messageToRow(leadId: string, nombreSala: string, msg: any): any[] {
  return [
    msg.id || `em-${Date.now()}`,
    leadId || "",
    nombreSala || "",
    msg.fecha || "",
    msg.remitente || "sala",
    msg.remitente_nombre || "",
    msg.asunto || "",
    msg.mensaje || "",
  ];
}

export function rowToMessage(row: any[]): { leadId: string; msg: any } {
  return {
    leadId: String(row[1] || ""),
    msg: {
      id: String(row[0] || ""),
      fecha: String(row[3] || ""),
      remitente: (row[4] === 'banda' ? 'banda' : 'sala') as 'banda' | 'sala',
      remitente_nombre: String(row[5] || ""),
      asunto: String(row[6] || ""),
      mensaje: String(row[7] || ""),
    }
  };
}

export function parsePrivateKey(rawKey?: string): string | null {
  if (!rawKey) return null;
  let key = rawKey.trim();

  // If passed as a JSON object string
  if (key.startsWith("{") && key.endsWith("}")) {
    try {
      const parsed = JSON.parse(key);
      if (parsed.private_key) {
        key = parsed.private_key;
      }
    } catch {
      // Not JSON
    }
  }

  // Strip wrapping quotes repeatedly
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Replace escaped newlines
  key = key.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\"/g, '"');

  // If base64 encoded
  if (!key.includes("-----BEGIN") && key.length > 100) {
    try {
      const decoded = Buffer.from(key, "base64").toString("utf8");
      if (decoded.includes("-----BEGIN")) {
        key = decoded;
      }
    } catch {
      // Not base64
    }
  }

  if (!key.includes("-----BEGIN") || !key.includes("-----END")) {
    console.warn("[Google Sheets Auth] GOOGLE_PRIVATE_KEY does not contain valid PEM delimiters (-----BEGIN PRIVATE KEY-----).");
    return null;
  }

  return key;
}

export function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawPrivateKey) {
    return null;
  }

  const privateKey = parsePrivateKey(rawPrivateKey);
  if (!privateKey) {
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  } catch (error: any) {
    console.error("Error creating Google Sheets auth client:", error.message || error);
    return null;
  }
}

export async function ensureSheetTabExists(sheets: any, spreadsheetId: string, tabName: string) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = meta.data.sheets?.some(
      (s: any) => s.properties?.title?.toLowerCase() === tabName.toLowerCase()
    );
    if (!sheetExists) {
      console.log(`Creating tab "${tabName}" in Google Sheet...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: tabName }
              }
            }
          ]
        }
      });
    }
  } catch (error: any) {
    const errMsg = error.message || String(error);
    if (errMsg.includes("DECODER routines") || errMsg.includes("unsupported")) {
      console.warn(`[Google Sheets Auth Error] Formato de GOOGLE_PRIVATE_KEY no soportado por OpenSSL crypto: ${errMsg}`);
    } else {
      console.error(`Error checking/creating tab "${tabName}":`, errMsg);
    }
    throw error;
  }
}

export async function getSheetId(sheets: any, spreadsheetId: string, tabName: string): Promise<number | null> {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const found = meta.data.sheets?.find(
      (s: any) => s.properties?.title?.toLowerCase() === tabName.toLowerCase()
    );
    return found?.properties?.sheetId ?? null;
  } catch (error) {
    return null;
  }
}

export async function fetchLeadsFromSheet(localLeads: Lead[]): Promise<Lead[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    console.log("Google Sheets credentials not set. Operating in local sandbox mode.");
    return localLeads;
  }

  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "leads");
    await ensureSheetTabExists(sheets, spreadsheetId, "hilos_emails");

    // Fetch full headers & rows dynamically
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "leads!A1:ZZ",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("Sheet is empty. Bootstrapping with dynamic headers and default leads...");
      await bootstrapSheet(sheets, spreadsheetId, localLeads);
      await bootstrapHilosEmailsSheet(sheets, spreadsheetId, localLeads);
      return localLeads;
    }

    const headers = rows[0];
    const headerMap = buildHeaderMap(headers);
    const dataRows = rows.slice(1);

    // Fetch and index hilos_emails
    let messagesByLeadId: { [leadId: string]: EmailMessage[] } = {};
    try {
      const hilosResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "hilos_emails!A1:H",
      });
      const hilosRows = hilosResponse.data.values || [];
      if (hilosRows.length <= 1) {
        await bootstrapHilosEmailsSheet(sheets, spreadsheetId, localLeads);
        for (const lead of localLeads) {
          if (lead.hilo_emails && lead.hilo_emails.length > 0) {
            messagesByLeadId[lead.id] = lead.hilo_emails;
          }
        }
      } else {
        const hilosData = hilosRows.slice(1);
        for (const row of hilosData) {
          const parsed = rowToMessage(row);
          if (parsed.leadId) {
            if (!messagesByLeadId[parsed.leadId]) {
              messagesByLeadId[parsed.leadId] = [];
            }
            messagesByLeadId[parsed.leadId].push(parsed.msg);
          }
        }
      }
    } catch (e: any) {
      console.error("Error reading hilos_emails tab:", e.message || e);
    }

    const leads = dataRows.map(row => rowToLeadDynamic(row, headerMap));
    for (const lead of leads) {
      if (messagesByLeadId[lead.id] && messagesByLeadId[lead.id].length > 0) {
        lead.hilo_emails = messagesByLeadId[lead.id].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      } else {
        const localLead = localLeads.find(l => l.id === lead.id);
        if (localLead && localLead.hilo_emails && localLead.hilo_emails.length > 0) {
          lead.hilo_emails = localLead.hilo_emails;
          await syncLeadMessagesInSheet(sheets, spreadsheetId, lead);
        } else {
          lead.hilo_emails = [];
        }
      }
    }
    return leads;
  } catch (error: any) {
    console.error("Error fetching leads from Google Sheet, falling back to local:", error.message || error);
    return localLeads;
  }
}

export async function bootstrapSheet(sheets: any, spreadsheetId: string, leads: Lead[]) {
  try {
    const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");
    const headers = DEFAULT_LEADS_HEADERS;
    const values = [headers, ...leads.map(lead => leadToRowDynamic(lead, headers, hilosSheetId))];
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

export async function bootstrapHilosEmailsSheet(sheets: any, spreadsheetId: string, leads: Lead[]) {
  try {
    const headers = ["id", "lead_id", "nombre_sala", "fecha", "remitente", "remitente_nombre", "asunto", "mensaje"];
    const rows: any[] = [];
    for (const lead of leads) {
      if (lead.hilo_emails && lead.hilo_emails.length > 0) {
        for (const msg of lead.hilo_emails) {
          rows.push(messageToRow(lead.id, lead.nombre_sala, msg));
        }
      }
    }
    const values = [headers, ...rows];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "hilos_emails!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
    console.log("Successfully bootstrapped Google Sheet hilos_emails tab.");
  } catch (error) {
    console.error("Error bootstrapping hilos_emails sheet tab:", error);
  }
}

// Surgical append-only sync for lead messages in hilos_emails tab (never clears full range)
export async function syncLeadMessagesInSheet(sheets: any, spreadsheetId: string, lead: Lead) {
  if (!lead.hilo_emails || lead.hilo_emails.length === 0) return;
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "hilos_emails!A:H",
    });
    const rows = response.data.values || [];

    if (rows.length === 0) {
      const headers = ["id", "lead_id", "nombre_sala", "fecha", "remitente", "remitente_nombre", "asunto", "mensaje"];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "hilos_emails!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      });
    }

    const existingMsgIds = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        existingMsgIds.add(String(rows[i][0]));
      }
    }

    const newMessagesToAppend = lead.hilo_emails.filter(msg => !existingMsgIds.has(String(msg.id)));

    if (newMessagesToAppend.length > 0) {
      const newRows = newMessagesToAppend.map(msg => messageToRow(lead.id, lead.nombre_sala, msg));
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "hilos_emails!A:H",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: newRows }
      });
      console.log(`[hilos_emails] Surgical append: added ${newRows.length} new messages for lead ${lead.id}`);
    } else {
      console.log(`[hilos_emails] No new messages needed for lead ${lead.id}`);
    }
  } catch (error) {
    console.error(`Error appending messages for Lead ${lead.id} in Google Sheet:`, error);
  }
}

export async function updateLeadInSheet(lead: Lead) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "leads!A1:ZZ",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      await appendLeadToSheet(lead);
      return;
    }

    const headers = rows[0];
    const headerMap = buildHeaderMap(headers);
    const idColIdx = headerMap["id"];

    if (idColIdx === undefined) {
      console.error("Could not find 'id' column in leads sheet headers.");
      return;
    }

    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][idColIdx] || "") === lead.id) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex !== -1) {
      const sheetRowNumber = rowIndex + 1;
      const existingRow = rows[rowIndex];
      const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");
      const updatedRow = leadToRowDynamic(lead, headers, hilosSheetId, existingRow);

      const endColLetter = getColumnLetter(updatedRow.length - 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `leads!A${sheetRowNumber}:${endColLetter}${sheetRowNumber}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [updatedRow]
        }
      });
      console.log(`Successfully updated Lead ${lead.id} dynamically at sheet row ${sheetRowNumber}`);

      await syncLeadMessagesInSheet(sheets, spreadsheetId, lead);
    } else {
      await appendLeadToSheet(lead);
    }
  } catch (error) {
    console.error(`Error updating Lead ${lead.id} in Google Sheet:`, error);
  }
}

export async function appendLeadToSheet(lead: Lead) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "leads!1:1",
    });
    const headers = (response.data.values && response.data.values[0]) || DEFAULT_LEADS_HEADERS;
    const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");
    const newRow = leadToRowDynamic(lead, headers, hilosSheetId);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "leads!A:A",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow]
      }
    });
    console.log(`Successfully appended Lead ${lead.id} to Google Sheet`);
    await syncLeadMessagesInSheet(sheets, spreadsheetId, lead);
  } catch (error) {
    console.error(`Error appending Lead ${lead.id} to Google Sheet:`, error);
  }
}
