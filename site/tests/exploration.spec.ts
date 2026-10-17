import { expect, test, type Page } from '@playwright/test';
import { stages, specialists } from '../src/data/workflow';

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page), 'no runtime or hydration errors').toEqual([]);
});

test('introduces the engineer and offers real workflow and repository actions', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How I build software with AI.');
  await expect(page.getByRole('banner').getByRole('link', { name: 'daryllmagsombol' })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('Software Engineer');
  await expect(page.getByRole('link', { name: 'Explore my workflow' })).toHaveAttribute('href', '#workflow');
  await expect(page.getByRole('link', { name: 'View the repository', exact: true }).first()).toHaveAttribute('href', 'https://github.com/daryllmagsombol/ai-workflow');
  const navigation = page.getByRole('navigation', { name: 'Workflow stages' });
  await expect(navigation.getByRole('link')).toHaveCount(8);
  for (const stage of stages) {
    await expect(navigation.locator(`a[href="#${stage.id}"]`)).toBeVisible();
  }
});

test('native stage disclosures support one, multiple, and all expanded stages', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.stage-details')).toHaveCount(8);
  await expect(page.locator('.stage-details[open]')).toHaveCount(1);
  await page.locator('#inspect > summary').click();
  await expect(page.locator('#inspect')).toHaveAttribute('open', '');
  await expect(page.locator('#understand')).toHaveAttribute('open', '');
  await expect(page.locator('#inspect')).toContainText('What happens');
  await expect(page.locator('#inspect')).toContainText('Why it matters');
  await expect(page.locator('#inspect')).toContainText('Illustrative output');
  await page.getByRole('button', { name: 'Open all stages' }).click();
  await expect(page.locator('.stage-details[open]')).toHaveCount(8);
  await expect(page.getByRole('button', { name: 'Close all stages' })).not.toHaveAttribute('aria-expanded');
  await page.getByRole('button', { name: 'Close all stages' }).click();
  await expect(page.locator('.stage-details[open]')).toHaveCount(0);
});

test('direct hashes and repeated stage links open their target without closing other stages', async ({ page }) => {
  await page.goto('./#verify');
  await expect(page.locator('#verify')).toHaveAttribute('open', '');
  await page.getByRole('navigation', { name: 'Workflow stages' }).locator('a[href="#delegate"]').click();
  await expect(page).toHaveURL(/#delegate$/);
  await expect(page.locator('#delegate')).toHaveAttribute('open', '');
  await expect(page.locator('#verify')).toHaveAttribute('open', '');
  await page.locator('#delegate > summary').click();
  await expect(page.locator('#delegate')).not.toHaveAttribute('open');
  await page.getByRole('navigation', { name: 'Workflow stages' }).locator('a[href="#delegate"]').click();
  await expect(page.locator('#delegate')).toHaveAttribute('open', '');
});

test('keyboard users can skip navigation, operate disclosures, and open all stages', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  const summary = page.locator('#inspect > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#inspect')).toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(page.locator('#inspect')).not.toHaveAttribute('open');
  const button = page.getByRole('button', { name: 'Open all stages' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.stage-details[open]')).toHaveCount(8);
});

test('delegation keeps all seven specialist roles inside a nested disclosure', async ({ page }) => {
  await page.goto('./#delegate');
  const nested = page.locator('#delegate .specialist-details');
  await expect(nested).not.toHaveAttribute('open');
  await nested.locator('summary').click();
  await expect(nested).toHaveAttribute('open', '');
  for (const role of specialists) {
    await expect(nested.getByRole('heading', { name: role.title, exact: true })).toBeVisible();
  }
  await expect(page.locator('#delegate')).toContainText('Only independent work runs in parallel');
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`cinematic layout remains readable and usable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto('./');
    await expect(page.getByRole('button', { name: 'Open all stages' })).toBeAttached();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    const heroBounds = (await page.locator('.hero').boundingBox())!;
    for (const element of await page.locator('.scene-caption span').all()) {
      const label = (await element.boundingBox())!;
      expect(label.x).toBeGreaterThanOrEqual(heroBounds.x + 7);
      expect(label.x + label.width).toBeLessThanOrEqual(heroBounds.x + heroBounds.width - 7);
      expect(label.x).toBeGreaterThanOrEqual(16);
      expect(label.x + label.width).toBeLessThanOrEqual(width - 16);
    }
    for (const element of await page.locator('.orbit-ring').all()) {
      const ring = (await element.boundingBox())!;
      expect(ring.x).toBeGreaterThanOrEqual(heroBounds.x);
      expect(ring.x + ring.width).toBeLessThanOrEqual(heroBounds.x + heroBounds.width);
    }
    const buttons = page.getByRole('button', { name: 'Open all stages' });
    const bounds = await buttons.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: testInfo.outputPath(`page-${width}.png`), fullPage: true });
    await page.locator('.hero').screenshot({ path: testInfo.outputPath(`hero-${width}.png`) });
    await page.locator('#evidence').screenshot({ path: testInfo.outputPath(`evidence-${width}.png`) });
    await page.locator('.closing-section').screenshot({ path: testInfo.outputPath(`footer-${width}.png`) });
    await page.getByRole('button', { name: 'Open all stages' }).click();
    await expect(page.locator('.stage-details[open]')).toHaveCount(8);
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.locator('#delegate .specialist-details > summary').click();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.locator('#delegate').screenshot({ path: testInfo.outputPath(`delegation-${width}.png`) });
  });
}
