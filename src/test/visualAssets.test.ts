import { describe, expect, it } from 'vitest';
import {
  BOSS_TEXTURE_KEY,
  ENEMY_TEXTURE_KEYS,
  EXTERNAL_VISUAL_ASSETS,
  CHARACTER_ANIMATION_KEYS,
  PLAYER_TEXTURE_KEY,
  createCharacterAnimations,
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
        path: 'assets/sprites/player-ship.png',
        frameWidth: 48,
        frameHeight: 54,
        frames: 4,
      },
      {
        key: ENEMY_TEXTURE_KEYS.straight,
        path: 'assets/sprites/enemy-straight.png',
        frameWidth: 36,
        frameHeight: 40,
        frames: 3,
      },
      {
        key: ENEMY_TEXTURE_KEYS.sway,
        path: 'assets/sprites/enemy-sway.png',
        frameWidth: 40,
        frameHeight: 40,
        frames: 3,
      },
      {
        key: ENEMY_TEXTURE_KEYS.heavy,
        path: 'assets/sprites/enemy-heavy.png',
        frameWidth: 50,
        frameHeight: 50,
        frames: 3,
      },
      {
        key: BOSS_TEXTURE_KEY,
        path: 'assets/sprites/boss-carrier.png',
        frameWidth: 152,
        frameHeight: 84,
        frames: 4,
      },
    ]);
  });

  it('queues each external character asset for Phaser preload', () => {
    const loaded: Array<{
      key: string;
      path: string;
      config: { frameWidth: number; frameHeight: number; endFrame: number };
    }> = [];
    const scene = {
      load: {
        spritesheet: (
          key: string,
          path: string,
          config: { frameWidth: number; frameHeight: number; endFrame: number },
        ) => {
          loaded.push({ key, path, config });
        },
      },
    };

    preloadExternalVisualAssets(scene as Phaser.Scene);

    expect(loaded).toEqual(
      EXTERNAL_VISUAL_ASSETS.map((asset) => ({
        key: asset.key,
        path: asset.path,
        config: {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
          endFrame: asset.frames - 1,
        },
      })),
    );
  });

  it('keeps fallback generation scoped to missing character textures', () => {
    const existingKeys = new Set<string>([PLAYER_TEXTURE_KEY, ENEMY_TEXTURE_KEYS.heavy]);

    expect(getMissingCharacterTextureKeys((key) => existingKeys.has(key))).toEqual([
      ENEMY_TEXTURE_KEYS.straight,
      ENEMY_TEXTURE_KEYS.sway,
      BOSS_TEXTURE_KEY,
    ]);
  });

  it('creates looping animations only when enough external frames are loaded', () => {
    const created: Array<{ key: string; textureKey: string; end: number }> = [];
    const existingTextures = new Map<string, { frameTotal: number }>([
      [PLAYER_TEXTURE_KEY, { frameTotal: 5 }],
      [ENEMY_TEXTURE_KEYS.straight, { frameTotal: 4 }],
      [ENEMY_TEXTURE_KEYS.sway, { frameTotal: 1 }],
      [ENEMY_TEXTURE_KEYS.heavy, { frameTotal: 4 }],
      [BOSS_TEXTURE_KEY, { frameTotal: 5 }],
    ]);
    const scene = {
      textures: {
        exists: (key: string) => existingTextures.has(key),
        get: (key: string) => existingTextures.get(key),
      },
      anims: {
        exists: () => false,
        generateFrameNumbers: (textureKey: string, config: { start: number; end: number }) => {
          created.push({ key: '', textureKey, end: config.end });
          return [];
        },
        create: (config: { key: string }) => {
          created[created.length - 1].key = config.key;
        },
      },
    };

    createCharacterAnimations(scene as unknown as Phaser.Scene);

    expect(created).toEqual([
      {
        key: CHARACTER_ANIMATION_KEYS.player,
        textureKey: PLAYER_TEXTURE_KEY,
        end: 3,
      },
      {
        key: CHARACTER_ANIMATION_KEYS.enemy.straight,
        textureKey: ENEMY_TEXTURE_KEYS.straight,
        end: 2,
      },
      {
        key: CHARACTER_ANIMATION_KEYS.enemy.heavy,
        textureKey: ENEMY_TEXTURE_KEYS.heavy,
        end: 2,
      },
      {
        key: CHARACTER_ANIMATION_KEYS.boss,
        textureKey: BOSS_TEXTURE_KEY,
        end: 3,
      },
    ]);
  });
});
