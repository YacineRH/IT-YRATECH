import { describe, expect, it } from 'vitest';
import { horodatage, ilYa } from './format';

const maintenant = new Date(2026, 9, 13, 9, 14);

describe('horodatage', () => {
  it("n'affiche que l'heure pour aujourd'hui", () => {
    expect(horodatage(new Date(2026, 9, 13, 7, 42).toISOString(), maintenant)).toBe('07:42');
  });

  it('indique hier', () => {
    expect(horodatage(new Date(2026, 9, 12, 18, 40).toISOString(), maintenant)).toBe('hier 18:40');
  });

  it('donne la date au-dela', () => {
    expect(horodatage(new Date(2026, 9, 9, 8, 5).toISOString(), maintenant)).toBe('09.10 08:05');
  });
});

describe('ilYa', () => {
  it('formate minutes, heures et jours', () => {
    const avant = (min: number) => new Date(maintenant.getTime() - min * 60000).toISOString();
    expect(ilYa(avant(0), maintenant)).toBe("à l'instant");
    expect(ilYa(avant(12), maintenant)).toBe('il y a 12 min');
    expect(ilYa(avant(180), maintenant)).toBe('il y a 3 h');
    expect(ilYa(avant(60 * 72), maintenant)).toBe('il y a 3 j');
  });
});
