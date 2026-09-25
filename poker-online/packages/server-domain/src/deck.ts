import { randomInt } from 'node:crypto';
import { type Card, orderedDeck } from '@poker/poker-engine';

/** Restituisce un intero uniforme in [0, maxExclusive). */
export type UniformIntSource = (maxExclusive: number) => number;

/** Sorgente di produzione: CSPRNG del runtime (§7). Mai Math.random né seed basati sull'ora. */
export const cryptoIntSource: UniformIntSource = (maxExclusive) => randomInt(maxExclusive);

/**
 * Fisher–Yates su 52 carte con interi uniformi. La casualità resta fuori dal motore:
 * il mazzo risultante è persistito cifrato prima di distribuire le prime carte (§7).
 */
export function shuffleDeck(source: UniformIntSource = cryptoIntSource): Card[] {
  const deck = orderedDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = source(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i) throw new Error('Sorgente casuale fuori intervallo');
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck;
}
