import fs from 'node:fs';
import path from 'node:path';
import { MAX_ITEM_NAME_LENGTH, orderTotalCents } from '../shared/order-rules';
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
  return upgrade(JSON.parse(fs.readFileSync(dbFile, 'utf8')) as Database);
}

// Data files written before orders had items get one item per order.
function upgrade(data: Database): Database {
  if (data.nextItemId !== undefined) return data;
  let nextItemId = 1;
  for (const order of data.orders) {
    const unitPriceCents = orderTotalCents(order);
    order.items = [{ id: nextItemId++, name: order.name.slice(0, MAX_ITEM_NAME_LENGTH), quantity: 1, unitPriceCents }];
    order.priceCents = unitPriceCents;
  }
  const upgraded = { ...data, nextItemId };
  persist(upgraded);
  return upgraded;
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
