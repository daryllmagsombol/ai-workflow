import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 960 });
});

// The one motion preference state must gate every consumer of the shared clock:
// hero token, cycle connection token, checkpoint emphasis, and delegation lanes.
test('pause freezes illustrative motion and resume continues it', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.motion-controls')).toBeVisible();

  const token = page.locator('.task-token');
  await expect(token).toBeAttached();
  await page.waitForTimeout(300);
  const running = Number(await token.getAttribute('data-progress'));
  expect(running, 'clock advances while running').toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Pause motion' }).click();
  await expect(page.getByRole('button', { name: 'Resume motion' })).toHaveAttribute('aria-pressed', 'true');

  await page.waitForTimeout(200);
  const frozenA = Number(await token.getAttribute('data-progress'));
  await page.waitForTimeout(500);
  const frozenB = Number(await token.getAttribute('data-progress'));
  expect(frozenB, 'measured clock is frozen while paused').toBe(frozenA);

  await page.getByRole('button', { name: 'Resume motion' }).click();
  await page.waitForTimeout(500);
  const resumed = Number(await token.getAttribute('data-progress'));
  expect(resumed, 'clock resumes after unpausing').toBeGreaterThan(frozenB);
});

test('replay resets the clock without moving scroll or closing disclosures', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.motion-controls')).toBeVisible();

  await page.locator('#inspect > summary').click();
  await expect(page.locator('#inspect')).toHaveAttribute('open', '');
  const openBefore = await page.locator('.stage-details[open]').count();

  await page.locator('#checkpoint-title').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  expect(scrollBefore, 'scrolled away from the hero').toBeGreaterThan(0);

  const token = page.locator('.task-token');
  const progressBefore = Number(await token.getAttribute('data-progress'));
  expect(progressBefore, 'clock accumulated before replay').toBeGreaterThan(400);
  const controls = page.locator('.motion-controls');
  const generationBefore = Number(await controls.getAttribute('data-replay-generation'));

  // dispatchEvent avoids Playwright's scroll-into-view so scroll preservation is
  // actually exercised (a normal click would jump back to the hero).
  await page.getByRole('button', { name: /Replay flow/ }).dispatchEvent('click');
  await page.waitForTimeout(150);

  expect(Number(await controls.getAttribute('data-replay-generation')), 'replay bumps its generation').toBe(generationBefore + 1);
  expect(Number(await token.getAttribute('data-progress')), 'replay restarts the clock').toBeLessThan(progressBefore);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore), 'replay preserves scroll position').toBeLessThanOrEqual(1);
  await expect(page.locator('#inspect'), 'replay preserves open disclosures').toHaveAttribute('open', '');
  expect(await page.locator('.stage-details[open]').count(), 'replay preserves disclosure count').toBe(openBefore);
});

test('reduced motion removes decorative travel while keeping content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How I build software with AI.');
  await expect(page.locator('.stage-details')).toHaveCount(8);

  // Continuous/decorative elements are not rendered under reduced motion.
  await expect(page.locator('.task-token')).toHaveCount(0);
  await expect(page.locator('.hero-request-token')).toHaveCount(0);
  await expect(page.locator('.correction-trace')).toHaveCount(0);
  await expect(page.locator('.lane-arrival')).toHaveCount(0);
  await expect(page.locator('.lane-departure')).toHaveCount(0);

  // Pointer/scroll parallax is suppressed by the reduced-motion stylesheet.
  expect(await page.locator('.hero-light').evaluate(element => getComputedStyle(element).transform)).toBe('none');

  // Controls remain present but inert, explaining the reduced-motion state.
  await expect(page.getByRole('button', { name: 'Reduced motion enabled' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Replay flow/ })).toBeDisabled();
});

// Hydration must be clean in both preference modes: the server render has no
// access to prefers-reduced-motion, so any preference read during the first
// client render (before the enhanced gate) would desync the hidden controls
// markup. Assert on real collected errors, not the recovered UI.
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`hydration emits no console or page errors under reducedMotion=${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console.error: ${message.text()}`); });
    await page.goto('./');
    await expect(page.locator('.motion-controls')).toBeVisible();
    await page.locator('#checkpoint-title').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    expect(errors, `no runtime or hydration errors (reducedMotion=${reducedMotion})`).toEqual([]);
  });
}
