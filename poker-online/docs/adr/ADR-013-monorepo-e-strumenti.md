# ADR-013 — Monorepo e strumenti

Stato: adottata • Data: 25 settembre 2026 • Riferimenti: §3

## Decisione

- Workspace pnpm (`packages/*`, `apps/*`), versione di pnpm fissata con `packageManager`.
- I package di dominio sono consumati come sorgente TypeScript (`exports` verso `src/index.ts`),
  senza passo di build: typecheck con `tsc --noEmit` e test con Vitest. Le app Nest introdurranno
  il proprio build quando necessario.
- Property-based testing con fast-check; il test esaustivo dell'evaluator gira nella suite normale (~3 s).
- ESLint vieta `Math.random` in tutto il repository.

## Conseguenze

Nessun artefatto compilato da mantenere per i package puri. Il client Dart non condivide codice
TypeScript: condivide gli JSON Schema e le fixture golden di `packages/contracts`.
