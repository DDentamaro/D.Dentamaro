import { describe, expect, it } from 'vitest';
import { loadServerConfig } from '../src/index.js';

describe('configurazione di bootstrap (§19.4)', () => {
  it('default locali', () => {
    expect(loadServerConfig({})).toMatchObject({ appEnv: 'local', botPoolSize: 50, botFillAfterSeconds: 20, playPurchasesEnabled: false });
  });
  it('rifiuta ALLOW_RANKED_BOTS diverso da false', () => {
    expect(() => loadServerConfig({ ALLOW_RANKED_BOTS: 'true' })).toThrow(/ALLOW_RANKED_BOTS/);
    expect(() => loadServerConfig({ ALLOW_RANKED_BOTS: '1' })).toThrow(/ALLOW_RANKED_BOTS/);
  });
  it("rifiuta l'emulatore auth in produzione", () => {
    expect(() => loadServerConfig({ APP_ENV: 'production', AUTH_EMULATOR_HOST: 'localhost:9099' })).toThrow();
    expect(loadServerConfig({ APP_ENV: 'local', AUTH_EMULATOR_HOST: 'localhost:9099' }).authEmulatorHost).toBe('localhost:9099');
  });
  it('rifiuta acquisti attivi e valori non validi', () => {
    expect(() => loadServerConfig({ PLAY_PURCHASES_ENABLED: 'true' })).toThrow();
    expect(() => loadServerConfig({ BOT_POOL_SIZE: '-1' })).toThrow();
    expect(() => loadServerConfig({ APP_ENV: 'prod' })).toThrow();
  });
});
