import { describe, expect, it } from 'vitest';
import { applyAction, applyTimeout, legalActions, parseCards, startHand } from '../src/index.js';
import { act, play, riggedDeck, seats, start } from './helpers.js';

describe('side pot §20.2: A100 / B250 / C400', () => {
  // Button C → SB A, BB B; preflop agisce per primo C. Distribuzione da A (sinistra del button).
  const deck = riggedDeck(['As Ah', 'Ks Kh', 'Qs Qh'], '2c 7d 9h Jc 3s');
  const initial = start({ seats: seats({ A: 100, B: 250, C: 400 }), buttonSeatId: 'C', deck });

  it('rimborso non chiamato, main e side pot, payout', () => {
    const end = play(initial, 'C:raise:400 A:call B:call');
    expect(end.status).toBe('COMPLETE');
    expect(end.board).toHaveLength(5);
    const r = end.result!;
    expect(r.kind).toBe('SHOWDOWN');
    expect(r.uncalled).toEqual({ seatId: 'C', amount: 150n });
    expect(r.pots).toEqual([
      { amount: 300n, eligibleSeatIds: ['A', 'B', 'C'] },
      { amount: 300n, eligibleSeatIds: ['B', 'C'] },
    ]);
    expect(r.payouts).toEqual({ A: 300n, B: 300n, C: 0n });
    expect(r.finalStacks).toEqual({ A: 300n, B: 300n, C: 150n });
    expect(Object.values(r.finalStacks).reduce((a, b) => a + b, 0n)).toBe(750n);
  });
});

describe('split pot e fiche dispari', () => {
  it('pot da 5 diviso fra due vincitori: la fiche dispari al primo a sinistra del button', () => {
    // Button A → SB B, BB C. Distribuzione da B. Board scala reale: tutti in parità.
    const deck = riggedDeck(['2c 3d', '4c 5d', '6c 7d'], 'Ts Js Qs Ks As');
    let s = start({ seats: seats({ A: 100, B: 100, C: 100 }), buttonSeatId: 'A', smallBlind: 1n, bigBlind: 2n, deck });
    s = play(s, 'A:call B:fold C:check');
    s = play(s, 'C:check A:check C:check A:check C:check A:check');
    const r = s.result!;
    expect(r.pots).toEqual([{ amount: 5n, eligibleSeatIds: ['A', 'C'] }]);
    // Ordine orario dal primo a sinistra del button: B (folded), C, A.
    expect(r.awards[0]!.winners).toEqual([
      { seatId: 'C', amount: 3n },
      { seatId: 'A', amount: 2n },
    ]);
    expect(r.showdown!.map((e) => e.seatId)).toEqual(['A', 'C']);
  });
});

describe('rilanci all-in corti e riapertura cumulativa (§6.4, §20.2)', () => {
  // Button A → SB B (50), BB C (100); primo attore preflop D.
  const table = seats({ A: 1000, B: 1000, C: 1000, D: 1000, E: 150, F: 200 });
  const base = () => start({ seats: table, buttonSeatId: 'A', smallBlind: 50n, bigBlind: 100n });

  it('un singolo all-in corto non riapre il rilancio a chi aveva già chiamato', () => {
    let s = play(base(), 'D:call');
    const e = legalActions(s, 'E')!;
    expect(e).toMatchObject({ canRaise: true, allInOnly: true, minRaiseTo: 150n, maxRaiseTo: 150n });
    s = play(s, 'E:raise:150 F:fold A:fold B:fold');
    // Il BB non ha ancora agito: conserva il diritto di rilancio.
    expect(legalActions(s, 'C')!.canRaise).toBe(true);
    s = play(s, 'C:call');
    const d = legalActions(s, 'D')!;
    expect(d).toMatchObject({ canRaise: false, canCall: true, callAmount: 50n, minRaiseTo: null });
    expect(applyAction(s, 'D', { kind: 'RAISE_TO', streetTotal: 400n })).toMatchObject({ ok: false, code: 'ILLEGAL_ACTION' });
  });

  it('due all-in corti cumulativi (150, 200) riaprono il rilancio', () => {
    const s = play(base(), 'D:call E:raise:150 F:raise:200 A:fold B:fold C:call');
    expect(legalActions(s, 'D')).toMatchObject({ canRaise: true, callAmount: 100n, minRaiseTo: 300n, maxRaiseTo: 1000n });
  });
});

describe('turni e validazione', () => {
  it('heads-up: il button è small blind, agisce per primo preflop e per secondo postflop', () => {
    let s = start({ seats: seats({ A: 500, B: 500 }), buttonSeatId: 'A' });
    expect(s.smallBlindSeatId).toBe('A');
    expect(s.bigBlindSeatId).toBe('B');
    expect(s.actorSeatId).toBe('A');
    s = play(s, 'A:call B:check');
    expect(s.street).toBe('FLOP');
    expect(s.actorSeatId).toBe('B');
  });

  it('distribuisce una carta alla volta partendo a sinistra del button', () => {
    const s = start({ seats: seats({ A: 500, B: 500, C: 500 }), buttonSeatId: 'A', deck: riggedDeck(['2c 3c', '4c 5c', '6c 7c'], 'Ts Js Qs Ks As') });
    expect(s.seats.map((x) => x.holeCards)).toEqual([parseCards('6c 7c'), parseCards('2c 3c'), parseCards('4c 5c')]);
  });

  it('rifiuta check illegale, azione fuori turno e rilancio sotto il minimo', () => {
    const s = start({ seats: seats({ A: 500, B: 500, C: 500 }), buttonSeatId: 'A' });
    expect(s.actorSeatId).toBe('A');
    expect(applyAction(s, 'A', { kind: 'CHECK' })).toMatchObject({ ok: false, code: 'ILLEGAL_ACTION' });
    expect(applyAction(s, 'B', { kind: 'CALL' })).toMatchObject({ ok: false, code: 'NOT_YOUR_TURN' });
    expect(applyAction(s, 'A', { kind: 'RAISE_TO', streetTotal: 15n })).toMatchObject({ ok: false, code: 'ILLEGAL_ACTION' });
    expect(applyAction(s, 'A', { kind: 'RAISE_TO', streetTotal: 501n })).toMatchObject({ ok: false, code: 'ILLEGAL_ACTION' });
    expect(applyAction(s, 'A', { kind: 'RAISE_TO', streetTotal: 20n }).ok).toBe(true);
  });

  it('postflop la puntata minima è il big blind', () => {
    let s = start({ seats: seats({ A: 500, B: 500, C: 500 }), buttonSeatId: 'A' });
    s = play(s, 'A:call B:call C:check');
    expect(s.street).toBe('FLOP');
    expect(s.actorSeatId).toBe('B');
    expect(legalActions(s, 'B')).toMatchObject({ canCheck: true, canCall: false, minRaiseTo: 10n, maxRaiseTo: 490n });
  });

  it('non modifica lo stato in input (transizioni immutabili)', () => {
    const s = start({ seats: seats({ A: 500, B: 500 }), buttonSeatId: 'A' });
    const snapshot = structuredClone(s);
    act(s, 'A', { kind: 'RAISE_TO', streetTotal: 40n });
    expect(s).toEqual(snapshot);
  });

  it('rifiuta input di avvio non validi', () => {
    const bad = startHand({ matchId: 'm', handId: 'h', handNumber: 1, seats: seats({ A: 10, B: 10 }), buttonSeatId: 'A', smallBlind: 5n, bigBlind: 10n, deck: [1, 1, 2] });
    expect(bad).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
  });
});

describe('blind incompleti', () => {
  it('il big blind corto non abbassa il livello nominale', () => {
    const s = start({ seats: seats({ A: 100, B: 100, C: 3 }), buttonSeatId: 'A' });
    expect(s.seats.find((x) => x.seatId === 'C')!.status).toBe('ALL_IN');
    expect(legalActions(s, 'A')).toMatchObject({ callAmount: 10n, minRaiseTo: 20n });
  });

  it('heads-up con entrambi all-in sui blind: runout diretto', () => {
    const s = start({ seats: seats({ A: 4, B: 8 }), buttonSeatId: 'A' });
    expect(s.status).toBe('COMPLETE');
    expect(s.board).toHaveLength(5);
    expect(s.result!.uncalled).toEqual({ seatId: 'B', amount: 4n });
  });
});

describe('vittoria uncontested', () => {
  it('tutti foldano al big blind: nessuna carta rivelata', () => {
    const s = play(start({ seats: seats({ A: 100, B: 100, C: 100 }), buttonSeatId: 'A' }), 'A:fold B:fold');
    const r = s.result!;
    expect(r.kind).toBe('UNCONTESTED');
    expect(r.showdown).toBeNull();
    expect(r.uncalled).toEqual({ seatId: 'C', amount: 5n });
    expect(r.finalStacks).toEqual({ A: 100n, B: 95n, C: 105n });
  });
});

describe('timeout', () => {
  it('fold se occorre pagare, check se possibile; turnId vecchio rifiutato', () => {
    let s = start({ seats: seats({ A: 100, B: 100, C: 100 }), buttonSeatId: 'A' });
    const oldTurn = s.turnId!;
    const t = applyTimeout(s, oldTurn);
    expect(t.ok && t.events[0]).toMatchObject({ type: 'ACTION_APPLIED', seatId: 'A', action: { kind: 'FOLD' }, source: 'TIMEOUT' });
    s = t.ok ? t.state : s;
    expect(applyTimeout(s, oldTurn)).toMatchObject({ ok: false, code: 'STALE_TURN' });
    s = play(s, 'B:call');
    const c = applyTimeout(s, s.turnId!);
    expect(c.ok && c.events[0]).toMatchObject({ seatId: 'C', action: { kind: 'CHECK' } });
  });
});
