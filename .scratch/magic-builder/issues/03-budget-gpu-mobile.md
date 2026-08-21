# 03 — Budget GPU su telefoni di generazione corrente

Type: research
Status: open

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
