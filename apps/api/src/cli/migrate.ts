import { config } from '../config.js';
import { createPool } from '../db.js';
import { migrer } from '../migrate.js';

const db = createPool(config.databaseUrl);
try {
  const appliquees = await migrer(db, config.migrationsDir);
  console.log(appliquees.length ? `Migrations appliquees : ${appliquees.join(', ')}` : 'Schema a jour.');
} finally {
  await db.end();
}
