import { construireApp } from './app.js';
import { config } from './config.js';
import { createPool } from './db.js';
import { migrer } from './migrate.js';

const db = createPool(config.databaseUrl);

// Les migrations passent au demarrage : un deploiement ne peut pas servir
// une API sur un schema en retard.
const appliquees = await migrer(db, config.migrationsDir);

const app = await construireApp({ db, corsOrigin: config.corsOrigin, logger: true });
if (appliquees.length) app.log.info({ appliquees }, 'migrations appliquees');

const arreter = async () => {
  await app.close();
  await db.end();
  process.exit(0);
};
process.on('SIGTERM', arreter);
process.on('SIGINT', arreter);

await app.listen({ port: config.port, host: config.host });
