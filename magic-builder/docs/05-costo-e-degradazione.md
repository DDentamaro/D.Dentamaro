# Costo del mana e degradazione

Risultato del ticket 05. Definisce quanto costa un'immagine e cosa succede quando eccede il
controllo.

Principio che guida tutto: **due limiti, due valute, nessuna sovrapposizione.** Il mana paga
l'intensita', il controllo paga la complessita'. Si toccano in un punto solo — la carica.

---

## 1. Le costanti

| Grandezza | Valore | Nota |
|---|---:|---|
| Riserva di mana | 100 | punti |
| Ricarica | 12/s | riserva piena da vuoto in 8,3 s |
| Drenaggio in carica | 30/s | carica piena in 3,3 s |
| Controllo | 6 | costante: la progressione e' fuori scope |

## 2. Intensita': rendimenti decrescenti

Il mana si versa a ritmo costante — `mana = 30 × t` — ma l'effetto cresce con la **radice**:

```
intensita' = sqrt(mana / 100)
```

| Tieni premuto | Mana | Intensita' |
|---:|---:|---:|
| 0,25 s | 7,5 | 0,27 |
| 0,50 s | 15 | 0,39 |
| 1,00 s | 30 | 0,55 |
| 1,67 s | 50 | 0,71 |
| 2,50 s | 75 | 0,87 |
| 3,33 s | 100 | 1,00 |

Raddoppiare la potenza costa **quattro volte** il mana. Serve a rendere «quanto tengo premuto» una
decisione invece di uno slider: la prima mezza pressione rende molto, l'ultima quasi niente.

## 3. Complessita': il carico sul controllo

La complessita' **non costa mana**. Costa controllo, ed e' la seconda valuta.

Ogni qualita' pesa secondo la sua **classe** — che e' la tipizzazione del ticket 04 che paga di
nuovo, qui nel costo:

| Classe | Carico | Perche' |
|---|---:|---|
| Direzionale | 3 | espone un vettore: due gradi di liberta' da tenere |
| Semi-direzionale | 2 | un verso da tenere |
| Non-direzionale | 1 | c'e' o non c'e' |

```
carico    = somma dei carichi delle qualita' attive
nitidezza = min(controllo / carico, 1)
```

| Composizione | Carico | Nitidezza |
|---|---:|---:|
| solo direzione | 3 | 1,00 |
| direzione + 1 non-direzionale | 4 | 1,00 |
| direzione + 1 semi + 1 non-dir | 6 | 1,00 |
| tre semi-direzionali | 6 | 1,00 |
| direzione + tre semi | 9 | 0,67 |
| tutte e sei | 11 | 0,55 |

Sotto carico 6 l'immagine e' perfetta; sopra, si sfoca. **Non si blocca mai.**

Nota di progetto: con tutte e sei le qualita' la nitidezza si ferma a 0,55, quindi la soglia di
collasso (§5) **non si raggiunge per complessita' da sola**. Ci si arriva solo impilando tutto *e*
svuotando la riserva. Il fallimento peggiore va guadagnato.

## 4. Lo sforzo: dove le due valute si toccano

Sotto il **20% di riserva** l'immagine risente dello sforzo:

```
sforzo    = 0.5 + 0.5 × min(riserva / 20, 1)
nitidezza = min(controllo / carico, 1) × sforzo
```

A riserva vuota la nitidezza e' dimezzata. E' l'unico punto in cui mana e controllo si parlano, ed e'
voluto: tenere premuto fino all'ultima goccia deve costare qualcosa oltre al mana.

Risolve anche la domanda lasciata aperta dal ticket 04 — cosa succede se la carica supera il mana
residuo. Risposta: **la carica si ferma a zero** e l'immagine parte con quel che ha, ma l'ultimo
tratto e' stato pagato in nitidezza.

## 5. La degradazione: le tue qualita' che si comportano male

Il pezzo di progetto di questo ticket. La degradazione **non e' rumore generico**: corrompe
esattamente le qualita' che stai tenendo, ognuna nel proprio idioma. Cosi' e' leggibile — vedi cosa
e' andato storto e capisci perche'.

| Nitidezza | Cosa accade |
|---|---|
| 1,00 | l'immagine e' quella che volevi |
| 0,65 – 0,99 | **deriva**: la direzionale scarta. Errore ∝ (1 − nitidezza) × durata della carica |
| 0,45 – 0,65 | **inversione spontanea**: una semi-direzionale puo' ribaltarsi. Volevi convergenza, esce dispersione |
| 0,35 – 0,45 | **instabilita'**: la durata si accorcia a caso, l'immagine puo' spegnersi prima |
| < 0,35 | **collasso**: al rilascio l'immagine cede addosso a chi lancia |

Il gradino centrale e' quello che rende il sistema suo: **l'inversione, che nel ticket 04 e' un
operatore che l'utente controlla, in degradazione diventa qualcosa che gli succede addosso.** Lo
stesso meccanismo, letto al contrario.

E la deriva scala con la durata della carica: **un'immagine sfocata tenuta a lungo devia di piu'.**
Cosi' la carica smette di essere uno slider e diventa una scommessa — piu' potenza contro piu'
errore accumulato.

## 6. Cosa non costa

Il **nucleo** e' neutro: le quattro materie costano uguale. Le differenze sono di comportamento e di
resa, non di prezzo. Bilanciarle per materia e' un'ottimizzazione da fare quando ci sara' qualcosa
da bilanciare — non ora.

---

## Passa al 06

Cinque stati da rendere visibilmente distinti, e il ticket 11 li provera' tutti:
deriva, inversione spontanea, instabilita', collasso, piu' l'immagine pulita. La regola
dichiarata in cartografia vale qui: **un fallimento deve essere bello quanto un successo**, o
nessuno sperimentera'.

## Passa al 11

I numeri di questa pagina sono **da tarare col pollice**, non da difendere. In particolare: 3,3 s di
carica piena e 8,3 s di ricarica completa sono la prima ipotesi. Il ticket 11 esiste anche per
smentirli.
