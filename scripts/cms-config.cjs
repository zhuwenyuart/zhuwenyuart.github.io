const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { imagePrefix, allowedImageExtensions } = require('../docs/assets/js/portfolio/artwork-data.js');

function validateCmsConfig(projectRoot) {
  const config = yaml.load(fs.readFileSync(path.join(projectRoot, '.pages.yml'), 'utf8'), { schema: yaml.JSON_SCHEMA });
  // Validate the safety boundary and compatibility, not an exact copy of every
  // label, optional field, ordering or editor preference in the YAML file.
  const input = 'docs' + imagePrefix.replace(/\/$/, '');
  if (!Array.isArray(config.media) || config.media.length !== 1) throw new Error('CMS must expose one artwork media source');
  const media = config.media[0];
  if (!media.name || media.input !== input || media.output !== imagePrefix.replace(/\/$/, '') ||
      !Array.isArray(media.extensions) || !media.extensions.length ||
      media.extensions.some(extension => !allowedImageExtensions.includes(extension))) {
    throw new Error('CMS media must stay inside the supported artwork image boundary');
  }
  if (!Array.isArray(config.content) || config.content.length !== 1) throw new Error('CMS must expose only artwork management');
  const entry = config.content[0];
  if (entry.type !== 'file' || entry.path !== 'docs/artwork.json' || entry.format !== 'json' || entry.list !== true || !Array.isArray(entry.fields)) {
    throw new Error('CMS must edit the artwork JSON array');
  }
  const fields = new Map(entry.fields.map(field => [field.name, field]));
  for (const [name, type] of Object.entries({ name: 'string', path: 'image', time: 'string', category: 'string', material: 'string', size: 'string' })) {
    if (fields.get(name)?.type !== type || fields.get(name)?.required !== true) throw new Error(`Incompatible required artwork field: ${name}`);
  }
  for (const field of entry.fields.filter(field => field.type === 'image')) {
    if (field.options?.media !== media.name) throw new Error('CMS image fields must use the artwork media source');
  }
  if (fields.has('detail') && fields.get('detail').list !== true) throw new Error('Artwork detail images must remain a list');
  const records = JSON.parse(fs.readFileSync(path.join(projectRoot, entry.path), 'utf8'));
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!fields.has(key)) throw new Error(`CMS schema would discard artwork field: ${key}`);
    }
  }
  return config;
}

module.exports = { validateCmsConfig };
