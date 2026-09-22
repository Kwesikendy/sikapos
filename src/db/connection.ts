import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.ts';

let dbInstance: Database.Database | null = null;

export function getDb(customPath?: string): Database.Database {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbPath = customPath || config.databasePath;

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);

  // Enforce SQLite integrity constraints
  db.pragma('foreign_keys = ON');
  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
