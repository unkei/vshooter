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

  await page.evaluate(() => {
    (window as unknown as { __vshooterDebug?: { defeatBoss?: () => void } })
      .__vshooterDebug?.defeatBoss?.();
  });
  await waitForActiveScene(page, 'ClearBonusScene', 7_000);
  await waitForActiveScene(page, 'ResultScene', 7_000);

  expect(await windowText(page)).toContain('ResultScene');
  expect(browserErrors).toEqual([]);
});

test('result retry requires a fresh confirm press', async ({ page }) => {
  await page.goto('/?debug=1');
  await expect(page.getByTestId('debug-game-over')).toBeVisible();

  await page.keyboard.press('Enter');
  await waitForActiveScene(page, 'GameScene');

  await page.keyboard.down('Enter');
  await page.getByTestId('debug-game-over').click();
  await waitForActiveScene(page, 'ResultScene');
  await page.waitForTimeout(300);
  expect(await windowText(page)).toBe('ResultScene');

  await page.keyboard.up('Enter');
  await page.waitForTimeout(100);
  await page.keyboard.down('Enter');
  await waitForActiveScene(page, 'GameScene');
  await page.keyboard.up('Enter');
});

test('rapid boss hits do not keep boss flash permanently active', async ({ page }) => {
  await page.goto('/?debug=1');
  await expect(page.getByTestId('debug-defeat-boss')).toBeVisible();

  await page.keyboard.press('Enter');
  await waitForActiveScene(page, 'GameScene');

  await page.evaluate(() => {
    (window as unknown as { __vshooterDebug?: { spawnBoss?: () => void } })
      .__vshooterDebug?.spawnBoss?.();
  });

  await page.evaluate(() => {
    (window as unknown as { __vshooterDebug?: { damageBoss?: (amount?: number) => boolean } })
      .__vshooterDebug?.damageBoss?.(1);
  });

  const damageTimer = await page.evaluate(() => {
    const debugWindow = window as unknown as {
      __vshooterDebug?: { damageBoss?: (amount?: number) => boolean };
      __vshooterDamageTimer?: number;
    };
    const hooks = debugWindow.__vshooterDebug;
    debugWindow.__vshooterDamageTimer = window.setInterval(
      () => hooks?.damageBoss?.(1),
      16,
    );
    return debugWindow.__vshooterDamageTimer;
  });

  await page.waitForFunction(
    () => {
      type BossVisualState = {
        exists: boolean;
        visible: boolean;
        alpha: number;
        scaleX: number;
        scaleY: number;
        flashActive: boolean;
      };
      const state = (
        window as unknown as {
          __vshooterDebug?: { getBossVisualState?: () => BossVisualState | null };
        }
      ).__vshooterDebug?.getBossVisualState?.();
      return state?.exists === true && state.visible && state.flashActive === true;
    },
    undefined,
    { timeout: 1_000 },
  );

  await page.waitForFunction(
    () => {
      type BossVisualState = {
        exists: boolean;
        visible: boolean;
        alpha: number;
        scaleX: number;
        scaleY: number;
        flashActive: boolean;
      };
      const state = (
        window as unknown as {
          __vshooterDebug?: { getBossVisualState?: () => BossVisualState | null };
        }
      ).__vshooterDebug?.getBossVisualState?.();
      return (
        state?.exists === true &&
        state.visible &&
        state.alpha === 1 &&
        state.scaleX === 1 &&
        state.scaleY === 1 &&
        state.flashActive === false
      );
    },
    undefined,
    { timeout: 2_000 },
  );

  await page.evaluate(() => {
    const timer = (window as unknown as { __vshooterDamageTimer?: number })
      .__vshooterDamageTimer;
    if (timer !== undefined) {
      window.clearInterval(timer);
    }
  });

  const finalState = await page.evaluate(() => {
    type BossVisualState = {
      exists: boolean;
      visible: boolean;
      alpha: number;
      scaleX: number;
      scaleY: number;
      flashActive: boolean;
    };
    return (
      window as unknown as {
        __vshooterDebug?: { getBossVisualState?: () => BossVisualState | null };
      }
    ).__vshooterDebug?.getBossVisualState?.();
  });

  expect(damageTimer).toBeGreaterThan(0);
  expect(finalState).toMatchObject({
    exists: true,
    visible: true,
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
  });
});

async function windowText(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      (window as unknown as { __vshooterDebug?: { getActiveScene?: () => string | null } })
        .__vshooterDebug?.getActiveScene?.() ?? '',
  );
}

async function waitForActiveScene(
  page: Page,
  sceneKey: string,
  timeout = 5_000,
): Promise<void> {
  await page.waitForFunction(
    (expected) =>
      (window as unknown as { __vshooterDebug?: { getActiveScene?: () => string | null } })
        .__vshooterDebug?.getActiveScene?.() === expected,
    sceneKey,
    { timeout },
  );
}
