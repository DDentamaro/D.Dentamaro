# ADR-014 — Formato delle carte sul wire

Stato: adottata • Data: 25 settembre 2026 • Riferimenti: §6.1, §11.6

## Decisione

Nel dominio la carta è un intero 0..51 (`rank * 4 + suit`). Sul wire è una stringa di due caratteri:
rank in `23456789TJQKA` seguito dal seme in `cdhs` (es. `As`, `Td`), validata dal pattern dello schema.

## Motivazione

Leggibile nei log autorizzati e nelle fixture, indipendente dal mapping interno, facile da tipizzare in
Dart. Il mapping interno resta un dettaglio del motore versionato con `rulesVersion`.
