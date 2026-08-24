# 11 — Demo verticale

Type: prototype (HITL — l'utente deve tenerla in mano e reagire)
Status: open
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
