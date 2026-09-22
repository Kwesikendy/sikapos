import path from 'path';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  host: string;
  databasePath: string;
  sessionSecret: string;
  sessionExpiryHours: number;
  otpProvider: 'sandbox' | 'log' | 'mock';
  corsOrigin: string;
  authRateLimitWindowMs: number;
  authRateLimitMaxAttempts: number;
}

export function loadConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'test' | 'production';

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    databasePath: process.env.DATABASE_PATH || (nodeEnv === 'test' ? ':memory:' : path.resolve(process.cwd(), 'data', 'sikapos.db')),
    sessionSecret: process.env.SESSION_SECRET || 'dev-sikapos-secret-key-change-in-production-min32chars',
    sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS || '24', 10),
    otpProvider: (process.env.OTP_PROVIDER || 'sandbox') as 'sandbox' | 'log' | 'mock',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
    authRateLimitMaxAttempts: parseInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || '5', 10),
  };
}

export const config = loadConfig();
