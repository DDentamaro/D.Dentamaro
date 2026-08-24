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
