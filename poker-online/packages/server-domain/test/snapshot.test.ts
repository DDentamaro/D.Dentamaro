import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createValidators } from '@poker/contracts';
import { type HandState, applyAction, cardToString, parseCards, orderedDeck, project, startHand } from '@poker/poker-engine';
import { describe, expect, it } from 'vitest';
import { toTableSnapshot } from '../src/index.js';

const MATCH_ID = '00000000-0000-4000-8000-000000000002';
const HAND_ID = '00000000-0000-4000-8000-000000000003';
const golden = (name: string) => join(import.meta.dirname, '..', '..', 'contracts', 'fixtures', name);
const validators = createValidators();

function riggedDeck(top: string) {
  const head = parseCards(top);
  return [...head, ...orderedDeck().filter((c) => !head.includes(c))];
}

function stateAfterRaise(): HandState {
  // Button A → SB B, BB C; distribuzione da B: B=Kc Kd, C=Qc Qd, A=Ac Ad.
  const t = startHand({
    matchId: MATCH_ID,
    handId: HAND_ID,
    handNumber: 7,
    seats: [
      { seatId: 'seat-1', stack: 1000n },
      { seatId: 'seat-2', stack: 1000n },
      { seatId: 'seat-3', stack: 1000n },
    ],
    buttonSeatId: 'seat-1',
    smallBlind: 5n,
    bigBlind: 10n,
    deck: riggedDeck('Kc Qc Ac Kd Qd Ad'),
  });
  if (!t.ok) throw new Error(t.message);
  const r = applyAction(t.state, 'seat-1', { kind: 'RAISE_TO', streetTotal: 30n });
  if (!r.ok) throw new Error(r.message);
  return r.state;
}

const meta = {
  matchId: MATCH_ID,
  stateVersion: 42n,
  serverTime: new Date('2026-09-25T10:00:00.000Z'),
  matchStatus: 'RUNNING' as const,
  modeId: 'holdem_casual_6',
  rulesVersion: 1,
  turnDeadline: new Date('2026-09-25T10:00:15.000Z'),
};

describe('snapshot wire (§11.6)', () => {
  const state = stateAfterRaise();

  it('coincide con la fixture golden condivisa e rispetta lo schema', () => {
    const snapshot = toTableSnapshot(meta, project(state, { seatId: 'seat-2' }));
    const file = golden('table-snapshot.seat-2.json');
    if (process.env.UPDATE_GOLDEN === '1') writeFileSync(file, JSON.stringify(snapshot, null, 2) + '\n');
    expect(snapshot).toEqual(JSON.parse(readFileSync(file, 'utf8')));
    expect(validators.tableSnapshot(snapshot), JSON.stringify(validators.tableSnapshot.errors)).toBe(true);
  });

  it('nessuna carta nascosta altrui nel wire, per ogni destinatario', () => {
    const allHole = new Map(state.seats.map((s) => [s.seatId, s.holeCards.map(cardToString)]));
    for (const viewer of ['seat-1', 'seat-2', 'seat-3', null]) {
      const json = JSON.stringify(toTableSnapshot(meta, project(state, { seatId: viewer })));
      for (const [seatId, codes] of allHole) {
        for (const code of codes) expect(json.includes(`"${code}"`)).toBe(seatId === viewer);
      }
      expect(json).not.toMatch(/deck|burn|BOT|HUMAN/i);
    }
  });

  it('snapshot senza mano in corso', () => {
    const snapshot = toTableSnapshot({ ...meta, matchStatus: 'READY_CHECK' }, null);
    expect(validators.tableSnapshot(snapshot)).toBe(true);
  });
});
