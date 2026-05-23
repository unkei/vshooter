import Phaser from 'phaser';
import type { EnemyType } from './types';

export const PLAYER_TEXTURE_KEY = 'vshooter.player.ship';
export const ENEMY_TEXTURE_KEYS: Record<EnemyType, string> = {
  straight: 'vshooter.enemy.straight',
  sway: 'vshooter.enemy.sway',
  heavy: 'vshooter.enemy.heavy',
};
export const BOSS_TEXTURE_KEY = 'vshooter.boss.carrier';

type ExternalVisualAsset = {
  key: string;
  path: string;
};

const CHARACTER_TEXTURE_KEYS = [
  PLAYER_TEXTURE_KEY,
  ENEMY_TEXTURE_KEYS.straight,
  ENEMY_TEXTURE_KEYS.sway,
  ENEMY_TEXTURE_KEYS.heavy,
  BOSS_TEXTURE_KEY,
];

export const EXTERNAL_VISUAL_ASSETS: ExternalVisualAsset[] = [
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
];

export function preloadExternalVisualAssets(scene: Phaser.Scene): void {
  for (const asset of EXTERNAL_VISUAL_ASSETS) {
    scene.load.image(asset.key, asset.path);
  }
}

export function getMissingCharacterTextureKeys(
  textureExists: (key: string) => boolean,
): string[] {
  return CHARACTER_TEXTURE_KEYS.filter((key) => !textureExists(key));
}

export function ensureGameTextures(scene: Phaser.Scene): void {
  for (const key of getMissingCharacterTextureKeys((textureKey) =>
    scene.textures.exists(textureKey),
  )) {
    createGeneratedTexture(scene, key);
  }
}

function createGeneratedTexture(scene: Phaser.Scene, key: string): void {
  if (key === PLAYER_TEXTURE_KEY) {
    createPlayerTexture(scene);
    return;
  }
  if (key === ENEMY_TEXTURE_KEYS.straight) {
    createStraightEnemyTexture(scene);
    return;
  }
  if (key === ENEMY_TEXTURE_KEYS.sway) {
    createSwayEnemyTexture(scene);
    return;
  }
  if (key === ENEMY_TEXTURE_KEYS.heavy) {
    createHeavyEnemyTexture(scene);
    return;
  }
  if (key === BOSS_TEXTURE_KEY) {
    createBossTexture(scene);
  }
}

function createPlayerTexture(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x4ffcff, 1);
  graphics.fillTriangle(24, 2, 7, 42, 24, 34);
  graphics.fillTriangle(24, 2, 41, 42, 24, 34);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillTriangle(24, 8, 18, 30, 30, 30);
  graphics.fillStyle(0x0b1230, 0.9);
  graphics.fillRoundedRect(19, 24, 10, 14, 3);
  graphics.fillStyle(0xfff27a, 1);
  graphics.fillTriangle(18, 40, 24, 50, 30, 40);
  graphics.lineStyle(2, 0xffffff, 0.85);
  graphics.strokeTriangle(24, 2, 7, 42, 24, 34);
  graphics.strokeTriangle(24, 2, 41, 42, 24, 34);
  graphics.generateTexture(PLAYER_TEXTURE_KEY, 48, 54);
  graphics.destroy();
}

function createStraightEnemyTexture(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xff4f8b, 1);
  graphics.fillTriangle(18, 36, 3, 8, 18, 15);
  graphics.fillTriangle(18, 36, 33, 8, 18, 15);
  graphics.fillStyle(0x5b1434, 1);
  graphics.fillRoundedRect(10, 11, 16, 20, 5);
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillCircle(18, 18, 4);
  graphics.lineStyle(2, 0xffffff, 0.75);
  graphics.strokeTriangle(18, 36, 3, 8, 18, 15);
  graphics.strokeTriangle(18, 36, 33, 8, 18, 15);
  graphics.generateTexture(ENEMY_TEXTURE_KEYS.straight, 36, 40);
  graphics.destroy();
}

function createSwayEnemyTexture(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xffd24f, 1);
  graphics.fillEllipse(20, 20, 30, 22);
  graphics.fillStyle(0x34280b, 0.95);
  graphics.fillRoundedRect(10, 14, 20, 12, 6);
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillCircle(14, 20, 3);
  graphics.fillCircle(26, 20, 3);
  graphics.lineStyle(2, 0xffffff, 0.75);
  graphics.strokeEllipse(20, 20, 30, 22);
  graphics.lineStyle(2, 0xff8f4f, 0.85);
  graphics.lineBetween(5, 30, 35, 10);
  graphics.generateTexture(ENEMY_TEXTURE_KEYS.sway, 40, 40);
  graphics.destroy();
}

function createHeavyEnemyTexture(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xa66bff, 1);
  graphics.fillRoundedRect(7, 8, 36, 34, 8);
  graphics.fillStyle(0x2a1555, 1);
  graphics.fillRoundedRect(14, 14, 22, 18, 5);
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillRect(17, 18, 16, 4);
  graphics.fillStyle(0xfff27a, 1);
  graphics.fillRect(4, 24, 8, 12);
  graphics.fillRect(38, 24, 8, 12);
  graphics.lineStyle(2, 0xffffff, 0.8);
  graphics.strokeRoundedRect(7, 8, 36, 34, 8);
  graphics.generateTexture(ENEMY_TEXTURE_KEYS.heavy, 50, 50);
  graphics.destroy();
}

function createBossTexture(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xff3768, 1);
  graphics.fillRoundedRect(10, 16, 132, 50, 10);
  graphics.fillStyle(0x731b35, 1);
  graphics.fillRoundedRect(38, 6, 76, 28, 10);
  graphics.fillStyle(0x1b2035, 1);
  graphics.fillRoundedRect(50, 24, 52, 22, 8);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillRect(58, 31, 36, 5);
  graphics.fillStyle(0xfff27a, 1);
  graphics.fillCircle(26, 42, 7);
  graphics.fillCircle(126, 42, 7);
  graphics.fillStyle(0x6ffcff, 0.9);
  graphics.fillTriangle(10, 66, 34, 66, 18, 78);
  graphics.fillTriangle(118, 66, 142, 66, 134, 78);
  graphics.lineStyle(3, 0xffffff, 0.9);
  graphics.strokeRoundedRect(10, 16, 132, 50, 10);
  graphics.lineStyle(2, 0xffffff, 0.7);
  graphics.strokeRoundedRect(38, 6, 76, 28, 10);
  graphics.generateTexture(BOSS_TEXTURE_KEY, 152, 84);
  graphics.destroy();
}
