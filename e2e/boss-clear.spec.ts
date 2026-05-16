import { expect, type Page, test } from '@playwright/test';

test('debug boss defeat reaches stage clear without browser errors', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });

  await page.goto('/?debug=1');

  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('debug-defeat-boss')).toBeVisible();

  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () =>
      (window as unknown as { __vshooterDebug?: { getActiveScene?: () => string | null } })
        .__vshooterDebug?.getActiveScene?.() === 'GameScene',
    undefined,
    { timeout: 5_000 },
  );

  await page.getByTestId('debug-defeat-boss').click();
  await page.waitForFunction(
    () =>
      (window as unknown as { __vshooterDebug?: { getActiveScene?: () => string | null } })
        .__vshooterDebug?.getActiveScene?.() === 'ResultScene',
    undefined,
    { timeout: 5_000 },
  );

  expect(await windowText(page)).toContain('ResultScene');
  expect(browserErrors).toEqual([]);
});

async function windowText(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      (window as unknown as { __vshooterDebug?: { getActiveScene?: () => string | null } })
        .__vshooterDebug?.getActiveScene?.() ?? '',
  );
}
