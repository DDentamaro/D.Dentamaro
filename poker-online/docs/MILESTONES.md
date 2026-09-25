# Note di milestone (§24.2)

## P0 + P1 — 25 settembre 2026

### Comportamento implementato

- **Monorepo pnpm** con TypeScript strict, ESLint (con divieto di `Math.random`), Vitest, CI GitHub Actions.
- **`@poker/poker-engine`** — dominio puro, senza rete, clock, database o casualità:
  - mapping carte stabile 0..51 (`rank * 4 + suit`);
  - evaluator 5–7 carte con ordinamento totale, ruota A-5, kicker, parità senza semi;
  - macchina a stati NLHE: blinds (anche parziali, livello nominale BB preservato), distribuzione
    una carta alla volta dal primo a sinistra del button, burn, ordine d'azione preflop/postflop,
    heads-up, check/call/raise-to, all-in come call/raise che esaurisce lo stack;
  - regola cumulativa di riapertura del rilancio con `actedAtLevel` per seat (nessun booleano globale);
  - chiusura street, runout quando nessuno può più puntare, showdown, vittoria uncontested senza rivelazione;
  - piatti: rimborso non chiamato, main/side pot per livelli, contributi folded, fiche dispari in
    senso orario dal primo a sinistra del button;
  - timeout (check se lecito, altrimenti fold) con rifiuto di `turnId` obsoleti;
  - transizioni immutabili che restituiscono stato + eventi di dominio;
  - proiezione per destinatario costruita per allowlist;
  - rotazione del button tra mani, incluso il passaggio 3→2 (ADR-012).
- **`@poker/contracts`** — JSON Schema 2020-12 per `game.action`, `command.result`, `match.snapshot`,
  enum chiusi, fiches come stringhe decimali, nessun campo attore/tipo partecipante; fixture golden.
- **`@poker/server-domain`** — Fisher–Yates con `crypto.randomInt`, serializzatore dello snapshot wire,
  rating Elo pairwise §14.2, leghe, reset stagione, validazione della configurazione di bootstrap.

### Comandi eseguiti e relativo esito

| Comando | Esito |
| --- | --- |
| `pnpm install` | OK |
| `pnpm lint` | OK, nessun errore |
| `pnpm typecheck` | OK (3 package) |
| `pnpm test` | OK — engine 42, contracts 8, server-domain 14 test |

Copertura della matrice §20.1 in questa fase: valutatore (incluso esaustivo 5 carte con frequenze note e
7462 classi, oracle indipendente a 7 carte su 20.000 casi), turni, puntate, piatti, invarianti, replay,
proiezioni (property-based su 1.500 mani casuali di 2–6 giocatori). Fixture §20.2 coperte: side pot
A100/B250/C400, split con fiche dispari, all-in corto singolo e cumulativo, rating a sei giocatori.

### Limitazioni e rischi noti

- La repository dedicata non è stata creata da questa sessione (permessi GitHub insufficienti): il
  progetto vive temporaneamente nella cartella `poker-online/` e il workflow CI si attiva solo quando
  la cartella diventa la radice di una repository propria.
- Il `turnId` generato dal motore è `handId:seq`; il runtime potrà mapparlo su UUID se il contratto lo richiederà.
- Le immagini Docker, Postgres, Redis, Firebase e il client Flutter non sono ancora introdotti; `docs/DEPENDENCIES.md`
  elenca solo gli strumenti effettivamente installati.
- Fixture PLO (§20.2) rinviate a P11; ranked/ledger/concorrenza a P2–P7.
- Split 101 fra due vincitori verificato a livello di `splitPot` e con un piatto da 5 in una mano completa.

### Prossimo task

P2: migrazioni SQL (principals, auth_identities, profiles, ledger_accounts/transactions/entries con somma zero
differita, reward_claims), docker compose per Postgres/Redis con immagini fissate per digest, adapter di
autenticazione Firebase con emulatore locale, claim giornaliero e hold idempotenti con test di integrazione su
Postgres reale.
