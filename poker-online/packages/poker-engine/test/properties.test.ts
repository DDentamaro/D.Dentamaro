import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { type Action, type HandState, applyAction, legalActions, orderedDeck, project, startHand } from '../src/index.js';

interface Scenario {
  stacks: number[];
  button: number;
  smallBlind: number;
  bigBlind: number;
  deck: number[];
  choices: number[];
}

const scenario: fc.Arbitrary<Scenario> = fc
  .record({
    stacks: fc.array(fc.integer({ min: 1, max: 3000 }), { minLength: 2, maxLength: 6 }),
    button: fc.nat(),
    smallBlind: fc.integer({ min: 1, max: 25 }),
    extraBig: fc.integer({ min: 0, max: 25 }),
    deck: fc.shuffledSubarray(orderedDeck(), { minLength: 52, maxLength: 52 }),
    choices: fc.array(fc.nat(), { minLength: 400, maxLength: 400 }),
  })
  .map(({ extraBig, ...rest }) => ({ ...rest, bigBlind: rest.smallBlind + extraBig }));

/** Sceglie un'azione legale in modo deterministico dalle scelte generate. */
function pickAction(state: HandState, seatId: string, r1: number, r2: number): Action {
  const legal = legalActions(state, seatId)!;
  const options: Action[] = [{ kind: 'FOLD' }];
  if (legal.canCheck) options.push({ kind: 'CHECK' }, { kind: 'CHECK' });
  if (legal.canCall) options.push({ kind: 'CALL' }, { kind: 'CALL' });
  if (legal.canRaise) {
    const min = legal.minRaiseTo!;
    const span = legal.maxRaiseTo! - min + 1n;
    options.push({ kind: 'RAISE_TO', streetTotal: min + (BigInt(r2) % span) });
    options.push({ kind: 'RAISE_TO', streetTotal: legal.maxRaiseTo! });
  }
  return options[r1 % options.length]!;
}

function run(sc: Scenario): { states: HandState[] } {
  const ids = sc.stacks.map((_, i) => `S${i}`);
  const t = startHand({
    matchId: 'm',
    handId: 'h',
    handNumber: 1,
    seats: sc.stacks.map((stack, i) => ({ seatId: ids[i]!, stack: BigInt(stack) })),
    buttonSeatId: ids[sc.button % ids.length]!,
    smallBlind: BigInt(sc.smallBlind),
    bigBlind: BigInt(sc.bigBlind),
    deck: sc.deck,
  });
  if (!t.ok) throw new Error(t.message);
  const states = [t.state];
  let s = t.state;
  let i = 0;
  while (s.status === 'BETTING') {
    if (i + 1 >= sc.choices.length) throw new Error('La mano non termina');
    const action = pickAction(s, s.actorSeatId!, sc.choices[i]!, sc.choices[i + 1]!);
    i += 2;
    const next = applyAction(s, s.actorSeatId!, action);
    if (!next.ok) throw new Error(`Azione legale rifiutata: ${next.code} ${next.message}`);
    s = next.state;
    states.push(s);
  }
  return { states };
}

function checkInvariants(s: HandState, total: bigint): void {
  // Conservazione: stack dietro + contribuzioni = totale iniziale durante la mano; a fine mano solo stack.
  const inPlay = s.seats.reduce((acc, x) => acc + x.stack + (s.status === 'BETTING' ? x.handContribution : 0n), 0n);
  expect(inPlay).toBe(total);
  for (const seat of s.seats) {
    expect(seat.stack >= 0n).toBe(true);
    // Durante la mano: ALL_IN se e solo se lo stack dietro è esaurito (i folded hanno sempre fiches dietro).
    if (s.status === 'BETTING') expect(seat.status === 'ALL_IN').toBe(seat.stack === 0n);
  }
  // Nessuna carta due volte nella stessa mano.
  const dealt = [...s.seats.flatMap((x) => x.holeCards), ...s.board, ...s.burns];
  expect(new Set(dealt).size).toBe(dealt.length);
  expect(dealt.length).toBe(s.deckIndex);
  if (s.status === 'BETTING') {
    const actor = s.seats.find((x) => x.seatId === s.actorSeatId)!;
    expect(actor.status).toBe('ACTIVE');
  }
}

describe('proprietà su sequenze casuali di azioni legali (§20.3)', () => {
  it('invarianti, terminazione e conservazione delle fiches', () => {
    fc.assert(
      fc.property(scenario, (sc) => {
        const total = sc.stacks.reduce((a, b) => a + BigInt(b), 0n);
        const { states } = run(sc);
        for (const s of states) checkInvariants(s, total);
        const end = states[states.length - 1]!;
        expect(end.status).toBe('COMPLETE');
        const r = end.result!;
        const potSum = r.pots.reduce((a, p) => a + p.amount, 0n);
        const awarded = r.awards.reduce((a, aw) => a + aw.winners.reduce((b, w) => b + w.amount, 0n), 0n);
        expect(awarded).toBe(potSum);
        expect(potSum + (r.uncalled?.amount ?? 0n)).toBe(end.seats.reduce((a, x) => a + x.handContribution, 0n));
        if (r.kind === 'SHOWDOWN') expect(end.board).toHaveLength(5);
      }),
      { numRuns: 1500 },
    );
  });

  it('replay: stessi input + stesso mazzo + stessa versione → stesso stato finale', () => {
    fc.assert(
      fc.property(scenario, (sc) => {
        const a = run(sc).states;
        const b = run(sc).states;
        expect(b[b.length - 1]).toEqual(a[a.length - 1]);
      }),
      { numRuns: 300 },
    );
  });

  it('le proiezioni non contengono mai carte nascoste altrui', () => {
    fc.assert(
      fc.property(scenario, (sc) => {
        for (const s of run(sc).states) {
          const revealed = new Set((s.result?.showdown ?? []).map((e) => e.seatId));
          for (const viewer of [...s.seats.map((x) => x.seatId), null]) {
            const view = project(s, { seatId: viewer });
            for (const seat of view.seats) {
              const visible = seat.seatId === viewer || revealed.has(seat.seatId);
              expect(seat.holeCards === null).toBe(!visible);
            }
            const json = JSON.stringify(view, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v));
            expect(json).not.toMatch(/"deck"|"burns"|"deckIndex"/);
          }
        }
      }),
      { numRuns: 300 },
    );
  });
});
