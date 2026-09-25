/**
 * Formula V1 proposta (§14.2): Elo pairwise sul piazzamento multiplayer, K=24 uguale per tutti.
 * Usa esclusivamente i rating pre-match; nessun aggiornamento in cascata. I rating restano
 * decimali: l'arrotondamento è solo di visualizzazione.
 */
export const INITIAL_RATING = 1500;
export const K_FACTOR = 24;
export const PROVISIONAL_GAMES = 20;

export interface RatedPlacement {
  readonly principalId: string;
  readonly ratingBefore: number;
  /** 1 = primo. Piazzamenti uguali = pareggio. */
  readonly place: number;
}

export interface RatingDelta {
  readonly principalId: string;
  readonly before: number;
  readonly delta: number;
  readonly after: number;
}

export function computeRatingDeltas(players: readonly RatedPlacement[], k: number = K_FACTOR): RatingDelta[] {
  const n = players.length;
  if (n < 2) throw new Error('Servono almeno due giocatori');
  if (new Set(players.map((p) => p.principalId)).size !== n) throw new Error('principalId duplicati');
  return players.map((i) => {
    let sum = 0;
    for (const j of players) {
      if (j === i) continue;
      const expected = 1 / (1 + 10 ** ((j.ratingBefore - i.ratingBefore) / 400));
      const score = i.place < j.place ? 1 : i.place > j.place ? 0 : 0.5;
      sum += score - expected;
    }
    const delta = (k / (n - 1)) * sum;
    return { principalId: i.principalId, before: i.ratingBefore, delta, after: i.ratingBefore + delta };
  });
}

/** Reset di stagione proposto (§14.3). */
export const seasonResetRating = (previous: number): number => INITIAL_RATING + 0.5 * (previous - INITIAL_RATING);

export type League = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
export function leagueFor(rating: number): League {
  if (rating < 1400) return 'BRONZE';
  if (rating < 1600) return 'SILVER';
  if (rating < 1800) return 'GOLD';
  if (rating < 2000) return 'PLATINUM';
  return 'DIAMOND';
}
