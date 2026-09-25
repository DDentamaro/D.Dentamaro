# poker-online (nome provvisorio)

Gioco di poker multiplayer per Android con server autorevole. Fiches esclusivamente virtuali:
non convertibili, non trasferibili, senza premi di valore reale.

La specifica di riferimento è [`docs/ARCHITETTURA_POKER_AGENT.md`](docs/ARCHITETTURA_POKER_AGENT.md).
Le decisioni tecniche sono registrate in [`docs/adr/`](docs/adr/), lo stato di avanzamento in
[`docs/MILESTONES.md`](docs/MILESTONES.md).

## Stato

| Fase | Contenuto | Stato |
| --- | --- | --- |
| P0 | Scaffold monorepo, ADR, contratti v1 (parziali), CI | Fatto (vedi limitazioni) |
| P1 | Motore NLHE deterministico ed evaluator | Fatto, test verdi |
| P2 | Schema SQL, auth adapter, profilo, ledger | Da fare |
| P3 | Runtime, WebSocket, tavolo Flutter minimo | Da fare |

Nessuna app mobile, server HTTP/WS o database è ancora presente: il repository contiene oggi il
dominio puro e i contratti su cui verranno costruiti.

## Struttura

```text
packages/poker-engine/   Dominio poker puro TypeScript: carte, evaluator, puntate, piatti, proiezioni
packages/contracts/      JSON Schema del protocollo v1 e fixture golden (condivise col client Dart)
packages/server-domain/  Servizi server puri: mazzo CSPRNG, DTO snapshot, rating, config bootstrap
docs/                    Specifica, ADR, dipendenze, milestone
```

Previsti nelle fasi successive (§3.2): `apps/server`, `apps/worker`, `apps/mobile`, `apps/admin`,
`packages/bot-policy`, `packages/test-fixtures`, `infra/`, `scripts/`.

## Requisiti

- Node.js ≥ 22 (verificato con 22.22.2)
- pnpm 10 (`corepack enable` usa la versione fissata in `package.json`)

## Comandi

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test             # tutti i package
pnpm test:engine      # motore, include il test esaustivo delle 2.598.960 mani da 5 carte (~3 s)
pnpm test:contracts   # schemi, fixture golden e DTO snapshot
```

Per rigenerare la fixture golden dello snapshot dopo una modifica intenzionale del contratto:

```bash
UPDATE_GOLDEN=1 pnpm --filter @poker/server-domain exec vitest run test/snapshot.test.ts
```

## Invarianti non negoziabili

- Solo il server assegna carte, valida azioni, modifica saldi e certifica risultati.
- Fiches sempre `bigint` / BIGINT / stringhe decimali sul wire; mai `Number` o float.
- Nessun `Math.random` (regola ESLint); il mazzo è mescolato con CSPRNG fuori dal motore.
- Le proiezioni sono allowlist: carte nascoste altrui assenti, non offuscate.
- Nessun bot in partite ranked; `ALLOW_RANKED_BOTS=true` fa fallire il bootstrap.
