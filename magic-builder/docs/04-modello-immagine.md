# L'immagine: il modello di composizione

Risultato del ticket 04. Definisce cosa **e'** una spell in questo progetto.

Sintesi di due fonti, deliberata: **Witch Hat Atelier** fornisce la grammatica della composizione,
**Mushoku Tensei** l'atto che la esegue. Nessuna delle due da sola bastava.

**Non si disegna niente.** Il glifo di WHA e' il *modello*, non l'interfaccia: le sue proprieta'
sono state tradotte in struttura dati, non in un canvas da tracciare.

---

## 1. La traduzione

| Witch Hat Atelier | Che cosa significa | Innesto su Mushoku Tensei | Cosa diventa |
|---|---|---|---|
| **Sigillo** al centro | l'elemento della spell | la materia che immagini | **Nucleo** |
| **Segni** attorno | modificano forma e comportamento | i dettagli tenuti nell'immagine | **Qualita'** tipizzate |
| **Anello** che chiude e attiva | finche' e' aperto il glifo dorme | il rilascio | **Carica** |
| **Rapporto sigillo/anello** | intensita' | «aggiungi mana per aumentare la potenza» | **durata della carica** |
| **Precisione del tratto** | seal nitidi durano | il **controllo** | **nitidezza mentale** |
| **Segno ribaltato = funzione invertita** | orientamento come operatore | immagine speculare | **inversione** |
| **Combinazioni incompatibili = catastrofe** | il sistema non protegge | (assente in MT) | **degradazione** |

Le due righe centrali sono l'innesto vero. Il rapporto sigillo/anello di WHA e il passo 2 del canto
silenzioso di MT — «aggiungi mana per aumentare la potenza» — sono **la stessa regola in due
linguaggi**, uno spaziale e uno mentale. Non sono state forzate a combaciare: combaciano.

## 2. Un'immagine

L'unita' componibile di questo progetto si chiama **immagine**. E' fatta di tre cose.

### Nucleo

La materia. **Quattro**: fuoco, acqua, terra, vento. Una sola per immagine.

Le materie derivate dalle combinazioni (vapore, fango, fulmine) sono previste ma non in questa
mappa: vivono nella nebbia finche' le quattro di base non sono rese.

### Qualita'

Sei modificatori. La cosa che conta non e' l'elenco ma il fatto che siano **tipizzati**: la classe
di una qualita' decide cosa espone, e quindi come si presenta, quanto costa e come il renderer la
legge. Un concetto solo che paga in tre posti.

| Classe | Qualita' | Espone |
|---|---|---|
| Direzionale | direzione | un vettore: angolo e intensita' |
| Semi-direzionale | convergenza ↔ dispersione | il verso |
| Semi-direzionale | forza ↔ cedevolezza | il verso |
| Semi-direzionale | durata ↔ istantaneita' | il verso |
| Non-direzionale | stabilita' | presente o assente |
| Non-direzionale | levitazione | presente o assente |

La tassonomia viene da WHA, dove i segni si dividono in direzionali (angolo e lunghezza contano
entrambi), semi-direzionali (invertibili ma senza direzione propria), non-direzionali e asimmetrici.

**Non esiste uno stadio "forma".** La forma emerge da direzione, convergenza e levitazione applicate
alla materia. E' una scelta deliberata: una forma esplicita sarebbe stata un quarto asse ridondante
con quelli che gia' ci sono.

### Carica

Si tiene premuto. **La durata della pressione e' il mana investito**, quindi l'intensita'. Si
rilascia, e parte.

Chiude un buco aperto dal ticket 01: nel canone di MT il rango si paga in **lunghezza del canto**, e
togliendo il canto quel costo temporale restava senza casa — niente avrebbe impedito di lanciare
rango Dio al primo secondo. La carica lo rimette dov'era. Il tempo torna prezzo della potenza.

## 3. I tre limiti

Distinti, e ognuno morde in un punto diverso:

- **Mana** → limita l'**intensita'**. Si spende tenendo premuto.
- **Controllo** → limita la **complessita'**: quante qualita' si tengono nitide insieme. Superarlo
  non blocca, **sfoca**: l'immagine degrada e la spell esce storta.
- **Tempo** → non e' una risorsa in piu', e' l'interfaccia del mana. Ma resta un costo tattico suo:
  una carica lunga e' un impegno lungo.

Il controllo come tetto alla complessita' e' MT preso alla lettera: li' il limite del canto
silenzioso e' quanto riesci a tenere in testa. Qui il numero di qualita' impilabili e' limitato
dalla mente, non da una regola arbitraria. E la degradazione, che in MT dovevamo inventare perche'
il canone taceva, arriva da WHA gia' pronta.

## 4. Conseguenza determinata, non scelta

Tolto lo stadio "forma", quattro materie piu' il divieto di compilare shader a runtime (ticket 03)
lasciano una sola risposta possibile: **quattro uber-shader, uno per materia**, con le sei qualita'
in ingresso come uniform.

E' anche la risposta al rischio-grigio dichiarato in cartografia: si cesella **per materia** —
quattro shader curati — invece di produrre un rendering generico. E scioglie il nodo degli
archetipi: non sono una gabbia sopra il builder, **coincidono col nucleo**.

## 5. Cosa passa a valle

**Al 05** (costo e degradazione): il costo si calcola da durata della carica (intensita') e numero
e classe delle qualita' (complessita'). La degradazione e' lo sfocamento oltre il controllo. Aperto:
cosa succede se la carica supera il mana residuo.

**Al 06** (rendering): quattro uber-shader per materia, qualita' come uniform, zero compilazioni a
runtime. La forma va derivata da direzione, convergenza e levitazione.

**Al 07** (layout): serve un controllo a vettore per la direzionale, tre interruttori a verso per le
semi-direzionali, due booleani, e la pressione di carica. La classe della qualita' genera il
controllo.

**Al 09** (serializzazione): un'immagine e' `{ nucleo, qualita: [{id, classe, valore}], carica }`.
Lo schema deve reggere l'aggiunta delle materie derivate.

## Fonti

- [Spells | Witch Hat Atelier Wiki](https://witch-hat-atelier.fandom.com/wiki/Spells)
- [Magic | Witch Hat Atelier Wiki](https://witch-hat-atelier.fandom.com/wiki/Magic)
- [Signs Explained | Witch Hat Atelier Wiki](https://witch-hat-atelier.fandom.com/wiki/Signs_Explained)
- [Witch Hat Atelier's Magic System, Explained | Game Rant](https://gamerant.com/witch-hat-atelier-magic-system-explained/)
- Per la parte Mushoku Tensei, vedi [`01-modello-mana.md`](./01-modello-mana.md).

Lette come riassunti di risultati di ricerca: il proxy di rete blocca i domini delle wiki.
