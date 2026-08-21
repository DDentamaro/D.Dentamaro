# 03 — Budget GPU su telefoni di generazione corrente

Type: research
Status: resolved

## Question

Cosa concede davvero una GPU mobile di generazione corrente a 60fps in WebGL2?

- Ordini di grandezza per: numero di particelle, draw call, dimensione dei buffer.
- **Fill rate** e costo dell'overdraw: quanto trasparente possiamo sovrapporre prima di crollare.
- Il **post-processing** e' sostenibile a risoluzione piena, a risoluzione dimezzata, o per niente?
- La **volumetrica raymarchata** (che il riferimento usa per fuoco e scia del meteorite) sta nel
  budget o e' fuori discussione?
- Vincoli di WebGL2 su mobile che su desktop non si notano: precisione dei float nei fragment
  shader, limiti sulle texture, comportamento con `devicePixelRatio` alto.

## Output atteso

Un budget numerico usabile come vincolo di progetto. Alimenta il ticket 06.

## Answer

Risolto. Budget completo in [`magic-builder/docs/03-budget-gpu.md`](../../../magic-builder/docs/03-budget-gpu.md).

| Voce | Budget | Tetto |
|---|---|---|
| Cap devicePixelRatio | 1,5, adattivo verso 1,0 | mai oltre 2 |
| Frammenti trasparenti | 4x overdraw (~2,8M/frame) | 6x |
| Draw call | 30/frame | 60 |
| Passi full-screen | 1 (bloom) a 1/4 risoluzione | 1 |
| Volumetrica raymarchata | esclusa | — |
| Compilazioni shader a runtime | **zero** | zero |
| Precisione fragment | `mediump` | `highp` solo motivato |

**Il risultato che conta, e non era nella domanda**: un builder compone spell a runtime, quindi se
ogni composizione genera uno shader nuovo la compilazione cade al momento del lancio — e compilare
uno shader su mobile e' uno stallo visibile. In un ciclo costruisci-lancia-osserva-aggiusta, fatto
per definizione di spell inedite, scatterebbe *sempre*. **Raccomandazione al 06: uber-shader per
archetipo, la composizione entra come uniform, non come codice.** Coerente anche con la scelta di
cesellare i VFX per stadio invece che per spell.

**Altri esiti:**

- **Cap DPR a 1,5, non 2** — rettifica il ticket 02. Media misurata: 0,69M pixel contro 1,23M, cioe'
  il 44% di lavoro in meno; contro nessun cap il taglio e' del 69%. Il renderer scende a 1,0 da solo
  se il frame time sfora.
- **Il budget si esprime in frammenti, non in particelle.** 50k particelle da 4 px sono 800k
  frammenti; le stesse da 64 px sono 200 milioni. Conta l'area, non il conteggio.
- **Sui tiler il blending e' economico**: Adreno e Mali tengono il colore di destinazione on-chip,
  quindi l'additivo non paga il round-trip in RAM che paga su desktop. A costare sono le esecuzioni
  del fragment shader, non la fusione. Buona notizia per un progetto tutto trasparenze.
- **Bloom si, volumetrica raymarchata no.** Un solo passo full-screen, catena a 1/4 di risoluzione:
  frazioni di MB per frame. La volumetrica costerebbe 22M di valutazioni di rumore per frame da
  sola; si sostituisce con billboard morbidi e rumore procedurale a una o due ottave.
- **Mai `readPixels` nel loop**: osservato in questa sessione, la sonda del ticket 02 ha fatto
  emergere `GPU stall due to ReadPixels` dal driver.

**Alternative scartate**: cap DPR a 2 (44% di fill in piu' per nitidezza che il bloom nasconde);
set di shader precompilati (la combinatoria di un builder lo rende impraticabile); compilazione
asincrona (sposta lo scatto, non lo toglie).

**Limite della ricerca, dichiarato**: in questa sessione non esiste una GPU Android — Chromium gira
in rasterizzazione software. Nessun benchmark: il budget e' aritmetica esatta sulle risoluzioni
reali piu' linee guida di ARM e Qualcomm. Hardware vero puo' smentirlo, e il posto per scoprirlo
e' il ticket 10.
