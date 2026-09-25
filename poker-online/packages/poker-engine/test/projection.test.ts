import { describe, expect, it } from 'vitest';
import { parseCards, project } from '../src/index.js';
import { play, riggedDeck, seats, start } from './helpers.js';

describe('proiezione per destinatario (§11.6)', () => {
  // Button A → SB B, BB C. Distribuzione da B.
  const deck = riggedDeck(['Kc Kd', 'Qc Qd', 'Ac Ad'], '2h 7s 9d Jh 3c');
  const s0 = start({ seats: seats({ A: 100, B: 100, C: 100 }), buttonSeatId: 'A', deck });

  it('mostra solo le proprie carte e le azioni legali solo all\'attore', () => {
    const view = project(s0, { seatId: 'B' });
    expect(view.seats.find((x) => x.seatId === 'B')!.holeCards).toEqual(parseCards('Kc Kd'));
    expect(view.seats.filter((x) => x.seatId !== 'B').every((x) => x.holeCards === null)).toBe(true);
    expect(view.legalActions).toBeNull();
    expect(project(s0, { seatId: 'A' }).legalActions).not.toBeNull();
    expect(project(s0, { seatId: null }).seats.every((x) => x.holeCards === null)).toBe(true);
    expect(Object.keys(view)).not.toContain('deck');
  });

  it('allo showdown rivela i non folded, mai i folded', () => {
    const end = play(s0, 'A:raise:100 B:fold C:call');
    const view = project(end, { seatId: null });
    expect(view.seats.find((x) => x.seatId === 'A')!.holeCards).toEqual(parseCards('Ac Ad'));
    expect(view.seats.find((x) => x.seatId === 'C')!.holeCards).toEqual(parseCards('Qc Qd'));
    expect(view.seats.find((x) => x.seatId === 'B')!.holeCards).toBeNull();
    expect(view.result!.showdown!.map((e) => e.seatId)).toEqual(['A', 'C']);
  });
});
