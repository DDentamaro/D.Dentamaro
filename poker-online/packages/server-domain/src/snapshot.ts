import {
  type Card,
  type Chips,
  HAND_CATEGORY_NAMES,
  type PlayerView,
  cardToString,
} from '@poker/poker-engine';
import { PROTOCOL_VERSION } from '@poker/contracts';

export type MatchStatus = 'FORMING' | 'READY_CHECK' | 'RUNNING' | 'PAUSED' | 'FINISHING' | 'COMPLETED' | 'CANCELLED' | 'ABORTED';

export interface SnapshotMeta {
  readonly matchId: string;
  readonly stateVersion: bigint;
  readonly serverTime: Date;
  readonly matchStatus: MatchStatus;
  readonly modeId: string;
  readonly rulesVersion: number;
  readonly turnDeadline: Date | null;
}

const chips = (value: Chips): string => value.toString(10);
const cards = (list: readonly Card[]): string[] => list.map(cardToString);

/**
 * DTO wire di `match.snapshot` (§11.6). Costruito campo per campo dalla proiezione già filtrata
 * per destinatario: nessuno spread di oggetti di dominio, fiches come stringhe decimali.
 */
export function toTableSnapshot(meta: SnapshotMeta, view: PlayerView | null): Record<string, unknown> {
  return {
    protocolVersion: PROTOCOL_VERSION,
    type: 'match.snapshot',
    matchId: meta.matchId,
    stateVersion: meta.stateVersion.toString(10),
    serverTime: meta.serverTime.toISOString(),
    matchStatus: meta.matchStatus,
    modeId: meta.modeId,
    rulesVersion: meta.rulesVersion,
    hand:
      view === null
        ? null
        : {
            handId: view.handId,
            handNumber: view.handNumber,
            status: view.status,
            street: view.street,
            board: cards(view.board),
            buttonSeatId: view.buttonSeatId,
            smallBlindSeatId: view.smallBlindSeatId,
            bigBlindSeatId: view.bigBlindSeatId,
            smallBlind: chips(view.smallBlind),
            bigBlind: chips(view.bigBlind),
            currentBet: chips(view.currentBet),
            potTotal: chips(view.potTotal),
            seats: view.seats.map((s) => ({
              seatId: s.seatId,
              stack: chips(s.stack),
              streetContribution: chips(s.streetContribution),
              handContribution: chips(s.handContribution),
              status: s.status,
              hasCards: s.hasCards,
              holeCards: s.holeCards === null ? null : cards(s.holeCards),
            })),
            actorSeatId: view.actorSeatId,
            turnId: view.turnId,
            turnDeadline: view.status === 'BETTING' && meta.turnDeadline !== null ? meta.turnDeadline.toISOString() : null,
            legalActions:
              view.legalActions === null
                ? null
                : {
                    canFold: view.legalActions.canFold,
                    canCheck: view.legalActions.canCheck,
                    canCall: view.legalActions.canCall,
                    callAmount: chips(view.legalActions.callAmount),
                    canRaise: view.legalActions.canRaise,
                    minRaiseTo: view.legalActions.minRaiseTo === null ? null : chips(view.legalActions.minRaiseTo),
                    maxRaiseTo: view.legalActions.maxRaiseTo === null ? null : chips(view.legalActions.maxRaiseTo),
                    allInOnly: view.legalActions.allInOnly,
                  },
            result:
              view.result === null
                ? null
                : {
                    kind: view.result.kind,
                    uncalled:
                      view.result.uncalled === null
                        ? null
                        : { seatId: view.result.uncalled.seatId, amount: chips(view.result.uncalled.amount) },
                    awards: view.result.awards.map((a) => ({
                      potIndex: a.potIndex,
                      amount: chips(a.amount),
                      winners: a.winners.map((w) => ({ seatId: w.seatId, amount: chips(w.amount) })),
                    })),
                    showdown:
                      view.result.showdown === null
                        ? null
                        : view.result.showdown.map((e) => ({
                            seatId: e.seatId,
                            holeCards: cards(e.holeCards),
                            category: HAND_CATEGORY_NAMES[e.category],
                            bestCards: cards(e.bestCards),
                          })),
                  },
          },
  };
}
