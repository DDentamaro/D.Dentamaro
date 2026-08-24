# Corpi e campi: come rendere le spell

Risultato del ticket 12. Rimette in discussione la decisione del ticket 06 — **un solo substrato** —
alla luce di come il real-time rende davvero la magia, e del budget del ticket 03.

---

## 1. Il risultato che ribalta il 06

> «I migliori VFX non sono mai un solo emettitore, ma **3-5 sistemi sovrapposti**: particelle piu'
> beam piu' trail piu' mesh animate.»

Il 06 aveva scelto un substrato solo per una buona ragione — la regola anti-fango — ma ha risolto il
problema sbagliato. Il fango nasce da **qualita' che si contendono l'aspetto**, non da substrati
diversi. Tre substrati che ricevono gli *stessi* parametri di moto non impastano: si sovrappongono.

## 2. Tre substrati

| Substrato | Che cos'e' | A cosa serve |
|---|---|---|
| **Campo** | particelle istanziate (quello che c'e' gia') | nuvole, spruzzi, vampe, tutto cio' che si apre |
| **Nastro** | triangle strip che collega le posizioni | raggi, fruste, fulmini, scie: tutto cio' che ha una **linea** |
| **Corpo** | mesh solida istanziata | schegge, blocchi, masse: tutto cio' che ha **volume** |

Il **corpo** e' la richiesta dell'utente, ed e' fondata: una Scheggia di pietra come nuvola di
puntini non convince. La pipeline esiste gia' — il manichino e' fatto cosi'.

Il **nastro** non era stato chiesto ma emerge dalla ricerca: i ribbon interpolano fra le posizioni e
producono curve continue **con pochissime particelle**. E' il modo giusto di fare una Frusta.

## 3. Il substrato non si sceglie: si deriva

Questa e' la parte che tiene in piedi il builder. Se il substrato fosse una scelta a mano, sarebbe un
nono asse mascherato e romperebbe «spell infinite». Va **derivato dagli assi che gia' esistono**:

```
compattezza = clamp(radiale, 0, 1)          // quanto converge
solidita'   = clamp(massa,   0, 1)          // quanto tiene la linea
persistenza = clamp(vita,    0, 1)

peso_corpo  = compattezza × solidita'
peso_nastro = compattezza × (1 − solidita') × persistenza
peso_campo  = 1 − max(peso_corpo, peso_nastro)
```

Pesi **continui**, non un interruttore: una spell puo' essere per meta' corpo e per meta' campo, ed
e' esattamente cio' che serve a un sistema con assi continui.

Verifica sui valori di riposo delle quattro materie:

| Materia | radiale | massa | → substrato dominante |
|---|---:|---:|---|
| Fuoco | −0,6 | −0,5 | **campo** — il fuoco si apre, non ha corpo |
| Vento | −0,7 | −0,8 | **campo** |
| Acqua | +0,2 | −0,3 | campo, con un filo di **nastro** — l'acqua scorre in linee |
| Terra | +0,3 | +0,8 | **corpo** al 24%, e sale a 0,8 con convergenza piena |

Le materie cadono da sole nel substrato giusto, senza una riga di codice dedicata. L'Ariete di terra
diventa un corpo solido; la Vampa di fuoco resta un campo. **Non l'ho imposto: e' caduto fuori dai
valori di riposo del ticket 04.**


### Verifica sui casi reali

| Formula | corpo | nastro | campo | dominante |
|---|---:|---:|---:|---|
| fuoco a riposo | 0,00 | 0,00 | 1,00 | **campo** |
| vento a riposo | 0,00 | 0,00 | 1,00 | **campo** |
| acqua a riposo | 0,00 | 0,12 | 0,88 | campo, con un filo di nastro |
| terra a riposo | 0,24 | 0,04 | 0,76 | campo, ma gia' un quarto di corpo |
| **Ariete** (terra, convergenza + forza piene) | 1,00 | 0,00 | 0,00 | **corpo** |
| **Muro** (terra, convergenza + durata) | 0,64 | 0,16 | 0,36 | **corpo** |
| **Frusta** (convergenza + cedevolezza) | 0,00 | 0,80 | 0,20 | **nastro** |
| **Vampa** (fuoco, dispersione) | 0,00 | 0,00 | 1,00 | **campo** |
| **Nube** (vento, disperso e leggero) | 0,00 | 0,00 | 1,00 | **campo** |

La riga della Frusta e' la conferma migliore: **nastro all'80%**, e nessuno gliel'ha detto. Una
frusta *e'* un nastro, e la formula lo sapeva gia'.

## 4. La regola anti-fango regge, riformulata

Il 06 diceva: *le qualita' muovono, la materia dipinge*. Resta vero, con un'aggiunta:

> **Le qualita' muovono e decidono il peso dei substrati. La materia dipinge. Il substrato sceglie
> la geometria.**

Tre spazi, non due, e nessuno dei tre invade gli altri. La materia non sa che substrato sta
dipingendo; il substrato non sa di che materia e'.

## 5. Cosa entra e cosa resta fuori, col budget del 03

**Dentro:**

- **Nastro come triangle strip generato nel vertex shader.** Costo quasi nullo, resa altissima sulle
  forme lineari. La ricerca e' esplicita: i ribbon danno curve continue con pochissime particelle.
- **Corpo come mesh istanziata.** Poche decine di poligoni per istanza, e — al contrario delle
  particelle — e' **opaco**, quindi non consuma il budget di overdraw trasparente. Paradosso utile:
  aggiungere corpi *alleggerisce* il frame.
- **Rumore procedurale nel shader** (stile Ashima webgl-noise), non da texture. Su un tiler la banda
  e' la risorsa scarsa e l'ALU e' quasi gratis: e' la scelta coerente col ticket 03.
- **`depthWrite:false` + additivo** per le trasparenze, che evita l'ordinamento in profondita'.
  Gia' in uso.

**Fuori:**

- **Soft particles (depth fade).** Richiedono la profondita' della scena in una texture: sul tiler
  significa scrivere il depth buffer in memoria esterna e rileggerlo per ogni frammento — esattamente
  la banda che il 03 vieta. Esiste `ARM_shader_framebuffer_fetch_depth_stencil` che lo evita, ma e'
  un'estensione Mali, non WebGL2 di base. **Rinunciamo al taglio morbido**: il depth test da' gia'
  l'occlusione netta contro suolo e manichino, e costa zero.
- **Volumetrica raymarchata**, gia' esclusa dal 03.

## 6. Canvas 2D: dove l'idea dell'utente e' giusta

Disegnare **corpi 3D** in Canvas 2D non regge: niente z-buffer (i poligoni vanno ordinati a mano e
la compenetrazione produce artefatti), due canvas sovrapposti non si compenetrano in profondita' —
il layer 2D sta tutto davanti o tutto dietro — ed e' lavoro CPU.

Ma c'e' un uso legittimo e confermato dalla ricerca: **generare texture a codice**. Si disegna una
volta in un canvas 2D fuori schermo e si carica come texture WebGL. Zero asset su disco, forme
migliori del cerchio sfumato analitico che usiamo ora.

**Raccomandazione: si, per l'atlante degli sprite di particella. No, per la geometria.**

---

## Raccomandazione

**Tre substrati con pesi derivati dagli assi.** Nastro e corpo si aggiungono al campo; nessuno dei
tre e' una scelta dell'utente, tutti e tre nascono dalla formula.

Ordine di lavoro suggerito: prima il **corpo** (pipeline gia' pronta, e risponde alla richiesta
esplicita), poi il **nastro** (piu' lavoro, ma e' cio' che fa esistere raggi e fruste), infine
l'atlante procedurale in Canvas 2D.

## Fonti

- [The Ultimate Guide to VFX for Gaming — Magic Media](https://magicmedia.studio/news-insights/guide-to-vfx-for-gaming/)
- [Roblox Particle System Deep Dive: Pro VFX Techniques](https://kitsblox.com/blog/roblox-particle-system-deep-dive)
- [Implementing soft particles in WebGL and OpenGL ES — DEV](https://dev.to/keaukraine/implementing-soft-particles-in-webgl-and-opengl-es-3l6e)
- [Efficient rendering of soft particles on mobile GPUs — Oleksandr Popov](https://keaukraine.medium.com/efficient-rendering-of-soft-particles-on-mobile-gpus-9beb856fcfbc)
- [ashima/webgl-noise](https://github.com/ashima/webgl-noise) · [Noise for GLSL — stegu](http://stegu.github.io/webgl-noise/)
- [Procedural Textures in HTML5 Canvas](https://asserttrue.blogspot.com/2012/01/procedural-textures-in-html5-canvas.html)
- [Custom ribbon effect for bullet trails — Real Time VFX](https://realtimevfx.com/t/custom-ribbon-effect-for-bullet-trails/24846)

Lette come riassunti di risultati di ricerca: il proxy di rete blocca i domini.

## 7. EthrA e la famiglia HD-2D

L'utente ha indicato **EthrA** (StoneLab Games) come riferimento: RPG open-world in **pixel art 3D**,
con Bob al corpo a corpo e **Veil che lancia le spell**. E' in playtest e **non esiste una
scomposizione tecnica pubblicata** — quel che segue viene dalla sua famiglia visiva, l'HD-2D, che e'
documentata, e che e' anche la famiglia del field di riferimento fornito (sprite billboardati dentro
una scena 3D, render target per attore).

Tre cose che l'HD-2D fa e che ci riguardano direttamente.

### La spell illumina la scena

E' il risultato piu' importante di questa ricerca, e ribalta un pezzo del §5.

Il team di Octopath racconta di aver messo effetti visivi «normali» in combattimento, di **non
esserne stato soddisfatto**, e di aver risolto aggiungendo una **point light nella scena**, cosi' che
i personaggi proiettassero ombre sull'ambiente durante gli effetti.

Tradotto per noi: una spell che sta *sopra* la scena sembra un adesivo; una spell che **illumina il
suolo e il manichino** sembra magia. E costa pochissimo — una point light in piu' nei due shader
gia' esistenti (suolo e corpi) sono una manciata di operazioni ALU per frammento, e sui tiler l'ALU
e' la risorsa abbondante.

**Raccomandazione: ogni immagine emette una luce puntiforme** al proprio centro di massa, del colore
della materia, con intensita' proporzionale alla dose. Da fare **prima** del nastro e prima
dell'atlante: e' il rapporto resa/costo migliore di tutta la ricerca.

### I VFX restano nitidi, il mondo resta pixelato

La definizione di HD-2D e' «pixel e sprite a bassa risoluzione fusi con **illuminazione e particelle
ad alta risoluzione**». La tensione fra i due *e'* lo stile.

Quindi le nostre spell **non vanno pixelate** per intonarsi al mondo: devono restare nitide. Il
contrasto e' voluto, non un errore di coerenza.

### Il conflitto sul passo full-screen

L'HD-2D si appoggia molto al **tilt-shift e alla profondita' di campo**: sfocare lo sfondo e' cio'
che stacca gli sprite dal mondo. Ma il ticket 03 concede **un solo passo full-screen**, e il bloom se
l'e' gia' preso.

Non lo risolvo qui, lo dichiaro: **bloom e profondita' di campo competono per l'unico slot**. Il
bloom serve alla magia, la profondita' di campo serve allo stile del mondo. Se il mondo definitivo e'
quello del field di riferimento, la scelta va rifatta guardandoli insieme — e forse il DOF appartiene
al field e non al builder.

### Fonti

- [EthrA su Steam](https://store.steampowered.com/app/2177510/EthrA/) · [NeoGAF — EthrA, hybrid 2D-in-3D](https://www.neogaf.com/threads/ethra-rpg-with-hybrid-2d-in-a-3d-world-style-pc-indie-by-stonelab-games.1670647/) · [80.lv](https://80.lv/articles/this-indie-adventure-combines-pixelated-3d-models-2d-character-sprites)
- [Octopath Traveler II e lo stile HD-2D — Unreal Engine](https://www.unrealengine.com/en-US/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style)
- [HD-2D — Wikipedia](https://en.wikipedia.org/wiki/HD-2D)
