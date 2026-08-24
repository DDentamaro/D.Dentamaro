# Costo dell'evocazione e degradazione

Risultato del ticket 05, **terza stesura**. Le prime due sono state scartate: la carica come
moltiplicatore continuo di potenza, e il carico come conteggio di qualita' discrete.

**Non esiste nessun moltiplicatore di potenza al lancio.**

---

## 1. Le quattro regole

1. Il **carico** e' la distanza dalla natura della materia.
2. Il carico determina il **tempo di evocazione**.
3. Il **serbatoio si svuota mentre evochi**, a ritmo costante.
4. Oltre il **controllo**, la formula **degrada**.

## 2. Il carico

```
carico = 2 + 3·|direzione| + Σ  peso(asse) · |valore scelto − valore di riposo|
```

Il **2** e' il nucleo: evocare qualcosa costa comunque. Senza, chiedere a una materia esattamente
la propria natura costerebbe zero, quindi tempo zero.

Il resto e' distanza. Assecondare la materia e' economico; combatterla e' caro. E' questa formula a
dare alle quattro materie un'identita' **meccanica** e non solo visiva, senza violare la regola
anti-fango del ticket 06 (le qualita' muovono, la materia dipinge).

## 3. Tempo e mana

```
tempo = carico² / 40   secondi
mana  = 30 per secondo, drenati durante l'evocazione
```

Il costo in mana **non e' una formula da bilanciare**: e' una conseguenza. Evochi piu' a lungo,
spendi di piu'.

Il quadrato e' cio' che fa stare nella stessa scala un tap e cinque secondi. Nel catalogo il carico
va da **3,0** (Vampa nel fuoco: 0,23 s) a **14,3** (Meteorite nel fuoco: 5,1 s).

## 4. La dose

Un moltiplicatore scelto **costruendo** la formula, non lanciandola.

```
tempo effettivo = tempo × dose
mana effettivo  = mana  × dose
potenza         = dose
nitidezza       = min(controllo / (carico × dose), 1)
```

Da cui la regola che governa tutto il bilanciamento:

> **Dose massima pulita = controllo ÷ carico**

Una formula semplice la carichi al doppio e resta precisa; una complessa cede molto prima.
Complessita' e potenza sono in tensione, e il controllo e' il cambio fra le due.

Corollario: **le formule piu' forti si possono eseguire correttamente** — da un mago con piu'
controllo, oppure da chiunque accetti di indebolirle. Un Meteorite al 70% esce perfetto e colpisce
come un Meteorite al 70%.

## 5. La degradazione

Non e' rumore generico: **corrompe gli assi che stai tenendo, ognuno nel proprio idioma.**

| Stato | Innesco | Cosa accade |
|---|---|---|
| **pulita** | carico × dose ≤ controllo | la formula e' quella che volevi |
| **deriva** | nitidezza 0,75–1,00 | la direzionale scarta. Un **asse fantasma** mostra dove volevi tirare |
| **inversione spontanea** | nitidezza 0,45–0,75 | un asse semi-direzionale si ribalta di segno |
| **collasso** | **il serbatoio si esaurisce a meta' evocazione** | la formula cede addosso a chi lancia |

Il **collasso** non dipende dalla complessita' ma dal serbatoio: **la stessa formula e' sicura a
serbatoio pieno e letale a serbatoio basso**. Da qui la tensione dell'evocazione — due barre che
corrono.

## 6. I due attributi fanno lavori diversi

Con il carico che arriva a ~14 (e oltre, combattendo la materia su tutti gli assi), **il serbatoio
torna a essere significativo**:

| Serbatoio | Secondi finanziabili | Carico massimo completabile |
|---:|---:|---:|
| 100 | 3,33 | ~11,5 |
| 200 | 6,67 | ~16 |
| 300 | 10,0 | ~20 |

- Il **serbatoio** decide **cosa riesci a completare**.
- Il **controllo** decide **cosa reggi pulito**.

Nessuno dei due e' ridondante, ed e' la risposta al problema emerso in conversazione: un attributo
che li alzasse entrambi avrebbe due effetti distinti, non uno duplicato.

Conseguenza gratis: **le formule assurde si escludono da sole.** Combattere una materia su tutti gli
assi da' carico ~21, cioe' 11 secondi e 330 di mana. Non serve vietarlo: il serbatoio non lo
finanzia.

## 7. Rilascio anticipato

Stacchi prima della fine: non parte niente, mana restituito.

---

## Da tarare, non da difendere

`carico²/40`, la base 2, il drenaggio a 30/s, la ricarica a 12/s, i pesi degli assi e i valori di
riposo delle materie. Sono la prima ipotesi coerente, non la verita': il ticket 11 esiste per
metterli alla prova col pollice.
