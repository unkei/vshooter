import './style.css';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './game/constants';
import { GameScene } from './scenes/GameScene';
import { ClearBonusScene } from './scenes/ClearBonusScene';
import { ResultScene } from './scenes/ResultScene';
import { TitleScene } from './scenes/TitleScene';
import {
  shouldInstallDebugHooks,
  type VShooterDebugHooks,
  type VShooterDebugStatus,
} from './systems/DebugHooks';

declare global {
  interface Window {
    __vshooterDebug?: VShooterDebugHooks;
    __vshooterDebugStatus?: VShooterDebugStatus;
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#050710',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  input: {
    gamepad: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, GameScene, ClearBonusScene, ResultScene],
};

const game = new Phaser.Game(config);

if (typeof window !== 'undefined') {
  const isLocalHost =
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost';
  const enabled = shouldInstallDebugHooks(
    import.meta.env.DEV || isLocalHost,
    window.location.search,
  );
  window.__vshooterDebugStatus = {
    enabled,
    isAllowedHost: import.meta.env.DEV || isLocalHost,
    search: window.location.search,
  };

  if (enabled) {
    const defeatBoss = (): void => {
      const scene = game.scene.getScene('GameScene');
      if (scene instanceof GameScene) {
        scene.debugDefeatBoss();
      }
    };
    const gameOver = (): void => {
      const scene = game.scene.getScene('GameScene');
      if (scene instanceof GameScene) {
        scene.debugGameOver();
      }
    };

    window.__vshooterDebug = {
      defeatBoss,
      gameOver,
      getActiveScene: () => game.scene.getScenes(true)[0]?.scene.key ?? null,
    };

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.testid = 'debug-defeat-boss';
    button.textContent = 'Debug defeat boss';
    button.style.position = 'fixed';
    button.style.left = '8px';
    button.style.bottom = '8px';
    button.style.zIndex = '10';
    button.style.fontSize = '12px';
    button.addEventListener('click', defeatBoss);
    document.body.append(button);

    const gameOverButton = document.createElement('button');
    gameOverButton.type = 'button';
    gameOverButton.dataset.testid = 'debug-game-over';
    gameOverButton.textContent = 'Debug game over';
    gameOverButton.style.position = 'fixed';
    gameOverButton.style.left = '132px';
    gameOverButton.style.bottom = '8px';
    gameOverButton.style.zIndex = '10';
    gameOverButton.style.fontSize = '12px';
    gameOverButton.addEventListener('click', gameOver);
    document.body.append(gameOverButton);
  }
}
