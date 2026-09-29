# Spinforge — asset generati con Higgsfield

Progetto Higgsfield: **Spinforge** (`c19f800f-25ce-49e3-af5b-c8d5b0365252`).
Stile: 3D toon, cel shading. Tutti i pezzi sono isolati su sfondo grigio neutro,
vista 3/4, pronti per la conversione image → 3D (Tripo H3.1, 9 crediti a mesh).

## Sistema modulare

Un top = **LAMA** + **BLOCCO** (ratchet) + **PUNTA** (bit). Ogni pezzo sposta i
sei fattori del top base (vedi `../DESIGN.md`). Le combinazioni danno i Blade
personalizzati; la CPU usa gli stessi pezzi ricolorati in Godot.

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

I file PNG non sono ancora nel repo: il CDN di Higgsfield
(`d8j0ntlcm91z4.cloudfront.net`) è bloccato dalla policy di rete dell'ambiente.

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

## Fase 2 (in attesa di approvazione): conversione 3D

Tripo H3.1 image → 3D, 9 crediti a pezzo. Tutti e 10 i pezzi costerebbero
90 crediti (disponibili ~49): proposta di partire da un set giocabile
(1–2 lame, 1 blocco, 2 punte) e ampliare dopo.

## Cosa NON si genera con l'IA

- **Stadio**: conca procedurale in Godot (la fisica dipende dalla curva esatta).
- **Effetti, HUD, particelle**: nativi in Godot.
