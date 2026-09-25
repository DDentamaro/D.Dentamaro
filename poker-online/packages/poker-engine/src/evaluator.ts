import { type Card, rankOf, suitOf } from './cards.js';

/** Categorie in ordine crescente di forza. */
export const HandCategory = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
} as const;
export type HandCategory = (typeof HandCategory)[keyof typeof HandCategory];

export const HAND_CATEGORY_NAMES: Record<HandCategory, string> = {
  0: 'HIGH_CARD',
  1: 'PAIR',
  2: 'TWO_PAIR',
  3: 'THREE_OF_A_KIND',
  4: 'STRAIGHT',
  5: 'FLUSH',
  6: 'FULL_HOUSE',
  7: 'FOUR_OF_A_KIND',
  8: 'STRAIGHT_FLUSH',
};

export interface HandValue {
  readonly category: HandCategory;
  /** Rank (0..12) rilevanti per lo spareggio, in ordine di importanza. */
  readonly tiebreak: readonly number[];
  /** Ordinamento totale: punteggio maggiore = mano migliore; uguale = parità. Il seme non rompe parità. */
  readonly score: number;
  /** Le cinque carte che compongono la mano migliore. */
  readonly cards: readonly Card[];
}

const BASE = 13;

function scoreOf(category: number, tiebreak: readonly number[]): number {
  let score = category;
  for (let i = 0; i < 5; i++) score = score * BASE + (tiebreak[i] ?? 0);
  return score;
}

/** Valuta esattamente cinque carte. */
export function evaluateFive(cards: readonly Card[]): HandValue {
  if (cards.length !== 5) throw new Error('evaluateFive richiede 5 carte');
  const ranks = cards.map(rankOf).sort((a, b) => b - a);
  const flush = cards.every((c) => suitOf(c) === suitOf(cards[0]!));

  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  // Gruppi ordinati per molteplicità decrescente, poi rank decrescente.
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  let straightHigh = -1;
  if (counts.size === 5) {
    if (ranks[0]! - ranks[4]! === 4) straightHigh = ranks[0]!;
    // Ruota A-2-3-4-5: l'Asso vale basso, la scala è "al 5".
    else if (ranks[0] === 12 && ranks[1] === 3) straightHigh = 3;
  }

  let category: HandCategory;
  let tiebreak: number[];
  if (straightHigh >= 0 && flush) {
    category = HandCategory.STRAIGHT_FLUSH;
    tiebreak = [straightHigh];
  } else if (groups[0]![1] === 4) {
    category = HandCategory.FOUR_OF_A_KIND;
    tiebreak = [groups[0]![0], groups[1]![0]];
  } else if (groups[0]![1] === 3 && groups[1]![1] === 2) {
    category = HandCategory.FULL_HOUSE;
    tiebreak = [groups[0]![0], groups[1]![0]];
  } else if (flush) {
    category = HandCategory.FLUSH;
    tiebreak = ranks;
  } else if (straightHigh >= 0) {
    category = HandCategory.STRAIGHT;
    tiebreak = [straightHigh];
  } else if (groups[0]![1] === 3) {
    category = HandCategory.THREE_OF_A_KIND;
    tiebreak = groups.map((g) => g[0]);
  } else if (groups[0]![1] === 2 && groups[1]![1] === 2) {
    category = HandCategory.TWO_PAIR;
    tiebreak = groups.map((g) => g[0]);
  } else if (groups[0]![1] === 2) {
    category = HandCategory.PAIR;
    tiebreak = groups.map((g) => g[0]);
  } else {
    category = HandCategory.HIGH_CARD;
    tiebreak = ranks;
  }
  return { category, tiebreak, score: scoreOf(category, tiebreak), cards: [...cards] };
}

/** Migliore combinazione di cinque carte fra quelle date (5..7 carte). */
export function evaluateBestOf(cards: readonly Card[]): HandValue {
  const n = cards.length;
  if (n < 5 || n > 7) throw new Error('evaluateBestOf richiede da 5 a 7 carte');
  let best: HandValue | null = null;
  const pick: Card[] = [];
  const rec = (start: number): void => {
    if (pick.length === 5) {
      const value = evaluateFive(pick);
      if (best === null || value.score > best.score) best = value;
      return;
    }
    for (let i = start; i <= n - (5 - pick.length); i++) {
      pick.push(cards[i]!);
      rec(i + 1);
      pick.pop();
    }
  };
  rec(0);
  return best!;
}

/**
 * Hold'em (§6.6): migliore mano di cinque carte tra sette, usando zero, una o due hole cards.
 * Non utilizzabile per Omaha, che richiede esattamente due carte personali e tre del board (§6.7).
 */
export function evaluateHoldem(hole: readonly Card[], board: readonly Card[]): HandValue {
  if (hole.length !== 2) throw new Error("Hold'em richiede 2 hole cards");
  return evaluateBestOf([...hole, ...board]);
}

export function compareHands(a: HandValue, b: HandValue): number {
  return a.score - b.score;
}
