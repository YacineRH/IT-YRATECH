import type { EtatRequete } from '../lib/api';

/** Affiche chargement / erreur / vide autour d'une requete. */
export function Etat<T>({
  requete,
  vide,
  hauteur = 160,
  children,
}: {
  requete: EtatRequete<T>;
  vide?: (d: T) => string | null;
  hauteur?: number;
  children: (d: T) => React.ReactNode;
}) {
  if (requete.erreur && !requete.donnees) {
    return (
      <div className="panneau etat-erreur" role="alert">
        <p>Impossible de charger les données : {requete.erreur.message}</p>
        <button type="button" className="bouton" onClick={requete.recharger}>
          Réessayer
        </button>
      </div>
    );
  }
  if (!requete.donnees) {
    return <div className="squelette" style={{ minHeight: hauteur }} aria-busy="true" aria-label="Chargement" />;
  }
  const messageVide = vide?.(requete.donnees);
  if (messageVide) return <div className="panneau etat-vide">{messageVide}</div>;
  return <>{children(requete.donnees)}</>;
}
