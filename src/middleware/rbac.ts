import type { Request, Response, NextFunction } from 'express';
import type { PermissionCode, UserRole } from '../types/index.ts';

export function requireRole(...allowedRoles: UserRole[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role as UserRole));
    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient role privileges. Required one of: ${allowedRoles.join(', ')}`
        }
      });
      return;
    }

    next();
  };
}

export function requirePermission(requiredPermission: PermissionCode) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    // Owners automatically inherit all tenant permissions
    if (req.user.roles.includes('Owner')) {
      next();
      return;
    }

    const hasPermission = req.user.permissions.includes(requiredPermission);
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permission: ${requiredPermission}`
        }
      });
      return;
    }

    next();
  };
}
