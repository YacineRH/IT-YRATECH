/* Icones au trait, decoratives (le texte voisin porte le sens). */

type P = { taille?: number; couleur?: string };

const base = (taille: number, couleur: string, largeur = 2) => ({
  width: taille,
  height: taille,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: couleur,
  strokeWidth: largeur,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="26" height="26" rx="6" stroke="#22D3EE" strokeWidth="1.5" />
    <path d="M7 18l4-5 3 3 4-6 3 4" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Alerte = ({ taille = 18, couleur = 'currentColor' }: P) => (
  <svg {...base(taille, couleur)}>
    <path d="M12 3l9 16H3z" />
    <path d="M12 10v4M12 17v.5" />
  </svg>
);

export const Grille = ({ taille = 18, couleur = 'currentColor' }: P) => (
  <svg {...base(taille, couleur)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const Bulle = ({ taille = 18, couleur = 'currentColor' }: P) => (
  <svg {...base(taille, couleur)}>
    <path d="M4 5h16v11H9l-5 4z" />
  </svg>
);

export const Barres = ({ taille = 18, couleur = 'currentColor' }: P) => (
  <svg {...base(taille, couleur)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

export const Loupe = ({ taille = 16, couleur = 'var(--texte-discret)' }: P) => (
  <svg {...base(taille, couleur)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const Fleche = ({ taille = 14, couleur = 'currentColor' }: P) => (
  <svg {...base(taille, couleur)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Coche = ({ taille = 18, couleur = 'var(--ok)' }: P) => (
  <svg {...base(taille, couleur, 2.5)}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);

export const Croix = ({ taille = 18, couleur = 'var(--dom-pentest)' }: P) => (
  <svg {...base(taille, couleur, 2.5)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Tiret = ({ taille = 18, couleur = 'var(--crit-moyenne)' }: P) => (
  <svg {...base(taille, couleur, 2.5)}>
    <path d="M5 12h14" />
  </svg>
);

export const Chrono = ({ taille = 14, couleur = 'currentColor' }: P) => (
  <svg {...base(taille, couleur)}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M9 2h6" />
  </svg>
);
