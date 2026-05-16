type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export type ScoreManagerOptions = {
  comboTimeoutMs: number;
  storage?: StorageLike;
};

export type ScoreSnapshot = {
  score: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  highScore: number;
};

const HIGH_SCORE_KEY = 'vshooter.highScore';

export class ScoreManager {
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private multiplier = 1;
  private lastComboAtMs: number | null = null;
  private readonly comboTimeoutMs: number;
  private readonly storage?: StorageLike;
  private highScore: number;

  constructor(options: ScoreManagerOptions) {
    this.comboTimeoutMs = options.comboTimeoutMs;
    this.storage = options.storage ?? globalThis.localStorage;
    this.highScore = this.readHighScore();
  }

  addEnemyDefeat(basePoints: number, nowMs: number): void {
    if (
      this.lastComboAtMs !== null &&
      nowMs - this.lastComboAtMs > this.comboTimeoutMs
    ) {
      this.combo = 0;
    }

    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.multiplier = 1 + (this.combo - 1) * 0.1;
    this.score += Math.round(basePoints * this.multiplier);
    this.lastComboAtMs = nowMs;
  }

  addBossDefeat(basePoints: number): void {
    this.score += Math.round(basePoints * this.multiplier);
  }

  addScoreBonus(points: number): void {
    this.score += points;
  }

  registerDamage(): void {
    this.combo = 0;
    this.multiplier = 1;
    this.lastComboAtMs = null;
  }

  finishRun(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.storage?.setItem(HIGH_SCORE_KEY, String(this.highScore));
    }
  }

  snapshot(): ScoreSnapshot {
    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      multiplier: this.multiplier,
      highScore: this.highScore,
    };
  }

  private readHighScore(): number {
    const value = this.storage?.getItem(HIGH_SCORE_KEY);
    const parsed = value === undefined || value === null ? 0 : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
