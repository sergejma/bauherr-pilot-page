/* ============================================================
   Bauherr Pilot-Page — Interactions
   - Smooth-Scroll (vom Browser via CSS; hier nur Header-Offset-Korrektur)
   - FAQ-Akkordeon
   - Sticky-CTA-Bar (Mobile, ab Block 02 sichtbar)
   - CTA-Klick-Tracking (Datenattribut → später Pixel/GA4)
   ============================================================ */

(() => {
  'use strict';

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

  // ---------- HubSpot Tracking (consent-gated) ----------
  let hubspotLoaded = false;

  function loadHubSpotTracking() {
    if (hubspotLoaded) return;
    hubspotLoaded = true;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = 'hs-script-loader';
    script.async = true;
    script.defer = true;
    script.src = '//js-eu1.hs-scripts.com/25504893.js';
    document.head.appendChild(script);
  }

  function loadConsentedTrackers() {
    loadGoogleAnalytics();
    loadHubSpotTracking();
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
  // Marketing-Params beim ersten Visit in localStorage puffern, damit ein User,
  // der mit ?utm_* landet aber erst nach Reload/Re-Visit bucht, die Attribution
  // trotzdem an die Meeting-Subdomain mitbringt.
  const ATTRIBUTION_STORAGE_KEY = 'spa_utm';
  const ATTRIBUTION_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'fbclid', 'msclkid', 'yclid', 'ttclid', 'li_fat_id',
  ];

  function extractAttribution(searchString) {
    const src = new URLSearchParams(searchString);
    const out = new URLSearchParams();
    ATTRIBUTION_KEYS.forEach((k) => {
      const v = src.get(k);
      if (v) out.set(k, v);
    });
    return out.toString();
  }

  // Nur überschreiben, wenn neue Attribution in der URL ist — sonst würde ein
  // Re-Visit ohne Params die ursprüngliche Quelle aus localStorage löschen.
  if (extractAttribution(window.location.search)) {
    try {
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, extractAttribution(window.location.search));
    } catch (e) { /* private mode */ }
  }

  function getCookie(name) {
    const match = document.cookie.split('; ').find((c) => c.startsWith(name + '='));
    return match ? match.split('=').slice(1).join('=') : '';
  }

  // ---------- Showroom-Auswahl → Top-Level-Redirect auf HubSpot-Meetings ----------
  // KEIN iframe-Embed: der iframe würde die hubspotutk-Cookie nicht lesen
  // und damit die komplette Attribution-Kette (erste Seite, Referrer, UTMs)
  // unterbrechen. Top-Level-Navigation auf *.spadeluxe.de teilt die Cookie.
  //
  // Wir hängen drei Schichten an die Meeting-URL:
  //   1) Alle aktuellen URL-Params der LP (UTMs, gclid, beliebige Custom-Params)
  //   2) localStorage-Backfill für Attribution, die in dieser Session schon
  //      einmal in der URL stand, aktuell aber nicht mehr (Re-Visit, Reload)
  //   3) HubSpot Cross-Domain-Cookies — die Meeting-Seite stitcht damit die
  //      Session an den LP-Visit, sodass "Erste angezeigte Seite" + native
  //      Source-Props (hs_analytics_first_referrer …) korrekt befüllt werden
  function buildRedirectQuery() {
    const merged = new URLSearchParams(window.location.search);

    try {
      const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
      if (stored) {
        new URLSearchParams(stored).forEach((v, k) => {
          if (!merged.has(k)) merged.set(k, v);
        });
      }
    } catch (e) { /* private mode */ }

    ['hubspotutk', '__hstc', '__hssc', '__hsfp'].forEach((name) => {
      const v = getCookie(name);
      if (v) merged.set(name, v);
    });

    return merged.toString();
  }

  document.querySelectorAll('.showroom-card').forEach((card) => {
    card.addEventListener('click', () => {
      const meetingUrl = card.dataset.meeting;
      const showroomName = card.dataset.showroom;
      if (!meetingUrl) return;

      const qs = buildRedirectQuery();
      const targetUrl = qs ? meetingUrl + '?' + qs : meetingUrl;

      if (window.gtag) {
        window.gtag('event', 'showroom_selected', {
          event_category: 'termin',
          event_label: showroomName,
        });
      }

      window.location.href = targetUrl;
    });
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
