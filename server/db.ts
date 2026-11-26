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
  return upgrade(JSON.parse(fs.readFileSync(dbFile, 'utf8')) as Partial<Database> & Omit<Database, 'activity' | 'nextActivityId'>);
}

// Data files written before activity history have no events; history starts empty for them.
function upgrade(data: Partial<Database> & Omit<Database, 'activity' | 'nextActivityId'>): Database {
  return { ...data, activity: data.activity ?? [], nextActivityId: data.nextActivityId ?? 1 };
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
