import type { ContenuDetail, LienContenu } from '@yratech/shared';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PuceLien } from '../components/Carte';
import { Etat } from '../components/Etats';
import { Alerte as IconeAlerte } from '../components/icones';
import { BadgeCriticite, BadgeDifficulte } from '../components/indicateurs';
import { api, useApi } from '../lib/api';
import { TYPE_CONTENU, horodatage, jourCourt } from '../lib/format';

const NATURE: Record<LienContenu['nature'], string> = {
  'vecteur-attaque': "Vecteur d'attaque",
  prerequis: 'Prérequis',
  outil: 'Outil',
  'voir-aussi': 'Voir aussi',
};

function Piege({ texte }: { texte: string }) {
  return (
    <div className="piege">
      <IconeAlerte taille={20} couleur="var(--crit-elevee)" />
      <div>
        <div className="titre">Piège fréquent en entretien</div>
        <div className="texte">{texte}</div>
      </div>
    </div>
  );
}

function Liens({ liens }: { liens: LienContenu[] }) {
  if (liens.length === 0) return null;
  return (
    <section className="panneau section" aria-labelledby="liens">
      <h2 id="liens">Liens croisés</h2>
      <div className="liens-ligne">
        {liens.map((l) => (
          <PuceLien key={l.id} id={l.id} titre={l.titre} teinte={l.domaine.couleur} prefixe={`${NATURE[l.nature]} · ${l.domaine.nomCourt}`} />
        ))}
      </div>
    </section>
  );
}

function Corps({ contenu }: { contenu: ContenuDetail }) {
  if (contenu.type === 'fiche') {
    const c = contenu.corps;
    return (
      <>
        <section className="panneau section" aria-labelledby="def">
          <h2 id="def">Définition</h2>
          <p>{c.definition}</p>
        </section>
        {c.schema && (
          <section className="panneau section" aria-labelledby="schema">
            <h2 id="schema">Schéma conceptuel</h2>
            <pre>{c.schema}</pre>
          </section>
        )}
        <section className="panneau section" aria-labelledby="cas">
          <h2 id="cas">Cas d'usage réel</h2>
          <p>{c.casUsage}</p>
        </section>
        <section className="panneau section" aria-labelledby="points">
          <h2 id="points">À retenir</h2>
          <ul>
            {c.pointsCles.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
        <Piege texte={c.piege} />
      </>
    );
  }
  if (contenu.type === 'outil') {
    const c = contenu.corps;
    return (
      <section className="panneau section">
        <div className="surtitre">{c.categorie}</div>
        <p>{c.role}</p>
        <h2 style={{ marginTop: 8 }}>Exemple d'usage</h2>
        <pre>{c.exemple}</pre>
        {c.alternatives.length > 0 && (
          <>
            <h2 style={{ marginTop: 8 }}>Alternatives</h2>
            <p>{c.alternatives.join(' · ')}</p>
          </>
        )}
      </section>
    );
  }
  return null;
}

export function Contenu() {
  const { id = '' } = useParams();
  const contenu = useApi(() => api.contenu(id), `contenu-${id}`);

  if (contenu.donnees?.type === 'question') return <Navigate to={`/entrainement?question=${id}`} replace />;

  return (
    <Etat requete={contenu} hauteur={300}>
      {(c) => (
        <article className="fiche">
          <div className="entete-page">
            <div>
              <div className="surtitre">
                <Link to={`/domaines/${c.domaine}`}>{c.domaine}</Link> · {TYPE_CONTENU[c.type].libelle} · maj {jourCourt(c.majLe)}
              </div>
              <h1>{c.titre}</h1>
            </div>
          </div>
          <p style={{ margin: 0, color: 'var(--texte-2)', fontSize: 15 }}>{c.resume}</p>
          <div>
            <BadgeDifficulte difficulte={c.difficulte} />
          </div>

          {c.alertes.length > 0 && (
            <section className="panneau section" aria-labelledby="actu">
              <h2 id="actu">Dans l'actualité</h2>
              {c.alertes.map((a) => (
                <div key={a.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <BadgeCriticite criticite={a.criticite} />
                  <span>{a.titre}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--texte-discret)' }}>
                    {a.source} · {horodatage(a.publieLe)}
                  </span>
                </div>
              ))}
            </section>
          )}

          <Corps contenu={c} />
          <Liens liens={c.liens} />
        </article>
      )}
    </Etat>
  );
}
