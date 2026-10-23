/* Observe presented frames through three real wraps, without timer-driven seeks.
   NODE_PATH must include Playwright. Optional argument v2 measures the old loop. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const version = process.argv[2] || 'v3';
assert.ok(['v2', 'v3'].includes(version));
const out = process.env.QA_OUTPUT || path.join(root, 'test-results');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const name = path.basename(new URL(req.url, 'http://local').pathname);
  if (!/^nebula-v[23]-(1440|720)p\.mp4$/.test(name)) { res.writeHead(404).end(); return; }
  const file = path.join(root, 'assets/video', name);
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const size = fs.statSync(file).size;
  const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '');
  const headers = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*' };
  if (range) {
    const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...headers, 'Content-Length': size });
    fs.createReadStream(file).pipe(res);
  }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { version, browser: browser.version(), results: [] };
  try {
    for (const height of [1440, 720]) {
      const page = await browser.newPage();
      await page.setContent(`<video crossorigin="anonymous" muted autoplay loop playsinline src="http://127.0.0.1:${server.address().port}/nebula-${version}-${height}p.mp4"></video>`);
      await page.waitForFunction(() => document.querySelector('video').currentTime > .1);
      const result = await page.evaluate(async () => {
        const v = document.querySelector('video');
        v.defaultPlaybackRate = 0.512;
        v.playbackRate = 0.512;
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 72;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const gaps = [], seams = [], errors = [];
        let previousTime, previousNow, previousPixels;
        v.addEventListener('error', () => errors.push('media error'));
        v.currentTime = v.duration - .4;
        await new Promise(resolve => v.addEventListener('seeked', resolve, { once: true }));
        await v.play();
        return await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('three loop wraps timed out')),
            Math.ceil((2 * v.duration / v.playbackRate + 10) * 1000));
          function sample(now, metadata) {
            ctx.drawImage(v, 0, 0, 128, 72);
            const pixels = ctx.getImageData(0, 0, 128, 72).data;
            if (previousTime !== undefined) {
              const gap = now - previousNow;
              gaps.push(gap);
              if (metadata.mediaTime < previousTime) {
                let delta = 0, black = 0, previousBlack = 0;
                for (let i = 0; i < pixels.length; i += 4) {
                  delta += Math.abs(pixels[i] - previousPixels[i]) + Math.abs(pixels[i+1] - previousPixels[i+1]) + Math.abs(pixels[i+2] - previousPixels[i+2]);
                  if (pixels[i] + pixels[i+1] + pixels[i+2] === 0) black++;
                  if (previousPixels[i] + previousPixels[i+1] + previousPixels[i+2] === 0) previousBlack++;
                }
                seams.push({ from: previousTime, to: metadata.mediaTime, gapMs: gap,
                  rgbMAE: delta / (128 * 72 * 3), blackPixelFraction: black / (128 * 72),
                  previousBlackPixelFraction: previousBlack / (128 * 72) });
              }
            }
            previousTime = metadata.mediaTime;
            previousNow = now;
            previousPixels = pixels;
            if (seams.length === 3) {
              clearTimeout(timeout);
              gaps.sort((a, b) => a - b);
              resolve({ duration: v.duration, playbackRate: v.playbackRate, width: v.videoWidth, height: v.videoHeight,
                frameGapP95Ms: gaps[Math.floor(gaps.length * .95)], frameGapMaxMs: gaps.at(-1), seams, errors });
            } else v.requestVideoFrameCallback(sample);
          }
          v.requestVideoFrameCallback(sample);
        });
      });
      assert.equal(result.seams.length, 3);
      assert.deepEqual(result.errors, []);
      if (version === 'v3') {
        assert.equal(result.duration, 6.8);
        assert.equal(result.playbackRate, 0.512);
        assert.ok(result.seams.every(s => s.gapMs <= Math.max(150, result.frameGapP95Ms * 3)), JSON.stringify(result));
        // Browser rasterization is measured at 128x72; keep mean visible change
        // below half one 8-bit channel step, plus a separate black-flash check.
        assert.ok(result.seams.every(s => s.rgbMAE * .5 < .5 && s.blackPixelFraction <= s.previousBlackPixelFraction + .005), JSON.stringify(result));
      }
      report.results.push(result);
      console.log('PASS three presented-frame wraps', height, JSON.stringify(result));
      await page.close();
    }
  } finally {
    fs.writeFileSync(path.join(out, `loop-playback-${version}.json`), JSON.stringify(report, null, 2));
    await browser.close(); server.close();
  }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
