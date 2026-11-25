const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream');
const { parseArgs } = require('node:util');

const siteDirectories = new Set([
  'about', 'assets', 'contact', 'media', 'portfolios',
  'single_portfolio', 'wp-content', 'wp-includes',
]);
const siteFiles = new Set(['index.html', 'artwork.json']);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function publicPath(segments) {
  if (segments.includes('..') || segments.some(segment => segment.startsWith('.')) ||
      (segments[0] === 'media' && !['artworks', 'site', 'brand'].includes(segments[1]))) return false;
  return !segments.length || siteDirectories.has(segments[0]) ||
    (segments.length === 1 && siteFiles.has(segments[0]));
}

function inside(root, filename) {
  const relative = path.relative(root, filename);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}

// Development preview only: no directory listing, repository files, uploads,
// authentication or production hardening. Use an SSH tunnel by default.
function createPreviewServer({ root = path.join(__dirname, '..', 'docs') } = {}) {
  const realRoot = fs.realpathSync(root);
  return http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { allow: 'GET, HEAD' }).end();
      return;
    }
    let segments;
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.includes('\0') || pathname.includes('\\')) throw new Error('Invalid path');
      segments = pathname.split('/').filter(Boolean);
    } catch {
      response.writeHead(400).end('Invalid path');
      return;
    }
    if (!publicPath(segments)) {
      response.writeHead(404).end('Not found');
      return;
    }
    let filename = path.resolve(realRoot, ...segments);
    if (!inside(realRoot, filename)) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      if ((await fs.promises.stat(filename)).isDirectory()) {
        if (!new URL(request.url, 'http://localhost').pathname.endsWith('/')) {
          const url = new URL(request.url, 'http://localhost');
          response.writeHead(308, { location: url.pathname + '/' + url.search }).end();
          return;
        }
        filename = path.join(filename, 'index.html');
      }
      filename = await fs.promises.realpath(filename);
      const stat = await fs.promises.stat(filename);
      const physicalSegments = path.relative(realRoot, filename).split(path.sep);
      const contentType = types[path.extname(filename).toLowerCase()];
      if (!inside(realRoot, filename) || !publicPath(physicalSegments) || !stat.isFile() || !contentType) {
        throw new Error('Not public');
      }
      response.writeHead(200, {
        'content-type': contentType,
        'content-length': stat.size,
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      });
      if (request.method === 'HEAD') response.end();
      else pipeline(fs.createReadStream(filename), response, () => {});
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
}

if (require.main === module) {
  const { values } = parseArgs({
    options: {
      host: { type: 'string', default: '127.0.0.1' },
      port: { type: 'string', default: '8001' },
    },
  });
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port must be between 1 and 65535');
  const server = createPreviewServer();
  server.on('error', error => {
    console.error(`Cannot start preview: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, values.host, () => {
    console.log(`Preview ready: http://${values.host}:${port}/`);
    console.log('Development only. Default loopback binding: use SSH port forwarding for remote access.');
    console.log('Source changes appear after a browser refresh; automatic reload is not enabled.');
    if (!['127.0.0.1', '::1', 'localhost'].includes(values.host)) {
      console.warn('Network binding enabled. No authentication: use only on a trusted private network.');
    }
  });
}

module.exports = { createPreviewServer };
