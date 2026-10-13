import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, useApi } from '../lib/api';
import { couleur, ilYa } from '../lib/format';
import { Alerte, Barres, Bulle, Grille, Logo, Loupe } from './icones';

function Recherche() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const [q, setQ] = useState(pathname === '/recherche' ? (params.get('q') ?? '') : '');
  const champ = useRef<HTMLInputElement>(null);

  // « / » place le curseur dans la recherche, comme dans la plupart des consoles.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (e.key !== '/' || cible.closest('input, textarea, [contenteditable]')) return;
      e.preventDefault();
      champ.current?.focus();
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, []);

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim().length >= 2) navigate(`/recherche?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form className="recherche" role="search" onSubmit={envoyer}>
      <Loupe />
      <label htmlFor="recherche" className="sr-only">
        Recherche transverse
      </label>
      <input
        ref={champ}
        id="recherche"
        type="search"
        placeholder="Rechercher une fiche, un outil, une alerte…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <kbd className="touche">/</kbd>
    </form>
  );
}

export function Layout() {
  const domaines = useApi(api.domaines, 'domaines');
  const veille = useApi(() => api.veille(24), 'veille-layout');
  const nbCritiques = veille.donnees?.compteurs.critique ?? 0;
  const derniereSync = veille.donnees?.derniereSync;
  const aDesDemos = veille.donnees?.alertes.some((a) => a.demo) ?? false;
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a href="#contenu" className="sr-only">
        Aller au contenu
      </a>
      <header className="barre">
        <Link to="/" className="logo" aria-label="IT-YRATECH, veille du jour">
          <Logo />
          <span>IT-YRATECH</span>
        </Link>
        <Recherche />
        <div className="etat-sync">
          <span>
            <span className={`pastille${derniereSync ? '' : ' attente'}`} aria-hidden="true" />
            {derniereSync ? `SYNC · ${ilYa(derniereSync)}` : 'SYNC · en attente'}
          </span>
        </div>
      </header>

      <div className="corps">
        <aside className="lateral">
          <nav aria-label="Navigation principale" className="nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'actif' : undefined)}>
              <Alerte couleur="var(--crit-critique)" />
              Veille du jour
              {nbCritiques > 0 && (
                <span className="compteur" aria-label={`${nbCritiques} alertes critiques`}>
                  {nbCritiques}
                </span>
              )}
            </NavLink>
            <NavLink to="/domaines" className={({ isActive }) => (isActive ? 'actif' : undefined)}>
              <Grille />
              Domaines
            </NavLink>
            <NavLink to="/entrainement" className={({ isActive }) => (isActive ? 'actif' : undefined)}>
              <Bulle />
              Entraînement
            </NavLink>
            <NavLink to="/progression" className={({ isActive }) => (isActive ? 'actif' : undefined)}>
              <Barres />
              Progression
            </NavLink>
          </nav>

          <div className="lateral-extra" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="surtitre">Domaines</div>
            <ul className="liste-domaines">
              {domaines.donnees?.map((d) => (
                <li key={d.slug}>
                  <Link to={`/domaines/${d.slug}`} style={couleur(d.couleur)}>
                    <span className="carre" />
                    {d.nomCourt}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {aDesDemos && <div className="mention-demo lateral-extra">ALERTES D'EXEMPLE · veille réelle en phase 4</div>}
        </aside>

        <main id="contenu" className="principal">
          <Outlet />
        </main>
      </div>
    </>
  );
}
