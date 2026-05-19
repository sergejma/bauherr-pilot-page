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

  // ---------- Multi-Step Termin-Formular (Showroom → HubSpot Meetings) ----------
  const stepShowroom = document.getElementById('step-showroom');
  const stepMeeting = document.getElementById('step-meeting');
  const meetingEmbed = document.getElementById('meeting-embed');
  const meetingShowroomName = document.getElementById('meeting-showroom-name');
  const showroomCards = document.querySelectorAll('.showroom-card');
  const backToShowroom = document.querySelector('[data-action="back-to-showroom"]');
  const HUBSPOT_EMBED_SCRIPT = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';

  function loadHubSpotMeetings(meetingUrl, showroomName) {
    if (meetingShowroomName) meetingShowroomName.textContent = showroomName;

    meetingEmbed.innerHTML = `
      <div class="meeting-embed-loading">Kalender lädt…</div>
      <div class="meetings-iframe-container" data-src="${meetingUrl}?embed=true"></div>
    `;

    const oldScript = document.querySelector('script[data-hubspot-meetings]');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.src = HUBSPOT_EMBED_SCRIPT;
    script.setAttribute('data-hubspot-meetings', 'true');
    script.async = true;
    script.onload = () => {
      const loader = meetingEmbed.querySelector('.meeting-embed-loading');
      if (loader) loader.remove();
    };
    document.body.appendChild(script);
  }

  showroomCards.forEach((card) => {
    card.addEventListener('click', () => {
      const meetingUrl = card.dataset.meeting;
      const showroomName = card.dataset.showroom;
      if (!meetingUrl) return;
      loadHubSpotMeetings(meetingUrl, showroomName);
      stepShowroom.hidden = true;
      stepMeeting.hidden = false;
      // GA-Event: Showroom-Auswahl ist Conversion-Vorstufe (Lead-Intent)
      if (window.gtag) {
        window.gtag('event', 'showroom_selected', {
          event_category: 'termin',
          event_label: showroomName,
        });
      }
      // Direkt zum Step-2-Container scrollen — scroll-margin-top: 80px deckt Sticky-Header
      stepMeeting.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (backToShowroom) {
    backToShowroom.addEventListener('click', () => {
      stepMeeting.hidden = true;
      stepShowroom.hidden = false;
      meetingEmbed.innerHTML = '';
      stepShowroom.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

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
