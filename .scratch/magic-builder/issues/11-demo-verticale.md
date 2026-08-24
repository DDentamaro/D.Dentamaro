# 11 — Demo verticale

Type: prototype (HITL — l'utente deve tenerla in mano e reagire)
Status: resolved
Blocked by: 05, 06

## Question

Il budget del ticket 03 regge su hardware vero, e la carica si sente bene sotto il dito?

Due domande aperte che nessun documento chiude:

1. **Il budget del 03 non e' verificato.** Dichiarato nel ticket stesso: in sessione non esiste una
   GPU Android, Chromium rasterizza via software, quindi cap DPR, overdraw e draw call sono
   aritmetica e linee guida ARM/Qualcomm, non misure. L'unico strumento che li verifica e' un
   telefono Android con del codice sopra.
2. **La durata giusta della carica.** Mezzo secondo e' nulla, tre secondi sono un'eternita'. E' una
   domanda che si risponde col pollice, non ragionando.

## Cosa costruire

Una **fetta verticale**, non il builder: il minimo che attraversi tutto lo stack, dal modello
dell'immagine al pixel.

- **Una** materia, col suo uber-shader
- La **carica** a pressione, con il mana che scende
- Due o tre **qualita'**, scelte per coprire classi diverse: la direzionale, una semi-direzionale
  invertibile, una non-direzionale — servono a provare che la tipizzazione regge davvero
- Un **bersaglio inerte** e nient'altro nell'arena
- Un **contatore di frame time** visibile, perche' la misura e' meta' dello scopo

Fuori: le altre tre materie, il salvataggio, il layout definitivo, il verdetto del poligono.

## Perche' esiste prima del 10

Costruire cinque decisioni sopra un budget non verificato e' il modo di scoprire al ticket 10 che
una premessa era sbagliata. Questo ticket sposta la scoperta all'inizio.

Ne consegue che **07, 08 e 09 escono dalla strada critica**: si lavorano dopo la demo, sapendo gia'
cosa funziona.

## Definizione di fatto

Gira sul telefono Android dell'utente, aperta da `file://`, e produce due risposte: un numero di
frame time reale contro il budget del 03, e un giudizio dell'utente sulla durata della carica.

## Nota (ripensamento sulla carica)

**In attesa del 05 riaperto.** La demo avrebbe testato «quanto e' lunga la pressione giusta», che
era la domanda del modello vecchio. Con il tempo di evocazione come proprieta' della spell, la
domanda diventa un'altra: **quali soglie temporali si sentono giuste** per tap / 1 s / 3 s.

## Sbloccato (05 seconda stesura)

La domanda della demo cambia. Non piu' «quanto e' lunga la pressione giusta» — era la domanda del
modello scartato — ma: **tap / 1 s / 3 s si sentono come tre spell diverse, o come tre attese
diverse?** Se e' la seconda, il modello e' sbagliato a monte.

Da provare anche il collasso: avviare una formula che il serbatoio non regge, e vedere le due barre
correre.

## Answer

Costruita: [`magic-builder/index.html`](../../../magic-builder/index.html). **23 KB, un file, zero
dipendenze, zero asset, uno `<script>` classico**, aperto da `file://`.

Piu' larga di una fetta verticale perche' il modello lo permetteva: tutte e **quattro le materie**
(sono differenze di uniform e valori di riposo, non di codice), tutti e **otto gli assi continui**,
la **dose**, il calcolo dal vivo di carico / tempo / mana / dose massima pulita, la pressione di
evocazione con anello e serbatoio che corrono, i **quattro stati** di degradazione, origine e
bersaglio, contatore di frame time.

Un solo programma shader, la composizione entra come uniform: **zero compilazioni a runtime**, come
impone il ticket 03. Cap sul devicePixelRatio a 1,5. 2.000 particelle istanziate, una draw call.

### Verificato eseguendolo, non leggendolo

Chromium headless, viewport 844x390:

| Caso | Esito |
|---|---|
| formula pulita (direzione sola) | carico 5,0 · 0,63 s · dose max 140% · **6,4% di pixel resi**, verdetto `pulita` |
| formula che degrada | carico 11,2 · 3,14 s · dose max 63% · **5,7% di pixel**, verdetto `inversione spontanea` |
| collasso | serbatoio 56% → 25% → 7% → 0, poi verdetto `collasso` e implosione sull'origine |
| rilascio anticipato | non parte nulla, verdetto invariato, mana restituito |

### Tre bug trovati eseguendo

1. **`readPixels` fuori dal frame legge un buffer gia' scartato** — la prima sonda dava zero pixel
   su un rendering che funzionava. Risolto forzando `preserveDrawingBuffer` solo nel test, non
   nell'app.
2. **Le particelle leggevano come bokeh**, cerchi distinti invece che materia: erano troppo grandi e
   troppo poche. Da 1400 a 2000, dimensione da 0,055 a 0,013.
3. **Il collasso volava all'indietro e usciva dal bordo.** Sbagliato concettualmente: un collasso non
   e' la spell al contrario, e' la spell che **cede addosso**. Ora implode sull'origine con
   convergenza piena e rotazione.

### La domanda del ticket resta senza risposta

Il budget del ticket 03 **non e' ancora verificato**: qui Chromium rasterizza via software e dava
42 ms / 24 fps, che non dice nulla di una GPU Android. Il contatore di frame time nella demo esiste
apposta: **serve che l'utente la apra sul suo telefono**.

Restano da giudicare col pollice, e nessun documento puo' farlo:
- tap / 1 s / 3 s si sentono come **tre spell diverse** o come **tre attese diverse**?
- `carico²/40`, drenaggio 30/s, ricarica 12/s: le costanti del 05 reggono al tatto?
- i valori di riposo delle materie si **vedono** passando da fuoco a terra?
