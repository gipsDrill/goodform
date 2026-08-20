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

  // Highlight the menu item for the page currently being viewed.
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const pageGroups = {
    'why-it-matters.html': ['why-it-matters.html', 'web-design-tameside.html'],
    'starter-package.html': ['starter-package.html'],
    'how-it-works.html': ['how-it-works.html'],
    'portfolio.html': ['portfolio.html', 'case-study-fleetslate.html', 'case-study-milena-design.html']
  };
  document.querySelectorAll('.main-nav a[href]').forEach((link) => {
    const href = (link.getAttribute('href') || '').replace(/^\.\//, '').toLowerCase();
    const relatedPages = pageGroups[href] || [];
    if (relatedPages.includes(currentPage)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
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

  // Each wireframe accent has its own motion language while preserving the same visual design.
  const reactiveClusters = Array.from(document.querySelectorAll('[data-reactive-cluster]'));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;

  const clusterStates = reactiveClusters.map((cluster, index) => ({
    cluster,
    variant: cluster.dataset.clusterVariant || 'story',
    pointerX: 0,
    pointerY: 0,
    targetPointerX: 0,
    targetPointerY: 0,
    scrollX: 0,
    scrollY: 0,
    rotateZ: 0,
    scale: 1,
    opacity: 1,
    orbitTurn: 0,
    seed: index * 0.87
  }));

  const updateClusterScrollState = () => {
    if (!clusterStates.length) return;
    const viewportHeight = window.innerHeight || 1;
    const focusLine = viewportHeight * 0.54;

    clusterStates.forEach((state) => {
      const rect = state.cluster.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const signedDistance = clamp((midpoint - focusLine) / (viewportHeight * 0.82), -1.15, 1.15);
      const proximity = clamp(1 - Math.abs(signedDistance), 0, 1);

      if (state.variant === 'why-orbits') {
        // Sideways arrival, counter-rotation and a long, soft fade.
        state.opacity = 0.08 + Math.pow(proximity, 0.68) * 0.92;
        state.scrollX = signedDistance * 46;
        state.scrollY = signedDistance * -9;
        state.rotateZ = signedDistance * -8.5;
        state.scale = 0.90 + proximity * 0.10;
        state.orbitTurn = signedDistance * -24;
      } else if (state.variant === 'portfolio-layers') {
        // A deeper zoom/pivot movement with a sharper cinematic fade.
        state.opacity = 0.04 + Math.pow(proximity, 1.55) * 0.96;
        state.scrollX = signedDistance * -12;
        state.scrollY = signedDistance * 48;
        state.rotateZ = signedDistance * 11;
        state.scale = 1.04 - Math.abs(signedDistance) * 0.11;
        state.orbitTurn = signedDistance * 36;
      } else {
        // Gentle vertical drift and restrained rotation for the homepage story accent.
        state.opacity = 0.16 + Math.pow(proximity, 0.95) * 0.84;
        state.scrollX = signedDistance * 5;
        state.scrollY = signedDistance * 29;
        state.rotateZ = signedDistance * 4.5;
        state.scale = 0.94 + proximity * 0.06;
        state.orbitTurn = signedDistance * 10;
      }
    });
  };

  const renderClusterStates = () => {
    const time = performance.now() * 0.001;
    clusterStates.forEach((state) => {
      state.pointerX = lerp(state.pointerX, state.targetPointerX, 0.075);
      state.pointerY = lerp(state.pointerY, state.targetPointerY, 0.075);

      let pointerShiftX = 0;
      let pointerShiftY = 0;
      let rotateX = 0;
      let rotateY = 0;

      if (state.variant === 'why-orbits') {
        pointerShiftX = state.pointerX * -13;
        pointerShiftY = state.pointerY * 5;
        rotateX = state.pointerY * 5;
        rotateY = state.pointerX * -12;
      } else if (state.variant === 'portfolio-layers') {
        pointerShiftX = state.pointerX * 7;
        pointerShiftY = state.pointerY * -11;
        rotateX = state.pointerY * -10;
        rotateY = state.pointerX * 7;
      } else {
        pointerShiftX = state.pointerX * 10;
        pointerShiftY = state.pointerY * 6;
        rotateX = state.pointerY * -6;
        rotateY = state.pointerX * 10;
      }

      const cluster = state.cluster;
      const cycle = time + state.seed;
      const autoTurn = state.variant === 'why-orbits' ? ((cycle * 16) + Math.sin(cycle * 0.75) * 6) : 0;
      const layerPulse = state.variant === 'portfolio-layers' ? Math.sin(cycle * 1.15) : 0;
      cluster.style.setProperty('--cluster-pointer-x', `${pointerShiftX.toFixed(2)}px`);
      cluster.style.setProperty('--cluster-pointer-y', `${pointerShiftY.toFixed(2)}px`);
      cluster.style.setProperty('--cluster-scroll-x', `${state.scrollX.toFixed(2)}px`);
      cluster.style.setProperty('--cluster-scroll-y', `${state.scrollY.toFixed(2)}px`);
      cluster.style.setProperty('--cluster-rx', `${rotateX.toFixed(2)}deg`);
      cluster.style.setProperty('--cluster-ry', `${rotateY.toFixed(2)}deg`);
      cluster.style.setProperty('--cluster-rz', `${state.rotateZ.toFixed(2)}deg`);
      cluster.style.setProperty('--cluster-scale', state.scale.toFixed(3));
      cluster.style.setProperty('--cluster-opacity', state.opacity.toFixed(3));
      cluster.style.setProperty('--cluster-orbit-turn', `${state.orbitTurn.toFixed(2)}deg`);
      cluster.style.setProperty('--cluster-auto-turn', `${autoTurn.toFixed(2)}deg`);
      cluster.style.setProperty('--cluster-layer-pulse', layerPulse.toFixed(3));
    });

    if (!reduceMotion && clusterStates.length) requestAnimationFrame(renderClusterStates);
  };

  if (clusterStates.length) {
    clusterStates.forEach((state) => {
      const interactionSurface = state.cluster.closest('section') || state.cluster;

      if (!reduceMotion) {
        interactionSurface.addEventListener('pointermove', (event) => {
          if (event.pointerType === 'touch') return;
          const rect = state.cluster.getBoundingClientRect();
          state.targetPointerX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
          state.targetPointerY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
        }, { passive: true });

        interactionSurface.addEventListener('pointerleave', () => {
          state.targetPointerX = 0;
          state.targetPointerY = 0;
        }, { passive: true });
      } else {
        state.opacity = 1;
        state.scale = 1;
      }
    });

    updateClusterScrollState();
    renderClusterStates();
  }


  // Interactive hero graphics on both case-study pages.
  const caseVisuals = Array.from(document.querySelectorAll('[data-case-visual]'));
  const caseVisualStates = caseVisuals.map((visual, index) => ({
    visual,
    kind: visual.dataset.caseVisual || 'generic',
    pointerX: 0,
    pointerY: 0,
    targetPointerX: 0,
    targetPointerY: 0,
    scrollX: 0,
    scrollY: 0,
    rotateZ: 0,
    scale: 1,
    opacity: 1,
    seed: index * 1.37
  }));

  const updateCaseVisualScrollState = () => {
    if (!caseVisualStates.length) return;
    const viewportHeight = window.innerHeight || 1;
    const focusLine = viewportHeight * 0.53;

    caseVisualStates.forEach((state) => {
      const rect = state.visual.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const signedDistance = clamp((midpoint - focusLine) / (viewportHeight * 0.86), -1.2, 1.2);
      const proximity = clamp(1 - Math.abs(signedDistance), 0, 1);

      state.opacity = 0.10 + Math.pow(proximity, 0.82) * 0.90;
      state.scrollY = signedDistance * 30;
      state.scrollX = signedDistance * (state.kind === 'milena' ? -12 : 10);
      state.rotateZ = signedDistance * (state.kind === 'milena' ? -3.8 : 3.2);
      state.scale = 0.94 + proximity * 0.06;
    });
  };

  const renderCaseVisualStates = () => {
    const time = performance.now() * 0.001;

    caseVisualStates.forEach((state) => {
      state.pointerX = lerp(state.pointerX, state.targetPointerX, 0.075);
      state.pointerY = lerp(state.pointerY, state.targetPointerY, 0.075);

      const breatheX = Math.sin(time * 0.72 + state.seed) * 1.4;
      const breatheY = Math.cos(time * 0.68 + state.seed) * 1.8;
      const pointerShiftX = state.pointerX * (state.kind === 'milena' ? 9 : 8) + breatheX;
      const pointerShiftY = state.pointerY * 7 + breatheY;
      const rotateX = state.pointerY * -7;
      const rotateY = state.pointerX * 9;

      const softX = state.pointerX * 4 + breatheX * .45;
      const softY = state.pointerY * 3 + breatheY * .45;
      const strongX = state.pointerX * 11 + breatheX;
      const strongY = state.pointerY * 8 + breatheY;
      const inverseX = state.pointerX * -8 - breatheX * .65;
      const inverseY = state.pointerY * -6 - breatheY * .65;

      const visual = state.visual;
      visual.style.setProperty('--case-pointer-x', `${pointerShiftX.toFixed(2)}px`);
      visual.style.setProperty('--case-pointer-y', `${pointerShiftY.toFixed(2)}px`);
      visual.style.setProperty('--case-scroll-x', `${state.scrollX.toFixed(2)}px`);
      visual.style.setProperty('--case-scroll-y', `${state.scrollY.toFixed(2)}px`);
      visual.style.setProperty('--case-rx', `${rotateX.toFixed(2)}deg`);
      visual.style.setProperty('--case-ry', `${rotateY.toFixed(2)}deg`);
      visual.style.setProperty('--case-rz', `${state.rotateZ.toFixed(2)}deg`);
      visual.style.setProperty('--case-scale', state.scale.toFixed(3));
      visual.style.setProperty('--case-opacity', state.opacity.toFixed(3));
      visual.style.setProperty('--case-soft-x', `${softX.toFixed(2)}px`);
      visual.style.setProperty('--case-soft-y', `${softY.toFixed(2)}px`);
      visual.style.setProperty('--case-strong-x', `${strongX.toFixed(2)}px`);
      visual.style.setProperty('--case-strong-y', `${strongY.toFixed(2)}px`);
      visual.style.setProperty('--case-inverse-x', `${inverseX.toFixed(2)}px`);
      visual.style.setProperty('--case-inverse-y', `${inverseY.toFixed(2)}px`);
    });

    if (!reduceMotion && caseVisualStates.length) requestAnimationFrame(renderCaseVisualStates);
  };

  if (caseVisualStates.length) {
    caseVisualStates.forEach((state) => {
      const interactionSurface = state.visual.closest('section') || state.visual;

      if (!reduceMotion) {
        interactionSurface.addEventListener('pointermove', (event) => {
          if (event.pointerType === 'touch') return;
          const rect = state.visual.getBoundingClientRect();
          state.targetPointerX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
          state.targetPointerY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
        }, { passive: true });

        interactionSurface.addEventListener('pointerleave', () => {
          state.targetPointerX = 0;
          state.targetPointerY = 0;
        }, { passive: true });
      }
    });

    updateCaseVisualScrollState();
    renderCaseVisualStates();
    window.addEventListener('scroll', updateCaseVisualScrollState, { passive: true });
    window.addEventListener('resize', updateCaseVisualScrollState, { passive: true });
  }

  // ========== Interactive 3D Background ==========
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 28;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

  // Homepage-only reactive 3D accent on the right side of the opening section.
  const heroAccent = document.body.classList.contains('home-page') ? new THREE.Group() : null;
  const heroAccentMaterials = [];
  if (heroAccent) {
    const accentColours = [0x82e6df, 0x9b74ff, 0xff6847];
    const cubeSettings = [
      { size: 3.4, x: 0.0, y: 0.2, z: 0.0, colour: 0 },
      { size: 2.0, x: -3.1, y: 2.0, z: -1.2, colour: 1 },
      { size: 1.55, x: 3.0, y: -2.0, z: 1.1, colour: 2 },
      { size: 1.0, x: 3.7, y: 2.3, z: -0.4, colour: 0 }
    ];

    cubeSettings.forEach((item, index) => {
      const geometry = new THREE.BoxGeometry(item.size, item.size, item.size);
      const material = new THREE.MeshBasicMaterial({
        color: accentColours[item.colour],
        wireframe: true,
        transparent: true,
        opacity: index === 0 ? 0.38 : 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(item.x, item.y, item.z);
      cube.rotation.set(index * 0.22, index * 0.34, index * 0.14);
      cube.userData.spin = 0.08 + index * 0.025;
      heroAccent.add(cube);
      heroAccentMaterials.push(material);
    });

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x82e6df,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.045, 8, 72), ringMaterial);
    ring.rotation.x = Math.PI * 0.42;
    ring.rotation.y = Math.PI * 0.16;
    heroAccent.add(ring);
    heroAccentMaterials.push(ringMaterial);

    heroAccent.position.set(9.2, 0.2, -1.5);
    heroAccent.scale.setScalar(0.95);
    scene.add(heroAccent);
  }

  function updateHeroAccentLayout() {
    if (!heroAccent) return;
    heroAccent.visible = window.innerWidth >= 760;
    heroAccent.position.x = window.innerWidth >= 1200 ? 9.2 : 7.4;
    heroAccent.scale.setScalar(window.innerWidth >= 1200 ? 0.95 : 0.76);
  }
  updateHeroAccentLayout();

  // Mouse interaction
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollY = 0;

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    updateClusterScrollState();
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
    updateHeroAccentLayout();
    updateClusterScrollState();
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

    if (heroAccent) {
      const heroVisibility = Math.max(0, 1 - scrollY / 720);
      heroAccent.rotation.y = t * 0.10 + mouse.x * 0.18;
      heroAccent.rotation.x = Math.sin(t * 0.32) * 0.07 + mouse.y * 0.10;
      heroAccent.position.y = 0.2 + mouse.y * 0.55 - scrollY * 0.002;
      heroAccent.children.forEach((object, index) => {
        if (object.userData.spin) {
          object.rotation.x += object.userData.spin * 0.004;
          object.rotation.y += object.userData.spin * 0.006;
        }
      });
      heroAccentMaterials.forEach((accentMaterial, index) => {
        const baseOpacity = index === 0 ? 0.38 : (index === heroAccentMaterials.length - 1 ? 0.16 : 0.28);
        accentMaterial.opacity = baseOpacity * heroVisibility;
      });
    }

    // Subtle pulse
    material.opacity = 0.7 + Math.sin(t * 0.8) * 0.15;

    camera.position.x += (mouse.x * 3 - camera.position.x) * 0.03;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
})();
