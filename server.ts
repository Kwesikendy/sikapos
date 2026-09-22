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

app.listen(config.port, config.host, () => {
  console.log(`=======================================================`);
  console.log(`  SikaPOS / Akoma Commerce Cloud`);
  console.log(`  Phase 0 Architecture & Foundation Active`);
  console.log(`  Server: http://${config.host}:${config.port}`);
  console.log(`  API Health: http://${config.host}:${config.port}/api/v1/health`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`=======================================================`);
});
