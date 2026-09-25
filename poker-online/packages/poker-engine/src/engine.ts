import { type Card, isValidDeck } from './cards.js';
import { type Chips, maxChips, minChips } from './chips.js';
import { type HandValue, evaluateHoldem } from './evaluator.js';
import { type Pot, computePots, splitPot } from './pots.js';

export const ENGINE_VERSION = 1;
export const NLHE_RULES_VERSION = 1;

export type Street = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER';
export type SeatStatus = 'ACTIVE' | 'FOLDED' | 'ALL_IN';
export type HandStatus = 'BETTING' | 'COMPLETE';

/**
 * Azioni del giocatore (§6.4). `RAISE_TO` esprime il totale investito nella street.
 * Un all-in è un CALL o un RAISE_TO che esaurisce lo stack, non un comando separato.
 */
export type Action =
  | { readonly kind: 'FOLD' }
  | { readonly kind: 'CHECK' }
  | { readonly kind: 'CALL' }
  | { readonly kind: 'RAISE_TO'; readonly streetTotal: Chips };

export interface StartHandInput {
  readonly matchId: string;
  readonly handId: string;
  readonly handNumber: number;
  /** Seat in gioco (stack > 0) in ordine orario al tavolo. */
  readonly seats: readonly { readonly seatId: string; readonly stack: Chips }[];
  readonly buttonSeatId: string;
  readonly smallBlind: Chips;
  readonly bigBlind: Chips;
  /** Mazzo già mescolato dal server con CSPRNG (§7): permutazione di 52 carte. */
  readonly deck: readonly Card[];
}

export interface SeatState {
  readonly seatId: string;
  readonly startingStack: Chips;
  /** Fiches dietro, non ancora investite. */
  stack: Chips;
  streetContribution: Chips;
  handContribution: Chips;
  status: SeatStatus;
  holeCards: Card[];
  /**
   * Livello di puntata (currentBet) al momento dell'ultima azione volontaria in questa street.
   * null = non ha ancora agito. Serve alla regola cumulativa di riapertura del rilancio (§6.4).
   */
  actedAtLevel: Chips | null;
}

export interface PotAward {
  readonly potIndex: number;
  readonly amount: Chips;
  readonly winners: readonly { readonly seatId: string; readonly amount: Chips }[];
}

export interface ShowdownEntry {
  readonly seatId: string;
  readonly holeCards: readonly Card[];
  readonly hand: HandValue;
}

export interface HandResult {
  readonly kind: 'UNCONTESTED' | 'SHOWDOWN';
  readonly uncalled: { readonly seatId: string; readonly amount: Chips } | null;
  readonly pots: readonly Pot[];
  readonly awards: readonly PotAward[];
  /** Solo i contendenti non folded arrivati allo showdown; null se vittoria uncontested. */
  readonly showdown: readonly ShowdownEntry[] | null;
  /** Fiches ricevute dai piatti (escluso il rimborso non chiamato). */
  readonly payouts: Readonly<Record<string, Chips>>;
  readonly finalStacks: Readonly<Record<string, Chips>>;
}

export interface HandState {
  readonly matchId: string;
  readonly handId: string;
  readonly handNumber: number;
  readonly engineVersion: number;
  readonly rulesVersion: number;
  readonly smallBlind: Chips;
  readonly bigBlind: Chips;
  readonly buttonSeatId: string;
  readonly smallBlindSeatId: string;
  readonly bigBlindSeatId: string;
  seats: SeatState[];
  street: Street;
  board: Card[];
  burns: Card[];
  /** Porzione segreta: mazzo completo e indice delle carte consumate. */
  deck: Card[];
  deckIndex: number;
  currentBet: Chips;
  lastFullRaiseSize: Chips;
  /** Seat che devono ancora rispondere all'ultima puntata pertinente. */
  pendingSeatIds: string[];
  actorSeatId: string | null;
  turnSeq: number;
  turnId: string | null;
  status: HandStatus;
  result: HandResult | null;
}

export interface LegalActions {
  readonly canFold: boolean;
  readonly canCheck: boolean;
  readonly canCall: boolean;
  /** Importo effettivo che il call aggiunge (eventualmente all-in parziale). */
  readonly callAmount: Chips;
  readonly canRaise: boolean;
  readonly minRaiseTo: Chips | null;
  readonly maxRaiseTo: Chips | null;
  /** Il solo rilancio possibile è l'all-in (inferiore al minimo completo). */
  readonly allInOnly: boolean;
}

export type DomainEvent =
  | { type: 'HAND_STARTED'; handId: string; buttonSeatId: string; smallBlindSeatId: string; bigBlindSeatId: string }
  | { type: 'BLIND_POSTED'; seatId: string; blind: 'SMALL' | 'BIG'; amount: Chips }
  | { type: 'HOLE_CARDS_DEALT'; seatId: string }
  | { type: 'TURN_STARTED'; seatId: string; turnId: string }
  | { type: 'ACTION_APPLIED'; seatId: string; action: Action; source: 'PLAYER' | 'TIMEOUT'; amountAdded: Chips; allIn: boolean }
  | { type: 'STREET_DEALT'; street: Street; cards: Card[] }
  | { type: 'UNCALLED_RETURNED'; seatId: string; amount: Chips }
  | { type: 'SHOWDOWN'; entries: ShowdownEntry[] }
  | { type: 'POT_AWARDED'; potIndex: number; amount: Chips; winners: { seatId: string; amount: Chips }[] }
  | { type: 'HAND_COMPLETED'; kind: HandResult['kind'] };

export type EngineErrorCode = 'INVALID_INPUT' | 'HAND_COMPLETE' | 'NOT_YOUR_TURN' | 'STALE_TURN' | 'ILLEGAL_ACTION';

export type Transition =
  | { readonly ok: true; readonly state: HandState; readonly events: readonly DomainEvent[] }
  | { readonly ok: false; readonly code: EngineErrorCode; readonly message: string };

const fail = (code: EngineErrorCode, message: string): Transition => ({ ok: false, code, message });

// ---------------------------------------------------------------------------------------------
// API pubblica
// ---------------------------------------------------------------------------------------------

export function startHand(input: StartHandInput): Transition {
  const error = validateStartInput(input);
  if (error !== null) return fail('INVALID_INPUT', error);

  const n = input.seats.length;
  const buttonIndex = input.seats.findIndex((s) => s.seatId === input.buttonSeatId);
  // Heads-up: il button paga lo small blind (§6.3).
  const sbIndex = n === 2 ? buttonIndex : (buttonIndex + 1) % n;
  const bbIndex = (sbIndex + 1) % n;

  const state: HandState = {
    matchId: input.matchId,
    handId: input.handId,
    handNumber: input.handNumber,
    engineVersion: ENGINE_VERSION,
    rulesVersion: NLHE_RULES_VERSION,
    smallBlind: input.smallBlind,
    bigBlind: input.bigBlind,
    buttonSeatId: input.buttonSeatId,
    smallBlindSeatId: input.seats[sbIndex]!.seatId,
    bigBlindSeatId: input.seats[bbIndex]!.seatId,
    seats: input.seats.map((s) => ({
      seatId: s.seatId,
      startingStack: s.stack,
      stack: s.stack,
      streetContribution: 0n,
      handContribution: 0n,
      status: 'ACTIVE',
      holeCards: [],
      actedAtLevel: null,
    })),
    street: 'PREFLOP',
    board: [],
    burns: [],
    deck: [...input.deck],
    deckIndex: 0,
    // Il livello nominale preflop resta il big blind anche se il BB è incompleto (§6.4).
    currentBet: input.bigBlind,
    lastFullRaiseSize: input.bigBlind,
    pendingSeatIds: [],
    actorSeatId: null,
    turnSeq: 0,
    turnId: null,
    status: 'BETTING',
    result: null,
  };
  const events: DomainEvent[] = [
    {
      type: 'HAND_STARTED',
      handId: state.handId,
      buttonSeatId: state.buttonSeatId,
      smallBlindSeatId: state.smallBlindSeatId,
      bigBlindSeatId: state.bigBlindSeatId,
    },
  ];

  const sb = state.seats[sbIndex]!;
  const bb = state.seats[bbIndex]!;
  events.push({ type: 'BLIND_POSTED', seatId: sb.seatId, blind: 'SMALL', amount: commit(sb, minChips(sb.stack, input.smallBlind)) });
  events.push({ type: 'BLIND_POSTED', seatId: bb.seatId, blind: 'BIG', amount: commit(bb, minChips(bb.stack, input.bigBlind)) });

  // Due carte a testa, una alla volta, partendo a sinistra del button.
  for (let round = 0; round < 2; round++) {
    for (let k = 1; k <= n; k++) {
      state.seats[(buttonIndex + k) % n]!.holeCards.push(draw(state));
    }
  }
  for (const seat of state.seats) events.push({ type: 'HOLE_CARDS_DEALT', seatId: seat.seatId });

  state.pendingSeatIds = state.seats.filter((s) => s.status === 'ACTIVE').map((s) => s.seatId);
  // Preflop: primo attore a sinistra del big blind (in heads-up è il button).
  advance(state, events, bbIndex);
  return { ok: true, state, events };
}

export function legalActions(state: HandState, seatId: string): LegalActions | null {
  if (state.status !== 'BETTING' || state.actorSeatId !== seatId) return null;
  const seat = findSeat(state, seatId);
  if (seat === undefined || seat.status !== 'ACTIVE') return null;

  const owed = state.currentBet > seat.streetContribution ? state.currentBet - seat.streetContribution : 0n;
  const callAmount = minChips(owed, seat.stack);
  const othersCanRespond = state.seats.some((s) => s.seatId !== seatId && s.status === 'ACTIVE');
  const hasRaiseRight =
    seat.actedAtLevel === null || state.currentBet - seat.actedAtLevel >= state.lastFullRaiseSize;
  const maxRaiseTo = seat.streetContribution + seat.stack;
  const canRaise = othersCanRespond && hasRaiseRight && maxRaiseTo > state.currentBet;

  let minRaiseTo: Chips | null = null;
  let allInOnly = false;
  if (canRaise) {
    minRaiseTo = state.currentBet + state.lastFullRaiseSize;
    if (maxRaiseTo < minRaiseTo) {
      minRaiseTo = maxRaiseTo;
      allInOnly = true;
    }
  }
  return {
    canFold: true,
    canCheck: owed === 0n,
    canCall: owed > 0n,
    callAmount,
    canRaise,
    minRaiseTo,
    maxRaiseTo: canRaise ? maxRaiseTo : null,
    allInOnly,
  };
}

export function applyAction(state: HandState, seatId: string, action: Action): Transition {
  return apply(state, seatId, action, 'PLAYER');
}

/** Timeout del turno (§8.4): check se lecito, altrimenti fold. */
export function applyTimeout(state: HandState, turnId: string): Transition {
  if (state.status !== 'BETTING') return fail('HAND_COMPLETE', 'La mano è conclusa');
  if (state.turnId !== turnId || state.actorSeatId === null) return fail('STALE_TURN', 'Turno non più corrente');
  const legal = legalActions(state, state.actorSeatId)!;
  return apply(state, state.actorSeatId, legal.canCheck ? { kind: 'CHECK' } : { kind: 'FOLD' }, 'TIMEOUT');
}

// ---------------------------------------------------------------------------------------------
// Implementazione
// ---------------------------------------------------------------------------------------------

function apply(input: HandState, seatId: string, action: Action, source: 'PLAYER' | 'TIMEOUT'): Transition {
  if (input.status !== 'BETTING') return fail('HAND_COMPLETE', 'La mano è conclusa');
  if (input.actorSeatId !== seatId) return fail('NOT_YOUR_TURN', 'Non è il turno di questo seat');
  const legal = legalActions(input, seatId);
  if (legal === null) return fail('NOT_YOUR_TURN', 'Il seat non può agire');

  const state = structuredClone(input);
  const seat = findSeat(state, seatId)!;
  const seatIndex = state.seats.indexOf(seat);
  const events: DomainEvent[] = [];
  let amountAdded = 0n;

  switch (action.kind) {
    case 'FOLD':
      seat.status = 'FOLDED';
      break;
    case 'CHECK':
      if (!legal.canCheck) return fail('ILLEGAL_ACTION', 'Check non consentito: occorre aggiungere fiches');
      seat.actedAtLevel = state.currentBet;
      break;
    case 'CALL':
      if (!legal.canCall) return fail('ILLEGAL_ACTION', 'Nessuna puntata da chiamare');
      amountAdded = commit(seat, legal.callAmount);
      seat.actedAtLevel = state.currentBet;
      break;
    case 'RAISE_TO': {
      const target = action.streetTotal;
      if (typeof target !== 'bigint') return fail('ILLEGAL_ACTION', 'Importo non valido');
      if (!legal.canRaise || legal.minRaiseTo === null || legal.maxRaiseTo === null) {
        return fail('ILLEGAL_ACTION', 'Rilancio non consentito');
      }
      if (target < legal.minRaiseTo || target > legal.maxRaiseTo) {
        return fail('ILLEGAL_ACTION', `Rilancio fuori intervallo [${legal.minRaiseTo}, ${legal.maxRaiseTo}]`);
      }
      const increment = target - state.currentBet;
      // Solo un rilancio completo aggiorna la dimensione minima e riapre l'azione (§6.4).
      if (increment >= state.lastFullRaiseSize) state.lastFullRaiseSize = increment;
      amountAdded = commit(seat, target - seat.streetContribution);
      state.currentBet = target;
      seat.actedAtLevel = target;
      // Tutti gli altri seat ancora attivi devono rispondere, in ordine orario.
      state.pendingSeatIds = orderedFrom(state, seatIndex + 1)
        .filter((s) => s.seatId !== seatId && s.status === 'ACTIVE')
        .map((s) => s.seatId);
      break;
    }
    default:
      return fail('ILLEGAL_ACTION', 'Tipo di azione sconosciuto');
  }

  state.pendingSeatIds = state.pendingSeatIds.filter((id) => id !== seatId);
  events.push({ type: 'ACTION_APPLIED', seatId, action, source, amountAdded, allIn: seat.status === 'ALL_IN' });
  advance(state, events, seatIndex);
  return { ok: true, state, events };
}

/** Sposta fiches dallo stack alle contribuzioni; imposta ALL_IN se lo stack si esaurisce. */
function commit(seat: SeatState, amount: Chips): Chips {
  if (amount < 0n || amount > seat.stack) throw new Error('Invariante violata: importo non coperto dallo stack');
  seat.stack -= amount;
  seat.streetContribution += amount;
  seat.handContribution += amount;
  if (seat.stack === 0n && seat.status === 'ACTIVE') seat.status = 'ALL_IN';
  return amount;
}

function draw(state: HandState): Card {
  const card = state.deck[state.deckIndex];
  if (card === undefined) throw new Error('Mazzo esaurito');
  state.deckIndex += 1;
  return card;
}

/**
 * Determina il prossimo passo dopo un cambiamento: prossimo attore, chiusura street,
 * runout o conclusione della mano.
 */
function advance(state: HandState, events: DomainEvent[], fromIndex: number): void {
  const contenders = state.seats.filter((s) => s.status !== 'FOLDED');
  if (contenders.length === 1) {
    finish(state, events, 'UNCONTESTED');
    return;
  }

  state.pendingSeatIds = state.pendingSeatIds.filter((id) => findSeat(state, id)!.status === 'ACTIVE');
  const activeCount = state.seats.filter((s) => s.status === 'ACTIVE').length;
  if (activeCount <= 1) {
    // Nessun avversario può coprire ulteriori puntate: resta solo l'eventuale risposta dovuta (§6.3 p.9).
    state.pendingSeatIds = state.pendingSeatIds.filter((id) => {
      const seat = findSeat(state, id)!;
      const highestOther = state.seats
        .filter((s) => s.seatId !== id && s.status !== 'FOLDED')
        .reduce((acc, s) => maxChips(acc, s.streetContribution), 0n);
      return seat.streetContribution < highestOther;
    });
  }

  if (state.pendingSeatIds.length > 0) {
    const next = orderedFrom(state, fromIndex + 1).find((s) => state.pendingSeatIds.includes(s.seatId))!;
    setTurn(state, events, next.seatId);
    return;
  }

  // Street chiusa.
  if (state.street === 'RIVER' || activeCount <= 1) {
    while (state.street !== 'RIVER') dealNextStreet(state, events);
    finish(state, events, 'SHOWDOWN');
    return;
  }
  dealNextStreet(state, events);
  for (const seat of state.seats) {
    seat.streetContribution = 0n;
    seat.actedAtLevel = null;
  }
  state.currentBet = 0n;
  state.lastFullRaiseSize = state.bigBlind;
  state.pendingSeatIds = state.seats.filter((s) => s.status === 'ACTIVE').map((s) => s.seatId);
  // Postflop: primo giocatore attivo a sinistra del button.
  advance(state, events, buttonIndex(state));
}

function setTurn(state: HandState, events: DomainEvent[], seatId: string): void {
  state.turnSeq += 1;
  state.actorSeatId = seatId;
  state.turnId = `${state.handId}:${state.turnSeq}`;
  events.push({ type: 'TURN_STARTED', seatId, turnId: state.turnId });
}

function dealNextStreet(state: HandState, events: DomainEvent[]): void {
  const next: Record<Exclude<Street, 'RIVER'>, [Street, number]> = {
    PREFLOP: ['FLOP', 3],
    FLOP: ['TURN', 1],
    TURN: ['RIVER', 1],
  };
  if (state.street === 'RIVER') throw new Error('Nessuna street dopo il river');
  const [street, count] = next[state.street];
  state.burns.push(draw(state));
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) cards.push(draw(state));
  state.board.push(...cards);
  state.street = street;
  events.push({ type: 'STREET_DEALT', street, cards });
}

function finish(state: HandState, events: DomainEvent[], kind: HandResult['kind']): void {
  state.status = 'COMPLETE';
  state.actorSeatId = null;
  state.turnId = null;
  state.pendingSeatIds = [];

  const { uncalled, pots } = computePots(
    state.seats.map((s) => ({ seatId: s.seatId, contribution: s.handContribution, folded: s.status === 'FOLDED' })),
  );
  if (uncalled !== null) {
    findSeat(state, uncalled.seatId)!.stack += uncalled.amount;
    events.push({ type: 'UNCALLED_RETURNED', seatId: uncalled.seatId, amount: uncalled.amount });
  }

  let showdown: ShowdownEntry[] | null = null;
  const values = new Map<string, HandValue>();
  if (kind === 'SHOWDOWN') {
    // Mostrate le carte di tutti i contendenti non folded; quelle folded restano private (§6.6).
    showdown = state.seats
      .filter((s) => s.status !== 'FOLDED')
      .map((s) => ({ seatId: s.seatId, holeCards: [...s.holeCards], hand: evaluateHoldem(s.holeCards, state.board) }));
    for (const entry of showdown) values.set(entry.seatId, entry.hand);
    events.push({ type: 'SHOWDOWN', entries: showdown });
  }

  const oddChipOrder = orderedFrom(state, buttonIndex(state) + 1).map((s) => s.seatId);
  const payouts: Record<string, Chips> = Object.fromEntries(state.seats.map((s) => [s.seatId, 0n]));
  const awards: PotAward[] = pots.map((pot, potIndex) => {
    let winnerIds: string[];
    if (kind === 'UNCONTESTED') {
      winnerIds = state.seats.filter((s) => s.status !== 'FOLDED').map((s) => s.seatId);
    } else if (pot.eligibleSeatIds.length === 1) {
      winnerIds = [...pot.eligibleSeatIds];
    } else {
      const best = Math.max(...pot.eligibleSeatIds.map((id) => values.get(id)!.score));
      winnerIds = pot.eligibleSeatIds.filter((id) => values.get(id)!.score === best);
    }
    winnerIds.sort((a, b) => oddChipOrder.indexOf(a) - oddChipOrder.indexOf(b));
    const winners = splitPot(pot.amount, winnerIds);
    for (const w of winners) {
      payouts[w.seatId]! += w.amount;
      findSeat(state, w.seatId)!.stack += w.amount;
    }
    events.push({ type: 'POT_AWARDED', potIndex, amount: pot.amount, winners });
    return { potIndex, amount: pot.amount, winners };
  });

  const finalStacks: Record<string, Chips> = Object.fromEntries(state.seats.map((s) => [s.seatId, s.stack]));
  state.result = { kind, uncalled, pots, awards, showdown, payouts, finalStacks };
  events.push({ type: 'HAND_COMPLETED', kind });
}

function findSeat(state: HandState, seatId: string): SeatState | undefined {
  return state.seats.find((s) => s.seatId === seatId);
}

function buttonIndex(state: HandState): number {
  return state.seats.findIndex((s) => s.seatId === state.buttonSeatId);
}

/** Seat in ordine orario a partire dall'indice dato (incluso, modulo n). */
function orderedFrom(state: HandState, startIndex: number): SeatState[] {
  const n = state.seats.length;
  return Array.from({ length: n }, (_, k) => state.seats[(((startIndex + k) % n) + n) % n]!);
}

function validateStartInput(input: StartHandInput): string | null {
  const n = input.seats.length;
  if (n < 2 || n > 10) return 'Numero di seat non valido (2..10)';
  if (new Set(input.seats.map((s) => s.seatId)).size !== n) return 'seatId duplicati';
  if (input.seats.some((s) => typeof s.stack !== 'bigint' || s.stack <= 0n)) return 'Ogni seat in gioco deve avere stack > 0';
  if (!input.seats.some((s) => s.seatId === input.buttonSeatId)) return 'Button non presente tra i seat';
  if (typeof input.smallBlind !== 'bigint' || typeof input.bigBlind !== 'bigint') return 'Blinds non interi';
  if (input.smallBlind <= 0n || input.bigBlind < input.smallBlind) return 'Blinds non validi';
  if (!isValidDeck(input.deck)) return 'Il mazzo deve essere una permutazione di 52 carte distinte';
  return null;
}
