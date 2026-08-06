import fs from "fs";
import path from "path";
import express from "express";
import { INITIAL_LEADS, INITIAL_REHEARSALS, INITIAL_CONCERTS, INITIAL_SOCIAL_POSTS, INITIAL_PAYMENTS, INITIAL_MESSAGES, INITIAL_SOCIAL_METRICS, INITIAL_USERS, INITIAL_SONGS, INITIAL_SETLISTS, INITIAL_BANDS, INITIAL_TOURS } from "../src/db_seed.js";
import { ACTIVE_SESSIONS, hashPassword, getUserFromRequest, createAuthMiddleware, createLeaderMiddleware, createCronOrAuthMiddleware } from "./auth.js";

const DATA_FILE = path.join(process.cwd(), "data.json");

const INITIAL_RUN_OF_SHOW: Record<string, any[]> = {
  '2026-07-23': [
    { id: 'ros-1', time: '17:00', activity: 'Llegada a la sala y descarga de bártulos', done: true },
    { id: 'ros-2', time: '17:30', activity: 'Montaje de escenario e in-ears', done: true },
    { id: 'ros-3', time: '18:15', activity: 'Prueba de sonido (Soundcheck de metales y bases)', done: true },
    { id: 'ros-4', time: '19:30', activity: 'Cena de la banda / Catering', done: false },
    { id: 'ros-5', time: '21:00', activity: 'Apertura de puertas', done: false },
    { id: 'ros-6', time: '21:30', activity: 'SHOWTIME: ¡Comienza el bolo de Bakandeya! 🎺💥', done: false },
    { id: 'ros-7', time: '23:30', activity: 'Merchandising, firmas y recogida de equipo', done: false },
  ],
  '2026-07-15': [
    { id: 'ros-10', time: '17:00', activity: 'Camerinos Rock Palace - Montaje y chequeo', done: true },
    { id: 'ros-11', time: '18:00', activity: 'Prueba de loops con Jon y violín', done: true },
    { id: 'ros-12', time: '20:30', activity: 'Cierre del ensayo y notas generales', done: false },
  ]
};

const INITIAL_GEAR_CHECKLISTS: Record<string, any[]> = {
  '2026-07-23': [
    { id: 'gear-1', label: 'Teclado Korg SV-2 + Stand', checked: true },
    { id: 'gear-2', label: 'Sección Metales (Sordinas y atril)', checked: true },
    { id: 'gear-3', label: 'Banderola de Escenario Bakandeya', checked: false },
    { id: 'gear-4', label: 'Merchandising (Camisetas, Pegatinas, CDs)', checked: false },
    { id: 'gear-5', label: 'Cables Jack / XLR de recambio', checked: true },
    { id: 'gear-6', label: 'DI-Box estéreo para teclados', checked: false },
  ]
};

const DEFAULT_EPK_CONFIG = {
  biografia: "Bakandeya es una propuesta vibrante de mestizaje, ska-rock, reggae y ritmos latinos con sección de metales potente y letras combativas pero festivas. Con más de 40 conciertos a sus espaldas en salas y festivales de la península, Bakandeya ofrece un directo arrollador de 90 minutos concebido para hacer bailar e involucrar a todo el público de principio a fin.",
  logoUrl: "/logo_bakandeya.jpg",
  bandPhotos: [
    "/logo_bakandeya.jpg"
  ],
  riderTecnico: "- 1 PA estéreo adecuada para el aforo de la sala/escenario (mín. 2000W)\n- Manguera de 16 canales con 4 envíos de monitores o sistema IEM inalámbrico\n- 3 Micrófonos dinámicos vocal (Shure SM58)\n- Miking completo para sección de metales (2 x SM57 / clip condenser)\n- 2 Cajas de inyección DI para teclados/secuencias\n- Microfonía para batería estándar (Kick, Snare, 2 Toms, Overheads)",
  enlacesRedes: {
    spotify: "https://open.spotify.com/artist/bakandeya",
    youtube: "https://youtube.com/@bakandeya_oficial",
    instagram: "https://instagram.com/bakandeya_oficial",
    tiktok: "https://tiktok.com/@bakandeya_oficial",
    website: "https://bakandeya.es"
  },
  contactoBooking: {
    nombre: "Diego de la Calle / Mánager Bakandeya",
    email: "diego.delacalleb@gmail.com",
    telefono: "+34 612 345 678"
  },
  temasDestacadosIds: ["s-1", "s-2", "s-3"],
  incentivoFans: {
    mensajeAgradecimiento: "¡Muchas gracias por unirte a la familia de Bakandeya! Aquí tienes tu regalo exclusivo por apoyarnos en el concierto.",
    enlaceDescarga: "https://bakandeya.es/descargas/tema-inedito-directo.mp3",
    codigoDescuento: "BAKANDEYA-FAN-10"
  },
  ciudadesConfig: ["Madrid", "Sevilla", "Barcelona", "Málaga", "Valencia", "Granada", "Cádiz"]
};

const INITIAL_FANS = [
  {
    id: "fan-1",
    nombre: "Laura Giménez",
    email: "laura.gimenez@gmail.com",
    ciudad: "Madrid",
    comoConocio: "Concierto Sala Caracol",
    conciertoOrigenId: "cnc-1",
    conciertoOrigenNombre: "Sala Caracol (Madrid)",
    fechaCaptura: "2026-03-15",
    consentimientoRGPD: true
  },
  {
    id: "fan-2",
    nombre: "Carlos Ruiz",
    email: "cruiz.ska@hotmail.com",
    ciudad: "Valencia",
    comoConocio: "Festival ViñaRock",
    conciertoOrigenId: "cnc-2",
    conciertoOrigenNombre: "16 Toneladas (Valencia)",
    fechaCaptura: "2026-04-02",
    consentimientoRGPD: true
  }
];

export function loadState(): any {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const state = JSON.parse(content);
      
      let changed = false;

      if (!state.epkConfig) {
        state.epkConfig = DEFAULT_EPK_CONFIG;
        changed = true;
      }

      if (!state.fans || !Array.isArray(state.fans)) {
        state.fans = INITIAL_FANS;
        changed = true;
      }
      
      if (!state.metrics) {
        state.metrics = INITIAL_SOCIAL_METRICS;
        changed = true;
      }

      if (!state.runOfShow) {
        state.runOfShow = INITIAL_RUN_OF_SHOW;
        changed = true;
      }

      if (!state.gearChecklists) {
        state.gearChecklists = INITIAL_GEAR_CHECKLISTS;
        changed = true;
      }

      if (!state.songs || !Array.isArray(state.songs)) {
        state.songs = INITIAL_SONGS;
        changed = true;
      }

      if (!state.setlists || !Array.isArray(state.setlists)) {
        state.setlists = INITIAL_SETLISTS;
        changed = true;
      }
      if (!state.tours || !Array.isArray(state.tours)) {
        state.tours = INITIAL_TOURS;
        changed = true;
      }
      if (!state.bands || !Array.isArray(state.bands)) {
        state.bands = INITIAL_BANDS;
        changed = true;
      }

      if (!state.users || !Array.isArray(state.users)) {
        state.users = [];
      }

      if (state.users.some((u: any) => u.username.toLowerCase() === 'larra')) {
        state.users = state.users.filter((u: any) => u.username.toLowerCase() !== 'larra');
        changed = true;
      }

      for (const initUser of INITIAL_USERS) {
        const existing = state.users.find(
          (u: any) => u.username.toLowerCase() === initUser.username.toLowerCase()
        );
        if (!existing) {
          const { hash, salt } = hashPassword(initUser.initialPassword);
          state.users.push({
            id: initUser.id,
            username: initUser.username,
            name: initUser.name,
            role: initUser.role,
            instrument: initUser.instrument,
            avatarColor: initUser.avatarColor,
            passwordHash: hash,
            salt: salt,
            createdAt: initUser.createdAt
          });
          changed = true;
        } else {
          if (existing.instrument !== initUser.instrument) {
            existing.instrument = initUser.instrument;
            changed = true;
          }
        }
      }

      if (state.leads) {
        if (!state.leads.some((l: any) => l.id === "lead-14")) {
          const hebeLead = INITIAL_LEADS.find(l => l.id === "lead-14");
          if (hebeLead) {
            state.leads.push(hebeLead);
            changed = true;
          }
        }
        
        state.leads = state.leads.map((l: any) => {
          const seedLead = INITIAL_LEADS.find((sl) => sl.id === l.id);
          if (seedLead && seedLead.hilo_emails && (!l.hilo_emails || l.hilo_emails.length === 0)) {
            l.hilo_emails = seedLead.hilo_emails;
            changed = true;
          }
          return l;
        });
      }
      
      if (changed) {
        saveState(state);
      }
      
      return state;
    } catch (e) {
      console.error("Error reading data.json, falling back to seed data", e);
    }
  }
  
  const defaultState = {
    epkConfig: DEFAULT_EPK_CONFIG,
    fans: INITIAL_FANS,
    leads: INITIAL_LEADS,
    rehearsals: INITIAL_REHEARSALS,
    concerts: INITIAL_CONCERTS,
    posts: INITIAL_SOCIAL_POSTS,
    payments: INITIAL_PAYMENTS,
    messages: INITIAL_MESSAGES,
    metrics: INITIAL_SOCIAL_METRICS,
    runOfShow: INITIAL_RUN_OF_SHOW,
    gearChecklists: INITIAL_GEAR_CHECKLISTS,
    songs: INITIAL_SONGS,
    setlists: INITIAL_SETLISTS,
    bands: INITIAL_BANDS,
    tours: INITIAL_TOURS,
    users: INITIAL_USERS.map((u: any) => {
      const { hash, salt } = hashPassword(u.initialPassword);
      return {
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        instrument: u.instrument,
        avatarColor: u.avatarColor,
        passwordHash: hash,
        salt: salt,
        createdAt: u.createdAt
      };
    })
  };
  saveState(defaultState);
  return defaultState;
}

export function saveState(state: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving data.json", e);
  }
}

export function getUserFromRequestLocal(req: express.Request): { id: string; role: string; username: string } | null {
  return getUserFromRequest(req, loadState);
}

export const requireAuth = createAuthMiddleware(loadState);
export const requireLeader = createLeaderMiddleware(loadState);
export const requireCronOrAuth = createCronOrAuthMiddleware(loadState);
