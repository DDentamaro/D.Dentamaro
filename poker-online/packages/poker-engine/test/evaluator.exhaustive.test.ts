import { describe, expect, it } from 'vitest';
import { evaluateFive } from '../src/index.js';

/**
 * Job dedicato (§20.3): tutte le 2.598.960 mani da cinque carte.
 * Frequenze e numero di classi di equivalenza sono valori combinatori noti e indipendenti.
 */
describe('evaluator — esaustivo 5 carte', () => {
  it('frequenze per categoria e 7462 classi distinte', () => {
    const freq = new Array<number>(9).fill(0);
    const scores = new Set<number>();
    const hand = [0, 0, 0, 0, 0];
    for (let a = 0; a < 48; a++)
      for (let b = a + 1; b < 49; b++)
        for (let c = b + 1; c < 50; c++)
          for (let d = c + 1; d < 51; d++)
            for (let e = d + 1; e < 52; e++) {
              hand[0] = a; hand[1] = b; hand[2] = c; hand[3] = d; hand[4] = e;
              const v = evaluateFive(hand);
              freq[v.category]! += 1;
              scores.add(v.score);
            }
    expect(freq).toEqual([1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40]);
    expect(scores.size).toBe(7462);
  }, 300_000);
});
