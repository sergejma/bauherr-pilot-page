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

## Termin-Buchung: Zoho-CRM-Buchungsseiten (seit Sept. 2026, vorher HubSpot Meetings)

**Ablauf auf der Seite (Block 11):** Showroom-Karte → Modal mit der
Zoho-CRM-Buchungsseite des Showrooms im iframe (`crm.zoho.eu/bookings/…`,
Setup → Kalenderbuchung). Kontaktdaten erfasst Zoho selbst, ein Pre-Formular
gibt es nicht mehr. Nach der Buchung zeigt Zoho seine eigene Bestätigung im
iframe. Getestet: crm.zoho.eu setzt kein X-Frame-Options, der Kalender rendert
im iframe auf Desktop und Mobile.

**Sechs eigene Buchungsseiten nur für diese Landing Page**, benannt
„Ausstellung <Ort> · Bauherren". Zuordnung Karte → Buchungsseite:
Nürnberg → Fürth, Ludwigsburg → Esslingen, alle anderen namensgleich.
Der Seitenname ist die Quelle: Jede Buchung darüber kommt von
bauherren.spadeluxe.de.

**Links pflegen:** In `index.html` pro Showroom-Karte das Attribut
`data-booking="…"`. Ohne gültige `http(s)`-URL zeigt das Modal automatisch
den Telefon-Fallback.

**Attribution:** `utm_*`, `gclid`, `fbclid` werden beim ersten Besuch in
`localStorage` gepuffert und an die Booking-URL gehängt. Zoho-CRM-Buchungs-
seiten werten sie nach aktueller Doku nicht aus; es kostet nichts und ist
vorbereitet, falls Zoho das nachzieht.

### Wo die Buchungen im CRM landen

Die bestehende Automation (Website-Buchungen) legt pro Buchung ein **Meeting**
an, verknüpft mit dem Lead, Titel „Ausstellungstermin <Ort>", Beschreibung
„Vom Kunden selbst ueber das Buchungsformular der Website gebucht.
Zoho-Buchung: <ID>". Für die Bauherren-Buchungsseiten gilt dieselbe Pipeline.
Offen ist, ob der Titel oder die Beschreibung den Buchungsseiten-Namen
(„· Bauherren") mitführt — siehe Checkliste.

### Checkliste

- [x] Sechs Buchungsseiten „Ausstellung <Ort> · Bauherren" angelegt (Sergej, 08.09.2026)
- [x] Links in `index.html` eingetragen
- [ ] **Test-Buchung** über die Landing Page machen und im CRM prüfen:
      Wird das Meeting angelegt, hängt es am richtigen Lead, steht
      „Bauherren" im Titel oder in der Beschreibung?
- [ ] Falls nein: Automation so ergänzen, dass Buchungen der Bauherren-Seiten
      am Lead `Lead_Source="Lead: Bauherren"` (nur wenn leer),
      `Termintyp=Showroom`, `Termindatum`, `Termin_Status=Vereinbart`,
      `Filiale`, `Territory` setzen. Feld-Logik als Vorlage in
      `docs/zoho/bookings-custom-function.dg` (geschrieben für die App
      „Zoho Bookings", die Feldzuordnung gilt 1:1 auch für eine
      CRM-Workflow-Function auf Meetings).
- [ ] Auswertung: Meetings-Modul nach Titel/Beschreibung „Bauherren"
      filtern oder Leads nach `Lead_Source = Lead: Bauherren`.

**danke.html** ist optional und aktuell nicht angebunden: Zoho-CRM-Buchungs-
seiten bieten laut Doku keine eigene Bestätigungs-URL. Die Seite bleibt im Repo
für den Fall, dass Zoho eine Redirect-Option nachliefert oder die Kalender
doch in die App „Zoho Bookings" wandern (dort ist der Redirect vorhanden).

## Phase 1 → Phase 2 TODOs

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
├── danke.html      # optionale Bestätigungsseite (nur mit Redirect-fähigem Zoho-Kalender)
├── styles.css      # Design-System + Block-spezifische Komponenten
├── app.js          # FAQ-Akkordeon, Sticky-CTA, Termin-Modal (Zoho-CRM-Buchungsseite), CTA-Tracking
├── docs/zoho/      # Deluge-Entwurf für die CRM-Attribution (Feld-Logik)
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
| 11 | Final CTA + Trust | Convert · Zoho-CRM-Terminbuchung + Marken-Stack |

---

Sergej Markwart · SPA Deluxe GmbH · v1.0 · Mai 2026
