import type { ContenuCarte } from '@yratech/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Carte } from './Carte';

afterEach(cleanup);

const base: ContenuCarte = {
  id: 'dns',
  type: 'fiche',
  titre: 'DNS — résolution de bout en bout',
  resume: 'Récursif vs itératif.',
  difficulte: 'fondamental',
  domaine: 'reseau',
  sousTheme: 'protocoles-applicatifs',
  majLe: '2026-10-13T08:00:00.000Z',
  liens: [
    { id: 'tcp-vs-udp', titre: 'TCP vs UDP', type: 'fiche', nature: 'prerequis', domaine: { slug: 'reseau', nomCourt: 'Réseau', couleur: '#22D3EE' } },
    { id: 'dns-spoofing', titre: 'DNS spoofing', type: 'fiche', nature: 'vecteur-attaque', domaine: { slug: 'pentest', nomCourt: 'Pentest', couleur: '#FF6B4A' } },
  ],
  alerteMax: 'critique',
  nbAlertes: 1,
  meilleurVerdict: null,
};

const rendre = (c: ContenuCarte) =>
  render(
    <MemoryRouter>
      <Carte contenu={c} />
    </MemoryRouter>,
  );

describe('Carte', () => {
  it('met en avant le lien vers un autre domaine', () => {
    rendre(base);
    expect(screen.getByText('Pentest · DNS spoofing')).toBeTruthy();
    expect(screen.queryByText('Réseau · TCP vs UDP')).toBeNull();
  });

  it('affiche la criticite de l alerte liee', () => {
    rendre(base);
    expect(screen.getByText('Critique')).toBeTruthy();
  });

  it('envoie une fiche vers sa page et une question vers l entrainement', () => {
    rendre(base);
    expect(screen.getByRole('link').getAttribute('href')).toBe('/contenus/dns');
    cleanup();
    rendre({ ...base, id: 'q-dns', type: 'question', alerteMax: null, nbAlertes: 0 });
    expect(screen.getByRole('link').getAttribute('href')).toBe('/entrainement?question=q-dns');
  });
});
