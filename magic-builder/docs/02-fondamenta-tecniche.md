# Fondamenta tecniche di un file standalone

Risultato del ticket 02. Tutti i numeri sono **misurati**, non stimati: three.js 0.185.1 scaricato
da npm e impacchettato con esbuild; il micro-renderer scritto ed **eseguito** in Chromium headless.

---

## 1. Quanto pesa davvero three.js

Bundle esbuild, `--format=esm --minify`:

| Cosa | Byte | KB |
|---|---:|---:|
| three.js completo (`export * from 'three'`) | 729.884 | 712 |
| three.js **tree-shaken** sulla superficie che ci serve | 527.635 | 515 |
| micro-renderer WebGL2 scritto a mano | 4.663 | **4,6** |

Il tree-shaking recupera solo il **28%**: `WebGLRenderer` e' monolitico e si trascina dietro quasi
tutto il core. Non esiste una versione "piccola" di three.js da incorporare.

Superficie richiesta per il tree-shaking (realistica per questo progetto): `WebGLRenderer`, `Scene`,
`PerspectiveCamera`, `Clock`, `BufferGeometry`, `BufferAttribute`, `Float32BufferAttribute`,
`PlaneGeometry`, `ShaderMaterial`, `Mesh`, `Points`, `InstancedMesh`, `Object3D`, `Group`,
`Vector2/3`, `Color`, `Matrix4`, `Quaternion`, `MathUtils`, blending, `Raycaster`.

## 2. Cosa usa il riferimento, e quanto e' inservibile per noi

Import di three nel repo di riferimento, estratti: 33 simboli dal core, piu' **dieci addon**:
`FBXLoader`, `HDRLoader`, `OrbitControls`, `EffectComposer`, `RenderPass`, `ShaderPass`,
`OutputPass`, `UnrealBloomPass`, `HorizontalBlurShader`, `VerticalBlurShader`.

Tutti e dieci sono **fuori dalla nostra portata per costruzione**: i due loader servono asset che
abbiamo escluso (zero asset), `OrbitControls` e' input da mouse, e la catena di post-processing e'
una decisione del ticket 03, non un dato acquisito.

Il valore di three.js sta in loader, sistema di materiali, luci, ombre e scene graph profondo.
Noi: **nessun loader**, **nessuna luce** (illuminazione analitica negli shader), **nessun sistema
di materiali** (ogni VFX e' uno shader custom, cioe' `ShaderMaterial`, cioe' three.js gia' scavalcato),
**scene graph piatto**. Pagheremmo 515 KB per matematica delle matrici e plumbing degli shader.

## 3. Il micro-renderer: scritto, eseguito, verificato

`spikes/micro-renderer.js` — 100 righe, 4.663 byte minificati. Copre esattamente il necessario:
contesto WebGL2 con cap sul devicePixelRatio, compilazione programmi con **introspezione automatica
delle uniform**, setter di uniform per tipo, VAO con attributi istanziati e divisor, stato di
blending/depth/cull, draw istanziato indicizzato e non, loop a delta-time con clamp.

**Eseguito in Chromium headless**, viewport 390x844 a DPR 3, sonda in `spikes/probe-webgl2.html`:

```
ctx: WebGL 2.0 (OpenGL ES 3.0 Chromium)
uniforms introspezionate: uT, uVP
framebuffer: 780x1688
pixel non-sfondo: 181.702 (13,80%)
colori distinti: 398
glError: 0
```

64 triangoli istanziati resi, zero errori GL. Il framebuffer 780x1688 invece di 1170x2532 conferma
che il **cap sul DPR funziona**: 2,25x di fill rate risparmiato solo con quello. Dato per il 03.

La sonda intera — renderer, shader, scena e verifica — sta in **7.452 byte**, un file, aperto da
`file://`.

## 4. Niente moduli ES: scoperto sbattendoci contro

Il primo tentativo di sonda usava `<script type="module">` con `import` da `./micro.js`. Chromium:

```
Access to script at 'file:///…/micro.js' from origin 'null' has been blocked by CORS policy:
Cross origin requests are only supported for protocol schemes: chrome, chrome-extension,
chrome-untrusted, data, http, https, isolated-app.
```

Su `file://` l'origine e' `null` e ogni import di modulo fallisce. Niente `type="module"`, niente
importmap: **tutto in uno `<script>` classico**. Vincolo duro per il ticket 10.

## 5. Il rischio alla premessa: su iPhone un file locale non esegue JavaScript

Cercando come si apre davvero un `.html` locale su un telefono:

- **iOS**: Safari non apre piu' file locali per ragioni di sicurezza. Quel che resta e' l'anteprima
  Quick Look dell'app File, **che non esegue JavaScript**. Un builder WebGL li' dentro e' una pagina
  bianca.
- **Android**: Chrome apre `file://` ed esegue lo script.

Il vincolo "un file standalone" quindi **regge su Android e si rompe su iOS**, e in cartografia non
e' stato chiesto quale sistema operativo: la Q4 diceva "telefoni nuovi".

**Decisione AFK, dichiarata perche' tocca un vincolo fissato nelle Notes**: il file resta **un solo
file autonomo, zero dipendenze, zero build** — quella proprieta' non si tocca. Cambia solo come lo
si raggiunge: **servito via https** da un qualsiasi host statico invece che aperto da `file://`.
"Zero rete" nasceva per non dipendere da CDN a runtime, e servire la pagina non viola quello scopo.

Reversibile: se il telefono e' Android, `file://` funziona e non serve host.

---

## Raccomandazione

**Micro-renderer WebGL2 scritto a mano. Niente three.js.**

Non e' il peso in se' a decidere — 515 KB non sono fatali. Decide che pagheremmo quei KB per
astrazioni che questo progetto **non usa**: ogni VFX e' uno shader custom, non ci sono asset da
caricare, non ci sono luci da gestire, la gerarchia e' piatta. Il rapporto misurato e' 110:1, e il
lato leggero e' gia' stato eseguito con successo.

**Il costo, dichiarato:** ci teniamo bug che three.js ha gia' risolto, non abbiamo `OrbitControls`,
e se il 03 dira' che il post-processing sta nel budget dovremo scrivere anche quello. Mitigazione:
la superficie e' piccola e ora e' dimostrata, non ipotizzata.

## Passa al ticket 10

- Uno `<script>` classico, nessun modulo ES.
- `spikes/micro-renderer.js` e' il seme del renderer, gia' funzionante.
- Cap sul devicePixelRatio a 2: acquisito.

## Passa al ticket 03

- Il cap sul DPR da solo vale 2,25x di fill rate su un telefono a DPR 3.
- Nessun post-processing e' dato per acquisito: se lo vogliamo, va scritto a mano.

## Fonti

- [How to open local html files in safari on iphone — Apple Community](https://discussions.apple.com/thread/256102223)
- [Open a local html file on my iPhone — Apple Community](https://discussions.apple.com/thread/256001921)
- [Opening HTML in Safari from local file or string — Apple Developer Forums](https://developer.apple.com/forums/thread/701845)

Misurazioni fatte in questa sessione: three.js 0.185.1 da npm, esbuild, Chromium 1194 headless.
