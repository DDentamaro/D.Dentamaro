import type { Card } from './cards.js';
import type { Chips } from './chips.js';
import {
  type HandResult,
  type HandState,
  type HandStatus,
  type LegalActions,
  type SeatStatus,
  type Street,
  legalActions,
} from './engine.js';
import type { HandCategory } from './evaluator.js';

export interface ViewerContext {
  /** Seat dello spettatore, se partecipa alla mano; null per un osservatore senza carte. */
  readonly seatId: string | null;
}

export interface SeatView {
  readonly seatId: string;
  readonly stack: Chips;
  readonly streetContribution: Chips;
  readonly handContribution: Chips;
  readonly status: SeatStatus;
  readonly hasCards: boolean;
  /** Presenti solo per il proprio seat o se rivelate allo showdown; altrimenti null. */
  readonly holeCards: readonly Card[] | null;
}

export interface ResultView {
  readonly kind: HandResult['kind'];
  readonly uncalled: { readonly seatId: string; readonly amount: Chips } | null;
  readonly pots: readonly { readonly amount: Chips; readonly eligibleSeatIds: readonly string[] }[];
  readonly awards: readonly { readonly potIndex: number; readonly amount: Chips; readonly winners: readonly { readonly seatId: string; readonly amount: Chips }[] }[];
  readonly showdown: readonly { readonly seatId: string; readonly holeCards: readonly Card[]; readonly category: HandCategory; readonly bestCards: readonly Card[] }[] | null;
}

export interface PlayerView {
  readonly matchId: string;
  readonly handId: string;
  readonly handNumber: number;
  readonly rulesVersion: number;
  readonly status: HandStatus;
  readonly street: Street;
  readonly board: readonly Card[];
  readonly buttonSeatId: string;
  readonly smallBlindSeatId: string;
  readonly bigBlindSeatId: string;
  readonly smallBlind: Chips;
  readonly bigBlind: Chips;
  readonly currentBet: Chips;
  readonly potTotal: Chips;
  readonly seats: readonly SeatView[];
  readonly actorSeatId: string | null;
  readonly turnId: string | null;
  /** Solo per lo spettatore che è l'attore corrente. */
  readonly legalActions: LegalActions | null;
  readonly result: ResultView | null;
}

/**
 * Proiezione autorizzata per un destinatario (§11.6). Costruita per allowlist campo per campo:
 * mazzo, burn e carte nascoste altrui sono assenti, non offuscati.
 */
export function project(state: HandState, viewer: ViewerContext): PlayerView {
  const revealed = new Map<string, readonly Card[]>(
    (state.result?.showdown ?? []).map((entry) => [entry.seatId, entry.holeCards]),
  );
  const seats: SeatView[] = state.seats.map((seat) => {
    const own = viewer.seatId !== null && seat.seatId === viewer.seatId;
    const cards = own ? seat.holeCards : revealed.get(seat.seatId);
    return {
      seatId: seat.seatId,
      stack: seat.stack,
      streetContribution: seat.streetContribution,
      handContribution: seat.handContribution,
      status: seat.status,
      hasCards: seat.status !== 'FOLDED',
      holeCards: cards === undefined ? null : [...cards],
    };
  });

  const result = state.result;
  const potTotal = state.seats.reduce((acc, s) => acc + s.handContribution, 0n);
  return {
    matchId: state.matchId,
    handId: state.handId,
    handNumber: state.handNumber,
    rulesVersion: state.rulesVersion,
    status: state.status,
    street: state.street,
    board: [...state.board],
    buttonSeatId: state.buttonSeatId,
    smallBlindSeatId: state.smallBlindSeatId,
    bigBlindSeatId: state.bigBlindSeatId,
    smallBlind: state.smallBlind,
    bigBlind: state.bigBlind,
    currentBet: state.currentBet,
    potTotal,
    seats,
    actorSeatId: state.actorSeatId,
    turnId: state.turnId,
    legalActions: viewer.seatId === null ? null : legalActions(state, viewer.seatId),
    result:
      result === null
        ? null
        : {
            kind: result.kind,
            uncalled: result.uncalled === null ? null : { ...result.uncalled },
            pots: result.pots.map((p) => ({ amount: p.amount, eligibleSeatIds: [...p.eligibleSeatIds] })),
            awards: result.awards.map((a) => ({
              potIndex: a.potIndex,
              amount: a.amount,
              winners: a.winners.map((w) => ({ seatId: w.seatId, amount: w.amount })),
            })),
            showdown:
              result.showdown === null
                ? null
                : result.showdown.map((e) => ({
                    seatId: e.seatId,
                    holeCards: [...e.holeCards],
                    category: e.hand.category,
                    bestCards: [...e.hand.cards],
                  })),
          },
  };
}
