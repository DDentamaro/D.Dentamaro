import { type Card, rankOf, suitOf } from '../src/cards.js';

/**
 * Oracle indipendente (§6.6, §20.3): valuta direttamente 5..7 carte per conteggi,
 * senza enumerare combinazioni e senza condividere codice con l'evaluator.
 * Restituisce [categoria, ...spareggi].
 */
export function oracleEvaluate(cards: readonly Card[]): number[] {
  const bySuit: number[][] = [[], [], [], []];
  const count = new Array<number>(13).fill(0);
  for (const c of cards) {
    bySuit[suitOf(c)]!.push(rankOf(c));
    count[rankOf(c)]! += 1;
  }
  const straightHigh = (rankSet: Set<number>): number => {
    for (let high = 12; high >= 4; high--) {
      let ok = true;
      for (let k = 0; k < 5; k++) if (!rankSet.has(high - k)) ok = false;
      if (ok) return high;
    }
    if ([12, 0, 1, 2, 3].every((r) => rankSet.has(r))) return 3;
    return -1;
  };
  const desc = (rs: Iterable<number>): number[] => [...rs].sort((a, b) => b - a);

  const flushSuit = bySuit.find((s) => s.length >= 5);
  if (flushSuit) {
    const sf = straightHigh(new Set(flushSuit));
    if (sf >= 0) return [8, sf];
  }
  const ranksWith = (n: number): number[] => desc(count.flatMap((c, r) => (c >= n ? [r] : [])));
  const exactly = (n: number): number[] => desc(count.flatMap((c, r) => (c === n ? [r] : [])));
  const kickers = (exclude: number[], n: number): number[] =>
    desc(count.flatMap((c, r) => (c > 0 && !exclude.includes(r) ? [r] : []))).slice(0, n);

  const quads = ranksWith(4);
  if (quads.length > 0) return [7, quads[0]!, ...kickers([quads[0]!], 1)];

  const trips = ranksWith(3);
  if (trips.length > 0) {
    const pairCandidates = ranksWith(2).filter((r) => r !== trips[0]);
    if (pairCandidates.length > 0) return [6, trips[0]!, pairCandidates[0]!];
  }
  if (flushSuit) return [5, ...desc(flushSuit).slice(0, 5)];

  const st = straightHigh(new Set(cards.map(rankOf)));
  if (st >= 0) return [4, st];

  if (trips.length > 0) return [3, trips[0]!, ...kickers([trips[0]!], 2)];
  const pairs = exactly(2);
  if (pairs.length >= 2) return [2, pairs[0]!, pairs[1]!, ...kickers([pairs[0]!, pairs[1]!], 1)];
  if (pairs.length === 1) return [1, pairs[0]!, ...kickers([pairs[0]!], 3)];
  return [0, ...kickers([], 5)];
}
