import type { Criticite, Difficulte, TypeContenu } from '@yratech/shared';
import type { CSSProperties } from 'react';

export const CRITICITE: Record<
  Criticite,
  { libelle: string; niveau: number; sous: string }
> = {
  critique: { libelle: 'Critique', niveau: 4, sous: 'à traiter immédiatement' },
  elevee: { libelle: 'Élevée', niveau: 3, sous: 'à traiter cette semaine' },
  moyenne: { libelle: 'Moyenne', niveau: 2, sous: 'à surveiller' },
  faible: { libelle: 'Faible', niveau: 1, sous: 'culture et contexte' },
};

/** Variables CSS d'une criticite, consommees par les composants. */
export function styleCriticite(c: Criticite): CSSProperties {
  return {
    '--c': `var(--crit-${c})`,
    '--texte-crit': `var(--crit-${c}-texte)`,
    '--fond-crit': `var(--crit-${c}-fond)`,
    '--bord-crit': `var(--crit-${c}-bord)`,
  } as CSSProperties;
}

export const DIFFICULTE: Record<Difficulte, { libelle: string; niveau: number; couleur: string }> = {
  fondamental: { libelle: 'Fondamental', niveau: 1, couleur: 'var(--ok)' },
  intermediaire: { libelle: 'Intermédiaire', niveau: 2, couleur: 'var(--crit-moyenne)' },
  avance: { libelle: 'Avancé', niveau: 3, couleur: 'var(--dom-pentest)' },
};

export const TYPE_CONTENU: Record<TypeContenu, { libelle: string; couleur: string }> = {
  fiche: { libelle: 'Fiche · connaissance', couleur: '#67E8F9' },
  question: { libelle: 'Question · entretien', couleur: 'var(--texte)' },
  outil: { libelle: 'Fiche · outil', couleur: '#FDE68A' },
};

export function couleur(c: string): CSSProperties {
  return { '--c': c } as CSSProperties;
}

const heureFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const jourFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });
const dateLongueFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function memeJour(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** "07:42", "hier 18:40" ou "12.10 09:00". */
export function horodatage(iso: string, maintenant = new Date()): string {
  const d = new Date(iso);
  if (memeJour(d, maintenant)) return heureFmt.format(d);
  const hier = new Date(maintenant);
  hier.setDate(hier.getDate() - 1);
  if (memeJour(d, hier)) return `hier ${heureFmt.format(d)}`;
  return `${jourFmt.format(d).replace('/', '.')} ${heureFmt.format(d)}`;
}

export function jourCourt(iso: string): string {
  return jourFmt.format(new Date(iso)).replace('/', '.');
}

export function dateLongue(d = new Date()): string {
  return dateLongueFmt.format(d);
}

/** "il y a 12 min", "il y a 3 h", "il y a 2 j". */
export function ilYa(iso: string, maintenant = new Date()): string {
  const minutes = Math.max(0, Math.round((maintenant.getTime() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 48) return `il y a ${heures} h`;
  return `il y a ${Math.round(heures / 24)} j`;
}

export const deuxChiffres = (n: number) => String(n).padStart(2, '0');
