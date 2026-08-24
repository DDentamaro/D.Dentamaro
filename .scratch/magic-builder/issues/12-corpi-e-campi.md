# 12 — Corpi e campi: il secondo substrato

Type: research
Status: claimed

## Question

Il ticket 06 ha stabilito **un solo substrato**: ogni immagine e' un campo di particelle istanziate.
La sandbox 3D lo ha mostrato in funzione, e ha esposto il limite: **certe spell hanno un corpo.**
Una Scheggia di pietra o una Lancia di Gelo come nuvola di puntini non convince.

L'utente ha proposto di disegnare corpi 3D con Canvas 2D. Tecnicamente non regge — niente z-buffer,
i due canvas non si compenetrano in profondita', ed e' lavoro CPU — ma l'intenzione e' giusta.

Da rispondere:

1. **Quali tecniche** usa davvero il real-time per rendere magia, e quali stanno nel budget del
   ticket 03 (2,8M frammenti, 30 draw call, un passo full-screen, zero shader a runtime)?
2. **Quali spell sono corpo e quali sono campo**, e come si decide dagli otto assi invece che a mano?
3. Se servono **due substrati**, come convivono senza rompere la regola anti-fango del 06
   (le qualita' muovono, la materia dipinge)?
4. C'e' un uso legittimo di **Canvas 2D**? (ipotesi: generare texture a codice, zero asset su disco)

## Output atteso

Una raccomandazione motivata, con le tecniche ammesse e quelle escluse per budget, e la regola che
decide corpo o campo a partire dalla formula.
