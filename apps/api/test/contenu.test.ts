import { describe, expect, it } from 'vitest';
import { evaluerReponse } from '@yratech/shared';
import { config } from '../src/config.js';
import { chargerContenu, verifierCoherence, type JeuDeContenu } from '../src/contenu.js';

const jeu = await chargerContenu(config.contentDir);

describe('contenu versionne', () => {
  it('couvre les 9 domaines du cahier des charges', () => {
    expect(jeu.domaines.map((d) => d.slug)).toEqual([
      'reseau', 'soc', 'grc', 'pentest', 'ia', 'metiers', 'admin-sys', 'web-cloud', 'crypto',
    ]);
  });

  it.each(jeu.contenus.filter((c) => c.type === 'question').map((q) => [q.id, q] as const))(
    'la reponse de reference de %s valide ses propres points cles',
    (_id, question) => {
      if (question.type !== 'question') return;
      const texte = question.corps.reference.map((e) => `${e.titre}. ${e.detail}`).join('\n');
      const r = evaluerReponse(texte, question.corps.pointsCles);
      expect(r.manquants, `points non reconnus : ${r.manquants.map((m) => m.libelle).join(', ')}`).toEqual([]);
    },
  );

  it('signale un lien vers un contenu inexistant', () => {
    const casse: JeuDeContenu = structuredClone(jeu);
    casse.contenus[0]!.liens.push({ cible: 'nexiste-pas', nature: 'voir-aussi' });
    expect(() => verifierCoherence(casse)).toThrow(/nexiste-pas/);
  });

  it('signale un sous-theme hors de son domaine', () => {
    const casse: JeuDeContenu = structuredClone(jeu);
    casse.contenus[0]!.sousTheme = 'inexistant';
    expect(() => verifierCoherence(casse)).toThrow(/sous-theme inconnu/);
  });
});
