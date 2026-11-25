// Render a tiny-pixel-worlds scene with headless Chromium (Playwright) + ffmpeg.
//   node tools/render.cjs <scene.html> stills 0,3,5.2,9 out.png   -> one row of stills (3x nearest upscale)
//   node tools/render.cjs <scene.html> video out.mp4 [frames=600]  -> 1080x1920, 30 fps, nearest-neighbour upscale, no audio
//   node tools/render.cjs <scene.html> loop                        -> pixel diff renderAt(LOOP) vs renderAt(0) (must be 0) and the wrap step
// Needs: npm i playwright && npx playwright install chromium (or set CHROME=<path to chrome.exe>) ; ffmpeg on PATH.
// The scene must define window.renderAt(t) (draws frame t, returns a PNG data URL), window.LOOP and set window.__ready = true.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright'), { spawn, spawnSync } = require('child_process');
const [, , scene, mode, a1, a2] = process.argv, FPS = 30, FF = process.env.FFMPEG || 'ffmpeg';
if (!scene || !mode) { console.log('usage: node tools/render.cjs <scene.html> stills|video|loop ...'); process.exit(1); }
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME || undefined });
  const page = await browser.newPage({ viewport: { width: 600, height: 900 } }), errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file:///' + path.resolve(scene).replace(/\\/g, '/'));
  await page.waitForFunction(() => window.__ready, { timeout: 60000 }).catch(() => {});
  if (errs.length) { console.log('ERR', errs.join('\n')); await browser.close(); process.exit(1); }
  const grab = async t => Buffer.from((await page.evaluate(t => window.renderAt(t), t)).split(',')[1], 'base64');
  if (mode === 'stills') {
    const ts = a1.split(',').map(Number), tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tpw-')), ins = [];
    for (const t of ts) { const f = path.join(tmp, 's_' + t + '.png'); fs.writeFileSync(f, await grab(t)); ins.push('-i', f); }
    const fl = ts.map((_, i) => `[${i}:v]scale=iw*3:ih*3:flags=neighbor,pad=iw+12:ih:0:0:white[v${i}]`).join(';') + ';' + ts.map((_, i) => `[v${i}]`).join('') + `hstack=inputs=${ts.length}`;
    const r = spawnSync(FF, ['-y', '-loglevel', 'error', ...ins, '-filter_complex', fl, a2]); if (r.status) console.log(String(r.stderr));
    console.log('wrote', a2);
  } else if (mode === 'video') {
    const N = +(a2 || 600), ff = spawn(FF, ['-y', '-loglevel', 'warning', '-f', 'image2pipe', '-framerate', String(FPS), '-vcodec', 'png', '-i', 'pipe:0',
      '-vf', 'scale=1080:1920:flags=neighbor,setsar=1', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', a1], { stdio: ['pipe', 'ignore', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    for (let i = 0; i < N; i++) { const b = await grab(i / FPS); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); console.log('ffmpeg exit', await done, a1);
  } else if (mode === 'loop') {
    const L = await page.evaluate(() => window.LOOP || 20);
    const px = async t => page.evaluate(t => { window.renderAt(t); return Array.from(window.FRAMEBUF); }, t);
    const p0 = await px(0), pL = await px(L), pLast = await px((L * FPS - 1) / FPS), p1 = await px(1 / FPS);
    const diff = (A, B) => A.reduce((n, v, i) => n + (v !== B[i] ? 1 : 0), 0);
    console.log(`t${L} vs t0 differing px: ${diff(p0, pL)} (must be 0) | wrap step last->0: ${diff(pLast, p0)} | normal step 0->1: ${diff(p0, p1)} (wrap should be close to normal)`);
  }
  await browser.close();
})();
