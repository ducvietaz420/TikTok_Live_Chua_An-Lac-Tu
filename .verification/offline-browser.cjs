// Run an existing overlay browser check with local HTTP/WS supplied in memory.
// The real SDK and theme execute unchanged; no network or TikTok connection.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const file = path.resolve(__dirname, process.argv[2] || 'viewer-names-check.cjs');
const source = fs.readFileSync(file, 'utf8');
const marker = '    const errors = [];';
if (!source.includes(marker)) throw new Error('Browser check has no setup marker');
const setup = `
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return route.abort();
      const asset = url.pathname.startsWith('/sdk/')
        ? path.join(root, 'tiktok-live-kit/public', url.pathname)
        : path.join(themeDir, url.pathname === '/' ? 'index.html' : url.pathname);
      if (!asset.startsWith(root) || !fs.existsSync(asset) || fs.statSync(asset).isDirectory()) {
        return route.fulfill({ status: 404, body: '' });
      }
      await route.fulfill({ status: 200, contentType: mime[path.extname(asset)] || 'application/octet-stream', body: fs.readFileSync(asset) });
    });
    await page.routeWebSocket('**/ws', socket => {
      wss.emit('connection', {
        on(kind, callback) { if (kind === 'message') socket.onMessage(callback); return this; },
        send(payload) { socket.send(payload); },
      });
    });
`;
const compiled = new Module(file, module);
compiled.filename = file;
compiled.paths = Module._nodeModulePaths(path.dirname(file));
compiled._compile(source.replace(marker, marker + setup), file);
