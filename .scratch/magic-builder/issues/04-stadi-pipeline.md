# 04 — Gli stadi della pipeline di plasmatura e i loro operatori

Type: grilling (HITL ripristinato: l'utente lavora questo ticket di persona)
Status: resolved
Blocked by: 01

## Question

Di cosa e' fatta una spell? Quali stadi ha la pipeline, quanti sono, e quali operatori vivono in
ciascuno?

L'ipotesi da cui partire, emersa in cartografia: `sorgente di mana → compressione → forma → moto →
interazione → dissipazione`. Va confermata, tagliata o riscritta alla luce del 01.

Vincoli che questa decisione deve rispettare:

- **Pochi stadi, fissi.** E' la risposta al rischio-grigio: se ogni stadio e' un aggancio noto per
  il renderer, i VFX si cesellano *per stadio* invece che per spell.
- Deve reggere su un telefono in orizzontale: una catena che non entra nello schermo non fa vedere
  la catena, e far vedere la catena e' il punto del builder.
- La combinatoria non deve esaurirsi in una serata.

Decide anche il **set di attributi** e a quale stadio appartiene.

## Output atteso

Il vocabolario delle primitive, scritto abbastanza precisamente da poterci costruire sopra il costo
del mana (05) e il contratto di rendering (06). E' la prima voce del `CONTEXT.md` del progetto.

## Answer

Risolto **in HITL con l'utente**, non per delega. Modello completo in
[`magic-builder/docs/04-modello-immagine.md`](../../../magic-builder/docs/04-modello-immagine.md).

**Cambio di fonte.** A meta' ticket l'utente ha introdotto **Witch Hat Atelier** come modello di
composizione. Non sostituisce Mushoku Tensei: si innesta. WHA fornisce la **grammatica** (un glifo
e' sigillo al centro, segni attorno, anello che chiude e attiva; la proporzione fissa l'intensita';
ribaltare un segno ne inverte la funzione; combinare male e' catastrofico). MT fornisce **l'atto**
(si plasma per immagine mentale, la riserva e' finita, il controllo e' distinto dalla capacita').

**Non si disegna niente**: il glifo e' il modello, non l'interfaccia.

### Il modello

Un'**immagine** e' fatta di:

- **Nucleo** — quattro materie: fuoco, acqua, terra, vento. Una per immagine.
- **Qualita'** — sei modificatori **tipizzati**, e la tipizzazione e' il pezzo sofisticato: la
  classe decide cosa la qualita' espone, e da li' discendono UI, costo e uniform.
  - direzionale: *direzione* (vettore)
  - semi-direzionali invertibili: *convergenza ↔ dispersione*, *forza ↔ cedevolezza*,
    *durata ↔ istantaneita'*
  - non-direzionali: *stabilita'*, *levitazione*
- **Carica** — si tiene premuto; la durata **e'** il mana investito. Si rilascia, parte.

**Nessuno stadio "forma"**: emerge da direzione, convergenza e levitazione applicate al nucleo.

### Tre limiti distinti

Mana limita l'intensita' (si spende caricando). Controllo limita la complessita' (quante qualita'
si tengono nitide; superarlo sfoca invece di bloccare). Il tempo non e' una risorsa in piu' ma
l'interfaccia del mana — pur restando un costo tattico suo.

### Conseguenza determinata, non scelta

Quattro materie + zero compilazioni a runtime (ticket 03) + qualita' come uniform ⇒ **quattro
uber-shader, uno per materia**. E' anche la risposta al rischio-grigio: si cesella per materia. E
scioglie il nodo degli archetipi che era rimasto aperto — non sono una gabbia sopra il builder,
coincidono col nucleo.

### Chiude un buco del ticket 01

Il 01 aveva segnalato che, tolto il canto, il costo temporale del rango restava senza casa. La
carica lo rimette dov'era: il tempo torna a essere il prezzo della potenza.

**Alternative scartate**: cinque materie con la luce (rimandata, e con essa le derivate); tracciare
il glifo col dito e misurare la precisione della mano (l'utente ha escluso il disegno: la precisione
resta mentale, non manuale); la chiusura come proporzione impostata a mano (sostituita dalla carica,
che e' piu' diretta su touch e ripristina il costo in tempo del canone).

### Sblocca

05, 06, 07, 09.

## Answer (terza stesura)

Assi **continui** e valori di riposo per materia. Modello in
[`magic-builder/docs/04-modello-immagine.md`](../../../magic-builder/docs/04-modello-immagine.md),
catalogo dati in [`catalogo.json`](../../../magic-builder/docs/catalogo.json).

**Spell infinite**: le sei qualita' discrete diventano **otto assi continui** da −1 a +1. Le formule
con nome sono punti di riferimento su un continuo, non un catalogo chiuso, e interpolare fra due
spell salvate e' un'operazione sui numeri.

**Due assi nuovi**, che coprono buchi veri del modello di moto: **rotazione ↔ controrotazione**
(niente faceva ruotare — un ciclone girava solo nel nome) e **ritmo** (niente distingueva un flusso
continuo da una raffica).

**Valori di riposo per materia**: ogni materia porta i propri valori per gli assi non impostati, e
**non pagano carico**. La materia regala il suo carattere; le scelte sono cio' che paghi. Il fuoco
si apre, e' leggero, dura poco, sale e crepita; l'acqua tiene insieme mentre scorre; la terra e'
compatta, pesante e ferma; il vento disperde, non pesa e vortica.

**L'affinita' ne discende**: siccome il costo e' la distanza dal riposo (ticket 05), la stessa
"lancia" costa 6,8 nella terra e 12,0 nel vento. Su tredici archetipi: terra 4, vento 4, fuoco 3,
acqua 3. Nessuna materia universalmente migliore, nessuna neutra.

**Iterazioni di bilanciamento**: la prima passata dava terra 5 e fuoco 0 — il fuoco aveva valori
tutti vicini a zero ed era diventato neutro per sbaglio. La seconda dava acqua 0 per lo stesso
motivo. Risolto dando a ogni materia una natura marcata, e all'acqua in particolare l'identita' che
le mancava: il **flusso coerente**, l'unica che tiene insieme mentre scorre.

**Semplifica il rendering**: assi continui = uniform continue, **zero rami** nell'uber-shader.
