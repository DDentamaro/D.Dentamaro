export interface ServerConfig {
  readonly appEnv: 'local' | 'test' | 'staging' | 'production';
  readonly botPoolSize: number;
  readonly botFillAfterSeconds: number;
  readonly playPurchasesEnabled: boolean;
  readonly authEmulatorHost: string | null;
}

/**
 * Validazione al bootstrap (§19.4). `ALLOW_RANKED_BOTS=true` è rifiutato: non può diventare
 * un modo per aggirare l'invariante "ranked solo umani". L'emulatore auth è vietato in produzione.
 */
export function loadServerConfig(env: Readonly<Record<string, string | undefined>>): ServerConfig {
  const appEnv = env.APP_ENV ?? 'local';
  if (appEnv !== 'local' && appEnv !== 'test' && appEnv !== 'staging' && appEnv !== 'production') {
    throw new Error(`APP_ENV non valido: ${appEnv}`);
  }
  if ((env.ALLOW_RANKED_BOTS ?? 'false') !== 'false') {
    throw new Error('ALLOW_RANKED_BOTS deve essere false: il ranked ammette solo persone');
  }
  const emulator = env.AUTH_EMULATOR_HOST?.trim() || null;
  if (appEnv === 'production' && emulator !== null) {
    throw new Error("AUTH_EMULATOR_HOST non è consentito in produzione");
  }
  const purchases = (env.PLAY_PURCHASES_ENABLED ?? 'false') === 'true';
  if (purchases) throw new Error('Gli acquisti non sono disponibili in questa versione');
  return {
    appEnv,
    botPoolSize: positiveInt(env.BOT_POOL_SIZE ?? '50', 'BOT_POOL_SIZE'),
    botFillAfterSeconds: positiveInt(env.BOT_FILL_AFTER_SECONDS ?? '20', 'BOT_FILL_AFTER_SECONDS'),
    playPurchasesEnabled: purchases,
    authEmulatorHost: emulator,
  };
}

function positiveInt(raw: string, name: string): number {
  if (!/^[1-9][0-9]*$/.test(raw)) throw new Error(`${name} deve essere un intero positivo`);
  return Number(raw);
}
