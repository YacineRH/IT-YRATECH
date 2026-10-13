import { DIFFICULTES, TYPES_CONTENU, type DomaineDetail, type DomaineResume } from '@yratech/shared';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Carte } from '../components/Carte';
import { Etat } from '../components/Etats';
import { Segments } from '../components/indicateurs';
import { api, useApi } from '../lib/api';
import { DIFFICULTE, couleur, deuxChiffres } from '../lib/format';

const TYPES_LIBELLES = { fiche: 'Fiches', outil: 'Outils', question: 'Questions' } as const;

function Onglets({ domaines, actif }: { domaines: DomaineResume[]; actif: string }) {
  return (
    <nav aria-label="Domaines" className="onglets-domaines">
      {domaines.map((d) => (
        <Link
          key={d.slug}
          to={`/domaines/${d.slug}`}
          className={`onglet-domaine${d.slug === actif ? ' actif' : ''}`}
          aria-current={d.slug === actif ? 'page' : undefined}
          style={couleur(d.couleur)}
        >
          <span className="carre" />
          {d.nomCourt}
          <span className="mono">{d.nbContenus}</span>
        </Link>
      ))}
    </nav>
  );
}

function Bandeau({ domaine }: { domaine: DomaineDetail }) {
  return (
    <section aria-labelledby="dom" className="bandeau-domaine" style={couleur(domaine.couleur)}>
      <div className="texte">
        <div className="surtitre">Domaine {deuxChiffres(domaine.ordre)}</div>
        <h2 id="dom">{domaine.nom}</h2>
        <p>{domaine.description}</p>
      </div>
      <div className="chiffres">
        <div className="chiffre">
          <span className="mono" style={{ color: domaine.couleur }}>
            {domaine.maitrise}%
          </span>
          <span>maîtrisé</span>
        </div>
        <div className="chiffre">
          <span className="mono">{domaine.nbContenus}</span>
          <span>contenus</span>
        </div>
        <div className="chiffre">
          <span className="mono" style={{ color: domaine.nbAlertes ? 'var(--crit-elevee)' : undefined }}>
            {domaine.nbAlertes}
          </span>
          <span>alertes (7 j)</span>
        </div>
        <Segments valeur={domaine.maitrise} teinte={domaine.couleur} />
      </div>
    </section>
  );
}

function bascule(liste: string[], valeur: string): string[] {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
}

function Contenus({ domaine }: { domaine: DomaineDetail }) {
  const [params, setParams] = useSearchParams();
  const sousTheme = params.get('sous-theme') ?? undefined;
  const types = params.get('types')?.split(',').filter(Boolean) ?? [];
  const difficultes = params.get('difficultes')?.split(',').filter(Boolean) ?? [];

  const maj = (cle: string, valeur: string | string[] | undefined) => {
    const p = new URLSearchParams(params);
    const v = Array.isArray(valeur) ? valeur.join(',') : valeur;
    if (v) p.set(cle, v);
    else p.delete(cle);
    setParams(p, { replace: true });
  };

  const contenus = useApi(
    () => api.contenus({ domaine: domaine.slug, sousTheme, type: types, difficulte: difficultes }),
    `${domaine.slug}|${sousTheme}|${types}|${difficultes}`,
  );

  return (
    <>
      <div className="filtres" role="group" aria-label="Sous-thèmes" style={couleur(domaine.couleur)}>
        <span style={{ fontSize: 13, color: 'var(--texte-attenue)', marginRight: 2 }}>Sous-thèmes</span>
        <button type="button" className="filtre" aria-pressed={!sousTheme} onClick={() => maj('sous-theme', undefined)}>
          Tous
        </button>
        {domaine.sousThemes.map((s) => (
          <button
            key={s.slug}
            type="button"
            className="filtre"
            aria-pressed={sousTheme === s.slug}
            disabled={s.nbContenus === 0}
            title={s.nbContenus === 0 ? 'Contenu à venir' : undefined}
            onClick={() => maj('sous-theme', s.slug)}
          >
            {s.nom}
            <span className="mono" style={{ marginLeft: 6, color: 'var(--texte-discret)' }}>
              {s.nbContenus}
            </span>
          </button>
        ))}
      </div>

      <div className="filtres" style={{ marginTop: -8 }}>
        <span style={{ fontSize: 13, color: 'var(--texte-attenue)', marginRight: 2 }}>Afficher</span>
        {TYPES_CONTENU.map((t) => (
          <button key={t} type="button" className="filtre" aria-pressed={types.includes(t)} onClick={() => maj('types', bascule(types, t))}>
            {TYPES_LIBELLES[t]}
          </button>
        ))}
        <span aria-hidden="true" style={{ width: 8 }} />
        {DIFFICULTES.map((d) => (
          <button
            key={d}
            type="button"
            className="filtre"
            style={couleur(DIFFICULTE[d].couleur)}
            aria-pressed={difficultes.includes(d)}
            onClick={() => maj('difficultes', bascule(difficultes, d))}
          >
            {DIFFICULTE[d].libelle}
          </button>
        ))}
      </div>

      <Etat
        requete={contenus}
        hauteur={240}
        vide={(c) =>
          c.length === 0
            ? domaine.nbContenus === 0
              ? 'Ce domaine sera rempli lors de la génération de contenu (phase 3).'
              : 'Aucun contenu ne correspond à ces filtres.'
            : null
        }
      >
        {(liste) => (
          <div className="grille-cartes">
            {liste.map((c) => (
              <Carte key={c.id} contenu={c} domaineCourant={domaine.slug} />
            ))}
          </div>
        )}
      </Etat>
    </>
  );
}

function VueEnsemble({ domaines, actif }: { domaines: DomaineResume[]; actif: string }) {
  return (
    <section aria-labelledby="ensemble" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 id="ensemble" style={{ marginTop: 8, fontSize: 15, fontWeight: 600 }}>
        Vue d'ensemble des domaines
      </h2>
      <div className="grille-domaines">
        {domaines
          .filter((d) => d.slug !== actif)
          .map((d) => (
            <Link key={d.slug} to={`/domaines/${d.slug}`} className="tuile-domaine" style={couleur(d.couleur)}>
              <span className="ligne">
                <span className="carre" />
                {d.nomCourt}
                <span className="mono">{d.nbQuestions ? `${d.maitrise}%` : `${d.nbContenus} contenus`}</span>
              </span>
              <span className="piste">
                <span className="remplissage" style={{ display: 'block', width: `${d.maitrise}%` }} />
              </span>
            </Link>
          ))}
      </div>
    </section>
  );
}

export function Domaines() {
  const { slug } = useParams();
  const domaines = useApi(api.domaines, 'domaines');
  const domaine = useApi(() => (slug ? api.domaine(slug) : Promise.reject(new Error('aucun domaine'))), `domaine-${slug}`);

  if (!slug) {
    return domaines.donnees ? <Navigate to={`/domaines/${domaines.donnees[0]!.slug}`} replace /> : <Etat requete={domaines}>{() => null}</Etat>;
  }

  const total = domaines.donnees?.reduce((n, d) => n + d.nbContenus, 0);

  return (
    <>
      <div className="entete-page">
        <div>
          <div className="surtitre">
            Base de connaissances · {domaines.donnees?.length ?? '…'} domaines · {total ?? '…'} contenus
          </div>
          <h1>Navigation par domaine</h1>
        </div>
      </div>

      <Etat requete={domaines} hauteur={40}>
        {(liste) => <Onglets domaines={liste} actif={slug} />}
      </Etat>

      <Etat requete={domaine} hauteur={160}>
        {(d) => (
          <>
            <Bandeau domaine={d} />
            <Contenus domaine={d} />
          </>
        )}
      </Etat>

      {domaines.donnees && <VueEnsemble domaines={domaines.donnees} actif={slug} />}
    </>
  );
}
