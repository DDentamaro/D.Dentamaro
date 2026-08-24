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

## Answer (seconda stesura)

Risolto **in HITL con l'utente**. La prima stesura trattava la pressione come moltiplicatore
continuo di potenza ed e' stata scartata da lui. Modello in
[`magic-builder/docs/05-costo-e-degradazione.md`](../../../magic-builder/docs/05-costo-e-degradazione.md).

**Non esiste nessun moltiplicatore di potenza.** Proiettile, palla di fuoco e meteorite non sono la
stessa spell a tre volumi: sono tre formule con tre prezzi in tempo diversi.

### Le tre regole

1. La complessita' della formula (**carico**) determina il **tempo di evocazione**: `carico² / 40` s.
2. Il **serbatoio si svuota mentre evochi**, a 30/s. Il costo in mana non e' una formula, e' una
   conseguenza — evochi piu' a lungo, spendi di piu'.
3. Oltre il **controllo** (7) la formula **degrada**.

Il tempo cresce col **quadrato** del carico: la complessita' si compone, non si somma. E' cio' che
fa stare tap e tre secondi nella stessa scala.

### Taratura

| Spell | Formula | Carico | Tempo |
|---|---|---:|---:|
| Proiettile | direzione | 3 | 0,23 s (tap) |
| Palla di fuoco | direzione + dispersione + durata | 7 | 1,23 s |
| Meteorite | tutte e sei | 11 | 3,02 s |

La formula non e' stata scelta e poi giustificata: e' stata calibrata sui tre numeri dell'utente e
ci cade sopra.

### Controllo 7, non 6

Con 6 la palla di fuoco sarebbe nata degradata, e dev'essere pane quotidiano. A 7 tutte le formule
fino a carico 7 escono pulite e degradano solo le piu' cariche — traduzione fedele di «il tempo lo
paghi sempre, la degradazione la rischi solo se strafai».

Conseguenza voluta: **il meteorite non viene mai perfetto.**

### Il collasso ha un innesco tutto suo

Quattro stati, non cinque. `instabilita'` e' eliminato: con sei qualita' la sua fascia non e'
raggiungibile, e uno stato irraggiungibile e' peso morto.

| Stato | Innesco |
|---|---|
| pulita | carico ≤ 7 |
| deriva | carico 8–9 |
| inversione spontanea | carico 10–11 |
| **collasso** | **il serbatoio si esaurisce a meta' evocazione** |

Il collasso non dipende piu' dalla complessita' ma dal serbatoio: **la stessa formula e' sicura a
serbatoio pieno e letale a serbatoio basso**. Da qui la tensione dell'evocazione, due barre che
corrono — l'anello che si chiude e il serbatoio che cala. Il mana smette di essere contabilita'.

### Rilascio anticipato

Non parte niente, mana restituito. Scelta dell'utente per tenere il sistema semplice; l'uscita
parziale resta un'idea valida ma costa complessita' che oggi non serve.

**Alternative scartate**: la potenza regolata dalla pressione (rifiutata dall'utente: e' cio' che ha
riaperto il ticket); il costo in mana per qualita', slegato dal tempo (due numeri da bilanciare per
ogni qualita' invece di zero); il costo fisso per materia; il tempo lineare nel carico (non copre
l'intervallo tap→3 s); nessuna degradazione (la formula massima sarebbe sempre la scelta giusta,
basta pazienza).

**Da tarare, non da difendere**: `carico²/40`, drenaggio 30/s, ricarica 12/s.
