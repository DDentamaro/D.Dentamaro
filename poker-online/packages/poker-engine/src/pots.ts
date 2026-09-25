import type { Chips } from './chips.js';

export interface ContributionEntry {
  readonly seatId: string;
  /** Contribuzione totale alla mano (non solo alla street). */
  readonly contribution: Chips;
  readonly folded: boolean;
}

export interface Pot {
  readonly amount: Chips;
  /** Seat che possono vincere il piatto, nell'ordine di input (orario dal tavolo). */
  readonly eligibleSeatIds: readonly string[];
}

export interface PotBreakdown {
  /** Quota non chiamata restituita al maggior contributore prima dell'assegnazione (§6.5). */
  readonly uncalled: { readonly seatId: string; readonly amount: Chips } | null;
  readonly pots: readonly Pot[];
}

/**
 * Calcolo di main pot e side pot per livelli di contribuzione (§6.5).
 * Il denaro dei folded contribuisce ma questi non sono eleggibili.
 * Piatti adiacenti con lo stesso insieme di eleggibili vengono uniti.
 */
export function computePots(entries: readonly ContributionEntry[]): PotBreakdown {
  const contributions = new Map<string, Chips>(entries.map((e) => [e.seatId, e.contribution]));

  let uncalled: PotBreakdown['uncalled'] = null;
  const sorted = [...entries].sort((a, b) => (a.contribution === b.contribution ? 0 : a.contribution > b.contribution ? -1 : 1));
  const top = sorted[0];
  if (top !== undefined && top.contribution > 0n) {
    const second = sorted[1]?.contribution ?? 0n;
    if (top.contribution > second) {
      uncalled = { seatId: top.seatId, amount: top.contribution - second };
      contributions.set(top.seatId, second);
    }
  }

  const levels = [...new Set([...contributions.values()].filter((c) => c > 0n))].sort((a, b) =>
    a === b ? 0 : a < b ? -1 : 1,
  );

  const pots: { amount: Chips; eligibleSeatIds: string[] }[] = [];
  let previous = 0n;
  for (const level of levels) {
    const contributors = entries.filter((e) => contributions.get(e.seatId)! >= level);
    const amount = (level - previous) * BigInt(contributors.length);
    const eligibleSeatIds = contributors.filter((e) => !e.folded).map((e) => e.seatId);
    previous = level;

    const last = pots[pots.length - 1];
    if (last !== undefined && (eligibleSeatIds.length === 0 || sameIds(last.eligibleSeatIds, eligibleSeatIds))) {
      // Stessi eleggibili, oppure livello senza eleggibili: confluisce nel piatto precedente.
      last.amount += amount;
    } else {
      pots.push({ amount, eligibleSeatIds });
    }
  }
  return { uncalled, pots };
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/**
 * Divide un piatto tra vincitori a pari merito. `winnersInOddChipOrder` deve essere ordinato in senso
 * orario a partire dal primo posto a sinistra del button: le fiches dispari vanno una per volta in
 * quest'ordine (§6.5). Nessuna fiche viene persa.
 */
export function splitPot(amount: Chips, winnersInOddChipOrder: readonly string[]): { seatId: string; amount: Chips }[] {
  const n = BigInt(winnersInOddChipOrder.length);
  if (n === 0n) throw new Error('splitPot senza vincitori');
  const share = amount / n;
  let remainder = amount % n;
  return winnersInOddChipOrder.map((seatId) => {
    const extra = remainder > 0n ? 1n : 0n;
    remainder -= extra;
    return { seatId, amount: share + extra };
  });
}
