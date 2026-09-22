import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.ts';
import type { UserSummary } from '../types/index.ts';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: UserSummary;
      tenantId?: string;
      token?: string;
    }
  }
}

export function createAuthMiddleware(authService?: AuthService) {
  const service = authService || new AuthService();

  return function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required'
        }
      });
      return;
    }

    const token = authHeader.substring(7).trim();
    const session = service.validateSession(token);

    if (!session) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session has expired or is invalid'
        }
      });
      return;
    }

    req.user = session.user;
    req.tenantId = session.tenantId;
    req.token = token;

    next();
  };
}
