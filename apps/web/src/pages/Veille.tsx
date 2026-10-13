import { CRITICITES, type Alerte, type Criticite, type VeilleDuJour } from '@yratech/shared';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PuceLien } from '../components/Carte';
import { Etat } from '../components/Etats';
import { BadgeCriticite, BarreProgression, Jauge, NiveauCriticite, Puce } from '../components/indicateurs';
import { api, useApi } from '../lib/api';
import { CRITICITE, couleur, dateLongue, deuxChiffres, horodatage, styleCriticite } from '../lib/format';

const FENETRES = [24, 72, 168] as const;

function Compteurs({ veille }: { veille: VeilleDuJour }) {
  return (
    <section aria-label="Répartition par criticité" className="compteurs">
      {CRITICITES.map((c) => (
        <div key={c} className="compteur-crit" style={styleCriticite(c)}>
          <div className="tete">
            <span className="nom">{CRITICITE[c].libelle.toUpperCase()}</span>
            <Jauge niveau={CRITICITE[c].niveau} max={4} />
          </div>
          <div className="nombre">{deuxChiffres(veille.compteurs[c])}</div>
          <div className="sous">{CRITICITE[c].sous}</div>
        </div>
      ))}
    </section>
  );
}

function FichesLiees({ alerte }: { alerte: Alerte }) {
  if (alerte.contenus.length === 0) return null;
  const teinte = (slug: string) => alerte.domaines.find((d) => d.slug === slug)?.couleur ?? 'var(--accent)';
  return (
    <div className="liens-ligne">
      <span className="etiquette">Fiches liées</span>
      {alerte.contenus.map((c) => (
        <PuceLien key={c.id} id={c.id} titre={c.titre} teinte={teinte(c.domaine)} />
      ))}
    </div>
  );
}

function AlerteALaUne({ alerte }: { alerte: Alerte }) {
  return (
    <article className="alerte-une" style={styleCriticite(alerte.criticite)} aria-labelledby="une">
      <div className="meta-alerte">
        <BadgeCriticite criticite={alerte.criticite} />
        {alerte.exploitationActive && <span className="exploitation">exploitation active</span>}
        <span>
          {alerte.source} · {horodatage(alerte.publieLe)}
        </span>
        {alerte.reference && <span>{alerte.reference}</span>}
      </div>
      <h2 id="une">{alerte.titre}</h2>
      <p>{alerte.resume}</p>
      {(alerte.pourquoi || alerte.reflexe) && (
        <div className="encarts">
          {alerte.pourquoi && (
            <div className="encart">
              <div className="surtitre">Pourquoi ça compte</div>
              <div>{alerte.pourquoi}</div>
            </div>
          )}
          {alerte.reflexe && (
            <div className="encart">
              <div className="surtitre">Réflexe</div>
              <div>{alerte.reflexe}</div>
            </div>
          )}
        </div>
      )}
      <FichesLiees alerte={alerte} />
    </article>
  );
}

function LigneAlerte({ alerte }: { alerte: Alerte }) {
  const [ouverte, setOuverte] = useState(false);
  const idDetail = `detail-${alerte.id}`;
  return (
    <>
      <button
        type="button"
        className="ligne-alerte"
        style={styleCriticite(alerte.criticite)}
        aria-expanded={ouverte}
        aria-controls={idDetail}
        onClick={() => setOuverte((o) => !o)}
      >
        <NiveauCriticite criticite={alerte.criticite} />
        <span className="texte">
          <span className="titre">{alerte.titre}</span>
          <span className="meta">
            {alerte.source} · {horodatage(alerte.publieLe)}
            {alerte.exploitationActive ? ' · exploitée' : ''}
          </span>
        </span>
        <span className="puces">
          {alerte.domaines.map((d) => (
            <Puce key={d.slug} teinte={d.couleur}>
              {d.nomCourt}
            </Puce>
          ))}
        </span>
      </button>
      {ouverte && (
        <div id={idDetail} className="detail-alerte">
          <p>{alerte.resume}</p>
          {alerte.pourquoi && (
            <p>
              <strong>Pourquoi ça compte · </strong>
              {alerte.pourquoi}
            </p>
          )}
          {alerte.reflexe && (
            <p>
              <strong>Réflexe · </strong>
              {alerte.reflexe}
            </p>
          )}
          <FichesLiees alerte={alerte} />
        </div>
      )}
    </>
  );
}

function Flux({ alertes }: { alertes: Alerte[] }) {
  const [filtre, setFiltre] = useState<Criticite | 'tout'>('tout');
  const visibles = filtre === 'tout' ? alertes : alertes.filter((a) => a.criticite === filtre);
  return (
    <section aria-labelledby="flux" className="panneau flux">
      <div className="tete-flux">
        <h2 id="flux">Flux d'alertes</h2>
        <span className="mono">
          {visibles.length} élément{visibles.length > 1 ? 's' : ''} · tri par criticité
        </span>
        <div className="filtres" role="group" aria-label="Filtrer par criticité">
          <button type="button" className="filtre" aria-pressed={filtre === 'tout'} onClick={() => setFiltre('tout')}>
            Tout
          </button>
          {CRITICITES.map((c) => (
            <button
              key={c}
              type="button"
              className="filtre"
              style={couleur(`var(--crit-${c})`)}
              aria-pressed={filtre === c}
              onClick={() => setFiltre(c)}
            >
              {CRITICITE[c].libelle}
            </button>
          ))}
        </div>
      </div>
      {visibles.length === 0 ? (
        <div className="etat-vide">Aucune alerte de ce niveau sur la période.</div>
      ) : (
        visibles.map((a) => <LigneAlerte key={a.id} alerte={a} />)
      )}
    </section>
  );
}

function Timeline({ veille }: { veille: VeilleDuJour }) {
  const evenements = useMemo(() => {
    const items = veille.alertes.map((a) => ({
      cle: a.id,
      date: a.publieLe,
      teinte: `var(--crit-${a.criticite})`,
      texte: `${a.source} — ${a.titre}`,
    }));
    if (veille.derniereSync) {
      items.push({ cle: 'sync', date: veille.derniereSync, teinte: 'var(--accent)', texte: 'Synchronisation de la veille' });
    }
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [veille]);

  return (
    <section aria-labelledby="tl" className="panneau panneau-pad">
      <h2 id="tl" style={{ marginBottom: 14 }}>
        Timeline de veille
      </h2>
      <ol className="timeline">
        {evenements.map((e) => (
          <li key={e.cle} style={couleur(e.teinte)}>
            <span className="rail" aria-hidden="true">
              <span className="point" />
              <span className="fil" />
            </span>
            <span className="contenu">
              <span className="heure">{horodatage(e.date)}</span>
              {e.texte}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProgressionDomaines() {
  const progression = useApi(api.progression, 'progression');
  return (
    <section aria-labelledby="prog" className="panneau panneau-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 id="prog">Progression par domaine</h2>
      <Etat requete={progression} hauteur={140}>
        {(p) => (
          <>
            {p.domaines
              .filter((d) => d.nbQuestions > 0)
              .map((d) => (
                <BarreProgression key={d.slug} libelle={d.nomCourt} valeur={d.maitrise} teinte={d.couleur} />
              ))}
            <Link to="/progression" style={{ fontSize: 13 }}>
              Voir le détail
            </Link>
          </>
        )}
      </Etat>
    </section>
  );
}

function QuestionDuJour() {
  const question = useApi(() => api.question({}), 'question-du-jour');
  return (
    <section aria-labelledby="qdj" className="panneau panneau-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 id="qdj">Question du jour</h2>
        {question.donnees && (
          <span style={{ marginLeft: 'auto' }}>
            <Puce teinte={question.donnees.domaine.couleur}>{question.donnees.domaine.nomCourt}</Puce>
          </span>
        )}
      </div>
      <Etat requete={question} hauteur={80}>
        {(q) => (
          <>
            <p style={{ margin: 0, color: '#dce3ee' }}>« {q.titre} »</p>
            <Link to={`/entrainement?question=${q.id}`} className="bouton grand">
              S'entraîner
            </Link>
          </>
        )}
      </Etat>
    </section>
  );
}

export function Veille() {
  const [heures, setHeures] = useState<(typeof FENETRES)[number]>(24);
  const veille = useApi(() => api.veille(heures), `veille-${heures}`);
  const libelleFenetre = heures === 24 ? '24 H' : heures === 72 ? '3 JOURS' : '7 JOURS';

  return (
    <>
      <div className="entete-page">
        <div>
          <div className="surtitre">
            {dateLongue()} · fenêtre {libelleFenetre}
          </div>
          <h1>Veille du jour</h1>
        </div>
        <div className="actions filtres" role="group" aria-label="Fenêtre de temps">
          {FENETRES.map((h) => (
            <button key={h} type="button" className="filtre" aria-pressed={heures === h} onClick={() => setHeures(h)}>
              {h === 24 ? '24 h' : h === 72 ? '3 jours' : '7 jours'}
            </button>
          ))}
        </div>
      </div>

      <Etat
        requete={veille}
        hauteur={110}
        vide={(v) => (v.alertes.length === 0 ? 'Aucune alerte sur cette période. Élargissez la fenêtre de temps.' : null)}
      >
        {(v) => (
          <>
            <Compteurs veille={v} />
            <div className="deux-colonnes">
              <div className="large">
                <AlerteALaUne alerte={v.alertes[0]!} />
                <Flux alertes={v.alertes.slice(1)} />
              </div>
              <aside className="etroite" aria-label="Contexte">
                <Timeline veille={v} />
                <ProgressionDomaines />
                <QuestionDuJour />
              </aside>
            </div>
          </>
        )}
      </Etat>
    </>
  );
}
