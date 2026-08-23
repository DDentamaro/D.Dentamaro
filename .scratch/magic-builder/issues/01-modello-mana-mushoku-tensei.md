# 01 — Il modello del mana in Mushoku Tensei, senza canti

Type: research
Status: resolved

## Question

Quale modello concettuale di manipolazione del mana offre *Mushoku Tensei*, una volta tolto il
canto, e quali pezzi sono riusabili come regole di un builder?

Da estrarre in particolare:

- Il **canto silenzioso** e il ruolo dell'**immagine** (la visualizzazione che sostituisce le
  parole): cosa determina potenza, forma e precisione quando non c'e' incantesimo.
- La **capacita' di mana** come riserva personale finita: come si consuma, come si ricarica, cosa
  significa esaurirla.
- Il **controllo** come abilita' distinta dalla capacita': cosa succede a chi ha molto mana e poco
  controllo, e viceversa.
- Il set di **attributi** e quali hanno senso in un poligono di tiro con bersagli inerti
  (guarigione e detossificazione probabilmente non ne hanno).
- Le **scale di potenza** e se sopravvivono senza il canto che le scandiva.

## Output atteso

Un file markdown in `magic-builder/docs/` con il modello estratto, separando nettamente cio' che e'
canone da cio' che e' nostra inferenza. Alimenta il ticket 04.

## Answer

Risolto. Findings completi in [`magic-builder/docs/01-modello-mana.md`](../../../magic-builder/docs/01-modello-mana.md).

**Il risultato che conta**: il canone consegna la pipeline gia' fatta, e ha **tre** stadi, non sei.
Il canto silenzioso e' descritto come tre passaggi mentali — evocare la **forma**, aggiungere
**mana** per la potenza, fissare la **velocita'** — piu' parametri regolabili al volo (potenza,
velocita', dimensione, temperatura). L'ipotesi di cartografia a sei stadi (`sorgente →
compressione → forma → moto → interazione → dissipazione`) era invenzione nostra ed e' morta:
tre stadi sono canone e coincidono con i vincoli gia' fissati (pochi stadi, e una catena che deve
entrare in uno schermo orizzontale).

**Altri esiti:**

- **Attributi**: quattro d'attacco (fuoco/acqua/terra/vento). Guarigione, detossificazione ed
  evocazione non hanno bersaglio in un poligono inerte. **Barriera** e' l'esclusione che pesa —
  l'unica scuola che darebbe una forma persistente e non balistica — e va in **nebbia**, non fuori
  scope.
- **Rango**: nel canone si paga in lunghezza del canto. Tolto il canto, quel costo va ricollocato,
  o niente impedisce di lanciare rango Dio al primo secondo. Ed essendo la progressione fuori
  scope, il rango non puo' essere un cancello: resta come **scala comprata col mana**. Passa al 05.
- **Esaurimento**: canonico e brutale — svuotare la riserva fa svenire. Fallimento gia' pronto.
- **Degradazione**: **non e' nel canone**. Il canone autorizza l'asse "controllo" ma non ne
  descrive il fallimento. Il 05 deve inventarla, non estrarla.

**Alternative scartate**: usare i sette ranghi come sblocchi progressivi (contraddice "progressione
fuori scope"); includere guarigione/detossificazione per fedelta' al canone (nessun bersaglio su
cui agire, sarebbero manopole morte).

**Limite della ricerca**: il proxy di rete blocca i domini delle wiki e delle testate, quindi le
fonti sono state lette attraverso i riassunti dei risultati di ricerca, non aprendo le pagine.
Alto per i fatti ripetuti da piu' fonti, medio per i dettagli singoli. Il documento marca ogni
affermazione come CANONE o INFERENZA.

**Glossario**: creato `magic-builder/CONTEXT.md` con i termini che questo ticket risolve —
mana, controllo, immagine, pipeline di plasmatura, attributo, rango, degradazione.

## Nota di superamento (ticket 04)

Il ticket 04 ha introdotto **Witch Hat Atelier** come modello di composizione. La pipeline a tre
stadi estratta qui (forma → potenza → velocita') **non e' piu' la struttura della spell**: descriveva
tre passaggi mentali, e la struttura adottata e' quella di WHA — nucleo, qualita' tipizzate, carica.

Resta valido tutto il resto, ed e' la parte che regge il modello finale: mana come riserva finita,
controllo distinto dalla capacita', le quattro materie d'attacco, l'esaurimento, e soprattutto la
segnalazione che il costo temporale del rango restava senza casa — buco che il 04 ha chiuso con la
carica.
