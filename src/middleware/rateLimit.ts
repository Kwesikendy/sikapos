import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.ts';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs?: number;
  maxAttempts?: number;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
  skipInTest?: boolean;
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || config.authRateLimitWindowMs;
  const maxAttempts = options.maxAttempts || config.authRateLimitMaxAttempts;
  const keyPrefix = options.keyPrefix || 'rl';
  const skipInTest = options.skipInTest ?? true; // Skip in automated test mode by default to ensure test stability

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (config.nodeEnv === 'test' && skipInTest) {
      next();
      return;
    }

    const identifier = options.keyGenerator
      ? options.keyGenerator(req)
      : (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');

    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      next();
      return;
    }

    record.count += 1;

    if (record.count > maxAttempts) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
          retryAfterSeconds
        }
      });
      return;
    }

    next();
  };
}

export function resetRateLimits(): void {
  rateLimitStore.clear();
}
