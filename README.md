# Bauherr Pilot-Page

Long-Form Direct-Response Landing-Page für SPA Deluxe GmbH.
Erste Page nach der 11-Block-Architektur. Persona: Bauherr.
Master-Angle: Familien-Mittelpunkt. Offer: Sorgenfrei-Refugium Variante B.

## Stack

- Statisches HTML + CSS + Vanilla JS (kein Build)
- Google Fonts: Inter + JetBrains Mono
- Design-System konsistent zum Marketing-Manifesto
- Mobile-First, Breakpoint 768px

## Lokal entwickeln

```bash
cd bauherr-pilot-page
python3 -m http.server 8080
# → http://localhost:8080
```

## Deploy: GitHub Pages

Repo ist auf `main` Branch verbunden. Pages-Source: `main` / root.
Live unter: https://sergejma.github.io/bauherr-pilot-page/

## Phase 1 → Phase 2 TODOs

Im Code mit `TODO` markiert:

- [ ] **HubSpot Form Embed** (Block 11) — Portal-ID + Form-ID einsetzen in `index.html` bei `#hubspot-form`. Loader-Script ist bereits als Kommentar vorbereitet.
- [ ] **Bundle-Preise final** (Block 08) — Platzhalter-Werte für Variante A & B prüfen und finalisieren.
- [ ] **Tracking-Scripts** (Block `<head>`) — Meta Pixel, GA4, HubSpot Tracking aktivieren.
- [ ] **OG-Image** für Social-Sharing erstellen und in `<meta property="og:image">` einsetzen.

## Phase 2: WordPress-Portierung

Katharina portiert diese Page später nach WordPress.
Empfohlene URL: `/sorgenfrei-refugium/` oder `/bauherr-bundle/`.

## Struktur

```
bauherr-pilot-page/
├── index.html      # 11-Block-Architektur, alle Sektionen
├── styles.css      # Design-System + Block-spezifische Komponenten
├── app.js          # FAQ-Akkordeon, Sticky-CTA, Smooth-Scroll, CTA-Tracking-Hooks
└── README.md
```

## Die 11 Blöcke

| # | Block | Job |
|---|---|---|
| 01 | Hook + Hero | Capture · Identifikation Bauherr |
| 02 | Pain Amplification | Capture · Problem-Bewusstsein |
| 03 | False Solutions | Persuade · Alternativen entkräften |
| 04 | Mechanism | Persuade · „Familien-Mittelpunkt" erklären |
| 05 | Proof Stack | Persuade · Social Proof nach 1/3/5 Jahren |
| 06 | Why SPA Deluxe | Persuade · Differenzierung |
| 07 | Vergleichs-Frame | Persuade · ehrliche Tabelle |
| 08 | Offer | Convert · Bundle Sorgenfrei-Refugium |
| 09 | Risk Reversal | Convert · 60-Tage-Probegarantie |
| 10 | FAQ | Convert · Einwände entkräften |
| 11 | Final CTA + Trust | Convert · Form + Marken-Stack |

---

Sergej Markwart · SPA Deluxe GmbH · v1.0 · Mai 2026
