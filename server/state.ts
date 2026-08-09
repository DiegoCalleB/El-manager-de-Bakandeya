import fs from "fs";
import path from "path";
import express from "express";
import { INITIAL_LEADS, INITIAL_REHEARSALS, INITIAL_CONCERTS, INITIAL_SOCIAL_POSTS, INITIAL_PAYMENTS, INITIAL_MESSAGES, INITIAL_SOCIAL_METRICS, INITIAL_USERS, INITIAL_SONGS, INITIAL_SETLISTS, INITIAL_BANDS, INITIAL_TOURS } from "../src/db_seed.js";
import { ACTIVE_SESSIONS, hashPassword, getUserFromRequest, createAuthMiddleware, createLeaderMiddleware, createCronOrAuthMiddleware } from "./auth.js";
import { generateUniqueSlugId, slugify } from "./utils/slug.js";

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

export const DEFAULT_AUTONOMY_CONFIG = {
  dispatchLevel: 'draft_only',
  negotiationDepth: 'filter_conditions',
  minCacheThreshold: 300,
  maxCacheThreshold: 800,
  autoDeclineUnderMinCache: false,
  notifyOnEveryProposal: true,
  requireHumanForFinalSignOff: true
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

export const BAKANDEYA_BAND_ID = "band-bakandeya";

export const BAKANDEYA_REGISTERED_BAND = {
  id: "reg-bakandeya",
  band_id: BAKANDEYA_BAND_ID,
  user_id: "user-diego",
  fecha_registro: "2026-01-01T10:00:00.000Z",
  nombre_banda: "Bakandeya",
  email: "diego.delacalleb@gmail.com",
  plan: "pro",
  contacto_nombre: "Diego de la Calle",
  estilo_musical: "Mestizaje / Ska-Rock / Reggae / Electrónica",
  localizacion: "Madrid / Sevilla (España)",
  telefono: "+34 612 345 678",
  instagram: "@bakandeya_oficial",
  spotify_youtube: "https://open.spotify.com/artist/bakandeya",
  aforo_promedio: 500,
  estado_cuenta: "activo",
  notas: "Banda oficial de la plataforma Bakandeya"
};

export function ensureBakandeyaBandId(state: any): boolean {
  let changed = false;

  if (!state.registeredBands || !Array.isArray(state.registeredBands)) {
    state.registeredBands = [BAKANDEYA_REGISTERED_BAND];
    changed = true;
  } else {
    const existingBakandeya = state.registeredBands.find(
      (b: any) => b.band_id === BAKANDEYA_BAND_ID || String(b.nombre_banda || "").toLowerCase() === "bakandeya"
    );
    if (!existingBakandeya) {
      state.registeredBands.unshift(BAKANDEYA_REGISTERED_BAND);
      changed = true;
    } else if (existingBakandeya.band_id !== BAKANDEYA_BAND_ID) {
      existingBakandeya.band_id = BAKANDEYA_BAND_ID;
      changed = true;
    }
  }

  if (state.registeredBands && Array.isArray(state.registeredBands)) {
    for (const b of state.registeredBands) {
      if (b.nombre_banda && b.nombre_banda.toLowerCase() !== "bakandeya") {
        const cleanSlug = slugify(b.nombre_banda);
        if (cleanSlug && (b.band_id === BAKANDEYA_BAND_ID || b.band_id.startsWith("user-"))) {
          b.band_id = `band-${cleanSlug}`;
          changed = true;
        }
      }
    }
  }

  if (state.users && Array.isArray(state.users)) {
    const initialSeedUserIds = new Set(['user-jose', 'user-diego', 'user-jon', 'user-elyar', 'user-raul']);
    for (const u of state.users) {
      if (initialSeedUserIds.has(u.id)) {
        if (u.band_id !== BAKANDEYA_BAND_ID) {
          u.band_id = BAKANDEYA_BAND_ID;
          u.bandName = "Bakandeya";
          changed = true;
        }
      } else {
        // Find matching registered bands for this user
        const uEmail = u.email?.toLowerCase();
        const matchingBands = state.registeredBands?.filter((b: any) =>
          (uEmail && b.email?.toLowerCase() === uEmail) || b.nombre_banda === u.name || b.nombre_banda === u.bandName
        ) || [];

        // Ensure user_id is linked on matching registered bands
        matchingBands.forEach((b: any) => {
          if (!b.user_id || b.user_id.startsWith("user-17")) {
            b.user_id = u.id;
            changed = true;
          }
        });

        const currentBandValid = matchingBands.some((b: any) => b.band_id === u.band_id) ||
          state.userBands?.some((ub: any) => ub.user_id === u.id && ub.band_id === u.band_id);

        if (!currentBandValid && matchingBands.length > 0) {
          const nameMatchedBand = matchingBands.find((b: any) =>
            b.nombre_banda && (b.nombre_banda.toLowerCase() === u.name?.toLowerCase() || b.nombre_banda.toLowerCase() === u.bandName?.toLowerCase())
          );
          const targetBandObj = nameMatchedBand || matchingBands[0];
          u.band_id = targetBandObj.band_id;
          if (targetBandObj.nombre_banda) u.bandName = targetBandObj.nombre_banda;
          changed = true;
        } else if (!u.band_id || u.band_id.startsWith('user-')) {
          u.band_id = `band-${slugify(u.bandName || u.name || u.id.replace('user-', ''))}`;
          changed = true;
        }
      }
    }
  }

  if (!state.userBands || !Array.isArray(state.userBands)) {
    state.userBands = [];
    changed = true;
  }

  // Ensure all current users have their active bands in userBands
  if (state.users && Array.isArray(state.users)) {
    state.users.forEach((u: any) => {
      const bid = u.band_id || "band-bakandeya";
      const hasUB = state.userBands.some((ub: any) => ub.user_id === u.id && ub.band_id === bid);
      if (!hasUB) {
        state.userBands.push({
          id: `ub-${u.id}-${bid}`,
          user_id: u.id,
          band_id: bid,
          role: u.role || "member",
          createdAt: u.createdAt || new Date().toISOString()
        });
        changed = true;
      }
    });
  }

  // Ensure all registered bands have leader associations in userBands
  if (state.registeredBands && Array.isArray(state.registeredBands)) {
    state.registeredBands.forEach((rb: any) => {
      if (rb.user_id && rb.band_id) {
        const hasUB = state.userBands.some((ub: any) => ub.user_id === rb.user_id && ub.band_id === rb.band_id);
        if (!hasUB) {
          state.userBands.push({
            id: `ub-${rb.user_id}-${rb.band_id}`,
            user_id: rb.user_id,
            band_id: rb.band_id,
            role: "leader",
            createdAt: rb.fecha_registro || new Date().toISOString()
          });
          changed = true;
        }
      }
    });
  }

  const collections = ['leads', 'rehearsals', 'concerts', 'posts', 'payments', 'metrics', 'songs', 'setlists', 'tours', 'fans', 'bands', 'messages'];
  for (const colKey of collections) {
    if (state[colKey] && Array.isArray(state[colKey])) {
      for (const item of state[colKey]) {
        if (!item.band_id) {
          item.band_id = BAKANDEYA_BAND_ID;
          changed = true;
        }
        if (colKey === 'leads' && item.hilo_emails && Array.isArray(item.hilo_emails)) {
          for (const msg of item.hilo_emails) {
            if (!msg.band_id) {
              msg.band_id = item.band_id;
              changed = true;
            }
          }
        }
      }
    }
  }

  if (state.runOfShow) {
    for (const key of Object.keys(state.runOfShow)) {
      if (Array.isArray(state.runOfShow[key])) {
        for (const item of state.runOfShow[key]) {
          if (!item.band_id) {
            item.band_id = BAKANDEYA_BAND_ID;
            changed = true;
          }
        }
      }
    }
  }

  if (state.gearChecklists) {
    for (const key of Object.keys(state.gearChecklists)) {
      if (Array.isArray(state.gearChecklists[key])) {
        for (const item of state.gearChecklists[key]) {
          if (!item.band_id) {
            item.band_id = BAKANDEYA_BAND_ID;
            changed = true;
          }
        }
      }
    }
  }

  if (!state.epkConfigsByBand) {
    state.epkConfigsByBand = {
      [BAKANDEYA_BAND_ID]: state.epkConfig || DEFAULT_EPK_CONFIG
    };
    changed = true;
  } else if (!state.epkConfigsByBand[BAKANDEYA_BAND_ID] && state.epkConfig) {
    state.epkConfigsByBand[BAKANDEYA_BAND_ID] = state.epkConfig;
    changed = true;
  }

  if (migrateTimestampIdsToPersonalized(state)) {
    changed = true;
  }

  if (ensureUniqueIdsInState(state)) {
    changed = true;
  }

  return changed;
}

export function ensureUniqueIdsInState(state: any): boolean {
  let changed = false;

  const collections = [
    'songs', 'setlists', 'leads', 'rehearsals', 'concerts', 'posts',
    'payments', 'metrics', 'tours', 'fans', 'bands', 'users', 'registeredBands', 'messages'
  ];

  for (const colKey of collections) {
    if (Array.isArray(state[colKey])) {
      const seenIds = new Set<string>();
      state[colKey].forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') return;
        
        let prefix = colKey.endsWith('s') ? colKey.slice(0, -1) : colKey;
        if (colKey === 'registeredBands') prefix = 'reg';

        if (!item.id || seenIds.has(item.id)) {
          const oldId = item.id;
          const newId = oldId ? `${oldId}-${idx + 1}` : `${prefix}-${Date.now()}-${idx + 1}`;
          item.id = newId;
          seenIds.add(newId);
          changed = true;
        } else {
          seenIds.add(item.id);
        }

        // Sub-arrays like setlist items
        if (colKey === 'setlists' && Array.isArray(item.items)) {
          const subSeen = new Set<string>();
          item.items.forEach((sItem: any, sIdx: number) => {
            if (!sItem.id || subSeen.has(sItem.id)) {
              sItem.id = sItem.id ? `${sItem.id}-${sIdx + 1}` : `item-${Date.now()}-${sIdx + 1}`;
              changed = true;
            }
            subSeen.add(sItem.id);
          });
        }
      });
    }
  }

  return changed;
}

export function migrateTimestampIdsToPersonalized(state: any): boolean {
  let changed = false;
  const existingIds = new Set<string>();

  const isTimestampId = (id: any) => typeof id === "string" && /^(user|band|reg)-\d{8,}$/.test(id);
  const idMap = new Map<string, string>();

  // Register non-timestamp IDs
  if (Array.isArray(state.users)) {
    for (const u of state.users) {
      if (u.id && !isTimestampId(u.id)) existingIds.add(u.id);
      if (u.band_id && !isTimestampId(u.band_id)) existingIds.add(u.band_id);
    }
  }
  if (Array.isArray(state.registeredBands)) {
    for (const b of state.registeredBands) {
      if (b.id && !isTimestampId(b.id)) existingIds.add(b.id);
      if (b.band_id && !isTimestampId(b.band_id)) existingIds.add(b.band_id);
    }
  }

  // 1. Process registeredBands
  if (Array.isArray(state.registeredBands)) {
    for (const b of state.registeredBands) {
      const bandName = b.nombre_banda || b.contacto_nombre || "banda";
      if (isTimestampId(b.band_id)) {
        if (!idMap.has(b.band_id)) {
          const newBandId = generateUniqueSlugId("band", bandName, existingIds);
          existingIds.add(newBandId);
          idMap.set(b.band_id, newBandId);
        }
        b.band_id = idMap.get(b.band_id)!;
        changed = true;
      }
      if (isTimestampId(b.id)) {
        if (!idMap.has(b.id)) {
          const newRegId = generateUniqueSlugId("reg", bandName, existingIds);
          existingIds.add(newRegId);
          idMap.set(b.id, newRegId);
        }
        b.id = idMap.get(b.id)!;
        changed = true;
      }
    }
  }

  // 2. Process users
  if (Array.isArray(state.users)) {
    for (const u of state.users) {
      const bandName = u.bandName || u.name || "banda";
      const userRaw = u.username?.includes("@") ? u.username.split("@")[0] : (u.username || u.name || "usuario");

      if (isTimestampId(u.band_id)) {
        if (!idMap.has(u.band_id)) {
          const newBandId = generateUniqueSlugId("band", bandName, existingIds);
          existingIds.add(newBandId);
          idMap.set(u.band_id, newBandId);
        }
        u.band_id = idMap.get(u.band_id)!;
        changed = true;
      }

      if (isTimestampId(u.id)) {
        if (!idMap.has(u.id)) {
          const newUserId = generateUniqueSlugId("user", userRaw, existingIds);
          existingIds.add(newUserId);
          idMap.set(u.id, newUserId);
        }
        u.id = idMap.get(u.id)!;
        changed = true;
      }
    }
  }

  // 3. Update references across collections
  if (idMap.size > 0) {
    const collections = ['leads', 'rehearsals', 'concerts', 'posts', 'payments', 'metrics', 'songs', 'setlists', 'tours', 'fans', 'bands', 'messages'];
    for (const colKey of collections) {
      if (state[colKey] && Array.isArray(state[colKey])) {
        for (const item of state[colKey]) {
          if (item.band_id && idMap.has(item.band_id)) {
            item.band_id = idMap.get(item.band_id)!;
            changed = true;
          }
          if (colKey === 'leads' && Array.isArray(item.hilo_emails)) {
            for (const msg of item.hilo_emails) {
              if (msg.band_id && idMap.has(msg.band_id)) {
                msg.band_id = idMap.get(msg.band_id)!;
                changed = true;
              }
            }
          }
        }
      }
    }

    if (state.epkConfigsByBand) {
      for (const [oldId, newId] of idMap.entries()) {
        if (state.epkConfigsByBand[oldId]) {
          state.epkConfigsByBand[newId] = state.epkConfigsByBand[oldId];
          delete state.epkConfigsByBand[oldId];
          changed = true;
        }
      }
    }

    for (const token of Object.keys(ACTIVE_SESSIONS)) {
      const sess = ACTIVE_SESSIONS[token];
      if (sess?.userId && idMap.has(sess.userId)) {
        sess.userId = idMap.get(sess.userId)!;
        changed = true;
      }
    }
  }

  return changed;
}

export function getDefaultEpkConfig(bandName: string = "Tu Banda", email?: string): any {
  return {
    biografia: `${bandName} es una propuesta musical en directo.`,
    logoUrl: "",
    bandPhotos: [],
    riderTecnico: "Rider técnico y necesidades de escenario por definir.",
    enlacesRedes: {
      spotify: "",
      youtube: "",
      instagram: "",
      tiktok: "",
      website: ""
    },
    contactoBooking: {
      nombre: bandName,
      email: email || "",
      telefono: ""
    },
    temasDestacadosIds: [],
    incentivoFans: {
      mensajeAgradecimiento: `¡Muchas gracias por unirte a la comunidad de ${bandName}!`,
      enlaceDescarga: "",
      codigoDescuento: ""
    }
  };
}

export function getEpkConfigForBand(state: any, bandId: string, bandName: string = "Tu Banda", email?: string): any {
  if (!state.epkConfigsByBand) {
    state.epkConfigsByBand = {};
  }
  const cleanId = (bandId || 'bakandeya').replace(/^(band|reg)-/, '');
  const possibleKeys = [
    bandId,
    cleanId,
    `band-${cleanId}`,
    `reg-${cleanId}`
  ].filter(Boolean);

  let existing = possibleKeys
    .map(k => state.epkConfigsByBand[k])
    .find(cfg => cfg && (cfg.logoUrl || cfg.biografia || cfg.nombre_banda));

  if (!existing) {
    if (cleanId === 'bakandeya') {
      existing = state.epkConfig || DEFAULT_EPK_CONFIG;
    } else {
      existing = getDefaultEpkConfig(bandName, email);
    }
  }

  // Ensure logoUrl fallback if missing or empty
  if (!existing.logoUrl || existing.logoUrl.trim() === '') {
    const regBand = (state.registeredBands || []).find((b: any) =>
      b.band_id === bandId || b.id === bandId ||
      (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanId) ||
      (b.id && b.id.replace(/^(band|reg)-/, '') === cleanId)
    );
    if (regBand?.logo_url && regBand.logo_url.trim().length > 0) {
      existing.logoUrl = regBand.logo_url;
    } else if (regBand?.imagen_url && regBand.imagen_url.trim().length > 0) {
      existing.logoUrl = regBand.imagen_url;
    } else if (cleanId === 'bakandeya') {
      existing.logoUrl = '/logo_bakandeya_bueno_sin_fondo.png';
    }
  }

  // Populate all key variations so any future lookup with band-*, reg-*, or raw cleanId gets the same object
  for (const k of possibleKeys) {
    state.epkConfigsByBand[k] = existing;
  }

  return existing;
}

export function getAutonomyConfigForBand(state: any, bandId: string): any {
  if (!state.autonomyConfigsByBand) {
    state.autonomyConfigsByBand = {};
  }
  const cleanId = (bandId || 'bakandeya').replace(/^(band|reg)-/, '');
  const possibleKeys = [
    bandId,
    cleanId,
    `band-${cleanId}`,
    `reg-${cleanId}`
  ].filter(Boolean);

  let existing = possibleKeys
    .map(k => state.autonomyConfigsByBand[k])
    .find(cfg => cfg && cfg.dispatchLevel);

  if (!existing) {
    existing = { ...DEFAULT_AUTONOMY_CONFIG };
  }

  for (const k of possibleKeys) {
    state.autonomyConfigsByBand[k] = existing;
  }

  return existing;
}

export function loadState(): any {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const state = JSON.parse(content);
      
      let changed = false;

      if (!state.autonomyConfigsByBand) {
        state.autonomyConfigsByBand = {
          [BAKANDEYA_BAND_ID]: DEFAULT_AUTONOMY_CONFIG
        };
        changed = true;
      }

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
      
      if (ensureBakandeyaBandId(state)) {
        changed = true;
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
    registeredBands: [BAKANDEYA_REGISTERED_BAND],
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
        createdAt: u.createdAt,
        band_id: BAKANDEYA_BAND_ID,
        bandName: "Bakandeya"
      };
    })
  };
  ensureBakandeyaBandId(defaultState);
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

export function getUserFromRequestLocal(req: express.Request): { id: string; role: string; username: string; band_id?: string; bandName?: string; email?: string } | null {
  return getUserFromRequest(req, loadState);
}

export const requireAuth = createAuthMiddleware(loadState);
export const requireLeader = createLeaderMiddleware(loadState);
export const requireCronOrAuth = createCronOrAuthMiddleware(loadState);
