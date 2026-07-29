import express from "express";
import crypto from "crypto";

// Active sessions stored in memory and persisted
export const ACTIVE_SESSIONS: Record<string, { userId: string; createdAt: number }> = {};

export function hashPassword(password: string, salt?: string) {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, actualSalt, 1000, 64, "sha512").toString("hex");
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

export function getSafeUsers(users: any[]) {
  if (!Array.isArray(users)) return [];
  return users.map(u => {
    const { passwordHash, salt, ...safeUser } = u;
    return safeUser;
  });
}

// Extract user & role from incoming request
export function getUserFromRequest(req: express.Request, loadStateFn: () => any): { id: string; role: string; username: string } | null {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-auth-token"] as string || req.query.token as string);

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/bakandeya_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token && ACTIVE_SESSIONS[token]) {
    const session = ACTIVE_SESSIONS[token];
    const state = loadStateFn();
    const user = state.users?.find((u: any) => u.id === session.userId);
    if (user) {
      return { id: user.id, role: user.role || 'member', username: user.username };
    }
  }
  return null;
}

// Middleware: Requires valid authenticated user
export function createAuthMiddleware(loadStateFn: () => any) {
  return function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = getUserFromRequest(req, loadStateFn);
    if (!user) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    (req as any).user = user;
    next();
  };
}

// Middleware: Requires leader/admin user
export function createLeaderMiddleware(loadStateFn: () => any) {
  return function requireLeader(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = (req as any).user || getUserFromRequest(req, loadStateFn);
    if (!user) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    if (user.role !== 'leader') {
      return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de dirección/leader." });
    }
    (req as any).user = user;
    next();
  };
}

// Middleware: Allows request if valid CRON secret header is present OR user is authenticated
export function createCronOrAuthMiddleware(loadStateFn: () => any) {
  return function requireCronOrAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const cronSecretHeader = req.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecretHeader === expectedSecret) {
      return next();
    }

    const user = getUserFromRequest(req, loadStateFn);
    if (user) {
      (req as any).user = user;
      return next();
    }

    return res.status(401).json({
      error: "Acceso denegado. Se requiere sesión activa o cabecera X-Cron-Secret válida."
    });
  };
}
