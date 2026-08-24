#!/usr/bin/env python3
"""
Progettazione dei materiali per Magic Builder.

Perche' esiste: nel repo di riferimento (LinearAbilityCasting) ogni abilita' ha il proprio
materiale GLSL scritto a mano — 20-90 uniform ciascuno, 4.000 righe in totale. Noi abbiamo un
uber-shader solo (il ticket 03 vieta di compilare shader a runtime), quindi la diversita' deve
nascere da un **profilo di parametri** per materia, non da codice per materia.

Questo strumento implementa in numpy gli stessi primitivi del GLSL — fbm, ridged, voronoi, curl —
e disegna un provino a contatto. Serve a **scegliere guardando** invece che indovinare nel browser:
i profili scelti finiscono poi nel shader come una manciata di numeri.

    python3 materiali.py            # scrive provino-materiali.png
"""
import numpy as np
from PIL import Image

RNG = np.random.default_rng(7)

# --------------------------------------------------------------------------- primitivi
def _griglia(n, scala, seme):
    """Rumore di valore su griglia, interpolato con smoothstep. Equivalente numpy di snoise."""
    g = int(max(2, scala))
    r = np.random.default_rng(seme).random((g + 1, g + 1))
    y, x = np.mgrid[0:n, 0:n] / n * g
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = x - x0, y - y0
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)      # smoothstep
    a = r[y0, x0]; b = r[y0, x0 + 1]; c = r[y0 + 1, x0]; d = r[y0 + 1, x0 + 1]
    return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy

def fbm(n, scala=4, ottave=4, seme=1):
    """Somma di ottave: il rumore del fumo e delle nuvole."""
    out, amp, sc, norm = np.zeros((n, n)), 1.0, scala, 0.0
    for o in range(ottave):
        out += amp * _griglia(n, sc, seme + o * 17)
        norm += amp; amp *= 0.5; sc *= 2
    return out / norm

def ridged(n, scala=4, ottave=4, seme=1):
    """1-|rumore|, elevato: creste affilate. E' il rumore del fulmine."""
    out, amp, sc, norm = np.zeros((n, n)), 1.0, scala, 0.0
    for o in range(ottave):
        v = 1.0 - np.abs(_griglia(n, sc, seme + o * 31) * 2 - 1)
        out += amp * v ** 2
        norm += amp; amp *= 0.5; sc *= 2
    return out / norm

def voronoi(n, celle=8, seme=1, bordi=False):
    """Distanza al punto piu' vicino (F1), o F2-F1 per i bordi: faccette e crepe. Il ghiaccio."""
    r = np.random.default_rng(seme)
    p = r.random((celle * celle, 2))
    y, x = np.mgrid[0:n, 0:n] / n
    d = np.stack([np.hypot(x - px, y - py) for px, py in p])
    d.sort(axis=0)
    return np.clip((d[1] - d[0]) * celle * 0.9, 0, 1) if bordi else np.clip(d[0] * celle * 0.9, 0, 1)

def curl(n, scala=4, seme=1):
    """Coordinate deformate dal gradiente del rumore: il flusso e il vortice. Il fuoco."""
    base = fbm(n, scala, 3, seme)
    gy, gx = np.gradient(base)
    y, x = np.mgrid[0:n, 0:n] / n
    return fbm(n, scala, 3, seme + 5) * 0.5 + (np.hypot(gx, gy) * n * 0.06) * 0.5

# --------------------------------------------------------------------------- profili
# Ogni materia e' un peso sui quattro rumori piu' qualche manopola. Sono questi numeri
# che finiranno nel shader: nessun codice per materia.
PROFILI = {
 "fuoco": dict(pesi=(0.35,0.05,0.00,0.60), scala=5, ottave=4, bordo=0.10, scintille=0.00,
               durezza=0.15, colori=((1.00,0.95,0.72),(1.00,0.47,0.16),(0.42,0.09,0.05))),
 "acqua": dict(pesi=(0.45,0.05,0.35,0.15), scala=4, ottave=3, bordo=0.55, scintille=0.30,
               durezza=0.55, colori=((0.88,0.98,1.00),(0.26,0.62,0.86),(0.05,0.16,0.34))),
 "terra": dict(pesi=(0.30,0.00,0.70,0.00), scala=3, ottave=2, bordo=0.25, scintille=0.05,
               durezza=0.85, colori=((0.92,0.80,0.58),(0.62,0.42,0.20),(0.18,0.11,0.06))),
 "vento": dict(pesi=(0.30,0.10,0.00,0.60), scala=7, ottave=4, bordo=0.15, scintille=0.00,
               durezza=0.08, colori=((0.94,1.00,0.97),(0.48,0.76,0.64),(0.10,0.24,0.19))),
}

def campo(n, pr, seme=1):
    """Il rumore composto della materia: e' la riga che il shader dovra' riprodurre."""
    wf, wr, wv, wc = pr["pesi"]
    out = np.zeros((n, n))
    if wf: out += wf * fbm(n, pr["scala"], pr["ottave"], seme)
    if wr: out += wr * ridged(n, pr["scala"], pr["ottave"], seme + 3)
    if wv: out += wv * voronoi(n, max(3, pr["scala"] * 2), seme + 7, bordi=True)
    if wc: out += wc * curl(n, pr["scala"], seme + 11)
    tot = sum(pr["pesi"]) or 1
    return out / tot

def rampa(t, colori):
    """Nucleo → mezzo → bordo, come la uColorCore/Mid/Edge del riferimento."""
    c0, c1, c2 = (np.array(c) for c in colori)
    t = np.clip(t, 0, 1)[..., None]
    return np.where(t < 0.5, c0 + (c1 - c0) * (t * 2), c1 + (c2 - c1) * ((t - 0.5) * 2))

def tassello(n, nome, eta, seme=1):
    """Una particella della materia, all'eta' data. E' cio' che il fragment shader deve produrre."""
    pr = PROFILI[nome]
    y, x = (np.mgrid[0:n, 0:n] / n - 0.5) * 2
    d = np.hypot(x, y)
    ru = campo(n, pr, seme)

    # il bordo si sfrangia col rumore: la durezza decide quanto
    soglia = 1.0 - eta * 0.35
    bordo_ru = (ru - 0.5) * (1.0 - pr["durezza"]) * 0.9
    maschera = np.clip((soglia - (d + bordo_ru)) / max(0.04, 1.0 - pr["durezza"]) * 1.4, 0, 1)

    # temperatura: nucleo caldo al centro, freddo al bordo, e invecchiando si raffredda
    temp = np.clip(d * 0.85 + eta * 0.55 + (ru - 0.5) * 0.35, 0, 1)
    col = rampa(temp, pr["colori"])

    # rim: il bordo si accende (fresnel dei materiali del riferimento)
    rim = np.clip((d - (soglia - 0.22)) / 0.22, 0, 1) ** 2 * pr["bordo"]
    col = col + rim[..., None] * np.array(pr["colori"][0]) * 0.9

    if pr["scintille"]:
        sc = (voronoi(n, 26, seme + 21) < 0.10).astype(float) * pr["scintille"] * (1 - eta)
        col = col + sc[..., None]

    img = np.clip(col * maschera[..., None] * (1.0 - eta * 0.55), 0, 1)
    return (img * 255).astype(np.uint8)

def provino(lato=150, eta=(0.05, 0.4, 0.8), out="provino-materiali.png"):
    nomi = list(PROFILI)
    W, H, pad = lato * len(eta), lato * len(nomi), 8
    foglio = Image.new("RGB", (W + pad * (len(eta) + 1), H + pad * (len(nomi) + 1)), (10, 14, 16))
    for r, nome in enumerate(nomi):
        for c, e in enumerate(eta):
            foglio.paste(Image.fromarray(tassello(lato, nome, e)),
                         (pad + c * (lato + pad), pad + r * (lato + pad)))
    foglio.save(out)
    return out, foglio.size

if __name__ == "__main__":
    f, dim = provino()
    print(f"scritto {f} {dim[0]}x{dim[1]}")
    for nome, pr in PROFILI.items():
        wf, wr, wv, wc = pr["pesi"]
        print(f"  {nome:<7} fbm {wf:.2f}  ridged {wr:.2f}  voronoi {wv:.2f}  curl {wc:.2f}"
              f"   bordo {pr['bordo']:.2f}  durezza {pr['durezza']:.2f}")
