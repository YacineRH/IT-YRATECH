import { z } from 'zod';

/**
 * Modele de contenu generique d'IT-YRATECH (cahier des charges, section 11).
 * Chaque theme est une entite structuree : domaine -> sous-theme -> contenu typé.
 */

export const SLUG = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug attendu : minuscules, chiffres et tirets');

export const TYPES_CONTENU = ['fiche', 'question', 'outil'] as const;
export const TypeContenu = z.enum(TYPES_CONTENU);
export type TypeContenu = z.infer<typeof TypeContenu>;

export const DIFFICULTES = ['fondamental', 'intermediaire', 'avance'] as const;
export const Difficulte = z.enum(DIFFICULTES);
export type Difficulte = z.infer<typeof Difficulte>;

/** Ordre decroissant de gravite : l'index sert au tri. */
export const CRITICITES = ['critique', 'elevee', 'moyenne', 'faible'] as const;
export const Criticite = z.enum(CRITICITES);
export type Criticite = z.infer<typeof Criticite>;

export const NATURES_LIEN = ['voir-aussi', 'vecteur-attaque', 'prerequis', 'outil'] as const;
export const NatureLien = z.enum(NATURES_LIEN);
export type NatureLien = z.infer<typeof NatureLien>;

export const STATUTS = ['brouillon', 'valide', 'publie'] as const;
export const Statut = z.enum(STATUTS);
export type Statut = z.infer<typeof Statut>;

export const SousThemeDef = z.object({
  slug: SLUG,
  nom: z.string().min(2),
});
export type SousThemeDef = z.infer<typeof SousThemeDef>;

export const DomaineDef = z.object({
  slug: SLUG,
  nom: z.string().min(2),
  nomCourt: z.string().min(2),
  description: z.string().min(10),
  couleur: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  ordre: z.number().int().nonnegative(),
  sousThemes: z.array(SousThemeDef).min(1),
});
export type DomaineDef = z.infer<typeof DomaineDef>;

/* ---------- Corps specifiques a chaque type de contenu ---------- */

export const CorpsFiche = z.object({
  definition: z.string().min(20),
  /** Schema conceptuel en texte (ASCII ou etapes), rendu en police mono. */
  schema: z.string().min(5).optional(),
  casUsage: z.string().min(20),
  piege: z.string().min(20),
  pointsCles: z.array(z.string().min(3)).min(2),
});
export type CorpsFiche = z.infer<typeof CorpsFiche>;

export const PointCle = z.object({
  libelle: z.string().min(3),
  /**
   * Formulations qui valident le point dans une reponse libre.
   * Comparees sans accents ni casse ; une seule suffit.
   */
  motsCles: z.array(z.string().min(2)).min(1),
  /** Point secondaire : compte moitie et ne fait pas echouer seul. */
  secondaire: z.boolean().optional(),
});
export type PointCle = z.infer<typeof PointCle>;

export const CorpsQuestion = z.object({
  reference: z
    .array(z.object({ titre: z.string().min(2), detail: z.string().min(5) }))
    .min(2),
  pointsCles: z.array(PointCle).min(2),
  piege: z.string().min(20),
  relances: z.array(z.string().min(5)).optional(),
});
export type CorpsQuestion = z.infer<typeof CorpsQuestion>;

export const CorpsOutil = z.object({
  categorie: z.string().min(2),
  role: z.string().min(10),
  exemple: z.string().min(5),
  alternatives: z.array(z.string().min(2)),
});
export type CorpsOutil = z.infer<typeof CorpsOutil>;

const ContenuBase = z.object({
  id: SLUG,
  domaine: SLUG,
  sousTheme: SLUG,
  titre: z.string().min(3),
  resume: z.string().min(10),
  difficulte: Difficulte,
  liens: z
    .array(z.object({ cible: SLUG, nature: NatureLien }))
    .default([]),
});

export const ContenuDef = z.discriminatedUnion('type', [
  ContenuBase.extend({ type: z.literal('fiche'), corps: CorpsFiche }),
  ContenuBase.extend({ type: z.literal('question'), corps: CorpsQuestion }),
  ContenuBase.extend({ type: z.literal('outil'), corps: CorpsOutil }),
]);
export type ContenuDef = z.infer<typeof ContenuDef>;

export const AlerteDef = z.object({
  id: SLUG,
  source: z.string().min(2),
  url: z.string().url().optional(),
  publieLe: z.string().datetime({ offset: true }),
  titre: z.string().min(5),
  resume: z.string().min(10),
  criticite: Criticite,
  reference: z.string().optional(),
  pourquoi: z.string().optional(),
  reflexe: z.string().optional(),
  exploitationActive: z.boolean().default(false),
  domaines: z.array(SLUG).min(1),
  contenus: z.array(SLUG).default([]),
  /** Alerte d'exemple, pas issue d'une source reelle. */
  demo: z.boolean().default(false),
});
export type AlerteDef = z.infer<typeof AlerteDef>;

/* ---------- Charges utiles d'API ---------- */

export const ReponseEntrainement = z.object({
  questionId: SLUG,
  reponse: z.string().trim().min(1).max(5000),
});
export type ReponseEntrainement = z.infer<typeof ReponseEntrainement>;
