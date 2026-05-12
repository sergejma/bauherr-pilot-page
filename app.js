/* ============================================================
   Bauherr Pilot-Page — Interactions
   - Smooth-Scroll (vom Browser via CSS; hier nur Header-Offset-Korrektur)
   - FAQ-Akkordeon
   - Sticky-CTA-Bar (Mobile, ab Block 02 sichtbar)
   - CTA-Klick-Tracking (Datenattribut → später Pixel/GA4)
   ============================================================ */

(() => {
  'use strict';

  // ---------- DSGVO Cookie-Banner ----------
  const cookieBanner = document.getElementById('cookie-banner');
  if (cookieBanner) {
    const stored = localStorage.getItem('cookie-consent');
    if (!stored) {
      setTimeout(() => {
        cookieBanner.classList.add('visible');
        cookieBanner.setAttribute('aria-hidden', 'false');
      }, 800);
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
        // Phase 2: hier Tracking-Scripts laden, wenn choice === 'all'
      });
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

  // ---------- Sticky Site-Header (Top) + Sticky-CTA-Bar (Bottom Mobile) ----------
  const siteHeader = document.getElementById('site-header');
  const stickyCta = document.getElementById('sticky-cta');
  const hero = document.querySelector('.hero');
  const finalCta = document.getElementById('final-cta');

  if (hero && finalCta) {
    const update = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      const finalTop = finalCta.getBoundingClientRect().top;
      const viewportH = window.innerHeight;

      // Top-Header: sichtbar sobald Hero zu ~70% raus ist
      if (siteHeader) {
        const headerVisible = heroBottom < viewportH * 0.3;
        siteHeader.classList.toggle('visible', headerVisible);
        siteHeader.setAttribute('aria-hidden', String(!headerVisible));
      }

      // Bottom-Sticky: sichtbar wenn Hero komplett raus und Final-CTA noch nicht oben
      if (stickyCta) {
        const ctaVisible = heroBottom < 0 && finalTop > viewportH * 0.5;
        stickyCta.classList.toggle('visible', ctaVisible);
        stickyCta.setAttribute('aria-hidden', String(!ctaVisible));
      }
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

  // ---------- CTA-Klick-Tracking (Hook für Phase 2 Pixel/GA4) ----------
  document.querySelectorAll('[data-cta]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const label = el.getAttribute('data-cta');
      // TODO Phase 2: hier echtes Tracking
      // window.fbq?.('trackCustom', 'CTAClick', { label });
      // window.gtag?.('event', 'cta_click', { label });
      console.log('[CTA]', label);
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
