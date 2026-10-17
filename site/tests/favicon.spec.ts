import { expect, test } from '@playwright/test';

test('root build serves the existing star mark as an SVG favicon', async ({ page, request, baseURL }, testInfo) => {
  await page.goto('./');
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('href', '/favicon.svg');
  await expect(icon).toHaveAttribute('type', 'image/svg+xml');
  const response = await request.get('/favicon.svg');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  const svg = await response.text();
  const headerPath = await page.locator('.brand-mark path').getAttribute('d');
  expect(svg).toContain(`d="${headerPath}"`);
  expect(svg).toContain('viewBox="0 0 32 32"');

  // Real SVG rendering at tab sizes, on both light and dark surfaces.
  await page.setViewportSize({ width: 480, height: 220 });
  const url = new URL('/favicon.svg', baseURL).href;
  await page.setContent(`<html><body style="margin:0;font:14px system-ui;display:grid;grid-template-columns:1fr 1fr;height:220px">
    ${['#ffffff', '#202124'].map((background, index) => `<section style="background:${background};color:${index ? '#fff' : '#111'};padding:24px"><p>${index ? 'Dark' : 'Light'} tab surface</p><div style="display:flex;align-items:center;gap:28px"><img src="${url}" width="16" height="16" alt="16 pixel icon"><img src="${url}" width="32" height="32" alt="32 pixel icon"></div></section>`).join('')}
    </body></html>`);
  for (const image of await page.locator('img').all()) {
    await expect(image).toHaveJSProperty('complete', true);
    await expect(image).toHaveJSProperty('naturalWidth', 32);
  }
  await page.screenshot({ path: testInfo.outputPath('favicon-16-32-light-dark.png') });
});
