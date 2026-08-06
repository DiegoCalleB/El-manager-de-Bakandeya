import express from "express";
import crypto from "crypto";
import { ACTIVE_SESSIONS, verifyPassword, hashPassword, getSafeUsers } from "../auth.js";
import { loadState, saveState, requireAuth, requireLeader } from "../state.js";
import { loginRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Login
router.post("/auth/login", loginRateLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }

  const state = loadState();
  const user = state.users.find(
    (u: any) => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const sessionObj = { userId: user.id, createdAt: Date.now() };
  ACTIVE_SESSIONS[token] = sessionObj;
  if (!state.sessions) state.sessions = {};
  state.sessions[token] = sessionObj;
  saveState(state);

  const { passwordHash, salt, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Verify current session
router.get("/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-auth-token"] as string || req.query.token as string);

  const state = loadState();
  const session = (token && ACTIVE_SESSIONS[token]) || (token && state.sessions && state.sessions[token]);

  if (!token || !session) {
    return res.status(401).json({ error: "Sesión no válida o expirada" });
  }

  if (token) ACTIVE_SESSIONS[token] = session;
  const user = state.users.find((u: any) => u.id === session.userId);

  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const { passwordHash, salt, ...safeUser } = user;
  res.json({ user: safeUser });
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
  res.json({ success: true });
});

// Get all band users (without password hashes)
router.get("/users", requireAuth, (req, res) => {
  const state = loadState();
  res.json(getSafeUsers(state.users));
});

// Create new user (Leader operation)
router.post("/users", requireAuth, requireLeader, (req, res) => {
  const { username, name, password, role, instrument, avatarColor } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ error: "Nombre de usuario, nombre real y contraseña son requeridos" });
  }

  const state = loadState();
  const cleanUsername = username.trim().toLowerCase();

  if (state.users.some((u: any) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: "El nombre de usuario ya existe" });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `user-${Date.now()}`,
    username: cleanUsername,
    name: name.trim(),
    role: role === "leader" ? "leader" : "member",
    instrument: instrument ? instrument.trim() : "Músico",
    avatarColor: avatarColor || "#3b82f6",
    passwordHash: hash,
    salt: salt,
    createdAt: new Date().toISOString()
  };

  state.users.push(newUser);
  saveState(state);

  const { passwordHash, salt: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Update user (Leader or self)
router.put("/users/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const loggedUser = (req as any).user;
  if (loggedUser.role !== 'leader' && loggedUser.id !== id) {
    return res.status(403).json({ error: "Acceso denegado. Solo puedes modificar tu propia cuenta." });
  }
  const { name, role, instrument, avatarColor, newPassword } = req.body;

  const state = loadState();
  const userIndex = state.users.findIndex((u: any) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const user = state.users[userIndex];
  if (name) user.name = name.trim();

  // Security guard: Only leaders can change the role property. Non-leaders cannot modify role, even on their own account.
  if (role !== undefined) {
    if (loggedUser.role === 'leader') {
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
  const { passwordHash, salt, ...safeUser } = user;
  res.json(safeUser);
});

// Delete user (Leader operation)
router.delete("/users/:id", requireAuth, requireLeader, (req, res) => {
  const { id } = req.params;
  const state = loadState();

  const userToDelete = state.users.find((u: any) => u.id === id);
  if (!userToDelete) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  if (userToDelete.role === "leader") {
    const leaderCount = state.users.filter((u: any) => u.role === "leader").length;
    if (leaderCount <= 1) {
      return res.status(400).json({ error: "No se puede eliminar al único líder de la banda" });
    }
  }

  state.users = state.users.filter((u: any) => u.id !== id);
  saveState(state);
  res.json({ success: true, id });
});

export default router;
