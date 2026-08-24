# 06 — Contratto di rendering per stadio

Type: grilling (declassato ad AFK — vedi Notes della mappa)
Status: resolved
Blocked by: 02, 03, 04

## Question

Come diventa immagine una pipeline composta?

Questo ticket esiste per rispondere al rischio dichiarato in cartografia: un builder puro produce
resa generica per costruzione, e il pericolo e' un sistema di regole elegante che sullo schermo fa
grigio. In un progetto sulla magia, lo spettacolo *e'* il punto.

- Il **contratto**: cosa ogni stadio garantisce al renderer, e cosa il renderer garantisce a ogni
  stadio. Deve valere per combinazioni che nessuno ha previsto.
- Come **compongono** i contributi visivi di stadi diversi senza diventare fango.
- Dove entra l'**attributo** (fuoco/acqua/vento/terra) nella resa: palette, comportamento,
  entrambi.
- Come si rende la **degradazione** del 05: un fallimento deve essere bello quanto un successo, o
  nessuno sperimentera'.
- Cosa sta nel budget del 03 e cosa no.

## Output atteso

Il contratto scritto, piu' l'elenco delle tecniche ammesse e di quelle escluse per budget.

## Answer

Risolto. Contratto completo in
[`magic-builder/docs/06-contratto-di-rendering.md`](../../../magic-builder/docs/06-contratto-di-rendering.md).

### Il substrato

Ogni immagine e' **un campo di particelle istanziate**, mosse da un modello di forze e ombreggiate
dall'uber-shader della materia. Le forme non esistono come oggetti: **emergono dal moto**.

Le sei qualita' del 04 sono **sei termini della stessa equazione di moto**: direzione = asse e
velocita' iniziale; convergenza/dispersione = segno della forza radiale; forza/cedevolezza = massa;
durata/istantaneita' = vita della particella; stabilita' = ampiezza del rumore; levitazione =
moltiplicatore di gravita'. Sei qualita', sei termini, nessun residuo — conferma che il vocabolario
del 04 era della dimensione giusta.

### La regola anti-fango

**Le qualita' muovono, la materia dipinge, non si scambiano mai di ruolo.** Nessuna qualita' tocca
colore, alfa o dimensione; nessuna materia tocca il moto.

E' la risposta alla domanda del ticket: i contributi compongono senza diventare fango perche'
**compongono in spazi diversi**. Il moto si somma, che e' cio' che le forze fanno. L'aspetto non si
compone affatto: una materia, un look, deciso a mano.

E' anche il motivo per cui quattro uber-shader bastano: uno shader deve dipingere *una* materia, non
prevedere le combinazioni. La combinatoria vive nella simulazione, che e' aritmetica, non pixel.

### Il contratto

**Simulazione → shader**, per particella: posizione, velocita', eta' normalizzata in [0,1],
**coerenza** in [0,1] (la nitidezza propagata alla particella).

**Shader → simulazione**: dipinge qualunque particella per qualunque parametro senza uscire dalla
palette della materia e senza superare il budget d'alfa. Nessun diritto di veto.

La `coerenza` e' l'unico canale visivo globale, dedicata a una cosa sola: **la nitidezza del bordo**.
Immagini nitide hanno bordi netti, sfocate li hanno sbavati — la nitidezza si legge a colpo d'occhio
senza un numero in un angolo.

### Budget verificato

Tetto **2.000 particelle attive, lato medio massimo 37 px**: e' il prodotto numero × area a vincolare,
come stabilito dal 03. La simulazione **rimpicciolisce le particelle quando il numero sale**, cosi'
il budget e' rispettato per costruzione invece che sperato.

Draw call: 7-10 per frame (una istanziata per immagine, suolo, bersaglio, quattro passi di bloom a
1/4) contro un budget di 30. Margine larghissimo.

### La degradazione resa

| Stato | Come si vede |
|---|---|
| pulita | particelle strette sull'asse, bordi netti, palette satura |
| deriva | l'asse scarta, e un **asse fantasma** tenue mostra dove volevi tirare |
| inversione spontanea | pulsazione cromatica nell'istante del ribaltamento, poi il moto fa l'opposto |
| instabilita' | le vite si sfrangiano, la scia si spegne a chiazze |
| collasso | l'emissione si rovescia sull'origine, lampo nel colore della materia, scossa di camera |

L'**asse fantasma** e' il pezzo che conta: senza, una spell che sbaglia bersaglio sembra solo mirata
male; con, il sistema ti dice *quanto* hai sbagliato e da che parte.

**Alternative scartate**: qualita' che modulano anche il colore (era la strada diretta al fango, ed
e' ciò che la regola del §2 vieta); un uber-shader unico per tutte le materie (ogni spell avrebbe
pagato il ramo piu' caro); geometrie dedicate per forma (rimette in piedi lo stadio "forma" che il
04 ha eliminato, e moltiplica i programmi).

## Nota (ripensamento sulla carica)

L'intensita' come scalare moltiplicativo decade col ripensamento sulla carica (vedi 05 riaperto).
Il substrato, la regola anti-fango, il contratto e il budget **non dipendevano** dalla carica e
restano validi. Va rivista solo la fascia degli stati di degradazione, che era ancorata allo sforzo.

## Aggiornamento (05 seconda stesura)

Gli stati di degradazione da rendere sono **quattro**, non cinque: pulita, deriva, inversione
spontanea, collasso. `instabilita'` e' eliminato perche' irraggiungibile.

Il **collasso** cambia innesco: non e' piu' una fascia di nitidezza ma un evento — il serbatoio che
si esaurisce a meta' evocazione. Va reso come tale: le due barre che corrono, e quella del mana che
arriva a zero per prima.

Substrato, regola anti-fango, contratto e budget restano invariati.

## Aggiornamento (04/05 terza stesura)

Gli assi diventano **continui** e passano da sei a otto. Per il rendering questo **semplifica**: le
uniform sono continue e spariscono i rami nell'uber-shader. Restano quattro programmi, uno per
materia.

Due termini nuovi nell'equazione di moto: **momento angolare** (asse rotazione) e **ritmo di
emissione** (asse ritmo, continuo ↔ a raffiche).

Il substrato, la regola anti-fango, il contratto e il budget restano invariati. Anzi la regola
anti-fango si rafforza: i **valori di riposo** danno alle materie un'identita' meccanica *senza* che
la materia tocchi il moto scelto — riempie solo i vuoti.
