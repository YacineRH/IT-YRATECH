import type { PointCle } from './schemas.js';

export type Verdict = 'reussie' | 'partielle' | 'ratee';

export interface Evaluation {
  /** Note sur `max`, arrondie au demi-point. */
  score: number;
  max: number;
  /** Part des points ponderes couverts, entre 0 et 1. */
  ratio: number;
  verdict: Verdict;
  couverts: string[];
  manquants: { libelle: string; secondaire: boolean }[];
}

/**
 * Minuscules, sans accents, ponctuation remplacee par des espaces.
 * Le point est conserve entre deux chiffres (802.1q, 10.0.0.1).
 */
export function normaliser(texte: string): string {
  return ` ${texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.+]+/g, ' ')
    .replace(/\.(?!\d)|(?<!\d)\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

function contient(texteNormalise: string, motCle: string): boolean {
  const cle = normaliser(motCle);
  // Mot court (sigle) : mot entier, sinon "mac" validerait "machine".
  if (cle.trim().length <= 3) return texteNormalise.includes(cle);
  // Sinon ancre en debut de mot seulement : "certificat" valide
  // "certificats", mais "tls" ne valide jamais "atlas".
  return texteNormalise.includes(cle.trimEnd());
}

export const SEUIL_REUSSITE = 0.8;
export const SEUIL_PARTIEL = 0.4;

/**
 * Feedback immediat du mode entrainement : verifie quels points cles de la
 * reponse de reference apparaissent dans la reponse libre. Deterministe et
 * explicable ; une evaluation par IA pourra s'y ajouter en phase 3.
 */
export function evaluerReponse(reponse: string, points: PointCle[], max = 5): Evaluation {
  const texte = normaliser(reponse);
  let total = 0;
  let obtenu = 0;
  const couverts: string[] = [];
  const manquants: Evaluation['manquants'] = [];

  for (const point of points) {
    const poids = point.secondaire ? 0.5 : 1;
    total += poids;
    if (point.motsCles.some((m) => contient(texte, m))) {
      obtenu += poids;
      couverts.push(point.libelle);
    } else {
      manquants.push({ libelle: point.libelle, secondaire: point.secondaire ?? false });
    }
  }

  const ratio = total === 0 ? 0 : obtenu / total;
  const verdict: Verdict =
    ratio >= SEUIL_REUSSITE ? 'reussie' : ratio >= SEUIL_PARTIEL ? 'partielle' : 'ratee';

  return {
    score: Math.round(ratio * max * 2) / 2,
    max,
    ratio,
    verdict,
    couverts,
    manquants,
  };
}
