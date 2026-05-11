/* ============================================================
   Bauherr Pilot-Page — Interactions
   - Smooth-Scroll (vom Browser via CSS; hier nur Header-Offset-Korrektur)
   - FAQ-Akkordeon
   - Sticky-CTA-Bar (Mobile, ab Block 02 sichtbar)
   - CTA-Klick-Tracking (Datenattribut → später Pixel/GA4)
   ============================================================ */

(() => {
  'use strict';

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

  // ---------- Sticky-CTA-Bar (Mobile) ----------
  const stickyCta = document.getElementById('sticky-cta');
  const hero = document.querySelector('.hero');
  const finalCta = document.getElementById('final-cta');

  if (stickyCta && hero && finalCta) {
    const update = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      const finalTop = finalCta.getBoundingClientRect().top;
      const viewportH = window.innerHeight;
      // Sichtbar wenn Hero raus und Final-CTA noch nicht oben angekommen
      const visible = heroBottom < 0 && finalTop > viewportH * 0.5;
      stickyCta.classList.toggle('visible', visible);
      stickyCta.setAttribute('aria-hidden', String(!visible));
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
