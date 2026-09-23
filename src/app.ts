import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api/index.ts';
import { notFoundHandler, globalErrorHandler } from './middleware/error.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function createApp(): express.Application {
  const app = express();

  // Basic security and parsing middleware
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Serve compiled React client assets
  const clientDist = path.join(rootDir, 'dist', 'client');
  const clientIndexHtml = path.join(clientDist, 'index.html');
  const fsExistsClient = fs.existsSync(clientIndexHtml);

  if (fsExistsClient) {
    app.use(express.static(clientDist));
  }

  // Static assets from project root (preserves original Stitch screens, logos, assets)
  app.use(express.static(rootDir));

  // REST API v1
  app.use('/api/v1', apiRouter);

  // Modern React SPA routes (serving the React bundle with legacy fallback)
  const serveSpaOrFallback = (fallbackPath: string) => (req: express.Request, res: express.Response) => {
    if (fs.existsSync(clientIndexHtml)) {
      res.sendFile(clientIndexHtml);
    } else {
      res.sendFile(path.join(rootDir, fallbackPath));
    }
  };

  app.get('/merchant-signup', serveSpaOrFallback(path.join('merchant_signup_welcome', 'code.html')));
  app.get('/store-setup', serveSpaOrFallback(path.join('business_store_setup_wizard', 'code.html')));
  app.get('/launch-readiness', serveSpaOrFallback(path.join('cashier_pin_launch_readiness', 'code.html')));
  app.get('/cashier-login', serveSpaOrFallback(path.join('cashier_pin_login_otp_verification', 'code.html')));
  app.get('/', serveSpaOrFallback('index.html'));

  // Legacy reference routes preserving original Stitch screens
  app.get('/legacy/merchant-signup', (req, res) => {
    res.sendFile(path.join(rootDir, 'merchant_signup_welcome', 'code.html'));
  });
  app.get('/legacy/store-setup', (req, res) => {
    res.sendFile(path.join(rootDir, 'business_store_setup_wizard', 'code.html'));
  });
  app.get('/legacy/launch-readiness', (req, res) => {
    res.sendFile(path.join(rootDir, 'cashier_pin_launch_readiness', 'code.html'));
  });
  app.get('/legacy/cashier-login', (req, res) => {
    res.sendFile(path.join(rootDir, 'cashier_pin_login_otp_verification', 'code.html'));
  });
  app.get('/legacy/navigator', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
  });

  // Centralized error and 404 handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
