/* Goodform network background preview */
(function () {
  const canvas = document.getElementById('bg-canvas-net') || document.getElementById('bg-canvas');
  if (!canvas) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const mouse = { x: 0.62, y: 0.38, tx: 0.62, ty: 0.38, vx: 0, vy: 0 };
  let w = 0, h = 0, dpr = 1, scroll = 0, tscroll = 0;
  let nodes = [], sparks = [], ripples = [];
  const CORAL = [255, 104, 71];
  const MINT = [130, 230, 223];
  const VIOLET = [155, 116, 255];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const lerp = (a, b, n) => a + (b - a) * n;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = (i, s) => {
    const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    const count = reduce ? 26 : clamp(Math.round((w * h) / 19000), 34, 68);
    nodes = Array.from({ length: count }, (_, i) => ({
      bx: hash(i, 1),
      by: hash(i, 2),
      z: 0.35 + hash(i, 3) * 0.65,
      phase: hash(i, 4) * Math.PI * 2,
      spin: 0.15 + hash(i, 5) * 0.55,
      hue: hash(i, 6) < 0.12 ? CORAL : hash(i, 7) < 0.22 ? VIOLET : MINT,
      pulse: hash(i, 8)
    }));
  }

  function pos(n, now) {
    const driftX = Math.sin(now * 0.00018 * n.spin + n.phase) * 0.035 * n.z;
    const driftY = Math.cos(now * 0.00014 * n.spin + n.phase * 1.3) * 0.028 * n.z;
    const parX = (mouse.x - 0.5) * 0.07 * n.z;
    const parY = (mouse.y - 0.5) * 0.05 * n.z;
    const sc = (scroll - 0.5) * 0.05 * n.z;
    return {
      x: 40 + (n.bx + driftX + parX) * (w - 80),
      y: 36 + (n.by + driftY + parY + sc) * (h - 72)
    };
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (e) => {
    const nx = e.clientX / Math.max(1, w);
    const ny = e.clientY / Math.max(1, h);
    mouse.vx = nx - mouse.tx;
    mouse.vy = ny - mouse.ty;
    mouse.tx = nx;
    mouse.ty = ny;
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    ripples.push({ x: e.clientX, y: e.clientY, r: 8, life: 1 });
    if (reduce) return;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.5 + Math.random() * 2;
      sparks.push({
        x: e.clientX, y: e.clientY,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 1, c: Math.random() < 0.45 ? CORAL : MINT
      });
    }
  });
  window.addEventListener('scroll', () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    tscroll = window.scrollY / max;
  }, { passive: true });

  let lastPacket = 0;
  function maybePacket(now, pts) {
    if (reduce || now - lastPacket < 480 || pts.length < 2) return;
    if (Math.random() > 0.07) return;
    const a = pts[(Math.random() * pts.length) | 0];
    const b = pts[(Math.random() * pts.length) | 0];
    if (a === b) return;
    lastPacket = now;
    sparks.push({ x: a.x, y: a.y, tx: b.x, ty: b.y, packet: true, life: 1, c: CORAL });
  }

  function frame(now) {
    mouse.x = lerp(mouse.x, mouse.tx, 0.07);
    mouse.y = lerp(mouse.y, mouse.ty, 0.07);
    scroll = lerp(scroll, tscroll, 0.06);
    const speed = Math.hypot(mouse.vx, mouse.vy);
    mouse.vx *= 0.86;
    mouse.vy *= 0.86;

    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(mouse.x * w, mouse.y * h, 16, mouse.x * w, mouse.y * h, 320);
    glow.addColorStop(0, 'rgba(130,230,223,0.055)');
    glow.addColorStop(0.5, 'rgba(155,116,255,0.025)');
    glow.addColorStop(1, 'rgba(5,5,10,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    nodes.forEach((n) => {
      const p = pos(n, now);
      n.px = p.x; n.py = p.y;
    });

    const mx = mouse.x * w, my = mouse.y * h;
    const linkDist = reduce ? 118 : 164;
    const influence = 200 + speed * 380;
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.px - b.px, a.py - b.py);
        if (d > linkDist || d < 8) continue;
        const near = Math.min(Math.hypot(a.px - mx, a.py - my), Math.hypot(b.px - mx, b.py - my));
        if (near > influence) continue;
        const alpha = (1 - d / linkDist) * (1 - near / influence) * 0.55;
        ctx.strokeStyle = rgba(near < 88 + speed * 70 ? CORAL : MINT, alpha);
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.stroke();
      }
    }

    maybePacket(now, nodes.map((n) => ({ x: n.px, y: n.py })));

    nodes.forEach((n) => {
      const d = Math.hypot(n.px - mx, n.py - my);
      const beat = 0.55 + Math.sin(now * 0.003 + n.pulse * 8) * 0.45;
      const r = (d < 150 ? 2.6 : 1.25) * (0.75 + n.z * 0.5) * (reduce ? 1 : beat);
      ctx.fillStyle = rgba(d < 108 ? CORAL : n.hue, d < 220 ? 0.9 : 0.16 + n.z * 0.18);
      ctx.beginPath();
      ctx.arc(n.px, n.py, r, 0, Math.PI * 2);
      ctx.fill();
    });

    ripples = ripples.filter((r) => r.life > 0);
    ripples.forEach((r) => {
      r.r += 3.2; r.life -= 0.016;
      ctx.strokeStyle = rgba(CORAL, r.life * 0.3);
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    });

    sparks = sparks.filter((s) => s.life > 0);
    sparks.forEach((s) => {
      if (s.packet) {
        s.x = lerp(s.x, s.tx, 0.08);
        s.y = lerp(s.y, s.ty, 0.08);
        s.life -= 0.012;
        ctx.fillStyle = rgba(s.c, s.life);
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2); ctx.fill();
      } else {
        s.x += s.vx; s.y += s.vy; s.vx *= 0.96; s.vy *= 0.96; s.life -= 0.02;
        ctx.fillStyle = rgba(s.c, s.life * 0.75);
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
    });

    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);
})();
