import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Db } from './db.js';

/** Applique dans l'ordre les fichiers NNN_*.sql pas encore passes. */
export async function migrer(db: Db, dossier: string): Promise<string[]> {
  await db.query(`CREATE TABLE IF NOT EXISTS migration (
    nom text PRIMARY KEY,
    appliquee_le timestamptz NOT NULL DEFAULT now()
  )`);
  const deja = new Set(
    (await db.query<{ nom: string }>('SELECT nom FROM migration')).rows.map((r) => r.nom),
  );
  const fichiers = (await readdir(dossier)).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
  const appliquees: string[] = [];

  for (const fichier of fichiers) {
    if (deja.has(fichier)) continue;
    const sql = await readFile(path.join(dossier, fichier), 'utf8');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO migration (nom) VALUES ($1)', [fichier]);
      await client.query('COMMIT');
      appliquees.push(fichier);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${fichier} en echec : ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
  return appliquees;
}
