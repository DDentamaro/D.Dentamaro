import { describe, expect, it } from 'vitest';
import { computeRatingDeltas, leagueFor, seasonResetRating } from '../src/index.js';

describe('rating pairwise Elo (§14.2, §20.2)', () => {
  it('sei giocatori a 1500 senza pareggi: +12, +7.2, +2.4, -2.4, -7.2, -12', () => {
    const players = [1, 2, 3, 4, 5, 6].map((place) => ({ principalId: `p${place}`, ratingBefore: 1500, place }));
    const deltas = computeRatingDeltas(players).map((d) => d.delta);
    [12, 7.2, 2.4, -2.4, -7.2, -12].forEach((expected, i) => expect(deltas[i]).toBeCloseTo(expected, 10));
  });

  it('somma dei delta circa zero e pareggi a 0.5', () => {
    const players = [
      { principalId: 'a', ratingBefore: 1620.5, place: 1 },
      { principalId: 'b', ratingBefore: 1480, place: 2 },
      { principalId: 'c', ratingBefore: 1510, place: 2 },
      { principalId: 'd', ratingBefore: 1390, place: 4 },
      { principalId: 'e', ratingBefore: 1555, place: 5 },
      { principalId: 'f', ratingBefore: 1500, place: 6 },
    ];
    const deltas = computeRatingDeltas(players);
    expect(deltas.reduce((acc, d) => acc + d.delta, 0)).toBeCloseTo(0, 9);
    const equal = computeRatingDeltas([
      { principalId: 'x', ratingBefore: 1500, place: 1 },
      { principalId: 'y', ratingBefore: 1500, place: 1 },
    ]);
    expect(equal.map((d) => d.delta)).toEqual([0, 0]);
  });

  it('reset di stagione e leghe', () => {
    expect(seasonResetRating(1700)).toBe(1600);
    expect(seasonResetRating(1300)).toBe(1400);
    expect([1399.9, 1400, 1799, 1800, 2000].map(leagueFor)).toEqual(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']);
  });
});
