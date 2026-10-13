import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type {
  Alerte,
  ContenuCarte,
  DomaineDetail,
  DomaineResume,
  FeedbackEntrainement,
  Progression,
  QuestionEntrainement,
  ResultatRecherche,
  VeilleDuJour,
} from '@yratech/shared';
import { construireApp } from '../src/app.js';
import { config } from '../src/config.js';
import { chargerContenu } from '../src/contenu.js';
import { createPool, type Db } from '../src/db.js';
import { migrer } from '../src/migrate.js';
import { chargerEnBase } from '../src/seed.js';

const url = process.env.TEST_DATABASE_URL ?? 'postgres://yratech:yratech@localhost:5432/yratech_test';

let db: Db;
let app: FastifyInstance;

beforeAll(async () => {
  db = createPool(url);
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrer(db, config.migrationsDir);
  await chargerEnBase(db, await chargerContenu(config.contentDir));
  app = await construireApp({ db });
});

afterAll(async () => {
  await app?.close();
  await db?.end();
});

async function get<T>(chemin: string): Promise<{ statut: number; corps: T }> {
  const r = await app.inject({ method: 'GET', url: chemin });
  return { statut: r.statusCode, corps: r.json() as T };
}

describe('socle', () => {
  it('repond sur /api/sante', async () => {
    expect((await get('/api/sante')).corps).toEqual({ statut: 'ok' });
  });

  it('rejoue les migrations sans rien appliquer', async () => {
    expect(await migrer(db, config.migrationsDir)).toEqual([]);
  });

  it('recharge le contenu de maniere idempotente', async () => {
    const avant = await db.query('SELECT id, version FROM contenu ORDER BY id');
    await chargerEnBase(db, await chargerContenu(config.contentDir));
    const apres = await db.query('SELECT id, version FROM contenu ORDER BY id');
    expect(apres.rows).toEqual(avant.rows);
  });
});

describe('veille du jour', () => {
  it('trie les alertes par criticite et les compte', async () => {
    const { corps } = await get<VeilleDuJour>('/api/veille');
    expect(corps.alertes.length).toBeGreaterThan(0);
    expect(corps.alertes[0]!.criticite).toBe('critique');
    const rangs = corps.alertes.map((a) => ['critique', 'elevee', 'moyenne', 'faible'].indexOf(a.criticite));
    expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
    const total = Object.values(corps.compteurs).reduce((a, b) => a + b, 0);
    expect(total).toBe(corps.alertes.length);
  });

  it('relie les alertes a leurs fiches et domaines', async () => {
    const { corps } = await get<VeilleDuJour>('/api/veille');
    const vpn = corps.alertes.find((a: Alerte) => a.id === 'demo-vpn-rce')!;
    expect(vpn.demo).toBe(true);
    expect(vpn.contenus.map((c) => c.id)).toContain('vpn-ipsec-tls');
    expect(vpn.domaines.map((d) => d.slug)).toEqual(['reseau', 'pentest']);
  });

  it('restreint la fenetre et valide le parametre', async () => {
    const { corps } = await get<VeilleDuJour>('/api/veille?heures=2');
    expect(corps.alertes.map((a) => a.id)).toEqual(['demo-vpn-rce']);
    expect((await get('/api/veille?heures=0')).statut).toBe(400);
  });
});

describe('navigation par domaine', () => {
  it('liste les 9 domaines dans l ordre', async () => {
    const { corps } = await get<DomaineResume[]>('/api/domaines');
    expect(corps).toHaveLength(9);
    expect(corps[0]).toMatchObject({ slug: 'reseau', nomCourt: 'Réseau', maitrise: 0 });
    expect(corps[0]!.nbQuestions).toBeGreaterThan(0);
  });

  it('detaille un domaine et ses sous-themes', async () => {
    const { corps } = await get<DomaineDetail>('/api/domaines/reseau');
    expect(corps.sousThemes.map((s) => s.slug)).toContain('protocoles-applicatifs');
    expect((await get('/api/domaines/inconnu')).statut).toBe(404);
  });

  it('filtre les contenus et expose les liens dans les deux sens', async () => {
    const { corps } = await get<ContenuCarte[]>('/api/contenus?domaine=reseau&type=fiche');
    expect(corps.every((c) => c.type === 'fiche' && c.domaine === 'reseau')).toBe(true);
    const dns = corps.find((c) => c.id === 'dns')!;
    expect(dns.liens).toContainEqual(
      expect.objectContaining({ id: 'dns-spoofing', nature: 'vecteur-attaque' }),
    );
    expect(dns.alerteMax).toBe('faible');

    const spoof = (await get<ContenuCarte[]>('/api/contenus?domaine=pentest')).corps.find((c) => c.id === 'dns-spoofing')!;
    expect(spoof.liens.map((l) => l.id)).toContain('dns');
  });

  it('rejette un type inconnu', async () => {
    expect((await get('/api/contenus?type=poeme')).statut).toBe(400);
  });

  it('cache la reponse de reference d une question', async () => {
    const { corps } = await get<Record<string, unknown>>('/api/contenus/q-url-navigateur');
    expect(corps.titre).toMatch(/URL/);
    expect(corps).not.toHaveProperty('corps');
    const fiche = await get<Record<string, unknown>>('/api/contenus/dns');
    expect(fiche.corps).toHaveProperty('corps.definition');
  });
});

describe('recherche transverse', () => {
  it('ignore les accents', async () => {
    const { corps } = await get<ResultatRecherche>('/api/recherche?q=resolution');
    expect(corps.contenus.map((c) => c.id)).toContain('dns');
  });

  it('cherche aussi dans les alertes', async () => {
    const { corps } = await get<ResultatRecherche>('/api/recherche?q=hyperviseur');
    expect(corps.alertes.map((a) => a.id)).toEqual(['demo-hyperviseur-auth']);
  });
});

describe('entrainement entretien', () => {
  it('tire une question du domaine demande', async () => {
    const { corps } = await get<QuestionEntrainement>('/api/entrainement/question?domaines=grc');
    expect(corps.domaine.slug).toBe('grc');
    expect(corps).not.toHaveProperty('corps');
  });

  it('respecte la liste d exclusion', async () => {
    const toutes = (await get<ContenuCarte[]>('/api/contenus?domaine=grc&type=question')).corps.map((c) => c.id);
    const garder = toutes[0]!;
    const exclure = toutes.slice(1).join(',');
    const { corps } = await get<QuestionEntrainement>(`/api/entrainement/question?domaines=grc&exclure=${exclure}`);
    expect(corps.id).toBe(garder);
    expect((await get(`/api/entrainement/question?domaines=grc&exclure=${toutes.join(',')}`)).statut).toBe(404);
  });

  it('evalue une reponse et met a jour la progression', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/entrainement/reponses',
      payload: {
        questionId: 'q-url-navigateur',
        reponse:
          'Le navigateur fait une requête DNS, ouvre une connexion TCP avec le three-way handshake, envoie un GET HTTP et affiche la page.',
      },
    });
    expect(r.statusCode).toBe(200);
    const fb = r.json() as FeedbackEntrainement;
    expect(fb.verdict).toBe('partielle');
    expect(fb.manquants.map((m) => m.libelle)).toContain('Négociation TLS et vérification du certificat');
    expect(fb.reference.map((e) => e.titre)).toEqual(['DNS', 'TCP', 'TLS', 'HTTP', 'Rendu']);

    const prog = (await get<Progression>('/api/progression')).corps;
    expect(prog.tentatives[0]).toMatchObject({ questionId: 'q-url-navigateur', verdict: 'partielle' });
    expect(prog.domaines.find((d) => d.slug === 'reseau')!.maitrise).toBeGreaterThan(0);

    const carte = (await get<ContenuCarte[]>('/api/contenus?domaine=reseau&type=question')).corps.find(
      (c) => c.id === 'q-url-navigateur',
    )!;
    expect(carte.meilleurVerdict).toBe('partielle');
  });

  it('refuse une reponse vide ou une question inconnue', async () => {
    const vide = await app.inject({
      method: 'POST',
      url: '/api/entrainement/reponses',
      payload: { questionId: 'q-url-navigateur', reponse: '   ' },
    });
    expect(vide.statusCode).toBe(400);
    const inconnue = await app.inject({
      method: 'POST',
      url: '/api/entrainement/reponses',
      payload: { questionId: 'dns', reponse: 'une fiche, pas une question' },
    });
    expect(inconnue.statusCode).toBe(404);
  });
});
