import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

async function layers(page: Page) {
  return page.locator('[data-depth]').evaluateAll(elements => Object.fromEntries(elements.map(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    const box = element.getBoundingClientRect();
    return [element.getAttribute('data-depth'), { y: matrix.m42, x: matrix.m41, screenY: box.y }];
  }))) as Promise<Record<string, { y: number; x: number; screenY: number }>>;
}

for (const width of [390, 1440]) {
  test(`foreground and typography have perceptible scroll depth at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto('./');
    await expect(page.locator('.motion-controls')).toBeVisible();
    await expect(page.locator('#intro-title')).toHaveCSS('opacity', '1');
    const before = await layers(page);
    await page.screenshot({ path: testInfo.outputPath(`depth-before-${width}.png`) });
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect.poll(async () => Math.abs((await layers(page)).foreground.y - before.foreground.y)).toBeGreaterThan(width === 390 ? 10 : 35);
    const after = await layers(page);
    expect(Math.abs(after.typography.y - before.typography.y)).toBeGreaterThan(width === 390 ? 8 : 25);
    expect(after.foreground.y).toBeGreaterThan(0);
    expect(after.typography.y).toBeLessThan(0);
    if (width === 1440) expect(after.background.y).toBeGreaterThan(after.foreground.y);
    await testInfo.attach('measured-depth.json', { body: JSON.stringify({ width, scroll: 500, before, after }, null, 2), contentType: 'application/json' });
    await writeFile(testInfo.outputPath(`measured-depth-${width}.json`), JSON.stringify({ width, scroll: 500, before, after }, null, 2));
    await page.screenshot({ path: testInfo.outputPath(`depth-after-${width}.png`) });
  });
}

test('pause freezes foreground depth and orbital motion even while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('./');
  await expect(page.locator('.motion-controls')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 250));
  await expect.poll(async () => (await layers(page)).foreground.y).toBeGreaterThan(10);
  await page.getByRole('button', { name: 'Pause motion' }).dispatchEvent('click');
  await expect(page.getByRole('button', { name: 'Resume motion' })).toBeVisible();
  const frozen = await layers(page);
  const ring = await page.locator('.orbit-outer').evaluate(element => getComputedStyle(element).transform);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);
  const after = await layers(page);
  for (const id of ['typography', 'foreground', 'background']) expect(after[id].y).toBe(frozen[id].y);
  expect(await page.locator('.orbit-outer').evaluate(element => getComputedStyle(element).transform)).toBe(ring);
  await page.getByRole('button', { name: 'Resume motion' }).dispatchEvent('click');
  await expect.poll(async () => (await layers(page)).foreground.y).toBeGreaterThan(frozen.foreground.y + 10);
});

test('reduced motion suppresses every depth layer while preserving the story', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Reduced motion enabled' })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 500));
  const values = await layers(page);
  for (const id of ['typography', 'foreground', 'background']) expect(values[id].y).toBe(0);
  expect(await page.locator('.orbit-outer').evaluate(element => getComputedStyle(element).transform)).toBe('none');
  await expect(page.locator('.stage-details')).toHaveCount(8);
});

// Enabling reduced motion mid-session must neutralize the pointer-driven depth
// grid too. The CSS reduced override targets [data-depth], and the JS pointer
// handlers no-op once motion stops, so an unmarked rail would keep its stale
// pointer offset. This reproduces that by moving the pointer, then switching the
// media preference at runtime and asserting the real computed transforms.
test('enabling reduced motion mid-session neutralizes the depth grid and every depth layer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('./');
  await expect(page.locator('.motion-controls')).toBeVisible();

  const grid = page.locator('.hero-depth-grid');
  const gridTransform = () => grid.evaluate(element => getComputedStyle(element).transform);
  const gridX = () => grid.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);

  const hero = (await page.locator('.hero').boundingBox())!;
  await page.mouse.move(hero.x + hero.width - 40, hero.y + 40);
  await expect.poll(gridX).not.toBe(0);
  expect(Math.abs(await gridX()), 'pointer establishes a nonzero rail offset first').toBeGreaterThan(0.5);

  await page.emulateMedia({ reducedMotion: 'reduce' });

  expect(await gridTransform(), 'depth grid transform neutralized under reduced motion').toBe('none');
  expect(await gridX(), 'depth grid has no residual x offset').toBe(0);
  const values = await layers(page);
  for (const id of ['typography', 'foreground', 'background']) {
    expect(values[id].x, `${id} x neutralized`).toBe(0);
    expect(values[id].y, `${id} y neutralized`).toBe(0);
  }
});
