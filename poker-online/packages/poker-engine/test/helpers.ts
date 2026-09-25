import {
  type Action,
  type Card,
  type HandState,
  type StartHandInput,
  type Transition,
  applyAction,
  orderedDeck,
  parseCards,
  startHand,
} from '../src/index.js';

/** Mazzo fisso: le carte indicate in testa, poi le rimanenti in ordine. */
export function deckWithTop(top: string): Card[] {
  const head = parseCards(top);
  const used = new Set(head);
  if (used.size !== head.length) throw new Error('Carte duplicate nel mazzo di test');
  return [...head, ...orderedDeck().filter((c) => !used.has(c))];
}

/**
 * Costruisce la testa del mazzo dalla distribuzione desiderata.
 * `hole` è nell'ordine dei seat a partire dal primo a sinistra del button.
 */
export function riggedDeck(hole: string[], board: string): Card[] {
  const holes = hole.map(parseCards);
  const [f1, f2, f3, t, r] = parseCards(board);
  const first = holes.map((h) => h[0]!);
  const second = holes.map((h) => h[1]!);
  const used = new Set<number>([...first, ...second, f1!, f2!, f3!, t!, r!]);
  const rest = orderedDeck().filter((c) => !used.has(c));
  // Le burn sono prese dalle carte rimanenti.
  const burns = [rest.shift()!, rest.shift()!, rest.shift()!];
  return [...first, ...second, burns[0]!, f1!, f2!, f3!, burns[1]!, t!, burns[2]!, r!, ...rest];
}

export function start(input: Partial<StartHandInput> & Pick<StartHandInput, 'seats' | 'buttonSeatId'>): HandState {
  const t = startHand({
    matchId: 'm1',
    handId: 'h1',
    handNumber: 1,
    smallBlind: 5n,
    bigBlind: 10n,
    deck: orderedDeck(),
    ...input,
  });
  return expectOk(t).state;
}

export function expectOk(t: Transition): Extract<Transition, { ok: true }> {
  if (!t.ok) throw new Error(`Transizione rifiutata: ${t.code} ${t.message}`);
  return t;
}

export function act(state: HandState, seatId: string, action: Action): HandState {
  return expectOk(applyAction(state, seatId, action)).state;
}

/** Applica una sequenza "A:call B:raise:300 C:fold …" verificando il turno. */
export function play(state: HandState, script: string): HandState {
  let s = state;
  for (const step of script.trim().split(/\s+/).filter(Boolean)) {
    const [seat, kind, amount] = step.split(':');
    const action: Action =
      kind === 'fold'
        ? { kind: 'FOLD' }
        : kind === 'check'
          ? { kind: 'CHECK' }
          : kind === 'call'
            ? { kind: 'CALL' }
            : { kind: 'RAISE_TO', streetTotal: BigInt(amount!) };
    s = act(s, seat!, action);
  }
  return s;
}

export const seats = (spec: Record<string, number | bigint>): StartHandInput['seats'] =>
  Object.entries(spec).map(([seatId, stack]) => ({ seatId, stack: BigInt(stack) }));

export const totalChips = (state: HandState): bigint =>
  state.seats.reduce((acc, s) => acc + s.stack + (state.status === 'BETTING' ? s.handContribution : 0n), 0n);
