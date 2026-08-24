# 07 — Layout orizzontale dell'editor

Type: prototype (declassato ad AFK — vedi Notes della mappa)
Status: resolved
Blocked by: 04

## Question

Che forma ha l'editor su un telefono in orizzontale, due mani?

Deve far coesistere sullo stesso schermo la catena di stadi (che va *vista* come catena), la
riserva di mana, e l'arena in cui guardi il risultato. I pollici stanno ai bordi: il centro dello
schermo e' guardabile ma scomodo da toccare.

Da risolvere con un prototipo buttabile, non con un ragionamento: un artefatto ruvido su cui
reagire vale piu' di una descrizione.

## Output atteso

Un prototipo HTML buttabile del layout, senza rendering vero (rettangoli colorati bastano), linkato
da questo ticket. Non e' il file finale.

## Answer

Risolto **costruendolo**, non descrivendolo: il prototipo e' la demo del ticket 11, e la risposta e'
stata trovata misurando quanti controlli entrano davvero.

### La struttura

**Arena a sinistra, pannello a destra.** Il pollice sinistro preme nell'arena per evocare, il destro
compone: le due mani fanno cose diverse e non si contendono lo schermo. Il gesto di lancio sta
nell'arena e non su un pulsante, cosi' il punto in cui premi e' anche il punto da cui parte.

Il pannello, dall'alto: **selettore di materia** (quattro pulsanti in riga), **gli otto assi**,
**le letture** con dose, stato e serbatoio ancorate in basso — sempre visibili mentre muovi un
cursore, che e' esattamente quando servono.

### Due colonne, e il perche' e' misurato

| Layout | Assi visibili su 390px (Galaxy S23) |
|---|---:|
| riga alta, colonna singola *(primo tentativo)* | 3 su 8 |
| riga compatta, colonna singola | 4 su 8 |
| **due colonne** | **8 su 8, nessuno scroll** |

**Otto assi in colonna singola non entrano in un telefono orizzontale.** Non e' una questione di
compattare le righe: intestazione e blocco letture si mangiano 249px dei 390 disponibili, e restano
141px, cioe' quattro righe. La colonna singola e' esclusa dall'aritmetica, non dal gusto.

Due colonne risolvono perche' **vedere la formula intera e' il punto del builder**: se devi scorrere
per sapere cosa hai composto, la catena smette di essere leggibile e tanto vale una lista.

Su un telefono da 360px di altezza ne restano visibili 6 e scorre di poco: accettabile, e sotto quella
soglia non ci sono telefoni di generazione corrente.

### Altre decisioni

- **La dose non e' un asse** e non sta nella lista: vive col blocco delle letture, separata da una
  riga. E' l'unico controllo che merita larghezza piena.
- **Le letture su due colonne** (carico/evocazione, mana/dose max): dimezzano l'altezza del blocco,
  che e' cio' che ha liberato lo spazio per la quarta riga di assi.
- **Ogni asse mostra il proprio valore di riposo** quando non e' impostato, non uno zero: cosi' si
  legge il carattere della materia senza aprire documentazione, e si vede *cosa cambia* scegliendo.
- **La classe genera il controllo**, come previsto dal 04: la direzionale parte da 0, le altre da −1.

**Alternative scartate**: schede o accordion per gruppi di assi (nascondono la formula, che e' il
contrario dello scopo); righe da 20px per farne entrare nove (sotto la soglia del pollice);
pannello a comparsa sull'arena (copre proprio cio' che stai guardando).
