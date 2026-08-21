# CONTEXT — Magic Builder

Glossario del progetto. Solo termini di dominio: nessun dettaglio implementativo.

Vive qui e non nella radice del repo perche' la radice appartiene a un quaderno di esercizi Java —
deviazione consapevole da `docs/agents/domain.md`, che prescriverebbe `CONTEXT.md` alla radice.

Termini risolti dal ticket 01. Il vocabolario delle primitive arriva col ticket 04.

## Mana

Riserva personale finita che alimenta ogni spell. Si consuma lanciando e si ricarica. Svuotarla
del tutto e' un fallimento netto (nel canone: si sviene).

Non e' una statistica che cresce: la crescita della capacita' e' canone, ma per noi e'
progressione, ed e' fuori scope.

## Controllo

Abilita' di manipolare il mana, **distinta** dall'averne molto. Nel canone separa i pochi che
sanno lanciare in silenzio da tutti gli altri.

Cosa accade quando il controllo non basta e' nostro da inventare: il canone non lo descrive.

## Immagine

Cio' che sostituisce il canto. Si evoca mentalmente la forma della spell invece di pronunciarla.
E' il concetto che rende un *builder* coerente col canone: comporre una spell **e'** immaginarla.

## Pipeline di plasmatura

I tre passaggi in cui il canone scompone il lancio silenzioso: **forma → potenza → velocita'**.
La spina dorsale della composizione. Gli stadi definitivi e i loro operatori sono il ticket 04.

## Attributo

Scuola elementale della spell. In questo progetto sono quattro — **fuoco, acqua, terra, vento** —
cioe' le scuole d'attacco del canone. Guarigione, detossificazione ed evocazione non hanno
bersaglio in un poligono; **barriera** e' esclusa ma resta in nebbia.

L'attributo non e' uno dei tre stadi: e' ortogonale, e dove si agganci lo decide il ticket 04.

## Rango

Scala di grandezza dell'effetto: sette gradini nel canone, da Principiante a Dio. Nel canone si
paga in lunghezza del canto; senza canto diventa **scala comprata col mana**, mai un permesso —
la progressione e' fuori scope. E' una lettura del costo, non un cancello.

## Degradazione

Cosa succede a una spell che eccede il tuo controllo: parte lo stesso e peggiora, invece di essere
rifiutata. Termine **nostro**, non canonico. Definito dal ticket 05.
