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

test('clear transition survives sparse Chrome gamepad slots', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  await page.addInitScript(() => {
    const button = { value: 0, pressed: false, touched: false };
    const fakePad = {
      id: 'Sparse Chrome test pad',
      index: 1,
      connected: true,
      mapping: 'standard',
      timestamp: 1,
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => button),
    };
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [null, fakePad],
    });
  });

  await page.goto('/?debug=1');
  await expect(page.getByTestId('debug-defeat-boss')).toBeVisible();

  await page.keyboard.press('Enter');
  await waitForActiveScene(page, 'GameScene');
  await page.getByTestId('debug-defeat-boss').click();
  await waitForActiveScene(page, 'ClearBonusScene', 8_000);

  expect(browserErrors).toEqual([]);
});

test('sparse Chrome gamepad still controls gameplay after replay', async ({ page }) => {
  await page.addInitScript(() => {
    const state = {
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({
        value: 0,
        pressed: false,
        touched: false,
      })),
    };
    Object.defineProperty(window, '__vshooterFakePad', {
      configurable: true,
      value: state,
    });
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [
        null,
        {
          id: 'Sparse Chrome replay pad',
          index: 1,
          connected: true,
          mapping: 'standard',
          timestamp: performance.now() + 1000,
          axes: state.axes,
          buttons: state.buttons,
        },
      ],
    });
  });

  await page.goto('/?debug=1');
  await expect(page.getByTestId('debug-game-over')).toBeVisible();

  await pressFakePadButton(page, 9);
  await waitForActiveScene(page, 'GameScene');
  await releaseFakePadButton(page, 9);

  await page.getByTestId('debug-game-over').click();
  await waitForActiveScene(page, 'ResultScene');
  await page.waitForTimeout(150);

  await pressFakePadButton(page, 9);
  await waitForActiveScene(page, 'GameScene');
  await releaseFakePadButton(page, 9);

  const startX = await page.evaluate(() => {
    return (
      window as unknown as {
        __vshooterDebug?: { getPlayerState?: () => { x: number; y: number } | null };
      }
    ).__vshooterDebug?.getPlayerState?.()?.x ?? null;
  });
  expect(startX).not.toBeNull();

  await page.evaluate(() => {
    (
      window as unknown as {
        __vshooterFakePad?: { axes: number[] };
      }
    ).__vshooterFakePad!.axes[0] = 1;
  });

  await page.waitForFunction(
    (initialX) => {
      const x = (
        window as unknown as {
          __vshooterDebug?: { getPlayerState?: () => { x: number; y: number } | null };
        }
      ).__vshooterDebug?.getPlayerState?.()?.x;
      return typeof x === 'number' && x > (initialX as number) + 8;
    },
    startX,
    { timeout: 2_000 },
  );
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

test('boss hit flash overlay stays pinned to the moving boss', async ({ page }) => {
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

  const maxFlashOffset = await page.evaluate(async () => {
    const nextFrame = () =>
      new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    let maxOffset = 0;

    for (let index = 0; index < 12; index += 1) {
      await nextFrame();
      const state = (
        window as unknown as {
          __vshooterDebug?: { getBossVisualState?: () => BossVisualState | null };
        }
      ).__vshooterDebug?.getBossVisualState?.();
      if (state?.flashActive === true && state.flashOverlay?.visible === true) {
        maxOffset = Math.max(
          maxOffset,
          Math.abs(state.x - state.flashOverlay.x),
          Math.abs(state.y - state.flashOverlay.y),
        );
      }
    }

    return maxOffset;
  });

  expect(maxFlashOffset).toBeLessThanOrEqual(0.1);
});

test('boss body remains visible during the late defeat explosion', async ({ page }) => {
  await page.goto('/?debug=1');
  await expect(page.getByTestId('debug-defeat-boss')).toBeVisible();

  await page.keyboard.press('Enter');
  await waitForActiveScene(page, 'GameScene');

  await page.evaluate(() => {
    (window as unknown as { __vshooterDebug?: { defeatBoss?: () => void } })
      .__vshooterDebug?.defeatBoss?.();
  });

  await page.waitForTimeout(1_100);

  const state = await page.evaluate(() => {
    return (
      window as unknown as {
        __vshooterDebug?: { getBossVisualState?: () => BossVisualState | null };
      }
    ).__vshooterDebug?.getBossVisualState?.();
  });

  expect(state).toMatchObject({
    exists: true,
    visible: true,
    alpha: 1,
    depth: expect.any(Number),
    defeatBodyVisible: true,
  });
  expect(state?.depth).toBeGreaterThanOrEqual(34);
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

async function pressFakePadButton(page: Page, index: number): Promise<void> {
  await page.evaluate((buttonIndex) => {
    const button = (
      window as unknown as {
        __vshooterFakePad?: {
          buttons: Array<{ value: number; pressed: boolean; touched: boolean }>;
        };
      }
    ).__vshooterFakePad!.buttons[buttonIndex];
    button.value = 1;
    button.pressed = true;
    button.touched = true;
  }, index);
  await page.waitForTimeout(100);
}

async function releaseFakePadButton(page: Page, index: number): Promise<void> {
  await page.evaluate((buttonIndex) => {
    const button = (
      window as unknown as {
        __vshooterFakePad?: {
          buttons: Array<{ value: number; pressed: boolean; touched: boolean }>;
        };
      }
    ).__vshooterFakePad!.buttons[buttonIndex];
    button.value = 0;
    button.pressed = false;
    button.touched = false;
  }, index);
  await page.waitForTimeout(100);
}

type BossVisualState = {
  exists: boolean;
  visible: boolean;
  alpha: number;
  depth: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  flashActive: boolean;
  defeatBodyVisible: boolean;
  flashOverlay: {
    visible: boolean;
    alpha: number;
    x: number;
    y: number;
  } | null;
};
