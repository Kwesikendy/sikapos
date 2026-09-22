import type { Request, Response, NextFunction } from 'express';
import type { TenantContext } from '../types/index.ts';

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

/**
 * Enforces strict server-side tenant isolation.
 * Resolves tenant ID exclusively from authenticated user context.
 * Rejects or strips any client-submitted tenant_id overrides to prevent IDOR attacks.
 */
export function enforceTenantContext(req: Request, res: Response, next: NextFunction): void {
  if (!req.tenantId || !req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Valid authenticated session required for tenant context'
      }
    });
    return;
  }

  // Detect and prevent malicious tenant spoofing attempts
  const clientSuppliedTenant = (req.headers['x-tenant-id'] as string) || req.query.tenant_id || (req.body && req.body.tenant_id);
  if (clientSuppliedTenant && clientSuppliedTenant !== req.tenantId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_MISMATCH',
        message: 'Cross-tenant resource access is strictly prohibited'
      }
    });
    return;
  }

  // Branch context (optional, can be passed via header x-branch-id for multi-branch terminals)
  const branchId = (req.headers['x-branch-id'] as string) || (req.query.branch_id as string);

  req.tenantContext = {
    tenantId: req.tenantId,
    branchId: branchId ? String(branchId) : undefined,
    user: req.user
  };

  next();
}
