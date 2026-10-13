import { Link } from 'react-router-dom';
import { Etat } from '../components/Etats';
import { BarreProgression } from '../components/indicateurs';
import { api, useApi } from '../lib/api';
import { horodatage } from '../lib/format';

const VERDICT = {
  reussie: { libelle: 'OK', couleur: 'var(--ok-texte)' },
  partielle: { libelle: 'PARTIEL', couleur: 'var(--partiel)' },
  ratee: { libelle: 'À REVOIR', couleur: 'var(--ko)' },
} as const;

export function Progression() {
  const progression = useApi(api.progression, 'progression-page');

  return (
    <>
      <div className="entete-page">
        <div>
          <div className="surtitre">Suivi de progression</div>
          <h1>Progression</h1>
        </div>
        <div className="actions">
          <Link to="/entrainement" className="bouton primaire">
            Lancer une session
          </Link>
        </div>
      </div>

      <Etat requete={progression} hauteur={260}>
        {(p) => (
          <div className="deux-colonnes">
            <section className="panneau panneau-pad large" aria-labelledby="maitrise" style={{ gap: 14 }}>
              <h2 id="maitrise">Maîtrise par domaine</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--texte-attenue)' }}>
                Moyenne du meilleur score obtenu sur chaque question du domaine (une question jamais tentée compte 0).
              </p>
              {p.domaines.map((d) =>
                d.nbQuestions > 0 ? (
                  <BarreProgression key={d.slug} libelle={`${d.nomCourt} · ${d.nbQuestions} questions`} valeur={d.maitrise} teinte={d.couleur} />
                ) : (
                  <div key={d.slug} className="barre-progression" style={{ opacity: 0.55 }}>
                    <div className="ligne">
                      <span>{d.nomCourt}</span>
                      <span className="valeur">questions à venir</span>
                    </div>
                  </div>
                ),
              )}
            </section>
            <section className="panneau panneau-pad etroite" aria-labelledby="dernieres" style={{ gap: 12 }}>
              <h2 id="dernieres">Dernières réponses</h2>
              {p.tentatives.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--texte-attenue)' }}>Aucune réponse pour l'instant.</p>
              ) : (
                <ol className="historique">
                  {p.tentatives.map((t) => (
                    <li key={t.id}>
                      <span className="mono" style={{ color: 'var(--texte-discret)' }}>
                        {horodatage(t.creeLe)}
                      </span>
                      <Link to={`/entrainement?question=${t.questionId}`} className="titre" style={{ textDecoration: 'none' }}>
                        {t.titre}
                      </Link>
                      <span className="mono" style={{ color: VERDICT[t.verdict].couleur }}>
                        {String(t.score).replace('.', ',')}/{t.max}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </Etat>
    </>
  );
}
