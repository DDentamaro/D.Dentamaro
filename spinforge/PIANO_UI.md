# Spinforge — piano di sviluppo di layout, schermate e HUD

Riferimenti visivi (Higgsfield, in `assets/`):

| Riferimento | File | Cosa prendiamo |
|---|---|---|
| Garage | `ui/garage.png` | Vista esplosa a sinistra, righe di carte LAMA / BLOCCO / PUNTA, riga COLORE, 6 barre a segmenti con icone, intestazione a chevron |
| HUD di battaglia | `ui/hud.png` | Blocchi con emblema esagonale, barra spin avversario in alto, riquadro punteggio/round/tempo in alto a destra, SPIN + CARICA + BURST LOCK in basso a sinistra, grande pulsante RUSH in basso a destra |
| Stadi | `stadi/cemento.png`, `giardino_zen.png`, `tempio.png`, `neon.png` | Palette e atmosfera di 4 arene selezionabili |
| Schermata iniziale, vittoria | `ui/title.png`, `ui/xtreme_finish.png` | Solo su Higgsfield (job in `assets/ASSETS.md`): da caricare in chat per metterle nel repo |

Lame: restano quelle generate in 3D con Higgsfield e cotte in pixel art
(standard nel roster), più le varianti procedurali PX ricolorabili.

---

## 1. Direzione visiva (il sistema comune a tutte le schermate)

Dalle due immagini UI emerge un linguaggio preciso. Lo fissiamo una volta sola
come "design token" e componenti riusabili, così HTML e Godot restano coerenti.

**Palette** (estratta da garage/HUD, compatibile con il gioco attuale)

| Ruolo | Colore | Uso |
|---|---|---|
| Fondo pannello | `#0e2226` → `#122c31` | Riquadri, carte |
| Bordo pannello | `#e1a93b` (oro) | Cornici, selezione |
| Bordo secondario | `#2f5a5e` (verde acqua scuro) | Carte non selezionate |
| Accento energia | `#f08a24` → `#ffb13b` | Barre a segmenti, spin del giocatore |
| Accento carica | `#2f8fe0` → `#8fe0ff` | Carica cinetica, solco |
| Avversario | `#e0452b` / viola `#8a4fd6` | Barra spin CPU, emblema |
| Testo | `#f3e6c8` titoli, `#9fb6b4` secondario | |

**Forme e componenti**

- *Pannello a chevron*: rettangolo con angoli smussati a 45° e freccette `< >`
  sulle intestazioni (come "‹ GARAGE ›"). In HTML: `clip-path` + bordo in pixel;
  in Godot: `NinePatchRect` 9-slice da una texture 24×24.
- *Carta pezzo*: 64×64 con miniatura pixel, bordo verde acqua, bordo oro + alone
  quando selezionata.
- *Barra a segmenti*: 10 segmenti arancio con icona a sinistra e valore `7/10` a
  destra (garage). Mappatura fattori → segmenti: `round((f − 0.5) / 1.1 × 10)`.
- *Emblema esagonale*: esagono con bordo oro che contiene l'icona della lama
  (fotogramma 0 dello sprite cotto): identifica te e la CPU nell'HUD.
- *Pip del blocco*: esagoni piccoli pieni/vuoti (sostituiscono i rettangoli attuali),
  con riempimento parziale già supportato dal burst deterministico.
- *Pulsante tondo*: anello oro spesso, fondo rosso scuro, icona e scritta al centro
  (RUSH), anello di carica e di ricarica guardia intorno.

**Tipografia**: font bitmap pixel (es. *Silkscreen* o *Press Start 2P* via Google
Fonts per l'HTML; in Godot un `FontFile` bitmap). Due corpi: titoli 16 px, testo 8 px.

**Icone** (16×16 pixel, disegnate a mano o in codice): MASSA (peso), INERZIA
(cerchi concentrici), AGGRESSIVITÀ (esplosione), BLOCCO (scudo), ADERENZA (cerchio
con puntini), STABILITÀ (bilancia); più RUSH, GUARDIA, SOLCO, BURST.

---

## 2. Flusso delle schermate

```
TITOLO ─► MENU ─┬─► GIOCA ─► GARAGE ─► SCELTA STADIO ─► LANCIO ─► BATTAGLIA ─► FINE ROUND ─┐
                │                                                        ▲                  │
                │                                                        └──── round ◄──────┘
                │                                                   (a 4 punti) ─► RISULTATI ─► MENU
                ├─► GARAGE (solo modifica e roster)
                ├─► TORNEO ─► tabellone ─► partite in sequenza
                └─► OPZIONI (audio, comandi, accessibilità, LAB)
```

Ogni schermata è una scena separata (in HTML una `<section>` con transizione; in
Godot una scena `.tscn` caricata da un `SceneManager`).

---

## 3. Schermata per schermata

### 3.1 Titolo e menu (`ui/title.png`)
- Logo SPINFORGE pixel grande, arena animata sullo sfondo (la nostra conca con due
  lame della CPU che si scontrano davvero, in modalità dimostrazione).
- Menu verticale: GIOCA, GARAGE, TORNEO, OPZIONI; navigabile con tastiera, touch
  e gamepad; voce selezionata con bordo oro e freccia `›`.

### 3.2 Garage (`ui/garage.png`)
Sostituisce l'attuale sezione del pannello iniziale con una schermata piena:
- **Sinistra (40%)**: vista esplosa grande (lama, blocco, punta separati con linee
  tratteggiate), rotazione lenta; pulsante "‹ TOP COMPLETO ›" per vederlo montato.
- **Destra (60%)**: righe LAMA / BLOCCO / PUNTA con 6 carte visibili per riga e
  scorrimento orizzontale (10 lame, 4 blocchi, 5 punte).
- **COLORE**: riga di tasselli; per le lame 3D disattivata con nota "colori del
  modello".
- **Statistiche**: 6 barre a segmenti con icone; al passaggio su un pezzo, anteprima
  della variazione (segmenti che lampeggiano in verde o rosso).
- **Intestazione**: "‹ GARAGE ›" e "PERSONALIZZA · COMBINA · DOMINA".
- Sotto: nome del Blade, SALVA NEL ROSTER, roster a carte.

### 3.3 Scelta dello stadio (nuova)
Quattro carte con l'illustrazione dello stadio e il suo effetto sul gioco:

| Stadio | Effetto proposto |
|---|---|
| CEMENTO | Standard, nessun modificatore |
| GIARDINO ZEN | Conca più piatta (`G` −20%): scontri più lunghi, premia la resistenza |
| TEMPIO | Conca più ripida (`G` +25%): tutti tornano al centro, più impatti |
| NEON | Solco doppio (due anelli di ricarica), consumo +10% |

In battaglia lo stadio cambia i colori della conca procedurale (fondo, anelli,
colore del solco) e lo sfondo attorno; la fisica resta procedurale.

### 3.4 Lancio
- Barra di tempismo ridisegnata come pannello a chevron, con zona perfetta
  dorata e conto alla rovescia "3 · 2 · 1 · LANCIO!" grande al centro.

### 3.5 HUD di battaglia (`ui/hud.png`)
Disposizione, dall'alto:

| Zona | Contenuto | Oggi | Da fare |
|---|---|---|---|
| Alto centro | Emblema CPU + "OPPONENT SPIN" barra rossa, pip del blocco CPU | barra viola sottile | pannello a chevron con emblema esagonale |
| Alto destra | Riquadro "2 – 1 / ROUND 3 / 01:27" | testo semplice | riquadro con bordo oro, tempo in mm:ss |
| Basso sinistra | Emblema giocatore, SPIN ENERGY (oro), KINETIC CHARGE (blu), BURST LOCK (esagoni), XTREME RAIL (sottile) | 3 barre + pip | pannello unico come nell'immagine |
| Basso destra | Pulsante RUSH grande con emblema, anello di carica, tacca MAX, anello ricarica guardia | tondo semplice | pulsante illustrato, stati CARICA / MAX / GUARDIA |
| Centro | Notifiche (SPIN CLASH, PARATA…), numeri di danno | testo | lettering pixel con contorno, numeri con piccola animazione |

Regole: niente testo sopra l'arena oltre le notifiche; su mobile i due blocchi
bassi si restringono e il pulsante RUSH resta a portata di pollice.

### 3.6 Fine round e XTREME FINISH (`ui/xtreme_finish.png`)
- Rallentatore di 0.4 s sull'ultimo colpo, poi scritta grande del tipo di finish
  (SPIN / BURST / XTREME) con esplosione pixel e punti assegnati che volano verso
  il riquadro punteggio.

### 3.7 Risultati
- VITTORIA / SCONFITTA, punteggio, statistiche già calcolate (spin tolto, perso,
  rubato, ricaricato, parate) come barre a segmenti, pulsanti RIVINCITA / GARAGE / MENU.

### 3.8 Torneo e opzioni
- Torneo: tabellone a 8 con Blade del roster, si avanza vincendo le partite.
- Opzioni: volume, vibrazione, dimensione HUD, alto contrasto, accesso al LAB.

---

## 4. Tappe di sviluppo

Prima si costruisce tutto nel prototipo HTML (iterazione veloce, provabile subito),
poi si porta in Godot con le stesse regole.

| # | Tappa | Contenuto | Verifica |
|---|---|---|---|
| 1 ✅ | Sistema UI | Token di colore, font pixel, pannello a chevron, carta, barra a segmenti, emblema, pip esagonali, pulsante tondo, 10 icone | Pagina di prova con tutti i componenti |
| 2 ✅ | HUD di battaglia | Layout di `hud.png` con i dati reali; stati del pulsante RUSH | Screenshot desktop e mobile a confronto con `hud.png` |
| 3 | Garage | Schermata piena di `garage.png`, anteprima delle variazioni | Stesso confronto con `garage.png` |
| 4 | Flusso e titolo | Scene separate, transizioni, menu, arena dimostrativa | Navigazione completa con tastiera e touch |
| 5 | Stadi | Scelta stadio, 4 palette della conca, modificatori di fisica | Torneo simulato per stadio (nessuno stadio deve rompere il bilanciamento) |
| 6 | Fine round e risultati | Rallentatore, lettering dei finish, statistiche | Partita completa |
| 7 | Torneo e opzioni | Tabellone, impostazioni, accessibilità | |
| 8 | Port in Godot 4 | `Theme` con i token, `NinePatchRect` per i pannelli, scene per schermata, fisica portata in GDScript, lame da `.glb` o sprite cotti | Stesse schermate, stesso torneo simulato |

## 5. Asset ancora da produrre

| Asset | Come | Costo |
|---|---|---|
| Texture 9-slice dei pannelli e dei pulsanti | Pixel art disegnata in codice (come i pezzi) | 0 |
| 10 icone 16×16 | Pixel art in codice | 0 |
| Emblemi delle lame | Fotogramma 0 degli sprite cotti dentro l'esagono | 0 |
| Logo SPINFORGE definitivo | Higgsfield (0.25 crediti) o lettering pixel in codice | 0–0.25 |
| Sfondi degli stadi | Le 4 illustrazioni scelte, ridotte e ricolorate in palette | 0 |
| Blocchi e punte in 3D | Higgsfield image→3D, 9 crediti l'uno (circa 81) | da ricaricare |

Crediti Higgsfield residui: circa 0.7.


## Stato

- **Tappa 1 — fatto.** In `index.html` (blocco CSS "SISTEMA UI"): token di colore
  `--ui-*`, pannello smussato `.ui-panel` (bordo oro con `clip-path`), emblema
  esagonale `.emblem`, barra a tacche `.gbar` (energia, carica, avversario, solco),
  pip esagonali del blocco con riempimento parziale, icone pixel 9×9 generate in
  codice (`ICONS`, per ora spin / carica / solco / scudo), font pixel *Silkscreen*
  (ripiego monospace se offline).
- **Tappa 2 — fatto.** HUD secondo `ui/hud.png`: pannello CPU in alto con emblema
  della sua lama e barra rossa; riquadro punteggio / round / tempo mm:ss; pannello
  del giocatore con SPIN ENERGY, CARICA, blocco e solco; pulsante RUSH con anello
  oro, anello di carica (blu, oro da MAX), stato MAX dorato e anello grigio di
  ricarica. Su mobile i suggerimenti si nascondono e le etichette si accorciano.
  Mancano ancora le icone delle 6 statistiche (servono al garage, tappa 3).
