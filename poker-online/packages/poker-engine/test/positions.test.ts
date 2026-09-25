import { describe, expect, it } from 'vitest';
import { nextButtonSeat } from '../src/index.js';

describe('rotazione button', () => {
  const order = ['A', 'B', 'C', 'D'];

  it('moving button con tre o più giocatori, anche se il button precedente è eliminato', () => {
    expect(nextButtonSeat({ seatOrder: order, inPlaySeatIds: order, previousButtonSeatId: 'A', previousBigBlindSeatId: 'C' })).toBe('B');
    expect(nextButtonSeat({ seatOrder: order, inPlaySeatIds: ['B', 'C', 'D'], previousButtonSeatId: 'A', previousBigBlindSeatId: 'C' })).toBe('B');
    expect(nextButtonSeat({ seatOrder: order, inPlaySeatIds: ['A', 'C', 'D'], previousButtonSeatId: 'A', previousBigBlindSeatId: 'C' })).toBe('C');
  });

  // Mano precedente a tre: button A, SB B, BB C. Si elimina ciascuna posizione.
  it.each([
    ['A', ['B', 'C']],
    ['B', ['A', 'C']],
    ['C', ['A', 'B']],
  ])('passaggio 3→2 con %s eliminato: nessun doppio big blind', (_eliminated, inPlay) => {
    const button = nextButtonSeat({ seatOrder: ['A', 'B', 'C'], inPlaySeatIds: inPlay, previousButtonSeatId: 'A', previousBigBlindSeatId: 'C' });
    const bigBlind = inPlay.find((id) => id !== button)!;
    expect(bigBlind).not.toBe('C');
  });
});
