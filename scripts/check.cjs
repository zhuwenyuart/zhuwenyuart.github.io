const fs = require('node:fs');
const path = require('node:path');
const { validateCmsConfig } = require('./cms-config.cjs');
const { validateArtworkContent } = require('./artwork-validation.cjs');

// Optional local checks. This command does not build, write or publish files.
async function check() {
  const projectRoot = path.resolve(__dirname, '..');
  validateCmsConfig(projectRoot);
  const result = await validateArtworkContent({
    projectRoot,
    artworks: JSON.parse(fs.readFileSync(path.join(projectRoot, 'docs/artwork.json'), 'utf8')),
  });
  console.log(`Static site checked: ${result.artworks} artworks, ${result.images} valid images.`);
}

check().catch(error => { console.error(error.message); process.exitCode = 1; });
