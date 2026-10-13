import { normaliser, type DomaineResume, type FeedbackEntrainement, type QuestionEntrainement, type Verdict } from '@yratech/shared';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PuceLien } from '../components/Carte';
import { Etat } from '../components/Etats';
import { Chrono, Coche, Croix, Tiret, Alerte as IconeAlerte } from '../components/icones';
import { BadgeDifficulte, BarreProgression, Puce } from '../components/indicateurs';
import { api, ErreurApi, useApi } from '../lib/api';
import { couleur, deuxChiffres } from '../lib/format';

const TAILLE_SESSION = 10;

const VERDICT: Record<Verdict, { titre: string; sous: string; teinte: string; fond: string; bord: string }> = {
  reussie: {
    titre: 'Réponse réussie',
    sous: 'Les points attendus sont couverts.',
    teinte: 'var(--ok)',
    fond: '#0b1712',
    bord: '#1b4d3a',
  },
  partielle: {
    titre: 'Réponse partielle',
    sous: 'Le raisonnement est engagé, mais des points attendus manquent.',
    teinte: 'var(--partiel)',
    fond: '#15140b',
    bord: 'var(--crit-moyenne-bord)',
  },
  ratee: {
    titre: 'À retravailler',
    sous: "L'essentiel de la réponse attendue n'apparaît pas encore.",
    teinte: 'var(--ko)',
    fond: '#170c12',
    bord: 'var(--crit-critique-bord)',
  },
};

interface Resultat {
  questionId: string;
  titre: string;
  verdict: Verdict | 'passee';
}

function useChrono(actif: boolean) {
  const [debut] = useState(() => Date.now());
  const [maintenant, setMaintenant] = useState(debut);
  useEffect(() => {
    if (!actif) return;
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, [actif]);
  const s = Math.floor((maintenant - debut) / 1000);
  return `${deuxChiffres(Math.floor(s / 60))}:${deuxChiffres(s % 60)}`;
}

/** Une etape de la reference est « manquante » si un point manquant la nomme. */
function etapeManquante(titre: string, fb: FeedbackEntrainement) {
  const t = normaliser(titre).trim();
  return fb.manquants.some((m) => !m.secondaire && normaliser(m.libelle).includes(` ${t}`));
}

function Feedback({
  fb,
  onSuivante,
  dernier,
}: {
  fb: FeedbackEntrainement;
  onSuivante: () => void;
  dernier: boolean;
}) {
  const v = VERDICT[fb.verdict];
  const titreRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titreRef.current?.focus(), []);

  return (
    <section
      aria-labelledby="fb"
      className="feedback"
      style={{ ...couleur(v.teinte), '--fond-v': v.fond, '--bord-v': v.bord } as React.CSSProperties}
    >
      <div className="tete">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="score" aria-label={`Score ${String(fb.score).replace('.', ',')} sur ${fb.max}`}>
            {String(fb.score).replace('.', ',')}/{fb.max}
          </div>
          <div>
            <h2 id="fb" ref={titreRef} tabIndex={-1}>
              {v.titre}
            </h2>
            <div className="sous">{v.sous}</div>
          </div>
        </div>
        <div className="mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--texte-attenue)' }}>
          feedback immédiat
        </div>
      </div>

      <div className="bloc points">
        <div>
          <div className="surtitre" style={{ color: 'var(--ok-texte)', marginBottom: 10 }}>
            Points couverts
          </div>
          {fb.couverts.length ? (
            <ul>
              {fb.couverts.map((p) => (
                <li key={p}>
                  <Coche />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: 'var(--texte-attenue)' }}>Aucun point attendu reconnu.</p>
          )}
        </div>
        {fb.manquants.length > 0 && (
          <div>
            <div className="surtitre" style={{ color: '#ff9a85', marginBottom: 10 }}>
              À ajouter
            </div>
            <ul>
              {fb.manquants.map((m) => (
                <li key={m.libelle}>
                  {m.secondaire ? <Tiret /> : <Croix />}
                  <span>
                    {m.libelle}
                    {m.secondaire && <span style={{ color: 'var(--texte-discret)' }}> — bonus</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bloc" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="surtitre">Réponse de référence · structure attendue</div>
        <ol className="etapes">
          {fb.reference.map((e, i) => (
            <li key={e.titre} className={etapeManquante(e.titre, fb) ? 'manque' : undefined}>
              <span className="mono">
                {deuxChiffres(i + 1)} · {e.titre}
              </span>
              <span>{e.detail}</span>
            </li>
          ))}
        </ol>
        <div className="piege">
          <IconeAlerte taille={20} couleur="var(--crit-elevee)" />
          <div>
            <div className="titre">Piège fréquent en entretien</div>
            <div className="texte">{fb.piege}</div>
          </div>
        </div>
        {fb.relances.length > 0 && (
          <div>
            <div className="surtitre" style={{ marginBottom: 6 }}>
              Relances possibles du recruteur
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--texte-2)' }}>
              {fb.relances.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bloc actions">
        {fb.liens.length > 0 && (
          <div className="liens-ligne">
            <span className="etiquette">Réviser</span>
            {fb.liens.map((l) => (
              <PuceLien key={l.id} id={l.id} titre={l.titre} teinte={l.domaine.couleur} />
            ))}
          </div>
        )}
        <div className="droite">
          <button type="button" className="bouton primaire grand" onClick={onSuivante}>
            {dernier ? 'Voir le bilan' : 'Question suivante'}
          </button>
        </div>
      </div>
    </section>
  );
}

function Bilan({ resultats, onRecommencer }: { resultats: Resultat[]; onRecommencer: () => void }) {
  const n = (v: Resultat['verdict']) => resultats.filter((r) => r.verdict === v).length;
  return (
    <section className="panneau question" aria-labelledby="bilan">
      <h2 id="bilan">Session terminée</h2>
      <p style={{ margin: 0, color: 'var(--texte-2)' }}>
        {n('reussie')} réussie(s), {n('partielle')} partielle(s), {n('ratee')} à retravailler
        {n('passee') ? `, ${n('passee')} passée(s)` : ''}. Reformule à voix haute les points manquants, puis vérifie-les en lab.
      </p>
      <div className="bas">
        <button type="button" className="bouton primaire grand" onClick={onRecommencer}>
          Nouvelle session
        </button>
      </div>
    </section>
  );
}

function SelecteurDomaines({ domaines, choisis, onChange }: { domaines: DomaineResume[]; choisis: string[]; onChange: (d: string[]) => void }) {
  const avecQuestions = domaines.filter((d) => d.nbQuestions > 0);
  return (
    <div className="filtres" role="group" aria-label="Domaines de la session">
      <span style={{ fontSize: 13, color: 'var(--texte-attenue)', marginRight: 2 }}>Domaines</span>
      <button type="button" className="filtre" aria-pressed={choisis.length === 0} onClick={() => onChange([])}>
        Tous
      </button>
      {avecQuestions.map((d) => (
        <button
          key={d.slug}
          type="button"
          className="filtre"
          style={couleur(d.couleur)}
          aria-pressed={choisis.includes(d.slug)}
          onClick={() => onChange(choisis.includes(d.slug) ? choisis.filter((s) => s !== d.slug) : [...choisis, d.slug])}
        >
          {d.nomCourt}
          <span className="mono" style={{ marginLeft: 6, color: 'var(--texte-discret)' }}>
            {d.nbQuestions}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Entrainement() {
  const [params, setParams] = useSearchParams();
  const domaines = useApi(api.domaines, 'domaines');
  const choisis = params.get('domaines')?.split(',').filter(Boolean) ?? [];
  const questionDemandee = params.get('question');

  const [question, setQuestion] = useState<QuestionEntrainement | null>(null);
  const [epuise, setEpuise] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reponse, setReponse] = useState('');
  const [feedback, setFeedback] = useState<FeedbackEntrainement | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [session, setSession] = useState(0);
  const progression = useApi(api.progression, `progression-${resultats.length}`);
  const chrono = useChrono(resultats.length < TAILLE_SESSION);
  const vues = useRef<string[]>([]);

  const tirer = useCallback(
    async (domainesChoisis: string[]) => {
      setFeedback(null);
      setReponse('');
      setErreur(null);
      try {
        setQuestion(await api.question({ domaines: domainesChoisis, exclure: vues.current }));
        setEpuise(false);
      } catch (e) {
        if (e instanceof ErreurApi && e.statut === 404) {
          setQuestion(null);
          setEpuise(true);
        } else setErreur((e as Error).message);
      }
    },
    [],
  );

  // Premiere question : celle demandee dans l'URL, sinon un tirage.
  useEffect(() => {
    if (!domaines.donnees) return;
    if (questionDemandee) {
      api.question({ id: questionDemandee }).then(
        (q) => {
          setQuestion(q);
          setFeedback(null);
          setReponse('');
        },
        () => void tirer(choisis),
      );
    } else {
      void tirer(choisis);
    }
    // Relance seulement quand la source de la question change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domaines.donnees, questionDemandee, params.get('domaines'), session]);

  const changerDomaines = (d: string[]) => {
    const p = new URLSearchParams();
    if (d.length) p.set('domaines', d.join(','));
    setParams(p, { replace: true });
  };

  const suivante = () => {
    if (questionDemandee) {
      const p = new URLSearchParams(params);
      p.delete('question');
      setParams(p, { replace: true });
    } else void tirer(choisis);
  };

  const passer = () => {
    if (!question) return;
    vues.current.push(question.id);
    setResultats((r) => [...r, { questionId: question.id, titre: question.titre, verdict: 'passee' }]);
    suivante();
  };

  const envoyer = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!question || !reponse.trim() || envoi) return;
    setEnvoi(true);
    try {
      const fb = await api.repondre(question.id, reponse);
      vues.current.push(question.id);
      setFeedback(fb);
      setResultats((r) => [...r, { questionId: question.id, titre: question.titre, verdict: fb.verdict }]);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  const recommencer = () => {
    vues.current = [];
    setResultats([]);
    setSession((s) => s + 1);
  };

  const termine = resultats.length >= TAILLE_SESSION && !feedback;
  const numero = Math.min(resultats.length + (feedback ? 0 : 1), TAILLE_SESSION);
  const compte = (v: Resultat['verdict']) => resultats.filter((r) => r.verdict === v).length;
  const teinteSegment = (r: Resultat | undefined, i: number) =>
    r
      ? r.verdict === 'reussie'
        ? 'var(--ok)'
        : r.verdict === 'partielle'
          ? 'var(--partiel)'
          : r.verdict === 'ratee'
            ? 'var(--ko)'
            : 'var(--trait-fort)'
      : i === resultats.length && !termine
        ? 'var(--texte)'
        : 'var(--piste)';

  return (
    <>
      <div className="entete-page">
        <div>
          <div className="surtitre">Mode entraînement · tirage aléatoire · {TAILLE_SESSION} questions</div>
          <h1>Entraînement entretien</h1>
        </div>
        <div className="actions mono" style={{ alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--texte-attenue)' }}>
          <span>
            Question <span style={{ color: 'var(--texte)', fontWeight: 600 }}>{deuxChiffres(numero)}</span> / {TAILLE_SESSION}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--trait)', borderRadius: 6, padding: '4px 8px' }}>
            <Chrono />
            <span aria-label="Durée de la session">{chrono}</span>
          </span>
        </div>
      </div>

      <div
        style={{ display: 'flex', gap: 4 }}
        role="img"
        aria-label={`Progression de la session : ${resultats.length} sur ${TAILLE_SESSION}`}
      >
        {Array.from({ length: TAILLE_SESSION }, (_, i) => (
          <span key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: teinteSegment(resultats[i], i) }} />
        ))}
      </div>

      {domaines.donnees && <SelecteurDomaines domaines={domaines.donnees} choisis={choisis} onChange={changerDomaines} />}

      <div className="deux-colonnes">
        <div className="large">
          {erreur && (
            <div className="panneau etat-erreur" role="alert">
              {erreur}
            </div>
          )}
          {termine ? (
            <Bilan resultats={resultats} onRecommencer={recommencer} />
          ) : epuise ? (
            <div className="panneau question">
              <h2>Plus de question disponible</h2>
              <p style={{ margin: 0, color: 'var(--texte-2)' }}>
                Toutes les questions de cette sélection ont été vues pendant la session. Élargis les domaines ou démarre une nouvelle session.
              </p>
              <div className="bas">
                <button type="button" className="bouton primaire grand" onClick={recommencer}>
                  Nouvelle session
                </button>
              </div>
            </div>
          ) : !question ? (
            <div className="squelette" style={{ minHeight: 260 }} aria-busy="true" aria-label="Chargement de la question" />
          ) : (
            <form className="panneau question" aria-labelledby="enonce" onSubmit={envoyer}>
              <div className="filtres">
                <Puce teinte={question.domaine.couleur}>
                  {question.domaine.nomCourt} · {question.sousTheme}
                </Puce>
                <BadgeDifficulte difficulte={question.difficulte} />
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--texte-discret)' }}>
                  {question.id}
                </span>
              </div>
              <h2 id="enonce">« {question.titre} »</h2>
              <label htmlFor="reponse">Ta réponse — structure-la comme à l'oral</label>
              <textarea
                id="reponse"
                value={reponse}
                readOnly={!!feedback}
                onChange={(e) => setReponse(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void envoyer();
                }}
                placeholder="Explique les étapes et le raisonnement, avec les termes techniques précis…"
              />
              {!feedback && (
                <div className="bas">
                  <button type="submit" className="bouton primaire grand" disabled={!reponse.trim() || envoi}>
                    {envoi ? 'Évaluation…' : 'Valider ma réponse'}
                  </button>
                  <button type="button" className="bouton grand" onClick={passer}>
                    Passer
                  </button>
                  <span className="aide">Ctrl + Entrée pour valider</span>
                </div>
              )}
            </form>
          )}

          {feedback && <Feedback key={feedback.questionId} fb={feedback} onSuivante={suivante} dernier={resultats.length >= TAILLE_SESSION} />}
        </div>

        <aside className="etroite" aria-label="Suivi">
          <section className="panneau panneau-pad" aria-labelledby="sess" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 id="sess">Session en cours</h2>
            <div className="tuiles-session">
              <div className="tuile-session">
                <div className="mono" style={{ color: 'var(--ok)' }}>{compte('reussie')}</div>
                <div>réussies</div>
              </div>
              <div className="tuile-session">
                <div className="mono" style={{ color: 'var(--partiel)' }}>{compte('partielle')}</div>
                <div>partielles</div>
              </div>
              <div className="tuile-session">
                <div className="mono" style={{ color: 'var(--ko)' }}>{compte('ratee')}</div>
                <div>à retravailler</div>
              </div>
              <div className="tuile-session">
                <div className="mono">{chrono}</div>
                <div>durée</div>
              </div>
            </div>
            {resultats.length > 0 && (
              <ol className="historique" reversed>
                {[...resultats].reverse().map((r, i) => (
                  <li key={`${r.questionId}-${i}`}>
                    <span className="mono" style={{ color: 'var(--texte-discret)' }}>
                      {deuxChiffres(resultats.length - i)}
                    </span>
                    <span className="titre">{r.titre}</span>
                    <span
                      className="mono"
                      style={{
                        color:
                          r.verdict === 'reussie' ? 'var(--ok-texte)' : r.verdict === 'partielle' ? 'var(--partiel)' : r.verdict === 'ratee' ? 'var(--ko)' : 'var(--texte-discret)',
                      }}
                    >
                      {r.verdict === 'reussie' ? 'OK' : r.verdict === 'partielle' ? 'PARTIEL' : r.verdict === 'ratee' ? 'À REVOIR' : 'PASSÉE'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="panneau panneau-pad" aria-labelledby="niv" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 id="niv">Maîtrise par domaine</h2>
            <Etat requete={progression} hauteur={120}>
              {(p) => (
                <>
                  {p.domaines
                    .filter((d) => d.nbQuestions > 0)
                    .map((d) => (
                      <BarreProgression key={d.slug} libelle={d.nomCourt} valeur={d.maitrise} teinte={d.couleur} />
                    ))}
                </>
              )}
            </Etat>
          </section>

          <section className="rappel">
            <div className="surtitre">Rappel méthode</div>
            <p>Ne mémorise pas la réponse : reformule le raisonnement à voix haute, puis vérifie-le en lab ou dans la documentation officielle.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
