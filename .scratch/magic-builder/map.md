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
| Cuore | Builder-first: pipeline di plasmatura componibile |
| Canone | Concetto e regole di Mushoku Tensei, **senza canti** — si plasma per immagine |
| Limite | Riserva di mana (tetto duro) + controllo (fallimento per degradazione) |
| Ciclo | Poligono di tiro, bersagli inerti: costruisci → lancia → osserva → aggiusta |
| File | Un `.html`, zero dipendenze, zero asset, zero build, tutto procedurale. **Servito via https**, non aperto da `file://` (ticket 02: su iOS un file locale non esegue JS). Uno `<script>` classico: i moduli ES non funzionano su `file://`. |
| Rendering | Micro-renderer WebGL2 scritto a mano (ticket 02). Cap sul devicePixelRatio a 2. |
| Persistenza | `localStorage` + export/import come stringa di testo |
| Casa | `magic-builder/` in questo repo |
| Scena | Nessun caster a schermo |
| Postura | Orizzontale, due mani |
| Progressione | Nessuna: tutto sbloccato dal primo secondo |
| Prestazioni | Telefoni di generazione corrente, WebGL2, budget GPU mobile — non desktop |

## Decisions so far

<!-- una riga per ticket chiuso: gist + link. Il dettaglio vive nel ticket, non qui. -->

- [01 — Il modello del mana in Mushoku Tensei, senza canti](issues/01-modello-mana-mushoku-tensei.md): il canone descrive il canto silenzioso come tre passaggi — **forma → potenza → velocita'** — quindi la pipeline ha tre stadi, non sei; attributi ridotti ai quattro d'attacco; il rango diventa scala comprata col mana, mai un cancello; la degradazione non e' canonica e va inventata.
- [02 — Fondamenta tecniche di un file standalone](issues/02-fondamenta-tecniche-standalone.md): **micro-renderer WebGL2 a mano, niente three.js** — 4,6 KB misurati contro 515 KB tree-shaken, e il lato leggero e' gia' stato eseguito in Chromium; niente moduli ES su `file://`; su iPhone un file locale non esegue JavaScript, quindi il file (invariato, autonomo) si **serve via https**.

## Not yet specified

Nebbia in scope, non ancora abbastanza nitida per un ticket:

- **Suono.** Un builder di magia muto e' meno della meta' dell'effetto, ma non so ancora se la
  sintesi audio procedurale stia nel budget del file standalone, ne' se abbia un aggancio nella
  pipeline. Graduera' probabilmente dopo il 06 (contratto di rendering).
- **Come una spell passa da un telefono all'altro.** Il 09 decide il *formato*; resta aperto se la
  stringa basta o se serve qualcosa attorno.
- **Post-processing.** Il 02 ha tolto three.js e con esso `EffectComposer` e `UnrealBloomPass`: se
  vogliamo bloom o distorsione vanno scritti a mano. Se ne valga la pena lo dice il budget del 03.
- **Magia di barriera.** Il 01 l'ha esclusa dal set di attributi ma ha mostrato perche' pesa: e'
  l'unica scuola del canone che produrrebbe una forma **persistente e non balistica**, e quindi
  l'unica che metterebbe alla prova la pipeline fuori dal caso proiettile. Non e' ancora
  ticketizzabile: dipende da come il 04 definisce lo stadio "forma".
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
