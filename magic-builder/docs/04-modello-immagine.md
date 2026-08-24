# L'immagine: il modello di composizione

Risultato del ticket 04, **terza stesura**. Definisce cosa **e'** una spell in questo progetto.

Sintesi di due fonti: **Witch Hat Atelier** per la grammatica della composizione, **Mushoku Tensei**
per l'atto. **Non si disegna niente**: il glifo e' il modello, non l'interfaccia.

---

## 1. Un'immagine

- **Nucleo** — la materia. Quattro: fuoco, acqua, terra, vento.
- **Assi** — otto grandezze **continue** da −1 a +1 che descrivono il moto.
- **Dose** — quanto mana ci metti, scelto **costruendo**, non lanciando.

Non esiste nessun moltiplicatore di potenza al lancio. Tieni premuto per il tempo che la formula
richiede, e parte.

## 2. Gli otto assi

Continui, non interruttori: **e' da qui che nasce lo spazio infinito di spell**. Le formule con
nome sono punti di riferimento su un continuo, non un catalogo chiuso, e **interpolare fra due
spell salvate e' un'operazione sui numeri**.

| Asse | Classe | Peso | Che cosa fa nel moto |
|---|---|---:|---|
| **direzione** | direzionale | 3 | asse di emissione e velocita' iniziale (vettore) |
| **convergenza ↔ dispersione** | semi | 2 | forza radiale verso l'asse, o via da esso |
| **forza ↔ cedevolezza** | semi | 2 | massa: tiene la linea, o si lascia deviare |
| **durata ↔ istantaneita'** | semi | 2 | vita della particella |
| **rotazione ↔ controrotazione** | semi | 2 | momento angolare attorno all'asse |
| **stabilita'** | non-dir | 1 | ampiezza del rumore sul moto |
| **levitazione ↔ peso** | non-dir | 1 | moltiplicatore di gravita' |
| **ritmo** | non-dir | 1 | emissione continua o a raffiche |

Rotazione e ritmo sono nuovi in questa stesura e coprono buchi veri del modello di moto: **niente
faceva ruotare** (un ciclone girava solo nel nome) e **niente controllava il ritmo di emissione**.

Non esiste un asse "forma": la forma **emerge** da direzione, radiale, rotazione e levitazione.

## 3. I valori di riposo delle materie

Ogni materia porta i propri valori per gli assi che **non** hai impostato. La materia non scavalca
mai una tua scelta: **riempie solo i vuoti**.

| Asse | Fuoco | Acqua | Terra | Vento |
|---|---:|---:|---:|---:|
| convergenza ↔ dispersione | −0,6 | +0,2 | +0,3 | −0,7 |
| forza ↔ cedevolezza | −0,5 | −0,3 | +0,8 | −0,8 |
| durata ↔ istantaneita' | −0,6 | +0,6 | +0,6 | −0,2 |
| rotazione | +0,1 | +0,6 | −0,2 | +0,7 |
| stabilita' | 0,0 | +0,7 | +0,9 | +0,1 |
| levitazione ↔ peso | +0,7 | −0,5 | −0,8 | +0,6 |
| ritmo | +0,8 | −0,3 | 0,0 | +0,4 |

Letti come carattere: il **fuoco** si apre, e' leggero, dura poco, sale e crepita. L'**acqua** tiene
insieme mentre scorre, persiste, gira, cade. La **terra** e' compatta, pesantissima, ferma, resta.
Il **vento** disperde, non pesa, vortica, galleggia.

**I valori di riposo sono gratis**: non pagano carico. La materia ti regala il suo carattere; le
scelte sono cio' che paghi.

## 4. La conseguenza: l'affinita'

Poiche' il costo e' la **distanza** dai valori di riposo (ticket 05), chiedere a una materia cio'
che gia' fa costa poco e combatterne la natura costa caro. La stessa "lancia" — compatta e pesante —
costa **6,8 nella terra** e **12,0 nel vento**.

Su tredici archetipi, l'affinita' si distribuisce: terra 4, vento 4, fuoco 3, acqua 3. Nessuna
materia e' universalmente migliore, e nessuna e' neutra.

## 5. Conseguenza per il rendering

Assi continui significa **uniform continue, zero rami** nell'uber-shader: piu' semplice della
versione discreta, non piu' complessa. Restano quattro programmi, uno per materia.

## Passa al 07

Serve un controllo a vettore per la direzionale, quattro cursori bipolari per le semi-direzionali,
tre cursori unipolari per le non-direzionali, piu' la dose. La **classe genera il controllo**.

## Passa al 09

`{ nucleo, assi: {nome: valore}, dose }`. Solo gli assi impostati vengono serializzati: gli altri
sono i valori di riposo, che dipendono dal nucleo.
