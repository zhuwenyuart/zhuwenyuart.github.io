const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { validateArtworks, imagePath } = require('../docs/assets/js/portfolio/artwork-data.js');

const limits = Object.freeze({ maxBytes: 5 * 1024 * 1024, maxPixels: 24_000_000, maxSide: 8000 });

async function validateImage(filename) {
  const stat = fs.statSync(filename);
  if (!stat.isFile() || stat.size === 0 || stat.size > limits.maxBytes) {
    throw new Error(`图片为空或超过 5 MiB：${filename}`);
  }
  const extension = path.extname(filename).slice(1).toLowerCase();
  const expectedFormat = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp' }[extension];
  if (!expectedFormat) throw new Error(`不支持的作品图片格式：${filename}`);
  const metadata = await sharp(filename, { limitInputPixels: limits.maxPixels, failOn: 'warning' }).metadata();
  if (metadata.format !== expectedFormat || (metadata.pages || 1) > 1 ||
      !metadata.width || !metadata.height || Math.max(metadata.width, metadata.height) > limits.maxSide) {
    throw new Error(`图片真实格式、帧数或像素尺寸不合规：${filename}`);
  }
  // Decode all pixels to catch corrupt/truncated files; do not overwrite,
  // recompress, resize or generate thumbnails in the repository.
  await sharp(filename, { limitInputPixels: limits.maxPixels, failOn: 'warning' }).stats();
  return { bytes: stat.size, width: metadata.width, height: metadata.height };
}

async function validateArtworkContent({ projectRoot, artworks }) {
  const normalized = validateArtworks(artworks);
  const publicRoot = fs.realpathSync(path.join(projectRoot, 'docs'));
  const checked = new Set();
  async function check(value) {
    const publicPath = imagePath(value);
    const file = path.join(publicRoot, publicPath.slice(1));
    if (!fs.existsSync(file)) throw new Error(`找不到作品图片：${publicPath}`);
    const realFile = fs.realpathSync(file);
    if (!realFile.startsWith(publicRoot + path.sep)) throw new Error(`图片不在发布目录内：${publicPath}`);
    if (!checked.has(realFile)) {
      await validateImage(realFile);
      checked.add(realFile);
    }
  }
  const artworksDirectory = fs.realpathSync(path.join(publicRoot, 'media/artworks'));
  const artworkFiles = [];
  function collect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`作品媒体目录不允许符号链接：${filename}`);
      if (entry.isDirectory()) collect(filename);
      else artworkFiles.push(filename);
    }
  }
  collect(artworksDirectory);
  for (const filename of artworkFiles) {
    imagePath('/' + path.relative(publicRoot, filename).split(path.sep).join('/'));
    await validateImage(filename);
    checked.add(fs.realpathSync(filename));
  }
  for (const artwork of normalized) {
    await check(artwork.path);
    for (const detail of artwork.detail || []) await check(detail);
  }
  return { artworks: normalized.length, images: checked.size };
}

module.exports = { limits, validateImage, validateArtworkContent };
