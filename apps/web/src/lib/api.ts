import { useCallback, useEffect, useState } from 'react';
import type {
  ContenuCarte,
  ContenuDetail,
  DomaineDetail,
  DomaineResume,
  FeedbackEntrainement,
  Progression,
  QuestionEntrainement,
  ResultatRecherche,
  VeilleDuJour,
} from '@yratech/shared';

export class ErreurApi extends Error {
  constructor(
    message: string,
    readonly statut: number,
  ) {
    super(message);
  }
}

async function appel<T>(chemin: string, init?: RequestInit): Promise<T> {
  const r = await fetch(chemin, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  if (!r.ok) {
    let message = `Erreur ${r.status}`;
    try {
      message = ((await r.json()) as { erreur?: string }).erreur ?? message;
    } catch {
      /* corps non JSON */
    }
    throw new ErreurApi(message, r.status);
  }
  return (await r.json()) as T;
}

const qs = (params: Record<string, string | string[] | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    const valeur = Array.isArray(v) ? v.join(',') : v;
    if (valeur) p.set(k, valeur);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const api = {
  veille: (heures = 24) => appel<VeilleDuJour>(`/api/veille${qs({ heures: String(heures) })}`),
  domaines: () => appel<DomaineResume[]>('/api/domaines'),
  domaine: (slug: string) => appel<DomaineDetail>(`/api/domaines/${encodeURIComponent(slug)}`),
  contenus: (f: { domaine?: string; sousTheme?: string; type?: string[]; difficulte?: string[] }) =>
    appel<ContenuCarte[]>(`/api/contenus${qs(f)}`),
  contenu: (id: string) => appel<ContenuDetail>(`/api/contenus/${encodeURIComponent(id)}`),
  recherche: (q: string) => appel<ResultatRecherche>(`/api/recherche${qs({ q })}`),
  question: (f: { id?: string; domaines?: string[]; exclure?: string[] }) =>
    appel<QuestionEntrainement>(`/api/entrainement/question${qs(f)}`),
  repondre: (questionId: string, reponse: string) =>
    appel<FeedbackEntrainement>('/api/entrainement/reponses', {
      method: 'POST',
      body: JSON.stringify({ questionId, reponse }),
    }),
  progression: () => appel<Progression>('/api/progression'),
};

export interface EtatRequete<T> {
  donnees: T | undefined;
  erreur: Error | undefined;
  chargement: boolean;
  recharger: () => void;
}

/** Charge une ressource ; se relance quand `cle` change. */
export function useApi<T>(charger: () => Promise<T>, cle: string): EtatRequete<T> {
  const [etat, setEtat] = useState<{ donnees?: T; erreur?: Error; chargement: boolean }>({ chargement: true });
  const [tour, setTour] = useState(0);

  useEffect(() => {
    let actif = true;
    setEtat((e) => ({ ...e, chargement: true, erreur: undefined }));
    charger().then(
      (donnees) => actif && setEtat({ donnees, chargement: false }),
      (erreur: Error) => actif && setEtat({ erreur, chargement: false }),
    );
    return () => {
      actif = false;
    };
    // `charger` est recree a chaque rendu : seule la cle declenche un rechargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, tour]);

  const recharger = useCallback(() => setTour((t) => t + 1), []);
  return { donnees: etat.donnees, erreur: etat.erreur, chargement: etat.chargement, recharger };
}
