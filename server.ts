import { createApp } from './src/app.ts';
import { initializeDatabase } from './src/db/init.ts';
import { config } from './src/config/env.ts';

// Initialize SQLite database and seed foundational schema
try {
  initializeDatabase();
  console.log('✓ SikaPOS database initialized and foundational roles/permissions seeded');
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

const app = createApp();

const primaryPort = config.port;

app.listen(primaryPort, config.host, () => {
  console.log(`=======================================================`);
  console.log(`  SikaPOS / Akoma Commerce Cloud`);
  console.log(`  Phase 0 Architecture & Foundation Active`);
  console.log(`  Server: http://${config.host}:${primaryPort}`);
  console.log(`  API Health: http://${config.host}:${primaryPort}/api/v1/health`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`=======================================================`);
});

// Dual-listener support: ensure both port 3000 and 3003 are reachable locally
// so PWA service worker caches, previous browser tabs, and Render/Vite work interchangeably
const secondaryPort = primaryPort === 3000 ? 3003 : (primaryPort === 3003 ? 3000 : null);
/* 
if (secondaryPort) {
  try {
    const secondaryServer = app.listen(secondaryPort, config.host, () => {
      console.log(`  Secondary Port Active: http://${config.host}:${secondaryPort} (Dual-port bridge active)`);
    });
    secondaryServer.on('error', (err: any) => {
      if (err.code !== 'EADDRINUSE') {
        console.warn(`[Server] Secondary port ${secondaryPort} notice:`, err.message);
      }
    });
  } catch (err) {
    // Port in use or disallowed, ignore safely
  }
}
*/

