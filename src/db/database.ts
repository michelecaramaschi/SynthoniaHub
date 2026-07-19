import Database from "better-sqlite3";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "migrations");

export function openDatabase(dbPath: string): Database.Database {
  if (dbPath !== ":memory:") {
    mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return db;
}

function runMigrations(db: Database.Database): void {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))",
  );
  const applied = new Set(
    db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((r) => (r as { name: string }).name),
  );
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const record = db.prepare("INSERT INTO schema_migrations (name) VALUES (?)");
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(migrationsDir, file), "utf-8");
    db.transaction(() => {
      db.exec(sql);
      record.run(file);
    })();
  }
}
