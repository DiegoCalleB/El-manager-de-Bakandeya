import express from "express";
import crypto from "crypto";
import { ACTIVE_SESSIONS, verifyPassword, hashPassword, getSafeUsers } from "../auth.js";
import { loadState, saveState, requireAuth, requireLeader, getEpkConfigForBand, BAKANDEYA_BAND_ID, getUserFromRequestLocal } from "../state.js";

export function buildAvailableBandsForUser(state: any, targetUser: any): any[] {
  if (!targetUser) return [];
  if (!state.userBands) state.userBands = [];
  
  const availableBands: any[] = [];
  const seenCleanBandIds = new Set<string>();

  const getLogoForBand = (bandId: string, defaultName: string) => {
    const epk = getEpkConfigForBand(state, bandId, defaultName);
    if (epk?.logoUrl && epk.logoUrl.trim().length > 0) return epk.logoUrl;
    const bandInfo = (state.registeredBands || []).find((b: any) =>
      b.band_id === bandId || b.id === bandId ||
      (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === bandId.replace(/^(band|reg)-/, '')) ||
      (b.id && b.id.replace(/^(band|reg)-/, '') === bandId.replace(/^(band|reg)-/, ''))
    );
    if (bandInfo?.logo_url && bandInfo.logo_url.trim().length > 0) return bandInfo.logo_url;
    if (bandInfo?.imagen_url && bandInfo.imagen_url.trim().length > 0) return bandInfo.imagen_url;
    const clean = bandId.replace(/^(band|reg)-/, '');
    if (clean === 'bakandeya') return '/logo_bakandeya_bueno_sin_fondo.png';
    return '';
  };

  const userEmail = (targetUser.email || targetUser.username || "").toLowerCase();

  // 1. Bands from state.userBands
  const userBandsList = state.userBands.filter((ub: any) =>
    ub.user_id === targetUser.id ||
    (state.users && state.users.some((u: any) => u.id === ub.user_id && userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail)))
  );

  userBandsList.forEach((ub: any) => {
    if (!ub.band_id) return;
    const cleanId = ub.band_id.replace(/^(band|reg)-/, '');
    if (seenCleanBandIds.has(cleanId)) return;
    seenCleanBandIds.add(cleanId);

    const bandInfo = (state.registeredBands || []).find((b: any) =>
      b.band_id === ub.band_id || b.id === ub.band_id ||
      (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanId) ||
      (b.id && b.id.replace(/^(band|reg)-/, '') === cleanId)
    );
    const formattedFallback = cleanId ? cleanId.charAt(0).toUpperCase() + cleanId.slice(1) : "Banda";
    const bandName = bandInfo?.nombre_banda || (ub.band_id === targetUser.band_id ? targetUser.bandName : null) || formattedFallback;
    availableBands.push({
      band_id: ub.band_id,
      bandName,
      nombre_banda: bandName,
      role: ub.role || "member",
      userId: targetUser.id,
      logoUrl: getLogoForBand(ub.band_id, bandName)
    });
  });

  // 2. Bands from state.registeredBands
  const registeredBandsForUser = (state.registeredBands || []).filter(
    (b: any) => b.user_id === targetUser.id || (b.email && b.email.toLowerCase() === userEmail)
  );
  registeredBandsForUser.forEach((b: any) => {
    const bid = b.band_id || b.id;
    if (!bid) return;
    const cleanId = bid.replace(/^(band|reg)-/, '');
    if (seenCleanBandIds.has(cleanId)) return;
    seenCleanBandIds.add(cleanId);

    const bName = b.nombre_banda || "Banda";
    availableBands.push({
      band_id: bid,
      bandName: bName,
      nombre_banda: bName,
      role: "leader",
      userId: targetUser.id,
      logoUrl: getLogoForBand(bid, bName)
    });
  });

  // 3. Bands from other accounts matching same email/username
  (state.users || []).forEach((u: any) => {
    if (!u.band_id) return;
    if (u.id === targetUser.id || (userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail))) {
      const cleanId = u.band_id.replace(/^(band|reg)-/, '');
      if (seenCleanBandIds.has(cleanId)) return;
      seenCleanBandIds.add(cleanId);

      const bName = u.bandName || u.name || "Banda";
      availableBands.push({
        band_id: u.band_id,
        bandName: bName,
        nombre_banda: bName,
        role: u.role || "leader",
        userId: targetUser.id,
        logoUrl: getLogoForBand(u.band_id, bName)
      });
    }
  });

  // 4. Current active band
  const currentBid = targetUser.band_id || BAKANDEYA_BAND_ID;
  const cleanCurrent = currentBid.replace(/^(band|reg)-/, '');
  if (!seenCleanBandIds.has(cleanCurrent)) {
    seenCleanBandIds.add(cleanCurrent);
    const bName = targetUser.bandName || targetUser.name || "BAKANDEYA";
    availableBands.push({
      band_id: currentBid,
      bandName: bName,
      role: targetUser.role || "leader",
      userId: targetUser.id,
      logoUrl: getLogoForBand(currentBid, bName)
    });
  }

  return availableBands;
}
import { loginRateLimiter } from "../middleware/rateLimiter.js";
import { googleSheetsService } from "../services/googleSheets.service.js";
import { generateUniqueSlugId, slugify } from "../utils/slug.js";

const router = express.Router();

// Register new band & user
router.post("/auth/register", async (req, res) => {
  const { bandName, email, password, plan, leaderName } = req.body;

  if (!bandName || !email || !password) {
    return res.status(400).json({ error: "Nombre de banda, email y contraseña son requeridos" });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();
  const rawBandName = bandName.trim();

  // Check if existing users exist for this email
  const existingUsersWithEmail = state.users.filter(
    (u: any) => u.username.toLowerCase() === cleanEmail || u.email?.toLowerCase() === cleanEmail
  );

  if (existingUsersWithEmail.length > 0) {
    // If user exists, check if password matches existing account
    const matchesAnyPassword = existingUsersWithEmail.some((u: any) =>
      verifyPassword(password, u.passwordHash, u.salt)
    );

    if (!matchesAnyPassword) {
      return res.status(400).json({
        error: "Este correo electrónico ya está registrado. Introduce la contraseña correcta de tu cuenta para añadir una nueva banda."
      });
    }

    // Check if this exact band name is already registered for this user
    const alreadyRegisteredSameBand = existingUsersWithEmail.some(
      (u: any) => (u.bandName || u.name || "").toLowerCase() === rawBandName.toLowerCase()
    );

    if (alreadyRegisteredSameBand) {
      return res.status(400).json({
        error: `Ya tienes una banda registrada con el nombre "${rawBandName}".`
      });
    }
  }

  const isExistingUser = existingUsersWithEmail.length > 0;
  const selectedPlan = plan || 'emergente';

  // Gather existing IDs across state to prevent duplicate collisions
  const existingIds = new Set<string>();
  (state.users || []).forEach((u: any) => {
    if (u.id) existingIds.add(u.id);
    if (u.band_id) existingIds.add(u.band_id);
  });
  (state.registeredBands || []).forEach((b: any) => {
    if (b.id) existingIds.add(b.id);
    if (b.band_id) existingIds.add(b.band_id);
  });

  // Generate clean, personalized IDs
  const bandId = generateUniqueSlugId("band", rawBandName, existingIds);
  existingIds.add(bandId);

  const regId = generateUniqueSlugId("reg", rawBandName, existingIds);
  existingIds.add(regId);

  let userToUse: any;
  let isNewUserCreated = false;

  if (isExistingUser) {
    userToUse = existingUsersWithEmail[0];
    // Update active band to the newly created one
    userToUse.band_id = bandId;
    userToUse.bandName = rawBandName;
  } else {
    const { hash, salt } = hashPassword(password);
    const emailUserPart = cleanEmail.split("@")[0] || rawBandName;
    const defaultName = emailUserPart.charAt(0).toUpperCase() + emailUserPart.slice(1);
    const userId = generateUniqueSlugId("user", `${emailUserPart}-${slugify(rawBandName)}`, existingIds);
    existingIds.add(userId);

    userToUse = {
      id: userId,
      username: cleanEmail,
      name: leaderName ? leaderName.trim() : defaultName,
      bandName: rawBandName,
      email: cleanEmail,
      role: "leader",
      plan: selectedPlan,
      instrument: `Líder de ${rawBandName}`,
      avatarColor: "#f2ca50",
      passwordHash: hash,
      salt: salt,
      band_id: bandId,
      createdAt: new Date().toISOString()
    };

    state.users.push(userToUse);
    isNewUserCreated = true;
  }

  // Ensure userBands relationship exists for the registered band
  if (!state.userBands) state.userBands = [];
  const hasUB = state.userBands.some((ub: any) => ub.user_id === userToUse.id && ub.band_id === bandId);
  if (!hasUB) {
    const newUB = {
    
      id: `ub-${userToUse.id}-${bandId}`,
      user_id: userToUse.id,
      band_id: bandId,
      role: "leader",
      createdAt: new Date().toISOString()
  };
  state.userBands.push(newUB);
  try {
    await googleSheetsService.appendUserBand(newUB);
  } catch (e) {
    console.warn("Failed to append userBand to sheets", e);
  }
  }

  // Generate session token
  const token = crypto.randomBytes(32).toString("hex");
  const sessionObj = { userId: userToUse.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  // Save band register data to Google Sheets tab 'registro_bandas' asynchronously
  try {
    const newRegisteredBandRecord = {
      id: regId,
      band_id: bandId,
      user_id: userToUse.id,
      fecha_registro: new Date().toISOString(),
      nombre_banda: rawBandName,
      email: cleanEmail,
      plan: selectedPlan,
      contacto_nombre: rawBandName,
      estilo_musical: "Por definir",
      localizacion: "España",
      telefono: "",
      instagram: "",
      spotify_youtube: "",
      aforo_promedio: 0,
      estado_cuenta: "activo",
      notas: `Plan seleccionado: ${selectedPlan}. Registrado desde BANDMANAGER.ai web app.`
    };
    if (!state.registeredBands) state.registeredBands = [];
    state.registeredBands.push(newRegisteredBandRecord);
    saveState(state);
    await googleSheetsService.appendRegisteredBand(newRegisteredBandRecord);
    if (isNewUserCreated) {
      await googleSheetsService.appendUser(userToUse);
    }
  } catch (sheetErr) {
    console.warn("Notice: Band registration saved locally, Google Sheets update skipped or pending:", sheetErr);
  }

  // Calculate availableBands dynamically
  const availableBands = buildAvailableBandsForUser(state, userToUse);

  res.cookie("bakandeya_token", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  const { passwordHash, salt: _, ...safeUser } = userToUse;
  res.status(201).json({ token, user: safeUser, availableBands, multipleBands: availableBands.length > 1 });
});

// Endpoint to fetch all registered bands from Google Sheets tab 'registro_bandas'
const handleGetRegisteredBands = async (req: any, res: any) => {
  try {
    const state = loadState();
    // Use existing users as fallback if sheet is empty
    const fallbackBands = (state.users || [])
      .filter((u: any) => u.role === 'leader' || u.bandName)
      .map((u: any) => ({
        id: `reg-${u.id}`,
        band_id: u.band_id || (u.id?.startsWith('user-') ? 'band-' + u.id.replace('user-', '') : u.id),
        fecha_registro: u.createdAt || new Date().toISOString(),
        nombre_banda: u.bandName || u.name,
        email: u.email || u.username,
        plan: u.plan || 'emergente',
        contacto_nombre: u.name,
        estilo_musical: 'Por definir',
        localizacion: 'España',
        telefono: '',
        instagram: '',
        spotify_youtube: '',
        aforo_promedio: 0,
        estado_cuenta: 'activo',
        notas: `Registrado desde BANDMANAGER.ai`
      }));

    const bands = await googleSheetsService.fetchRegisteredBands(fallbackBands);

    const userBandId = req.user?.band_id || 'band-bakandeya';
    const isBakandeyaOrAdmin = userBandId === 'band-bakandeya' || userBandId === 'reg-bakandeya' || req.user?.role === 'admin';

    const filteredBands = isBakandeyaOrAdmin
      ? bands
      : bands.filter((b: any) =>
          b.band_id === userBandId ||
          b.id === userBandId ||
          b.id === `reg-${userBandId.replace('band-', '')}` ||
          (req.user?.email && b.email?.toLowerCase() === req.user.email.toLowerCase())
        );

    res.json({ registeredBands: filteredBands });
  } catch (err: any) {
    console.error("Error fetching registered bands:", err);
    res.status(500).json({ error: "No se pudieron obtener las bandas registradas." });
  }
};

router.get("/registered-bands", requireAuth, handleGetRegisteredBands);
router.get("/users/registered-bands", requireAuth, handleGetRegisteredBands);

// Endpoint to force assign Bakandeya and sync all Google Sheets
router.all("/sync-bakandeya", async (req, res) => {
  try {
    const state = loadState();
    await googleSheetsService.syncAllTabsWithBakandeya(state);
    res.json({ success: true, message: "Banda Bakandeya asignada y sincronizada en todas las pestañas de Google Sheets." });
  } catch (err: any) {
    console.error("Error syncing Bakandeya to Google Sheets:", err);
    res.status(500).json({ error: err.message || "Error al sincronizar la banda Bakandeya en Google Sheets." });
  }
});

// Check invitation for activating added members
router.post("/auth/check-invitation", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "El correo electrónico es requerido." });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();

  const user = state.users.find(
    (u: any) => (u.email && u.email.toLowerCase() === cleanEmail) || u.username.toLowerCase() === cleanEmail
  );

  if (!user) {
    return res.status(404).json({
      error: "No se ha encontrado ninguna invitación o registro para este correo. Pide al director de tu banda que te agregue primero en el apartado de Miembros."
    });
  }

  // Find all bands this user belongs to
  if (!state.userBands) state.userBands = [];
  const userBandsList = state.userBands.filter((ub: any) => ub.user_id === user.id);

  const bands = userBandsList.map((ub: any) => {
    const bandInfo = (state.registeredBands || []).find((b: any) => b.band_id === ub.band_id);
    return {
      band_id: ub.band_id,
      bandName: bandInfo?.nombre_banda || user.bandName || "Bakandeya",
      role: ub.role || "member"
    };
  });

  res.json({
    success: true,
    name: user.name,
    username: user.username,
    email: user.email || cleanEmail,
    bands
  });
});

// Activate added member (set password & username)
router.post("/auth/activate-member", async (req, res) => {
  const { email, username, name, password } = req.body;

  if (!email || !username || !name || !password) {
    return res.status(400).json({ error: "Todos los campos son requeridos para activar tu cuenta." });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  const user = state.users.find(
    (u: any) => (u.email && u.email.toLowerCase() === cleanEmail) || u.username.toLowerCase() === cleanEmail
  );

  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado para activación." });
  }

  // Check if chosen username is already taken by a different user
  const usernameTaken = state.users.some(
    (u: any) => u.id !== user.id && u.username.toLowerCase() === cleanUsername
  );

  if (usernameTaken) {
    return res.status(400).json({ error: "El nombre de usuario ya está registrado por otra persona." });
  }

  // Hash new password
  const { hash, salt } = hashPassword(password);

  user.name = name.trim();
  user.username = cleanUsername;
  user.email = cleanEmail;
  user.passwordHash = hash;
  user.salt = salt;

  // Generate session token
  const token = crypto.randomBytes(32).toString("hex");
  const sessionObj = { userId: user.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  // Sync to Google Sheets asynchronously
  try {
    await googleSheetsService.updateUser(user);
  } catch (err) {
    console.warn("Notice: Activated user updated locally, Sheets sync pending:", err);
  }

  // Compute available bands
  if (!state.userBands) state.userBands = [];
  const userBandsList = state.userBands.filter((ub: any) => ub.user_id === user.id);
  const availableBands = userBandsList.map((ub: any) => {
    const bandInfo = (state.registeredBands || []).find((b: any) => b.band_id === ub.band_id);
    return {
      band_id: ub.band_id,
      bandName: bandInfo?.nombre_banda || "Banda",
      role: ub.role || "member",
      userId: user.id
    };
  });

  res.cookie("bakandeya_token", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  const { passwordHash: _, salt: __, ...safeUser } = user;
  res.json({ token, user: safeUser, availableBands });
});

// Google Social OAuth Login / Registration
router.post("/auth/google", loginRateLimiter, async (req, res) => {
  const { email, name, uid, accessToken } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email de Google es requerido" });
  }

  const state = loadState();
  const cleanEmail = email.trim().toLowerCase();

  // Sync users from Google Sheets tab 'usuarios'
  try {
    const sheetUsers = await googleSheetsService.fetchUsers(state.users || []);
    if (sheetUsers && sheetUsers.length > 0) {
      sheetUsers.forEach((su: any) => {
        const idx = state.users.findIndex(
          (u: any) => u.id === su.id || (u.email && u.email.toLowerCase() === su.email?.toLowerCase())
        );
        if (idx !== -1) {
          state.users[idx] = { ...state.users[idx], ...su };
        } else {
          state.users.push(su);
        }
      });
      saveState(state);
    }
  } catch (err) {
    // Continue with state
  }

  // Find existing user by email or google uid
  let user = state.users.find(
    (u: any) =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.username && u.username.toLowerCase() === cleanEmail) ||
      (uid && u.googleUid === uid)
  );

  if (!user) {
    // Auto-register new user authenticated with Google OAuth
    const newUserId = uid || `user-google-${Date.now()}`;
    const cleanName = name || cleanEmail.split("@")[0] || "Miembro Banda";
    user = {
      id: newUserId,
      username: cleanEmail,
      email: cleanEmail,
      name: cleanName,
      bandName: "Bakandeya",
      band_id: BAKANDEYA_BAND_ID,
      role: "leader",
      plan: "profesional",
      createdAt: new Date().toISOString(),
      googleUid: uid,
      authProvider: "google"
    };

    state.users.push(user);

    // Sync user-band relationship
    if (!state.userBands) state.userBands = [];
    const existingUB = state.userBands.find(
      (ub: any) => ub.user_id === user.id && ub.band_id === BAKANDEYA_BAND_ID
    );
    if (!existingUB) {
      const newUB = {
        id: `ub-${user.id}-${BAKANDEYA_BAND_ID}`,
        user_id: user.id,
        band_id: BAKANDEYA_BAND_ID,
        role: "leader"
      };
      state.userBands.push(newUB);
      try {
        await googleSheetsService.appendUserBand(newUB);
      } catch (e) {}
    }

    try {
      await googleSheetsService.appendUser(user);
    } catch (err) {
      console.warn("Could not append new Google user to Sheets:", err);
    }
  }

  if (accessToken) {
    user.googleAccessToken = accessToken;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const sessionObj = { userId: user.id, googleAccessToken: accessToken, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;

  saveState(state);

  const availableBands = buildAvailableBandsForUser(state, user);
  const { passwordHash: _, salt: __, ...safeUser } = user;

  res.cookie("bakandeya_token", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  res.json({ token, user: safeUser, availableBands });
});

// Login
router.post("/auth/login", loginRateLimiter, async (req, res) => {
  const { username, password, band_id } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }

  const state = loadState();
  const cleanInput = username.trim().toLowerCase();

  // Sync users from Google Sheets tab 'usuarios' to support persistent logins across serverless restarts
  try {
    const sheetUsers = await googleSheetsService.fetchUsers(state.users || []);
    if (sheetUsers && sheetUsers.length > 0) {
      sheetUsers.forEach((su: any) => {
        const idx = state.users.findIndex((u: any) => u.id === su.id || (u.username && u.username.toLowerCase() === su.username?.toLowerCase()));
        if (idx !== -1) {
          if (su.passwordHash) state.users[idx].passwordHash = su.passwordHash;
          if (su.salt) state.users[idx].salt = su.salt;
        } else {
          state.users.push(su);
        }
      });
      saveState(state);
    }
  } catch (err) {
    // Continue with memory state if sheets call fails or is not configured
  }

  // Find all user records matching this username or email
  const matchingUsers = state.users.filter(
    (u: any) => (u.username && u.username.toLowerCase() === cleanInput) || (u.email && u.email.toLowerCase() === cleanInput)
  );

  if (matchingUsers.length === 0) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  // Filter those that pass password check
  const validUsers = matchingUsers.filter((u: any) => verifyPassword(password, u.passwordHash, u.salt));

  if (validUsers.length === 0) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  // Choose target user profile
  let selectedUser = validUsers[0];

  // If a band_id is passed, we check if there's a legacy user record, or we just switch the active band of the user.
  if (band_id) {
    const foundLegacy = validUsers.find((u: any) => u.band_id === band_id);
    if (foundLegacy) {
      selectedUser = foundLegacy;
    } else {
      // In single-user model, update the band_id on the user
      const bandInfo = (state.registeredBands || []).find((b: any) => b.band_id === band_id);
      if (bandInfo) {
        selectedUser.band_id = band_id;
        selectedUser.bandName = bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name;
      }
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const sessionObj = { userId: selectedUser.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;
  saveState(state);

  // Recalculate availableBands
  const availableBands = buildAvailableBandsForUser(state, selectedUser);

  res.cookie("bakandeya_token", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  const { passwordHash, salt, ...safeUser } = selectedUser;
  res.json({ token, user: safeUser, availableBands, multipleBands: availableBands.length > 1 });
});

// Request password reset code
router.post("/auth/reset-password/request", loginRateLimiter, async (req, res) => {
  const { emailOrUsername } = req.body;
  if (!emailOrUsername || !emailOrUsername.trim()) {
    return res.status(400).json({ error: "Indica tu correo electrónico o nombre de usuario" });
  }

  const state = loadState();
  const cleanInput = emailOrUsername.trim().toLowerCase();

  const user = (state.users || []).find(
    (u: any) => u.username.toLowerCase() === cleanInput || u.email?.toLowerCase() === cleanInput
  );

  if (!user) {
    return res.status(404).json({ error: "No se encontró ningún usuario con ese correo o usuario." });
  }

  // Generate cryptographically secure 6 digit code
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  // Store reset code on user object(s) with matching email/username
  (state.users || []).forEach((u: any) => {
    if (u.username.toLowerCase() === cleanInput || u.email?.toLowerCase() === cleanInput) {
      u.resetCode = code;
      u.resetCodeExpires = expiresAt;
    }
  });

  saveState(state);

  // Mask email for privacy display
  const userEmail = user.email || user.username;
  const parts = userEmail.split("@");
  let maskedEmail = userEmail;
  if (parts.length === 2) {
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    maskedEmail = `${maskedName}@${domain}`;
  }

  return res.json({
    success: true,
    message: `Código de verificación enviado a ${maskedEmail}`,
    emailMasked: maskedEmail
  });
});

// Confirm password reset with code and new password
router.post("/auth/reset-password/confirm", loginRateLimiter, async (req, res) => {
  const { emailOrUsername, code, newPassword } = req.body;

  if (!emailOrUsername || !code || !newPassword) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  if (newPassword.trim().length < 6) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  const state = loadState();
  const cleanInput = emailOrUsername.trim().toLowerCase();
  const cleanCode = String(code).trim();

  const matchingUsers = (state.users || []).filter(
    (u: any) => u.username.toLowerCase() === cleanInput || u.email?.toLowerCase() === cleanInput
  );

  if (matchingUsers.length === 0) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  const validUser = matchingUsers.find((u: any) => u.resetCode && String(u.resetCode) === cleanCode && u.resetCodeExpires > Date.now());

  if (!validUser) {
    return res.status(400).json({ error: "El código de verificación es incorrecto o ha caducado. Solicita un nuevo código." });
  }

  // Hash new password
  const { hash, salt } = hashPassword(newPassword.trim());

  // Update password for all user records sharing this email/username
  matchingUsers.forEach((u: any) => {
    u.passwordHash = hash;
    u.salt = salt;
    delete u.resetCode;
    delete u.resetCodeExpires;
  });

  saveState(state);

  return res.json({
    success: true,
    message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña."
  });
});

// Verify current session
router.get("/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-auth-token"] as string || req.query.token as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bakandeya_token=([^;]+)/);
    if (match) token = match[1];
  }

  const state = loadState();
  let session = (token && ACTIVE_SESSIONS[token]) || (token && state.sessions && state.sessions[token]);
  let user = session ? state.users.find((u: any) => u.id === session.userId) : null;

  // Session fallback / recovery if token was missing or memory session was cleared
  if (!user) {
    const fallbackUser = getUserFromRequestLocal(req);
    if (fallbackUser) {
      user = state.users.find((u: any) => u.id === fallbackUser.id) || fallbackUser;
      const effectiveToken = token || `session-${Date.now()}`;
      token = effectiveToken;
      session = { userId: user.id, createdAt: Date.now() };
      ACTIVE_SESSIONS[token] = session;
      if (!state.sessions) state.sessions = {};
      state.sessions[token] = session;
      saveState(state);
    }
  }

  if (!user) {
    return res.status(401).json({ error: "Sesión no válida o expirada" });
  }

  if (token && session) {
    session.createdAt = Date.now();
    ACTIVE_SESSIONS[token] = session;
    if (state.sessions && state.sessions[token]) {
      state.sessions[token].createdAt = Date.now();
      saveState(state);
    }
  }

  // Set/Refresh 30-day session cookie
  if (token) {
    res.cookie("bakandeya_token", token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: "lax",
      path: "/"
    });
  }

  // Recalculate availableBands
  const availableBands = buildAvailableBandsForUser(state, user);

  const { passwordHash, salt, ...safeUser } = user;
  res.json({ token, user: safeUser, availableBands, multipleBands: availableBands.length > 1 });
});

// Switch Active Band
router.post("/auth/switch-band", (req, res) => {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-auth-token"] as string || req.query.token as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bakandeya_token=([^;]+)/);
    if (match) token = match[1];
  }

  const state = loadState();
  let session = (token && ACTIVE_SESSIONS[token]) || (token && state.sessions && state.sessions[token]);
  let currentUser = session ? state.users.find((u: any) => u.id === session.userId) : null;

  // Session fallback / recovery
  if (!currentUser) {
    const fallbackUser = getUserFromRequestLocal(req);
    if (fallbackUser) {
      currentUser = state.users.find((u: any) => u.id === fallbackUser.id) || fallbackUser;
      const effectiveToken = token || `session-${Date.now()}`;
      token = effectiveToken;
      session = { userId: currentUser.id, createdAt: Date.now() };
      ACTIVE_SESSIONS[token] = session;
      if (!state.sessions) state.sessions = {};
      state.sessions[token] = session;
    }
  }

  if (!currentUser) {
    return res.status(401).json({ error: "Sesión no válida o expirada" });
  }

  const { band_id } = req.body;
  if (!band_id) {
    return res.status(400).json({ error: "band_id es requerido" });
  }

  const userEmail = currentUser.email?.toLowerCase() || currentUser.username.toLowerCase();
  const cleanTargetBand = band_id.replace(/^(band|reg)-/, '');

  // Check if they have access to this band (either via userBands, registeredBands or legacy duplicates)
  if (!state.userBands) state.userBands = [];
  const hasAccessInUserBands = state.userBands.some(
    (ub: any) => ub.user_id === currentUser!.id && ub.band_id && ub.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand
  );

  const hasAccessInRegisteredBands = (state.registeredBands || []).some(
    (b: any) =>
      (b.user_id === currentUser!.id || b.email?.toLowerCase() === userEmail) &&
      ((b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand) ||
       (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetBand))
  );

  const legacyTargetUser = state.users.find(
    (u: any) =>
      u.band_id && u.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand &&
      ((u.email && u.email.toLowerCase() === userEmail) || u.username.toLowerCase() === userEmail)
  );

  const isBakandeyaBand = cleanTargetBand === 'bakandeya';

  if (!hasAccessInUserBands && !hasAccessInRegisteredBands && !legacyTargetUser && !isBakandeyaBand) {
    return res.status(404).json({ error: "No tienes acceso a esta banda" });
  }

  let targetUser = currentUser;
  if (legacyTargetUser) {
    targetUser = legacyTargetUser;
  }
  
  const bandInfo = (state.registeredBands || []).find(
    (b: any) => b.band_id === band_id || b.id === band_id ||
    (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand) ||
    (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetBand)
  ) || (state.bands || []).find(
    (b: any) => b.band_id === band_id || b.id === band_id ||
    (b.band_id && b.band_id.replace(/^(band|reg)-/, '') === cleanTargetBand) ||
    (b.id && b.id.replace(/^(band|reg)-/, '') === cleanTargetBand)
  );

  const resolvedName = bandInfo ? (bandInfo.nombre_banda || bandInfo.bandName || bandInfo.name) : (cleanTargetBand === 'bakandeya' ? 'BAKANDEYA' : targetUser.bandName || 'Banda');

  targetUser.band_id = band_id;
  targetUser.bandName = resolvedName;

  // Sync band_id on all user records matching email
  if (state.users) {
    state.users.forEach((u: any) => {
      if (u.id === targetUser.id || (userEmail && (u.email?.toLowerCase() === userEmail || u.username?.toLowerCase() === userEmail))) {
        u.band_id = band_id;
        u.bandName = resolvedName;
      }
    });
  }

  // Update session
  const effectiveToken = token || `session-${Date.now()}`;
  session = { userId: targetUser.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[effectiveToken] = session;
  if (!state.sessions) state.sessions = {};
  state.sessions[effectiveToken] = session;
  saveState(state);

  res.cookie("bakandeya_token", effectiveToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: "lax",
    path: "/"
  });

  // Recalculate availableBands dynamically using userBands
  const availableBands = buildAvailableBandsForUser(state, targetUser);

  const { passwordHash, salt, ...safeUser } = targetUser;
  res.json({ token: effectiveToken, user: safeUser, availableBands });
});

// Logout
router.post("/auth/logout", (req, res) => {
  const { token } = req.body;
  if (token) {
    delete ACTIVE_SESSIONS[token];
    const state = loadState();
    if (state.sessions && state.sessions[token]) {
      delete state.sessions[token];
      saveState(state);
    }
  }
  res.clearCookie("bakandeya_token", { path: "/" });
  res.json({ success: true });
});

// Associate an existing user to the leader's band using exact email match
router.post("/users/associate", requireAuth, requireLeader, async (req, res) => {
  try {
    const { email, role, instrument } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El email del músico es requerido" });
    }

    const state = loadState();
    const targetBandId = (req as any).user?.band_id || "band-bakandeya";
    const cleanSearch = email.trim().toLowerCase();

    const targetUser = state.users.find((u: any) => 
      (u.email && u.email.toLowerCase() === cleanSearch) ||
      (u.username && u.username.toLowerCase() === cleanSearch)
    );

    if (!targetUser) {
      return res.status(404).json({ error: "No existe ningún usuario registrado con este email." });
    }

    if (!state.userBands) state.userBands = [];
    const relationExists = state.userBands.some(
      (ub: any) => ub.user_id === targetUser.id && ub.band_id === targetBandId
    );

    if (relationExists) {
      return res.status(400).json({ error: "Este músico ya es miembro de tu banda." });
    }

    // Add the relationship
    const newUB = {
      id: `ub-${targetUser.id}-${targetBandId}`,
      user_id: targetUser.id,
      band_id: targetBandId,
      role: role === "leader" ? "leader" : "member",
      createdAt: new Date().toISOString()
    };
    state.userBands.push(newUB);
    try {
      await googleSheetsService.appendUserBand(newUB);
    } catch (e) {
      console.warn("Failed to append userBand to sheets", e);
    }

    if (instrument) {
      targetUser.instrument = instrument.trim();
    }

    saveState(state);

    try {
      await googleSheetsService.updateUser(targetUser);
    } catch (err) {
      console.warn("Notice: Sync pending:", err);
    }

    const { passwordHash, salt, ...safeUser } = targetUser;
    res.status(201).json(safeUser);
  } catch (err: any) {
    console.error("Error in /users/associate:", err);
    res.status(500).json({ error: err?.message || "Error al asociar el músico a la banda" });
  }
});

// Get all band users (without password hashes)
router.get("/users", requireAuth, async (req, res) => {
  const state = loadState();
  const bandId = (req as any).user?.band_id || "band-bakandeya";

  if (!state.userBands) state.userBands = [];
  const bandUserIds = new Set(
    state.userBands.filter((ub: any) => ub.band_id === bandId).map((ub: any) => ub.user_id)
  );

  const bandUsers = state.users.filter((u: any) => bandUserIds.has(u.id)).map((u: any) => {
    const ub = state.userBands.find((ub: any) => ub.user_id === u.id && ub.band_id === bandId);
    return { ...u, role: ub?.role || 'member' };
  });

  try {
    const sheetUsers = await googleSheetsService.fetchUsers(bandUsers);
    const mergedUsers = sheetUsers.map((u: any) => {
      const ub = state.userBands.find((ub: any) => ub.user_id === u.id && ub.band_id === bandId);
      return { ...u, role: ub?.role || 'member' };
    });
    res.json(getSafeUsers(mergedUsers));
  } catch (_) {
    res.json(getSafeUsers(bandUsers));
  }
});

// Create new user (Leader operation)
router.post("/users", requireAuth, requireLeader, async (req, res) => {
  const { username, name, password, role, instrument, avatarColor, email, band_id } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ error: "Nombre de usuario, nombre real y contraseña son requeridos" });
  }

  const state = loadState();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email ? email.trim().toLowerCase() : cleanUsername;
  const targetBandId = band_id || (req as any).user?.band_id || "band-bakandeya";

  // Check if a user with this email or username already exists
  const existingUser = state.users.find(
    (u: any) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanEmail)
  );

  if (existingUser) {
    if (!state.userBands) state.userBands = [];
    const relationExists = state.userBands.some(
      (ub: any) => ub.user_id === existingUser.id && ub.band_id === targetBandId
    );

    if (relationExists) {
      return res.status(400).json({ error: "Este usuario ya está registrado en esta banda." });
    }

    // Just create the relationship in state.userBands
    const newUB = {
    
      id: `ub-${existingUser.id}-${targetBandId}`,
      user_id: existingUser.id,
      band_id: targetBandId,
      role: role === "leader" ? "leader" : "member",
      createdAt: new Date().toISOString()
  };
  state.userBands.push(newUB);
  try {
    await googleSheetsService.appendUserBand(newUB);
  } catch (e) {
    console.warn("Failed to append userBand to sheets", e);
  }

    if (instrument) existingUser.instrument = instrument.trim();
    saveState(state);

    const { passwordHash, salt: _, ...safeUser } = existingUser;
    return res.status(201).json(safeUser);
  }

  // Create new user record
  const { hash, salt } = hashPassword(password);
  const existingIds = new Set<string>((state.users || []).map((u: any) => u.id));
  const newUserId = generateUniqueSlugId("user", cleanUsername, existingIds);

  const newUser = {
    id: newUserId,
    username: cleanUsername,
    name: name.trim(),
    email: cleanEmail,
    role: role === "leader" ? "leader" : "member",
    instrument: instrument ? instrument.trim() : "Músico",
    avatarColor: avatarColor || "#3b82f6",
    passwordHash: hash,
    salt: salt,
    band_id: targetBandId,
    createdAt: new Date().toISOString()
  };

  state.users.push(newUser);

  if (!state.userBands) state.userBands = [];
  state.userBands.push({
    id: `ub-${newUserId}-${targetBandId}`,
    user_id: newUserId,
    band_id: targetBandId,
    role: role === "leader" ? "leader" : "member",
    createdAt: new Date().toISOString()
  });

  saveState(state);

  try {
    await googleSheetsService.appendUser(newUser);
  } catch (err) {
    console.warn("Notice: User saved locally, Google Sheets update skipped or pending:", err);
  }

  const { passwordHash, salt: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Update user (Leader or self)
router.put("/users/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const loggedUser = (req as any).user;
  if (loggedUser.role !== 'leader' && loggedUser.id !== id) {
    return res.status(403).json({ error: "Acceso denegado. Solo puedes modificar tu propia cuenta." });
  }
  const { name, role, instrument, avatarColor, newPassword, googleOAuth } = req.body;

  const state = loadState();
  const userIndex = state.users.findIndex((u: any) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const user = state.users[userIndex];
  if (name) user.name = name.trim();
  if (googleOAuth !== undefined) user.googleOAuth = googleOAuth;

  // Security guard: Only leaders can change the role property.
  if (role !== undefined) {
    if (loggedUser.role === 'leader') {
      const targetBandId = (req as any).user?.band_id || "band-bakandeya";
      if (!state.userBands) state.userBands = [];
      const userBand = state.userBands.find((ub: any) => ub.user_id === id && ub.band_id === targetBandId);
      if (userBand) {
        userBand.role = role === "leader" ? "leader" : "member";
      }
      user.role = role === "leader" ? "leader" : "member";
    } else {
      console.warn(`[Security Guard] Non-leader user ${loggedUser.username} (${loggedUser.id}) attempted to set role to '${role}' on user ${id}. Field ignored.`);
    }
  }

  if (instrument !== undefined) user.instrument = instrument.trim();
  if (avatarColor) user.avatarColor = avatarColor;

  if (newPassword && newPassword.trim().length > 0) {
    const { hash, salt } = hashPassword(newPassword.trim());
    user.passwordHash = hash;
    user.salt = salt;
  }

  saveState(state);

  try {
    await googleSheetsService.updateUser(user);
  } catch (err) {
    console.warn("Notice: User updated locally, Google Sheets update skipped or pending:", err);
  }

  const { passwordHash, salt, ...safeUser } = user;
  res.json(safeUser);
});

// Delete user (Leader operation)
router.delete("/users/:id", requireAuth, requireLeader, async (req, res) => {
  const { id } = req.params;
  const state = loadState();
  const targetBandId = (req as any).user?.band_id || "band-bakandeya";

  if (!state.userBands) state.userBands = [];

  const userBandRelation = state.userBands.find(
    (ub: any) => ub.user_id === id && ub.band_id === targetBandId
  );

  if (!userBandRelation) {
    return res.status(404).json({ error: "Usuario no encontrado en esta banda" });
  }

  if (userBandRelation.role === "leader") {
    const leaderCount = state.userBands.filter(
      (ub: any) => ub.band_id === targetBandId && ub.role === "leader"
    ).length;
    if (leaderCount <= 1) {
      return res.status(400).json({ error: "No se puede eliminar al único líder de la banda" });
    }
  }

  // Remove relationship from userBands
  state.userBands = state.userBands.filter(
    (ub: any) => !(ub.user_id === id && ub.band_id === targetBandId)
  );

  // If user is not part of any other band, we can delete their main user record too
  const otherBandsExist = state.userBands.some((ub: any) => ub.user_id === id);
  if (!otherBandsExist) {
    state.users = state.users.filter((u: any) => u.id !== id);
  }

  saveState(state);

  try {
    await googleSheetsService.deleteUserBand(`ub-${id}-${targetBandId}`);
    if (!otherBandsExist) {
      await googleSheetsService.deleteUser(id);
    }
  } catch (err) {
    console.warn("Notice: User deleted locally, Google Sheets update skipped or pending:", err);
  }

  res.json({ success: true, id });
});

export default router;
