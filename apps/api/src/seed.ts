import type { PoolClient } from 'pg';
import type { Db } from './db.js';
import type { JeuDeContenu } from './contenu.js';

export interface BilanChargement {
  domaines: number;
  contenus: number;
  alertesDemo: number;
}

/**
 * Charge le contenu versionne dans la base, dans une seule transaction.
 * Les fichiers font foi pour le contenu manuel : un contenu manuel absent
 * des fichiers est supprime. Le contenu genere (origine 'mcp') est conserve.
 */
export async function chargerEnBase(
  db: Db,
  jeu: JeuDeContenu,
  { maintenant = new Date(), alertesDemo = true }: { maintenant?: Date; alertesDemo?: boolean } = {},
): Promise<BilanChargement> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const idsDomaines = await chargerDomaines(client, jeu);
    await chargerContenus(client, jeu, idsDomaines);
    await chargerAlertesDemo(client, alertesDemo ? jeu.alertesDemo : [], idsDomaines, maintenant);
    await client.query('COMMIT');
    return {
      domaines: jeu.domaines.length,
      contenus: jeu.contenus.length,
      alertesDemo: alertesDemo ? jeu.alertesDemo.length : 0,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

type IdsDomaines = Map<string, { id: number; sousThemes: Map<string, number> }>;

async function chargerDomaines(client: PoolClient, jeu: JeuDeContenu): Promise<IdsDomaines> {
  const ids: IdsDomaines = new Map();
  for (const d of jeu.domaines) {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO domaine (slug, nom, nom_court, description, couleur, ordre)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE SET nom = $2, nom_court = $3, description = $4, couleur = $5, ordre = $6
       RETURNING id`,
      [d.slug, d.nom, d.nomCourt, d.description, d.couleur, d.ordre],
    );
    const domaineId = rows[0]!.id;
    const sousThemes = new Map<string, number>();
    for (const [ordre, s] of d.sousThemes.entries()) {
      const r = await client.query<{ id: number }>(
        `INSERT INTO sous_theme (domaine_id, slug, nom, ordre) VALUES ($1, $2, $3, $4)
         ON CONFLICT (domaine_id, slug) DO UPDATE SET nom = $3, ordre = $4
         RETURNING id`,
        [domaineId, s.slug, s.nom, ordre],
      );
      sousThemes.set(s.slug, r.rows[0]!.id);
    }
    ids.set(d.slug, { id: domaineId, sousThemes });
  }
  return ids;
}

async function chargerContenus(client: PoolClient, jeu: JeuDeContenu, ids: IdsDomaines): Promise<void> {
  const presents = jeu.contenus.map((c) => c.id);
  await client.query(`DELETE FROM contenu WHERE origine = 'manuel' AND NOT (id = ANY($1))`, [presents]);

  for (const c of jeu.contenus) {
    const domaine = ids.get(c.domaine)!;
    // maj_le ne bouge que si le contenu a reellement change.
    await client.query(
      `INSERT INTO contenu (id, type, domaine_id, sous_theme_id, titre, resume, difficulte, corps)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         type = $2, domaine_id = $3, sous_theme_id = $4, titre = $5, resume = $6, difficulte = $7, corps = $8,
         version = contenu.version + 1, maj_le = now()
       WHERE (contenu.type, contenu.domaine_id, contenu.sous_theme_id, contenu.titre, contenu.resume, contenu.difficulte, contenu.corps)
         IS DISTINCT FROM ($2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [c.id, c.type, domaine.id, domaine.sousThemes.get(c.sousTheme)!, c.titre, c.resume, c.difficulte, JSON.stringify(c.corps)],
    );
  }

  await client.query(
    `DELETE FROM lien_contenu l USING contenu c WHERE l.source_id = c.id AND c.origine = 'manuel'`,
  );
  for (const c of jeu.contenus) {
    for (const l of c.liens) {
      await client.query(
        `INSERT INTO lien_contenu (source_id, cible_id, nature) VALUES ($1, $2, $3)
         ON CONFLICT (source_id, cible_id) DO UPDATE SET nature = $3`,
        [c.id, l.cible, l.nature],
      );
    }
  }
}

async function chargerAlertesDemo(
  client: PoolClient,
  alertes: JeuDeContenu['alertesDemo'],
  ids: IdsDomaines,
  maintenant: Date,
): Promise<void> {
  // Les alertes d'exemple sont recreees a chaque chargement, datees par rapport a maintenant.
  await client.query('DELETE FROM alerte WHERE demo');
  for (const a of alertes) {
    const publieLe = new Date(maintenant.getTime() - a.minutesAvant * 60_000);
    await client.query(
      `INSERT INTO alerte (id, source, url, publie_le, titre, resume, criticite, reference, pourquoi, reflexe, exploitation_active, demo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)`,
      [a.id, a.source, a.url ?? null, publieLe, a.titre, a.resume, a.criticite, a.reference ?? null, a.pourquoi ?? null, a.reflexe ?? null, a.exploitationActive],
    );
    for (const d of a.domaines) {
      await client.query('INSERT INTO alerte_domaine (alerte_id, domaine_id) VALUES ($1, $2)', [a.id, ids.get(d)!.id]);
    }
    for (const c of a.contenus) {
      await client.query('INSERT INTO alerte_contenu (alerte_id, contenu_id) VALUES ($1, $2)', [a.id, c]);
    }
  }
}
