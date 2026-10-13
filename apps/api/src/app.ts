import cors from '@fastify/cors';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Difficulte, ReponseEntrainement, SLUG, TypeContenu } from '@yratech/shared';
import type { Db } from './db.js';
import * as repo from './repo.js';

export interface OptionsApp {
  db: Db;
  corsOrigin?: string;
  logger?: boolean;
}

/** "a,b,c" -> ["a","b","c"], valide chaque element. */
const liste = <T extends z.ZodType<string, string>>(schema: T) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []))
    .pipe(z.array(schema));

const FiltreContenus = z.object({
  domaine: SLUG.optional(),
  sousTheme: SLUG.optional(),
  type: liste(TypeContenu),
  difficulte: liste(Difficulte),
});

const FiltreVeille = z.object({
  heures: z.coerce.number().int().min(1).max(24 * 30).default(24),
});

const FiltreQuestion = z.object({
  id: SLUG.optional(),
  domaines: liste(SLUG),
  exclure: liste(SLUG),
});

const Recherche = z.object({ q: z.string().trim().min(2).max(100) });

class RequeteInvalide extends Error {}

function lire<T extends z.ZodType>(schema: T, donnees: unknown): z.infer<T> {
  const r = schema.safeParse(donnees);
  if (!r.success) {
    throw new RequeteInvalide(r.error.issues.map((i) => `${i.path.join('.') || 'requete'} : ${i.message}`).join(' ; '));
  }
  return r.data;
}

export async function construireApp({ db, corsOrigin, logger = false }: OptionsApp): Promise<FastifyInstance> {
  const app = Fastify({ logger });
  if (corsOrigin) await app.register(cors, { origin: corsOrigin.split(',') });

  app.setErrorHandler((err: FastifyError | RequeteInvalide, req, reply) => {
    if (err instanceof RequeteInvalide) return reply.code(400).send({ erreur: err.message });
    const statut = (err as { statusCode?: number }).statusCode;
    if (statut && statut < 500) return reply.code(statut).send({ erreur: err.message });
    req.log.error(err);
    return reply.code(500).send({ erreur: 'Erreur interne' });
  });

  const introuvable = (quoi: string) => ({ erreur: `${quoi} introuvable` });

  app.get('/api/sante', async () => {
    await db.query('SELECT 1');
    return { statut: 'ok' };
  });

  app.get('/api/veille', async (req) => {
    const { heures } = lire(FiltreVeille, req.query);
    return repo.veilleDuJour(db, heures);
  });

  app.get('/api/domaines', async () => repo.listerDomaines(db));

  app.get('/api/domaines/:slug', async (req, reply) => {
    const { slug } = lire(z.object({ slug: SLUG }), req.params);
    return (await repo.lireDomaine(db, slug)) ?? reply.code(404).send(introuvable('Domaine'));
  });

  app.get('/api/contenus', async (req) => {
    const f = lire(FiltreContenus, req.query);
    return repo.listerContenus(db, {
      domaine: f.domaine,
      sousTheme: f.sousTheme,
      types: f.type,
      difficultes: f.difficulte,
    });
  });

  app.get('/api/contenus/:id', async (req, reply) => {
    const { id } = lire(z.object({ id: SLUG }), req.params);
    const contenu = await repo.lireContenu(db, id);
    if (!contenu) return reply.code(404).send(introuvable('Contenu'));
    // La reponse de reference d'une question reste cachee : elle est
    // revelee par le feedback du mode entrainement.
    if (contenu.type === 'question') {
      const { corps: _corps, ...reste } = contenu;
      return reste;
    }
    return contenu;
  });

  app.get('/api/recherche', async (req) => {
    const { q } = lire(Recherche, req.query);
    return repo.rechercher(db, q);
  });

  app.get('/api/entrainement/question', async (req, reply) => {
    const f = lire(FiltreQuestion, req.query);
    return (
      (await repo.tirerQuestion(db, { id: f.id, domaines: f.domaines, exclure: f.exclure })) ??
      reply.code(404).send(introuvable('Question'))
    );
  });

  app.post('/api/entrainement/reponses', async (req, reply) => {
    const { questionId, reponse } = lire(ReponseEntrainement, req.body);
    return (await repo.repondre(db, questionId, reponse)) ?? reply.code(404).send(introuvable('Question'));
  });

  app.get('/api/progression', async () => repo.progression(db));

  return app;
}
