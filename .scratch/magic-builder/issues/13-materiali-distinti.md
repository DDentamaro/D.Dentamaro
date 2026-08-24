# 13 — Le materie non si distinguono

Type: research
Status: resolved

## Question

L'utente: «le spell non sembrano diverse tra di loro». Perche', e come si ripara in un sistema
generico che non puo' avere uno shader per materia (ticket 03: zero compilazioni a runtime)?

## Answer

### La diagnosi, dal repo di riferimento

`LinearAbilityCasting` ha **un materiale GLSL scritto a mano per abilita'**: otto file, **3.951
righe**, da 20 a 90 uniform ciascuno. Li' la diversita' e' cesellata a mano.

Da noi la materia cambia **due colori** e nient'altro. Tutto il resto — forma, rumore, bordo — e'
identico per tutte e quattro. Per questo si somigliano: non e' un difetto di taratura, e' che non
c'e' niente da tarare.

### Cosa distingue davvero un materiale, guardando le uniform

| | |
|---|---|
| `IceMaterial` | `uFacetSharp uFracture uVeins uSparkle uFresnel uTranslucency` |
| `VolumetricFireMaterial` | `uSwirl uVortex uFlow uBuoyancy uShred uFlicker uTempCore uTempEdge` |

E la libreria di rumore condivisa espone: `snoise fbm3 fbm4 **ridged** **curlNoise** **voronoi2**`.

**E' il tipo di rumore a fare la materia.** Voronoi da' cristallo, faccette, crepe. Curl da' flusso e
vortice. Ridged da' scariche. Fbm da' fumo. Tutti e otto i materiali del riferimento usano rumore +
rampa + bordo; **cambia quale rumore domina**.

Da qui la riparazione: l'uber-shader riceve **tutti e quattro i rumori**, e la materia porta un
**profilo di pesi**. Nessun codice per materia, come vuole il 03 — solo una manciata di numeri in
piu' dei due colori di adesso.

### Lo strumento Python

`magic-builder/tools/materiali.py` implementa in numpy gli **stessi primitivi** del GLSL — fbm,
ridged, voronoi, curl — li compone secondo un profilo e disegna un **provino a contatto**: quattro
materie per tre eta'.

Serve a **scegliere guardando** invece che indovinare nel browser. I profili scelti finiscono nel
shader come dati, non come codice.

Nota sulle librerie: `caseman/noise` (la libreria Perlin storica per Python) **non compila** in
questo ambiente, e comunque i primitivi vanno riscritti a mano per corrispondere al GLSL riga per
riga. Numpy basta.

### I profili scelti

| Materia | fbm | ridged | voronoi | curl | bordo | durezza |
|---|---:|---:|---:|---:|---:|---:|
| fuoco | 0,35 | 0,05 | 0,00 | **0,60** | 0,10 | 0,15 |
| acqua | 0,45 | 0,05 | **0,35** | 0,15 | **0,55** | 0,55 |
| terra | 0,30 | 0,00 | **0,70** | 0,00 | 0,25 | **0,85** |
| vento | 0,30 | 0,10 | 0,00 | **0,60** | 0,15 | 0,08 |

Piu' tre colori per materia (nucleo / mezzo / bordo) invece di due, e le scintille per l'acqua.

Nel provino: il fuoco e' turbolento con bordi sfrangiati, l'acqua ha punte cristalline e scintille,
la terra e' un poliedro sfaccettato a bordo duro, il vento e' quasi tutto alone.

### Su Material Maker

La ricerca su GitHub ha trovato **[material-maker](https://github.com/RodZill4/material-maker)**:
grafo a nodi che **genera GLSL**, 200+ nodi, MIT — l'alternativa aperta a Substance Designer. E'
Godot, non Python, quindi non e' integrabile nel nostro flusso; ma il suo modello — **nodi che
compongono primitivi e sputano uno shader** — e' esattamente la struttura che stiamo replicando in
piccolo con quattro rumori e un profilo di pesi.

Gli altri risultati Python (Material-Map-Generator, Texture-Map-Generator, PBRify) generano mappe PBR
**a partire da una foto**: inutili qui, dove non esistono asset di partenza.

### Alternative scartate

Uno shader per materia (vietato dal 03); texture precotte da caricare (viola «zero asset», e sul
tiler la banda e' la risorsa scarsa); tenere due soli colori (e' la causa del problema).

## Passa all'implementazione

Portare i quattro rumori e il profilo nel fragment shader dell'uber-shader. `voronoi` e `curl` sono
i piu' cari: vanno misurati contro il budget del 03 sul frame time reale.

## Implementazione

I quattro rumori sono nel shader, con i profili scelti nel provino Python.

**Decisione di architettura imposta dal budget**: il rumore della materia si valuta **una volta per
particella, nel vertex shader**, non per frammento. Il `curl` per frammento costerebbe ~80 hash, cioe'
~200 milioni di valutazioni per frame a 2,8M frammenti — fuori dal budget del ticket 03. Al frammento
resta il bordo sfrangiato e la rampa. Una particella e' ~26px: il dettaglio interno non si vedrebbe
comunque.

**Rami su uniform**, non per frammento: sono coerenti per l'intera draw, quindi **solo le materie che
usano un rumore lo pagano**. Confermato dai tempi misurati (rasterizzazione software, quindi contano
i rapporti, non i valori):

| Materia | rumori attivi | frame time |
|---|---|---:|
| vento | fbm, ridged, curl | **17,8 ms** |
| fuoco | fbm, ridged, curl | 29,4 ms |
| terra | fbm, voronoi | 34,4 ms |
| acqua | tutti e quattro | **39,7 ms** |

**Il voronoi e' il caro**, come previsto. Va rimisurato su GPU vera.

### Due difetti trovati misurando

1. **Le materie morbide sparivano.** Con `durezza 0.08` il vento spalma la maschera su meta' del
   raggio e l'alfa scende sotto la soglia di visibilita'. Aggiunta una compensazione: piu' morbida
   la materia, piu' alfa.
2. **La Lancia di vento non arrivava mai al bersaglio** — e non era un bug di resa. Carico 12,0
   chiede **108 di mana su un serbatoio da 100**: collassa a meta' evocazione. Il vento che combatte
   la propria natura (convergenza e forza contro dispersione e leggerezza) e' letteralmente
   inaccessibile a dose piena. **Il sistema stava funzionando**; era la sonda a ingannarmi. Al 55%
   di dose costa 59 e arriva.

### Cosa resta

Il nucleo solido e' ancora un box non orientato e senza materiale: va allineato all'asse e deve
ricevere lo stesso profilo di rumore delle particelle.

## Seconda passata: dalla nuvola alla mesh

L'utente: «sono ancora rese malissimo, partiamo dal proiettile di fuoco e modificando quella mesh
produciamo tutte le altre».

Aveva ragione sulla diagnosi di fondo, e il difetto era architetturale: **stavo disegnando nuvole di
billboard, e una nuvola di billboard non sara' mai un proiettile.** I profili di rumore del passo
precedente cambiavano il colore e la grana della nebbia, non la *cosa*.

### La mesh

Un'**icosfera procedurale** (3 suddivisioni, 1.280 triangoli) generata a codice, deformata nel vertex
shader:

- **goccia**: fronte pieno, coda che si assottiglia e si allunga lungo l'asse di volo (`uCoda`)
- **rumore sul raggio**: lo stesso profilo di pesi della materia, ma in **3D** — `fbm3`, `rid3`,
  `vor3` — con ampiezza, frequenza e velocita' per materia
- **consumo**: il raggio cala invecchiando

Il fragment fa fresnel, rampa di temperatura a tre colori (nucleo caldo davanti, coda e bordi
freddi), bordo che si accende e scintille.

**Le altre materie non sono altre mesh: sono la stessa, deformata diversamente.**

| Materia | amp | freq | vel | coda | opacita' | Cosa produce |
|---|---:|---:|---:|---:|---:|---|
| fuoco | 0,62 | 2,4 | **2,6** | **1,5** | 0,95 | bitorzoluto, in movimento, con la scia |
| acqua | 0,48 | 1,5 | 0,35 | 0,45 | 0,88 | compatto, quasi fermo, bordo netto |
| terra | **0,70** | 1,1 | **0,05** | 0,15 | 1,00 | grossi bozzi, immobile, opaco |
| vento | 0,34 | **3,2** | **4,5** | **2,6** | **0,42** | minuto, frenetico, trasparente |

### Un errore ripetuto

**L'additivo puro bruciava di nuovo a bianco**, come gia' successo con le particelle: la mesh usciva
come una lampadina. Passata ad **alfa premoltiplicato**, e la rampa di temperatura e' comparsa. Da
segnare come regola: in questo progetto l'additivo va usato solo per il bordo e per le scintille, mai
per il corpo.

### Cosa resta debole

- **Le sagome si somigliano ancora troppo**: `amp` e `coda` vanno spinte a valori piu' estremi.
- **La scia di particelle domina la lettura** rispetto alla mesh.
- **L'acqua dovrebbe essere sfaccettata** (voronoi) ma legge liscia: `vor3` a frequenza 1,5 e'
  troppo dolce sul raggio.
