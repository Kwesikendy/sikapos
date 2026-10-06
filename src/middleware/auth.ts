import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.ts';
import { FirebaseService } from '../services/firebase.service.ts';
import { getFirebaseAuth } from '../lib/firebase-admin.ts';
import type { UserSummary } from '../types/index.ts';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: UserSummary;
      tenantId?: string;
      token?: string;
      firebaseUid?: string;
    }
  }
}

/**
 * Universal Auth Middleware
 * Supports both SikaPOS session tokens and Firebase ID tokens.
 */
export function createAuthMiddleware(authService?: AuthService) {
  const service = authService || new AuthService();
  const firebaseService = new FirebaseService();

  return async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication token required' }
      });
      return;
    }

    const token = authHeader.substring(7).trim();

    // 1. Try local session token first
    const session = service.validateSession(token);
    if (session) {
      req.user = session.user;
      req.tenantId = session.tenantId;
      req.token = token;
      return next();
    }

    // 2. Try Firebase ID token
    try {
      const decoded = await getFirebaseAuth().verifyIdToken(token);
      const uid = decoded.uid;

      // Look up user or restore from Firestore
      const restored = await firebaseService.findOrRestoreFirebaseUser(
        uid,
        decoded.email,
        decoded.phone_number
      );

      if (restored) {
        req.firebaseUid = uid;
        req.tenantId = restored.tenantId;
        req.user = restored.user;
        req.token = token;
        return next();
      }

      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User profile not registered with a store' }
      });
      return;
    } catch (err: any) {
      const isExpired = err?.code === 'auth/id-token-expired';
      res.status(401).json({
        success: false,
        error: {
          code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
          message: isExpired ? 'Session has expired. Please sign in again.' : 'Session has expired or is invalid'
        }
      });
    }
  };
}
