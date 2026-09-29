# Spinforge — asset generati con Higgsfield

Progetto Higgsfield: **Spinforge** (`c19f800f-25ce-49e3-af5b-c8d5b0365252`).
Stile: 3D toon, cel shading. Tutti i pezzi sono isolati su sfondo grigio neutro,
vista 3/4, pronti per la conversione image → 3D (Tripo H3.1, 9 crediti a mesh).

## Sistema modulare

Un top = **LAMA** + **BLOCCO** (ratchet) + **PUNTA** (bit). Ogni pezzo sposta i
sei fattori del top base (vedi `../DESIGN.md`). Le combinazioni danno i Blade
personalizzati; la CPU usa gli stessi pezzi ricolorati in Godot.

## Roster pixel art (in gioco)

Dai bozzetti approvati sono nati i pezzi **pixel art procedurali** in
`index.html` (sezione `PEZZI IN PIXEL ART`): ogni pezzo è una funzione di forma
polare rasterizzata in isometria con contorno, luce e ombra, 12 fotogrammi di
rotazione e colori modificabili. Nessun file immagine, nessun credito.

| Lame | Blocchi | Punte |
|---|---|---|
| RAPTOR (attacco, 3 artigli) | INGRANAGGIO d'oro (2 denti di burst, +aggressività) | RUBBER (aderenza 1.60, stabilità 0.70) |
| CYCLONE (attacco, 4 falci) | 3 DENTI BASSO (3 denti, +stabilità) | FLAT (1.40 / 0.80) |
| ORBIT (equilibrio, 5 ali) | 5 DENTI (4 denti) | BULLET (1.20 / 0.95) |
| BASTION (difesa, 8 respingenti) | 6 RINFORZATO (5 denti, +massa) | BALL (1.00 / 1.00) |
| HALO (resistenza, bordo d'oro) | | SHARP (0.55 / 1.35) |

5 × 4 × 5 = 100 combinazioni. Proporzioni in gioco: lama raggio 18 px (sprite
2x), blocco 12 px, fianchi di 1 px per fascia, trottola bassa e schiacciata
(fattore iso 0.6) come nella versione a poligoni.

Preset: RAPTOR FLARE, RAPTOR STRIKE, ORBIT VEIL, ORBIT EDGE, BASTION WALL,
BASTION CORE, HALO DRIFT, HALO CROWN, CYCLONE RUSH, CYCLONE SWEEP. Il garage salva nome, pezzi e colori; i Blade creati entrano nel
roster (salvati nel browser) e la CPU può pescarli.

Per aggiungere un pezzo: una voce in `PARTS` con `sym`, `side`, `mod`,
`colors` e `shape(r,a)` (o `profile` per le punte).

## Bozzetti (fase 1, 0.25 crediti l'uno)

| # | File (destinazione) | Pezzo | Job Higgsfield |
|---|---|---|---|
| 0 | `concepts/00_esploso.png` | Vista esplosa di riferimento | `e16d3a94-93cb-4874-816e-75e7bfce577f` |
| 1 | `concepts/blade_attack_raptor.png` | Lama ATTACCO · RAPTOR (3 artigli) | `74aabc3c-dfbd-4499-a169-b546d43859f0` |
| 2 | `concepts/blade_defense_bastion.png` | Lama DIFESA · BASTION (8 lobi) | `409d540c-a48c-48e8-95ac-b6e0c47d7dbe` |
| 3 | `concepts/blade_stamina_halo.png` | Lama RESISTENZA · HALO (bordo pesante) | `d00cb633-8af8-4644-8db7-c0104eb43a1c` |
| 4 | `concepts/blade_balance_orbit.png` | Lama EQUILIBRIO · ORBIT (5 ali) | `13382115-4dd3-41fb-b373-81b9a570d875` |
| 5 | `concepts/ratchet_3denti.png` | Blocco basso, 3 denti | `7fd710e3-cb5e-4364-ab71-75665a8af86b` |
| 6 | `concepts/ratchet_5denti.png` | Blocco medio, 5 denti | `1125eeb9-07ca-40d7-9beb-77670c87944e` |
| 7 | `concepts/ratchet_6denti_rinforzato.png` | Blocco alto rinforzato, 6 denti | `c142fb6d-33e4-4c2f-9af7-89aed85d1ecd` |
| 8 | `concepts/bit_flat.png` | Punta FLAT | `565341c4-6506-4790-abb9-ebb2ab3d60c1` |
| 9 | `concepts/bit_ball.png` | Punta BALL | `adc4fd51-2b9a-44ee-9c8f-aed14267d94d` |
| 10 | `concepts/bit_sharp.png` | Punta SHARP | `7232fc9a-1053-41bc-9658-634e2397b983` |

Il CDN di Higgsfield (`d8j0ntlcm91z4.cloudfront.net`) è bloccato dalla policy di
rete dell'ambiente: nel repo ci sono solo le immagini caricate a mano in chat
(concept di RAPTOR, ORBIT, BASTION, CYCLONE, 3 DENTI BASSO, 5 DENTI,
6 RINFORZATO, SHARP, BALL, vista esplosa; stadi cemento, giardino zen, tempio,
neon; UI garage e HUD). Le altre restano nel progetto Higgsfield.

## Pezzi → fattori (proposta)

| Pezzo | MASSA | INERZIA | AGGRESS. | BLOCCO | ADERENZA | STABILITÀ |
|---|---|---|---|---|---|---|
| Lama RAPTOR | 0.95 | 0.85 | **1.35** | | | |
| Lama BASTION | **1.30** | 1.00 | 0.70 | | | |
| Lama HALO | 1.05 | **1.35** | 0.75 | | | |
| Lama ORBIT | 1.10 | 1.10 | 1.00 | | | |
| Blocco 3 denti | | | +0.10 | **0.70** | | |
| Blocco 5 denti | | | | 1.00 | | |
| Blocco 6 rinforzato | +0.05 | | −0.10 | **1.35** | | |
| Punta FLAT | | | | | **1.40** | 0.80 |
| Punta BALL | | | | | 1.00 | 1.00 |
| Punta SHARP | | | | | 0.55 | **1.35** |

Sopra le parti, un **budget di punti** (±0.5 totali, ogni fattore 0.6–1.4)
permette di rifinire.

## UI e stadi (fase 1b, pixel art 16:9, 0.25 crediti l'una)

| # | Destinazione | Contenuto | Job Higgsfield |
|---|---|---|---|
| 0 | `ui/title.png` | Schermata iniziale: logo SPINFORGE, menu GIOCA / GARAGE / TORNEO / OPZIONI | `c9c6517b-9bb4-4997-82c9-a99b7137bfe9` |
| 1 | `ui/garage.png` | Garage: vista esplosa, carte LAMA/BLOCCO/PUNTA, colori, 6 fattori | `4bdb2441-3e5e-41e5-8a2e-1335df6c3464` |
| 2 | `ui/hud.png` | HUD di battaglia: spin, carica, blocco, punteggio, RUSH | `e6631f7d-331c-4f29-91e3-20c8c151bf1e` |
| 3 | `ui/xtreme_finish.png` | Schermata di vittoria XTREME FINISH con pezzi che volano | `43a8bff2-3619-40da-b8c4-473dd67f3ba0` |
| 4 | `stadi/cemento.png` | Stadio classico: conca di cemento al tramonto, solco ciano | `99569f8c-c155-4b69-a0d2-79567fa9cf06` |
| 5 | `stadi/vulcano.png` | Roccia vulcanica con crepe di lava, solco di magma | `3615b4cc-4b98-4795-8e78-5b9e8d7c82aa` |
| 6 | `stadi/ghiaccio.png` | Ghiaccio levigato, solco bianco, aurora | `05726d8e-8a06-4a76-b7c8-b6e9d74f88b1` |
| 7 | `stadi/neon.png` | Pannelli metallici con griglia neon, skyline cyberpunk | `a43426bd-ff25-40b4-a1c9-2290b68f10e0` |
| 8 | `stadi/tempio.png` | Arenaria di un tempio nel deserto, solco dorato | `fb8ceca1-b75d-4b9d-904f-bcdc0415e1c7` |
| 9 | `stadi/giardino_zen.png` | Pietra muschiosa, ghiaia rastrellata, solco di giada | `ae23f446-bb87-43b1-804a-7fcb5982b51d` |

Ogni stadio può diventare una variante di gameplay (idee): ghiaccio = attrito
delle punte ridotto; vulcano = consumo più alto ma solco più generoso; neon =
solco doppio; tempio = conca più ripida; giardino zen = conca più piatta.

Bozzetti dei pezzi nuovi, stesso stile toon dei precedenti:

| # | Pezzo | Job Higgsfield |
|---|---|---|
| 10 | Lama CYCLONE | `1396c614-4426-40dc-a930-1f226b03a068` |
| 11 | Blocco 3 DENTI BASSO | `14f9618d-8f27-4195-9631-3a2f8fce234a` |
| 12 | Punta RUBBER | `23ad8d1e-eb51-41e2-ae78-db130d92b4b0` |

## Scelte dell'utente (fase 1b)

Stadi: **cemento**, **giardino zen**, **tempio**, **neon** (in `stadi/`).
UI di riferimento: **garage** e **HUD** (in `ui/`).

## Fase 2: conversione 3D

| Pezzo | Modello | Crediti | Job Higgsfield | File |
|---|---|---|---|---|
| Lama RAPTOR (test) | Tripo H3.1 image→3D, texture PBR, 20k facce | 9 | `490de015-2695-4096-8965-10c8a4e7aa1a` | `models/blade_raptor.glb` |
| Lama ORBIT | Tripo H3.1 image→3D, texture PBR, 20k facce | 9 | `c8ee8129-2b37-4fda-b445-9feb7d5d134b` | `models/blade_orbit.glb` |
| Lama BASTION | idem | 9 | `205ce59c-5d04-45c2-bdac-2fc47bf19220` | `models/blade_bastion.glb` |
| Lama HALO | idem | 9 | `430cdefd-fffe-415b-998a-4772c2b7ed14` | `models/blade_halo.glb` |
| Lama CYCLONE | idem | 9 | `4f7b01f6-1fd6-4244-a80d-926cf5a35e0f` | `models/blade_cyclone.glb` |

**Analisi di `blade_raptor.glb`** (anteprima in `models/blade_raptor_anteprima.png`):
18 564 triangoli, 11 322 vertici, 3.9 MB; disco 1 × 0.19 × 1 con asse Y in alto e
origine al centro (pronto per ruotare su se stesso); materiale PBR con mappe colore,
ORM e normali. Forma fedele al bozzetto (3 artigli, raggi dorati, anello con aperture).
Difetti: superficie un po' ondulata tipica delle mesh IA, `metallicFactor` 1.0 su
tutto (anche la plastica sembra cromata): in Godot va usato un materiale toon o
abbassato il metallo sulle parti in plastica.

Il roster ha 14 pezzi (5 lame, 4 blocchi, 5 punte). Tripo H3.1 image → 3D
costa 9 crediti a pezzo (126 in tutto); Tripo text → 3D 5 crediti (70).
Crediti disponibili dopo la fase 1b: 45.68.

## Cosa NON si genera con l'IA

- **Stadio**: conca procedurale in Godot (la fisica dipende dalla curva esatta).
- **Effetti, HUD, particelle**: nativi in Godot.


## Pipeline di cottura 3D → pixel art (`tools/bake`)

```
cd spinforge/tools/bake && npm i
node bake.js ../../assets/models/<modello>.glb <nome> 36 10 "sat=1.35&mode=1"
```

1. Render ortografico con la telecamera del gioco (elevazione 36.87° = schiacciamento
   iso 0.6), luce in alto a sinistra, metallo limitato a 0.45 (niente cromature).
2. 36 fotogrammi su un giro completo (10° l'uno, come gli sprite procedurali),
   renderizzati 8× più grandi e ridotti: pixel pieno se copertura > 50%, colore
   = colore più frequente del blocco (niente sfumature di bordo).
3. Saturazione +35% e tavolozza comune a tutti i fotogrammi (k-means, 10 colori):
   la rotazione non sfarfalla.
4. Contorno #0b1012 di 1 pixel. Uscita: `assets/sprites/<nome>.png` (spritesheet),
   `<nome>.json` (S, H, n, tavolozza), `<nome>_anteprima.png`.

Nel gioco lo spritesheet è incorporato in `index.html` (`BAKED`, base64) e il pezzo
usa `baked:'<nome>'`. RAPTOR 3D: 40×31 px per fotogramma, 21.7 KB. I pezzi cotti
hanno i colori della texture (non ricolorabili dal garage).


### Le 5 lame 3D in gioco

| Lama | Triangoli | Spessore | Inclinazione corretta | Sprite |
|---|---|---|---|---|
| RAPTOR | 18 564 | 0.19 | 0.6° | 40×32, 36 fotogrammi |
| ORBIT | 18 844 | 0.14 | 0.4° | 40×30 (6 ali invece di 5 del bozzetto) |
| BASTION | 19 388 | 0.26 | 0.6° | 40×34 |
| HALO | 19 298 | 0.10 | 0.1° | 40×29 |
| CYCLONE | 19 799 | 0.34 | **17.3°** | 40×44 (il modello usciva inclinato) |

La cottura ora raddrizza ogni modello (`align=1`): la normale del piano di minima
varianza dei vertici (PCA) viene allineata all'asse Y, così la lama gira in piano.
Nel gioco le lame 3D hanno i nomi originali e sono usate dai preset; le lame
procedurali restano come varianti **PX** ricolorabili.


## Ricolorare le lame 3D (palette swap)

Le lame cotte non sono più a colori fissi. Al caricamento il gioco analizza la
tavolozza di ogni spritesheet e divide i colori in tre famiglie:

| Famiglia | Regola | RAPTOR | CYCLONE | ORBIT | BASTION | HALO |
|---|---|---|---|---|---|---|
| **p** primario | tinta satura con più pixel | rosso | verde lime | viola | turchese | oro |
| **s** secondario | seconda tinta satura, se distante ≥ 18° | oro | verde scuro | — | — | — |
| **m** metallo | saturazione < 22% (grigi, argento, crema) | acciaio | argento | argento | grigio | crema |

Scegliendo un colore, ogni tono della famiglia prende tinta e saturazione del
nuovo colore e conserva lo scarto di luminosità dal tono medio della famiglia:
luci, ombre e riflessi del modello restano. Il garage mostra solo le famiglie
presenti nella lama.

### Come generare le prossime mesh perché si ricolorino al meglio

- **Due tinte ben separate + metallo neutro** (es. "red body, gold accents,
  silver steel edges"): tre famiglie pulite. Evitare tinte vicine (rosso e
  arancio) che finiscono nella stessa famiglia.
- **Parti metalliche davvero grigie**, non dorate: l'oro satura viene letto come
  colore, non come metallo.
- **Niente decalcomanie, loghi o sfumature arcobaleno** sulla texture.
- Per Godot il passo successivo è lo stesso principio in uno shader: una maschera
  a 3 canali (primario, secondario, metallo) ricavata dalla texture con la stessa
  classificazione, e tre colori uniformi scelti dal garage.
