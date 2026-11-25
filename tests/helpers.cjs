const { test: base, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const artworks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs/artwork.json'), 'utf8'));

const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    // Third-party fonts and analytics are not the behavior being tested.
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin
      ? route.continue() : route.abort('blockedbyclient'));
    await page.addInitScript(() => { window.Worker = undefined; });
    await use(page);
  },
});

async function openGallery(page, records = artworks) {
  await page.goto('/portfolios/');
  await expect(page.locator('.grid-item')).toHaveCount(records.length);
  await expect(page.locator('.pc-filter button').first()).toBeAttached();
}

async function expectVisibleArtworks(page, records) {
  // Compare membership, not an editorial ordering or a fixed catalog snapshot.
  const expected = records.map(record => record.name).sort();
  await expect.poll(() => page.locator('.grid-item').evaluateAll(items => items
    .filter(item => getComputedStyle(item).display !== 'none')
    .map(item => item.querySelector('img').alt).sort())).toEqual(expected);
}

async function selectFilter(page, type, label) {
  const select = page.locator(`.mobile-filter .${type}-group select`);
  await select.selectOption({ label });
}

module.exports = { test, expect, artworks, openGallery, expectVisibleArtworks, selectFilter };
