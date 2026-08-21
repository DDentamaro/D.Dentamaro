# 09 — Formato di serializzazione ed export

Type: grilling (declassato ad AFK — vedi Notes della mappa)
Status: open
Blocked by: 04

## Question

In che forma una spell composta viene salvata, esportata e riletta?

- Lo **schema**: cosa si serializza di una pipeline, e come sopravvive a un cambio di operatori in
  una versione futura del file.
- Il salvataggio automatico in **`localStorage`**: cosa, quando, e come si comporta quando non c'e'
  (finestra privata, dati del sito cancellati).
- La **stringa di export**: leggibile o compatta? Senza rete, quella stringa e' l'unico modo che
  una creazione ha di uscire dal telefono, quindi deve essere incollabile ovunque.
- **Validazione in import**: cosa fa il builder quando gli incolli una stringa rotta o
  manomessa. Non deve poter far eseguire nulla.

## Output atteso

Lo schema e le regole di import/export. Alimenta il 10.
