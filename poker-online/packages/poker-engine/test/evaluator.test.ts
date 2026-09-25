import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { HandCategory, evaluateBestOf, evaluateFive, evaluateHoldem, parseCards } from '../src/index.js';
import { oracleEvaluate } from './oracle.js';

const five = (s: string) => evaluateFive(parseCards(s));

describe('evaluator — categorie', () => {
  it.each([
    ['Ah Kh Qh Jh Th', HandCategory.STRAIGHT_FLUSH],
    ['5d 4d 3d 2d Ad', HandCategory.STRAIGHT_FLUSH],
    ['9c 9d 9h 9s 2c', HandCategory.FOUR_OF_A_KIND],
    ['9c 9d 9h 2s 2c', HandCategory.FULL_HOUSE],
    ['Ac 9c 7c 4c 2c', HandCategory.FLUSH],
    ['Tc 9d 8h 7s 6c', HandCategory.STRAIGHT],
    ['Ac 2d 3h 4s 5c', HandCategory.STRAIGHT],
    ['7c 7d 7h Ks 2c', HandCategory.THREE_OF_A_KIND],
    ['7c 7d Kh Ks 2c', HandCategory.TWO_PAIR],
    ['7c 7d Kh Qs 2c', HandCategory.PAIR],
    ['Ac Jd 8h 5s 3c', HandCategory.HIGH_CARD],
  ])('%s', (cards, category) => {
    expect(five(cards).category).toBe(category);
  });

  it('la ruota A-5 è la scala minima; Asso alto nelle altre', () => {
    expect(five('Ac 2d 3h 4s 5c').score).toBeLessThan(five('2c 3d 4h 5s 6c').score);
    expect(five('Tc Jd Qh Ks Ac').score).toBeGreaterThan(five('9c Td Jh Qs Kc').score);
    // K-A-2-3-4 non è una scala.
    expect(five('Kc Ad 2h 3s 4c').category).toBe(HandCategory.HIGH_CARD);
  });

  it('kicker', () => {
    expect(five('Ac Ad Kh 8s 2c').score).toBeGreaterThan(five('As Ah Qh Js Tc').score);
    expect(five('Kc Kd 5h 5s Ac').score).toBeGreaterThan(five('Ks Kh 5c 5d Qc').score);
    expect(five('Kc Kd 5h 5s Ac').score).toBeLessThan(five('Ks Kh 6c 6d 2c').score);
    expect(five('9c 9d 9h 2s 2c').score).toBeLessThan(five('Tc Td Th 2d 2h').score);
    expect(five('Ac Qc 9c 7c 3c').score).toBeGreaterThan(five('Ad Qd 9d 7d 2d').score);
  });

  it('il seme non rompe la parità', () => {
    expect(five('Ac Kc Qd Js 9h').score).toBe(five('Ad Kd Qc Jh 9s').score);
  });

  it('board giocato interamente: tutti in parità', () => {
    const board = parseCards('Ts Js Qs Ks As');
    expect(evaluateHoldem(parseCards('2c 3d'), board).score).toBe(evaluateHoldem(parseCards('7h 8h'), board).score);
  });

  it('usa zero, una o due hole cards', () => {
    const board = parseCards('2c 7d 9h Jc Kd');
    expect(evaluateHoldem(parseCards('Ah Ad'), board).category).toBe(HandCategory.PAIR);
    expect(evaluateHoldem(parseCards('8c Td'), board).category).toBe(HandCategory.STRAIGHT);
    expect(evaluateHoldem(parseCards('3s 4s'), board).category).toBe(HandCategory.HIGH_CARD);
  });
});

describe('evaluator vs oracle indipendente', () => {
  const sevenCards = fc.uniqueArray(fc.integer({ min: 0, max: 51 }), { minLength: 7, maxLength: 7 });

  it('categoria e spareggi coincidono su 7 carte casuali', () => {
    fc.assert(
      fc.property(sevenCards, (cards) => {
        const v = evaluateBestOf(cards);
        expect([v.category, ...v.tiebreak]).toEqual(oracleEvaluate(cards));
      }),
      { numRuns: 20000 },
    );
  });

  it("l'ordinamento coincide con quello dell'oracle", () => {
    const cmp = (a: number[], b: number[]) => {
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const d = (a[i] ?? 0) - (b[i] ?? 0);
        if (d !== 0) return Math.sign(d);
      }
      return 0;
    };
    fc.assert(
      fc.property(sevenCards, sevenCards, (a, b) => {
        expect(Math.sign(evaluateBestOf(a).score - evaluateBestOf(b).score)).toBe(cmp(oracleEvaluate(a), oracleEvaluate(b)));
      }),
      { numRuns: 5000 },
    );
  });
});
