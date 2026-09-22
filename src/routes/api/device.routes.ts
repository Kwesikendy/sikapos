import { Router } from 'express';
import { DeviceService } from '../../services/device.service.ts';
import { AuthService } from '../../services/auth.service.ts';
import { createAuthMiddleware } from '../../middleware/auth.ts';
import { enforceTenantContext } from '../../middleware/tenant.ts';
import { requirePermission } from '../../middleware/rbac.ts';
import { validateBody } from '../../middleware/validate.ts';

export const deviceRouter = Router();

const deviceService = new DeviceService();
const authService = new AuthService();
const authenticate = createAuthMiddleware(authService);

deviceRouter.use(authenticate, enforceTenantContext);

/**
 * Register a POS terminal or mobile tablet register
 */
deviceRouter.post('/register', requirePermission('settings.manage'), validateBody([
  { field: 'branchId', required: true },
  { field: 'deviceName', required: true },
  { field: 'deviceIdentifier', required: true },
  { field: 'deviceType', required: true },
  { field: 'hardwareModel', required: true }
]), (req, res, next) => {
  try {
    const { branchId, deviceName, deviceIdentifier, deviceType, hardwareModel } = req.body;

    const device = deviceService.registerDevice({
      tenantId: req.tenantContext!.tenantId,
      branchId,
      deviceName,
      deviceIdentifier,
      deviceType,
      hardwareModel
    });

    res.status(201).json({
      success: true,
      data: device
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Record terminal heartbeat / ping
 */
deviceRouter.post('/heartbeat', validateBody([
  { field: 'deviceIdentifier', required: true }
]), (req, res) => {
  const { deviceIdentifier } = req.body;
  const result = deviceService.recordHeartbeat(req.tenantContext!.tenantId, deviceIdentifier);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Architectural foundation for future Phase 11 local transaction synchronization.
 * Idempotent queue receiver rejecting duplicates using clientEventId.
 */
deviceRouter.post('/sync-queue', validateBody([
  { field: 'deviceId', required: true },
  { field: 'clientEventId', required: true },
  { field: 'eventType', required: true },
  { field: 'payload', required: true, type: 'object' }
]), (req, res) => {
  const { deviceId, clientEventId, eventType, payload } = req.body;

  const result = deviceService.queueOfflineSyncEvent(
    req.tenantContext!.tenantId,
    deviceId,
    clientEventId,
    eventType,
    payload as Record<string, unknown>
  );

  res.json({
    success: true,
    data: {
      status: result.status,
      eventId: result.eventId,
      message: result.status === 'duplicate'
        ? 'Event already acknowledged previously (idempotent duplicate)'
        : 'Event queued for server verification'
    }
  });
});

/**
 * List registered devices for a branch
 */
deviceRouter.get('/branch/:branchId', (req, res) => {
  const devices = deviceService.getBranchDevices(req.tenantContext!.tenantId, req.params.branchId);

  res.json({
    success: true,
    data: devices
  });
});
