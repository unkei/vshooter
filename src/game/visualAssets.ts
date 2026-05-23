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
  frameWidth: number;
  frameHeight: number;
  frameRate: number;
  flipY: boolean;
  crops: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

const CHARACTER_TEXTURE_KEYS = [
  PLAYER_TEXTURE_KEY,
  ENEMY_TEXTURE_KEYS.straight,
  ENEMY_TEXTURE_KEYS.sway,
  ENEMY_TEXTURE_KEYS.heavy,
  BOSS_TEXTURE_KEY,
];

export const CHARACTER_SPRITE_SHEET = {
  key: 'vshooter.source.pixelSpaceShooterSheet',
  path: 'assets/sprites/source/pixel-space-shooter-sheet.png',
};

export const CHARACTER_SPRITES: ExternalVisualAsset[] = [
  {
    key: PLAYER_TEXTURE_KEY,
    frameWidth: 48,
    frameHeight: 54,
    frameRate: 6,
    flipY: false,
    crops: [
      { x: 40, y: 680, width: 120, height: 165 },
      { x: 195, y: 680, width: 120, height: 165 },
      { x: 330, y: 680, width: 120, height: 165 },
      { x: 465, y: 680, width: 120, height: 165 },
    ],
  },
  {
    key: ENEMY_TEXTURE_KEYS.straight,
    frameWidth: 36,
    frameHeight: 40,
    frameRate: 5,
    flipY: true,
    crops: [
      { x: 40, y: 105, width: 95, height: 120 },
      { x: 170, y: 105, width: 95, height: 120 },
      { x: 295, y: 105, width: 95, height: 120 },
    ],
  },
  {
    key: ENEMY_TEXTURE_KEYS.sway,
    frameWidth: 40,
    frameHeight: 40,
    frameRate: 5,
    flipY: true,
    crops: [
      { x: 425, y: 120, width: 125, height: 105 },
      { x: 555, y: 120, width: 125, height: 105 },
      { x: 660, y: 120, width: 125, height: 105 },
    ],
  },
  {
    key: ENEMY_TEXTURE_KEYS.heavy,
    frameWidth: 50,
    frameHeight: 50,
    frameRate: 4,
    flipY: true,
    crops: [
      { x: 820, y: 55, width: 115, height: 190 },
      { x: 950, y: 55, width: 115, height: 190 },
      { x: 1080, y: 55, width: 115, height: 190 },
    ],
  },
  {
    key: BOSS_TEXTURE_KEY,
    frameWidth: 146,
    frameHeight: 200,
    frameRate: 4,
    flipY: true,
    crops: [
      { x: 39, y: 250, width: 300, height: 410 },
      { x: 335, y: 250, width: 300, height: 410 },
    ],
  },
];

export const CHARACTER_ANIMATION_KEYS = {
  player: 'vshooter.anim.player.idle',
  enemy: {
    straight: 'vshooter.anim.enemy.straight',
    sway: 'vshooter.anim.enemy.sway',
    heavy: 'vshooter.anim.enemy.heavy',
  },
  boss: 'vshooter.anim.boss.idle',
};

export function preloadExternalVisualAssets(scene: Phaser.Scene): void {
  scene.load.image(CHARACTER_SPRITE_SHEET.key, CHARACTER_SPRITE_SHEET.path);
}

export function getMissingCharacterTextureKeys(
  textureExists: (key: string) => boolean,
): string[] {
  return CHARACTER_TEXTURE_KEYS.filter((key) => !textureExists(key));
}

export function ensureGameTextures(scene: Phaser.Scene): void {
  createExternalCharacterTextures(scene);

  for (const key of getMissingCharacterTextureKeys((textureKey) =>
    scene.textures.exists(textureKey),
  )) {
    createGeneratedTexture(scene, key);
  }
}

export function createCharacterAnimations(scene: Phaser.Scene): void {
  createLoopingAnimation(scene, {
    animationKey: CHARACTER_ANIMATION_KEYS.player,
    textureKey: PLAYER_TEXTURE_KEY,
    frameRate: 6,
  });
  createLoopingAnimation(scene, {
    animationKey: CHARACTER_ANIMATION_KEYS.enemy.straight,
    textureKey: ENEMY_TEXTURE_KEYS.straight,
    frameRate: 5,
  });
  createLoopingAnimation(scene, {
    animationKey: CHARACTER_ANIMATION_KEYS.enemy.sway,
    textureKey: ENEMY_TEXTURE_KEYS.sway,
    frameRate: 5,
  });
  createLoopingAnimation(scene, {
    animationKey: CHARACTER_ANIMATION_KEYS.enemy.heavy,
    textureKey: ENEMY_TEXTURE_KEYS.heavy,
    frameRate: 4,
  });
  createLoopingAnimation(scene, {
    animationKey: CHARACTER_ANIMATION_KEYS.boss,
    textureKey: BOSS_TEXTURE_KEY,
    frameRate: 4,
  });
}

function createExternalCharacterTextures(scene: Phaser.Scene): void {
  if (
    typeof document === 'undefined' ||
    !scene.textures.exists(CHARACTER_SPRITE_SHEET.key)
  ) {
    return;
  }

  const sourceImage = scene.textures
    .get(CHARACTER_SPRITE_SHEET.key)
    .getSourceImage();
  if (!(sourceImage instanceof HTMLImageElement || sourceImage instanceof HTMLCanvasElement)) {
    return;
  }

  for (const sprite of CHARACTER_SPRITES) {
    if (scene.textures.exists(sprite.key)) {
      continue;
    }

    const canvas = document.createElement('canvas');
    canvas.width = sprite.frameWidth * sprite.crops.length;
    canvas.height = sprite.frameHeight;
    const context = canvas.getContext('2d');
    if (context === null) {
      continue;
    }
    context.imageSmoothingEnabled = false;

    for (const [index, crop] of sprite.crops.entries()) {
      const frameX = index * sprite.frameWidth;
      if (sprite.flipY) {
        context.save();
        context.translate(frameX, sprite.frameHeight);
        context.scale(1, -1);
        context.drawImage(
          sourceImage,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          sprite.frameWidth,
          sprite.frameHeight,
        );
        context.restore();
      } else {
        context.drawImage(
          sourceImage,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          frameX,
          0,
          sprite.frameWidth,
          sprite.frameHeight,
        );
      }
    }

    scene.textures.addSpriteSheet(sprite.key, canvas as unknown as HTMLImageElement, {
      frameWidth: sprite.frameWidth,
      frameHeight: sprite.frameHeight,
      endFrame: sprite.crops.length - 1,
    });
  }
}

export function playCharacterAnimation(
  sprite: Phaser.GameObjects.Sprite,
  animationKey: string,
): void {
  if (sprite.scene.anims.exists(animationKey)) {
    sprite.play(animationKey, true);
  }
}

function createLoopingAnimation(
  scene: Phaser.Scene,
  config: {
    animationKey: string;
    textureKey: string;
    frameRate: number;
  },
): void {
  const sprite = CHARACTER_SPRITES.find((item) => item.key === config.textureKey);
  const frameCount = sprite?.crops.length ?? 1;
  if (
    scene.anims.exists(config.animationKey) ||
    !scene.textures.exists(config.textureKey) ||
    scene.textures.get(config.textureKey).frameTotal < frameCount + 1
  ) {
    return;
  }

  scene.anims.create({
    key: config.animationKey,
    frames: scene.anims.generateFrameNumbers(config.textureKey, {
      start: 0,
      end: frameCount - 1,
    }),
    frameRate: config.frameRate,
    repeat: -1,
  });
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
