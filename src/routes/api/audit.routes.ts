import { Router } from 'express';
import { AuditService } from '../../services/audit.service.ts';
import { AuthService } from '../../services/auth.service.ts';
import { createAuthMiddleware } from '../../middleware/auth.ts';
import { enforceTenantContext } from '../../middleware/tenant.ts';
import { requirePermission } from '../../middleware/rbac.ts';

export const auditRouter = Router();

const auditService = new AuditService();
const authService = new AuthService();
const authenticate = createAuthMiddleware(authService);

auditRouter.use(authenticate, enforceTenantContext);

auditRouter.get('/logs', requirePermission('reports.view'), (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
  const logs = auditService.getTenantAuditLogs(req.tenantContext!.tenantId, limit);

  res.json({
    success: true,
    data: logs
  });
});
