import type { ContenuCarte } from '@yratech/shared';
import { Link } from 'react-router-dom';
import { CRITICITE, TYPE_CONTENU, couleur, jourCourt, styleCriticite } from '../lib/format';
import { Fleche } from './icones';
import { BadgeDifficulte } from './indicateurs';

const VERDICT = {
  reussie: { libelle: 'réussie', couleur: 'var(--ok-texte)' },
  partielle: { libelle: 'partielle', couleur: 'var(--partiel)' },
  ratee: { libelle: 'à revoir', couleur: 'var(--ko)' },
} as const;

/** Carte de fiche de connaissance, d'outil ou de question (composant reutilisable, section 12). */
export function Carte({ contenu, domaineCourant }: { contenu: ContenuCarte; domaineCourant?: string }) {
  const type = TYPE_CONTENU[contenu.type];
  // On met en avant un lien vers un autre domaine : c'est lui qui fait la valeur des liens croises.
  const lien = contenu.liens.find((l) => l.domaine.slug !== (domaineCourant ?? contenu.domaine)) ?? contenu.liens[0];
  const cible = contenu.type === 'question' ? `/entrainement?question=${contenu.id}` : `/contenus/${contenu.id}`;

  return (
    <Link to={cible} className="carte">
      <div className="tete">
        <span className="type" style={{ color: type.couleur }}>
          {type.libelle}
        </span>
        <span className="droite">
          {contenu.alerteMax ? (
            <span className="badge-alerte" style={styleCriticite(contenu.alerteMax)}>
              {contenu.nbAlertes > 1 ? `${contenu.nbAlertes} alertes` : CRITICITE[contenu.alerteMax].libelle}
            </span>
          ) : contenu.meilleurVerdict ? (
            <span style={{ color: VERDICT[contenu.meilleurVerdict].couleur }}>{VERDICT[contenu.meilleurVerdict].libelle}</span>
          ) : null}
        </span>
      </div>
      <h3>{contenu.type === 'question' ? `« ${contenu.titre} »` : contenu.titre}</h3>
      <p>{contenu.resume}</p>
      {lien && (
        <div className="lien-croise">
          <Fleche couleur={lien.domaine.couleur} />
          <span>
            {lien.domaine.nomCourt} · {lien.titre}
          </span>
        </div>
      )}
      <div className="pied">
        <BadgeDifficulte difficulte={contenu.difficulte} />
        <span className="date">maj {jourCourt(contenu.majLe)}</span>
      </div>
    </Link>
  );
}

export function PuceLien({ id, titre, teinte, prefixe }: { id: string; titre: string; teinte: string; prefixe?: string }) {
  return (
    <Link to={`/contenus/${id}`} className="puce lien" style={couleur(teinte)}>
      {prefixe ? `${prefixe} · ` : ''}
      {titre}
    </Link>
  );
}
