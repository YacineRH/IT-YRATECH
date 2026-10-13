import {
  CRITICITES,
  evaluerReponse,
  type Alerte,
  type ContenuCarte,
  type ContenuDetail,
  type CorpsQuestion,
  type Criticite,
  type DomaineDetail,
  type DomaineResume,
  type FeedbackEntrainement,
  type LienContenu,
  type Progression,
  type QuestionEntrainement,
  type ResultatRecherche,
  type Tentative,
  type TypeContenu,
  type VeilleDuJour,
} from '@yratech/shared';
import type { Db } from './db.js';

/** Rang SQL d'une criticite : 1 = critique. */
const RANG_CRITICITE = `array_position(ARRAY['critique','elevee','moyenne','faible'], a.criticite)`;

/* ------------------------------ Domaines ------------------------------ */

const SQL_DOMAINES = `
  WITH meilleur AS (
    SELECT question_id, max(ratio) AS r FROM tentative GROUP BY question_id
  )
  SELECT d.slug, d.nom, d.nom_court AS "nomCourt", d.description, d.couleur, d.ordre,
    count(c.id)::int AS "nbContenus",
    count(c.id) FILTER (WHERE c.type = 'question')::int AS "nbQuestions",
    coalesce(round(100 * avg(coalesce(m.r, 0)) FILTER (WHERE c.type = 'question')), 0)::int AS maitrise,
    (SELECT count(*) FROM alerte_domaine ad JOIN alerte a ON a.id = ad.alerte_id
      WHERE ad.domaine_id = d.id AND a.publie_le > now() - interval '7 days')::int AS "nbAlertes"
  FROM domaine d
  LEFT JOIN contenu c ON c.domaine_id = d.id AND c.statut = 'publie'
  LEFT JOIN meilleur m ON m.question_id = c.id
`;

export async function listerDomaines(db: Db): Promise<DomaineResume[]> {
  const { rows } = await db.query<DomaineResume>(`${SQL_DOMAINES} GROUP BY d.id ORDER BY d.ordre`);
  return rows;
}

export async function lireDomaine(db: Db, slug: string): Promise<DomaineDetail | null> {
  const { rows } = await db.query<DomaineResume>(`${SQL_DOMAINES} WHERE d.slug = $1 GROUP BY d.id`, [slug]);
  const domaine = rows[0];
  if (!domaine) return null;
  const st = await db.query<DomaineDetail['sousThemes'][number]>(
    `SELECT st.slug, st.nom, count(c.id)::int AS "nbContenus"
     FROM sous_theme st JOIN domaine d ON d.id = st.domaine_id
     LEFT JOIN contenu c ON c.sous_theme_id = st.id AND c.statut = 'publie'
     WHERE d.slug = $1 GROUP BY st.id ORDER BY st.ordre`,
    [slug],
  );
  return { ...domaine, sousThemes: st.rows };
}

/* ------------------------------ Contenus ------------------------------ */

const JSON_DOMAINE = (alias: string) =>
  `json_build_object('slug', ${alias}.slug, 'nomCourt', ${alias}.nom_court, 'couleur', ${alias}.couleur)`;

// Les liens sont affiches dans les deux sens : DNS -> DNS spoofing apparait
// aussi sur la fiche DNS spoofing.
const SQL_CARTE = `
  SELECT c.id, c.type, c.titre, c.resume, c.difficulte, d.slug AS domaine, st.slug AS "sousTheme",
    c.maj_le AS "majLe",
    coalesce((
      SELECT json_agg(x ORDER BY x->>'titre') FROM (
        SELECT DISTINCT ON (t.id) json_build_object('id', t.id, 'titre', t.titre, 'type', t.type,
          'nature', CASE WHEN l.source_id = c.id THEN l.nature ELSE 'voir-aussi' END,
          'domaine', ${JSON_DOMAINE('td')}) AS x
        FROM lien_contenu l
        JOIN contenu t ON t.id = CASE WHEN l.source_id = c.id THEN l.cible_id ELSE l.source_id END
        JOIN domaine td ON td.id = t.domaine_id
        WHERE (l.source_id = c.id OR l.cible_id = c.id) AND t.statut = 'publie'
        ORDER BY t.id, (l.source_id = c.id) DESC
      ) liens
    ), '[]'::json) AS liens,
    (SELECT a.criticite FROM alerte_contenu ac JOIN alerte a ON a.id = ac.alerte_id
      WHERE ac.contenu_id = c.id ORDER BY ${RANG_CRITICITE} LIMIT 1) AS "alerteMax",
    (SELECT count(*) FROM alerte_contenu ac WHERE ac.contenu_id = c.id)::int AS "nbAlertes",
    (SELECT t.verdict FROM tentative t WHERE t.question_id = c.id
      ORDER BY t.ratio DESC, t.cree_le DESC LIMIT 1) AS "meilleurVerdict"
  FROM contenu c
  JOIN domaine d ON d.id = c.domaine_id
  JOIN sous_theme st ON st.id = c.sous_theme_id
  WHERE c.statut = 'publie'
`;

export interface FiltreContenus {
  domaine?: string;
  sousTheme?: string;
  types?: TypeContenu[];
  difficultes?: string[];
}

export async function listerContenus(db: Db, f: FiltreContenus): Promise<ContenuCarte[]> {
  const params: unknown[] = [];
  const conditions: string[] = [];
  const ajouter = (sql: string, valeur: unknown) => {
    params.push(valeur);
    conditions.push(sql.replace('?', `$${params.length}`));
  };
  if (f.domaine) ajouter('d.slug = ?', f.domaine);
  if (f.sousTheme) ajouter('st.slug = ?', f.sousTheme);
  if (f.types?.length) ajouter('c.type = ANY(?)', f.types);
  if (f.difficultes?.length) ajouter('c.difficulte = ANY(?)', f.difficultes);
  const where = conditions.map((c) => ` AND ${c}`).join('');
  const { rows } = await db.query<ContenuCarte>(
    `${SQL_CARTE}${where} ORDER BY c.maj_le DESC, c.titre`,
    params,
  );
  return rows;
}

export async function lireContenu(db: Db, id: string): Promise<ContenuDetail | null> {
  const { rows } = await db.query<ContenuCarte & { corps: unknown }>(
    SQL_CARTE.replace('c.maj_le AS "majLe",', 'c.maj_le AS "majLe", c.corps,') + ' AND c.id = $1',
    [id],
  );
  const contenu = rows[0];
  if (!contenu) return null;
  const alertes = await listerAlertes(db, { contenu: id });
  return { ...contenu, alertes } as ContenuDetail;
}

/* ------------------------------- Alertes ------------------------------ */

const SQL_ALERTE = `
  SELECT a.id, a.source, a.url, a.publie_le AS "publieLe", a.titre, a.resume, a.criticite, a.reference,
    a.pourquoi, a.reflexe, a.exploitation_active AS "exploitationActive", a.demo,
    coalesce((SELECT json_agg(${JSON_DOMAINE('d')} ORDER BY d.ordre)
      FROM alerte_domaine ad JOIN domaine d ON d.id = ad.domaine_id WHERE ad.alerte_id = a.id), '[]'::json) AS domaines,
    coalesce((SELECT json_agg(json_build_object('id', c.id, 'titre', c.titre, 'domaine', d.slug) ORDER BY c.titre)
      FROM alerte_contenu ac JOIN contenu c ON c.id = ac.contenu_id JOIN domaine d ON d.id = c.domaine_id
      WHERE ac.alerte_id = a.id AND c.statut = 'publie'), '[]'::json) AS contenus
  FROM alerte a
`;

export async function listerAlertes(
  db: Db,
  f: { depuisHeures?: number; contenu?: string; limite?: number },
): Promise<Alerte[]> {
  const params: unknown[] = [];
  const conditions: string[] = [];
  if (f.depuisHeures) {
    params.push(f.depuisHeures);
    conditions.push(`a.publie_le > now() - make_interval(hours => $${params.length})`);
  }
  if (f.contenu) {
    params.push(f.contenu);
    conditions.push(`EXISTS (SELECT 1 FROM alerte_contenu ac WHERE ac.alerte_id = a.id AND ac.contenu_id = $${params.length})`);
  }
  params.push(f.limite ?? 100);
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await db.query<Alerte>(
    `${SQL_ALERTE}${where} ORDER BY ${RANG_CRITICITE}, a.exploitation_active DESC, a.publie_le DESC LIMIT $${params.length}`,
    params,
  );
  return rows.map((a) => ({ ...a, publieLe: new Date(a.publieLe).toISOString() }));
}

export async function veilleDuJour(db: Db, fenetreHeures = 24): Promise<VeilleDuJour> {
  const alertes = await listerAlertes(db, { depuisHeures: fenetreHeures });
  const compteurs = Object.fromEntries(CRITICITES.map((c) => [c, 0])) as Record<Criticite, number>;
  for (const a of alertes) compteurs[a.criticite] += 1;
  const sync = await db.query<{ fin: Date }>(
    `SELECT fin FROM synchronisation WHERE statut = 'ok' ORDER BY fin DESC LIMIT 1`,
  );
  return {
    genereLe: new Date().toISOString(),
    fenetreHeures,
    compteurs,
    alertes,
    derniereSync: sync.rows[0]?.fin.toISOString() ?? null,
  };
}

/* ------------------------------ Recherche ----------------------------- */

export async function rechercher(db: Db, q: string): Promise<ResultatRecherche> {
  const motif = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const contenus = await db.query<ContenuCarte>(
    `${SQL_CARTE} AND (unaccent(c.titre) ILIKE unaccent($1) OR unaccent(c.resume) ILIKE unaccent($1)
       OR unaccent(c.corps::text) ILIKE unaccent($1))
     ORDER BY (unaccent(c.titre) ILIKE unaccent($1)) DESC, c.titre LIMIT 30`,
    [motif],
  );
  const alertes = await db.query<Alerte>(
    `${SQL_ALERTE} WHERE unaccent(a.titre) ILIKE unaccent($1) OR unaccent(a.resume) ILIKE unaccent($1)
       OR a.reference ILIKE $1
     ORDER BY a.publie_le DESC LIMIT 10`,
    [motif],
  );
  return {
    contenus: contenus.rows,
    alertes: alertes.rows.map((a) => ({ ...a, publieLe: new Date(a.publieLe).toISOString() })),
  };
}

/* ---------------------------- Entrainement ---------------------------- */

/**
 * Tire une question au hasard, en privilegiant celles jamais reussies.
 */
export async function tirerQuestion(
  db: Db,
  f: { domaines?: string[]; exclure?: string[] },
): Promise<QuestionEntrainement | null> {
  const { rows } = await db.query<QuestionEntrainement>(
    `SELECT c.id, c.titre, ${JSON_DOMAINE('d')} AS domaine, st.nom AS "sousTheme", c.difficulte
     FROM contenu c JOIN domaine d ON d.id = c.domaine_id JOIN sous_theme st ON st.id = c.sous_theme_id
     WHERE c.type = 'question' AND c.statut = 'publie'
       AND (cardinality($1::text[]) = 0 OR d.slug = ANY($1))
       AND NOT (c.id = ANY($2))
     ORDER BY EXISTS (SELECT 1 FROM tentative t WHERE t.question_id = c.id AND t.verdict = 'reussie'), random()
     LIMIT 1`,
    [f.domaines ?? [], f.exclure ?? []],
  );
  return rows[0] ?? null;
}

export async function repondre(
  db: Db,
  questionId: string,
  reponse: string,
): Promise<FeedbackEntrainement | null> {
  const contenu = await lireContenu(db, questionId);
  if (!contenu || contenu.type !== 'question') return null;
  const corps = contenu.corps as CorpsQuestion;
  const evaluation = evaluerReponse(reponse, corps.pointsCles);

  await db.query(
    `INSERT INTO tentative (question_id, reponse, score, max, ratio, verdict, points_couverts)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [questionId, reponse, evaluation.score, evaluation.max, evaluation.ratio, evaluation.verdict, JSON.stringify(evaluation.couverts)],
  );

  const liens: LienContenu[] = contenu.liens;
  return {
    ...evaluation,
    questionId,
    reference: corps.reference,
    piege: corps.piege,
    relances: corps.relances ?? [],
    liens,
  };
}

export async function progression(db: Db, limite = 10): Promise<Progression> {
  const domaines = (await listerDomaines(db)).map(({ slug, nomCourt, couleur, maitrise, nbQuestions }) => ({
    slug,
    nomCourt,
    couleur,
    maitrise,
    nbQuestions,
  }));
  const { rows } = await db.query<Tentative & { creeLe: Date }>(
    `SELECT t.id, t.question_id AS "questionId", c.titre, t.verdict, t.score, t.max, t.cree_le AS "creeLe"
     FROM tentative t JOIN contenu c ON c.id = t.question_id
     ORDER BY t.cree_le DESC, t.id DESC LIMIT $1`,
    [limite],
  );
  return { domaines, tentatives: rows.map((t) => ({ ...t, creeLe: t.creeLe.toISOString() })) };
}
