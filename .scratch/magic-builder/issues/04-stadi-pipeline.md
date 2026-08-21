# 04 — Gli stadi della pipeline di plasmatura e i loro operatori

Type: grilling (declassato ad AFK — vedi Notes della mappa)
Status: open
Blocked by: 01

## Question

Di cosa e' fatta una spell? Quali stadi ha la pipeline, quanti sono, e quali operatori vivono in
ciascuno?

L'ipotesi da cui partire, emersa in cartografia: `sorgente di mana → compressione → forma → moto →
interazione → dissipazione`. Va confermata, tagliata o riscritta alla luce del 01.

Vincoli che questa decisione deve rispettare:

- **Pochi stadi, fissi.** E' la risposta al rischio-grigio: se ogni stadio e' un aggancio noto per
  il renderer, i VFX si cesellano *per stadio* invece che per spell.
- Deve reggere su un telefono in orizzontale: una catena che non entra nello schermo non fa vedere
  la catena, e far vedere la catena e' il punto del builder.
- La combinatoria non deve esaurirsi in una serata.

Decide anche il **set di attributi** e a quale stadio appartiene.

## Output atteso

Il vocabolario delle primitive, scritto abbastanza precisamente da poterci costruire sopra il costo
del mana (05) e il contratto di rendering (06). E' la prima voce del `CONTEXT.md` del progetto.
