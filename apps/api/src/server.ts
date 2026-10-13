import { construireApp } from './app.js';
import { config } from './config.js';
import { createPool } from './db.js';
import { migrer } from './migrate.js';
import { chargerContenu } from './contenu.js';
import { chargerEnBase } from './seed.js';

const db = createPool(config.databaseUrl);

// Les migrations passent au demarrage : un deploiement ne peut pas servir
// une API sur un schema en retard.
const appliquees = await migrer(db, config.migrationsDir);
const bilan = config.chargerContenu
  ? await chargerEnBase(db, await chargerContenu(config.contentDir), { alertesDemo: config.alertesDemo })
  : null;

const app = await construireApp({ db, corsOrigin: config.corsOrigin, logger: true });
if (appliquees.length) app.log.info({ appliquees }, 'migrations appliquees');
if (bilan) app.log.info(bilan, 'contenu charge');

const arreter = async () => {
  await app.close();
  await db.end();
  process.exit(0);
};
process.on('SIGTERM', arreter);
process.on('SIGINT', arreter);

await app.listen({ port: config.port, host: config.host });
