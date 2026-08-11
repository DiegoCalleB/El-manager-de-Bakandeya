import express from "express";
import path from "path";
import crypto from "crypto";
import * as XLSX from "xlsx";

import { Lead, Concert, SocialPost, Payment, Rehearsal, Song, Setlist } from "./src/types";

import { getSafeUsers, getUserFromRequest } from "./server/auth.js";
import {
  getSheetsClient,
  getSpreadsheetId,
  parsePrivateKey,
  fetchLeadsFromSheet,
  fetchRehearsalsFromSheet,
  fetchConcertsFromSheet,
  fetchPostsFromSheet,
  fetchPaymentsFromSheet,
  fetchMetricsFromSheet,
  fetchLogisticsFromSheet,
  fetchSongsFromSheet,
  fetchSetlistsFromSheet,
  fetchBandsFromSheet,
  fetchToursFromSheet,
  fetchFansFromSheet,
  fetchRegisteredBandsFromSheet,
  ensureTemasYSetlistsSheets,
  ensureFansSheet,
  ensureBandasSheet,
  ensureToursSheet,
  ensureRegistroBandasSheet,
  ensureUsuariosSheet,
  ensureAutonomiaSheet,
  syncAllTabsWithBakandeya
} from "./server/sheets.js";
import { loadState, saveState, getEpkConfigForBand, ensureUniqueIdsInState } from "./server/state.js";

import usersRouter from "./server/routes/users.js";
import postsRouter from "./server/routes/posts.js";
import metricsRouter from "./server/routes/metrics.js";
import chatRouter from "./server/routes/chat.js";
import leadsRouter from "./server/routes/leads.js";
import concertsRouter from "./server/routes/concerts.js";
import bandsRouter from "./server/routes/bands.js";
import toursRouter from "./server/routes/tours.js";
import agentRouter from "./server/routes/agent.js";
import reelsRouter from "./server/routes/reels.js";
import repertorioRouter from "./server/routes/repertorio.js";
import epkFansRouter from "./server/routes/epk_fans.js";
import uploadRouter from "./server/routes/upload.js";
import concertToAlbumRouter from "./server/routes/concert_to_album.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Mount modular Express routers
app.use("/api", usersRouter);
app.use("/api", postsRouter);
app.use("/api", metricsRouter);
app.use("/api", chatRouter);
app.use("/api", leadsRouter);
app.use("/api", concertsRouter);
app.use("/api", bandsRouter);
app.use("/api", toursRouter);
app.use("/api", agentRouter);
app.use("/api", reelsRouter);
app.use("/api", repertorioRouter);
app.use("/api", epkFansRouter);
app.use("/api/concert-to-album", concertToAlbumRouter);
app.use("/api/upload", uploadRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Healthcheck endpoint for Railway and deployment monitoring
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// System status endpoint
app.get("/api/debug-key", (req, res) => {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || process.env.PRIVATE_KEY || "";
  const parsedKey = parsePrivateKey(rawKey);
  let works = false;
  let keyTypeInfo = "";

  if (parsedKey) {
    try {
      const pKey = crypto.createPrivateKey(parsedKey);
      keyTypeInfo = `${pKey.type} - ${pKey.asymmetricKeyType}`;
      works = true;
    } catch {
      // ignore
    }
  }

  res.json({
    configured: works,
    keyTypeInfo
  });
});

app.get("/api/check-sheets", async (req, res) => {
  const email = (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.SERVICE_ACCOUNT_EMAIL ||
    process.env.CLIENT_EMAIL ||
    ""
  ).trim();

  const rawKey = (
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    process.env.GCP_SA_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_CREDENTIALS ||
    process.env.GOOGLE_SHEETS_CREDENTIALS ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    ""
  );

  const spreadsheetId = getSpreadsheetId();

  const missing: string[] = [];
  if (!email && !rawKey.includes("client_email")) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!rawKey) missing.push("GOOGLE_PRIVATE_KEY");
  if (!spreadsheetId) missing.push("SPREADSHEET_ID");

  if (missing.length > 0) {
    return res.json({
      configured: false,
      error: `Faltan las siguientes variables de entorno para la integración con Google Sheets: ${missing.join(", ")}. Asegúrate de configurarlas en el menú de Secrets / Settings de AI Studio.`,
      missing
    });
  }

  const sheets = getSheetsClient();
  if (!sheets) {
    return res.json({
      configured: false,
      error: "No se pudo formatear la clave privada (GOOGLE_PRIVATE_KEY) o las credenciales de la Service Account. Verifica que en AI Studio Secrets la clave o el JSON contengan las credenciales PEM o JSON válidas."
    });
  }

  if (!spreadsheetId) {
    return res.json({
      configured: false,
      error: "No se encontró un SPREADSHEET_ID válido. Por favor ingresa el ID o la URL completa del Google Sheet en los Secrets de AI Studio."
    });
  }

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = meta.data.sheets || [];
    const existingTabs = sheetsList.map((s: any) => s.properties.title);
    
    const required = ["registro_bandas", "usuarios", "leads", "ensayos", "conciertos", "redes_sociales", "finanzas", "seguidores", "hilos_emails", "logistica_horarios", "logistica_equipo", "canciones", "repertorios", "fans", "bandas", "tours", "dossier_epk", "config_autonomia"];
    const status: Record<string, boolean> = {};
    const created: string[] = [];

    await ensureTemasYSetlistsSheets(sheets, spreadsheetId);
    await ensureFansSheet(sheets, spreadsheetId);
    await ensureBandasSheet(sheets, spreadsheetId);
    await ensureToursSheet(sheets, spreadsheetId);
    await ensureRegistroBandasSheet(sheets, spreadsheetId);
    await ensureUsuariosSheet(sheets, spreadsheetId);
    await ensureAutonomiaSheet(sheets, spreadsheetId);

    for (const tab of required) {
      if (existingTabs.includes(tab)) {
        status[tab] = true;
      } else {
        status[tab] = false;
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: tab,
                    }
                  }
                }
              ]
            }
          });
          status[tab] = true;
          created.push(tab);
        } catch (e: any) {
          console.error(`Error al intentar crear la pestaña '${tab}':`, e.message || e);
        }
      }
    }

    // Synchronize all tabs in Google Sheets with band_id = band-bakandeya
    const currentState = loadState();
    syncAllTabsWithBakandeya(currentState).catch(err => {
      console.warn("Async sync with Google Sheets failed or skipped:", err);
    });

    res.json({
      configured: true,
      spreadsheetId,
      existingTabs,
      status,
      created
    });
  } catch (error: any) {
    console.error("Error checking Google Sheets:", error);
    res.status(500).json({
      configured: true,
      error: error.message || "Fallo al conectar con la API de Google Sheets. Verifica que el Spreadsheet ID sea correcto y que hayas compartido la hoja con permisos de Editor al email de la Service Account."
    });
  }
});

app.all("/api/sync-bakandeya", async (req, res) => {
  try {
    const currentState = loadState();
    await syncAllTabsWithBakandeya(currentState);
    res.json({ success: true, message: "Todas las hojas de Google Sheets han sido actualizadas con la banda Bakandeya y su band_id ('band-bakandeya')." });
  } catch (err: any) {
    console.error("Error syncing Bakandeya to Google Sheets:", err);
    res.status(500).json({ success: false, error: err.message || "Error al sincronizar con Google Sheets" });
  }
});

app.get("/api/download-excel", (req, res) => {
  try {
    const state = loadState();
    const wb = XLSX.utils.book_new();

    const rehearsalsData = (state.rehearsals || []).map((r: Rehearsal) => ({
      ID: r.id,
      Fecha: r.fecha,
      Hora: r.hora,
      Lugar: r.lugar,
      Asistentes: Array.isArray(r.asistentes) ? r.asistentes.join(", ") : r.asistentes,
      Estado: r.estado,
      Notas: r.notas || ""
    }));
    const wsRehearsals = XLSX.utils.json_to_sheet(rehearsalsData);
    XLSX.utils.book_append_sheet(wb, wsRehearsals, "Ensayos");

    const concertsData = (state.concerts || []).map((c: Concert) => ({
      ID: c.id,
      Fecha: c.fecha,
      Ciudad: c.ciudad,
      Sala: c.sala,
      Caché: c.cache,
      "Aforo Vendido": c.aforo_vendido,
      "Aforo Total": c.aforo_total,
      "Contrato Firmado": c.contrato_firmado ? "SÍ" : "NO",
      "Estado Pago": c.estado_pago,
      Tipo: c.tipo,
      Notas: c.notas || "",
      band_id: (c as any).band_id || (c as any).bandId || "band-1"
    }));
    const wsConcerts = XLSX.utils.json_to_sheet(concertsData);
    XLSX.utils.book_append_sheet(wb, wsConcerts, "Conciertos");

    const leadsData = (state.leads || []).map((l: Lead) => ({
      ID: l.id,
      "Nombre Sala": l.nombre_sala,
      Ciudad: l.ciudad,
      Región: l.region,
      Aforo: l.aforo,
      Género: l.genero,
      Email: l.email_contacto,
      Teléfono: l.telefono,
      Web: l.website,
      Instagram: l.instagram,
      Fuente: l.fuente,
      Estado: l.estado,
      Notas: l.notas || "",
      band_id: (l as any).band_id || (l as any).bandId || "band-1"
    }));
    const wsLeads = XLSX.utils.json_to_sheet(leadsData);
    XLSX.utils.book_append_sheet(wb, wsLeads, "Salas_Leads");

    const paymentsData = (state.payments || []).map((p: Payment) => ({
      ID: p.id,
      Fecha: p.fecha,
      Concepto: p.concepto,
      Importe: p.importe,
      Tipo: p.tipo,
      Categoría: p.categoria,
      Estado: p.estado,
      band_id: (p as any).band_id || (p as any).bandId || "band-1"
    }));
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, wsPayments, "Finanzas_Pagos");

    const postsData = (state.posts || []).map((p: SocialPost) => ({
      ID: p.id,
      Fecha: p.fecha,
      Plataforma: p.plataforma,
      Contenido: p.contenido,
      Responsable: p.responsable,
      Estado: p.estado,
      band_id: (p as any).band_id || (p as any).bandId || "band-1"
    }));
    const wsPosts = XLSX.utils.json_to_sheet(postsData);
    XLSX.utils.book_append_sheet(wb, wsPosts, "Redes_Sociales");

    const runOfShowRows: any[] = [];
    if (state.runOfShow) {
      Object.entries(state.runOfShow).forEach(([dateKey, items]: [string, any]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            runOfShowRows.push({
              Fecha: dateKey,
              ID: item.id,
              Hora: item.time,
              "Actividad / Horario": item.activity,
              Completado: item.done ? "SÍ" : "NO",
              band_id: item.band_id || item.bandId || "band-1"
            });
          });
        }
      });
    }
    const wsRunOfShow = XLSX.utils.json_to_sheet(runOfShowRows);
    XLSX.utils.book_append_sheet(wb, wsRunOfShow, "Logistica_Horarios");

    const gearRows: any[] = [];
    if (state.gearChecklists) {
      Object.entries(state.gearChecklists).forEach(([dateKey, items]: [string, any]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            gearRows.push({
              Fecha: dateKey,
              ID: item.id,
              "Material / Equipo a Llevar": item.label,
              "Cargado / Listo": item.checked ? "SÍ" : "NO",
              band_id: item.band_id || item.bandId || "band-1"
            });
          });
        }
      });
    }
    const wsGear = XLSX.utils.json_to_sheet(gearRows);
    XLSX.utils.book_append_sheet(wb, wsGear, "Logistica_Equipo");

    const songsData = (state.songs || []).map((s: Song) => ({
      ID: s.id,
      Título: s.titulo,
      Duración: s.duracion,
      Tonalidad: s.tonalidad,
      BPM: s.bpm,
      Afinación: s.afinacion || "",
      Álbum: s.albumDisco || "",
      Estado: s.estadoTema || "listo",
      "Es Cover": s.esVersionCovers ? "SÍ" : "NO",
      Acordes: s.enlaceAcordes || "",
      Notas: s.notasInternas || "",
      band_id: (s as any).band_id || (s as any).bandId || "band-1"
    }));
    const wsSongs = XLSX.utils.json_to_sheet(songsData);
    XLSX.utils.book_append_sheet(wb, wsSongs, "Canciones");

    const setlistsData = (state.setlists || []).map((st: Setlist) => ({
      ID: st.id,
      Nombre: st.nombre,
      Descripción: st.descripcion || "",
      Formato: st.tipoFormato || "",
      "Duración (min)": st.duracionTotalEstimadaMinutos || 0,
      "Fecha Creación": st.fechaCreacion,
      "Última Edición": st.fechaUltimaEdicion,
      "Número Temas": st.items?.length || 0,
      band_id: (st as any).band_id || (st as any).bandId || "band-1"
    }));
    const wsSetlists = XLSX.utils.json_to_sheet(setlistsData);
    XLSX.utils.book_append_sheet(wb, wsSetlists, "Repertorios");

    const fansData = (state.fans || []).map((f: any) => ({
      ID: f.id,
      Nombre: f.nombre,
      Email: f.email,
      Ciudad: f.ciudad || "",
      "Cómo conoció": f.comoConocio || "",
      Concierto: f.conciertoOrigenNombre || "",
      "Fecha Captura": f.fechaCaptura || "",
      RGPD: f.consentimientoRGPD ? "SÍ" : "NO",
      band_id: f.band_id || f.bandId || "band-1"
    }));
    const wsFans = XLSX.utils.json_to_sheet(fansData);
    XLSX.utils.book_append_sheet(wb, wsFans, "Fans_Tribu");

    const toursData = (state.tours || []).map((t: any) => ({
      ID: t.id,
      Nombre: t.nombre,
      Vehículo: t.vehiculo,
      Estado: t.estado,
      "Fecha Inicio": t.fechaInicio,
      "Fecha Fin": t.fechaFin,
      "Presupuesto Logística": t.presupuestoLogistica || 0,
      "Número Paradas": t.stops?.length || 0,
      band_id: t.band_id || t.bandId || "band-1"
    }));
    const wsTours = XLSX.utils.json_to_sheet(toursData);
    XLSX.utils.book_append_sheet(wb, wsTours, "Giras");

    const registeredBandsData = (state.registeredBands || state.users || []).map((b: any) => ({
      ID: b.id || b.band_id,
      "Fecha Registro": b.fecha_registro || b.createdAt || "",
      "Nombre Banda": b.nombre_banda || b.bandName || b.name || "",
      Email: b.email || b.username || "",
      Plan: b.plan || b.selectedPlan || "emergente",
      Contacto: b.contacto_nombre || b.name || "",
      "Estilo Musical": b.estilo_musical || b.style || "",
      Localización: b.localizacion || b.city || "España",
      Teléfono: b.telefono || "",
      Instagram: b.instagram || "",
      "Spotify/YouTube": b.spotify_youtube || "",
      "Estado Cuenta": b.estado_cuenta || "activo",
      Notas: b.notas || "",
      band_id: b.band_id || b.bandId || b.id || "band-1"
    }));
    const wsRegisteredBands = XLSX.utils.json_to_sheet(registeredBandsData);
    XLSX.utils.book_append_sheet(wb, wsRegisteredBands, "Registro_Bandas");

    const usersData = (state.users || []).map((u: any) => ({
      ID: u.id,
      "Usuario/Email": u.username || u.email,
      Nombre: u.name || u.bandName,
      Rol: u.role,
      Plan: u.plan || "emergente",
      Instrumento: u.instrument || "Músico",
      "Fecha Creación": u.createdAt || "",
      band_id: u.band_id || u.bandId || u.id || "band-1"
    }));
    const wsUsers = XLSX.utils.json_to_sheet(usersData);
    XLSX.utils.book_append_sheet(wb, wsUsers, "Usuarios");

    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="band_data.xlsx"');
    return res.send(excelBuffer);
  } catch (e: any) {
    console.error("Error generating band_data.xlsx:", e);
    return res.status(500).json({ error: "Fallo al generar band_data.xlsx" });
  }
});

// Full state GET endpoint
app.get("/api/state", async (req, res) => {
  const user = getUserFromRequest(req, loadState);
  const isLeader = user?.role === "leader";
  const userBandId = user?.band_id || 'band-bakandeya';
  const isBakandeya = userBandId === 'band-bakandeya' || userBandId === 'reg-bakandeya';

  const state = loadState();

  // Asynchronous background Google Sheets sync - non-blocking so the user gets state instantly!
  (async () => {
    try {
      const [
        leads,
        rehearsals,
        concerts,
        posts,
        payments,
        metrics,
        logistics,
        songs,
        setlists,
        bands,
        tours,
        fans,
        registeredBands
      ] = await Promise.all([
        fetchLeadsFromSheet(state.leads).catch(() => state.leads),
        fetchRehearsalsFromSheet(state.rehearsals).catch(() => state.rehearsals),
        fetchConcertsFromSheet(state.concerts).catch(() => state.concerts),
        fetchPostsFromSheet(state.posts).catch(() => state.posts),
        isLeader ? fetchPaymentsFromSheet(state.payments).catch(() => state.payments) : Promise.resolve([]),
        fetchMetricsFromSheet(state.metrics).catch(() => state.metrics),
        fetchLogisticsFromSheet(state.runOfShow, state.gearChecklists).catch(() => ({ runOfShow: state.runOfShow, gearChecklists: state.gearChecklists })),
        fetchSongsFromSheet(state.songs).catch(() => state.songs),
        fetchSetlistsFromSheet(state.setlists).catch(() => state.setlists),
        fetchBandsFromSheet(state.bands || []).catch(() => state.bands || []),
        fetchToursFromSheet(state.tours || []).catch(() => state.tours || []),
        fetchFansFromSheet(state.fans || []).catch(() => state.fans || []),
        fetchRegisteredBandsFromSheet(state.registeredBands || []).catch(() => state.registeredBands || [])
      ]);

      state.leads = leads;
      state.rehearsals = rehearsals;
      state.concerts = concerts;
      state.posts = posts;
      if (isLeader) state.payments = payments;
      state.metrics = metrics;
      state.runOfShow = logistics.runOfShow;
      state.gearChecklists = logistics.gearChecklists;
      state.songs = songs;
      state.setlists = setlists;
      state.bands = bands;
      state.tours = tours;
      state.fans = fans;
      state.registeredBands = registeredBands;

      ensureUniqueIdsInState(state);
      saveState(state);
    } catch (error: any) {
      console.error("Background sync error:", error.message || error);
    }
  })();

  const rawPayments = isLeader ? (state.payments || []) : [];
  const rawUsers = getSafeUsers(state.users);

  // Strict single-active-band isolation logic for single workspace items
  const matchBand = (item: any) => {
    if (!item) return false;
    const itemBandId = item.band_id || item.bandId;
    if (itemBandId) {
      if (itemBandId === userBandId) return true;
      const cleanItem = itemBandId.replace(/^(band|reg)-/, '');
      const cleanUser = userBandId.replace(/^(band|reg)-/, '');
      return cleanItem === cleanUser;
    }
    // Legacy items without band_id default to Bakandeya
    return userBandId === 'band-bakandeya' || userBandId === 'reg-bakandeya';
  };

  // Build allowed band IDs for this user (for Calendar / Agenda / Tours view across all user's bands)
  const userAllowedBandIds = new Set<string>();
  if (userBandId) {
    userAllowedBandIds.add(userBandId);
    const cleanId = userBandId.replace(/^(band|reg)-/, '');
    userAllowedBandIds.add(`band-${cleanId}`);
    userAllowedBandIds.add(`reg-${cleanId}`);
  }

  if (user) {
    (state.userBands || []).forEach((ub: any) => {
      if (ub.user_id === user.id && ub.band_id) {
        userAllowedBandIds.add(ub.band_id);
        const cleanId = ub.band_id.replace(/^(band|reg)-/, '');
        userAllowedBandIds.add(`band-${cleanId}`);
        userAllowedBandIds.add(`reg-${cleanId}`);
      }
    });
    const userEmail = (user.email || user.username || '').toLowerCase();
    (state.registeredBands || []).forEach((b: any) => {
      if (b.user_id === user.id || (userEmail && b.email?.toLowerCase() === userEmail)) {
        if (b.band_id) {
          userAllowedBandIds.add(b.band_id);
          const cleanId = b.band_id.replace(/^(band|reg)-/, '');
          userAllowedBandIds.add(`band-${cleanId}`);
          userAllowedBandIds.add(`reg-${cleanId}`);
        }
        if (b.id) {
          userAllowedBandIds.add(b.id);
          const cleanId = b.id.replace(/^(band|reg)-/, '');
          userAllowedBandIds.add(`band-${cleanId}`);
          userAllowedBandIds.add(`reg-${cleanId}`);
        }
      }
    });
    (state.users || []).forEach((u: any) => {
      if ((u.id === user.id || (userEmail && u.email?.toLowerCase() === userEmail)) && u.band_id) {
        userAllowedBandIds.add(u.band_id);
        const cleanId = u.band_id.replace(/^(band|reg)-/, '');
        userAllowedBandIds.add(`band-${cleanId}`);
        userAllowedBandIds.add(`reg-${cleanId}`);
      }
    });
  }

  // Multi-band calendar/agenda matching helper (allows events for any band the user is part of)
  const matchUserBands = (item: any) => {
    if (!item) return false;
    const itemBandId = item.band_id || item.bandId;
    if (itemBandId) {
      return userAllowedBandIds.has(itemBandId);
    }
    return userAllowedBandIds.has('band-bakandeya') || userAllowedBandIds.has('reg-bakandeya');
  };

  const filterObjectLists = (obj: any, matcher = matchBand) => {
    if (!obj || typeof obj !== 'object') return {};
    const resObj: any = {};
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        const filtered = obj[key].filter(matcher);
        if (filtered.length > 0) resObj[key] = filtered;
      }
    }
    return resObj;
  };

  const userBandName = user?.bandName || user?.name || 'Tu Banda';
  const userEpkConfig = getEpkConfigForBand(state, userBandId, userBandName, user?.email);

  const bandUserIds = new Set(
    (state.userBands || []).filter((ub: any) => ub.band_id === userBandId).map((ub: any) => ub.user_id)
  );
  const filteredUsers = rawUsers.filter((u: any) => u.band_id === userBandId || bandUserIds.has(u.id) || u.id === user?.id);

  const uniqueById = (list: any[] = []) => {
    const seen = new Set<string>();
    return list.filter(item => {
      if (!item) return false;
      const id = item.id || item.code || item.key;
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  res.json({
    ...state,
    epkConfig: userEpkConfig,
    leads: uniqueById((state.leads || []).filter(matchBand)),
    rehearsals: uniqueById((state.rehearsals || []).filter(matchUserBands)),
    concerts: uniqueById((state.concerts || []).filter(matchUserBands)),
    posts: uniqueById((state.posts || []).filter(matchBand)),
    payments: uniqueById(rawPayments.filter(matchBand)),
    metrics: uniqueById((state.metrics || []).filter(matchBand)),
    songs: uniqueById((state.songs || []).filter(matchBand)),
    setlists: uniqueById((state.setlists || []).filter(matchBand)),
    bands: uniqueById((state.bands || []).filter(matchBand)),
    tours: uniqueById((state.tours || []).filter(matchBand)),
    fans: uniqueById((state.fans || []).filter(matchBand)),
    messages: uniqueById((state.messages || []).filter(matchBand)),
    runOfShow: filterObjectLists(state.runOfShow, matchUserBands),
    gearChecklists: filterObjectLists(state.gearChecklists, matchUserBands),
    registeredBands: (state.registeredBands || []).filter((b: any) =>
      b.band_id === userBandId ||
      b.id === userBandId ||
      b.id === `reg-${userBandId.replace('band-', '')}` ||
      (user?.email && b.email?.toLowerCase() === user.email.toLowerCase())
    ),
    users: filteredUsers
  });
});

// Static clip serving
app.use("/clips", express.static(path.join(process.cwd(), "public", "clips")));

// 404 catch-all for API endpoints to prevent returning index.html for missing routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `Ruta de API no encontrada: ${req.method} ${req.originalUrl}` });
});

// Vite middleware integration for full-stack SPA
async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false
      },
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bakandeya Virtual Manager server running on http://localhost:${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Exiting process so process manager can restart.`);
      process.exit(1);
    } else {
      console.error("Server error:", err);
    }
  });
}

if (process.env.BUILDING !== "true") {
  startServer();
}

export default app;
