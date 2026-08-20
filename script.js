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
