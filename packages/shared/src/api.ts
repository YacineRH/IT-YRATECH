import type { Evaluation } from './evaluation.js';
import type {
  CorpsFiche,
  CorpsOutil,
  CorpsQuestion,
  Criticite,
  Difficulte,
  NatureLien,
  TypeContenu,
} from './schemas.js';

/** Formes renvoyees par l'API REST, partagees avec le frontend. */

export interface DomaineResume {
  slug: string;
  nom: string;
  nomCourt: string;
  description: string;
  couleur: string;
  ordre: number;
  nbContenus: number;
  nbQuestions: number;
  /** Maitrise de 0 a 100, d'apres les meilleures tentatives par question. */
  maitrise: number;
  nbAlertes: number;
}

export interface SousTheme {
  slug: string;
  nom: string;
  nbContenus: number;
}

export interface DomaineDetail extends DomaineResume {
  sousThemes: SousTheme[];
}

export interface LienContenu {
  id: string;
  titre: string;
  type: TypeContenu;
  nature: NatureLien;
  domaine: { slug: string; nomCourt: string; couleur: string };
}

export interface ContenuCarte {
  id: string;
  type: TypeContenu;
  titre: string;
  resume: string;
  difficulte: Difficulte;
  domaine: string;
  sousTheme: string;
  majLe: string;
  liens: LienContenu[];
  /** Criticite la plus haute parmi les alertes liees, si elles existent. */
  alerteMax: Criticite | null;
  nbAlertes: number;
  /** Pour une question : meilleur verdict obtenu. */
  meilleurVerdict: Evaluation['verdict'] | null;
}

export type ContenuDetail = ContenuCarte &
  (
    | { type: 'fiche'; corps: CorpsFiche }
    | { type: 'question'; corps: CorpsQuestion }
    | { type: 'outil'; corps: CorpsOutil }
  ) & { alertes: Alerte[] };

export interface Alerte {
  id: string;
  source: string;
  url: string | null;
  publieLe: string;
  titre: string;
  resume: string;
  criticite: Criticite;
  reference: string | null;
  pourquoi: string | null;
  reflexe: string | null;
  exploitationActive: boolean;
  demo: boolean;
  domaines: { slug: string; nomCourt: string; couleur: string }[];
  contenus: { id: string; titre: string; domaine: string }[];
}

export interface VeilleDuJour {
  genereLe: string;
  fenetreHeures: number;
  compteurs: Record<Criticite, number>;
  alertes: Alerte[];
  derniereSync: string | null;
}

export interface QuestionEntrainement {
  id: string;
  titre: string;
  domaine: { slug: string; nomCourt: string; couleur: string };
  sousTheme: string;
  difficulte: Difficulte;
}

export interface FeedbackEntrainement extends Evaluation {
  questionId: string;
  reference: CorpsQuestion['reference'];
  piege: string;
  relances: string[];
  liens: LienContenu[];
}

export interface Tentative {
  id: number;
  questionId: string;
  titre: string;
  verdict: Evaluation['verdict'];
  score: number;
  max: number;
  creeLe: string;
}

export interface Progression {
  domaines: Pick<DomaineResume, 'slug' | 'nomCourt' | 'couleur' | 'maitrise' | 'nbQuestions'>[];
  tentatives: Tentative[];
}

export interface ResultatRecherche {
  contenus: ContenuCarte[];
  alertes: Alerte[];
}
