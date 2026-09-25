/**
 * Rotazione del button tra una mano e la successiva (§6.3). Decisione documentata in ADR-012.
 *
 * - Con tre o più giocatori in gioco: moving button, il button passa al primo seat in gioco
 *   a sinistra del button precedente (anche se quest'ultimo è stato eliminato).
 * - Heads-up: si fa avanzare il big blind al primo seat in gioco a sinistra del BB precedente;
 *   l'altro giocatore è button e small blind. Così nel passaggio 3→2 nessuno paga il big blind
 *   due volte di fila, qualunque sia la posizione del giocatore eliminato.
 */
export interface NextButtonInput {
  /** Tutti i seat del tavolo in ordine orario, compresi quelli eliminati. */
  readonly seatOrder: readonly string[];
  /** Seat ancora in gioco nella prossima mano (stack > 0). */
  readonly inPlaySeatIds: readonly string[];
  readonly previousButtonSeatId: string;
  readonly previousBigBlindSeatId: string;
}

export function nextButtonSeat(input: NextButtonInput): string {
  const inPlay = new Set(input.inPlaySeatIds);
  if (inPlay.size < 2) throw new Error('Servono almeno due seat in gioco');
  const nextInPlayAfter = (seatId: string): string => {
    const start = input.seatOrder.indexOf(seatId);
    if (start < 0) throw new Error(`Seat sconosciuto: ${seatId}`);
    for (let k = 1; k <= input.seatOrder.length; k++) {
      const candidate = input.seatOrder[(start + k) % input.seatOrder.length]!;
      if (inPlay.has(candidate)) return candidate;
    }
    throw new Error('Nessun seat in gioco');
  };

  if (inPlay.size === 2) {
    const bigBlind = nextInPlayAfter(input.previousBigBlindSeatId);
    return [...inPlay].find((id) => id !== bigBlind)!;
  }
  return nextInPlayAfter(input.previousButtonSeatId);
}
