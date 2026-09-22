import express from 'express';
import path from 'path';
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

  // Static assets from project root (preserves original Stitch screens, logos, assets)
  app.use(express.static(rootDir));

  // REST API v1
  app.use('/api/v1', apiRouter);

  // Dedicated routes for approved Stage 2 Stitch screens
  app.get('/merchant-signup', (req, res) => {
    res.sendFile(path.join(rootDir, 'merchant_signup_welcome', 'code.html'));
  });

  app.get('/store-setup', (req, res) => {
    res.sendFile(path.join(rootDir, 'business_store_setup_wizard', 'code.html'));
  });

  app.get('/launch-readiness', (req, res) => {
    res.sendFile(path.join(rootDir, 'cashier_pin_launch_readiness', 'code.html'));
  });

  app.get('/cashier-login', (req, res) => {
    res.sendFile(path.join(rootDir, 'cashier_pin_login_otp_verification', 'code.html'));
  });

  // Root entry point (Stage 2 Navigator)
  app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
  });

  // Centralized error and 404 handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
