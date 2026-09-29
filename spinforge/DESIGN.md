# Spinforge — documento di design

Documento vivo: raccoglie i cardini del gioco, le decisioni prese e i numeri
misurati. Ogni modifica al bilanciamento dovrebbe partire da qui.

## Decisioni prese

| Tema | Decisione |
|---|---|
| Vittoria | **Spin + burst**: si vince azzerando lo spin; il burst è una scorciatoia che premia i colpi forti |
| Controllo | **Inclinazione**, ma più dinamica: asse più reattivo, meno precessione, più slancio |
| Personalizzazione | **Parti + punti**: le parti fissano una base di fattori, il budget di punti rifinisce |
| Durata round | **45–90 s** di combattimento attivo |
| Stadio | Conca senza bordi, nessun ring-out, solco Xtreme per ricaricare |

## I sei cardini

1. **Lo spin è l'unica vita.** Ogni azione costa spin o lo protegge. Il round
   finisce a spin zero, oppure con il burst come scorciatoia.
2. **Scambio favorevole.** Si spende spin per muoversi e caricare
   (spin → velocità), poi l'impatto converte la velocità in spin tolto
   all'avversario. Una buona azione rende più di quanto costa.
3. **Controllo indiretto.** Non si guida il top, lo si inclina. Più spin =
   più stabile ma più lento da girare.
4. **Lettura e tempismo.** Ogni azione ha una contromossa:
   guardia > colpo normale, rush carico > guardia, parata perfetta > rush,
   movimento > guardia (la guardia è ferma e costa).
5. **Lo stadio è una risorsa.** Il centro fa durare ma chi ristagna paga; il
   solco ricarica ma espone ai colpi.
6. **Tutto è leggibile.** Ogni perdita o guadagno di spin si vede (numeri sopra
   i top, ripartizione per causa nel LAB).

## Il top di riferimento: sei fattori

Tutti valgono **1.00** sul top base. Il gioco oggi è uno specchio: tu e la
CPU usate lo stesso top e cambia solo lo stile di gioco della CPU.

| Fattore | Vantaggio | Costo | Dove agisce (`derive()`) |
|---|---|---|---|
| MASSA | meno rinculo e meno danno subito | accelera più lentamente | `mass = 1.1·f`, `accel = f^-0.7` |
| INERZIA | consuma meno, resiste allo steal | cambia inclinazione più lentamente | `k = 0.6·f`, `drain ∝ f^-0.6`, `turn = f^-0.7` |
| AGGRESSIVITÀ | toglie più spin, più click al blocco | più rinculo e più consumo | `smash`, `e`, `mu` ∝ aggro; `drain ∝ 0.85+0.15·aggro` |
| BLOCCO | più denti prima del burst | lama meno aggressiva | `denti = round(3·f)`, `aggro_eff = aggro·(1.15−0.15·f)` |
| ADERENZA | accelera, sterza e ricarica meglio | consuma molto di più | `grip = 0.6·f`, `fric ∝ f^0.8`, `drain = 0.6+0.4·f` |
| STABILITÀ | asse dritto, traballa meno | sterza meno | `stab = f`, `steer = 1.2−0.2·f` |

## Economia dello spin (valori attuali)

| Voce | Valore | Parametro |
|---|---|---|
| Consumo a riposo | 0.9 %/s (≈110 s da fermo) | `DRAIN_BASE` |
| Movimento | +0.15 %/s per unità di velocità | `MOVE_COST` |
| Asse inclinato | +0.6 %/s a inclinazione piena | `TILT_COST` |
| Ristagno | consumo base ×2.5 dopo 3 s quasi fermo | `STALL_*` |
| Colpo | impulso × 0.45 × quota cinetica (attaccante 0.4→2.0) | `IMPACT` |
| Assorbimento | l'attaccante recupera fino al 35% dello spin tolto | `ABSORB` |
| Rush | 1.2 × (1 + 2.5·carica) → da 1.2 a 4.2 % | `RUSH_COST` |
| Guardia | 1.5 %, parata perfetta = danno ×2 all'attaccante | `GUARD_*`, `PARRY_WIN` |
| Solco | fino a +7 %/s per 2.5 s, poi raffreddamento | `RAIL_GAIN`, `HEAT_MAX` |
| Attrito tra bordi (stesso verso) | quasi nullo, l'energia va nel colpo visibile | `SPIN_XFER` |
| Spin steal (verso opposto) | trasferimento moderato | `STEAL_XFER` |

## Obiettivi di bilanciamento

- Un round attivo dura **45–90 s**.
- Il gioco passivo (restare fermi al centro) **non vince in automatico**.
- Ogni stile ha almeno una contromossa (nessuno stile oltre il 70% contro tutti).
- In un round le perdite principali devono essere **leggibili**: consumo base,
  colpi, rush. Nessuna perdita "nascosta" oltre il 15%.

## Misure (CPU contro CPU, top specchio, 30 round per coppia, stesso verso)

| A contro B | Vince A | Vince B | Durata media |
|---|---|---|---|
| equilibrata vs equilibrata | 17 | 13 | 63 s |
| equilibrata vs aggressiva | 18 | 12 | 41 s |
| equilibrata vs difensiva | 13 | 13 (4 pari) | 74 s |
| equilibrata vs manichino | 21 | 9 | 58 s |
| aggressiva vs difensiva | 8 | 22 | 55 s |
| aggressiva vs manichino | 19 | 11 | 37 s |
| difensiva vs manichino | 30 | 0 | 43 s |

Cosa abbiamo imparato mentre si definivano i cardini:

- **L'attrito nascosto tra i bordi** toglieva il 30–50% dello spin per round in
  modo simmetrico e invisibile: ridotto quasi a zero, l'energia ora passa nel
  colpo (che premia l'attaccante).
- **Il manichino vinceva** perché muoversi costava troppo: ridotti i costi di
  movimento, aggiunti il ristagno e l'assorbimento dell'attaccante.
- **Il rush a contatto non rende**: senza rincorsa non c'è carica cinetica.
  L'IA ora prende la rincorsa.

## Questioni aperte (prossimi passi)

1. Con verso opposto (spin steal) l'aggressiva perde quasi sempre: lo steal
   premia troppo chi resta vicino?
2. Il burst è ancora molto frequente contro chi non si muove (XTREME frequenti):
   è il comportamento voluto?
3. Parti: definire le 3 famiglie (lama, blocco, punta) come spostamenti dei
   sei fattori, poi il budget di punti (es. ±0.5 totali) per rifinire.
4. Il solco va bene a raggio 0.55 o deve diventare più rischioso?

## Strumenti

- **LAB** (tasto `L` o pulsante in gioco): cursori su fattori e parametri,
  telemetria dal vivo (consumo, tempo residuo, ultimo urto, perdite per causa),
  esportazione della configurazione in JSON.
- **Stile CPU** `MANICHINO`: resta al centro senza reagire, per provare i colpi.
