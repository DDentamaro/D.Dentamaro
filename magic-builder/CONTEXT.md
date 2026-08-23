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

## Qualita'

I modificatori dell'immagine, sei. Traducono i **segni** di WHA.

Sono **tipizzate**: la classe decide cosa la qualita' espone, e da li' discendono il controllo che
la presenta, il costo che la calcola e la uniform che la rende.

- **Direzionale** — espone un vettore, angolo e intensita': *direzione*
- **Semi-direzionale** — invertibile, senza direzione propria: *convergenza ↔ dispersione*,
  *forza ↔ cedevolezza*, *durata ↔ istantaneita'*
- **Non-direzionale** — presente o assente: *stabilita'*, *levitazione*

Non esiste una qualita' "forma": la forma **emerge** da direzione, convergenza e levitazione
applicate al nucleo.

## Inversione

Il ribaltamento di una qualita' semi-direzionale, che ne inverte la funzione. Da WHA, dove
ribaltare un segno inverte cio' che fa. Raddoppia il vocabolario senza allungarlo.

## Carica

Il rilascio dell'immagine: si tiene premuto, e la durata della pressione **e'** il mana investito.
Traduce l'**anello** di WHA, che chiudendosi attiva il glifo.

Rimette il costo temporale dove il canone di MT lo teneva — li' il rango si pagava in lunghezza del
canto.

## Mana

Riserva finita che alimenta l'immagine. Limita l'**intensita'** e si spende caricando. Non e' una
statistica che cresce: la progressione e' fuori scope.

## Controllo

Quanto nitida si tiene l'immagine. Limita la **complessita'** — quante qualita' si reggono insieme.
Distinto dal mana: si puo' avere molta riserva e poca tenuta.

## Degradazione

Cosa accade a un'immagine che eccede il controllo: **si sfoca**, e la spell esce storta invece di
essere rifiutata. Canonica in WHA, dove combinare male produce risultati catastrofici; in MT non
c'era.

## Materia derivata

Materia ottenuta combinando due nuclei — vapore, fango, fulmine. Prevista, non ancora definita:
dipende da come rendiamo le quattro di base. In nebbia, non fuori scope.
