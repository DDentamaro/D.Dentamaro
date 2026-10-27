# Koma Club

Strumento da riga di comando che prepara i post Instagram della settimana partendo da **immagini locali** in `inbox/` e da un **calendario YAML** in `calendar/`. Lavora solo offline: niente download, niente servizi esterni. Gli originali in `inbox/` non vengono mai modificati.

## Installazione

```bash
cd koma-club
python3 -m venv .venv && source .venv/bin/activate
pip install -e '.[test]'
```

Serve Python 3.11 o superiore. `ffmpeg` è necessario solo per `koma reel`.

## Uso

1. La domenica copia le immagini in `inbox/`.
2. Scrivi `calendar/AAAA-MM-GG.yaml`, con il lunedì della settimana nel nome del file (vedi l'esempio in `calendar/2026-11-02.yaml`).
3. Lancia:

```bash
koma check --week 2026-11-02   # valida e basta: exit 1 se ci sono errori, 0 con eventuali avvisi
koma build --week 2026-11-02   # check + genera out/2026-11-02/ (sostituisce solo quella cartella)
koma build --date 2026-11-04   # rigenera un solo post (riepilogo.md resta com'è)
koma reel  --date 2026-11-07   # MP4 1080×1920 da un carosello, senza audio
```

Tutti i comandi accettano `--root` (cartella del progetto, predefinita quella corrente) e `--config`.

## Output

```
out/2026-11-02/
├── 2026-11-02_lun_panel-muto/
│   ├── 01.jpg          # JPEG 1080×1350, qualità 92, sRGB, firma @koma.club
│   ├── caption.txt
│   └── alt.txt
├── 2026-11-03_mar_tema/
│   ├── 01.jpg … 03.jpg
│   └── …
└── riepilogo.md        # una riga per post: data, rubrica, opera, slide, avvisi
```

## Calendario

```yaml
week_start: 2026-11-02
posts:
  - date: 2026-11-02
    rubrica: Panel muto
    formato: singolo            # singolo (1 immagine) | carosello (2–10)
    images: [vagabond_242_a.jpg]
    opera: Vagabond
    autore: Takehiko Inoue
    volume: 27                  # null → avviso e "vol. [__]" in didascalia
    titolo: …                   # facoltativo
    testo: …
    domanda: …                  # facoltativa
    hashtags: [vagabond, musashi, mangapanel]   # 3–15, minuscoli, senza #, nessun duplicato
```

- Per i caroselli con più opere usa `crediti: [{opera, autore, volume}, …]` al posto di `opera`/`autore`/`volume`.
- Ogni immagine può essere un nome di file oppure `{file: x.jpg, mode: crop, focus: [0.5, 0.3]}`: ritaglio 4:5 attorno al punto focale (coordinate relative, 0–1). Senza `mode` vale quella di `config.yaml` (predefinita `fit`: immagine intera su sfondo `#F4F1EA` con 40 px di margine).
- Se un'immagine va ingrandita più di 1,5× compare un avviso di bassa risoluzione, ma il build prosegue.
- Il build fallisce se una didascalia supera 2.200 caratteri o 30 hashtag (contati anche quelli scritti nel testo).

## Configurazione

`config.yaml` (tutte le chiavi sono facoltative): `handle`, `background`, `mode`, `font`, `paths.inbox`, `paths.out`, `paths.calendar`. Dimensioni, qualità JPEG e stile della firma sono costanti in `koma/config.py`.

## Test

```bash
pytest
UPDATE_SNAPSHOTS=1 pytest tests/test_build.py   # rigenera gli snapshot dopo una modifica voluta ai testi
```

Le immagini di prova in `tests/fixtures/inbox/` sono sintetiche (`tests/fixtures/make_fixtures.py`). I test coprono le regole di validazione, dimensioni e proporzioni delle slide, gli snapshot delle didascalie, il build end-to-end, l'integrità di `inbox/` (verificata con hash), l'assenza di librerie di rete e, se c'è ffmpeg, il reel.

## Font

`assets/fonts/Inter-Medium.otf` (Inter, The Inter Project Authors) è distribuito con licenza SIL Open Font License 1.1: vedi `assets/fonts/OFL.txt`.
