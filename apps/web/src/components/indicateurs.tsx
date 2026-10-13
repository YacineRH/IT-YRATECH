import type { Criticite, Difficulte } from '@yratech/shared';
import { CRITICITE, DIFFICULTE, couleur, styleCriticite } from '../lib/format';

/** Jauge a segments : la criticite se lit sans la couleur. */
export function Jauge({
  niveau,
  max,
  variante,
}: {
  niveau: number;
  max: number;
  variante?: 'fine' | 'petite';
}) {
  return (
    <span className={`jauge${variante ? ` ${variante}` : ''}`} aria-hidden="true">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < niveau ? 'plein' : undefined} />
      ))}
    </span>
  );
}

export function BadgeCriticite({ criticite }: { criticite: Criticite }) {
  const c = CRITICITE[criticite];
  return (
    <span className="badge-crit" style={styleCriticite(criticite)}>
      {c.libelle} · {c.niveau}/4
    </span>
  );
}

export function NiveauCriticite({ criticite }: { criticite: Criticite }) {
  const c = CRITICITE[criticite];
  return (
    <span className="niveau" style={styleCriticite(criticite)}>
      <span className="mono">{c.libelle}</span>
      <Jauge niveau={c.niveau} max={4} variante="fine" />
    </span>
  );
}

export function BadgeDifficulte({ difficulte }: { difficulte: Difficulte }) {
  const d = DIFFICULTE[difficulte];
  return (
    <span className="difficulte" style={couleur(d.couleur)}>
      <Jauge niveau={d.niveau} max={3} variante="petite" />
      {d.libelle}
    </span>
  );
}

export function BarreProgression({ libelle, valeur, teinte }: { libelle: string; valeur: number; teinte: string }) {
  return (
    <div className="barre-progression" style={couleur(teinte)}>
      <div className="ligne">
        <span>{libelle}</span>
        <span className="valeur">{valeur} %</span>
      </div>
      <div
        className="piste"
        role="progressbar"
        aria-label={`Maîtrise ${libelle}`}
        aria-valuenow={valeur}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="remplissage" style={{ width: `${valeur}%` }} />
      </div>
    </div>
  );
}

export function Segments({ valeur, teinte, nombre = 10 }: { valeur: number; teinte: string; nombre?: number }) {
  const pleins = Math.round((valeur / 100) * nombre);
  return (
    <div className="segments" style={couleur(teinte)} role="img" aria-label={`${valeur} % maîtrisé`}>
      {Array.from({ length: nombre }, (_, i) => (
        <span key={i} className={i < pleins ? 'plein' : undefined} />
      ))}
    </div>
  );
}

export function Puce({ teinte, children }: { teinte: string; children: React.ReactNode }) {
  return (
    <span className="puce" style={couleur(teinte)}>
      {children}
    </span>
  );
}
