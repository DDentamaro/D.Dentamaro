# 12 — Corpi e campi: il secondo substrato

Type: research
Status: resolved

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

## Answer

Risolto. Ricerca completa in
[`magic-builder/docs/12-corpi-e-campi.md`](../../../magic-builder/docs/12-corpi-e-campi.md).

**Il ticket 06 aveva risolto il problema sbagliato.** La ricerca e' esplicita: «i migliori VFX non
sono mai un solo emettitore, ma **3-5 sistemi sovrapposti**». Il fango nasce da qualita' che si
contendono l'aspetto, non da substrati diversi: tre substrati che ricevono gli *stessi* parametri di
moto non impastano, si sovrappongono.

### Tre substrati

- **Campo** — particelle istanziate. Nuvole, spruzzi, vampe.
- **Nastro** — triangle strip fra le posizioni. Raggi, fruste, fulmini. Non era stato chiesto, ma
  la ricerca lo impone: i ribbon danno curve continue **con pochissime particelle**.
- **Corpo** — mesh solida istanziata. Schegge, blocchi, masse. E' la richiesta dell'utente, ed e'
  fondata: una scheggia come nuvola di puntini non convince.

### Il substrato si deriva, non si sceglie

Se fosse una scelta a mano sarebbe un nono asse mascherato e romperebbe «spell infinite».

```
peso_corpo  = clamp(radiale,0,1) × clamp(massa,0,1)
peso_nastro = clamp(radiale,0,1) × (1 − clamp(massa,0,1)) × clamp(vita,0,1)
peso_campo  = 1 − max(peso_corpo, peso_nastro)
```

Pesi **continui**, non un interruttore. Verificato sui casi reali: fuoco e vento a riposo danno campo
puro, la terra gia' 24% di corpo, l'Ariete corpo pieno, il Muro 0,64 — e la **Frusta 0,80 di
nastro**, che e' la conferma migliore: una frusta *e'* un nastro e la formula lo sapeva gia'.

Non l'ho imposto: cade fuori dai valori di riposo del ticket 04.

### La regola anti-fango, riformulata

> Le qualita' muovono **e decidono il peso dei substrati**. La materia dipinge. Il substrato sceglie
> la geometria.

Tre spazi invece di due, nessuno invade gli altri.

### Budget

**Dentro**: nastro nel vertex shader (costo quasi nullo); corpo come mesh istanziata — e' **opaco**,
quindi non consuma il budget di overdraw trasparente, paradosso utile per cui aggiungere corpi
*alleggerisce* il frame; rumore procedurale in ALU e non da texture, perche' sul tiler la banda e' la
risorsa scarsa.

**Fuori**: **soft particles**. Richiedono la profondita' della scena in texture, cioe' scrivere il
depth buffer in memoria esterna e rileggerlo per frammento — esattamente la banda che il 03 vieta.
L'estensione Mali che lo evita non e' WebGL2 di base. Il depth test da' gia' l'occlusione netta e
costa zero: rinunciamo al taglio morbido.

### Canvas 2D

**No per la geometria**: niente z-buffer, i due canvas non si compenetrano in profondita', ed e'
lavoro CPU. **Si per generare le texture**: disegnare una volta in un canvas fuori schermo e caricare
come texture WebGL e' confermato dalla ricerca, e da' forme migliori del cerchio sfumato analitico
di adesso senza un solo asset su disco.

**Alternative scartate**: restare a un substrato solo (contraddetto dalla pratica del settore e dal
limite visto nella sandbox); scegliere il substrato a mano (nono asse mascherato); soft particles
(banda).

### Ordine di lavoro

Prima il **corpo** — pipeline gia' pronta col manichino, e risponde alla richiesta esplicita. Poi il
**nastro**. Infine l'atlante procedurale.
