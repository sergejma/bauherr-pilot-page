/* ============================================================
   Bauherr Pilot-Page — Interactions
   - Smooth-Scroll (vom Browser via CSS; hier nur Header-Offset-Korrektur)
   - FAQ-Akkordeon
   - Sticky-CTA-Bar (Mobile, ab Block 02 sichtbar)
   - CTA-Klick-Tracking (Datenattribut → GA4)
   - Termin-Modal mit Zoho-Bookings-Kalender + Buchungs-Conversion via danke.html
   ============================================================ */

(() => {
  'use strict';

  // ---------- Scroll-Restoration + Force-Top für Ad-User ----------
  // Instagram-WebView (Android + iOS) springt bei manchen Ad-Klicks ohne
  // ersichtlichen Grund in die Mitte der Seite — verifiziert beim Klick aus
  // Insta-Ads. Scroll-Restoration auf 'manual' reicht nicht; wir holen den
  // User aktiv zurück, solange er noch nicht selbst gescrollt/getappt hat.
  //
  // Gated durch: kein Hash in URL + keine User-Interaktion bisher.
  // Smooth-Scroll wird temporär ausgeschaltet, damit der Reset nicht als
  // animierter "Yank-back" sichtbar wird.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  if (!window.location.hash) {
    const htmlEl = document.documentElement;
    htmlEl.style.scrollBehavior = 'auto';
    // overflow-anchor:none verhindert Chromes Scroll-Anchoring, das die
    // Scroll-Position verschiebt, wenn Hero-Content (Bilder, Fonts) nachladet
    // und die Layout-Höhe shiftet.
    htmlEl.style.overflowAnchor = 'none';
    document.body && (document.body.style.overflowAnchor = 'none');

    let userInteracted = false;
    ['touchstart', 'mousedown', 'wheel', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, () => { userInteracted = true; }, { once: true, passive: true });
    });

    const forceTop = () => { if (!userInteracted) window.scrollTo(0, 0); };
    document.addEventListener('DOMContentLoaded', forceTop);
    window.addEventListener('load', forceTop);

    // Kontinuierliches Polling für 3s — fängt späte Scroll-Sprünge ab, die
    // nach +800ms passieren (Insta-WebView Lade-Quirks, late Layout-Shifts).
    const watchEnd = Date.now() + 3000;
    const interval = setInterval(() => {
      if (Date.now() > watchEnd || userInteracted) {
        clearInterval(interval);
        htmlEl.style.scrollBehavior = '';
        return;
      }
      if (window.scrollY > 30) window.scrollTo(0, 0);
    }, 80);
  }

  // ---------- Google Analytics (consent-gated) ----------
  const GA_ID = 'G-1TQQ5LLNJF';
  let gaLoaded = false;

  function loadGoogleAnalytics() {
    if (gaLoaded) return;
    gaLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
  }

  function loadConsentedTrackers() {
    // HubSpot-Tracking entfiel mit dem CRM-Wechsel zu Zoho (Sept. 2026).
    loadGoogleAnalytics();
  }

  // ---------- DSGVO Cookie-Banner ----------
  const cookieBanner = document.getElementById('cookie-banner');
  if (cookieBanner) {
    const stored = localStorage.getItem('cookie-consent');
    if (!stored) {
      setTimeout(() => {
        cookieBanner.classList.add('visible');
        cookieBanner.setAttribute('aria-hidden', 'false');
      }, 800);
    } else if (stored === 'all') {
      // Returning visitor mit Volleinwilligung → Tracker direkt laden
      loadConsentedTrackers();
    }
    cookieBanner.querySelectorAll('[data-cookie]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.cookie;
        try {
          localStorage.setItem('cookie-consent', choice);
          localStorage.setItem('cookie-consent-date', new Date().toISOString());
        } catch (e) { /* private mode etc. */ }
        cookieBanner.classList.remove('visible');
        cookieBanner.setAttribute('aria-hidden', 'true');
        if (choice === 'all') {
          loadConsentedTrackers();
        }
      });
    });
  }

  // ---------- Attribution-Persistenz (UTM / Click-IDs) ----------
  // Marketing-Params beim ersten Visit in localStorage puffern und beim Öffnen
  // des Kalenders an die Booking-URL hängen. Die App „Zoho Bookings" wertet
  // utm_*/gclid aus; die CRM-Buchungsseiten aktuell nicht — kostet nichts,
  // bleibt als Vorbereitung drin.
  const ATTRIBUTION_STORAGE_KEY = 'spa_utm';
  const ATTRIBUTION_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'fbclid', 'msclkid', 'yclid', 'ttclid', 'li_fat_id',
  ];

  function extractAttribution(searchString) {
    const src = new URLSearchParams(searchString);
    const out = {};
    ATTRIBUTION_KEYS.forEach((k) => {
      const v = src.get(k);
      if (v) out[k] = v;
    });
    return out;
  }

  function loadStoredAttribution() {
    try {
      return JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  const attributionFromUrl = extractAttribution(window.location.search);
  if (Object.keys(attributionFromUrl).length) {
    try {
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attributionFromUrl));
    } catch (e) { /* private mode */ }
  }

  function currentAttribution() {
    // Aktuelle URL schlägt gespeicherte Werte (neuer Ad-Klick gewinnt).
    return Object.assign({}, loadStoredAttribution(), attributionFromUrl);
  }

  // ---------- Termin-Modal: Zoho-CRM-Buchungsseite ----------
  // Ablauf: Showroom-Karte → Modal mit der CRM-Buchungsseite (crm.zoho.eu/bookings)
  // im iframe. Kontaktdaten erfasst Zoho selbst, ein Pre-Form ist nicht mehr nötig;
  // die Bestätigung zeigt Zoho im iframe.
  // Optional: Falls der Kalender eine eigene Bestätigungs-URL unterstützt (App
  // „Zoho Bookings"), auf danke.html zeigen lassen — die Seite ist same-origin
  // und meldet die Buchung per postMessage → GA4-Event + Erfolgs-UI im Modal.
  const PHONE_DISPLAY = '02597 4753015';
  const PHONE_TEL = 'tel:+4925974753015';
  const BOOKING_CONFIRMED_MESSAGE = 'spa:booking-confirmed';

  const terminModal = document.getElementById('termin-modal');
  const terminModalBody = document.getElementById('termin-modal-body');
  const terminModalEyebrow = document.getElementById('termin-modal-eyebrow');
  const terminModalTitle = document.getElementById('termin-modal-title');
  const terminModalSub = document.getElementById('termin-modal-sub');

  let currentShowroomName = '';
  let bookingConfirmed = false;

  function isUsableBookingUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url);
  }

  function buildBookingUrl(baseUrl) {
    // CRM-Buchungsseiten haben eine normale Query (…?rid=…) → mit & anhängen.
    // URLs der App „Zoho Bookings" sind Hash-Router-URLs (…/#/workspace/service):
    // dort gehören die Parameter HINTER den Hash-Pfad.
    const params = new URLSearchParams();
    Object.entries(currentAttribution()).forEach(([k, v]) => params.set(k, v));
    const qs = params.toString();
    if (!qs) return baseUrl;

    const hashIdx = baseUrl.indexOf('#');
    if (hashIdx === -1) {
      return baseUrl + (baseUrl.includes('?') ? '&' : '?') + qs;
    }
    const before = baseUrl.slice(0, hashIdx);
    const hash = baseUrl.slice(hashIdx);
    return before + hash + (hash.includes('?') ? '&' : '?') + qs;
  }

  function renderBookingFallback(showroomName) {
    terminModalBody.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'termin-modal-loading termin-modal-fallback';
    p.innerHTML =
      'Der Online-Kalender für ' + showroomName + ' ist gerade nicht erreichbar. ' +
      'Rufen Sie uns direkt an: <a href="' + PHONE_TEL + '">' + PHONE_DISPLAY + '</a>';
    terminModalBody.appendChild(p);
  }

  function openTerminModal(bookingUrl, showroomName, regionLabel) {
    currentShowroomName = showroomName;
    bookingConfirmed = false;

    terminModalEyebrow.textContent = regionLabel || 'Showroom';
    terminModalTitle.textContent = 'Termin im Showroom ' + showroomName;
    terminModalSub.textContent = 'Wählen Sie im Kalender Ihren Wunschtermin und tragen Sie danach Ihre Kontaktdaten ein.';
    terminModalSub.hidden = false;
    terminModal.classList.add('termin-modal--meeting');
    terminModal.hidden = false;
    document.body.classList.add('modal-open');

    if (!isUsableBookingUrl(bookingUrl)) {
      if (window.console) console.warn('[Termin] Keine gültige Zoho-Bookings-URL für', showroomName);
      renderBookingFallback(showroomName);
      return;
    }

    const url = buildBookingUrl(bookingUrl);
    terminModalBody.innerHTML = '';

    const loading = document.createElement('div');
    loading.className = 'termin-modal-loading';
    loading.textContent = 'Kalender lädt …';
    terminModalBody.appendChild(loading);

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.title = 'Terminkalender ' + showroomName;
    iframe.setAttribute('loading', 'eager');
    iframe.setAttribute('allow', 'payment');
    iframe.addEventListener('load', () => loading.remove(), { once: true });
    terminModalBody.appendChild(iframe);

    // Fallback für WebViews (Instagram/Facebook), in denen iframes gelegentlich
    // leer bleiben: derselbe Kalender in einem neuen Tab, inkl. Attribution.
    const foot = document.createElement('p');
    foot.className = 'termin-modal-foot';
    foot.innerHTML =
      'Kalender wird nicht angezeigt? <a href="' + url + '" target="_blank" rel="noopener">In neuem Tab öffnen</a>' +
      ' · oder anrufen: <a href="' + PHONE_TEL + '">' + PHONE_DISPLAY + '</a>';
    terminModalBody.appendChild(foot);
  }

  function showBookingConfirmed(detail) {
    if (bookingConfirmed) return;
    bookingConfirmed = true;

    const showroom = currentShowroomName || (detail && detail.showroom) || '';

    // danke.html im iframe trägt die eigentliche Bestätigung — Modal-Kopf nur
    // noch als knappe Statuszeile, sonst steht die Botschaft doppelt da.
    terminModalTitle.textContent = 'Termin bestätigt';
    terminModalSub.hidden = true;
    const foot = terminModalBody.querySelector('.termin-modal-foot');
    if (foot) foot.remove();

    if (window.gtag) {
      window.gtag('event', 'termin_gebucht', {
        event_category: 'termin',
        event_label: showroom,
        booking_id: (detail && detail.booking_id) || undefined,
        service_name: (detail && detail.service_name) || undefined,
      });
    }
  }

  // danke.html (same-origin, im iframe) meldet die abgeschlossene Buchung.
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin) return;
    const data = e.data;
    if (!data || data.type !== BOOKING_CONFIRMED_MESSAGE) return;
    if (terminModal.hidden) return;
    showBookingConfirmed(data);
  });

  function closeTerminModal() {
    terminModal.hidden = true;
    terminModal.classList.remove('termin-modal--meeting');
    terminModalBody.innerHTML = '';
    document.body.classList.remove('modal-open');
    currentShowroomName = '';
    bookingConfirmed = false;
  }

  document.querySelectorAll('.showroom-card').forEach((card) => {
    card.addEventListener('click', () => {
      const bookingUrl = card.dataset.booking;
      const showroomName = card.dataset.showroom;
      const regionLabel = card.dataset.region;

      openTerminModal(bookingUrl, showroomName, regionLabel);

      if (window.gtag) {
        window.gtag('event', 'showroom_selected', {
          event_category: 'termin',
          event_label: showroomName,
        });
      }
    });
  });

  // Close-Handler: Backdrop, X-Button, Escape
  terminModal.addEventListener('click', (e) => {
    if (e.target instanceof HTMLElement && e.target.dataset.action === 'close-modal') {
      closeTerminModal();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !terminModal.hidden) closeTerminModal();
  });


  // ---------- FAQ-Akkordeon ----------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const button = item.querySelector('.faq-q');
    if (!button) return;
    button.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      item.classList.toggle('open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
    });
  });

  // ---------- Sticky Site-Header (Top): Reveal nach Hero ----------
  const siteHeader = document.getElementById('site-header');
  const hero = document.querySelector('.hero');

  if (hero && siteHeader) {
    const update = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      const viewportH = window.innerHeight;
      const headerVisible = heroBottom < viewportH * 0.3;
      siteHeader.classList.toggle('visible', headerVisible);
      siteHeader.setAttribute('aria-hidden', String(!headerVisible));
    };
    update();
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }

  // ---------- CTA-Klick-Tracking ----------
  document.querySelectorAll('[data-cta]').forEach((el) => {
    el.addEventListener('click', () => {
      const label = el.getAttribute('data-cta');
      if (window.gtag) {
        window.gtag('event', 'cta_click', {
          event_category: 'engagement',
          event_label: label,
        });
      }
    });
  });

  // ---------- Smooth-Scroll-Korrektur für Anker ----------
  // CSS regelt das primär; hier nur Hash-State-Cleanup nach Klick
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  // ---------- Reading-Progress (subtil — nur für Heatmap-Korrelation später) ----------
  // Optional, kann später aktiviert werden
})();
