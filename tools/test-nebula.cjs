/* Run with Node + Playwright installed: node tools/test-nebula.cjs
   QA_OUTPUT selects the directory for screenshots and the JSON report. */
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = process.env.QA_OUTPUT || path.join(root, 'test-results');
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end(); return;
  }
  const size = fs.statSync(file).size;
  const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '');
  const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes' };
  if (range) {
    const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...headers, 'Content-Length': size }); fs.createReadStream(file).pipe(res);
  }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const engine = process.env.QA_BROWSER || 'edge';
  const browser = engine === 'webkit'
    ? await webkit.launch({ headless: true, ...(process.env.QA_WEBKIT_EXECUTABLE ? { executablePath: process.env.QA_WEBKIT_EXECUTABLE } : {}) })
    : await chromium.launch({ channel: 'msedge', headless: true });
  const report = { engine, browser: browser.version(), checks: [], errors: [] };
  const check = (name, data = true) => { report.checks.push({ name, data }); console.log('PASS', name); };
  async function page(options = {}, init) {
    const p = await browser.newPage({ viewport: { width: 1440, height: 960 }, ...options });
    p.on('pageerror', e => report.errors.push(e.message));
    await p.route('https://**', route => route.abort());
    if (init) await p.addInitScript(init);
    return p;
  }
  async function playing(p) {
    await p.waitForFunction(() => {
      const v = document.getElementById('nebula-overlay');
      return v && v.hasAttribute('data-playing') && v.currentTime > .05;
    }, null, { timeout: 15000, polling: 100 });
  }
  try {
    const pages = fs.readdirSync(root).filter(f => f.endsWith('.html') && fs.readFileSync(path.join(root, f), 'utf8').includes('src="js/site-layers.js"'));
    for (const file of pages) {
      const p = await page(); await p.goto(`${base}/${file}`); await playing(p);
      const state = await p.evaluate(() => {
        const v = document.getElementById('nebula-overlay'), s = getComputedStyle(v);
        return { duration: v.duration, source: v.currentSrc, muted: v.muted, inline: v.playsInline,
          loop: v.loop, width: v.videoWidth, height: v.videoHeight, blend: s.mixBlendMode,
          pointer: s.pointerEvents, z: s.zIndex, after: v.previousElementSibling.id,
          before: v.compareDocumentPosition(document.querySelector('main')) & Node.DOCUMENT_POSITION_FOLLOWING,
          canvases: ['bg-canvas', 'bg-canvas-net'].map(id => {
            const c = document.getElementById(id); return { width: c.width, opacity: getComputedStyle(c).opacity, filter: getComputedStyle(c).filter };
          }) };
      });
      assert.equal(state.duration, 28); assert.equal(state.width, 1920);
      assert.equal(state.blend, 'screen'); assert.equal(state.pointer, 'none');
      assert.equal(state.after, 'bg-canvas-net'); assert.equal(state.z, '0'); assert.ok(state.before);
      assert.ok(state.muted && state.inline && state.loop && state.canvases.every(c => c.width > 0));
      check(file, state); await p.close();
    }
    const mobile = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mobile.goto(`${base}/index.html`); await playing(mobile);
    assert.equal(await mobile.$eval('video', v => v.videoWidth), 1280);
    await mobile.click('.menu-button');
    assert.equal(await mobile.getAttribute('.menu-button', 'aria-expanded'), 'true');
    assert.ok(await mobile.locator('.main-nav').isVisible());
    await mobile.click('.menu-button');
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await mobile.waitForTimeout(1700);
    await mobile.screenshot({ path: path.join(out, 'mobile-nebula-5pct.png') });
    check('mobile 720p, inline playback and working navigation'); await mobile.close();

    for (const [name, init, options] of [
      ['reduced motion', null, { reducedMotion: 'reduce' }],
      ['save data', () => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }), {}],
      ['slow 2g', () => Object.defineProperty(navigator, 'connection', { value: { effectiveType: '2g' } }), {}],
      ['no screen blend', () => { const old = CSS.supports.bind(CSS); CSS.supports = (...args) => args[0] === 'mix-blend-mode' ? false : old(...args); }, {}]
    ]) {
      const p = await page(options, init); let media = 0;
      p.on('request', req => { if (req.url().endsWith('.mp4')) media++; });
      await p.goto(`${base}/index.html`); await p.waitForTimeout(2500);
      assert.equal(media, 0); assert.equal(await p.locator('#nebula-overlay').count(), 0);
      check(`${name}: zero video requests`); await p.close();
    }

    const denied = await page({}, () => {
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Denied', 'NotAllowedError'));
    });
    await denied.goto(`${base}/index.html`); await denied.waitForTimeout(2500);
    assert.equal(await denied.$eval('video', v => getComputedStyle(v).opacity), '0');
    check('autoplay denied: invisible fallback'); await denied.close();

    const broken = await page(); await broken.route('**/*.mp4', r => r.fulfill({ status: 404, body: '' }));
    await broken.goto(`${base}/index.html`); await broken.waitForTimeout(2500);
    assert.equal(await broken.$eval('video', v => getComputedStyle(v).opacity), '0');
    check('missing media: invisible fallback'); await broken.close();

    const noCSS = await page(); let noCSSMedia = 0;
    noCSS.on('request', req => { if (req.url().endsWith('.mp4')) noCSSMedia++; });
    await noCSS.route('**/nebula-overlay.css', r => r.fulfill({ status: 404, body: '' }));
    await noCSS.goto(`${base}/index.html`); await noCSS.waitForTimeout(2500);
    assert.equal(noCSSMedia, 0); assert.equal(await noCSS.locator('video').count(), 0);
    check('missing CSS: zero video requests and no unstyled flash'); await noCSS.close();

    const p = await page({}, () => {
      const raf = requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => raf(t => { if (!window.__freeze) cb(t); });
    });
    await p.goto(`${base}/index.html`); await playing(p);
    await p.waitForTimeout(1700);
    assert.equal(await p.$eval('video', v => getComputedStyle(v).opacity), '0.05');
    const quality = await p.$eval('video', v => { const q = v.getVideoPlaybackQuality(); return { totalFrames: q.totalVideoFrames, droppedFrames: q.droppedVideoFrames }; });
    check('desktop decode sample', quality);
    await p.evaluate(() => {
      window.__freeze = true;
      const v = document.querySelector('video'); v.pause(); v.currentTime = 8;
    });
    await p.waitForTimeout(300);
    await p.addStyleTag({ content: '*,*::before,*::after {animation:none!important;transition:none!important;caret-color:transparent!important}' });
    await p.evaluate(() => document.getAnimations().forEach(a => a.pause()));
    await p.screenshot({ path: path.join(out, 'desktop-nebula-5pct.png') });
    await p.$eval('video', v => v.style.opacity = '0');
    await p.screenshot({ path: path.join(out, 'desktop-original.png') });
    await p.$eval('video', v => { v.style.opacity = ''; v.currentTime = 27.8; v.play(); });
    await p.waitForFunction(() => document.querySelector('video').currentTime < 2, null, { polling: 100 });
    check('real video loop wraps 28 s to start');
    await p.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
    assert.ok(await p.$eval('video', v => v.paused));
    await p.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow')));
    await p.waitForFunction(() => !document.querySelector('video').paused, null, { polling: 100 });
    check('page lifecycle pauses and resumes playback');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.waitForFunction(() => !document.getElementById('nebula-overlay'), null, { polling: 100 });
    await p.emulateMedia({ reducedMotion: 'no-preference' }); await playing(p);
    check('changing motion preference releases/recreates video'); await p.close();
    assert.deepEqual(report.errors, []); check('zero uncaught browser errors');
  } finally {
    fs.writeFileSync(path.join(out, 'browser-tests.json'), JSON.stringify(report, null, 2));
    await browser.close(); server.close();
  }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
