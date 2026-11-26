import fs from 'node:fs';
import path from 'node:path';
import { config } from './config';
import { seedDatabase, type Database } from './seed';

const dbFile = path.join(config.dataDir, 'db.json');

let db: Database = load();

function load(): Database {
  if (!fs.existsSync(dbFile)) {
    const seeded = seedDatabase();
    persist(seeded);
    return seeded;
  }
  // Databases created before notes existed have no notes fields yet.
  const stored = JSON.parse(fs.readFileSync(dbFile, 'utf8')) as Partial<Database>;
  return { nextNoteId: 1, notes: [], ...stored } as Database;
}

function persist(data: Database): void {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

export function getDb(): Database {
  return db;
}

export function saveDb(): void {
  persist(db);
}

export function resetDb(): void {
  db = seedDatabase();
  persist(db);
}
