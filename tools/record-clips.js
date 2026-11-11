#!/usr/bin/env node
/* Records the 6 second looping home page clip of each app and writes <app>/thumb.webp (and its first frame as <app>/thumb.png).
 *
 *   node tools/record-clips.js                 every app in the table below
 *   node tools/record-clips.js hero-banner-engine blog-banner-studio
 *
 * Needs Node, Playwright (`npm i -D playwright`, or a global install with NODE_PATH set) and ffmpeg with libwebp.
 * Set P5_LIB=/path/to/p5.min.js if the machine cannot reach cdnjs (Stop Building Demos loads p5 from there).
 * See tools/README.md for how to add an app.
 */
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');

const ROOT = path.resolve(__dirname, '..') + '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const at = async (t0, t, fn) => { const d = t - (Date.now() - t0); if (d > 0) await sleep(d); await fn(); };
const click = async (p, txt) => { try { await p.locator('button').filter({ hasText: txt }).first().click({ timeout: 1500 }); } catch (e) { console.log('  click failed:', txt); } };
/* crop rectangle of an element, forced to 16:9, measured on the page being recorded */
const cropOf = (sel) => async (p) => {
  const r = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [b.x, b.y, b.width]; }, sel);
  return [Math.round(r[0]), Math.round(r[1]), Math.round(r[2]), Math.round(r[2] * 9 / 16)];
};
const domClick = (p, sel) => p.evaluate((s) => document.querySelector(s).click(), sel);

/* vp: viewport, crop: [x, y, w, h] in css px (16:9, becomes 960x540), run: timeline of actions (ms after the page is ready).
   Apps that move on their own just wait; the others are driven the way a visitor would use them. */
const APPS = {
  'clearco-logistics-guide': { vp: [1280, 769], crop: [0, 49, 1280, 720], run: async (p) => {
    const t0 = Date.now();
    const go = (id, d) => p.evaluate(([i, o]) => scrollTo(0, document.getElementById(i).offsetTop - 49 + o), [id, d]);
    await at(t0, 900, () => go('stmt', 0));      // the grid with sliding squares
    await at(t0, 3000, () => go('ch1', 40));     // chapter one, chart stuck to the top
    await at(t0, 4300, () => go('ch1', 260));
    await at(t0, 5200, () => p.evaluate(() => scrollTo(0, 0)));
  } },
  'grubclub-order': { vp: [1280, 769], crop: [0, 49, 1280, 720],
    // park on the hero (collage already grown in), then play the order flow at 2.4x speed: click, pick four meals, email
    setup: async (p) => { await p.evaluate(() => gc.park()); },
    ready: 700,
    run: async (p) => {
      const t0 = Date.now();
      await at(t0, 700, () => p.evaluate(() => gc.play({ speed: 2.4, clip: true })));
      await sleep(5600);
    } },
  'clearco-terrain': { vp: [1280, 769], crop: [0, 49, 1280, 720], run: async () => {} },
  'clearco-target-frame': { vp: [1280, 769], crop: [0, 49, 1280, 720], run: async () => {} },
  'video-synopsis': { vp: [1280, 769], setup: cropOf('#vSyn'), run: async () => {} },
  'prompt-demos': { vp: [1280, 769], crop: [19, 59, 1242, 699], ready: 2200, p5: true, run: async () => {} },
  'lifecycle-image-engine': { vp: [1280, 769], crop: [0, 49, 1280, 720], run: async (p) => {
    const t0 = Date.now();
    await at(t0, 900, () => click(p, /^Lavender$/));
    await at(t0, 1900, () => click(p, /^Sky$/));
    await at(t0, 2900, () => click(p, /^Sunny$/));
    await at(t0, 3900, () => click(p, /^Icons$/));
    await at(t0, 5000, () => click(p, /^Spot illo$/));
    await at(t0, 5600, () => click(p, /^Pink$/));
  } },
  'hero-banner-engine': { vp: [1280, 769], setup: cropOf('#cv'), run: async (p) => {
    const t0 = Date.now();
    await at(t0, 800, () => click(p, /^Midnight$/));
    await at(t0, 1800, () => click(p, /^Lime$/));
    await at(t0, 2800, () => click(p, /^Lavender$/));
    await at(t0, 3700, () => click(p, /Shuffle/));
    await at(t0, 4700, () => click(p, /Shuffle/));
    await at(t0, 5600, () => click(p, /^Indigo$/));
  } },
  'ab-testing': { vp: [1280, 769], crop: [0, 49, 1280, 720], run: async (p) => {
    const t0 = Date.now();
    const row = (i) => p.evaluate((i) => { const r = document.querySelectorAll('#rows tr'); (r[i] || r[0]).click(); }, i);
    await at(t0, 900, () => row(1));
    await at(t0, 2000, () => row(2));
    await at(t0, 3000, () => row(3));
    await at(t0, 4000, () => p.locator('#chart').click({ position: { x: 60, y: 90 }, timeout: 1500 }).catch(() => {}));
    await at(t0, 5200, () => row(0));
  } },
  'blog-banner-studio': { vp: [1400, 900],
    // the preview is sticky: scroll the controls into view first so it sits still, then crop its middle 16:9
    setup: async (p) => {
      await p.evaluate(() => document.querySelectorAll('details.sec').forEach((d) => (d.open = true)));
      await p.evaluate(() => { const c = document.querySelector('input[data-k="badge"]'); if (c && c.checked) c.click(); });   // no industry badge in the tile
      await p.evaluate(() => document.querySelector('[data-act="random-comp"]').scrollIntoView({ block: 'center' }));
      await p.waitForTimeout(500);
      const r = await p.evaluate(() => { const b = document.querySelector('#banner').getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; });
      const ch = r[3], cw = ch * 16 / 9;
      return [Math.round(r[0] + (r[2] - cw) / 2), Math.round(r[1]), Math.round(cw), Math.round(ch)];
    },
    run: async (p) => {
      const t0 = Date.now(), rand = () => domClick(p, '[data-act="random-comp"]');
      // a long lead-in: the loop starts 0.5s into the footage and must show the default composition, even if the video lags the page a little
      await at(t0, 1400, rand); await at(t0, 2500, rand);
      await at(t0, 3600, () => domClick(p, '[data-act="random-palette"]'));
      await at(t0, 4600, rand); await at(t0, 5500, rand);
    } },
};

async function record(name) {
  const A = APPS[name];
  if (!A) throw new Error('unknown app ' + name + ' (add it to the table in tools/record-clips.js)');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clip-' + name + '-'));
  const [vw, vh] = A.vp;
  const browser = await chromium.launch();
  const t0 = Date.now();
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, recordVideo: { dir, size: { width: vw, height: vh } } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  if (A.p5 && process.env.P5_LIB) await page.route('**/p5.min.js', (r) => r.fulfill({ path: process.env.P5_LIB, contentType: 'application/javascript' }));
  await page.goto('file://' + ROOT + name + '/index.html');
  await page.waitForLoadState('networkidle').catch(() => {});
  if (A.setup) { const c = await A.setup(page); if (Array.isArray(c)) A.crop = c; }
  await page.waitForTimeout(A.ready || 600);
  const start = (Date.now() - t0) / 1000;
  await Promise.all([A.run(page), sleep(6900)]);
  await ctx.close(); await browser.close();
  if (errs.length) console.log('  page errors:', errs.slice(0, 2));
  return { src: path.join(dir, fs.readdirSync(dir).find((f) => f.endsWith('.webm'))), start };
}

/* 6.5 s of footage -> 6 s loop: the last half second cross-fades into the first, so the loop point is seamless.
   12 fps, 960x540, animated WebP that repeats forever. */
function encode(name, src, start) {
  const A = APPS[name], [cx, cy, cw, ch] = A.crop, out = ROOT + name + '/thumb.webp';
  const base = `[0:v]trim=start=${start.toFixed(3)}:duration=6.6,setpts=PTS-STARTPTS,fps=30,crop=${cw}:${ch}:${cx}:${cy},scale=960:540:flags=lanczos,format=yuv420p`;
  const fc = base + ',split=3[a0][b0][c0];[a0]trim=0.5:6.0,setpts=PTS-STARTPTS[a];[b0]trim=6.0:6.5,setpts=PTS-STARTPTS[b];[c0]trim=0:0.5,setpts=PTS-STARTPTS[c];[b][c]xfade=transition=fade:duration=0.5:offset=0[bc];[a][bc]concat=n=2:v=1,fps=12[v]';
  cp.execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', src, '-filter_complex', fc, '-map', '[v]', '-t', '6',
    '-c:v', 'libwebp_anim', '-q:v', '62', '-compression_level', '6', '-loop', '0', '-an', out]);
  // the still is the clip's first frame, which is also its loop point, so the tile never visibly cuts between the two
  cp.execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', src, '-filter_complex', fc, '-map', '[v]', '-frames:v', '1', ROOT + name + '/thumb.png']);
  console.log(name, '->', path.relative(ROOT, out), Math.round(fs.statSync(out).size / 1024) + ' KB, and thumb.png');
}

(async () => {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(APPS);
  for (const n of names) { const r = await record(n); encode(n, r.src, r.start); fs.rmSync(path.dirname(r.src), { recursive: true, force: true }); }
})();
