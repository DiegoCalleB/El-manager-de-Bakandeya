import crypto from "crypto";
import { google } from "googleapis";
import { Lead, EmailMessage, Concert, Payment, Rehearsal, SocialPost, SocialMetric, Song, Setlist, Fan } from "../src/types.js";

export const DEFAULT_LEADS_HEADERS = [
  "id", "nombre_sala", "ciudad", "region", "aforo", "genero", "email_contacto", "fuente", "estado", "pitch_generado", "fecha_envio", "fecha_ultima_respuesta", "notas",
  "direccion", "tipo", "telefono", "website", "instagram", "contacto_nombre", "contexto_extra", "hilo_emails", "icono", "imagen_url", "band_id"
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

export function isSpanishPostalCode(val: any): boolean {
  if (!val) return false;
  const s = String(val).trim().replace(/\D/g, '');
  if (s.length !== 5) return false;
  const num = parseInt(s, 10);
  return num >= 1000 && num <= 52999;
}

export function rowToLeadDynamic(row: any[], headerMap: Record<string, number>): Lead {
  if (!Array.isArray(row) || row.length === 0) {
    return {
      id: `lead_${Math.random().toString(36).substring(2, 9)}`,
      nombre_sala: '',
      ciudad: '',
      region: '',
      aforo: 0,
      genero: '',
      tipo: 'sala',
      email_contacto: '',
      telefono: '',
      website: '',
      instagram: '',
      fuente: '',
      estado: 'nuevo',
      pitch_generado: '',
      notas: '',
      hilo_emails: []
    };
  }

  const getValByHeader = (...colNames: string[]) => {
    for (const name of colNames) {
      const idx = headerMap[name.toLowerCase()];
      if (idx !== undefined && idx < row.length && row[idx] !== undefined && row[idx] !== null && row[idx] !== "") {
        return row[idx];
      }
    }
    return undefined;
  };

  const strAt = (i: number) => String(row[i] ?? "").trim();
  const validStatuses = ['nuevo', 'pendiente_aprobacion', 'esperando_respuesta', 'aprobado', 'interesado', 'no_interesado', 'negociando', 'sin_contacto', 'rechazado', 'contactado', 'por_aprobar', 'por_contactar'];
  const isEmailStr = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && !s.startsWith('http') && !/\.(jpg|jpeg|png|webp)$/i.test(s);
  const isStatusStr = (s: string) => validStatuses.includes(s.toLowerCase());
  const isPhoneStr = (s: string) => /^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/.test(s) && !s.includes('@') && !s.startsWith('http') && s.replace(/\D/g, '').length >= 7;
  const isWebUrl = (s: string) => (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('www.') || /\.(com|es|org|cat|net)\b/i.test(s)) && !s.includes('@') && !/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(s);
  const isImgUrl = (s: string) => (s.startsWith('http') || s.startsWith('/uploads/')) && (/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(s) || s.includes('/storage/') || s.includes('/uploads/'));
  const isIgHandle = (s: string) => s.startsWith('@') || s.includes('instagram.com/');

  // Detect layout of the row
  const col6IsEmail = isEmailStr(strAt(6));
  const col8IsEmail = isEmailStr(strAt(8));
  const col8IsStatus = isStatusStr(strAt(8));
  const col14IsStatus = isStatusStr(strAt(14));

  let layoutType: 'OLD_24' | 'NEW_13' | 'HEADER_MAP' = 'NEW_13';

  if (col8IsEmail || col14IsStatus || (!col6IsEmail && col8IsEmail)) {
    layoutType = 'OLD_24';
  } else if (col6IsEmail || col8IsStatus) {
    layoutType = 'NEW_13';
  } else if (headerMap && Object.keys(headerMap).length > 0) {
    const mappedEmailIdx = headerMap['email_contacto'] ?? headerMap['email'] ?? headerMap['correo'];
    if (mappedEmailIdx !== undefined && mappedEmailIdx < row.length && isEmailStr(strAt(mappedEmailIdx))) {
      layoutType = 'HEADER_MAP';
    }
  }

  let idVal: string;
  let nombreSalaVal: string;
  let ciudadVal: string;
  let regionVal: string;
  let direccionVal: string | undefined;
  let rawAforo: any;
  let generoVal: string;
  let tipoVal: string;
  let emailVal: string;
  let telVal: string;
  let webVal: string;
  let instaVal: string;
  let contactoNombreVal: string | undefined;
  let fuenteVal: string;
  let estadoVal: any;
  let pitchVal: string;
  let fechaEnvioVal: string | undefined;
  let fechaUltimaRespVal: string | undefined;
  let contextoExtraVal: string | undefined;
  let notasVal: string;
  let hiloRaw: any;
  let iconoVal: string | undefined;
  let imagenUrlVal: string | undefined;
  let bandIdVal: string | undefined;

  if (layoutType === 'OLD_24') {
    idVal = strAt(0);
    nombreSalaVal = strAt(1);
    ciudadVal = strAt(2);
    regionVal = strAt(3);
    direccionVal = strAt(4) || undefined;
    rawAforo = row[5];
    generoVal = strAt(6);
    tipoVal = normalizeLeadType(row[7]);
    emailVal = strAt(8);
    telVal = strAt(9);
    webVal = strAt(10);
    instaVal = strAt(11);
    contactoNombreVal = strAt(12) || undefined;
    fuenteVal = strAt(13);
    estadoVal = normalizeLeadStatus(row[14]);
    pitchVal = strAt(15);
    fechaEnvioVal = strAt(16) || undefined;
    fechaUltimaRespVal = strAt(17) || undefined;
    contextoExtraVal = strAt(18) || undefined;
    notasVal = strAt(19);
    hiloRaw = row[20];
    iconoVal = strAt(21) || undefined;
    imagenUrlVal = strAt(22) || undefined;
    bandIdVal = strAt(23) || undefined;
  } else if (layoutType === 'NEW_13') {
    idVal = strAt(0);
    nombreSalaVal = strAt(1);
    ciudadVal = strAt(2);
    regionVal = strAt(3);
    rawAforo = row[4];
    generoVal = strAt(5);
    emailVal = strAt(6);
    fuenteVal = strAt(7);
    estadoVal = normalizeLeadStatus(row[8]);
    pitchVal = strAt(9);
    fechaEnvioVal = strAt(10) || undefined;
    fechaUltimaRespVal = strAt(11) || undefined;
    notasVal = strAt(12);
    direccionVal = strAt(13) || undefined;
    tipoVal = normalizeLeadType(row[14]);
    telVal = strAt(15);
    webVal = strAt(16);
    instaVal = strAt(17);
    contactoNombreVal = strAt(18) || undefined;
    contextoExtraVal = strAt(19) || undefined;
    hiloRaw = row[20];
    iconoVal = strAt(21) || undefined;
    imagenUrlVal = strAt(22) || undefined;
    bandIdVal = strAt(23) || undefined;
  } else {
    idVal = strAt(0) || String(getValByHeader("id") || "");
    nombreSalaVal = String(getValByHeader("nombre_sala", "nombre_medio", "medio", "nombre", "espacio", "sala", "medio_comunicacion") || "").trim();
    ciudadVal = String(getValByHeader("ciudad") || "").trim();
    regionVal = String(getValByHeader("region", "comunidad", "provincia") || "").trim();
    direccionVal = getValByHeader("direccion", "dir", "direccion_sala", "domicilio", "ubicacion") ? String(getValByHeader("direccion", "dir", "direccion_sala", "domicilio", "ubicacion")).trim() : undefined;
    rawAforo = getValByHeader("aforo", "capacidad");
    generoVal = String(getValByHeader("genero", "estilo") || "").trim();
    tipoVal = normalizeLeadType(getValByHeader("tipo", "tipo_medio", "categoria"));
    emailVal = String(getValByHeader("email_contacto", "email", "correo", "mail", "contacto_email") || "").trim();
    telVal = String(getValByHeader("telefono", "tel", "celular", "movil", "móvil", "telefono_contacto") || "").trim();
    webVal = String(getValByHeader("website", "web", "url", "sitio_web", "link") || "").trim();
    instaVal = String(getValByHeader("instagram", "insta", "ig") || "").trim();
    contactoNombreVal = getValByHeader("contacto_nombre", "contacto", "persona_contacto", "persona") ? String(getValByHeader("contacto_nombre", "contacto", "persona_contacto", "persona")).trim() : undefined;
    fuenteVal = String(getValByHeader("fuente", "origen", "canal") || "").trim();
    estadoVal = normalizeLeadStatus(getValByHeader("estado", "status"));
    pitchVal = String(getValByHeader("pitch_generado", "pitch") || "").trim();
    fechaEnvioVal = getValByHeader("fecha_envio") ? String(getValByHeader("fecha_envio")).trim() : undefined;
    fechaUltimaRespVal = getValByHeader("fecha_ultima_respuesta") ? String(getValByHeader("fecha_ultima_respuesta")).trim() : undefined;
    contextoExtraVal = getValByHeader("contexto_extra") ? String(getValByHeader("contexto_extra")).trim() : undefined;
    notasVal = String(getValByHeader("notas", "observaciones", "comentarios") || "").trim();
    hiloRaw = getValByHeader("hilo_emails");
    iconoVal = getValByHeader("icono", "logo", "icon", "emoji") ? String(getValByHeader("icono", "logo", "icon", "emoji")).trim() : undefined;
    imagenUrlVal = getValByHeader("imagen_url", "imagen", "photo_url", "foto", "avatar") ? String(getValByHeader("imagen_url", "imagen", "photo_url", "foto", "avatar")).trim() : undefined;
    bandIdVal = getValByHeader("band_id", "bandid") ? String(getValByHeader("band_id", "bandid")).trim() : undefined;
  }

  // Collect all non-empty cell strings for content sanitation
  const allCells = row.map(c => String(c ?? "").trim()).filter(Boolean);

  // SANITATION PASS:

  // 1. AFORO / CAPACITY & POSTAL CODE DEDUCTION
  let aforoVal = 0;
  let cpFoundInAforo: string | undefined = undefined;

  if (rawAforo !== undefined && rawAforo !== null && rawAforo !== "") {
    const rawAforoStr = String(rawAforo).trim();
    if (isSpanishPostalCode(rawAforoStr)) {
      cpFoundInAforo = rawAforoStr.replace(/\D/g, '');
      aforoVal = 0;
    } else {
      const numOnly = rawAforoStr.replace(/\D/g, '');
      if (numOnly) {
        const parsedNum = parseInt(numOnly, 10);
        if (isSpanishPostalCode(parsedNum)) {
          cpFoundInAforo = String(parsedNum).padStart(5, '0');
          aforoVal = 0;
        } else if (parsedNum >= 10 && parsedNum <= 20000) {
          aforoVal = parsedNum;
        }
      }
    }
  }

  // If postal code was found in rawAforo, preserve it in direccionVal
  if (cpFoundInAforo) {
    let currentDir = direccionVal || '';
    if (!currentDir.includes(cpFoundInAforo)) {
      direccionVal = currentDir ? `${currentDir}, CP ${cpFoundInAforo}` : `CP ${cpFoundInAforo}`;
    }
  }

  // If aforoVal is 0, search all cells for a real capacity value (explicit pax or valid non-postal number)
  if (aforoVal === 0) {
    for (const cell of allCells) {
      if (!cell || isEmailStr(cell) || isPhoneStr(cell) || isWebUrl(cell) || isImgUrl(cell) || isStatusStr(cell) || cell.startsWith('lead-') || cell.startsWith('scout-')) continue;

      const paxMatch = cell.match(/\b(\d{2,5})\s*(pax|personas|aforo|capacidad)?\b/i);
      if (paxMatch) {
        const parsed = parseInt(paxMatch[1], 10);
        if (!isSpanishPostalCode(parsed) && parsed >= 10 && parsed <= 20000) {
          aforoVal = parsed;
          break;
        }
      }
    }
  }

  // 2. EMAIL SANITATION
  if (!isEmailStr(emailVal)) {
    const foundEmail = allCells.find(c => isEmailStr(c));
    if (foundEmail) emailVal = foundEmail;
    else emailVal = '';
  }

  // 3. STATUS SANITATION
  if (!isStatusStr(estadoVal)) {
    const foundStatus = allCells.find(c => isStatusStr(c));
    if (foundStatus) {
      estadoVal = normalizeLeadStatus(foundStatus);
    } else {
      estadoVal = 'nuevo';
    }
  }

  // 4. PHONE SANITATION
  if (!isPhoneStr(telVal)) {
    const foundPhone = allCells.find(c => isPhoneStr(c) && c !== emailVal);
    if (foundPhone) telVal = foundPhone;
    else if (telVal === emailVal || isEmailStr(telVal) || isStatusStr(telVal)) telVal = '';
  }

  // 5. WEBSITE SANITATION
  if (!isWebUrl(webVal)) {
    const foundWeb = allCells.find(c => isWebUrl(c) && !isImgUrl(c));
    if (foundWeb) webVal = foundWeb;
    else if (webVal === emailVal || isEmailStr(webVal) || isStatusStr(webVal)) webVal = '';
  }

  // 6. INSTAGRAM SANITATION
  if (!isIgHandle(instaVal)) {
    const foundIg = allCells.find(c => isIgHandle(c));
    if (foundIg) instaVal = foundIg;
    else if (instaVal === emailVal || isEmailStr(instaVal) || isStatusStr(instaVal)) instaVal = '';
  }

  // 7. IMAGE URL SANITATION
  if (!imagenUrlVal || !isImgUrl(imagenUrlVal)) {
    const foundImg = allCells.find(c => isImgUrl(c));
    if (foundImg) imagenUrlVal = foundImg;
    else imagenUrlVal = undefined;
  }

  // 8. CITY & REGION SANITATION
  if (!ciudadVal || isEmailStr(ciudadVal) || isWebUrl(ciudadVal) || isImgUrl(ciudadVal) || isStatusStr(ciudadVal) || isPhoneStr(ciudadVal) || isSpanishPostalCode(ciudadVal)) {
    const foundLoc = allCells.find(c => c && c.length >= 3 && c.length <= 35 && !isEmailStr(c) && !isWebUrl(c) && !isImgUrl(c) && !isStatusStr(c) && !isPhoneStr(c) && !isSpanishPostalCode(c) && !c.startsWith('lead-') && !c.startsWith('scout-') && !/^\d+$/.test(c));
    if (foundLoc) ciudadVal = foundLoc;
    else ciudadVal = '';
  }

  // 9. NAME (nombre_sala) SANITATION
  if (!nombreSalaVal || isEmailStr(nombreSalaVal) || isWebUrl(nombreSalaVal) || isImgUrl(nombreSalaVal) || isStatusStr(nombreSalaVal) || isPhoneStr(nombreSalaVal) || isSpanishPostalCode(nombreSalaVal) || /^\d+$/.test(nombreSalaVal)) {
    const foundName = allCells.find(c => c && c.length >= 3 && c.length <= 80 && !isEmailStr(c) && !isWebUrl(c) && !isImgUrl(c) && !isStatusStr(c) && !isPhoneStr(c) && !isSpanishPostalCode(c) && !c.startsWith('lead-') && !c.startsWith('scout-') && !/^\d+$/.test(c) && c !== ciudadVal);
    if (foundName) nombreSalaVal = foundName;
    else if (!nombreSalaVal) nombreSalaVal = 'Espacio Sin Nombre';
  }

  // 10. TYPE SANITATION
  if (!tipoVal || !['sala', 'medio', 'festival', 'discoteca'].includes(tipoVal)) {
    const lowerName = (nombreSalaVal + " " + (generoVal || "")).toLowerCase();
    if (lowerName.includes('radio') || lowerName.includes('prensa') || lowerName.includes('revista') || lowerName.includes('blog') || lowerName.includes('magazine') || lowerName.includes('fanzine') || lowerName.includes('medio') || lowerName.includes('podcast') || lowerName.includes('tv')) {
      tipoVal = 'medio';
    } else if (lowerName.includes('festival') || lowerName.includes('fest')) {
      tipoVal = 'festival';
    } else if (lowerName.includes('discoteca') || lowerName.includes('club')) {
      tipoVal = 'discoteca';
    } else {
      tipoVal = 'sala';
    }
  }

  // 11. ID SANITATION
  if (!idVal || isEmailStr(idVal) || isStatusStr(idVal) || isPhoneStr(idVal) || isSpanishPostalCode(idVal)) {
    const foundId = allCells.find(c => c.startsWith('lead-') || c.startsWith('scout-') || c.startsWith('med-'));
    if (foundId) idVal = foundId;
    else idVal = `lead_${Math.random().toString(36).substring(2, 9)}`;
  }

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
    direccion: direccionVal,
    aforo: aforoVal,
    genero: generoVal,
    tipo: tipoVal,
    email_contacto: emailVal,
    telefono: telVal,
    website: webVal,
    instagram: instaVal,
    contacto_nombre: contactoNombreVal,
    fuente: fuenteVal || 'manual',
    estado: estadoVal,
    pitch_generado: pitchVal,
    fecha_envio: fechaEnvioVal,
    fecha_ultima_respuesta: fechaUltimaRespVal,
    contexto_extra: contextoExtraVal,
    notas: notasVal,
    hilo_emails: hiloEmails,
    icono: iconoVal,
    imagen_url: imagenUrlVal,
    band_id: bandIdVal
  };
}

export function leadToRowDynamic(
  lead: Lead,
  headers: string[],
  hilosSheetId: number | null = null,
  existingRow?: any[]
): any[] {
  const targetHeaders = (headers && headers.length >= 13) ? headers : DEFAULT_LEADS_HEADERS;
  const rowLength = Math.max(targetHeaders.length, existingRow ? existingRow.length : 0);
  const row: any[] = new Array(rowLength).fill("");

  // Only copy extra custom columns from existingRow beyond targetHeaders length
  if (existingRow && Array.isArray(existingRow) && existingRow.length > targetHeaders.length) {
    for (let i = targetHeaders.length; i < existingRow.length; i++) {
      row[i] = existingRow[i] || "";
    }
  }

  let hiloVal: string;
  if (hilosSheetId !== null) {
    hiloVal = `=IFERROR(HYPERLINK("#gid=${hilosSheetId}&range=A" & MATCH("${lead.id}", hilos_emails!B:B, 0), "Ver Hilo (${lead.hilo_emails?.length || 0} mensajes)"), "Ver Hilo (0 mensajes)")`;
  } else {
    hiloVal = lead.hilo_emails ? JSON.stringify(lead.hilo_emails) : "[]";
  }

  targetHeaders.forEach((h, idx) => {
    if (!h) return;
    const key = String(h).trim().toLowerCase();
    switch (key) {
      case "id":
        row[idx] = lead.id || "";
        break;
      case "nombre_sala":
      case "nombre_medio":
      case "medio":
      case "nombre":
      case "espacio":
      case "sala":
      case "medio_comunicacion":
        row[idx] = lead.nombre_sala || "";
        break;
      case "ciudad":
        row[idx] = lead.ciudad || "";
        break;
      case "region":
      case "comunidad":
      case "provincia":
        row[idx] = lead.region || "";
        break;
      case "direccion":
      case "dir":
      case "direccion_sala":
      case "domicilio":
      case "ubicacion":
        row[idx] = lead.direccion || "";
        break;
      case "aforo":
      case "capacidad":
        row[idx] = lead.aforo || 0;
        break;
      case "genero":
      case "estilo":
        row[idx] = lead.genero || "";
        break;
      case "tipo":
      case "tipo_medio":
      case "categoria":
        row[idx] = lead.tipo || "";
        break;
      case "email_contacto":
      case "email":
      case "correo":
      case "mail":
      case "contacto_email":
        row[idx] = lead.email_contacto || "";
        break;
      case "telefono":
      case "tel":
      case "celular":
      case "movil":
      case "móvil":
      case "telefono_contacto":
        row[idx] = lead.telefono || "";
        break;
      case "website":
      case "web":
      case "url":
      case "sitio_web":
      case "link":
        row[idx] = lead.website || "";
        break;
      case "instagram":
      case "insta":
      case "ig":
        row[idx] = lead.instagram || "";
        break;
      case "contacto_nombre":
      case "contacto":
      case "persona_contacto":
      case "persona":
        row[idx] = lead.contacto_nombre || "";
        break;
      case "fuente":
      case "origen":
      case "canal":
        row[idx] = lead.fuente || "";
        break;
      case "estado":
      case "status":
        row[idx] = normalizeLeadStatus(lead.estado);
        break;
      case "pitch_generado":
      case "pitch":
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
      case "observaciones":
      case "comentarios":
        row[idx] = lead.notas || "";
        break;
      case "hilo_emails":
        row[idx] = hiloVal;
        break;
      case "icono":
      case "logo":
      case "icon":
      case "emoji":
        row[idx] = lead.icono || "";
        break;
      case "imagen_url":
      case "imagen":
      case "photo_url":
      case "foto":
      case "avatar":
        row[idx] = lead.imagen_url || "";
        break;
      case "band_id":
      case "bandid":
        row[idx] = lead.band_id || (lead as any).bandId || "";
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
    msg.band_id || msg.bandId || "",
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

export function getSpreadsheetId(): string | null {
  const raw = (
    process.env.SPREADSHEET_ID ||
    process.env.GOOGLE_SPREADSHEET_ID ||
    process.env.SPREADSHEET_URL ||
    ""
  ).trim();

  if (!raw) return null;
  let val = raw;

  // Strip wrapping quotes
  while (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }

  // Extract ID from full Google Sheet URL e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
  const urlMatch = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  return val || null;
}

export function parsePrivateKey(rawKey?: string): string | null {
  if (!rawKey) return null;
  let key = rawKey.trim();

  // If passed as a JSON object string or contains JSON
  if (key.includes("{") && key.includes("}")) {
    try {
      const startIdx = key.indexOf("{");
      const endIdx = key.lastIndexOf("}") + 1;
      const jsonCandidate = key.substring(startIdx, endIdx);
      const parsed = JSON.parse(jsonCandidate);
      if (parsed.private_key) {
        key = parsed.private_key;
      } else if (parsed.privateKey) {
        key = parsed.privateKey;
      }
    } catch {
      // Not JSON
    }
  }

  // Remove wrapping quotes repeatedly
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Remove literal escaped newlines (\n, \r, \\n, \\r) and actual newlines completely
  key = key
    .split("\\n").join("")
    .split("\\r").join("")
    .split("\n").join("")
    .split("\r").join("")
    .replace(/\\"/g, '"')
    .trim();

  // Check if key is a base64-encoded JSON or base64-encoded PEM string
  // (Base64 for '{"' is 'ey', base64 for '-----BEGIN' is 'LS0t')
  if (!key.includes("BEGIN") && (key.startsWith("ey") || key.startsWith("LS0t") || key.includes("LS0t"))) {
    try {
      const decodedStr = Buffer.from(key, "base64").toString("utf8");
      if (decodedStr.includes("BEGIN") || decodedStr.includes("PRIVATE KEY") || decodedStr.includes("{")) {
        key = decodedStr;
        console.log("[Sheets Auth Fix] Decoded base64 PEM/JSON key string.");
      }
    } catch {
      // ignore
    }
  }

  // Check again for JSON if base64 decoded
  if (key.includes("{") && key.includes("}")) {
    try {
      const startIdx = key.indexOf("{");
      const endIdx = key.lastIndexOf("}") + 1;
      const jsonCandidate = key.substring(startIdx, endIdx);
      const parsed = JSON.parse(jsonCandidate);
      if (parsed.private_key) {
        key = parsed.private_key;
      } else if (parsed.privateKey) {
        key = parsed.privateKey;
      }
    } catch {
      // ignore
    }
  }

  // Extract base64 body if PEM headers exist
  const pemMatch = key.match(/(-----BEGIN\s+[A-Z0-9\s_]+-----)([\s\S]+?)(-----END\s+[A-Z0-9\s_]+-----)/i);

  let rawBody = "";
  if (pemMatch) {
    rawBody = pemMatch[2];
  } else {
    rawBody = key;
  }

  let cleanBody = rawBody
    .split("\\n").join("")
    .split("\\r").join("")
    .split("\n").join("")
    .split("\r").join("")
    .replace(/\\"/g, '"')
    .trim();

  cleanBody = cleanBody.replace(/[^A-Za-z0-9+/=]/g, "");

  // Strip leading artifact characters (like 'n' or 'rn') before 'MII' (standard PKCS#8 DER base64 sequence header)
  const miiIdx = cleanBody.indexOf("MII");
  if (miiIdx > 0 && miiIdx < 10) {
    console.log(`[Sheets Auth Fix] Stripping ${miiIdx} artifact characters before 'MII' base64 header.`);
    cleanBody = cleanBody.substring(miiIdx);
  }

  // Ensure base64 padding is valid (length multiple of 4)
  while (cleanBody.length % 4 !== 0) {
    cleanBody += "=";
  }

  if (cleanBody.length > 30) {
    const lines = cleanBody.match(/.{1,64}/g) || [cleanBody];
    const formattedKey = `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;

    // Validate with crypto.createPrivateKey
    try {
      const pKey = crypto.createPrivateKey(formattedKey);
      console.log(`[Sheets Auth Fix] Private key validated successfully! (${pKey.type} - ${pKey.asymmetricKeyType})`);
      return formattedKey;
    } catch (err: any) {
      console.warn("[Sheets Auth Fix] Standard PKCS#8 format failed validation:", err.message || err);

      // Try RSA Private Key format
      try {
        const rsaKey = `-----BEGIN RSA PRIVATE KEY-----\n${lines.join("\n")}\n-----END RSA PRIVATE KEY-----\n`;
        const pKey2 = crypto.createPrivateKey(rsaKey);
        console.log(`[Sheets Auth Fix] RSA private key format validated successfully! (${pKey2.type})`);
        return rsaKey;
      } catch (err2: any) {
        console.warn("[Sheets Auth Fix] RSA key format failed validation:", err2.message || err2);
      }

      return formattedKey;
    }
  }

  console.warn("[Google Sheets Auth] GOOGLE_PRIVATE_KEY does not contain valid PEM key content.");
  return null;
}

export function getSheetsClient() {
  let email = (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.SERVICE_ACCOUNT_EMAIL ||
    process.env.CLIENT_EMAIL ||
    ""
  ).trim();

  let rawPrivateKey = (
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    ""
  );

  const possibleJsonCreds = [
    process.env.GCP_SA_KEY,
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_CREDENTIALS,
    process.env.GOOGLE_SHEETS_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    process.env.GMAIL_CREDENTIALS_JSON,
  ];

  for (const jsonCreds of possibleJsonCreds) {
    if (jsonCreds && jsonCreds.trim().length > 0) {
      try {
        let rawStr = jsonCreds.trim();
        // If base64 encoded
        if (!rawStr.startsWith("{") && rawStr.length > 100 && !rawStr.includes(" ")) {
          try {
            const decoded = Buffer.from(rawStr, "base64").toString("utf-8");
            if (decoded.includes("{") && decoded.includes("private_key")) {
              rawStr = decoded;
            }
          } catch (_) {}
        }
        const parsed = typeof rawStr === "string" ? JSON.parse(rawStr) : rawStr;
        if (parsed.client_email) email = parsed.client_email.trim();
        if (parsed.private_key) rawPrivateKey = parsed.private_key;
        if (email && rawPrivateKey) break;
      } catch {
        // not valid json
      }
    }
  }

  if (email && email.includes("{") && email.includes("}")) {
    try {
      const startIdx = email.indexOf("{");
      const endIdx = email.lastIndexOf("}") + 1;
      const parsed = JSON.parse(email.substring(startIdx, endIdx));
      if (parsed.client_email) email = parsed.client_email.trim();
      if (parsed.private_key && !rawPrivateKey) rawPrivateKey = parsed.private_key;
    } catch {
      // ignore
    }
  }

  if (rawPrivateKey && rawPrivateKey.includes("{") && rawPrivateKey.includes("}")) {
    try {
      const startIdx = rawPrivateKey.indexOf("{");
      const endIdx = rawPrivateKey.lastIndexOf("}") + 1;
      const parsed = JSON.parse(rawPrivateKey.substring(startIdx, endIdx));
      if (parsed.client_email && !email) email = parsed.client_email.trim();
      if (parsed.private_key) rawPrivateKey = parsed.private_key;
    } catch {
      // ignore
    }
  }

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
  const normalized = tabName.toLowerCase();
  if (verifiedTabsSet.has(normalized)) {
    return;
  }
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    if (meta.data.sheets) {
      meta.data.sheets.forEach((s: any) => {
        const title = s.properties?.title;
        if (title) verifiedTabsSet.add(title.toLowerCase());
        if (s.properties?.sheetId !== undefined && title) {
          sheetIdsMap.set(title.toLowerCase(), s.properties.sheetId);
        }
      });
    }
    if (!verifiedTabsSet.has(normalized)) {
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
      verifiedTabsSet.add(normalized);
    }
  } catch (error: any) {
    const errMsg = error.message || String(error);
    const isQuota = error?.status === 429 || error?.code === 429 || errMsg.toLowerCase().includes("quota");
    if (isQuota) {
      console.warn(`[Google Sheets Rate Limit] Quota exceeded checking tab "${tabName}". Assuming tab exists.`);
      verifiedTabsSet.add(normalized);
      return;
    }
    if (errMsg.includes("DECODER routines") || errMsg.includes("unsupported")) {
      console.warn(`[Google Sheets Auth Error] Formato de GOOGLE_PRIVATE_KEY no soportado por OpenSSL crypto: ${errMsg}`);
    } else {
      console.warn(`Notice checking/creating tab "${tabName}":`, errMsg);
    }
  }
}

/**
 * Verifies if the 'Medios' tab exists in the Google Sheet.
 * If it does not exist, creates it with the required header columns:
 * ID, Nombre, Tipo, Estado, Contacto, Notas.
 */
export async function ensureMediosSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("Medios")) return true;
  const tabName = "Medios";
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) {
      console.log("[ensureMediosSheet] Google Sheets credentials or Spreadsheet ID not configured.");
      return false;
    }

    await ensureSheetTabExists(s, id, tabName);

    try {
      const response = await getValuesCached(s, {
        spreadsheetId: id,
        range: `${tabName}!A1:F1`,
      });

      const values = response.data?.values;
      if (!values || values.length === 0 || !values[0] || values[0].length === 0) {
        console.log(`Writing required headers to "${tabName}" tab...`);
        const headers = ["ID", "Nombre", "Tipo", "Estado", "Contacto", "Notas"];
        await s.spreadsheets.values.update({
          spreadsheetId: id,
          range: `${tabName}!A1:F1`,
          valueInputOption: "RAW",
          requestBody: { values: [headers] },
        });
        console.log(`[ensureMediosSheet] Tab "${tabName}" initialized with headers: ${headers.join(", ")}`);
      }
    } catch (headerErr: any) {
      const isQuota = headerErr?.status === 429 || headerErr?.code === 429 || String(headerErr?.message || "").toLowerCase().includes("quota");
      if (isQuota) {
        console.warn(`[ensureMediosSheet] Quota limit hit for Google Sheets checking "${tabName}".`);
      } else {
        console.warn(`[ensureMediosSheet] Could not verify/write headers for "${tabName}":`, headerErr.message || headerErr);
      }
    }

    verifiedHeadersSet.add("Medios");
    return true;
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.code === 429 || String(error?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn(`[ensureMediosSheet] Quota limit hit for Google Sheets ensuring "${tabName}".`);
      verifiedHeadersSet.add("Medios");
      return true;
    }
    console.warn(`[ensureMediosSheet] Notice ensuring "${tabName}" sheet:`, error.message || error);
    return false;
  }
}

export async function getSheetId(sheets: any, spreadsheetId: string, tabName: string): Promise<number | null> {
  const normalized = tabName.toLowerCase();
  if (sheetIdsMap.has(normalized)) {
    return sheetIdsMap.get(normalized)!;
  }
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    if (meta.data.sheets) {
      meta.data.sheets.forEach((s: any) => {
        const title = s.properties?.title;
        if (title) {
          verifiedTabsSet.add(title.toLowerCase());
          if (s.properties?.sheetId !== undefined) {
            sheetIdsMap.set(title.toLowerCase(), s.properties.sheetId);
          }
        }
      });
    }
    return sheetIdsMap.get(normalized) ?? null;
  } catch (error) {
    return null;
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

const valuesCache = new Map<string, CacheEntry>();
const verifiedTabsSet = new Set<string>();
const verifiedHeadersSet = new Set<string>();
const sheetIdsMap = new Map<string, number>();

export async function retrySheetsWrite<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1500): Promise<T | null> {
  let delay = initialDelay;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isQuota = err?.status === 429 || err?.code === 429 || (err?.message && String(err.message).includes("Quota exceeded"));
      if (isQuota && attempt < maxRetries - 1) {
        console.warn(`[Google Sheets Rate Limit 429] Retrying write in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      } else {
        if (isQuota) {
          console.warn(`[Google Sheets Rate Limit 429] Quota exceeded after ${maxRetries} attempts. Local state remains preserved.`);
          return null;
        }
        throw err;
      }
    }
  }
  return null;
}

/**
 * Perform a cached values.get request to Google Sheets API.
 * Default TTL is 30,000ms (30 seconds).
 * On rate limit (429 / Quota Exceeded), returns cached data if available.
 */
export async function getValuesCached(
  sheets: any,
  params: { spreadsheetId: string; range: string },
  ttlMs = 30000
): Promise<any> {
  const cacheKey = `${params.spreadsheetId}:${params.range}`;
  const now = Date.now();
  const cached = valuesCache.get(cacheKey);

  if (cached && (now - cached.timestamp < ttlMs)) {
    return cached.data;
  }

  try {
    const response = await sheets.spreadsheets.values.get(params);
    valuesCache.set(cacheKey, { data: response, timestamp: now });
    return response;
  } catch (err: any) {
    const isQuotaError = err?.status === 429 || 
      err?.code === 429 || 
      String(err?.message || "").toLowerCase().includes("quota") ||
      String(err?.errors?.[0]?.message || "").toLowerCase().includes("quota");

    if (cached) {
      if (isQuotaError) {
        console.warn(`[Google Sheets Cache] Límite de cuota alcanzado para '${params.range}'. Usando datos cacheados (${Math.round((now - cached.timestamp) / 1000)}s de antigüedad).`);
      } else {
        console.warn(`[Google Sheets Cache] Error consultando '${params.range}'. Usando datos cacheados:`, err?.message || err);
      }
      return cached.data;
    }

    if (isQuotaError) {
      console.warn(`[Google Sheets Rate Limit] Excedida cuota de lectura para '${params.range}'. No hay caché previa.`);
    }
    throw err;
  }
}

export function invalidateValuesCache(rangePrefix?: string) {
  if (!rangePrefix) {
    valuesCache.clear();
    return;
  }
  for (const key of valuesCache.keys()) {
    if (key.includes(rangePrefix)) {
      valuesCache.delete(key);
    }
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
    await ensureMediosSheet(sheets, spreadsheetId);

    // Fetch leads tab
    let leadsFromSheet: Lead[] = [];
    try {
      const response = await getValuesCached(sheets, {
        spreadsheetId,
        range: "leads!A1:ZZ",
      });
      const rows = response.data?.values;
      if (rows && rows.length > 0) {
        const headers = rows[0] || [];
        const headerMap = buildHeaderMap(headers);
        const dataRows = rows.slice(1);
        leadsFromSheet = dataRows.map(row => rowToLeadDynamic(row, headerMap));

        // Always realign in background if rows exist, to guarantee Google Sheet columns match DEFAULT_LEADS_HEADERS canonical layout and cleaned values
        if (dataRows.length > 0) {
          console.log("[Google Sheets] Syncing & realigning 'leads' tab with sanitized columns...");
          realignLeadsSheetHeadersAndData(sheets, spreadsheetId, leadsFromSheet).catch(err => {
            console.warn("Auto realign background notice:", err);
          });
        }
      }
    } catch (e: any) {
      console.error("Error reading leads tab:", e?.message || e);
    }

    // Fetch Medios tab (if present)
    let mediosFromSheet: Lead[] = [];
    try {
      let responseMedios: any = null;
      try {
        responseMedios = await getValuesCached(sheets, {
          spreadsheetId,
          range: "Medios!A1:ZZ",
        });
      } catch (_) {
        responseMedios = await getValuesCached(sheets, {
          spreadsheetId,
          range: "medios!A1:ZZ",
        });
      }
      if (responseMedios?.data?.values && responseMedios.data.values.length > 1) {
        const rows = responseMedios.data.values;
        const headers = rows[0];
        const headerMap = buildHeaderMap(headers);
        const dataRows = rows.slice(1);
        mediosFromSheet = dataRows.map(row => {
          const l = rowToLeadDynamic(row, headerMap);
          if (!l.tipo || l.tipo === 'sala') l.tipo = 'medio';
          return l;
        });
      }
    } catch (e: any) {
      // Medios tab might not exist or be empty
    }

    const rawLeads = [...leadsFromSheet, ...mediosFromSheet];

    if (rawLeads.length === 0) {
      console.log("Sheet is empty. Bootstrapping with dynamic headers and default leads...");
      await bootstrapSheet(sheets, spreadsheetId, localLeads);
      await bootstrapHilosEmailsSheet(sheets, spreadsheetId, localLeads);
      return localLeads;
    }

    // Deduplicate leads by ID to prevent React duplicate key warnings
    const seenLeadIds = new Set<string>();
    const allSheetLeads: Lead[] = [];
    for (const l of rawLeads) {
      let leadId = (l.id || '').trim();
      if (!leadId) {
        leadId = `lead_${Math.random().toString(36).substring(2, 9)}`;
        l.id = leadId;
      }
      if (!seenLeadIds.has(leadId)) {
        seenLeadIds.add(leadId);
        allSheetLeads.push(l);
      } else {
        let counter = 2;
        let altId = `${leadId}_${counter}`;
        while (seenLeadIds.has(altId)) {
          counter++;
          altId = `${leadId}_${counter}`;
        }
        l.id = altId;
        seenLeadIds.add(altId);
        allSheetLeads.push(l);
      }
    }

    // Fetch and index hilos_emails
    let messagesByLeadId: { [leadId: string]: EmailMessage[] } = {};
    try {
      const hilosResponse = await getValuesCached(sheets, {
        spreadsheetId,
        range: "hilos_emails!A1:H",
      });
      const hilosRows = hilosResponse.data?.values || [];
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

    for (const lead of allSheetLeads) {
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
    return allSheetLeads;
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
    const headers = ["id", "lead_id", "nombre_sala", "fecha", "remitente", "remitente_nombre", "asunto", "mensaje", "band_id"];
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
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "hilos_emails!A:I",
    }, 5000);
    const rows = response.data?.values || [];

    if (rows.length === 0) {
      const headers = ["id", "lead_id", "nombre_sala", "fecha", "remitente", "remitente_nombre", "asunto", "mensaje", "band_id"];
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "hilos_emails!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
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
      await retrySheetsWrite(() => sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "hilos_emails!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: newRows }
      }));
      console.log(`[hilos_emails] Surgical append: added ${newRows.length} new messages for lead ${lead.id}`);
    } else {
      console.log(`[hilos_emails] No new messages needed for lead ${lead.id}`);
    }
  } catch (error: any) {
    if (error?.status === 429 || error?.code === 429 || String(error?.message || "").includes("Quota exceeded")) {
      console.warn(`Notice appending messages for Lead ${lead.id} in Google Sheet: Quota exceeded (will retry on next sync).`);
    } else {
      console.error(`Error appending messages for Lead ${lead.id} in Google Sheet:`, error);
    }
  }
}

export async function verifyLeadStatusAndWrite(
  id: string, 
  expectedStatus: string | undefined, 
  updatedFields: Partial<Lead>,
  loadState: () => any,
  saveState: (state: any) => void
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
      const tabsToCheck = currentLead.tipo === 'medio' ? ["Medios", "medios", "leads"] : ["leads", "Medios", "medios"];
      for (const tabName of tabsToCheck) {
        try {
          const response = await getValuesCached(sheets, {
            spreadsheetId,
            range: `${tabName}!A:ZZ`,
          }, 5000);
          const rows = response.data?.values;
          if (rows && rows.length > 0) {
            const headers = rows[0];
            const headerMap = buildHeaderMap(headers);
            const idColIdx = headerMap["id"];
            const estadoColIdx = headerMap["estado"];

            if (idColIdx !== undefined) {
              const rowIndex = rows.findIndex((row: any[], index: number) => index > 0 && String(row[idColIdx] || "") === id);
              if (rowIndex !== -1) {
                const sheetEstado = estadoColIdx !== undefined && estadoColIdx < rows[rowIndex].length ? rows[rowIndex][estadoColIdx] : "nuevo";
                
                if (expectedStatus && normalizeLeadStatus(sheetEstado) !== normalizeLeadStatus(expectedStatus)) {
                  console.warn(`Race condition avoided: Lead ${id} is in state '${sheetEstado}', but expected '${expectedStatus}'`);
                  
                  state.leads[idx] = rowToLeadDynamic(rows[rowIndex], headerMap);
                  saveState(state);
                  
                  return { 
                    success: false, 
                    error: `El estado en Google Sheets (${tabName}) ha cambiado a '${sheetEstado}' en paralelo por otro usuario o cron job. Se han sincronizado los datos locales. Por favor, recarga.`,
                    lead: state.leads[idx]
                  };
                }
                break;
              }
            }
          }
        } catch (_) {
          // Tab might not exist, proceed to next
        }
      }
    } catch (error) {
      console.error("Error verifying lead status in Google Sheet, continuing with local persistence:", error);
    }
  }
  
  state.leads[idx] = { ...currentLead, ...updatedFields };
  saveState(state);
  
  if (sheets && spreadsheetId) {
    await updateLeadInSheet(state.leads[idx]);
  }
  
  return { success: true, lead: state.leads[idx] };
}

export async function ensureHeadersInSheet(
  sheets: any,
  spreadsheetId: string,
  tabName: string,
  defaultHeaders: string[]
): Promise<string[]> {
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: `${tabName}!1:1`,
    }, 5000);
    const existingHeaders: string[] = response.data?.values?.[0] || [];
    if (existingHeaders.length === 0) return defaultHeaders;

    const existingNormalized = new Set(existingHeaders.map(h => String(h).trim().toLowerCase()));
    const missingHeaders = defaultHeaders.filter(dh => !existingNormalized.has(dh.toLowerCase()));

    if (missingHeaders.length > 0) {
      const fullHeaders = [...existingHeaders, ...missingHeaders];
      const endColLetter = getColumnLetter(fullHeaders.length - 1);
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A1:${endColLetter}1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [fullHeaders] }
      }));
      invalidateValuesCache(tabName);
      console.log(`[Google Sheets] Updated row 1 headers in "${tabName}" with missing columns:`, missingHeaders);
      return fullHeaders;
    }
    return existingHeaders;
  } catch (error) {
    console.error(`Error ensuring headers in tab "${tabName}":`, error);
    return defaultHeaders;
  }
}

export async function realignLeadsSheetHeadersAndData(
  sheetsClient?: any,
  targetSpreadsheetId?: string,
  existingParsedLeads?: Lead[]
): Promise<{ success: boolean; count: number; message: string }> {
  const sheets = sheetsClient || getSheetsClient();
  const spreadsheetId = targetSpreadsheetId || process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    return { success: false, count: 0, message: "Las credenciales de Google Sheets no están configuradas." };
  }

  try {
    const tabName = "leads";
    await ensureSheetTabExists(sheets, spreadsheetId, tabName);

    let parsedLeads: Lead[] = existingParsedLeads || [];
    if (!existingParsedLeads || existingParsedLeads.length === 0) {
      const response = await getValuesCached(sheets, {
        spreadsheetId,
        range: `${tabName}!A1:ZZ`,
      }, 100);

      const rows = response.data?.values || [];
      if (rows.length > 1) {
        const currentHeaders = rows[0] || [];
        const headerMap = buildHeaderMap(currentHeaders);
        const dataRows = rows.slice(1);
        parsedLeads = dataRows.map(r => rowToLeadDynamic(r, headerMap));
      }
    }

    const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");

    const newFormattedRows = [
      DEFAULT_LEADS_HEADERS,
      ...parsedLeads.map(lead => leadToRowDynamic(lead, DEFAULT_LEADS_HEADERS, hilosSheetId))
    ];

    const endColLetter = getColumnLetter(DEFAULT_LEADS_HEADERS.length - 1);

    // Clear existing range first to remove phantom/out-of-bounds leftover columns
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${tabName}!A1:ZZ${Math.max(parsedLeads.length + 20, 200)}`
      });
    } catch (_) {}

    await retrySheetsWrite(() => sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1:${endColLetter}${newFormattedRows.length}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: newFormattedRows }
    }));

    invalidateValuesCache(tabName);
    console.log(`[Google Sheets] Successfully realigned ${parsedLeads.length} leads and headers in '${tabName}'.`);
    return {
      success: true,
      count: parsedLeads.length,
      message: `¡Cabeceras y ${parsedLeads.length} salas/medios alineados correctamente en la pestaña 'leads' de Google Sheets!`
    };
  } catch (err: any) {
    console.error("Error realigning leads sheet headers:", err);
    return { success: false, count: 0, message: err?.message || String(err) };
  }
}

export async function updateLeadInSheet(lead: Lead) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    const tabsToCheck = lead.tipo === 'medio' ? ["Medios", "medios", "leads"] : ["leads", "Medios", "medios"];
    let updated = false;

    for (const tabName of tabsToCheck) {
      try {
        const headers = await ensureHeadersInSheet(sheets, spreadsheetId, tabName, DEFAULT_LEADS_HEADERS);
        const response = await getValuesCached(sheets, {
          spreadsheetId,
          range: `${tabName}!A1:ZZ`,
        }, 5000);
        const rows = response.data?.values;
        if (!rows || rows.length === 0) continue;

        const headerMap = buildHeaderMap(headers);
        const idColIdx = headerMap["id"];

        if (idColIdx === undefined) continue;

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
          await retrySheetsWrite(() => sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${tabName}!A${sheetRowNumber}:${endColLetter}${sheetRowNumber}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [updatedRow]
            }
          }));
          console.log(`Successfully updated Lead ${lead.id} in sheet tab ${tabName} row ${sheetRowNumber}`);

          invalidateValuesCache(tabName);
          await syncLeadMessagesInSheet(sheets, spreadsheetId, lead);
          updated = true;
          break;
        }
      } catch (_) {
        // Tab might not exist yet
      }
    }

    if (!updated) {
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
    const targetTab = lead.tipo === 'medio' ? "Medios" : "leads";
    await ensureSheetTabExists(sheets, spreadsheetId, targetTab);

    const headers = await ensureHeadersInSheet(sheets, spreadsheetId, targetTab, DEFAULT_LEADS_HEADERS);

    const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");
    const newRow = leadToRowDynamic(lead, headers, hilosSheetId);

    await retrySheetsWrite(() => sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${targetTab}!A:A`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow]
      }
    }));
    console.log(`Successfully appended Lead ${lead.id} to Google Sheet tab ${targetTab}`);
    invalidateValuesCache(targetTab);
    await syncLeadMessagesInSheet(sheets, spreadsheetId, lead);
  } catch (error) {
    console.error(`Error appending Lead ${lead.id} to Google Sheet:`, error);
  }
}

export function socialPostToRow(post: any): any[] {
  return [
    post.id || "",
    post.fecha || "",
    post.plataforma || "Instagram",
    post.contenido || "",
    post.estado || "borrador",
    post.responsable || "",
    post.band_id || post.bandId || ""
  ];
}

export async function updatePostInSheet(post: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "redes_sociales");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "redes_sociales!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === post.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `redes_sociales!A${sheetRowNumber}:G${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [socialPostToRow(post)] }
        });
        invalidateValuesCache("redes_sociales");
        return;
      }
    }
    await appendPostToSheet(post);
  } catch (error) {
    console.error(`Error updating SocialPost ${post.id} in Google Sheet:`, error);
  }
}

export async function appendPostToSheet(post: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "redes_sociales");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "redes_sociales!A:G",
      valueInputOption: "RAW",
      requestBody: { values: [socialPostToRow(post)] }
    });
    invalidateValuesCache("redes_sociales");
  } catch (error) {
    console.error(`Error appending SocialPost ${post.id} to Google Sheet:`, error);
  }
}

export function socialMetricToRow(metric: any): any[] {
  return [
    metric.id || "",
    metric.fecha || "",
    metric.instagram || 0,
    metric.tiktok || 0,
    metric.youtube || 0,
    metric.notas || "",
    metric.band_id || metric.bandId || ""
  ];
}

export async function updateMetricInSheet(metric: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "seguidores");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "seguidores!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === metric.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `seguidores!A${sheetRowNumber}:G${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [socialMetricToRow(metric)] }
        });
        invalidateValuesCache("seguidores");
        return;
      }
    }
    await appendMetricToSheet(metric);
  } catch (error) {
    console.error(`Error updating SocialMetric ${metric.id} in Google Sheet:`, error);
  }
}

export function concertToRow(c: Concert): any[] {
  return [
    c.id || "",
    c.fecha || "",
    c.ciudad || "",
    c.sala || "",
    c.direccion || "",
    c.cache || "",
    c.aforo_vendido || 0,
    c.aforo_total || 0,
    c.contrato_firmado ? "SÍ" : "NO",
    c.estado_pago || "pendiente",
    c.notas || "",
    c.tipo || "sala",
    c.band_id || (c as any).bandId || ""
  ];
}

export function paymentToRow(p: Payment): any[] {
  return [
    p.id || "",
    p.tipo || "gasto",
    p.categoria || "",
    p.concepto || "",
    p.importe || 0,
    p.fecha || "",
    p.estado || "pendiente",
    p.band_id || (p as any).bandId || ""
  ];
}

export function rehearsalToRow(r: Rehearsal): any[] {
  return [
    r.id || "",
    r.fecha || "",
    r.hora || "",
    r.lugar || "",
    Array.isArray(r.asistentes) ? r.asistentes.join(", ") : (r.asistentes || ""),
    r.estado || "programado",
    r.notas || "",
    r.band_id || (r as any).bandId || ""
  ];
}

export async function fetchRehearsalsFromSheet(fallback: Rehearsal[]): Promise<Rehearsal[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "ensayos!A2:H",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `reh-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `reh-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);
      return {
        id,
        fecha: r[1] || "",
        hora: r[2] || "",
        lugar: r[3] || "",
        asistentes: r[4] ? r[4].split(",").map((s: string) => s.trim()) : [],
        estado: r[5] || "programado",
        notas: r[6] || "",
        band_id: r[7] || ""
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching rehearsals from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchConcertsFromSheet(fallback: Concert[]): Promise<Concert[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "conciertos!A2:M",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `cnc-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `cnc-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);

      let direccion = "";
      let cache = "";
      let aforo_vendido = 0;
      let aforo_total = 0;
      let contrato_firmado = false;
      let estado_pago: 'pendiente' | 'pagado' | 'anticipo' = 'pendiente';
      let notas = "";
      let tipo: 'sala' | 'festival' | 'ayuntamiento' = "sala";
      let band_id = "";

      if (r.length >= 13) {
        direccion = r[4] || "";
        cache = r[5] || "";
        aforo_vendido = Number(r[6]) || 0;
        aforo_total = Number(r[7]) || 0;
        contrato_firmado = String(r[8]).toUpperCase() === "SÍ" || String(r[8]).toUpperCase() === "SI" || r[8] === true;
        estado_pago = (r[9] as any) || "pendiente";
        notas = r[10] || "";
        tipo = (r[11] as any) || "sala";
        band_id = r[12] || "";
      } else if (r.length >= 12) {
        direccion = r[4] || "";
        cache = r[5] || "";
        aforo_vendido = Number(r[6]) || 0;
        aforo_total = Number(r[7]) || 0;
        contrato_firmado = String(r[8]).toUpperCase() === "SÍ" || String(r[8]).toUpperCase() === "SI" || r[8] === true;
        estado_pago = (r[9] as any) || "pendiente";
        notas = r[10] || "";
        tipo = (r[11] as any) || "sala";
      } else {
        cache = r[4] || "";
        aforo_vendido = Number(r[5]) || 0;
        aforo_total = Number(r[6]) || 0;
        contrato_firmado = String(r[7]).toUpperCase() === "SÍ" || String(r[7]).toUpperCase() === "SI" || r[7] === true;
        estado_pago = (r[8] as any) || "pendiente";
        notas = r[9] || "";
        tipo = (r[10] as any) || "sala";
      }

      return {
        id,
        fecha: r[1] || "",
        ciudad: r[2] || "",
        sala: r[3] || "",
        direccion,
        cache: Number(cache) || 0,
        aforo_vendido,
        aforo_total,
        contrato_firmado,
        estado_pago,
        notas,
        tipo,
        band_id
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching concerts from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchPostsFromSheet(fallback: SocialPost[]): Promise<SocialPost[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "redes_sociales!A2:G",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `post-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `post-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);
      return {
        id,
        fecha: r[1] || "",
        plataforma: r[2] || "Instagram",
        contenido: r[3] || "",
        estado: r[4] || "borrador",
        responsable: r[5] || "",
        band_id: r[6] || ""
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching posts from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchPaymentsFromSheet(fallback: Payment[]): Promise<Payment[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "finanzas!A2:H",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `pay-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `pay-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);
      return {
        id,
        tipo: r[1] || "gasto",
        categoria: r[2] || "",
        concepto: r[3] || "",
        importe: Number(r[4]) || 0,
        fecha: r[5] || "",
        estado: r[6] || "pendiente",
        band_id: r[7] || ""
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching payments from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchMetricsFromSheet(fallback: SocialMetric[]): Promise<SocialMetric[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "seguidores!A2:G",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return fallback;
    const seen = new Set<string>();
    return rows.map((r: any[], idx: number) => {
      let id = r[0] ? String(r[0]).trim() : `met-${idx + 1}`;
      if (!id || seen.has(id)) {
        id = `met-${idx + 1}-${Date.now()}`;
      }
      seen.add(id);
      return {
        id,
        fecha: r[1] || "",
        instagram: Number(r[2]) || 0,
        tiktok: Number(r[3]) || 0,
        youtube: Number(r[4]) || 0,
        notas: r[5] || "",
        band_id: r[6] || ""
      };
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching metrics from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchLogisticsFromSheet(fallbackRos: Record<string, any[]>, fallbackGear: Record<string, any[]>): Promise<{ runOfShow: Record<string, any[]>; gearChecklists: Record<string, any[]> }> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return { runOfShow: fallbackRos, gearChecklists: fallbackGear };
  try {
    const runOfShow: Record<string, any[]> = { ...fallbackRos };
    const gearChecklists: Record<string, any[]> = { ...fallbackGear };

    const rosRes = await getValuesCached(sheets, {
      spreadsheetId,
      range: "logistica_horarios!A2:E",
    });
    if (rosRes.data?.values) {
      rosRes.data.values.forEach((r: any[]) => {
        const dateKey = r[0];
        if (dateKey) {
          if (!runOfShow[dateKey]) runOfShow[dateKey] = [];
          const existingIdx = runOfShow[dateKey].findIndex((i: any) => i.id === r[1]);
          const item = {
            id: r[1] || `ros-${Date.now()}`,
            time: r[2] || "",
            activity: r[3] || "",
            done: String(r[4]).toUpperCase() === "SÍ" || String(r[4]).toUpperCase() === "SI" || r[4] === true
          };
          if (existingIdx !== -1) {
            runOfShow[dateKey][existingIdx] = item;
          } else {
            runOfShow[dateKey].push(item);
          }
        }
      });
    }

    const gearRes = await getValuesCached(sheets, {
      spreadsheetId,
      range: "logistica_equipo!A2:D",
    });
    if (gearRes.data?.values) {
      gearRes.data.values.forEach((r: any[]) => {
        const dateKey = r[0];
        if (dateKey) {
          if (!gearChecklists[dateKey]) gearChecklists[dateKey] = [];
          const existingIdx = gearChecklists[dateKey].findIndex((i: any) => i.id === r[1]);
          const item = {
            id: r[1] || `gear-${Date.now()}`,
            label: r[2] || "",
            checked: String(r[3]).toUpperCase() === "SÍ" || String(r[3]).toUpperCase() === "SI" || r[3] === true
          };
          if (existingIdx !== -1) {
            gearChecklists[dateKey][existingIdx] = item;
          } else {
            gearChecklists[dateKey].push(item);
          }
        }
      });
    }

    return { runOfShow, gearChecklists };
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.error("Error fetching logistics from sheet:", e?.message || e);
    }
    return { runOfShow: fallbackRos, gearChecklists: fallbackGear };
  }
}

export async function updateRehearsalInSheet(rehearsal: Rehearsal) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "ensayos");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "ensayos!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === rehearsal.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `ensayos!A${sheetRowNumber}:H${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [rehearsalToRow(rehearsal)] }
        });
        invalidateValuesCache("ensayos");
        return;
      }
    }
    await appendRehearsalToSheet(rehearsal);
  } catch (error) {
    console.error(`Error updating Rehearsal ${rehearsal.id} in Google Sheet:`, error);
  }
}

export async function appendRehearsalToSheet(rehearsal: Rehearsal) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "ensayos");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "ensayos!A:H",
      valueInputOption: "RAW",
      requestBody: { values: [rehearsalToRow(rehearsal)] }
    });
    invalidateValuesCache("ensayos");
  } catch (error) {
    console.error(`Error appending Rehearsal ${rehearsal.id} to Google Sheet:`, error);
  }
}

export async function updateConcertInSheet(concert: Concert) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "conciertos");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "conciertos!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === concert.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `conciertos!A${sheetRowNumber}:M${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [concertToRow(concert)] }
        });
        invalidateValuesCache("conciertos");
        return;
      }
    }
    await appendConcertToSheet(concert);
  } catch (error) {
    console.error(`Error updating Concert ${concert.id} in Google Sheet:`, error);
  }
}

export async function appendConcertToSheet(concert: Concert) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "conciertos");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "conciertos!A:M",
      valueInputOption: "RAW",
      requestBody: { values: [concertToRow(concert)] }
    });
    invalidateValuesCache("conciertos");
  } catch (error) {
    console.error(`Error appending Concert ${concert.id} to Google Sheet:`, error);
  }
}

export async function syncLogisticsToSheet(runOfShow: Record<string, any[]>, gearChecklists: Record<string, any[]>) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "logistica_horarios");
    await ensureSheetTabExists(sheets, spreadsheetId, "logistica_equipo");

    const rosHeaders = ["Fecha", "ID", "Hora", "Actividad", "Completado", "band_id"];
    const rosRows: any[] = [rosHeaders];
    if (runOfShow) {
      Object.entries(runOfShow).forEach(([dateKey, items]) => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            rosRows.push([dateKey, item.id || "", item.time || "", item.activity || "", item.done ? "SÍ" : "NO", item.band_id || item.bandId || ""]);
          });
        }
      });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "logistica_horarios!A1",
      valueInputOption: "RAW",
      requestBody: { values: rosRows }
    });

    const gearHeaders = ["Fecha", "ID", "Material", "Cargado", "band_id"];
    const gearRows: any[] = [gearHeaders];
    if (gearChecklists) {
      Object.entries(gearChecklists).forEach(([dateKey, items]) => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            gearRows.push([dateKey, item.id || "", item.label || "", item.checked ? "SÍ" : "NO", item.band_id || item.bandId || ""]);
          });
        }
      });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "logistica_equipo!A1",
      valueInputOption: "RAW",
      requestBody: { values: gearRows }
    });
    invalidateValuesCache("logistica");
  } catch (error) {
    console.error("Error syncing logistics to Google Sheet:", error);
  }
}

export async function appendPaymentToSheet(payment: Payment) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "finanzas");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "finanzas!A:H",
      valueInputOption: "RAW",
      requestBody: { values: [paymentToRow(payment)] }
    });
    invalidateValuesCache("finanzas");
  } catch (error) {
    console.error(`Error appending Payment ${payment.id} to Google Sheet:`, error);
  }
}

export async function updatePaymentInSheet(payment: Payment) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "finanzas");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "finanzas!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === payment.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `finanzas!A${sheetRowNumber}:H${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [paymentToRow(payment)] }
        });
        invalidateValuesCache("finanzas");
        return;
      }
    }
    await appendPaymentToSheet(payment);
  } catch (error) {
    console.error(`Error updating Payment ${payment.id} in Google Sheet:`, error);
  }
}

export async function appendMetricToSheet(metric: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "seguidores");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "seguidores!A:G",
      valueInputOption: "RAW",
      requestBody: { values: [socialMetricToRow(metric)] }
    });
  } catch (error) {
    console.error(`Error appending SocialMetric ${metric.id} to Google Sheet:`, error);
  }
}

export function songToRow(song: Song): any[] {
  return [
    song.id || "",
    song.titulo || "",
    song.duracion || "",
    song.duracionSegundos || 0,
    song.tonalidad || "",
    song.bpm || 120,
    song.afinacion || "",
    song.albumDisco || "",
    song.estadoTema || "listo",
    song.esVersionCovers ? "SÍ" : "NO",
    song.enlaceAcordes || "",
    song.notasInternas || "",
    song.audioPrincipalUrl || "",
    song.portadaUrl || "",
    JSON.stringify(song.audioIdeas || []),
    song.band_id || (song as any).bandId || ""
  ];
}

export function rowToSong(r: any[]): Song {
  let audioIdeas = [];
  if (r[14]) {
    try {
      audioIdeas = typeof r[14] === "string" ? JSON.parse(r[14]) : r[14];
    } catch {
      audioIdeas = [];
    }
  }
  return {
    id: String(r[0] || "").trim(),
    titulo: String(r[1] || "").trim(),
    duracion: String(r[2] || "03:30"),
    duracionSegundos: Number(r[3]) || 210,
    tonalidad: String(r[4] || "Am"),
    bpm: Number(r[5]) || 120,
    afinacion: String(r[6] || ""),
    albumDisco: String(r[7] || ""),
    estadoTema: (r[8] as any) || "listo",
    esVersionCovers: String(r[9]).toUpperCase() === "SÍ" || String(r[9]).toUpperCase() === "SI" || r[9] === true,
    enlaceAcordes: String(r[10] || ""),
    notasInternas: String(r[11] || ""),
    audioPrincipalUrl: String(r[12] || ""),
    portadaUrl: String(r[13] || ""),
    audioIdeas: Array.isArray(audioIdeas) ? audioIdeas : [],
    band_id: String(r[15] || "").trim()
  };
}

export function setlistToRow(st: Setlist): any[] {
  return [
    st.id || "",
    st.nombre || "",
    st.descripcion || "",
    st.tipoFormato || "",
    st.duracionTotalEstimadaMinutos || 0,
    st.fechaCreacion || "",
    st.fechaUltimaEdicion || "",
    JSON.stringify(st.items || []),
    st.band_id || (st as any).bandId || ""
  ];
}

export function rowToSetlist(r: any[]): Setlist {
  let items = [];
  if (r[7]) {
    try {
      items = typeof r[7] === "string" ? JSON.parse(r[7]) : r[7];
    } catch {
      items = [];
    }
  }
  return {
    id: String(r[0] || "").trim(),
    nombre: String(r[1] || "").trim(),
    descripcion: String(r[2] || ""),
    tipoFormato: (r[3] as any) || "sala_larga",
    duracionTotalEstimadaMinutos: Number(r[4]) || 0,
    fechaCreacion: String(r[5] || ""),
    fechaUltimaEdicion: String(r[6] || ""),
    items: Array.isArray(items) ? items : [],
    band_id: String(r[8] || "").trim()
  };
}

export async function ensureTemasYSetlistsSheets(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("canciones_y_repertorios")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;

    await ensureSheetTabExists(s, id, "canciones");
    try {
      const resC = await getValuesCached(s, { spreadsheetId: id, range: "canciones!A1:P1" });
      if (!resC?.data?.values || resC.data.values.length === 0) {
        const headers = ["id", "titulo", "duracion", "duracion_segundos", "tonalidad", "bpm", "afinacion", "album_disco", "estado_tema", "es_cover", "enlace_acordes", "notas_internas", "audio_principal_url", "portada_url", "audio_ideas_json", "band_id"];
        await s.spreadsheets.values.update({
          spreadsheetId: id,
          range: "canciones!A1:P1",
          valueInputOption: "RAW",
          requestBody: { values: [headers] }
        });
      }
    } catch (_) {}

    await ensureSheetTabExists(s, id, "repertorios");
    try {
      const resR = await getValuesCached(s, { spreadsheetId: id, range: "repertorios!A1:I1" });
      if (!resR?.data?.values || resR.data.values.length === 0) {
        const headers = ["id", "nombre", "descripcion", "tipo_formato", "duracion_estimada_min", "fecha_creacion", "fecha_ultima_edicion", "items_json", "band_id"];
        await s.spreadsheets.values.update({
          spreadsheetId: id,
          range: "repertorios!A1:I1",
          valueInputOption: "RAW",
          requestBody: { values: [headers] }
        });
      }
    } catch (_) {}

    verifiedHeadersSet.add("canciones_y_repertorios");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureTemasYSetlistsSheets] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("canciones_y_repertorios");
      return true;
    }
    console.warn("Notice ensuring canciones & repertorios sheets:", err?.message || err);
    return false;
  }
}

export async function fetchSongsFromSheet(fallback: Song[]): Promise<Song[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    await ensureTemasYSetlistsSheets(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "canciones!A2:P",
    });
    const rows = response.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        console.log("Populating initial canciones to Google Sheet in batch...");
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "canciones!A:P",
          valueInputOption: "RAW",
          requestBody: { values: fallback.map(s => songToRow(s)) }
        }));
        invalidateValuesCache("canciones");
      }
      return fallback;
    }
    const seen = new Set<string>();
    return rows.filter((r: any[]) => r[0] && String(r[0]).trim() !== "").map((r: any[], idx: number) => {
      let id = String(r[0]).trim();
      if (seen.has(id)) id = `${id}-${idx}`;
      seen.add(id);
      return rowToSong(r);
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.warn("Notice reading songs from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function fetchSetlistsFromSheet(fallback: Setlist[]): Promise<Setlist[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;
  try {
    await ensureTemasYSetlistsSheets(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "repertorios!A2:I",
    });
    const rows = response.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        console.log("Populating initial repertorios to Google Sheet in batch...");
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "repertorios!A:I",
          valueInputOption: "RAW",
          requestBody: { values: fallback.map(st => setlistToRow(st)) }
        }));
        invalidateValuesCache("repertorios");
      }
      return fallback;
    }
    const seen = new Set<string>();
    return rows.filter((r: any[]) => r[0] && String(r[0]).trim() !== "").map((r: any[], idx: number) => {
      let id = String(r[0]).trim();
      if (seen.has(id)) id = `${id}-${idx}`;
      seen.add(id);
      return rowToSetlist(r);
    });
  } catch (e: any) {
    if (e?.status !== 429 && e?.code !== 429) {
      console.warn("Notice reading setlists from sheet:", e?.message || e);
    }
    return fallback;
  }
}

export async function updateSongInSheet(song: Song) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "canciones");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "canciones!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === song.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `canciones!A${sheetRowNumber}:P${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [songToRow(song)] }
        });
        invalidateValuesCache("canciones");
        return;
      }
    }
    await appendSongToSheet(song);
  } catch (error) {
    console.error(`Error updating Song ${song.id} in Google Sheet:`, error);
  }
}

export async function appendSongToSheet(song: Song) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "canciones");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "canciones!A:P",
      valueInputOption: "RAW",
      requestBody: { values: [songToRow(song)] }
    });
    invalidateValuesCache("canciones");
  } catch (error) {
    console.error(`Error appending Song ${song.id} to Google Sheet:`, error);
  }
}

export async function deleteSongInSheet(songId: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "canciones");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "canciones!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === songId);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: `canciones!A${sheetRowNumber}:P${sheetRowNumber}`
        });
        invalidateValuesCache("canciones");
      }
    }
  } catch (error) {
    console.error(`Error deleting Song ${songId} in Google Sheet:`, error);
  }
}

export async function updateSetlistInSheet(st: Setlist) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "repertorios");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "repertorios!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === st.id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `repertorios!A${sheetRowNumber}:I${sheetRowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [setlistToRow(st)] }
        });
        invalidateValuesCache("repertorios");
        return;
      }
    }
    await appendSetlistToSheet(st);
  } catch (error) {
    console.error(`Error updating Setlist ${st.id} in Google Sheet:`, error);
  }
}

export async function appendSetlistToSheet(st: Setlist) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "repertorios");
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "repertorios!A:I",
      valueInputOption: "RAW",
      requestBody: { values: [setlistToRow(st)] }
    });
    invalidateValuesCache("repertorios");
  } catch (error) {
    console.error(`Error appending Setlist ${st.id} to Google Sheet:`, error);
  }
}

export async function deleteSetlistInSheet(stId: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;
  try {
    await ensureSheetTabExists(sheets, spreadsheetId, "repertorios");
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "repertorios!A:A",
    }, 5000);
    const rows = response.data?.values;
    if (rows) {
      const rowIndex = rows.findIndex((row: any[]) => row[0] === stId);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 1;
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: `repertorios!A${sheetRowNumber}:I${sheetRowNumber}`
        });
        invalidateValuesCache("repertorios");
      }
    }
  } catch (error) {
    console.error(`Error deleting Setlist ${stId} in Google Sheet:`, error);
  }
}

export function bandToRow(b: any): any[] {
  return [
    b.id || "",
    b.nombre_banda || "",
    b.estilo_musical || "",
    b.localizacion || "",
    b.estado_relacion || "",
    b.ultimo_contacto || "",
    b.contacto_nombre || "",
    b.email || "",
    b.telefono || "",
    b.instagram || "",
    b.spotify_youtube || "",
    b.aforo_promedio || 0,
    b.notas_colaboracion || "",
    b.ciudad_origen_swap || "",
    b.icono || "",
    b.imagen_url || "",
    b.band_id || b.bandId || ""
  ];
}

export function rowToBand(r: any[]): any {
  return {
    id: String(r[0] || ""),
    nombre_banda: String(r[1] || ""),
    estilo_musical: String(r[2] || ""),
    localizacion: String(r[3] || ""),
    estado_relacion: String(r[4] || "sin_contactar"),
    ultimo_contacto: String(r[5] || ""),
    contacto_nombre: String(r[6] || ""),
    email: String(r[7] || ""),
    telefono: String(r[8] || ""),
    instagram: String(r[9] || ""),
    spotify_youtube: String(r[10] || ""),
    aforo_promedio: Number(r[11]) || 0,
    notas_colaboracion: String(r[12] || ""),
    ciudad_origen_swap: String(r[13] || ""),
    icono: String(r[14] || ""),
    imagen_url: String(r[15] || ""),
    band_id: String(r[16] || "")
  };
}

export async function ensureBandasSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("bandas")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "bandas");
    
    const headers = [
      "id", "nombre_banda", "estilo_musical", "localizacion", "estado_relacion", "ultimo_contacto", 
      "contacto_nombre", "email", "telefono", "instagram", "spotify_youtube", "aforo_promedio", 
      "notas_colaboracion", "ciudad_origen_swap", "icono", "imagen_url", "band_id"
    ];
    
    const res = await getValuesCached(s, { spreadsheetId: id, range: "bandas!A1:Q1" });
    if (!res?.data?.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "bandas!A1:Q1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("bandas");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureBandasSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("bandas");
      return true;
    } else {
      console.warn("Notice ensuring bandas sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchBandsFromSheet(fallback: any[]): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "bandas!A2:Q",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "bandas!A:Q",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: fallback.map(b => bandToRow(b)) },
        }));
        invalidateValuesCache("bandas");
      }
      return fallback;
    }
    return rows.map(rowToBand).filter((b: any) => b.id);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading bands from sheet:", err?.message || err);
    }
    return fallback;
  }
}

export async function updateBandInSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "bandas!A2:Q",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === band.id);

    if (rowIndex !== -1) {
      const range = `bandas!A${rowIndex + 2}:Q${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [bandToRow(band)] },
      });
      invalidateValuesCache("bandas");
    } else {
      await appendBandToSheet(band);
    }
  } catch (error) {
    console.error("Error updating band in sheet:", error);
  }
}

export async function appendBandToSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureBandasSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "bandas!A:Q",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [bandToRow(band)] },
    });
    invalidateValuesCache("bandas");
  } catch (error) {
    console.error("Error appending band to sheet:", error);
  }
}

export async function deleteBandInSheet(bandId: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "bandas!A2:Q",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === bandId);

    if (rowIndex !== -1) {
      const range = `bandas!A${rowIndex + 2}:Q${rowIndex + 2}`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
      invalidateValuesCache("bandas");
    }
  } catch (error) {
    console.error("Error deleting band in sheet:", error);
  }
}


// --- TOURS ---

export async function ensureToursSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("tours")) return true;
  const s = sheets || getSheetsClient();
  const id = spreadsheetId || process.env.SPREADSHEET_ID;
  if (!s || !id) return false;

  try {
    await ensureSheetTabExists(s, id, "tours");
    
    // Check headers
    const check = await getValuesCached(s, {
      spreadsheetId: id,
      range: "tours!A1:I1",
    });
    
    if (!check.data?.values || check.data.values.length === 0) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "tours!A1:I1",
        valueInputOption: "RAW",
        requestBody: {
          values: [["ID", "Nombre", "Vehículo", "Estado", "FechaInicio", "FechaFin", "Presupuesto", "Stops (JSON)", "band_id"]]
        }
      }));
      invalidateValuesCache("tours");
    }
    verifiedHeadersSet.add("tours");
    return true;
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.code === 429 || String(error?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureToursSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("tours");
      return true;
    }
    console.warn("Notice ensuring tours sheet:", error.message || error);
    return false;
  }
}

export function tourToRow(tour: any): any[] {
  return [
    tour.id || "",
    tour.nombre || "",
    tour.vehiculo || "",
    tour.estado || "",
    tour.fechaInicio || "",
    tour.fechaFin || "",
    tour.presupuestoLogistica || 0,
    JSON.stringify(tour.stops || []),
    tour.band_id || tour.bandId || ""
  ];
}

export function rowToTour(r: any[]): any {
  let stops = [];
  if (r[7]) {
    try {
      stops = typeof r[7] === "string" ? JSON.parse(r[7]) : r[7];
    } catch {
      stops = [];
    }
  }
  return {
    id: String(r[0] || "").trim(),
    nombre: String(r[1] || "").trim(),
    vehiculo: String(r[2] || "").trim(),
    estado: String(r[3] || "planificacion").trim(),
    fechaInicio: String(r[4] || "").trim(),
    fechaFin: String(r[5] || "").trim(),
    presupuestoLogistica: Number(r[6]) || 0,
    stops,
    band_id: String(r[8] || "").trim()
  };
}

export async function fetchToursFromSheet(fallback: any[]): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureToursSheet(sheets, spreadsheetId);
    
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "tours!A2:I",
    });
    
    const rows = response.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "tours!A:I",
          valueInputOption: "RAW",
          requestBody: { values: fallback.map(t => tourToRow(t)) }
        }));
        invalidateValuesCache("tours");
      }
      return fallback;
    }
    
    return rows.filter((r: any[]) => r[0] && String(r[0]).trim() !== "").map(rowToTour);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading tours from sheet:", err.message);
    }
    return fallback;
  }
}

export async function appendTourToSheet(tour: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureToursSheet(sheets, spreadsheetId);
    await retrySheetsWrite(() => sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "tours!A:I",
      valueInputOption: "RAW",
      requestBody: { values: [tourToRow(tour)] }
    }));
    invalidateValuesCache("tours");
  } catch (error: any) {
    console.error("Error appending tour:", error.message || error);
  }
}

export async function updateTourInSheet(tour: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "tours!A2:A",
    });
    
    const rows = response.data?.values || [];
    const rowIndex = rows.findIndex((r: any[]) => r[0] === tour.id);
    
    if (rowIndex >= 0) {
      const rowNumber = rowIndex + 2;
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `tours!A${rowNumber}:I${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [tourToRow(tour)] }
      }));
      invalidateValuesCache("tours");
    } else {
      await appendTourToSheet(tour);
    }
  } catch (error: any) {
    console.error("Error updating tour:", error.message || error);
  }
}

export async function deleteTourInSheet(id: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "tours!A2:A",
    });
    
    const rows = response.data?.values || [];
    const rowIndex = rows.findIndex((r: any[]) => r[0] === id);
    
    if (rowIndex >= 0) {
      const rowNumber = rowIndex + 2;
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `tours!A${rowNumber}:I${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [Array(9).fill("")] }
      }));
      invalidateValuesCache("tours");
    }
  } catch (error: any) {
    console.error("Error deleting tour:", error.message || error);
  }
}

// --- FANS (SEGUIDORES / TRIBU) ---

export async function ensureFansSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("fans")) return true;
  const s = sheets || getSheetsClient();
  const id = spreadsheetId || getSpreadsheetId();
  if (!s || !id) return false;

  try {
    await ensureSheetTabExists(s, id, "fans");
    const check = await getValuesCached(s, {
      spreadsheetId: id,
      range: "fans!A1:J1",
    });

    const headers = ["id", "nombre", "email", "ciudad", "como_conocio", "concierto_origen_id", "concierto_origen_nombre", "fecha_captura", "consentimiento_rgpd", "band_id"];
    const firstRow = check.data?.values?.[0];

    if (!firstRow || firstRow.length === 0 || !firstRow[0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "fans!A1:J1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [headers]
        }
      }));
      invalidateValuesCache("fans");
    } else if (String(firstRow[0]).trim().toLowerCase() !== "id") {
      const fansSheetId = await getSheetId(s, id, "fans");
      if (fansSheetId !== null) {
        await retrySheetsWrite(() => s.spreadsheets.batchUpdate({
          spreadsheetId: id,
          requestBody: {
            requests: [
              {
                insertDimension: {
                  range: {
                    sheetId: fansSheetId,
                    dimension: "ROWS",
                    startIndex: 0,
                    endIndex: 1
                  },
                  inheritFromBefore: false
                }
              }
            ]
          }
        }));
      }
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "fans!A1:J1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [headers]
        }
      }));
      invalidateValuesCache("fans");
    }
    verifiedHeadersSet.add("fans");
    return true;
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.code === 429 || String(error?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureFansSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("fans");
      return true;
    }
    console.warn("Notice ensuring fans sheet:", error.message || error);
    return false;
  }
}

export function fanToRow(fan: Fan): any[] {
  return [
    fan.id || "",
    fan.nombre || "",
    fan.email || "",
    fan.ciudad || "",
    fan.comoConocio || "",
    fan.conciertoOrigenId || "",
    fan.conciertoOrigenNombre || "",
    fan.fechaCaptura || "",
    fan.consentimientoRGPD ? "SÍ" : "NO",
    fan.band_id || (fan as any).bandId || ""
  ];
}

export function rowToFan(r: any[]): Fan {
  return {
    id: String(r[0] || "").trim(),
    nombre: String(r[1] || "").trim(),
    email: String(r[2] || "").trim(),
    ciudad: String(r[3] || "").trim(),
    comoConocio: String(r[4] || "").trim(),
    conciertoOrigenId: String(r[5] || "").trim(),
    conciertoOrigenNombre: String(r[6] || "").trim(),
    fechaCaptura: String(r[7] || "").trim(),
    consentimientoRGPD: String(r[8]).toUpperCase() === "SÍ" || String(r[8]).toUpperCase() === "SI" || r[8] === true,
    band_id: String(r[9] || "").trim()
  };
}

export async function fetchFansFromSheet(fallback: Fan[]): Promise<Fan[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureFansSheet(sheets, spreadsheetId);

    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "fans!A2:J",
    });

    const rows = response.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "fans!A:J",
          valueInputOption: "RAW",
          requestBody: { values: fallback.map(f => fanToRow(f)) }
        }));
        invalidateValuesCache("fans");
      }
      return fallback;
    }

    return rows.filter((r: any[]) => r[0] && String(r[0]).trim() !== "").map(rowToFan);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading fans from sheet:", err.message);
    }
    return fallback;
  }
}

export async function appendFanToSheet(fan: Fan) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureFansSheet(sheets, spreadsheetId);
    await retrySheetsWrite(() => sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "fans!A:J",
      valueInputOption: "RAW",
      requestBody: { values: [fanToRow(fan)] }
    }));
    invalidateValuesCache("fans");
  } catch (error: any) {
    console.error("Error appending fan to sheet:", error.message || error);
  }
}

export async function deleteFanInSheet(id: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "fans!A2:A",
    });

    const rows = response.data?.values || [];
    const rowIndex = rows.findIndex((r: any[]) => r[0] === id);

    if (rowIndex >= 0) {
      const rowNumber = rowIndex + 2;
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `fans!A${rowNumber}:J${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [Array(10).fill("")] }
      }));
      invalidateValuesCache("fans");
    }
  } catch (error: any) {
    console.error("Error deleting fan in sheet:", error.message || error);
  }
}

// ==================== REGISTRO DE NUEVAS BANDAS ====================

export function registeredBandToRow(b: any): any[] {
  return [
    b.id || "",
    b.fecha_registro || b.createdAt || new Date().toISOString(),
    b.nombre_banda || b.bandName || "",
    b.email || "",
    b.plan || "emergente",
    b.contacto_nombre || b.contactName || b.name || "",
    b.estilo_musical || b.style || "",
    b.localizacion || b.city || "España",
    b.telefono || "",
    b.instagram || "",
    b.spotify_youtube || "",
    b.aforo_promedio || 0,
    b.estado_cuenta || "activo",
    b.notas || "",
    b.band_id || b.bandId || b.id || "band-1",
    b.user_id || b.userId || b.owner_user_id || ""
  ];
}

export function rowToRegisteredBand(r: any[]): any {
  return {
    id: String(r[0] || ""),
    fecha_registro: String(r[1] || ""),
    nombre_banda: String(r[2] || ""),
    email: String(r[3] || ""),
    plan: String(r[4] || "emergente"),
    contacto_nombre: String(r[5] || ""),
    estilo_musical: String(r[6] || ""),
    localizacion: String(r[7] || ""),
    telefono: String(r[8] || ""),
    instagram: String(r[9] || ""),
    spotify_youtube: String(r[10] || ""),
    aforo_promedio: Number(r[11]) || 0,
    estado_cuenta: String(r[12] || "activo"),
    notas: String(r[13] || ""),
    band_id: String(r[14] || r[0] || "band-1"),
    user_id: String(r[15] || "")
  };
}

export async function ensureRegistroBandasSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("registro_bandas")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "registro_bandas");
    
    const headers = [
      "id", "fecha_registro", "nombre_banda", "email", "plan",
      "contacto_nombre", "estilo_musical", "localizacion", "telefono",
      "instagram", "spotify_youtube", "aforo_promedio", "estado_cuenta", "notas", "band_id", "user_id"
    ];
    
    const res = await getValuesCached(s, { spreadsheetId: id, range: "registro_bandas!A1:P1" });
    if (!res?.data?.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "registro_bandas!A1:P1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("registro_bandas");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureRegistroBandasSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("registro_bandas");
      return true;
    } else {
      console.warn("Notice ensuring registro_bandas sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchRegisteredBandsFromSheet(fallback: any[] = []): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureRegistroBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "registro_bandas!A2:P",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "registro_bandas!A:P",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: fallback.map(b => registeredBandToRow(b)) },
        }));
        invalidateValuesCache("registro_bandas");
      }
      return fallback;
    }
    return rows.map(rowToRegisteredBand).filter((b: any) => b.id);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading registered bands from sheet:", err?.message || err);
    }
    return fallback;
  }
}

export async function appendRegisteredBandToSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureRegistroBandasSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "registro_bandas!A:P",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [registeredBandToRow(band)] },
    });
    invalidateValuesCache("registro_bandas");
  } catch (error) {
    console.error("Error appending registered band to sheet:", error);
  }
}

export async function updateRegisteredBandInSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureRegistroBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "registro_bandas!A2:P",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === band.id || row[1] === band.band_id);

    if (rowIndex !== -1) {
      const range = `registro_bandas!A${rowIndex + 2}:P${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [registeredBandToRow(band)] },
      });
      invalidateValuesCache("registro_bandas");
    } else {
      await appendRegisteredBandToSheet(band);
    }
  } catch (error) {
    console.error("Error updating registered band in sheet:", error);
  }
}

export function userToRow(u: any): any[] {
  return [
    u.id || "",
    u.username || u.email || "",
    u.name || u.bandName || "",
    u.email || u.username || "",
    u.role || "member",
    u.plan || "emergente",
    u.instrument || "Músico",
    u.avatarColor || "#3b82f6",
    u.createdAt || new Date().toISOString(),
    u.band_id || u.bandId || u.id || "band-1",
    u.passwordHash || "",
    u.salt || ""
  ];
}

export function rowToUser(r: any[]): any {
  return {
    id: String(r[0] || ""),
    username: String(r[1] || ""),
    name: String(r[2] || ""),
    email: String(r[3] || ""),
    role: String(r[4] || "member"),
    plan: String(r[5] || "emergente"),
    instrument: String(r[6] || "Músico"),
    avatarColor: String(r[7] || "#3b82f6"),
    createdAt: String(r[8] || ""),
    band_id: String(r[9] || r[0] || "band-1"),
    passwordHash: String(r[10] || ""),
    salt: String(r[11] || "")
  };
}


export function userBandToRow(ub: any): any[] {
  return [
    ub.id || "",
    ub.user_id || "",
    ub.band_id || "",
    ub.role || "member",
    ub.createdAt || new Date().toISOString()
  ];
}

export function rowToUserBand(r: any[]): any {
  return {
    id: String(r[0] || ""),
    user_id: String(r[1] || ""),
    band_id: String(r[2] || ""),
    role: String(r[3] || "member"),
    createdAt: String(r[4] || "")
  };
}

export async function ensureUsuariosBandasSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("usuarios_bandas")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "usuarios_bandas");
    
    const headers = ["id", "user_id", "band_id", "role", "createdAt"];
    
    const res = await getValuesCached(s, { spreadsheetId: id, range: "usuarios_bandas!A1:E1" });
    if (!res?.data?.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "usuarios_bandas!A1:E1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("usuarios_bandas");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureUsuariosBandasSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("usuarios_bandas");
      return true;
    } else {
      console.warn("Notice ensuring usuarios_bandas sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchUserBandsFromSheet(fallback: any[] = []): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios_bandas!A2:E",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "usuarios_bandas!A:E",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: fallback.map(userBandToRow) },
        }));
      }
      return fallback;
    }
    return rows.map(rowToUserBand).filter(ub => ub.id && ub.user_id && ub.band_id);
  } catch (error) {
    console.error("Error fetching user bands from sheet:", error);
    return fallback;
  }
}

export async function appendUserBandToSheet(userBand: any): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "usuarios_bandas!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [userBandToRow(userBand)] },
    });
    invalidateValuesCache("usuarios_bandas");
  } catch (error) {
    console.error("Error appending user band to sheet:", error);
  }
}

export async function updateUserBandInSheet(userBand: any): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios_bandas!A2:E",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === userBand.id);
    if (rowIndex !== -1) {
      const range = `usuarios_bandas!A${rowIndex + 2}:E${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [userBandToRow(userBand)] },
      });
      invalidateValuesCache("usuarios_bandas");
    } else {
      await appendUserBandToSheet(userBand);
    }
  } catch (error) {
    console.error("Error updating user band in sheet:", error);
  }
}

export async function deleteUserBandInSheet(userBandId: string): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios_bandas!A2:E",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === userBandId);
    if (rowIndex !== -1) {
      const range = `usuarios_bandas!A${rowIndex + 2}:E${rowIndex + 2}`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
      invalidateValuesCache("usuarios_bandas");
    }
  } catch (error) {
    console.error("Error deleting user band in sheet:", error);
  }
}

export async function ensureUsuariosSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("usuarios")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "usuarios");
    
    const headers = [
      "id", "username", "name", "email", "role", "plan",
      "instrument", "avatarColor", "createdAt", "band_id", "password_hash", "salt"
    ];
    
    const res = await getValuesCached(s, { spreadsheetId: id, range: "usuarios!A1:L1" });
    if (!res?.data?.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "usuarios!A1:L1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("usuarios");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureUsuariosSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("usuarios");
      return true;
    } else {
      console.warn("Notice ensuring usuarios sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchUsersFromSheet(fallback: any[] = []): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureUsuariosSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios!A2:L",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "usuarios!A:L",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: fallback.map(u => userToRow(u)) },
        }));
        invalidateValuesCache("usuarios");
      }
      return fallback;
    }
    return rows.map(rowToUser).filter((u: any) => u.id);
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading users from sheet:", err?.message || err);
    }
    return fallback;
  }
}

export async function appendUserToSheet(user: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "usuarios!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [userToRow(user)] },
    });
    invalidateValuesCache("usuarios");
  } catch (error) {
    console.error("Error appending user to sheet:", error);
  }
}

export async function updateUserInSheet(user: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios!A2:L",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === user.id || row[1] === user.username);

    if (rowIndex !== -1) {
      const range = `usuarios!A${rowIndex + 2}:L${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [userToRow(user)] },
      });
      invalidateValuesCache("usuarios");
    } else {
      await appendUserToSheet(user);
    }
  } catch (error) {
    console.error("Error updating user in sheet:", error);
  }
}

export async function deleteUserInSheet(userId: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios!A2:J",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === userId);

    if (rowIndex !== -1) {
      const range = `usuarios!A${rowIndex + 2}:J${rowIndex + 2}`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
      invalidateValuesCache("usuarios");
    }
  } catch (error) {
    console.error("Error deleting user from sheet:", error);
  }
}

export function epkConfigToRow(bandId: string, epk: any): any[] {
  return [
    bandId || "band-bakandeya",
    epk.biografia || "",
    epk.logoUrl || "",
    epk.dossierPdfUrl || "",
    epk.dossierPdfName || "",
    epk.dossierTextoExtra || "",
    epk.riderTecnico || "",
    epk.riderPdfUrl || "",
    epk.riderPdfName || "",
    epk.contactoBooking?.nombre || "",
    epk.contactoBooking?.email || "",
    epk.contactoBooking?.telefono || "",
    epk.enlacesRedes?.spotify || "",
    epk.enlacesRedes?.youtube || "",
    epk.enlacesRedes?.instagram || "",
    epk.enlacesRedes?.tiktok || "",
    JSON.stringify(epk.temasDestacadosIds || []),
    new Date().toISOString()
  ];
}

export function rowToEpkConfig(r: any[]): { bandId: string; epk: any } {
  let temas: string[] = [];
  try {
    if (r[16]) temas = JSON.parse(r[16]);
  } catch (e) {
    if (typeof r[16] === 'string') temas = r[16].split(',').map((s: string) => s.trim());
  }
  return {
    bandId: r[0] || "band-bakandeya",
    epk: {
      biografia: r[1] || "",
      logoUrl: r[2] || "",
      dossierPdfUrl: r[3] || "",
      dossierPdfName: r[4] || "",
      dossierTextoExtra: r[5] || "",
      riderTecnico: r[6] || "",
      riderPdfUrl: r[7] || "",
      riderPdfName: r[8] || "",
      contactoBooking: {
        nombre: r[9] || "",
        email: r[10] || "",
        telefono: r[11] || "",
      },
      enlacesRedes: {
        spotify: r[12] || "",
        youtube: r[13] || "",
        instagram: r[14] || "",
        tiktok: r[15] || "",
      },
      temasDestacadosIds: temas
    }
  };
}

export async function ensureEpkSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  const s = sheets || getSheetsClient();
  const id = spreadsheetId || getSpreadsheetId();
  if (!s || !id) return false;

  if (verifiedHeadersSet.has("dossier_epk")) return true;

  try {
    await ensureSheetTabExists(s, id, "dossier_epk");

    const response = await getValuesCached(s, {
      spreadsheetId: id,
      range: "dossier_epk!A1:R1",
    });

    const rows = response?.data?.values;
    if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0) {
      const headers = [
        "band_id", "biografia", "logo_url", "dossier_pdf_url", "dossier_pdf_name", "dossier_texto_extra", "rider_tecnico", "rider_pdf_url", "rider_pdf_name", "contacto_nombre", "contacto_email", "contacto_telefono", "spotify_url", "youtube_url", "instagram_url", "tiktok_url", "temas_destacados", "fecha_actualizacion"
      ];
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "dossier_epk!A1:R1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("dossier_epk");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureEpkSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("dossier_epk");
      return true;
    } else {
      console.warn("Notice ensuring dossier_epk sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchEpkConfigsFromSheet(fallbackMap: Record<string, any> = {}): Promise<Record<string, any>> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallbackMap;

  try {
    await ensureEpkSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "dossier_epk!A2:R",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallbackMap && Object.keys(fallbackMap).length > 0) {
        const rowsToWrite = Object.entries(fallbackMap).map(([bId, config]) => epkConfigToRow(bId, config));
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "dossier_epk!A:R",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: rowsToWrite },
        }));
        invalidateValuesCache("dossier_epk");
      }
      return fallbackMap;
    }

    const result: Record<string, any> = { ...fallbackMap };
    for (const r of rows) {
      if (r && r[0]) {
        const parsed = rowToEpkConfig(r);
        const existingEpk = result[parsed.bandId] || {};
        const mergedEpk: Record<string, any> = { ...existingEpk };
        for (const [k, v] of Object.entries(parsed.epk)) {
          if (v !== undefined && v !== null && v !== "") {
            mergedEpk[k] = v;
          } else if (mergedEpk[k] === undefined || mergedEpk[k] === null || mergedEpk[k] === "") {
            mergedEpk[k] = v;
          }
        }
        result[parsed.bandId] = mergedEpk;
      }
    }
    return result;
  } catch (err: any) {
    if (err?.status !== 429 && err?.code !== 429) {
      console.warn("Notice reading dossier_epk from sheet:", err?.message || err);
    }
    return fallbackMap;
  }
}

export async function updateEpkInSheet(bandId: string, epkConfig: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureEpkSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "dossier_epk!A2:R",
    });
    const rows = response.data.values || [];
    const targetId = bandId || "band-bakandeya";
    const rowIndex = rows.findIndex((row: any) => row[0] === targetId);

    if (rowIndex !== -1) {
      const range = `dossier_epk!A${rowIndex + 2}:R${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [epkConfigToRow(targetId, epkConfig)] },
      });
      invalidateValuesCache("dossier_epk");
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "dossier_epk!A:R",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [epkConfigToRow(targetId, epkConfig)] },
      });
      invalidateValuesCache("dossier_epk");
    }
  } catch (error) {
    console.error("Error updating dossier_epk in sheet:", error);
  }
}

export function autonomyConfigToRow(bandId: string, autonomy: any): any[] {
  return [
    bandId || "band-bakandeya",
    autonomy.dispatchLevel || "draft_only",
    autonomy.negotiationDepth || "filter_conditions",
    autonomy.minCacheThreshold ?? 300,
    autonomy.maxCacheThreshold ?? 800,
    autonomy.autoDeclineUnderMinCache ? "true" : "false",
    autonomy.notifyOnEveryProposal !== false ? "true" : "false",
    autonomy.requireHumanForFinalSignOff !== false ? "true" : "false",
    new Date().toISOString()
  ];
}

export function rowToAutonomyConfig(r: any[]): { bandId: string; autonomy: any } {
  return {
    bandId: r[0] || "band-bakandeya",
    autonomy: {
      dispatchLevel: r[1] || "draft_only",
      negotiationDepth: r[2] || "filter_conditions",
      minCacheThreshold: r[3] ? parseInt(r[3], 10) : 300,
      maxCacheThreshold: r[4] ? parseInt(r[4], 10) : 800,
      autoDeclineUnderMinCache: String(r[5]).toLowerCase() === "true",
      notifyOnEveryProposal: String(r[6]).toLowerCase() !== "false",
      requireHumanForFinalSignOff: String(r[7]).toLowerCase() !== "false"
    }
  };
}

export async function ensureAutonomiaSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  const s = sheets || getSheetsClient();
  const id = spreadsheetId || getSpreadsheetId();
  if (!s || !id) return false;

  if (verifiedHeadersSet.has("config_autonomia")) return true;

  try {
    await ensureSheetTabExists(s, id, "config_autonomia");

    const response = await getValuesCached(s, {
      spreadsheetId: id,
      range: "config_autonomia!A1:I1",
    });

    const rows = response?.data?.values;
    if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0) {
      const headers = [
        "band_id", "modo_envio", "profundidad_negociacion", "cache_minimo", "cache_objetivo", "auto_rechazar_bajo_minimo", "notificar_propuestas", "requiere_firma_humana", "fecha_actualizacion"
      ];
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "config_autonomia!A1:I1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("config_autonomia");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureAutonomiaSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("config_autonomia");
      return true;
    } else {
      console.warn("Notice ensuring config_autonomia sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchAutonomyConfigsFromSheet(fallbackMap: Record<string, any> = {}): Promise<Record<string, any>> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallbackMap;

  try {
    await ensureAutonomiaSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "config_autonomia!A2:I",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallbackMap && Object.keys(fallbackMap).length > 0) {
        const rowsToWrite = Object.entries(fallbackMap).map(([bId, config]) => autonomyConfigToRow(bId, config));
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "config_autonomia!A:I",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: rowsToWrite },
        }));
        invalidateValuesCache("config_autonomia");
      }
      return fallbackMap;
    }

    const result: Record<string, any> = { ...fallbackMap };
    for (const r of rows) {
      if (r && r[0]) {
        const parsed = rowToAutonomyConfig(r);
        const existing = result[parsed.bandId] || {};
        const merged: Record<string, any> = { ...existing };
        for (const [k, v] of Object.entries(parsed.autonomy)) {
          if (v !== undefined && v !== null && v !== "") {
            merged[k] = v;
          }
        }
        result[parsed.bandId] = merged;
      }
    }
    return result;
  } catch (err: any) {
    console.warn("Notice reading config_autonomia from sheet:", err?.message || err);
    return fallbackMap;
  }
}

export async function updateAutonomyInSheet(bandId: string, autonomyConfig: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureAutonomiaSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "config_autonomia!A2:I",
    });
    const rows = response.data.values || [];
    const targetId = bandId || "band-bakandeya";
    const rowIndex = rows.findIndex((row: any) => row[0] === targetId);

    if (rowIndex !== -1) {
      const range = `config_autonomia!A${rowIndex + 2}:I${rowIndex + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [autonomyConfigToRow(targetId, autonomyConfig)] },
      });
      invalidateValuesCache("config_autonomia");
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "config_autonomia!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [autonomyConfigToRow(targetId, autonomyConfig)] },
      });
      invalidateValuesCache("config_autonomia");
    }
  } catch (error) {
    console.error("Error updating config_autonomia in sheet:", error);
  }
}

export async function syncAllTabsWithBakandeya(state: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  const bandId = "band-bakandeya";

  try {
    // 1. registro_bandas
    await ensureRegistroBandasSheet(sheets, spreadsheetId);
    if (state.registeredBands && state.registeredBands.length > 0) {
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "registro_bandas!A2:P",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: state.registeredBands.map((b: any) => registeredBandToRow({ ...b, band_id: bandId })) }
      }));
    }

    // 2. usuarios
    await ensureUsuariosSheet(sheets, spreadsheetId);
    if (state.users && state.users.length > 0) {
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "usuarios!A2:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: state.users.map((u: any) => userToRow({ ...u, band_id: bandId })) }
      }));
    }

    // 2b. usuarios_bandas
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    if (state.userBands && state.userBands.length > 0) {
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "usuarios_bandas!A2:E",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: state.userBands.map((ub: any) => userBandToRow(ub)) }
      }));
    }

    // 3. leads & hilos_emails
    if (state.leads && state.leads.length > 0) {
      const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");
      const headers = DEFAULT_LEADS_HEADERS;
      const leadRows = state.leads.map((l: any) => leadToRowDynamic({ ...l, band_id: bandId }, headers, hilosSheetId));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "leads!A2",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: leadRows }
      }));

      await bootstrapHilosEmailsSheet(sheets, spreadsheetId, state.leads.map((l: any) => ({ ...l, band_id: bandId })));
    }

    // 4. ensayos
    if (state.rehearsals && state.rehearsals.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "ensayos");
      const rows = state.rehearsals.map((r: any) => rehearsalToRow({ ...r, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "ensayos!A2:M",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 5. conciertos
    if (state.concerts && state.concerts.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "conciertos");
      const rows = state.concerts.map((c: any) => concertToRow({ ...c, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "conciertos!A2:N",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 6. redes_sociales
    if (state.posts && state.posts.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "redes_sociales");
      const rows = state.posts.map((p: any) => socialPostToRow({ ...p, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "redes_sociales!A2:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 7. finanzas
    if (state.payments && state.payments.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "finanzas");
      const rows = state.payments.map((p: any) => paymentToRow({ ...p, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "finanzas!A2:K",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 8. seguidores
    if (state.metrics && state.metrics.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "seguidores");
      const rows = state.metrics.map((m: any) => socialMetricToRow({ ...m, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "seguidores!A2:G",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 9. canciones
    if (state.songs && state.songs.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "canciones");
      const rows = state.songs.map((s: any) => songToRow({ ...s, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "canciones!A2:P",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 10. repertorios
    if (state.setlists && state.setlists.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "repertorios");
      const rows = state.setlists.map((st: any) => setlistToRow({ ...st, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "repertorios!A2:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 11. tours
    if (state.tours && state.tours.length > 0) {
      await ensureToursSheet(sheets, spreadsheetId);
      const rows = state.tours.map((t: any) => tourToRow({ ...t, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "tours!A2:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 12. fans
    if (state.fans && state.fans.length > 0) {
      await ensureFansSheet(sheets, spreadsheetId);
      const rows = state.fans.map((f: any) => fanToRow({ ...f, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "fans!A2:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 13. bandas
    if (state.bands && state.bands.length > 0) {
      await ensureBandasSheet(sheets, spreadsheetId);
      const rows = state.bands.map((b: any) => bandToRow({ ...b, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "bandas!A2:Q",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 14. logistics (runOfShow & gearChecklists)
    if (state.runOfShow || state.gearChecklists) {
      await syncLogisticsToSheet(
        Object.fromEntries(
          Object.entries(state.runOfShow || {}).map(([k, list]: [string, any]) => [
            k,
            list.map((item: any) => ({ ...item, band_id: bandId }))
          ])
        ),
        Object.fromEntries(
          Object.entries(state.gearChecklists || {}).map(([k, list]: [string, any]) => [
            k,
            list.map((item: any) => ({ ...item, band_id: bandId }))
          ])
        )
      );
    }

    // 15. dossier_epk
    if (state.epkConfigsByBand && Object.keys(state.epkConfigsByBand).length > 0) {
      await ensureEpkSheet(sheets, spreadsheetId);
      const rows = Object.entries(state.epkConfigsByBand).map(([bId, cfg]: [string, any]) => epkConfigToRow(bId, cfg));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "dossier_epk!A2:R",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 16. config_autonomia
    if (state.autonomyConfigsByBand && Object.keys(state.autonomyConfigsByBand).length > 0) {
      await ensureAutonomiaSheet(sheets, spreadsheetId);
      const rows = Object.entries(state.autonomyConfigsByBand).map(([bId, cfg]: [string, any]) => autonomyConfigToRow(bId, cfg));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "config_autonomia!A2:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    invalidateValuesCache();
    console.log("[Google Sheets] All tabs successfully updated with band_id = band-bakandeya!");
  } catch (err: any) {
    console.warn("Notice syncing sheets with band_id:", err?.message || err);
  }
}



