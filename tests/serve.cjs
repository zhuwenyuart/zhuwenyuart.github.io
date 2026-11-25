const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { pipeline } = require('node:stream');

const root = path.resolve(process.env.SITE_ROOT || path.join(__dirname, '..', 'docs'));
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
};

http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  let filename = path.resolve(root, '.' + pathname);
  if (filename !== root && !filename.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
    if (!fs.statSync(filename).isFile()) throw new Error('not a file');
    response.writeHead(200, {
      'content-type': types[path.extname(filename).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    if (request.method === 'HEAD') response.end();
    else pipeline(fs.createReadStream(filename), response, () => {});
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
}).listen(18765, '127.0.0.1', () => {
  console.log(`Test static server: http://127.0.0.1:18765 (${root})`);
});
