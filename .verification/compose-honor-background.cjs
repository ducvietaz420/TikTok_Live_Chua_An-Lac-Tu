// Composite the generated cushion area into the original backdrop so the altar,
// architecture and incense censer retain their original pixels and coordinates.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Nemou/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const themeDir = path.resolve(__dirname, '../tiktok-live-pgd-main/themes/chua');
const generatedPath = 'C:/Users/Nemou/.codex/generated_images/01a1ad4b-9ad5-7513-b32f-30e875c1a88d/exec-786a5d70-0d4b-4d9d-a785-6ea4ec2b6da4.png';
const dataURL = (file, type) => 'data:' + type + ';base64,' + fs.readFileSync(file).toString('base64');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    const result = await page.evaluate(async ({ originalURL, generatedURL }) => {
      const load = url => new Promise((resolve, reject) => {
        const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url;
      });
      const [original, generated] = await Promise.all([load(originalURL), load(generatedURL)]);
      const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(original, 0, 0, 1080, 1920);
      const before = ctx.getImageData(0, 0, 1080, 1920);
      const patch = document.createElement('canvas'); patch.width = 1080; patch.height = 1920;
      const g = patch.getContext('2d', { willReadFrequently: true });
      g.drawImage(generated, 0, 0, 1080, 1920);
      const pixels = g.getImageData(0, 0, 1080, 1920);
      // Keep changes inside the floor around the cushions. Feather only bare
      // wood at the perimeter. The original censer is restored with its shadow.
      const fade = (distance, edge) => Math.max(0, Math.min(1, distance / edge));
      for (let y = 0; y < 1920; y++) for (let x = 0; x < 1080; x++) {
        let alpha = Math.min(fade(x - 253, 16), fade(830 - x, 16), fade(y - 832, 7), fade(996 - y, 13));
        if (x >= 493 && x <= 588 && y >= 908) {
          const keep = Math.min(fade(x - 493, 5), fade(588 - x, 5), fade(y - 908, 5));
          alpha *= 1 - keep;
        }
        pixels.data[(y * 1080 + x) * 4 + 3] = Math.round(255 * alpha);
      }
      g.putImageData(pixels, 0, 0); ctx.drawImage(patch, 0, 0);
      const after = ctx.getImageData(0, 0, 1080, 1920);
      let changedOutside = 0;
      for (let y = 0; y < 1920; y++) for (let x = 0; x < 1080; x++) {
        if (x > 253 && x < 830 && y > 832 && y < 996) continue;
        const i = (y * 1080 + x) * 4;
        if (before.data[i] !== after.data[i] || before.data[i + 1] !== after.data[i + 1] || before.data[i + 2] !== after.data[i + 2]) changedOutside++;
      }
      return { data: canvas.toDataURL('image/png'), changedOutside, width: canvas.width, height: canvas.height };
    }, { originalURL: dataURL(path.join(themeDir, 'assets/bg-key.jpg'), 'image/jpeg'), generatedURL: dataURL(generatedPath, 'image/png') });
    if (result.changedOutside !== 0) throw new Error('Backdrop changed outside cushion area');
    const output = path.join(themeDir, 'assets/bg-honor-seats.png');
    fs.writeFileSync(output, Buffer.from(result.data.split(',')[1], 'base64'));
    console.log(JSON.stringify({ output, changedOutsideCushionArea: result.changedOutside, width: result.width, height: result.height }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
