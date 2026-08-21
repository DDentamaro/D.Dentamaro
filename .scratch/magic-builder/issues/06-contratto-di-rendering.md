# 06 — Contratto di rendering per stadio

Type: grilling (declassato ad AFK — vedi Notes della mappa)
Status: open
Blocked by: 02, 03, 04

## Question

Come diventa immagine una pipeline composta?

Questo ticket esiste per rispondere al rischio dichiarato in cartografia: un builder puro produce
resa generica per costruzione, e il pericolo e' un sistema di regole elegante che sullo schermo fa
grigio. In un progetto sulla magia, lo spettacolo *e'* il punto.

- Il **contratto**: cosa ogni stadio garantisce al renderer, e cosa il renderer garantisce a ogni
  stadio. Deve valere per combinazioni che nessuno ha previsto.
- Come **compongono** i contributi visivi di stadi diversi senza diventare fango.
- Dove entra l'**attributo** (fuoco/acqua/vento/terra) nella resa: palette, comportamento,
  entrambi.
- Come si rende la **degradazione** del 05: un fallimento deve essere bello quanto un successo, o
  nessuno sperimentera'.
- Cosa sta nel budget del 03 e cosa no.

## Output atteso

Il contratto scritto, piu' l'elenco delle tecniche ammesse e di quelle escluse per budget.
