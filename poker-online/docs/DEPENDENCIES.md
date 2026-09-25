# Dipendenze (§3.1)

Versioni risolte nel lockfile `pnpm-lock.yaml`, verificate il 25 settembre 2026.
Tutte le versioni esatte sono bloccate dal lockfile; la CI usa `--frozen-lockfile`.

| Pacchetto | Versione | Licenza | Uso |
| --- | --- | --- | --- |
| Node.js | 22.x (verificato 22.22.2) | MIT | Runtime |
| pnpm | 10.33.0 | MIT | Package manager (fissato in `packageManager`) |
| typescript | 5.9.x | Apache-2.0 | Typecheck |
| vitest | 3.2.x | MIT | Test runner |
| fast-check | 4.x | MIT | Property-based testing (solo test) |
| eslint / @eslint/js | 9.39.x | MIT | Lint |
| typescript-eslint | 8.x | MIT | Regole TypeScript |
| ajv / ajv-formats | 8.x / 3.x | MIT | Validazione JSON Schema dei contratti |
| @types/node | 22.x | MIT | Tipi Node |

## Aggiornamenti da valutare

Al momento dell'installazione erano disponibili major più recenti (TypeScript 7, Vitest 5, ESLint 10, Node 26).
Non sono stati adottati in questa fase: vanno valutati in una modifica dedicata con verifica di supporto
LTS e compatibilità.
