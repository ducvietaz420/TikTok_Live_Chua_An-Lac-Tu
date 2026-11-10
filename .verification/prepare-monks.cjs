const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Nemou/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source = 'C:/Users/Nemou/.codex/generated_images/01a1ad4b-9ad5-7513-b32f-30e875c1a88d/exec-c1eae82a-4517-4a5b-9acd-d302333a7637.png';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    const results = await page.evaluate(async sourceURL => {
      const img = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = sourceURL; });
      return ['left', 'right'].map((side, i) => {
        const width = Math.floor(img.width / 2);
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, i * width, 0, width, img.height, 0, 0, width, img.height);
        const data = ctx.getImageData(0, 0, width, img.height).data;
        let transparent = 0;
        for (let p = 3; p < data.length; p += 4) if (data[p] === 0) transparent++;
        return { side, width, height: img.height, transparent, data: canvas.toDataURL('image/png') };
      });
    }, 'data:image/png;base64,' + fs.readFileSync(source).toString('base64'));
    for (const result of results) {
      if (result.transparent < result.width * result.height * 0.15) throw new Error('Monk cutout lost transparency');
      const output = path.resolve(__dirname, '../tiktok-live-pgd-main/themes/chua/assets/chars/monk-' + result.side + '.png');
      fs.writeFileSync(output, Buffer.from(result.data.split(',')[1], 'base64'));
      console.log(JSON.stringify({ output, width: result.width, height: result.height, transparentPixels: result.transparent }));
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
