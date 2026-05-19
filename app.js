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
  // Wir puffern Marketing-Params beim ersten Visit in localStorage. Vor dem
  // Öffnen des Termin-Modals stellen wir sie via history.replaceState in der
  // URL wieder her — HubSpots Hidden-Fields lesen ihre Defaults aus
  // window.location.search beim Form-Render, also muss die URL zur Render-Zeit
  // die UTMs tragen, sonst landen Submits ohne Attribution im CRM.
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

  const attributionFromUrl = extractAttribution(window.location.search);
  if (Object.keys(attributionFromUrl).length) {
    // URL hat Attribution → speichern, sodass spätere Re-Visits sie behalten.
    try {
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attributionFromUrl));
    } catch (e) { /* private mode */ }
  } else {
    // URL ohne Attribution, localStorage hat aber welche → URL still
    // restaurieren, damit die HubSpot-Form-Hidden-Fields sie picken können.
    try {
      const stored = JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}');
      if (Object.keys(stored).length) {
        const restored = new URLSearchParams(window.location.search);
        Object.entries(stored).forEach(([k, v]) => {
          if (!restored.has(k)) restored.set(k, v);
        });
        const qs = restored.toString();
        if (qs) {
          history.replaceState(null, '', window.location.pathname + '?' + qs + window.location.hash);
        }
      }
    } catch (e) { /* private mode oder invalid JSON */ }
  }

  // ---------- Termin-Modal: HubSpot Pre-Form → Meeting-iframe ----------
  const HUBSPOT_FORM_PORTAL_ID = '25504893';
  const HUBSPOT_FORM_REGION = 'eu1';
  const HUBSPOT_FORM_ID = '73be52e0-7657-4c38-b638-b864dc33107e';

  const terminModal = document.getElementById('termin-modal');
  const terminModalBody = document.getElementById('termin-modal-body');
  const terminModalEyebrow = document.getElementById('termin-modal-eyebrow');
  const terminModalTitle = document.getElementById('termin-modal-title');
  const terminModalSub = document.getElementById('termin-modal-sub');

  let currentMeetingUrl = '';
  let currentShowroomName = '';

  function openTerminModal(meetingUrl, showroomName, regionLabel) {
    currentMeetingUrl = meetingUrl;
    currentShowroomName = showroomName;

    terminModalEyebrow.textContent = regionLabel || 'Showroom';
    terminModalTitle.textContent = 'Termin im Showroom ' + showroomName;
    terminModalSub.textContent = 'Kurz Ihre Kontaktdaten — danach wählen Sie direkt Ihren Wunschtermin.';
    terminModalSub.hidden = false;

    // Form-Container per DOM-API anhängen — HubSpots V2-Embed erkennt
    // .hs-form-frame-Divs nur zuverlässig, wenn sie per appendChild/insertBefore
    // in den DOM kommen. innerHTML-Injection wird vom Scanner übersehen → leer.
    terminModalBody.innerHTML = '';

    const loading = document.createElement('div');
    loading.className = 'termin-modal-loading';
    loading.textContent = 'Formular lädt …';
    terminModalBody.appendChild(loading);

    const frame = document.createElement('div');
    frame.className = 'hs-form-frame';
    frame.setAttribute('data-region', HUBSPOT_FORM_REGION);
    frame.setAttribute('data-form-id', HUBSPOT_FORM_ID);
    frame.setAttribute('data-portal-id', HUBSPOT_FORM_PORTAL_ID);
    terminModalBody.appendChild(frame);

    // Loader entfernen, sobald HubSpot das Form rendert (form-Tag oder iframe erscheint)
    const obs = new MutationObserver(() => {
      if (frame.querySelector('form, iframe')) {
        loading.remove();
        obs.disconnect();
      }
    });
    obs.observe(frame, { childList: true, subtree: true });

    terminModal.classList.remove('termin-modal--meeting');
    terminModal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function showMeetingIframe(submissionValues) {
    const get = (key) => (submissionValues && submissionValues[key]) || '';
    const params = new URLSearchParams({ embed: 'true' });
    const firstName = get('firstname');
    const lastName = get('lastname');
    const email = get('email');
    const phone = get('phone');
    if (firstName) params.set('firstName', firstName);
    if (lastName) params.set('lastName', lastName);
    if (email) params.set('email', email);
    if (phone) params.set('phone', phone);

    // Pre-Fill für native HubSpot-Source-Props auf der Meeting-Seite
    ATTRIBUTION_KEYS.forEach((k) => {
      const v = submissionValues && submissionValues[k];
      if (v) params.set(k, v);
    });

    const url = currentMeetingUrl + '?' + params.toString();

    terminModalEyebrow.textContent = currentShowroomName;
    terminModalTitle.textContent = 'Wunschtermin wählen';
    terminModalSub.hidden = true;
    terminModal.classList.add('termin-modal--meeting');

    terminModalBody.innerHTML =
      '<div class="termin-modal-loading">Kalender lädt …</div>' +
      '<iframe src="' + url + '" title="Terminkalender ' + currentShowroomName +
      '" height="720" loading="lazy"></iframe>';
  }

  function closeTerminModal() {
    terminModal.hidden = true;
    terminModal.classList.remove('termin-modal--meeting');
    terminModalBody.innerHTML = '';
    document.body.classList.remove('modal-open');
    currentMeetingUrl = '';
    currentShowroomName = '';
  }

  document.querySelectorAll('.showroom-card').forEach((card) => {
    card.addEventListener('click', () => {
      const meetingUrl = card.dataset.meeting;
      const showroomName = card.dataset.showroom;
      const regionLabel = card.dataset.region;
      if (!meetingUrl) return;

      openTerminModal(meetingUrl, showroomName, regionLabel);

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

  // HubSpot-Form-Submitted → Swap auf Meeting-iframe.
  // HubSpots V2-Embed liefert submissionValues als Array von { name, value },
  // nicht als { name: value }-Map — wir mappen erst, dann an showMeetingIframe.
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || msg.type !== 'hsFormCallback') return;
    if (msg.eventName !== 'onFormSubmitted') return;
    if (!currentMeetingUrl) return;

    const values = {};
    const submissionValues = msg.data && msg.data.submissionValues;
    if (Array.isArray(submissionValues)) {
      submissionValues.forEach((f) => { if (f && f.name) values[f.name] = f.value; });
    } else if (submissionValues && typeof submissionValues === 'object') {
      // Defensiv: falls HubSpot das Format mal als Map liefert
      Object.assign(values, submissionValues);
    }

    if (window.gtag) {
      window.gtag('event', 'form_submit', {
        event_category: 'termin',
        event_label: currentShowroomName,
      });
    }

    showMeetingIframe(values);
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
