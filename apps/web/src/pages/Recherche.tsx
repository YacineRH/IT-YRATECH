import { useSearchParams } from 'react-router-dom';
import { Carte, PuceLien } from '../components/Carte';
import { Etat } from '../components/Etats';
import { BadgeCriticite } from '../components/indicateurs';
import { api, useApi } from '../lib/api';
import { horodatage } from '../lib/format';

export function Recherche() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const resultats = useApi(() => (q.length >= 2 ? api.recherche(q) : Promise.resolve({ contenus: [], alertes: [] })), `recherche-${q}`);

  return (
    <>
      <div className="entete-page">
        <div>
          <div className="surtitre">Recherche transverse · tous domaines</div>
          <h1>« {q} »</h1>
        </div>
      </div>

      <Etat
        requete={resultats}
        hauteur={200}
        vide={(r) =>
          q.length < 2
            ? 'Saisis au moins deux caractères.'
            : r.contenus.length + r.alertes.length === 0
              ? 'Aucun résultat. Essaie un terme plus général (ex. « dns », « rgpd », « ransomware »).'
              : null
        }
      >
        {(r) => (
          <>
            {r.alertes.length > 0 && (
              <section className="panneau panneau-pad" aria-labelledby="r-alertes" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 id="r-alertes">Alertes de veille</h2>
                {r.alertes.map((a) => (
                  <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                      <BadgeCriticite criticite={a.criticite} />
                      <strong style={{ fontWeight: 500 }}>{a.titre}</strong>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--texte-discret)' }}>
                        {a.source} · {horodatage(a.publieLe)}
                      </span>
                    </div>
                    {a.contenus.length > 0 && (
                      <div className="liens-ligne">
                        {a.contenus.map((c) => (
                          <PuceLien key={c.id} id={c.id} titre={c.titre} teinte={a.domaines.find((d) => d.slug === c.domaine)?.couleur ?? 'var(--accent)'} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}
            {r.contenus.length > 0 && (
              <section aria-labelledby="r-contenus" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 id="r-contenus" style={{ fontSize: 15, fontWeight: 600 }}>
                  {r.contenus.length} contenu{r.contenus.length > 1 ? 's' : ''}
                </h2>
                <div className="grille-cartes">
                  {r.contenus.map((c) => (
                    <Carte key={c.id} contenu={c} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Etat>
    </>
  );
}
