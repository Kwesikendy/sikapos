import { Router } from 'express';
import { getDb } from '../../db/connection.ts';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 as alive').get() as { alive: number };

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: result.alive === 1 ? 'connected' : 'unhealthy',
        version: '1.0.0-phase0'
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown database error';
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'System health check failed',
        details: msg
      }
    });
  }
});
