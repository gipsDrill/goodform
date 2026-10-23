/* One pre-blended loop, one decoder, no animation loop or canvas changes. */
(function () {
  'use strict';
  const anchor = document.getElementById('bg-canvas-net');
  if (!anchor || document.getElementById('nebula-overlay') ||
      !window.CSS || !CSS.supports('mix-blend-mode', 'screen')) return;

  const base = new URL('../assets/video/', document.currentScript.src);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const mobile = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const source = new URL(mobile ? 'nebula-v3-720p.mp4' : 'nebula-v3-1440p.mp4', base).href;
  let video;
  let failed = false;
  let started = false;

  function allowed() {
    return !reduced.matches && !(connection &&
      (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
  }

  function play() {
    if (!video || document.hidden || !allowed() || failed) return;
    const current = video;
    const result = current.play();
    if (result) result.catch(() => {
      // Autoplay can be denied (e.g. low power mode); keep the original view.
      current.removeAttribute('data-playing');
    });
  }

  function sync() {
    if (!started) return;
    if (!allowed()) {
      if (video) {
        video.pause();
        video.remove();
        video.removeAttribute('src');
        video.load();
        video = null;
      }
      return;
    }
    if (document.hidden) {
      if (video) video.pause();
      return;
    }
    if (failed) return;
    if (!video) {
      video = document.createElement('video');
      video.id = 'nebula-overlay';
      video.setAttribute('aria-hidden', 'true');
      video.setAttribute('tabindex', '-1');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = true;
      video.defaultPlaybackRate = 0.8;
      video.playbackRate = 0.8;
      video.preload = 'none';
      video.addEventListener('playing', () => video && video.setAttribute('data-playing', ''));
      video.addEventListener('error', () => {
        failed = true;
        video.removeAttribute('data-playing');
        video.pause();
        video.removeAttribute('src');
        video.load();
      }, { once: true });
      anchor.after(video);
      video.src = source;
    }
    play();
  }

  function start() {
    const begin = () => { started = true; sync(); };
    if ('requestIdleCallback' in window) requestIdleCallback(begin, { timeout: 2000 });
    else setTimeout(begin, 250);
  }

  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { if (video) video.pause(); });
  window.addEventListener('pageshow', sync);
  // One retry after a user gesture if the browser blocked muted autoplay.
  window.addEventListener('pointerdown', play, { once: true, passive: true });
  if (reduced.addEventListener) reduced.addEventListener('change', sync);
  else reduced.addListener(sync);
  if (connection && connection.addEventListener) connection.addEventListener('change', sync);
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
