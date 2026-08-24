# 05 — Costo del mana e modello di controllo/degradazione

Type: grilling (declassato ad AFK — vedi Notes della mappa)
Status: resolved
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

## Answer

Risolto. Modello completo in
[`magic-builder/docs/05-costo-e-degradazione.md`](../../../magic-builder/docs/05-costo-e-degradazione.md).

**Principio: due limiti, due valute, nessuna sovrapposizione.** Il mana paga l'intensita', il
controllo paga la complessita'. Si toccano in un punto solo, lo sforzo a riserva bassa.

### Costanti

Riserva 100 · ricarica 12/s (piena da vuoto in 8,3 s) · drenaggio in carica 30/s (carica piena in
3,3 s) · controllo 6, costante perche' la progressione e' fuori scope.

### Intensita': rendimenti decrescenti

`mana = 30 × t`, ma `intensita' = sqrt(mana/100)`. Raddoppiare la potenza costa **quattro volte** il
mana. Serve a rendere «quanto tengo premuto» una decisione e non uno slider: la prima mezza
pressione rende molto, l'ultima quasi niente.

### Complessita': carico sul controllo

Non costa mana. Ogni qualita' pesa secondo la **classe** — direzionale 3, semi-direzionale 2,
non-direzionale 1 — ed e' la tipizzazione del 04 che paga una terza volta, qui nel costo.

`nitidezza = min(controllo / carico, 1)`. Sotto carico 6 l'immagine e' perfetta, sopra si sfoca, e
**non si blocca mai**.

### La degradazione corrompe le qualita' che stai tenendo

E' il pezzo di progetto del ticket: non rumore generico, ma ogni qualita' che si comporta male nel
proprio idioma, quindi leggibile.

| Nitidezza | Cosa accade |
|---|---|
| 1,00 | l'immagine e' quella che volevi |
| 0,65–0,99 | **deriva**: la direzionale scarta, errore ∝ (1−nitidezza) × durata carica |
| 0,45–0,65 | **inversione spontanea**: una semi-direzionale si ribalta |
| 0,35–0,45 | **instabilita'**: la durata si accorcia a caso |
| < 0,35 | **collasso**: al rilascio l'immagine cede addosso a chi lancia |

Il gradino centrale e' quello che rende il sistema suo: **l'inversione, che nel 04 e' un operatore
che l'utente controlla, in degradazione diventa qualcosa che gli succede addosso.** Stesso
meccanismo letto al contrario.

E la deriva scala con la durata della carica: un'immagine sfocata tenuta a lungo devia di piu'.
La carica smette di essere uno slider e diventa una scommessa.

### Proprieta' verificata coi numeri

Con tutte e sei le qualita' il carico e' 11 e la nitidezza si ferma a **0,55**: la soglia di
collasso non si raggiunge per complessita' da sola. Ci si arriva solo impilando tutto **e**
svuotando la riserva. Il fallimento peggiore va guadagnato.

### Chiude la domanda lasciata aperta dal 04

Cosa succede se la carica supera il mana residuo: sotto il 20% di riserva subentra lo **sforzo**
(`0.5 + 0.5 × min(riserva/20, 1)`), che moltiplica la nitidezza; a zero la carica si ferma e
l'immagine parte con quel che ha. L'ultimo tratto si paga in nitidezza, non solo in mana.

**Alternative scartate**: costo lineare (nessuna decisione, solo uno slider); la complessita' che
costa mana (avrebbe fuso le due valute e reso il controllo un duplicato); il rifiuto delle immagini
troppo complesse (contraddice la scelta di cartografia di degradare invece di bloccare); il costo
differenziato per materia (nulla da bilanciare finche' non c'e' niente da bilanciare).

**Da tarare, non da difendere**: 3,3 s di carica piena e 8,3 s di ricarica sono prima ipotesi. Il
ticket 11 esiste anche per smentirli col pollice.
