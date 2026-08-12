import { useEffect } from 'react';

/**
 * Watches for .reveal / .card / .kpi-card elements inside the page
 * and adds an "in-view" class with a staggered delay as they scroll
 * into the viewport, powering the CSS entrance animations.
 */
export default function useScrollReveal(deps = []) {
  useEffect(() => {
    const targets = document.querySelectorAll(
      '.page-content .card, .page-content .kpi-card, .page-content .reveal'
    );
    if (!targets.length) return;

    let i = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (!el.style.getPropertyValue('--reveal-delay')) {
              el.style.setProperty('--reveal-delay', `${Math.min(i * 45, 300)}ms`);
              i += 1;
            }
            el.classList.add('in-view');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => {
      el.classList.add('reveal-init');
      observer.observe(el);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line
  }, deps);
}
