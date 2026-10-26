import { config } from './config';
import { resetDb } from './db';

resetDb();
console.log(`Database reset in ${config.dataDir}`);
