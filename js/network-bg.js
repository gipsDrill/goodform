/* Goodform network overlay — hooks into hero 3D cluster */
(function () {
  const canvas = document.getElementById('bg-canvas-net');
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

  function heroFocus() {
    const hero = document.querySelector('.hero');
    const visible = hero ? clamp(1 - Math.max(0, -hero.getBoundingClientRect().top) / Math.max(1, hero.offsetHeight), 0, 1) : 0;
    return {
      x: w * (innerWidth >= 760 ? 0.72 : 0.62),
      y: h * 0.40,
      strength: visible * (innerWidth >= 760 ? 1 : 0.45)
    };
  }

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
    const count = reduce ? 26 : clamp(Math.round((w * h) / 18000), 36, 74);
    nodes = Array.from({ length: count }, (_, i) => {
      const orbit = hash(i, 9) < 0.28;
      return {
        bx: orbit ? 0.62 + (hash(i, 1) - 0.5) * 0.28 : hash(i, 1),
        by: orbit ? 0.36 + (hash(i, 2) - 0.5) * 0.30 : hash(i, 2),
        z: 0.35 + hash(i, 3) * 0.65,
        phase: hash(i, 4) * Math.PI * 2,
        spin: 0.15 + hash(i, 5) * 0.55,
        hue: hash(i, 6) < 0.14 ? CORAL : hash(i, 7) < 0.24 ? VIOLET : MINT,
        pulse: hash(i, 8),
        orbit
      };
    });
  }

  function pos(n, now, focus) {
    const driftX = Math.sin(now * 0.00018 * n.spin + n.phase) * 0.035 * n.z;
    const driftY = Math.cos(now * 0.00014 * n.spin + n.phase * 1.3) * 0.028 * n.z;
    const parX = (mouse.x - 0.5) * 0.07 * n.z;
    const parY = (mouse.y - 0.5) * 0.05 * n.z;
    const sc = (scroll - 0.5) * 0.05 * n.z;
    let x = 40 + (n.bx + driftX + parX) * (w - 80);
    let y = 36 + (n.by + driftY + parY + sc) * (h - 72);
    if (n.orbit && focus.strength > 0.05) {
      const ang = now * 0.00035 * n.spin + n.phase;
      const rad = 70 + n.z * 90;
      x = lerp(x, focus.x + Math.cos(ang) * rad, 0.55 * focus.strength);
      y = lerp(y, focus.y + Math.sin(ang * 0.85) * rad * 0.62, 0.55 * focus.strength);
    }
    return { x, y };
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
      sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 1, c: Math.random() < 0.45 ? CORAL : MINT });
    }
  });
  window.addEventListener('scroll', () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    tscroll = window.scrollY / max;
  }, { passive: true });

  let lastPacket = 0;
  function maybePacket(now, pts, focus) {
    if (reduce || now - lastPacket < 380 || pts.length < 2) return;
    if (Math.random() > 0.12) return;
    const a = pts[(Math.random() * pts.length) | 0];
    lastPacket = now;
    sparks.push({ x: a.x, y: a.y, tx: focus.x, ty: focus.y, packet: true, life: 1, c: CORAL });
  }

  function frame(now) {
    mouse.x = lerp(mouse.x, mouse.tx, 0.07);
    mouse.y = lerp(mouse.y, mouse.ty, 0.07);
    scroll = lerp(scroll, tscroll, 0.06);
    const speed = Math.hypot(mouse.vx, mouse.vy);
    mouse.vx *= 0.86; mouse.vy *= 0.86;
    const focus = heroFocus();

    ctx.clearRect(0, 0, w, h);

    if (focus.strength > 0.08) {
      const halo = ctx.createRadialGradient(focus.x, focus.y, 20, focus.x, focus.y, 240);
      halo.addColorStop(0, `rgba(130,230,223,${0.05 * focus.strength})`);
      halo.addColorStop(1, 'rgba(5,5,10,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = rgba(MINT, 0.10 * focus.strength);
      ctx.beginPath();
      ctx.ellipse(focus.x, focus.y, 118 + Math.sin(now * 0.0012) * 8, 64, now * 0.0002, 0, Math.PI * 2);
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(mouse.x * w, mouse.y * h, 16, mouse.x * w, mouse.y * h, 280);
    glow.addColorStop(0, 'rgba(130,230,223,0.04)');
    glow.addColorStop(1, 'rgba(5,5,10,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    nodes.forEach((n) => {
      const p = pos(n, now, focus);
      n.px = p.x; n.py = p.y;
    });

    const mx = mouse.x * w, my = mouse.y * h;
    const linkDist = reduce ? 118 : 170;
    const influence = 200 + speed * 380;
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const aHero = Math.hypot(a.px - focus.x, a.py - focus.y);
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.px - b.px, a.py - b.py);
        if (d > linkDist || d < 8) continue;
        const nearMouse = Math.min(Math.hypot(a.px - mx, a.py - my), Math.hypot(b.px - mx, b.py - my));
        const nearHero = Math.min(aHero, Math.hypot(b.px - focus.x, b.py - focus.y));
        const heroBoost = focus.strength * (1 - clamp(nearHero / 220, 0, 1));
        if (nearMouse > influence && heroBoost < 0.18) continue;
        const alpha = (1 - d / linkDist) * Math.max(1 - nearMouse / influence, heroBoost) * 0.58;
        const hot = nearMouse < 90 || heroBoost > 0.35;
        ctx.strokeStyle = rgba(hot ? CORAL : MINT, alpha);
        ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
      }
    }

    maybePacket(now, nodes.map((n) => ({ x: n.px, y: n.py })), focus);

    nodes.forEach((n) => {
      const dM = Math.hypot(n.px - mx, n.py - my);
      const dH = Math.hypot(n.px - focus.x, n.py - focus.y);
      const beat = 0.55 + Math.sin(now * 0.003 + n.pulse * 8) * 0.45;
      const r = (dM < 150 || (n.orbit && dH < 140) ? 2.7 : 1.25) * (0.75 + n.z * 0.5) * (reduce ? 1 : beat);
      ctx.fillStyle = rgba((dM < 108 || (n.orbit && dH < 90)) ? CORAL : n.hue, dM < 220 || n.orbit ? 0.9 : 0.16 + n.z * 0.18);
      ctx.beginPath(); ctx.arc(n.px, n.py, r, 0, Math.PI * 2); ctx.fill();
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
        s.x = lerp(s.x, s.tx, 0.07); s.y = lerp(s.y, s.ty, 0.07); s.life -= 0.011;
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
