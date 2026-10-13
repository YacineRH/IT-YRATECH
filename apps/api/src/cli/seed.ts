import { config } from '../config.js';
import { chargerContenu } from '../contenu.js';
import { createPool } from '../db.js';
import { migrer } from '../migrate.js';
import { chargerEnBase } from '../seed.js';

const db = createPool(config.databaseUrl);
try {
  await migrer(db, config.migrationsDir);
  const jeu = await chargerContenu(config.contentDir);
  const bilan = await chargerEnBase(db, jeu);
  console.log(
    `Contenu charge : ${bilan.domaines} domaines, ${bilan.contenus} contenus, ${bilan.alertesDemo} alertes d'exemple.`,
  );
} finally {
  await db.end();
}
