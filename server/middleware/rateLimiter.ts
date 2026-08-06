import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [ip: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

/**
 * Rate limiter middleware for sensitive endpoints like login.
 * Limits IP requests within a time window.
 */
export function createRateLimiter(options: { windowMs?: number; maxRequests?: number } = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute window
  const maxRequests = options.maxRequests || 15; // 15 requests max

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.ip || "127.0.0.1";
    const now = Date.now();

    if (!rateLimitStore[ip] || rateLimitStore[ip].resetTime < now) {
      rateLimitStore[ip] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    rateLimitStore[ip].count += 1;

    if (rateLimitStore[ip].count > maxRequests) {
      return res.status(429).json({
        error: "Demasiadas peticiones. Por favor, espera un momento antes de volver a intentarlo."
      });
    }

    next();
  };
}

export const loginRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 10 });
