# 02 — Fondamenta tecniche di un file standalone

Type: research
Status: resolved

## Question

Con il vincolo "un `.html`, zero rete, zero asset", su cosa si costruisce il rendering?

- **three.js incorporato nel file**: peso reale della build minificata, cosa resta se si tiene solo
  il necessario, quanto costa in parsing su un telefono.
- **WebGL2 scritto a mano**: quanto codice serve davvero per cio' che ci serve (nessuna scena
  complessa, nessun caricamento di modelli, molti shader custom) e cosa si perde.
- Come si incorpora tutto in un file solo senza build step: `<script type="module">` con sorgente
  in linea, importmap, o niente moduli.
- Cosa il riferimento usa di three.js che ci servirebbe replicare, e cosa invece e' peso morto per
  noi (loader FBX, HDRI, post-processing pesante).

## Output atteso

Una raccomandazione motivata con i numeri veri, non stimati. Alimenta il ticket 06 e il 10.

## Answer

Risolto. Findings completi in [`magic-builder/docs/02-fondamenta-tecniche.md`](../../../magic-builder/docs/02-fondamenta-tecniche.md).
Artefatti: [`spikes/micro-renderer.js`](../../../magic-builder/docs/spikes/micro-renderer.js) e
[`spikes/probe-webgl2.html`](../../../magic-builder/docs/spikes/probe-webgl2.html).

**Decisione: micro-renderer WebGL2 scritto a mano. Niente three.js.**

Numeri misurati, non stimati (three 0.185.1, bundle esbuild minificato):

| | byte | KB |
|---|---:|---:|
| three.js completo | 729.884 | 712 |
| three.js tree-shaken sulla nostra superficie | 527.635 | 515 |
| micro-renderer a mano | 4.663 | **4,6** |

Il tree-shaking recupera solo il 28%: `WebGLRenderer` e' monolitico. Il micro-renderer e' stato
**eseguito** in Chromium headless a 390x844 DPR 3, non solo scritto: 181.702 pixel non-sfondo,
398 colori distinti, 64 triangoli istanziati, zero errori GL.

Non decide il peso: decide che pagheremmo 515 KB per astrazioni che il progetto non usa — ogni VFX
e' uno shader custom, zero asset da caricare, nessuna luce, gerarchia piatta. Dei dieci addon di
three.js usati dal riferimento (FBXLoader, HDRLoader, OrbitControls, EffectComposer, UnrealBloom...)
nessuno ci e' utilizzabile.

**Alternative scartate**: three.js tree-shaken (515 KB per matematica delle matrici e plumbing degli
shader); three.js completo da CDN (viola "zero rete" e non risolve il parse su mobile).

**Costo accettato**: ci teniamo bug che three.js ha gia' risolto, niente `OrbitControls`, e il
post-processing — se il 03 lo autorizza — va scritto a mano.

**Due scoperte oltre la domanda posta:**

1. **I moduli ES non funzionano su `file://`.** Verificato: CORS blocca l'import da origine `null`.
   Tutto deve stare in uno `<script>` classico. Vincolo duro per il 10.

2. **Su iPhone un file locale non esegue JavaScript.** Safari non apre piu' file locali; resta
   Quick Look, che non esegue script. Android va. Il vincolo "un file standalone" regge su Android
   e si rompe su iOS, e in cartografia non e' stato chiesto quale OS ("telefoni nuovi").
   **Decisione AFK dichiarata**: il file resta un solo file autonomo, zero dipendenze, zero build —
   cambia solo che si **serve via https** invece di aprirlo da `file://`. "Zero rete" nasceva per
   non dipendere da CDN a runtime, e servire la pagina non viola quello scopo. Reversibile se il
   telefono e' Android.

## Correzione post-risoluzione

L'utente ha chiarito: **il bersaglio e' solo Android**. La decisione AFK di servire il file via
https decade — era stata presa per aggirare iOS, che non ci riguarda. Su Android Chrome `file://`
esegue lo script, quindi il file si apre direttamente e nessun host e' necessario.

Resta valido tutto il resto del ticket: micro-renderer a mano, niente moduli ES, cap sul DPR.
Anzi il vincolo `file://` **si rafforza**: e' il modo previsto di aprirlo, non un ripiego.
