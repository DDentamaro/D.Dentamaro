# Il contratto di rendering

Risultato del ticket 06. Definisce come una composizione diventa immagine sullo schermo.

Questo ticket esiste per rispondere al **rischio-grigio** dichiarato in cartografia: un builder puro
produce resa generica per costruzione, e il pericolo e' un sistema di regole elegante che sullo
schermo fa fango. La risposta sta tutta nella regola del §2.

---

## 1. Il substrato

Ogni immagine e' **un campo di particelle istanziate**, emesse da un punto davanti alla camera
(nessun caster a schermo), mosse da un modello di forze, ombreggiate dall'uber-shader della materia.

Un solo substrato per tutto. Le forme non esistono come oggetti: **emergono dal moto**.

Le sei qualita' del ticket 04 sono **sei termini della stessa equazione di moto**:

| Qualita' | Termine |
|---|---|
| **direzione** (vettore) | asse di emissione e velocita' iniziale |
| **convergenza ↔ dispersione** | segno della forza radiale rispetto all'asse |
| **forza ↔ cedevolezza** | massa: tiene la linea, oppure si lascia deviare e arriccia |
| **durata ↔ istantaneita'** | vita della particella |
| **stabilita'** | ampiezza del rumore sul moto |
| **levitazione** | moltiplicatore di gravita' |

Sei qualita', sei termini, nessun residuo. E' la conferma che il vocabolario del 04 era della
dimensione giusta: se una qualita' non avesse avuto un termine, sarebbe stata decorazione.

## 2. La regola anti-fango

**Le qualita' muovono. La materia dipinge. Non si scambiano mai di ruolo.**

- Nessuna qualita' tocca il colore, l'alfa o la dimensione. Solo posizione e velocita'.
- Nessuna materia tocca il moto. Solo palette, curva d'alfa e curva di dimensione, tutte in
  funzione dell'**eta' normalizzata** della particella.

Da qui la risposta alla domanda «come compongono i contributi senza diventare fango»: **compongono
in spazi diversi**. Il moto si somma — le forze si sommano, ed e' cio' che le forze fanno. L'aspetto
non si compone affatto: una materia, un look, deciso a mano.

E' anche il motivo per cui quattro uber-shader bastano: uno shader deve sapere dipingere *una*
materia, non prevedere le combinazioni. La combinatoria vive tutta nella simulazione, che e'
aritmetica, non pixel.

## 3. Il contratto, in due direzioni

**La simulazione garantisce allo shader**, per particella: posizione, velocita', **eta'
normalizzata** in `[0,1]`, e **coerenza** in `[0,1]` (la nitidezza dell'immagine, propagata alla
particella).

**Lo shader garantisce alla simulazione**: dipinge qualunque particella, per qualunque valore dei
parametri, senza uscire dalla palette della sua materia e senza superare il proprio budget d'alfa.
Non ha diritto di veto: non esiste una combinazione che lo shader possa rifiutare.

La `coerenza` e' l'unico canale visivo globale ed e' dedicata a una cosa sola: **la nitidezza del
bordo della particella**. Immagini nitide hanno bordi netti, immagini sfocate hanno bordi
sbavati e smussati. Cosi' la nitidezza si legge a colpo d'occhio, senza un numero in un angolo.

## 4. Il budget, verificato

Dal ticket 03: 2,8M frammenti trasparenti per frame (4x overdraw a cap DPR 1,5), 30 draw call,
un solo passo full-screen.

| Lato particella | Area | Particelle nel budget |
|---:|---:|---:|
| 16 px | 256 | 10.937 |
| 24 px | 576 | 4.861 |
| 32 px | 1.024 | 2.734 |
| 48 px | 2.304 | 1.215 |
| 64 px | 4.096 | 683 |

**Tetto: 2.000 particelle attive, lato medio massimo 37 px.** Il prodotto `numero × area` e' il
vincolo vero, non il conteggio — come stabilito dal 03. La simulazione **rimpicciolisce le
particelle quando il numero sale**, cosi' il budget e' rispettato per costruzione invece che sperato.

Draw call: una istanziata per immagine attiva, piu' suolo, bersaglio e i quattro passi di bloom a
1/4. **Sette-dieci per frame**, contro un budget di 30. Larghissimo margine.

## 5. Rendere la degradazione

Regola dichiarata in cartografia: **un fallimento deve essere bello quanto un successo**, o nessuno
sperimentera'. Cinque stati, cinque letture distinte.

| Stato | Come si vede |
|---|---|
| **pulita** | particelle strette sull'asse, bordi netti, palette satura |
| **deriva** | l'asse di emissione e' scartato, e un **asse fantasma** tenue mostra dove *volevi* tirare. E' il dispositivo di leggibilita': vedi l'errore, non solo il risultato sbagliato |
| **inversione spontanea** | pulsazione cromatica breve nell'istante del ribaltamento, poi il moto fa visibilmente l'opposto |
| **instabilita'** | le vite si sfrangiano: la scia si spegne a chiazze, guizza e riprende |
| **collasso** | l'emissione si rovescia verso l'origine, lampo a schermo nel colore della materia, scossa di camera |

L'**asse fantasma** della deriva e' il pezzo che conta: senza, una spell che sbaglia bersaglio e' solo
una spell che sembra mirata male. Con, e' il sistema che ti dice *quanto* hai sbagliato e da che
parte.

## 6. Cosa resta fuori

- **Volumetrica raymarchata**: esclusa dal 03. Le materie densi — fuoco, in particolare — si fanno
  con billboard morbidi e rumore procedurale a una o due ottave.
- **Piu' di un passo full-screen**: il bloom se lo prende tutto. Distorsione e aberrazione, se mai
  serviranno, vanno infilate dentro quel passo o dentro l'uber-shader.

---

## Passa al 11

La demo verticale rende **una** materia, ma deve mostrare **tutti e cinque** gli stati di
degradazione: sono la parte del contratto che nessun documento puo' validare. Serve anche il
contatore di frame time, per verificare il tetto delle 2.000 particelle su hardware vero.

## Passa al 08

Il bersaglio deve reagire visivamente all'arrivo senza essere reattivo: l'arena e' inerte per
decisione di cartografia, ma un impatto che non lascia segno rende impossibile giudicare una spell.
