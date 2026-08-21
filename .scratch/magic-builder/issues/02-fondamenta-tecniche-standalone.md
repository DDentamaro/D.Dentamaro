# 02 — Fondamenta tecniche di un file standalone

Type: research
Status: open

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
