import { expect, test } from '@playwright/test';
import { evidenceLinks, stages } from '../src/data/workflow';

test.use({ javaScriptEnabled: false });

test('built content remains meaningful with JavaScript disabled', async ({ page }) => {
  const response = await page.goto('./');
  const html = await response!.text();
  // Custom domain serves at the root: assets must resolve from '/', never a
  // '/ai-workflow/' project subpath.
  expect(html).toContain('/assets/');
  expect(html).toMatch(/(?:src|href)="\/assets\//);
  expect(html).not.toMatch(/(?:src|href)="\/ai-workflow\//);
  expect(html).not.toMatch(/localhost|\?key=|\.superpowers|\/Users\/|\/var\/folders\//);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How I build software with AI.');
  await expect(page.locator('.stage-details > summary')).toHaveCount(8);
  for (const stage of stages) await expect(page.locator(`#${stage.id} > summary`)).toBeVisible();
  for (const link of evidenceLinks.filter(link => link.id !== 'profile')) {
    await expect(page.locator('#evidence').getByRole('link', { name: new RegExp(link.title) })).toHaveAttribute('href', link.href);
  }
  await expect(page.getByRole('button', { name: 'Open all stages' })).toBeHidden();
});

test('native disclosures and stage anchors still work without JavaScript', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('navigation', { name: 'Workflow stages' }).locator('a[href="#inspect"]').click();
  await expect(page).toHaveURL(/#inspect$/);
  await page.locator('#inspect > summary').click();
  await expect(page.locator('#inspect')).toHaveAttribute('open', '');
  await expect(page.locator('#inspect .stage-body')).toBeVisible();
});
