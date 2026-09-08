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

## Termin-Buchung: Zoho Bookings (seit Sept. 2026, vorher HubSpot Meetings)

**Ablauf auf der Seite (Block 11):** Showroom-Karte → Modal mit dem
Zoho-Bookings-Kalender des Showrooms im iframe. Kontaktdaten erfasst Zoho
Bookings selbst, ein Pre-Formular gibt es nicht mehr (ein Schritt weniger).
Nach der Buchung leitet Zoho Bookings im iframe auf `danke.html` weiter; die
Seite meldet die Buchung per `postMessage` an die Landing Page → GA4-Event
`termin_gebucht` + Erfolgs-Ansicht im Modal.

**Links pflegen:** In `index.html` pro Showroom-Karte das Attribut
`data-booking="…"` (Zoho-Bookings-Buchungsseite). Steht dort noch ein
`TODO-…`-Platzhalter, zeigt das Modal automatisch den Telefon-Fallback.

**Attribution:** `utm_*`, `gclid`, `fbclid` werden beim ersten Besuch in
`localStorage` gepuffert und an die Booking-URL gehängt (hinter dem
Hash-Pfad). Zoho Bookings liest sie, gibt sie an seine GA4-Integration und an
die Bestätigungsseite weiter.

### Einrichtung in Zoho (Checkliste)

Stufe 1 — Pflicht, damit Buchungen überhaupt sauber im CRM landen:

- [ ] **Eigene Services pro Showroom für die Landingpage** anlegen (z. B.
      „Ausstellungstermin Nürnberg · Bauherren"). So identifiziert allein der
      Service-Name die Quelle, ohne sichtbares Extra-Feld im Formular.
- [ ] **Bookings → Admin Center → Integrations → CRM and Sales** verbinden.
      Kundenfelder auf **Leads** mappen (Name getrennt in Vor-/Nachname,
      E-Mail, Telefon), Sync-Regel „bestehende Datensätze aktualisieren,
      sonst neu anlegen". Termine ins **Meetings**-Modul mappen.
- [ ] **Workspace → Policies & Preferences → „Show your own confirmation
      page"**: `https://bauherren.spadeluxe.de/danke.html` eintragen und
      **„Pass booking details to confirmation page"** aktivieren. Bei mehreren
      Workspaces für jeden wiederholen.
- [ ] Optional: **Bookings-GA4-Integration** mit `G-1TQQ5LLNJF` aktivieren
      (trackt Funnel-Schritte im Kalender inkl. Parent-URL).

Stufe 2 — Attribution im CRM (Lead-Quelle „Lead: Bauherren", Termin-Felder):

- [ ] **Custom Function** in Bookings anlegen (Trigger „Appointment booked"),
      Code: `docs/zoho/bookings-custom-function.dg`. Vorher CRM-Connection in
      Bookings erstellen und den Link-Namen im Script eintragen.
      Setzt `Termintyp=Showroom`, `Termindatum`, `Termin_Status=Vereinbart`,
      `Filiale`, `Territory`; legt fehlende Leads mit `Lead_Source="Lead:
      Bauherren"` an, überschreibt vorhandene Lead-Quellen nicht.
- [ ] Territory-Mapping prüfen: Ludwigsburg → „Esslingen" ist eine Annahme.

Stufe 3 — UTMs bis in den Lead (optional): Zoho Bookings gibt `utm_*` nicht
an Custom Functions weiter, wohl aber an die Bestätigungsseite. `danke.html`
kann sie per Beacon an einen **Zoho-Flow-Webhook** senden (Konstante
`ZOHO_FLOW_WEBHOOK` im Script), der den Lead über `customer_email` findet und
`utm_source/medium/campaign` sowie `Google_GCLID` nachträgt.

## Phase 1 → Phase 2 TODOs

- [ ] **Zoho-Bookings-Links** in `index.html` (`data-booking`) eintragen — bis
      dahin zeigt das Modal den Telefon-Fallback.
- [ ] **Bundle-Preise final** (Block 08) — Platzhalter-Werte für Variante A & B prüfen und finalisieren.
- [ ] **Tracking-Scripts** (Block `<head>`) — Meta Pixel consent-gated nachziehen (GA4 läuft).
- [ ] **OG-Image** für Social-Sharing erstellen und in `<meta property="og:image">` einsetzen.

## Phase 2: WordPress-Portierung

Katharina portiert diese Page später nach WordPress.
Empfohlene URL: `/sorgenfrei-refugium/` oder `/bauherr-bundle/`.

## Struktur

```
bauherr-pilot-page/
├── index.html      # 11-Block-Architektur, alle Sektionen
├── danke.html      # Bestätigungsseite für Zoho Bookings (Redirect-Ziel, GA4-Conversion)
├── styles.css      # Design-System + Block-spezifische Komponenten
├── app.js          # FAQ-Akkordeon, Sticky-CTA, Termin-Modal (Zoho Bookings), CTA-Tracking
├── docs/zoho/      # Deluge-Entwurf für die Bookings-Custom-Function (CRM-Attribution)
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
| 11 | Final CTA + Trust | Convert · Zoho-Bookings-Termin + Marken-Stack |

---

Sergej Markwart · SPA Deluxe GmbH · v1.0 · Mai 2026
