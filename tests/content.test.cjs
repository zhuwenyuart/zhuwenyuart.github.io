const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const { validateArtworkContent, validateImage, limits } = require('../scripts/artwork-validation.cjs');
const { validateArtworks, imagePath } = require('../docs/assets/js/portfolio/artwork-data.js');

// Synthetic examples: independent of the live catalog, names and ordering.
const record = overrides => ({
  name: 'Example', path: '/media/artworks/example.png', time: '2030',
  category: 'new series [a:b]', material: 'Oil', size: '20×30cm', ...overrides,
});

async function fixture(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'artwork-test-'));
  fs.mkdirSync(path.join(directory, 'docs/media/artworks'), { recursive: true });
  const image = path.join(directory, 'docs/media/artworks/example.png');
  await sharp({ create: { width: 12, height: 10, channels: 3, background: '#998877' } }).png().toFile(image);
  try { await run(directory, image); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('catalog accepts legitimate changes and empty content, not just a frozen dataset', () => {
  const initial = [record()];
  const updated = [{ ...initial[0], name: 'Edited " <name>', category: 'Changed category' }];
  const added = [...updated, record({ name: 'Added', path: '/media/artworks/added.png' })];
  for (const records of [initial, updated, added, added.slice(1), []]) {
    assert.equal(validateArtworks(records).length, records.length);
  }
  assert.throws(() => validateArtworks([record({ time: 'not a year' })]));
  assert.throws(() => validateArtworks([record(), record()]));
});

test('artwork paths enforce the media boundary without depending on real filenames', () => {
  assert.equal(imagePath('media/artworks/任意名字.png'), '/media/artworks/任意名字.png');
  for (const value of [
    'https://example.com/a.png', '/media/site/a.png',
    '/media/artworks/../a.png', '/media/artworks/%2e%2e/a.png',
    '/media/artworks/a.png?x=1', '/media/artworks/a.svg',
  ]) assert.throws(() => imagePath(value), value);
});

test('referenced main and detail images must exist', async () => {
  await fixture(async directory => {
    const options = { projectRoot: directory };
    await validateArtworkContent({ ...options, artworks: [record()] });
    const missing = '/media/artworks/missing.png';
    await assert.rejects(validateArtworkContent({ ...options, artworks: [record({ path: missing })] }));
    const optional = record({ detail: [missing] });
    await assert.rejects(validateArtworkContent({ ...options, artworks: [optional] }));
  });
});

test('image validation catches corruption, mislabeled format and configured size limits', async () => {
  await fixture(async (directory, image) => {
    const wrong = path.join(directory, 'docs/media/artworks/wrong.jpg');
    fs.copyFileSync(image, wrong);
    await assert.rejects(validateImage(wrong));
    fs.writeFileSync(image, 'not an image');
    await assert.rejects(validateImage(image));
    fs.writeFileSync(image, Buffer.alloc(limits.maxBytes + 1));
    await assert.rejects(validateImage(image));
  });
});
