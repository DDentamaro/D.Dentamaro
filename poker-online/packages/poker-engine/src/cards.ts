/**
 * Mapping stabile delle carte (§6.1): `card = rank * 4 + suit`, valori 0..51.
 * rank: 0 = 2, 1 = 3, …, 8 = T, 9 = J, 10 = Q, 11 = K, 12 = A.
 * suit: 0 = c (fiori), 1 = d (quadri), 2 = h (cuori), 3 = s (picche).
 * Questo mapping fa parte del contratto: cambiarlo richiede una nuova rulesVersion.
 */
export type Card = number;

export const RANK_CHARS = '23456789TJQKA';
export const SUIT_CHARS = 'cdhs';
export const DECK_SIZE = 52;

export const rankOf = (card: Card): number => card >> 2;
export const suitOf = (card: Card): number => card & 3;
export const makeCard = (rank: number, suit: number): Card => rank * 4 + suit;

export function isCard(value: unknown): value is Card {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < DECK_SIZE;
}

export function cardFromString(text: string): Card {
  if (text.length !== 2) throw new Error(`Carta non valida: "${text}"`);
  const rank = RANK_CHARS.indexOf(text[0]!.toUpperCase());
  const suit = SUIT_CHARS.indexOf(text[1]!.toLowerCase());
  if (rank < 0 || suit < 0) throw new Error(`Carta non valida: "${text}"`);
  return makeCard(rank, suit);
}

export function cardToString(card: Card): string {
  if (!isCard(card)) throw new Error(`Carta fuori intervallo: ${String(card)}`);
  return RANK_CHARS[rankOf(card)]! + SUIT_CHARS[suitOf(card)]!;
}

/** "As Kd 7h" → [Card, Card, Card] */
export function parseCards(text: string): Card[] {
  return text.trim().split(/\s+/).filter(Boolean).map(cardFromString);
}

export function formatCards(cards: readonly Card[]): string {
  return cards.map(cardToString).join(' ');
}

/** Mazzo ordinato 0..51. Il mescolamento è responsabilità del server (§7), non del motore. */
export function orderedDeck(): Card[] {
  return Array.from({ length: DECK_SIZE }, (_, i) => i);
}

/** Verifica che il mazzo sia una permutazione completa di 52 carte distinte. */
export function isValidDeck(deck: readonly Card[]): boolean {
  if (deck.length !== DECK_SIZE) return false;
  const seen = new Set<number>();
  for (const card of deck) {
    if (!isCard(card) || seen.has(card)) return false;
    seen.add(card);
  }
  return true;
}
