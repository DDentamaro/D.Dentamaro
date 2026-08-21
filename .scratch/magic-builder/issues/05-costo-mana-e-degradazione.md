# 05 — Costo del mana e modello di controllo/degradazione

Type: grilling (declassato ad AFK — vedi Notes della mappa)
Status: open
Blocked by: 04

## Question

Come si calcola il costo in mana di una pipeline composta, e cosa succede esattamente quando il
controllo non basta?

- La **funzione di costo**: additiva sugli operatori? moltiplicativa sugli stadi? Con quale scala,
  perche' il numero deve *significare* qualcosa per chi costruisce.
- Il **controllo**: una statistica sola o una per stadio? Come si confronta con la difficolta' di
  cio' che hai composto.
- La **degradazione** e' il pezzo interessante: una spell fuori portata parte lo stesso e peggiora,
  non viene rifiutata. Cosa vuol dire concretamente — dispersione, deriva della traiettoria,
  detonazione anticipata, ritorno di fiamma sul caster? Deve essere *leggibile*: chi guarda deve
  capire di aver sbagliato e dove.
- La **ricarica** della riserva: a tempo, o legata a qualcos'altro.

## Output atteso

Le formule e le soglie, con la logica dietro. Alimenta il 06 (la degradazione va resa) e il 10.
