import { isValidDeck } from '@poker/poker-engine';
import { describe, expect, it } from 'vitest';
import { shuffleDeck } from '../src/index.js';

describe('mazzo CSPRNG (§7)', () => {
  it('produce una permutazione valida di 52 carte', () => {
    for (let i = 0; i < 200; i++) expect(isValidDeck(shuffleDeck())).toBe(true);
  });

  it('usa la sorgente iniettata (test deterministici)', () => {
    const zeros = shuffleDeck(() => 0);
    expect(zeros).toEqual(shuffleDeck(() => 0));
    expect(isValidDeck(zeros)).toBe(true);
  });

  it('rifiuta una sorgente fuori intervallo', () => {
    expect(() => shuffleDeck((max) => max)).toThrow();
  });

  it('diagnostica: la prima carta è distribuita in modo plausibilmente uniforme', () => {
    // Diagnostico, non prova di sicurezza: la garanzia viene dalla sorgente CSPRNG.
    const counts = new Array<number>(52).fill(0);
    const n = 52_000;
    for (let i = 0; i < n; i++) counts[shuffleDeck()[0]!]! += 1;
    const expected = n / 52;
    const chi2 = counts.reduce((acc, c) => acc + (c - expected) ** 2 / expected, 0);
    // 51 gradi di libertà: soglia con p ≈ 1e-6.
    expect(chi2).toBeLessThan(115);
  });
});
