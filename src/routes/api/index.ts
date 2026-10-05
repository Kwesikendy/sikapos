import { Router } from 'express';
import { healthRouter } from './health.routes.ts';
import { authRouter } from './auth.routes.ts';
import { tenantRouter } from './tenant.routes.ts';
import { taxRouter } from './tax.routes.ts';
import { deviceRouter } from './device.routes.ts';
import { auditRouter } from './audit.routes.ts';
import { productRouter } from './product.routes.ts';
import { saleRouter } from './sale.routes.ts';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/tenants', tenantRouter);
apiRouter.use('/tax', taxRouter);
apiRouter.use('/devices', deviceRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/sales', saleRouter);
