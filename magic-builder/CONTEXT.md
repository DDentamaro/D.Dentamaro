# CONTEXT — Magic Builder

Glossario del progetto. Solo termini di dominio: nessun dettaglio implementativo.

Vive qui e non nella radice del repo perche' la radice appartiene a un quaderno di esercizi Java —
deviazione consapevole da `docs/agents/domain.md`, che prescriverebbe `CONTEXT.md` alla radice.

Il modello nasce da due fonti: **Witch Hat Atelier** per la grammatica della composizione,
**Mushoku Tensei** per l'atto che la esegue. Nessuna delle due da sola bastava.

## Immagine

L'unita' componibile: cio' che l'utente costruisce e lancia. Fatta di **nucleo**, **qualita'** e
**carica**.

Il nome viene da MT, dove il canto silenzioso si esegue tenendo un'immagine mentale invece di
pronunciare parole. Non si disegna: il glifo di WHA e' il modello, non l'interfaccia.

## Nucleo

La materia dell'immagine. Quattro: **fuoco, acqua, terra, vento**. Una sola per immagine.

Traduce il **sigillo** di WHA, che sta al centro del glifo e ne definisce l'elemento. Le materie
derivate dalle combinazioni sono previste ma non ancora definite.

## Assi

Le otto grandezze **continue** (−1..+1) che descrivono il moto dell'immagine. Traducono i **segni**
di Witch Hat Atelier.

Sono **tipizzati**: la classe decide il peso nel carico e la forma del controllo che lo presenta.

- **Direzionale** (peso 3) — un vettore: *direzione*
- **Semi-direzionali** (peso 2), bipolari — *convergenza ↔ dispersione*, *forza ↔ cedevolezza*,
  *durata ↔ istantaneita'*, *rotazione ↔ controrotazione*
- **Non-direzionali** (peso 1) — *stabilita'*, *levitazione ↔ peso*, *ritmo*

Continui e non discreti: e' da qui che nasce lo spazio infinito di spell. Le formule con nome sono
punti di riferimento, e interpolare fra due spell salvate e' un'operazione sui numeri.

Non esiste un asse "forma": la forma **emerge**.

## Inversione

Il ribaltamento di una qualita' semi-direzionale, che ne inverte la funzione. Da WHA, dove
ribaltare un segno inverte cio' che fa. Raddoppia il vocabolario senza allungarlo.

## Evocazione

Il tempo che una formula impiega a uscire: `carico² / 40` secondi, moltiplicato per la dose. Si
tiene premuto per quel tempo e parte. **Nessun moltiplicatore di potenza**: tenere oltre non fa
nulla, e staccare prima annulla.

Traduce l'**anello** di WHA, che chiudendosi attiva il glifo, e rimette il costo temporale dove il
canone di MT lo teneva — li' il rango si pagava in lunghezza del canto.

## Mana

Il serbatoio. Si svuota mentre evochi, a ritmo costante — quindi il costo non e' una formula, e' una
conseguenza. Decide **cosa riesci a completare**: se finisce a meta' evocazione, la formula
collassa. Non e' una
statistica che cresce: la progressione e' fuori scope.

## Controllo

Quanto nitida si tiene l'immagine. Decide **cosa reggi pulito**: `nitidezza = controllo / (carico ×
dose)`. Distinto dal mana, e con un lavoro diverso — il serbatoio dice cosa completi, il controllo
cosa non degrada.

## Degradazione

Cosa accade a un'immagine che eccede il controllo: **si sfoca**, e la spell esce storta invece di
essere rifiutata. Canonica in WHA, dove combinare male produce risultati catastrofici; in MT non
c'era.

## Materia derivata

Materia ottenuta combinando due nuclei — vapore, fango, fulmine. Prevista, non ancora definita:
dipende da come rendiamo le quattro di base. In nebbia, non fuori scope.

## Carico

La **distanza dalla natura della materia**, e quindi il prezzo della formula:

    carico = 2 + 3·|direzione| + Σ peso · |valore scelto − valore di riposo|

Assecondare la materia e' economico, combatterla e' caro.

## Valori di riposo

I valori che ogni materia assume sugli assi che **non** hai impostato. La materia non scavalca mai
una scelta: riempie solo i vuoti. **Sono gratis** — non pagano carico. La materia regala il suo
carattere; le scelte sono cio' che paghi.

## Affinita'

La conseguenza dei valori di riposo: la stessa formula costa meno nella materia che gia' la fa da
se'. Una "lancia" compatta e pesante costa 6,8 nella terra e 12,0 nel vento.

## Dose

Il moltiplicatore di mana scelto **costruendo** la formula, non lanciandola. Moltiplica tempo, mana,
potenza e carico effettivo. Da cui: **dose massima pulita = controllo ÷ carico**.

## Nitidezza

Quanto l'immagine e' fedele a cio' che volevi: `min(controllo / carico, 1)`, ridotta dallo
**sforzo** quando la riserva e' bassa. A 1 l'immagine e' quella pensata; scendendo, degrada.

## Sforzo

La penalita' di nitidezza che subentra sotto il 20% di riserva. E' l'unico punto in cui mana e
controllo si parlano: tenere premuto fino all'ultima goccia costa qualcosa oltre al mana.

## Coerenza

La nitidezza dell'immagine propagata alla singola particella, in `[0,1]`. E' l'unico canale visivo
globale del rendering e governa una cosa sola: **la nitidezza del bordo**. Bordi netti = immagine
fedele, bordi sbavati = immagine degradata.

## Asse fantasma

La traccia tenue che, quando l'immagine deriva, mostra dove **volevi** tirare. Senza, una spell che
sbaglia bersaglio sembra solo mirata male; con, si legge quanto e da che parte si e' sbagliato.
