import express from "express";
import path from "path";
import * as XLSX from "xlsx";

import { Lead, Concert, SocialPost, Payment, Rehearsal } from "./src/types";

import { getSafeUsers, getUserFromRequest } from "./server/auth.js";
import {
  getSheetsClient,
  fetchLeadsFromSheet,
  fetchRehearsalsFromSheet,
  fetchConcertsFromSheet,
  fetchPostsFromSheet,
  fetchPaymentsFromSheet,
  fetchMetricsFromSheet,
  fetchLogisticsFromSheet
} from "./server/sheets.js";
import { loadState, saveState } from "./server/state.js";

import usersRouter from "./server/routes/users.js";
import postsRouter from "./server/routes/posts.js";
import metricsRouter from "./server/routes/metrics.js";
import chatRouter from "./server/routes/chat.js";
import leadsRouter from "./server/routes/leads.js";
import concertsRouter from "./server/routes/concerts.js";
import agentRouter from "./server/routes/agent.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Mount modular Express routers
app.use("/api", usersRouter);
app.use("/api", postsRouter);
app.use("/api", metricsRouter);
app.use("/api", chatRouter);
app.use("/api", leadsRouter);
app.use("/api", concertsRouter);
app.use("/api", agentRouter);

// System status and excel export endpoints
app.get("/api/check-sheets", async (req, res) => {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!sheets || !spreadsheetId) {
    return res.json({
      configured: false,
      error: "Google Sheets o SPREADSHEET_ID no configurado en el servidor."
    });
  }

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = meta.data.sheets || [];
    const existingTabs = sheetsList.map((s: any) => s.properties.title);
    
    const required = ["leads", "ensayos", "conciertos", "redes_sociales", "finanzas", "seguidores", "hilos_emails", "logistica_horarios", "logistica_equipo"];
    const status: Record<string, boolean> = {};
    const created: string[] = [];

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
      error: error.message || "Fallo al conectar con la API de Google Sheets. Verifica los permisos de tu Service Account."
    });
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
      Notas: c.notas || ""
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
      Notas: l.notas || ""
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
      Estado: p.estado
    }));
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, wsPayments, "Finanzas_Pagos");

    const postsData = (state.posts || []).map((p: SocialPost) => ({
      ID: p.id,
      Fecha: p.fecha,
      Plataforma: p.plataforma,
      Contenido: p.contenido,
      Responsable: p.responsable,
      Estado: p.estado
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
              Completado: item.done ? "SÍ" : "NO"
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
              "Cargado / Listo": item.checked ? "SÍ" : "NO"
            });
          });
        }
      });
    }
    const wsGear = XLSX.utils.json_to_sheet(gearRows);
    XLSX.utils.book_append_sheet(wb, wsGear, "Logistica_Equipo");

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

  const state = loadState();
  try {
    state.leads = await fetchLeadsFromSheet(state.leads);
    state.rehearsals = await fetchRehearsalsFromSheet(state.rehearsals);
    state.concerts = await fetchConcertsFromSheet(state.concerts);
    state.posts = await fetchPostsFromSheet(state.posts);
    if (isLeader) {
      state.payments = await fetchPaymentsFromSheet(state.payments);
    }
    state.metrics = await fetchMetricsFromSheet(state.metrics);
    const logistics = await fetchLogisticsFromSheet(state.runOfShow, state.gearChecklists);
    state.runOfShow = logistics.runOfShow;
    state.gearChecklists = logistics.gearChecklists;
    saveState(state);
  } catch (error: any) {
    console.error("Error fetching state from Google Sheets, falling back to local cached state:", error.message || error);
  }
  
  const responseState = {
    ...state,
    payments: isLeader ? (state.payments || []) : [],
    users: getSafeUsers(state.users)
  };
  res.json(responseState);
});

// Static clip serving
app.use("/clips", express.static(path.join(process.cwd(), "public", "clips")));

// Vite middleware integration for full-stack SPA
async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
