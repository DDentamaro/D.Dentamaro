# Costo dell'evocazione e degradazione

Risultato del ticket 05, **riscritto** dopo il ripensamento sulla carica. La versione precedente
trattava la pressione come un moltiplicatore continuo di potenza ed e' stata scartata.

**Non esiste nessun moltiplicatore di potenza.** Un proiettile, una palla di fuoco e un meteorite
non sono la stessa spell a tre volumi: sono tre formule diverse, con tre prezzi in tempo diversi.

---

## 1. Le tre regole

1. La **complessita' della formula** determina il **tempo di evocazione**.
2. Il **serbatoio di mana si svuota mentre evochi**, a ritmo costante.
3. Oltre la soglia di **controllo**, la formula **degrada**.

La 2 e' il punto in cui il modello si semplifica: il costo in mana non e' una formula da calcolare,
e' una conseguenza. Evochi piu' a lungo, spendi di piu'. Nient'altro da bilanciare.

## 2. Le costanti

| Grandezza | Valore |
|---|---|
| Serbatoio | 100 |
| Ricarica | 12/s |
| Drenaggio durante l'evocazione | 30/s |
| Controllo | 7 |
| Tempo di evocazione | `carico² / 40` secondi |

Il **carico** e' la complessita', pesata per classe della qualita' (ticket 04): direzionale 3,
semi-direzionale 2, non-direzionale 1.

Il tempo cresce col **quadrato** del carico, non linearmente: la complessita' si compone, non si
somma. E' quel che fa stare nella stessa scala un tap e tre secondi.

## 3. La tabella

| Carico | Tempo | Mana | Lanci col serbatoio pieno | Nitidezza | Stato |
|---:|---:|---:|---:|---:|---|
| 2 | 0,10 s | 3 | 33 | 1,00 | pulita |
| 3 | 0,23 s | 7 | 14 | 1,00 | pulita |
| 4 | 0,40 s | 12 | 8 | 1,00 | pulita |
| 5 | 0,62 s | 19 | 5 | 1,00 | pulita |
| 6 | 0,90 s | 27 | 3 | 1,00 | pulita |
| 7 | 1,23 s | 37 | 2 | 1,00 | pulita |
| 8 | 1,60 s | 48 | 2 | 0,88 | deriva |
| 9 | 2,02 s | 61 | 1 | 0,78 | deriva |
| 10 | 2,50 s | 75 | 1 | 0,70 | inversione spontanea |
| 11 | 3,02 s | 91 | 1 | 0,64 | inversione spontanea |

### Taratura contro l'esempio che ha originato il modello

| Spell | Formula | Carico | Tempo |
|---|---|---:|---:|
| **Proiettile** | direzione | 3 | **0,23 s** — un tap |
| **Palla di fuoco** | direzione + dispersione + durata | 7 | **1,23 s** |
| **Meteorite** | tutte e sei | 11 | **3,02 s** |

Tap, un secondo, tre secondi. La formula `carico²/40` non e' stata scelta e poi giustificata: e'
stata calibrata su questi tre numeri e ci cade sopra.

## 4. Perche' il controllo vale 7 e non 6

Con controllo 6 la palla di fuoco sarebbe nata gia' degradata, e una palla di fuoco dev'essere pane
quotidiano. A **7**, tutte le formule fino a carico 7 escono pulite — cioe' la grande maggioranza —
e degradano solo le tre o quattro piu' cariche.

E' la traduzione fedele della decisione presa in conversazione: **il tempo lo paghi sempre, la
degradazione la rischi solo se strafai.**

Conseguenza voluta: il **meteorite non viene mai perfetto**. Usare tutte e sei le qualita' insieme
sta oltre quel che si tiene nitido, sempre. La spell piu' grande e' anche quella che non ti obbedisce
del tutto.

## 5. La degradazione

Invariata nella sostanza rispetto alla prima stesura: **non e' rumore generico, corrompe le qualita'
che stai tenendo, ognuna nel proprio idioma.** Cambiano solo le soglie, ora ancorate al carico.

| Stato | Innesco | Cosa accade |
|---|---|---|
| **pulita** | carico ≤ 7 | la formula e' quella che volevi |
| **deriva** | carico 8–9 | la direzionale scarta. Un **asse fantasma** mostra dove volevi tirare |
| **inversione spontanea** | carico 10–11 | una semi-direzionale si ribalta: volevi convergenza, esce dispersione |
| **collasso** | **il serbatoio si esaurisce a meta' evocazione** | la formula cede addosso a chi lancia |

Il **collasso** ha ora un innesco tutto suo, ed e' la parte migliore del modello: non dipende dalla
complessita' ma dal serbatoio. **La stessa formula e' sicura a serbatoio pieno e letale a serbatoio
basso.**

| Serbatoio | Carico massimo portabile a termine |
|---:|---:|
| 100 | 11 |
| 60 | 8 |
| 40 | 7 |
| 25 | 5 |

Da qui la tensione dell'evocazione: due barre che corrono: l'anello che si chiude e il serbatoio che
cala. Il mana smette di essere contabilita' e diventa una decisione.

Lo stato **instabilita'** della prima stesura e' stato eliminato: con soli sei qualita' la fascia
non e' raggiungibile, e uno stato irraggiungibile e' peso morto.

## 6. Rilascio anticipato

Stacchi il dito prima della fine: **non parte niente, e il mana speso torna.** Deciso per tenere il
sistema semplice; l'alternativa (esce la versione parziale con le sole qualita' gia' evocate) resta
un'idea valida ma costa complessita' che oggi non serve.

---

## Passa al 06

Gli stati resi diventano **quattro**, non cinque: pulita, deriva, inversione spontanea, collasso.
L'asse fantasma resta il dispositivo di leggibilita' della deriva.

## Passa al 11

Da tarare col pollice, non da difendere: `carico²/40`, il drenaggio a 30/s e la ricarica a 12/s.
La domanda della demo non e' piu' «quanto e' lunga la pressione giusta» — quella era la domanda del
modello scartato — ma **se tap / 1 s / 3 s si sentono come tre spell diverse invece che come tre
attese diverse**.
