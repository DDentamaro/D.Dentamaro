# Budget GPU su Android

Risultato del ticket 03. Bersaglio ristretto a **solo Android, Chrome**: Adreno (Qualcomm) e Mali
(ARM, negli Exynos e nei MediaTek).

**Limite dichiarato**: in questa sessione non esiste una GPU Android. Chromium gira in
rasterizzazione software, quindi **non ci sono benchmark**: quel che segue e' aritmetica esatta
sulle risoluzioni reali piu' le linee guida dei produttori. Un numero misurato su hardware vero
puo' smentirlo, e il posto giusto per scoprirlo e' il ticket 10.

---

## 1. Quanti pixel, davvero

Landscape, risoluzioni Android reali:

| Device | nativo | CSS | cap DPR 1 | cap 1.5 | cap 2 |
|---|---|---|---:|---:|---:|
| Galaxy S23/S24 (Adreno) | 2340x1080 | 780x360 | 0,28M | 0,63M | 1,12M |
| Pixel 8 (Mali-G715) | 2400x1080 | 914x411 | 0,38M | 0,85M | 1,50M |
| Medio Adreno/Mali 2023+ | 2400x1080 | 800x360 | 0,29M | 0,65M | 1,15M |
| Entry 2024 (Mali-G57) | 1600x720 | 800x360 | 0,29M | 0,65M | 1,15M |

Media: **0,31M** pixel a cap 1, **0,69M** a cap 1,5, **1,23M** a cap 2, **2,22M** senza cap.

Il cap non e' un dettaglio: passare da nessun cap a **1,5 taglia il 69% del lavoro per pixel**.
Da cap 2 a cap 1,5 se ne taglia comunque il 44%.

**Decisione: cap a 1,5, non a 2** (rettifica il "cap 2 acquisito" del ticket 02). Un builder si
guarda a distanza di braccio, e i suoi VFX sono morbidi e additivi: l'aliasing lo nasconde il bloom.
In piu' il renderer parte a 1,5 e **scende a 1,0 da solo** se il frame time sfora — misura banale,
guadagno grosso.

## 2. Il budget vero e' in frammenti, non in particelle

La domanda "quante particelle" e' mal posta. 50.000 particelle da 4 px sono 800.000 frammenti:
niente. Le stesse 50.000 da 64 px sono 200 milioni: morto. Conta l'**area coperta**, non il conteggio.

**Budget: 4x overdraw del framebuffer per il lavoro trasparente** — a cap 1,5 sono circa **2,8
milioni di invocazioni fragment per frame**. Dentro quel tetto il numero di particelle e' libero:
sceglilo tu, purche' l'area totale stia nel budget.

Corollario controintuitivo, e vale la pena saperlo: **sui tiler il blending e' economico**. Adreno e
Mali tengono il colore di destinazione nella memoria on-chip del tile, quindi la fusione alfa non
paga il round-trip in RAM che paga su desktop. A costare non e' il `blend`: sono le **esecuzioni
del fragment shader**. Overdraw di shader semplici e' sostenibile; overdraw di shader complessi no.

## 3. Draw call: non sono il collo di bottiglia

Sotto le ~100 draw call per frame la differenza e' marginale su un telefono moderno; si sente dalle
500 in su. Con l'instancing staremo un ordine di grandezza sotto.

**Budget: 30 draw call per frame, tetto duro 60.** Se ci avviciniamo, il problema e' il design della
scena, non la GPU.

## 4. Post-processing: un solo effetto, a risoluzione ridotta

Su un tiler ogni passo full-screen forza lo scarico del tile in memoria e la rilettura. Costo
misurato aritmeticamente, RGBA8, write+read:

| | per frame | banda a 60fps |
|---|---:|---:|
| un passo a cap 1 | 2,5 MB | 148 MB/s |
| un passo a cap 1,5 | 5,5 MB | 333 MB/s |
| un passo a cap 2 | 9,9 MB | 592 MB/s |

ARM e' esplicita: il post-processing su mobile non e' vietato, e' caro e va capito.

**Decisione: un solo effetto, il bloom, con la catena a 1/4 di risoluzione** — bright-pass,
blur separabile H e V, composito dentro il blit finale. A 1/4 ogni passo costa 1/16 della tabella
sopra: **frazioni di MB per frame**, trascurabile.

Il bloom non e' un vezzo: e' il singolo effetto che fa leggere dei poligoni trasparenti come
*magia*. Con un solo slot di post-processing disponibile, e' quello che se lo merita.

**Escluso: la volumetrica raymarchata.** Il riferimento la usa per il fuoco e la scia del meteorite,
ma sono cicli per-pixel: 32 passi su 0,69M pixel sono 22 milioni di valutazioni di rumore per frame,
fuori budget da soli. **Alternativa**: billboard morbidi con rumore procedurale nel fragment shader,
una o due ottave. Il 90% della resa a una frazione del costo.

## 5. Il vincolo che riguarda davvero un builder: gli shader a runtime

Questo e' il risultato piu' importante del ticket, e non era nella domanda.

**Un builder compone spell a runtime. Se ogni composizione genera uno shader nuovo, la
compilazione avviene al momento del lancio — e compilare uno shader su mobile e' uno stallo
visibile.** Il primo lancio di ogni spell inedita scatterebbe. In un ciclo
costruisci-lancia-osserva-aggiusta, cioe' un ciclo fatto di spell inedite, sarebbe *sempre*.

Tre uscite, per il ticket 06:

1. **Uber-shader**: un solo programma per archetipo, la composizione entra come **uniform**, non
   come codice. Zero compilazioni a runtime. Costa qualche branch dinamico.
2. **Set precompilato**: tutte le permutazioni compilate al caricamento. Impraticabile appena la
   combinatoria cresce, ed e' esattamente cio' che un builder fa crescere.
3. **Compilazione asincrona** con `KHR_parallel_shader_compile` e un ripiego visivo mentre compila.
   Complessita' alta, scatto solo spostato.

**Raccomandazione al 06: uber-shader per archetipo.** E' anche coerente con la scelta di
cesellare i VFX *per stadio* invece che per spell.

## 6. Regole minori, ma vincolanti

- **Precisione**: `mediump` di default nei fragment shader, `highp` solo dove serve davvero
  (posizioni mondo, accumulatori di tempo). Mali ha storicamente piu' bug di driver WebGL di
  Adreno, in particolare con shader complessi.
- **Mai `readPixels` nel loop di rendering.** Osservato in questa sessione: la sonda del ticket 02
  ha fatto emergere dal driver `GPU stall due to ReadPixels`. Sincronizza CPU e GPU e uccide la
  pipeline.
- **Niente letture di texture dipendenti** (coordinate calcolate nel fragment shader a partire da
  un'altra lettura): rompono il prefetch.
- **WebGL2 e' sicuro**: Chrome su Android lo supporta dal 56 (2017).

---

## Il budget, in una tabella

| Voce | Budget | Tetto |
|---|---|---|
| Cap devicePixelRatio | 1,5, adattivo verso 1,0 | mai oltre 2 |
| Frammenti trasparenti | 4x overdraw (~2,8M/frame) | 6x |
| Draw call | 30/frame | 60 |
| Passi full-screen | 1 (bloom) a 1/4 risoluzione | 1 |
| Volumetrica raymarchata | esclusa | — |
| Compilazioni shader a runtime | **zero** | zero |
| Precisione fragment | `mediump` | `highp` solo motivato |

## Fonti

- [The Mali GPU: An Abstract Machine, Part 2 — Tile-based Rendering (ARM)](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/the-mali-gpu-an-abstract-machine-part-2---tile-based-rendering)
- [Post-processing Effects on Mobile: Optimization and Alternatives (ARM)](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/post-processing-effects-on-mobile-optimization-and-alternatives)
- [Adreno GPU on Mobile: Best Practices (Qualcomm)](https://docs.qualcomm.com/nav/home/mobile_best_practices.html?product=1601111740035277)
- [How a Triangle Travels — Mali vs Adreno](https://medium.com/@ankitsingh.mailbox/how-a-triangle-travels-a-mobile-gpu-itinerary-63bf8519dbf6)
- [Building a 60FPS WebGL Game on Mobile — Airtight Interactive](https://www.airtightinteractive.com/2015/01/building-a-60fps-webgl-game-on-mobile/)
- [WebGL and WebGPU Support on Mobile Browsers](https://www.abratabia.com/mobile-web-games/mobile-webgl-support.php)
