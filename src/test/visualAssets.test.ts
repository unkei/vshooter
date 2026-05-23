import { describe, expect, it } from 'vitest';
import {
  BOSS_TEXTURE_KEY,
  ENEMY_TEXTURE_KEYS,
  EXTERNAL_VISUAL_ASSETS,
  PLAYER_TEXTURE_KEY,
  getMissingCharacterTextureKeys,
  preloadExternalVisualAssets,
} from '../game/visualAssets';

describe('generated visual assets', () => {
  it('defines generated game-style textures for each character class', () => {
    expect(PLAYER_TEXTURE_KEY).toBe('vshooter.player.ship');
    expect(ENEMY_TEXTURE_KEYS).toEqual({
      straight: 'vshooter.enemy.straight',
      sway: 'vshooter.enemy.sway',
      heavy: 'vshooter.enemy.heavy',
    });
    expect(BOSS_TEXTURE_KEY).toBe('vshooter.boss.carrier');
  });

  it('defines a stable placeholder manifest for external character assets', () => {
    expect(EXTERNAL_VISUAL_ASSETS).toEqual([
      {
        key: PLAYER_TEXTURE_KEY,
        path: 'assets/visual/player-ship.svg',
      },
      {
        key: ENEMY_TEXTURE_KEYS.straight,
        path: 'assets/visual/enemy-straight.svg',
      },
      {
        key: ENEMY_TEXTURE_KEYS.sway,
        path: 'assets/visual/enemy-sway.svg',
      },
      {
        key: ENEMY_TEXTURE_KEYS.heavy,
        path: 'assets/visual/enemy-heavy.svg',
      },
      {
        key: BOSS_TEXTURE_KEY,
        path: 'assets/visual/boss-carrier.svg',
      },
    ]);
  });

  it('queues each external character asset for Phaser preload', () => {
    const loaded: Array<{ key: string; path: string }> = [];
    const scene = {
      load: {
        image: (key: string, path: string) => {
          loaded.push({ key, path });
        },
      },
    };

    preloadExternalVisualAssets(scene as Phaser.Scene);

    expect(loaded).toEqual(EXTERNAL_VISUAL_ASSETS);
  });

  it('keeps fallback generation scoped to missing character textures', () => {
    const existingKeys = new Set<string>([PLAYER_TEXTURE_KEY, ENEMY_TEXTURE_KEYS.heavy]);

    expect(getMissingCharacterTextureKeys((key) => existingKeys.has(key))).toEqual([
      ENEMY_TEXTURE_KEYS.straight,
      ENEMY_TEXTURE_KEYS.sway,
      BOSS_TEXTURE_KEY,
    ]);
  });
});
