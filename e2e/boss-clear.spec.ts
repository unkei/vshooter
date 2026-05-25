import { expect, type Page, test } from '@playwright/test';

test('debug boss defeat reaches stage clear flow without browser errors', async ({ page }) => {
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
  await installVibrationRecorder(page);

  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () =>
      (window as unknown as { __vshooterDebug?: { getActiveScene?: () => string | null } })
        .__vshooterDebug?.getActiveScene?.() === 'GameScene',
    undefined,
    { timeout: 30_000 },
  );

  await page.evaluate(() => {
    (window as unknown as { __vshooterDebug?: { defeatBoss?: () => void } })
      .__vshooterDebug?.defeatBoss?.();
  });
  await waitForBossDefeatBodyGone(page);
  await page.waitForFunction(
    () => {
      const player = (
        window as unknown as {
          __vshooterDebug?: {
            getPlayerState?: () => { x: number; y: number; visible: boolean } | null;
          };
        }
      ).__vshooterDebug?.getPlayerState?.();
      return (
        player?.visible === true &&
        Math.abs(player.x - 240) <= 4 &&
        Math.abs(player.y - 634) <= 4
      );
    },
    undefined,
    { timeout: 1_600 },
  );
  await waitForResultOverlay(page, 'STAGE CLEAR');
  expect(await windowText(page)).toContain('GameScene');
  await waitForBossDefeatBodyFade(page);
  await waitForActiveScene(page, 'ClearBonusScene', 30_000);
  await waitForVibrationPattern(page, [90, 45, 120]);
  await waitForVibrationPattern(page, [35, 25, 35, 25, 70]);
  await waitForActiveScene(page, 'GameScene', 30_000);

  await page.evaluate(() => {
    (window as unknown as { __vshooterDebug?: { defeatBoss?: () => void } })
      .__vshooterDebug?.defeatBoss?.();
  });
  await waitForResultOverlay(page, 'STAGE CLEAR');
  expect(await windowText(page)).toContain('GameScene');
  await waitForBossDefeatBodyFade(page);
  await waitForActiveScene(page, 'ClearBonusScene', 30_000);
  await waitForActiveScene(page, 'TitleScene', 30_000);

  expect(await windowText(page)).toContain('TitleScene');
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
  await waitForActiveScene(page, 'ClearBonusScene', 30_000);

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
  await waitForResultOverlay(page, 'GAME OVER');
  await waitForActiveScene(page, 'TitleScene', 25_000);

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
    { timeout: 10_000 },
  );
});

test('stage start warps the player in before combat movement', async ({ page }) => {
  await page.goto('/?debug=1');
  await expect(page.getByTestId('debug-game-over')).toBeVisible();

  await page.keyboard.press('Enter');
  await waitForActiveScene(page, 'GameScene');

  const introY = await page.evaluate(() => {
    return (
      window as unknown as {
        __vshooterDebug?: { getPlayerState?: () => { x: number; y: number } | null };
      }
    ).__vshooterDebug?.getPlayerState?.()?.y ?? null;
  });
  expect(introY).not.toBeNull();

  await page.waitForTimeout(1300);
  const combatY = await page.evaluate(() => {
    return (
      window as unknown as {
        __vshooterDebug?: { getPlayerState?: () => { x: number; y: number } | null };
      }
    ).__vshooterDebug?.getPlayerState?.()?.y ?? null;
  });

  expect(combatY).not.toBeNull();
  expect(introY!).toBeGreaterThan(combatY! + 40);
});

test('game over stays over gameplay before returning to title', async ({ page }) => {
  await page.goto('/?debug=1');
  await expect(page.getByTestId('debug-game-over')).toBeVisible();

  await page.keyboard.press('Enter');
  await waitForActiveScene(page, 'GameScene');
  await waitForBackdropEnemy(page);

  await page.keyboard.down('Enter');
  const backdropBefore = await backdropState(page);
  await page.getByTestId('debug-game-over').click();
  await waitForResultOverlay(page, 'GAME OVER');
  await page.waitForTimeout(300);
  expect(await windowText(page)).toBe('GameScene');
  expect(await resultOverlayText(page)).toBe('GAME OVER');
  const backdropAfter = await backdropState(page);
  expect(backdropAfter?.playerVisible).toBe(false);
  expect(backdropAfter?.enemyCount).toBeGreaterThan(0);
  expect(backdropBefore?.firstEnemyY).not.toBeNull();
  expect(backdropAfter?.firstEnemyY).not.toBeNull();
  expect(backdropAfter!.firstEnemyY!).toBeGreaterThan(backdropBefore!.firstEnemyY!);

  await page.keyboard.up('Enter');
  await page.waitForTimeout(100);
  await page.locator('canvas').click();
  await waitForActiveScene(page, 'TitleScene', 20_000);
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
    { timeout: 15_000 },
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
    { timeout: 15_000 },
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

async function resultOverlayText(page: Page): Promise<string | null> {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __vshooterDebug?: { getResultOverlayText?: () => string | null };
        }
      ).__vshooterDebug?.getResultOverlayText?.() ?? null,
  );
}

async function backdropState(page: Page): Promise<{
  playerVisible: boolean;
  enemyCount: number;
  firstEnemyY: number | null;
  enemyBulletCount: number;
} | null> {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __vshooterDebug?: {
            getBackdropState?: () => {
              playerVisible: boolean;
              enemyCount: number;
              firstEnemyY: number | null;
              enemyBulletCount: number;
            } | null;
          };
        }
      ).__vshooterDebug?.getBackdropState?.() ?? null,
  );
}

async function waitForBackdropEnemy(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      (
        window as unknown as {
          __vshooterDebug?: {
            getBackdropState?: () => {
              enemyCount: number;
              firstEnemyY: number | null;
            } | null;
          };
        }
      ).__vshooterDebug?.getBackdropState?.()?.enemyCount ?? 0,
    undefined,
    { timeout: 20_000 },
  );
}

async function waitForResultOverlay(page: Page, text: string): Promise<void> {
  await page.waitForFunction(
    (expected) =>
      (
        window as unknown as {
          __vshooterDebug?: { getResultOverlayText?: () => string | null };
        }
      ).__vshooterDebug?.getResultOverlayText?.() === expected,
    text,
    { timeout: 25_000 },
  );
}

async function waitForBossDefeatBodyFade(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const debug = (window as unknown as { __vshooterDebug?: any }).__vshooterDebug;
      if (debug?.getActiveScene?.() !== 'GameScene') {
        return true;
      }
      const state = debug?.getBossVisualState?.();
      // If we don't have a boss state anymore, it likely finished fading or moved scene
      if (!state || !state.defeatBodyVisible) {
        return true;
      }
      return state.alpha < 1;
    },
    undefined,
    { timeout: 25_000 },
  );
}

async function waitForBossDefeatBodyGone(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const debug = (window as unknown as { __vshooterDebug?: any }).__vshooterDebug;
      const state = debug?.getBossVisualState?.();
      return !state || state.defeatBodyVisible === false;
    },
    undefined,
    { timeout: 25_000 },
  );
}

async function waitForVibrationPattern(
  page: Page,
  expectedPattern: number[],
): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const vibrations =
        (window as unknown as { __vshooterVibrations?: Array<number | number[]> })
          .__vshooterVibrations ?? [];
      return vibrations.some((pattern) => {
        if (!Array.isArray(pattern)) {
          return false;
        }
        return (
          pattern.length === (expected as number[]).length &&
          pattern.every((value, index) => value === (expected as number[])[index])
        );
      });
    },
    expectedPattern,
    { timeout: 25_000 },
  );
}

async function installVibrationRecorder(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(window, '__vshooterVibrations', {
      configurable: true,
      value: [],
    });
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: (pattern: number | number[]) => {
        (window as unknown as { __vshooterVibrations: Array<number | number[]> })
          .__vshooterVibrations.push(pattern);
        return true;
      },
    });
  });
}

async function waitForActiveScene(
  page: Page,
  sceneKey: string,
  timeout = 25_000,
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
