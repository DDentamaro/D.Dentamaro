# ADR-012 — Rotazione del button

Stato: adottata • Data: 25 settembre 2026 • Riferimenti: §6.3, `packages/poker-engine/src/positions.ts`

## Contesto

La specifica chiede moving button sui giocatori attivi e una regola documentata per il passaggio da tre a
due giocatori che eviti un doppio big blind evitabile.

## Decisione

- Tre o più giocatori in gioco: il button passa al primo seat in gioco a sinistra del button precedente,
  anche se il button precedente è stato eliminato.
- Heads-up: il big blind avanza al primo seat in gioco a sinistra del big blind precedente; l'altro
  giocatore è button e small blind e agisce per primo preflop.
- Il motore riceve il `buttonSeatId` e ne deriva SB/BB; la scelta del button tra mani è del runtime,
  tramite `nextButtonSeat`, con i dati persistiti della mano precedente.

## Conseguenze

Nel passaggio 3→2 nessun giocatore paga il big blind due volte di seguito, qualunque sia la posizione
dell'eliminato (test `positions.test.ts`). Con quattro o più giocatori il moving button può far saltare
un blind a chi si trova dopo un eliminato; è il comportamento accettato del moving button.
Modificare la regola richiede una nuova `rulesVersion` e non può avvenire a metà stagione.
