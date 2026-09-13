/* Dual background + equal fade for wireframe clusters on every page */
(function () {
  if (!document.body) return;
  if (!document.getElementById('bg-canvas')) {
    const c = document.createElement('canvas');
    c.id = 'bg-canvas';
    document.body.insertBefore(c, document.body.firstChild);
  }
  if (!document.getElementById('bg-canvas-net')) {
    const c = document.createElement('canvas');
    c.id = 'bg-canvas-net';
    const after = document.getElementById('bg-canvas');
    after.parentNode.insertBefore(c, after.nextSibling);
  }
  function ensureSheet(href, flag) {
    if (document.querySelector('link[' + flag + ']')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.setAttribute(flag.replace(/[=\[\]]/g, '') ? flag.split('=')[0].replace('[', '') : flag, '1');
    document.head.appendChild(l);
  }
  if (!document.querySelector('link[data-bg-layers]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'css/bg-layers.css';
    l.setAttribute('data-bg-layers', '1');
    document.head.appendChild(l);
  }
  if (!document.querySelector('link[data-ui-motion]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'css/ui-motion.css';
    l.setAttribute('data-ui-motion', '1');
    document.head.appendChild(l);
  }
  if (!document.querySelector('script[data-network-bg]')) {
    const s = document.createElement('script');
    s.src = 'js/network-bg.js';
    s.defer = true;
    s.setAttribute('data-network-bg', '1');
    document.body.appendChild(s);
  }
  const sel = '.wire-accent, .reactive-cluster, .story-accent.drift-slot, [data-case-visual], .project-visual';
  const fade = () => {
    const vh = window.innerHeight || 1;
    document.querySelectorAll(sel).forEach((el) => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const dist = Math.abs(mid - vh * 0.52) / (vh * 0.85);
      const p = Math.max(0, Math.min(1, 1 - dist));
      el.style.setProperty('--gfx-fade', (0.14 + Math.pow(p, 0.9) * 0.86).toFixed(3));
    });
  };
  fade();
  window.addEventListener('scroll', fade, { passive: true });
  window.addEventListener('resize', fade, { passive: true });
})();
