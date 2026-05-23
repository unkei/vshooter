import { describe, expect, it } from 'vitest';
import {
  BOSS_TEXTURE_KEY,
  CHARACTER_SPRITE_SHEET,
  CHARACTER_SPRITES,
  ENEMY_TEXTURE_KEYS,
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

  it('defines one source sheet and dynamic crop metadata for character assets', () => {
    expect(CHARACTER_SPRITE_SHEET).toEqual({
      key: 'vshooter.source.pixelSpaceShooterSheet',
      path: 'assets/sprites/source/pixel-space-shooter-sheet-v2.png',
    });
    expect(CHARACTER_SPRITES).toEqual([
      {
        key: PLAYER_TEXTURE_KEY,
        frameWidth: 48,
        frameHeight: 54,
        frameRate: 6,
        flipY: false,
        crops: [
          { x: 20, y: 480, width: 120, height: 165 },
          { x: 160, y: 480, width: 120, height: 165 },
          { x: 300, y: 480, width: 120, height: 165 },
          { x: 440, y: 480, width: 120, height: 165 },
        ],
      },
      {
        key: ENEMY_TEXTURE_KEYS.straight,
        frameWidth: 36,
        frameHeight: 40,
        frameRate: 5,
        flipY: true,
        crops: [
          { x: 620, y: 480, width: 95, height: 120 },
          { x: 735, y: 480, width: 95, height: 120 },
          { x: 850, y: 480, width: 95, height: 120 },
        ],
      },
      {
        key: ENEMY_TEXTURE_KEYS.sway,
        frameWidth: 40,
        frameHeight: 40,
        frameRate: 5,
        flipY: true,
        crops: [
          { x: 620, y: 625, width: 125, height: 105 },
          { x: 765, y: 625, width: 125, height: 105 },
          { x: 910, y: 625, width: 125, height: 105 },
        ],
      },
      {
        key: ENEMY_TEXTURE_KEYS.heavy,
        frameWidth: 50,
        frameHeight: 50,
        frameRate: 4,
        flipY: true,
        crops: [
          { x: 20, y: 680, width: 115, height: 190 },
          { x: 155, y: 680, width: 115, height: 190 },
          { x: 290, y: 680, width: 115, height: 190 },
        ],
      },
      {
        key: BOSS_TEXTURE_KEY,
        frameWidth: 146,
        frameHeight: 215,
        frameRate: 4,
        flipY: true,
        crops: [
          { x: 20, y: 20, width: 285, height: 420 },
          { x: 325, y: 20, width: 285, height: 420 },
          { x: 630, y: 20, width: 285, height: 420 },
          { x: 925, y: 20, width: 285, height: 420 },
        ],
      },
    ]);
  });

  it('keeps boss frames large, tall, matched, and scoped to full source patterns', () => {
    const boss = CHARACTER_SPRITES.find((sprite) => sprite.key === BOSS_TEXTURE_KEY);

    expect(boss).toBeDefined();
    expect(boss?.frameWidth).toBeGreaterThanOrEqual(140);
    expect(boss?.frameHeight).toBeGreaterThanOrEqual(210);
    expect((boss?.frameWidth ?? 0) / (boss?.frameHeight ?? 1)).toBeCloseTo(285 / 420, 2);
    expect(boss?.crops).toHaveLength(4);
    expect(boss?.crops.map(({ width, height }) => ({ width, height }))).toEqual([
      { width: 285, height: 420 },
      { width: 285, height: 420 },
      { width: 285, height: 420 },
      { width: 285, height: 420 },
    ]);
    expect(boss?.crops.map((crop) => crop.drawOffsetX ?? 0)).toEqual([0, 0, 0, 0]);
  });

  it('queues only the source sprite sheet image for Phaser preload', () => {
    const loaded: Array<{ key: string; path: string }> = [];
    const scene = {
      load: {
        image: (key: string, path: string) => {
          loaded.push({ key, path });
        },
      },
    };

    preloadExternalVisualAssets(scene as Phaser.Scene);

    expect(loaded).toEqual([CHARACTER_SPRITE_SHEET]);
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
