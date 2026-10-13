import { describe, expect, it } from 'vitest';
import { evaluerReponse, normaliser } from './evaluation.js';
import type { PointCle } from './schemas.js';

const points: PointCle[] = [
  { libelle: 'Resolution DNS', motsCles: ['dns'] },
  { libelle: 'Handshake TCP', motsCles: ['three-way', 'syn'] },
  { libelle: 'Negociation TLS', motsCles: ['tls', 'certificat'] },
  { libelle: 'Requete HTTP', motsCles: ['http', 'get'] },
  { libelle: 'Rendu', motsCles: ['dom', 'rendu'], secondaire: true },
];

describe('normaliser', () => {
  it('retire accents, casse et ponctuation', () => {
    expect(normaliser('Résolution DNS, puis TLS.')).toBe(' resolution dns puis tls ');
  });

  it('garde les points entre chiffres', () => {
    expect(normaliser('Trunk 802.1Q vers 10.0.0.1.')).toBe(' trunk 802.1q vers 10.0.0.1 ');
  });
});

describe('evaluerReponse', () => {
  it('reconnait une reponse partielle', () => {
    const r = evaluerReponse(
      'Le navigateur fait une requête DNS, ouvre une connexion TCP (three-way handshake) puis envoie un GET HTTP.',
      points,
    );
    expect(r.couverts).toEqual(['Resolution DNS', 'Handshake TCP', 'Requete HTTP']);
    expect(r.manquants.map((m) => m.libelle)).toEqual(['Negociation TLS', 'Rendu']);
    expect(r.verdict).toBe('partielle');
    expect(r.score).toBe(3.5);
  });

  it('accepte pluriels et majuscules', () => {
    const r = evaluerReponse('DNS, SYN, vérification des CERTIFICATS, HTTP puis construction du DOM', points);
    expect(r.verdict).toBe('reussie');
    expect(r.score).toBe(5);
  });

  it('exige le mot entier pour un sigle court', () => {
    const pts: PointCle[] = [
      { libelle: 'MAC', motsCles: ['mac'] },
      { libelle: 'x', motsCles: ['zz'] },
    ];
    expect(evaluerReponse('la machine envoie', pts).couverts).toEqual([]);
    expect(evaluerReponse("l'adresse MAC du poste", pts).couverts).toEqual(['MAC']);
  });

  it("n'accepte pas un mot-cle au milieu d'un mot", () => {
    const r = evaluerReponse('atlas', [{ libelle: 'TLS', motsCles: ['tls'] }, { libelle: 'x', motsCles: ['zz'] }]);
    expect(r.couverts).toEqual([]);
    expect(r.verdict).toBe('ratee');
  });
});
