(function () {
  'use strict';

  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu
  const menuBtn = document.querySelector('.menu-button');
  const nav = document.querySelector('.main-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }


  // Current navigation state
  const currentPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const navLinks = document.querySelectorAll('.main-nav a[href]');
  const routeMap = {
    'index.html': [],
    'starter-package.html': ['starter-package.html'],
    'how-it-works.html': ['how-it-works.html'],
    'why-it-matters.html': ['why-it-matters.html', 'web-design-tameside.html'],
    'portfolio.html': ['portfolio.html', 'case-study-fleetslate.html', 'case-study-milena-design.html']
  };
  Object.entries(routeMap).forEach(([navFile, pages]) => {
    if (pages.includes(currentPath)) {
      navLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.replace(/^\.\//, '').toLowerCase() === navFile) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      });
    }
  });

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Benefit strip animation
  const benefitStrip = document.querySelector('.brand-strip');
  const benefitTrack = document.querySelector('.strip-track');
  let stripAnimation;
  let stripResizeTimer;
  const stripOriginalMarkup = benefitTrack ? benefitTrack.innerHTML : '';

  function buildBenefitStrip() {
    if (!benefitStrip || !benefitTrack) return;
    if (stripAnimation) stripAnimation.cancel();
    benefitTrack.innerHTML = stripOriginalMarkup;
    while (benefitTrack.scrollWidth < benefitStrip.clientWidth + 1100) {
      benefitTrack.insertAdjacentHTML('beforeend', '<b aria-hidden="true">●</b>' + stripOriginalMarkup);
    }
    const travel = Math.max(260, benefitTrack.scrollWidth - benefitStrip.clientWidth);
    const duration = Math.max(40000, Math.min(68000, travel * 25));
    stripAnimation = benefitTrack.animate(
      [{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(-${travel}px, 0, 0)` }],
      { duration, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
    );
  }
  requestAnimationFrame(buildBenefitStrip);
  window.addEventListener('load', buildBenefitStrip, { once: true });
  window.addEventListener('resize', () => {
    clearTimeout(stripResizeTimer);
    stripResizeTimer = setTimeout(buildBenefitStrip, 180);
  }, { passive: true });

  // Form
  const form = document.querySelector('.contact-form');
  if (form) {
    const button = form.querySelector('button[type="submit"]');
    const note = form.querySelector('.form-note');
    const success = form.querySelector('.form-success');
    const defaultButton = button ? button.innerHTML : '';
    form.addEventListener('submit', async (event) => {
      if (!window.fetch) return;
      event.preventDefault();
      if (button) { button.disabled = true; button.innerHTML = 'Sending…'; }
      if (note) note.textContent = 'Sending your enquiry…';
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Form submission failed');
        form.reset();
        form.classList.add('is-sent');
        if (success) success.hidden = false;
        if (note) note.hidden = true;
        if (button) button.hidden = true;
      } catch (error) {
        if (note) {
          note.hidden = false;
          note.textContent = 'Sorry, the message could not be sent. Please email contact@goodform.org.uk.';
        }
        if (button) {
          button.disabled = false;
          button.innerHTML = defaultButton;
        }
      }
    });
  }

  // ========== Interactive 3D Background ==========
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 28;

  let renderer;
  let globalGl = null;
  try {
    globalGl = canvas.getContext('webgl2', { alpha: true, antialias: true }) || canvas.getContext('webgl', { alpha: true, antialias: true });
  } catch (error) {
    globalGl = null;
  }
  if (!globalGl) {
    document.documentElement.classList.add('no-webgl');
    return;
  }
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context: globalGl, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    document.documentElement.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Particles
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const colorPalette = [
    new THREE.Color(0xff6847),
    new THREE.Color(0x82e6df),
    new THREE.Color(0x9b74ff),
    new THREE.Color(0xffd65a),
    new THREE.Color(0xf5f0e8)
  ];

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 60;
    positions[i3 + 1] = (Math.random() - 0.5) * 40;
    positions[i3 + 2] = (Math.random() - 0.5) * 50;
    const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
    sizes[i] = Math.random() * 2.5 + 0.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Connecting lines (sparse network)
  const lineCount = 80;
  const linePositions = new Float32Array(lineCount * 6);
  for (let i = 0; i < lineCount; i++) {
    const i6 = i * 6;
    const a = Math.floor(Math.random() * particleCount);
    const b = Math.floor(Math.random() * particleCount);
    linePositions[i6] = positions[a * 3];
    linePositions[i6 + 1] = positions[a * 3 + 1];
    linePositions[i6 + 2] = positions[a * 3 + 2];
    linePositions[i6 + 3] = positions[b * 3];
    linePositions[i6 + 4] = positions[b * 3 + 1];
    linePositions[i6 + 5] = positions[b * 3 + 2];
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x82e6df,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  // Mouse interaction
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollY = 0;

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  // Touch support
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
      mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }, { passive: true });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  // Animation
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    particles.rotation.y = t * 0.04 + mouse.x * 0.3;
    particles.rotation.x = t * 0.02 + mouse.y * 0.2;
    particles.position.x = mouse.x * 2;
    particles.position.y = mouse.y * 1.5 - scrollY * 0.002;

    lines.rotation.y = particles.rotation.y;
    lines.rotation.x = particles.rotation.x;
    lines.position.copy(particles.position);

    // Subtle pulse
    material.opacity = 0.7 + Math.sin(t * 0.8) * 0.15;

    camera.position.x += (mouse.x * 3 - camera.position.x) * 0.03;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
})();

(function () {
  'use strict';

  // Electric-blue "running" state for every interactive card/control.
  const interactiveSelector = [
    '.button', '.interactive-pill', '.example-card', '.portfolio-card', '.benefit-card',
    '.package-list', '.package-price-card', '.faq-list details', '.process-map div',
    '.expanded-step', '.detail-card', '.detail-panel', '.short-list-card',
    '.local-value-grid article', '.case-points article', '.deliverable-grid article',
    '.subhero-card', '.contact-form'
  ].join(',');
  const interactiveItems = document.querySelectorAll(interactiveSelector);
  const clearInteraction = () => interactiveItems.forEach((el) => el.classList.remove('is-interacting'));
  interactiveItems.forEach((el) => {
    el.addEventListener('pointerdown', () => {
      clearInteraction();
      el.classList.add('is-interacting');
    }, { passive: true });
    el.addEventListener('blur', () => el.classList.remove('is-interacting'), true);
  });
  window.addEventListener('pointerup', () => window.setTimeout(clearInteraction, 130), { passive: true });
  window.addEventListener('pointercancel', clearInteraction, { passive: true });

  // Homepage hero: a separate, fully reactive WebGL system integrated with the main 3D background.
  const heroCanvas = document.getElementById('hero-3d-canvas');
  const heroStage = document.querySelector('.hero-experience');
  if (!heroCanvas || !heroStage || typeof THREE === 'undefined') return;

  let renderer;
  let heroGl = null;
  try {
    heroGl = heroCanvas.getContext('webgl2', { alpha: true, antialias: true }) || heroCanvas.getContext('webgl', { alpha: true, antialias: true });
  } catch (error) {
    heroGl = null;
  }
  if (heroGl) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, context: heroGl, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (error) {
      renderer = null;
    }
  }
  if (!renderer) {
    heroStage.classList.add('hero-no-webgl');
    const updateFallbackPointer = (clientX, clientY) => {
      const rect = heroStage.getBoundingClientRect();
      const nx = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ny = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      const x = Math.max(-1, Math.min(1, nx));
      const y = Math.max(-1, Math.min(1, ny));
      heroStage.style.setProperty('--hero-rx', `${(-y * 3.2).toFixed(2)}deg`);
      heroStage.style.setProperty('--hero-ry', `${(x * 4.2).toFixed(2)}deg`);
      heroStage.style.setProperty('--hero-x', `${(x * 8).toFixed(2)}px`);
      heroStage.style.setProperty('--hero-y', `${(-y * 7).toFixed(2)}px`);
    };
    window.addEventListener('pointermove', (event) => updateFallbackPointer(event.clientX, event.clientY), { passive: true });
    window.addEventListener('touchmove', (event) => {
      if (event.touches && event.touches[0]) updateFallbackPointer(event.touches[0].clientX, event.touches[0].clientY);
    }, { passive: true });
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  camera.position.set(0, 0, 18);
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));

  const world = new THREE.Group();
  scene.add(world);

  const palette = [0x168cff, 0x4bb7ff, 0x9b74ff, 0xff6847, 0x82e6df];
  const cubeData = [
    [-6.4, 3.2, -1.0, .85], [-4.7, -2.9, 1.4, .55], [-2.4, 4.3, -2.1, .42],
    [5.3, 3.7, .4, .78], [6.5, .1, -1.6, .48], [4.9, -3.7, 1.9, .68],
    [1.8, 4.8, -3.2, .34], [-.4, -4.6, -.6, .46], [7.2, -2.1, -3.0, .32]
  ];
  const cubeMeshes = [];
  cubeData.forEach((entry, index) => {
    const [x, y, z, size] = entry;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const wire = new THREE.MeshBasicMaterial({
      color: palette[index % palette.length],
      wireframe: true,
      transparent: true,
      opacity: .72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const cube = new THREE.Mesh(geometry, wire);
    cube.position.set(x, y, z);
    cube.rotation.set(index * .31, index * .22, index * .17);
    cube.userData.baseY = y;
    cube.userData.speed = .28 + (index % 4) * .08;
    cube.userData.phase = index * .71;
    world.add(cube);
    cubeMeshes.push(cube);

    const coreMaterial = new THREE.MeshBasicMaterial({
      color: palette[(index + 2) % palette.length],
      transparent: true,
      opacity: .08,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const core = new THREE.Mesh(new THREE.BoxGeometry(size * .72, size * .72, size * .72), coreMaterial);
    cube.add(core);
  });

  // A luminous orbit around the central website panel.
  const orbitGroup = new THREE.Group();
  [3.5, 4.5, 5.5].forEach((radius, index) => {
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(radius, .018 + index * .006, 6, 90),
      new THREE.MeshBasicMaterial({
        color: palette[index],
        transparent: true,
        opacity: .18 - index * .025,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    torus.rotation.x = 1.05 + index * .23;
    torus.rotation.y = .28 + index * .32;
    orbitGroup.add(torus);
  });
  world.add(orbitGroup);

  // Network particles.
  const count = 250;
  const particlePositions = new Float32Array(count * 3);
  const particleColors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const radius = 4.5 + Math.random() * 6.5;
    const angle = Math.random() * Math.PI * 2;
    particlePositions[i3] = Math.cos(angle) * radius + (Math.random() - .5) * 2.5;
    particlePositions[i3 + 1] = Math.sin(angle) * radius * .66 + (Math.random() - .5) * 2.8;
    particlePositions[i3 + 2] = (Math.random() - .5) * 8;
    const color = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
    particleColors[i3] = color.r;
    particleColors[i3 + 1] = color.g;
    particleColors[i3 + 2] = color.b;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
  const particleMaterial = new THREE.PointsMaterial({
    size: .09,
    vertexColors: true,
    transparent: true,
    opacity: .92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  const heroParticles = new THREE.Points(particleGeometry, particleMaterial);
  world.add(heroParticles);

  // Short, local connections keep the graphic cohesive instead of becoming a web of long random lines.
  const segments = [];
  for (let i = 0; i < 110; i += 1) {
    const a = Math.floor(Math.random() * count);
    let b = Math.floor(Math.random() * count);
    if (b === a) b = (b + 1) % count;
    const ax = particlePositions[a * 3];
    const ay = particlePositions[a * 3 + 1];
    const az = particlePositions[a * 3 + 2];
    const bx = particlePositions[b * 3];
    const by = particlePositions[b * 3 + 1];
    const bz = particlePositions[b * 3 + 2];
    const distance = Math.hypot(ax - bx, ay - by, az - bz);
    if (distance < 4.6) segments.push(ax, ay, az, bx, by, bz);
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
  const heroLines = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
    color: 0x168cff,
    transparent: true,
    opacity: .16,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  world.add(heroLines);

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const updatePointer = (clientX, clientY) => {
    const rect = heroStage.getBoundingClientRect();
    const nx = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const ny = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
    pointer.targetX = Math.max(-1, Math.min(1, nx));
    pointer.targetY = Math.max(-1, Math.min(1, ny));
  };
  window.addEventListener('pointermove', (event) => updatePointer(event.clientX, event.clientY), { passive: true });
  window.addEventListener('touchmove', (event) => {
    if (event.touches && event.touches[0]) updatePointer(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });

  function resizeHero() {
    const rect = heroStage.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(resizeHero).observe(heroStage);
  } else {
    window.addEventListener('resize', resizeHero, { passive: true });
  }
  resizeHero();

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true;
    }, { rootMargin: '120px' }).observe(heroStage);
  }

  const clock = new THREE.Clock();
  function renderHero() {
    requestAnimationFrame(renderHero);
    if (!visible && !reduceMotion) return;
    const time = reduceMotion ? 0.8 : clock.getElapsedTime();
    pointer.x += (pointer.targetX - pointer.x) * .045;
    pointer.y += (pointer.targetY - pointer.y) * .045;

    world.rotation.y = time * .035 + pointer.x * .18;
    world.rotation.x = pointer.y * .11;
    world.position.x = pointer.x * .34;
    world.position.y = pointer.y * .24;
    orbitGroup.rotation.z = time * .075;
    orbitGroup.rotation.y = time * .04;
    heroParticles.rotation.z = -time * .018;
    heroLines.rotation.copy(heroParticles.rotation);

    cubeMeshes.forEach((cube, index) => {
      cube.rotation.x += reduceMotion ? 0 : .0025 + index * .00015;
      cube.rotation.y += reduceMotion ? 0 : .003 + index * .00012;
      cube.position.y = cube.userData.baseY + Math.sin(time * cube.userData.speed + cube.userData.phase) * .34;
    });

    heroStage.style.setProperty('--hero-rx', `${(-pointer.y * 3.2).toFixed(2)}deg`);
    heroStage.style.setProperty('--hero-ry', `${(pointer.x * 4.2).toFixed(2)}deg`);
    heroStage.style.setProperty('--hero-x', `${(pointer.x * 8).toFixed(2)}px`);
    heroStage.style.setProperty('--hero-y', `${(-pointer.y * 7).toFixed(2)}px`);

    camera.position.x += (pointer.x * .7 - camera.position.x) * .025;
    camera.position.y += (pointer.y * .5 - camera.position.y) * .025;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  renderHero();
})();
