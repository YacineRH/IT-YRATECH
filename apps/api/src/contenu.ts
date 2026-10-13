import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { AlerteDef, ContenuDef, DomaineDef } from '@yratech/shared';

/** Alerte d'exemple : date exprimee en minutes avant le chargement. */
export const AlerteDemoFichier = AlerteDef.omit({ publieLe: true, demo: true }).extend({
  minutesAvant: z.number().int().nonnegative(),
});

export interface JeuDeContenu {
  domaines: DomaineDef[];
  contenus: ContenuDef[];
  alertesDemo: z.infer<typeof AlerteDemoFichier>[];
}

async function lireJson(fichier: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(fichier, 'utf8'));
  } catch (err) {
    throw new Error(`${path.basename(fichier)} illisible : ${(err as Error).message}`);
  }
}

function valider<T>(schema: z.ZodType<T>, donnees: unknown, origine: string): T {
  const r = schema.safeParse(donnees);
  if (!r.success) {
    const details = r.error.issues
      .slice(0, 5)
      .map((i) => `  - ${i.path.join('.')} : ${i.message}`)
      .join('\n');
    throw new Error(`Contenu invalide dans ${origine} :\n${details}`);
  }
  return r.data;
}

/** Lit le dossier content/ : domaines.json, contenus/*.json, alertes-demo.json. */
export async function chargerContenu(dossier: string): Promise<JeuDeContenu> {
  const domaines = valider(
    z.array(DomaineDef),
    await lireJson(path.join(dossier, 'domaines.json')),
    'domaines.json',
  );

  const contenus: ContenuDef[] = [];
  const dossierContenus = path.join(dossier, 'contenus');
  for (const f of (await readdir(dossierContenus)).filter((n) => n.endsWith('.json')).sort()) {
    contenus.push(
      ...valider(z.array(ContenuDef), await lireJson(path.join(dossierContenus, f)), `contenus/${f}`),
    );
  }

  const alertesDemo = valider(
    z.array(AlerteDemoFichier),
    await lireJson(path.join(dossier, 'alertes-demo.json')),
    'alertes-demo.json',
  );

  const jeu = { domaines, contenus, alertesDemo };
  verifierCoherence(jeu);
  return jeu;
}

/** Controles transverses que les schemas seuls ne voient pas. */
export function verifierCoherence(jeu: JeuDeContenu): void {
  const erreurs: string[] = [];
  const sousThemes = new Map(
    jeu.domaines.map((d) => [d.slug, new Set(d.sousThemes.map((s) => s.slug))]),
  );
  const ids = new Set<string>();

  for (const d of jeu.domaines) {
    if (new Set(d.sousThemes.map((s) => s.slug)).size !== d.sousThemes.length) {
      erreurs.push(`domaine ${d.slug} : sous-theme en double`);
    }
  }
  for (const c of jeu.contenus) {
    if (ids.has(c.id)) erreurs.push(`contenu ${c.id} en double`);
    ids.add(c.id);
    const st = sousThemes.get(c.domaine);
    if (!st) erreurs.push(`${c.id} : domaine inconnu ${c.domaine}`);
    else if (!st.has(c.sousTheme)) erreurs.push(`${c.id} : sous-theme inconnu ${c.domaine}/${c.sousTheme}`);
  }
  for (const c of jeu.contenus) {
    for (const l of c.liens) {
      if (!ids.has(l.cible)) erreurs.push(`${c.id} : lien vers un contenu inconnu ${l.cible}`);
      if (l.cible === c.id) erreurs.push(`${c.id} : lien vers lui-meme`);
    }
  }
  const idsAlertes = new Set<string>();
  for (const a of jeu.alertesDemo) {
    if (idsAlertes.has(a.id)) erreurs.push(`alerte ${a.id} en double`);
    idsAlertes.add(a.id);
    for (const d of a.domaines) if (!sousThemes.has(d)) erreurs.push(`alerte ${a.id} : domaine inconnu ${d}`);
    for (const c of a.contenus) if (!ids.has(c)) erreurs.push(`alerte ${a.id} : contenu inconnu ${c}`);
  }

  if (erreurs.length > 0) {
    throw new Error(`Incoherences dans le contenu :\n${erreurs.map((e) => `  - ${e}`).join('\n')}`);
  }
}
