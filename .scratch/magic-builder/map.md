# Mappa: Magic Builder

Label: `wayfinder:map`

## Destination

Un builder di magia in un **singolo file HTML standalone**, orizzontale su telefono, che rende il
concetto di manipolazione del mana di *Mushoku Tensei* come **pipeline di plasmatura componibile**,
limitata da riserva di mana e controllo, provata in un poligono di tiro.

Finita quando `magic-builder/index.html` gira su un telefono di generazione corrente e permette di
comporre, lanciare, salvare ed esportare una spell.

## Notes

**Dominio**: builder di sistema magico, WebGL, VFX procedurali. Riferimento studiato ma *non*
clonato: `achrefelouafi/LinearAbiltyCastingThreeJS` (~21k righe, Vite, ~14 MB di asset, cinque
abilita' cablate a mano). Quello e' una vetrina VFX; questo e' un builder. La differenza e' il punto.

**Skill da consultare ogni sessione**: `domain-modeling` sempre (il glossario di questo effort e'
giovane e va costruito); `research` per i ticket di tipo research; `prototype` per il 07.

**OVERRIDE — la demo verticale precede la specifica completa.** Il ticket 11 costruisce una fetta
verticale bloccata solo da 05 e 06, prima che 07, 08 e 09 siano chiusi. Motivo: il budget del 03 e'
aritmetica non verificata (nessuna GPU Android in sessione) e la durata della carica e' una domanda
tattile. Entrambe si risolvono solo con codice su un telefono vero. Effetto: 07, 08 e 09 escono
dalla strada critica.

**OVERRIDE — l'esecuzione entra nella mappa.** Wayfinder di default pianifica e basta. Qui no:
l'utente ha chiesto di procedere allo sviluppo, quindi il ticket 10 costruisce davvero il file.
I ticket 01-09 restano decisioni: 10 non si tocca finche' non sono chiusi.

**OVERRIDE — i ticket HITL sono declassati ad AFK.** 04, 05, 06, 08, 09 sarebbero `grilling` e 07
sarebbe `prototype`, quindi da risolvere con l'umano. L'utente ha delegato ("come meglio credi").
L'agente decide da solo, ma **ogni risoluzione deve dichiarare la decisione, le alternative
scartate e il perche'**, cosi' resta ribaltabile. Il tipo originale resta scritto sul ticket.

**Vincoli fissati, non si riaprono:**

| | |
|---|---|
| Cuore | Builder-first: un'**immagine** componibile (ticket 04) |
| Canone | Innesto di due fonti (ticket 04): **Witch Hat Atelier** per la grammatica della composizione, **Mushoku Tensei** per l'atto. Senza canti, e **senza disegnare** — il glifo e' il modello, non l'interfaccia. |
| Composizione | Un'**immagine** = nucleo (4 materie: fuoco, acqua, terra, vento) + 6 qualita' tipizzate + carica a pressione. Vocabolario in `magic-builder/CONTEXT.md`. |
| Limite | **Mana** limita l'intensita' e si spende caricando; **controllo** limita la complessita' (quante qualita' si tengono nitide) e superarlo **sfoca** invece di bloccare (ticket 04). |
| Ciclo | Poligono di tiro, bersagli inerti: costruisci → lancia → osserva → aggiusta |
| File | Un `.html`, zero dipendenze, zero asset, zero build, tutto procedurale. Aperto da **`file://`**, nessun host. Uno `<script>` classico: i moduli ES non funzionano su `file://`. |
| Rendering | Micro-renderer WebGL2 scritto a mano (ticket 02). Cap sul devicePixelRatio a **1,5**, adattivo verso 1,0 (ticket 03). |
| Shader | Quattro uber-shader, uno per materia; le qualita' entrano come uniform (ticket 04, determinato dal 03). |
| Budget GPU | 4x overdraw (~2,8M frammenti/frame), 30 draw call, un solo passo full-screen a 1/4 (bloom), niente volumetrica raymarchata, **zero shader compilati a runtime** (ticket 03). |
| Persistenza | `localStorage` + export/import come stringa di testo |
| Casa | `magic-builder/` in questo repo |
| Scena | Nessun caster a schermo |
| Postura | Orizzontale, due mani |
| Progressione | Nessuna: tutto sbloccato dal primo secondo |
| Piattaforma | **Solo Android**, Chrome. iOS e' fuori: Safari non esegue JS da file locale (ticket 02), ma non ci riguarda. |
| Prestazioni | Telefoni Android di generazione corrente, WebGL2, budget GPU mobile — non desktop |

## Decisions so far

<!-- una riga per ticket chiuso: gist + link. Il dettaglio vive nel ticket, non qui. -->

- [01 — Il modello del mana in Mushoku Tensei, senza canti](issues/01-modello-mana-mushoku-tensei.md): il canone descrive il canto silenzioso come tre passaggi — **forma → potenza → velocita'** — quindi la pipeline ha tre stadi, non sei; attributi ridotti ai quattro d'attacco; il rango diventa scala comprata col mana, mai un cancello; la degradazione non e' canonica e va inventata.
- [02 — Fondamenta tecniche di un file standalone](issues/02-fondamenta-tecniche-standalone.md): **micro-renderer WebGL2 a mano, niente three.js** — 4,6 KB misurati contro 515 KB tree-shaken, e il lato leggero e' gia' stato eseguito in Chromium; niente moduli ES su `file://`; su iPhone un file locale non esegue JavaScript — ma il bersaglio e' **solo Android**, dove `file://` funziona, quindi nessun host serve.
- [03 — Budget GPU su telefoni di generazione corrente](issues/03-budget-gpu-mobile.md): budget in **frammenti** (4x overdraw, ~2,8M/frame) e non in particelle; cap DPR **1,5** adattivo; 30 draw call; **un solo** passo full-screen (bloom a 1/4); volumetrica raymarchata esclusa; e soprattutto **zero compilazioni di shader a runtime** — un builder che genera shader per spell scatterebbe a ogni lancio inedito.
- [04 — Gli stadi della pipeline di plasmatura e i loro operatori](issues/04-stadi-pipeline.md): risolto **in HITL**. Innesto di due fonti — **Witch Hat Atelier** da' la grammatica, **Mushoku Tensei** l'atto. Un'**immagine** e' **nucleo** (4 materie) + **qualita' tipizzate** (6: una direzionale, tre semi-direzionali invertibili, due non-direzionali) + **carica** (si tiene premuto, la durata *e'* il mana investito). Nessuno stadio "forma": emerge. Ne discendono **quattro uber-shader, uno per materia**.
- [05 — Costo del mana e modello di controllo/degradazione](issues/05-costo-mana-e-degradazione.md): **due valute senza sovrapposizione** — il mana paga l'intensita' (`sqrt`, rendimenti decrescenti: raddoppiare la potenza costa 4x), il controllo paga la complessita' (carico per classe). La degradazione **corrompe le qualita' che stai tenendo**, ognuna nel proprio idioma: deriva, inversione spontanea, instabilita', collasso. Il collasso non si raggiunge per complessita' da sola.

## Not yet specified

Nebbia in scope, non ancora abbastanza nitida per un ticket:

- **Suono.** Un builder di magia muto e' meno della meta' dell'effetto, ma non so ancora se la
  sintesi audio procedurale stia nel budget del file standalone, ne' se abbia un aggancio nella
  pipeline. Graduera' probabilmente dopo il 06 (contratto di rendering).
- **Come una spell passa da un telefono all'altro.** Il 09 decide il *formato*; resta aperto se la
  stringa basta o se serve qualcosa attorno.
- **Magia di barriera.** Il 01 l'ha esclusa dal set di attributi ma ha mostrato perche' pesa: e'
  l'unica scuola del canone che produrrebbe una forma **persistente e non balistica**, e quindi
  l'unica che metterebbe alla prova la pipeline fuori dal caso proiettile. Non e' ancora
  ticketizzabile: dipende da come il 04 definisce lo stadio "forma".
- **Materie derivate dalle combinazioni.** Vapore, fango, fulmine: nuclei ottenuti
  combinandone due. L'utente le vuole, ma non sono ticketizzabili finche' le quattro di base
  non sono rese — dipendono dal 06.
- **La materia luce.** Quinta materia del canone di WHA, non adottata dal 04. Non e' fuori
  scope: e' l'unica materia senza massa, quindi quella che metterebbe alla prova il modello
  invece di confermarlo. Rimandata con le derivate.
- **Effetti oltre il bloom.** Il 03 concede **un solo** passo full-screen e il bloom se lo prende.
  Se piu' avanti un archetipo chiedesse distorsione o aberrazione, andrebbero infilate dentro quel
  passo o dentro l'uber-shader. Non ticketizzabile finche' il 06 non dice quali archetipi esistono.
- **Estrazione in repo proprio.** Oggi il progetto vive in `magic-builder/` dentro un repo di
  esercizi Java. Se cresce, si sposta. Decisione a valle, non prerequisito.

## Out of scope

Ruled out consapevolmente. Non graduano: tornano solo se la destinazione viene ridisegnata.

- **Progressione e sblocchi.** Scelto sandbox aperta: il limite e' mana e controllo, non permessi.
- **Bersagli reattivi con affinita' elementali.** Il poligono ha bersagli inerti. Evoluzione
  naturale una volta che le regole esistono, ma non in questa mappa.
- **Personaggio / caster a schermo.** Ogni poligono speso sul caster e' tolto alla spell.
- **Layout verticale e responsive.** Solo orizzontale.
- **Canti e incantesimi.** Il canone li ha, questo progetto no: si plasma per immagine.
