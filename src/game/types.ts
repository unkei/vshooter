export type Vector2 = {
  x: number;
  y: number;
};

export type EnemyType = 'straight' | 'sway' | 'heavy';

export type PowerUpType = 'shot' | 'life' | 'score';

export type PlayerStats = {
  lives: number;
  shotLevel: number;
  score: number;
};

