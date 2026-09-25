import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createValidators } from '../src/index.js';

const fixturesDir = join(import.meta.dirname, '..', 'fixtures');
const load = (name: string): Record<string, unknown> => JSON.parse(readFileSync(join(fixturesDir, name), 'utf8'));
const v = createValidators();

const validatorFor = (file: string) =>
  file.startsWith('game-action') ? v.gameAction : file.startsWith('command-result') ? v.commandResult : v.tableSnapshot;

describe('fixture golden (condivise con i test Dart)', () => {
  it.each(readdirSync(fixturesDir).filter((f) => f.endsWith('.json')))('%s è valida', (file) => {
    const validate = validatorFor(file);
    expect(validate(load(file)), JSON.stringify(validate.errors)).toBe(true);
  });
});

describe('rifiuti di schema', () => {
  const raise = load('game-action.raise.json');

  it('nessun attore fiduciario nel payload', () => {
    expect(v.gameAction({ ...raise, actorUserId: 'u1' })).toBe(false);
    expect(v.gameAction({ ...raise, payload: { kind: 'CALL', participantKind: 'HUMAN' } })).toBe(false);
  });

  it('le fiches sono stringhe decimali, mai Number', () => {
    expect(v.gameAction({ ...raise, payload: { kind: 'RAISE_TO', streetTotal: 120 } })).toBe(false);
    expect(v.gameAction({ ...raise, payload: { kind: 'RAISE_TO', streetTotal: '1.5' } })).toBe(false);
    expect(v.gameAction({ ...raise, payload: { kind: 'RAISE_TO', streetTotal: '0120' } })).toBe(false);
    expect(v.gameAction({ ...raise, expectedVersion: 42 })).toBe(false);
  });

  it('enum chiusi e versione di protocollo', () => {
    expect(v.gameAction({ ...raise, payload: { kind: 'ALL_IN' } })).toBe(false);
    expect(v.gameAction({ ...raise, protocolVersion: 2 })).toBe(false);
    expect(v.commandResult({ ...load('command-result.rejected.json'), code: 'OOPS' })).toBe(false);
    expect(v.commandResult({ ...load('command-result.accepted.json'), code: 'STALE_STATE' })).toBe(false);
  });
});
