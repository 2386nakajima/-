import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const globalForDb = globalThis as unknown as { __db?: DatabaseSync };

export const db = globalForDb.__db ?? new DatabaseSync(DB_PATH);
if (!globalForDb.__db) {
  globalForDb.__db = db;
}

// Next.js may evaluate this module from several worker processes at once
// (e.g. during build-time page data collection), so wait out lock contention
// instead of failing immediately with SQLITE_BUSY.
db.exec("PRAGMA busy_timeout = 5000;");
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    video_filename TEXT NOT NULL,
    video_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    transcript TEXT,
    decided_items TEXT,
    action_items TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_meetings_company_id ON meetings(company_id);
`);
