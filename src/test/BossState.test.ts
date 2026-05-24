import { describe, expect, it } from 'vitest';
import {
  BOSS_DEFEAT_CLEAR_DELAY_MS,
  BOSS_DEFEAT_FADES_SPRITE,
  BOSS_DEFEAT_SPRITE_DEPTH,
  BOSS_DEFEAT_SPRITE_DESTROY_DELAY_MS,
  BOSS_DEFEAT_USES_DEDICATED_BODY,
  BOSS_ENTRANCE_TRAVEL_MS,
  BOSS_ENTRANCE_DELAY_MS,
  BOSS_ENTRY_START_Y,
  BOSS_ENTRY_TARGET_Y,
  BOSS_HIT_FEEDBACK_MODE,
  BOSS_HIT_FLASH_DURATION_MS,
  BOSS_HIT_FLASH_MIN_INTERVAL_MS,
  BOSS_HIT_FLASH_OVERLAY_ALPHA,
  BOSS_LOCKS_VISUAL_STATE_ON_HIT,
  BOSS_MAX_HP,
  BOSS_PRE_WARNING_GRACE_MS,
  BOSS_PRESERVES_BASE_SPRITE_DURING_HIT_FLASH,
  BOSS_RUSH_ATTACK_ENABLED_BY_DEFAULT,
  BOSS_RUSH_DURATION_MS,
  BOSS_RUSH_INTERVAL_MS,
  BOSS_RUSH_TARGET_Y,
  BOSS_USES_CAMERA_FLASH,
  createBossDefeatBursts,
  configureBossBody,
  disableBossBody,
  isRenderableBossSprite,
  shouldStartBossHitFlash,
} from '../game/bossState';

describe('isRenderableBossSprite', () => {
  it('rejects missing, inactive, and invisible boss sprites', () => {
    expect(isRenderableBossSprite(null)).toBe(false);
    expect(isRenderableBossSprite({ active: false, visible: true })).toBe(false);
    expect(isRenderableBossSprite({ active: true, visible: false })).toBe(false);
  });

  it('accepts an active and visible boss sprite', () => {
    expect(isRenderableBossSprite({ active: true, visible: true })).toBe(true);
  });

  it('keeps the boss body kinematic so bullet hits cannot nudge it', () => {
    const calls: string[] = [];
    const body = {
      set moves(value: boolean) {
        calls.push(`moves:${value}`);
      },
      setImmovable(value: boolean) {
        calls.push(`immovable:${value}`);
        return this;
      },
      setPushable(value: boolean) {
        calls.push(`pushable:${value}`);
        return this;
      },
      setVelocity(x: number, y: number) {
        calls.push(`velocity:${x},${y}`);
        return this;
      },
      setAllowGravity(value: boolean) {
        calls.push(`gravity:${value}`);
        return this;
      },
    };

    configureBossBody(body);

    expect(calls).toEqual([
      'immovable:true',
      'pushable:false',
      'velocity:0,0',
      'gravity:false',
      'moves:false',
    ]);
  });

  it('triples the boss health budget from the previous tuning value', () => {
    expect(BOSS_MAX_HP).toBe(1890);
  });

  it('holds boss spawn briefly after regular enemies are gone for an entrance reaction', () => {
    expect(BOSS_ENTRANCE_DELAY_MS).toBeGreaterThanOrEqual(1500);
  });

  it('uses a readable staged boss entrance before attacks begin', () => {
    expect(BOSS_PRE_WARNING_GRACE_MS).toBe(650);
    expect(BOSS_ENTRANCE_TRAVEL_MS).toBe(900);
    expect(BOSS_ENTRY_START_Y).toBe(-150);
    expect(BOSS_ENTRY_TARGET_Y).toBe(120);
    expect(BOSS_PRE_WARNING_GRACE_MS).toBeGreaterThan(0);
    expect(BOSS_ENTRANCE_TRAVEL_MS).toBeGreaterThan(0);
    expect(BOSS_ENTRY_START_Y).toBeLessThan(BOSS_ENTRY_TARGET_Y);
    expect(BOSS_ENTRANCE_DELAY_MS).toBeGreaterThanOrEqual(
      BOSS_PRE_WARNING_GRACE_MS + BOSS_ENTRANCE_TRAVEL_MS,
    );
  });

  it('leaves time for a boss defeat reaction before the clear screen', () => {
    expect(BOSS_DEFEAT_CLEAR_DELAY_MS).toBeGreaterThanOrEqual(1200);
  });

  it('keeps the boss sprite present through the defeat reaction', () => {
    expect(BOSS_DEFEAT_USES_DEDICATED_BODY).toBe(true);
    expect(BOSS_DEFEAT_SPRITE_DESTROY_DELAY_MS).toBeGreaterThanOrEqual(
      BOSS_DEFEAT_CLEAR_DELAY_MS,
    );
    expect(BOSS_DEFEAT_SPRITE_DEPTH).toBeGreaterThanOrEqual(34);
  });

  it('uses a short stable flash for normal boss hits', () => {
    expect(BOSS_HIT_FEEDBACK_MODE).toBe('tint-flash');
    expect(BOSS_HIT_FLASH_DURATION_MS).toBeGreaterThanOrEqual(60);
    expect(BOSS_HIT_FLASH_DURATION_MS).toBeLessThanOrEqual(140);
    expect(BOSS_HIT_FLASH_MIN_INTERVAL_MS).toBeGreaterThan(
      BOSS_HIT_FLASH_DURATION_MS,
    );
    expect(BOSS_LOCKS_VISUAL_STATE_ON_HIT).toBe(true);
  });

  it('keeps the base boss visible under a partial white hit flash overlay', () => {
    expect(BOSS_PRESERVES_BASE_SPRITE_DURING_HIT_FLASH).toBe(true);
    expect(BOSS_HIT_FLASH_OVERLAY_ALPHA).toBeGreaterThanOrEqual(0.35);
    expect(BOSS_HIT_FLASH_OVERLAY_ALPHA).toBeLessThanOrEqual(0.65);
  });

  it('does not restart boss hit flash on every rapid-fire hit', () => {
    expect(shouldStartBossHitFlash(-Infinity, 1000)).toBe(true);
    expect(shouldStartBossHitFlash(1000, 1060)).toBe(false);
    expect(shouldStartBossHitFlash(1000, 1180)).toBe(true);
  });

  it('does not use screen flashes or boss alpha fades for boss events', () => {
    expect(BOSS_USES_CAMERA_FLASH).toBe(false);
    expect(BOSS_DEFEAT_FADES_SPRITE).toBe(false);
  });

  it('defines the stage 2 boss rush as an opt-in pressure spike', () => {
    expect(BOSS_RUSH_ATTACK_ENABLED_BY_DEFAULT).toBe(false);
    expect(BOSS_RUSH_INTERVAL_MS).toBe(5200);
    expect(BOSS_RUSH_DURATION_MS).toBe(1200);
    expect(BOSS_RUSH_TARGET_Y).toBe(260);
    expect(BOSS_RUSH_TARGET_Y).toBeGreaterThan(BOSS_ENTRY_TARGET_Y);
  });

  it('creates several boss defeat bursts around the boss center', () => {
    const bursts = createBossDefeatBursts(240, 120);

    expect(bursts).toHaveLength(7);
    expect(bursts[0]).toMatchObject({ x: 240, y: 120, delayMs: 0 });
    expect(new Set(bursts.map((burst) => burst.delayMs)).size).toBeGreaterThan(1);
  });

  it('keeps defeat bursts active through most of the clear delay', () => {
    const bursts = createBossDefeatBursts(240, 120);
    const lastBurstDelayMs = Math.max(...bursts.map((burst) => burst.delayMs));

    expect(lastBurstDelayMs).toBeGreaterThanOrEqual(
      BOSS_DEFEAT_CLEAR_DELAY_MS * 0.7,
    );
    expect(lastBurstDelayMs).toBeLessThan(BOSS_DEFEAT_CLEAR_DELAY_MS);
  });

  it('ignores missing boss bodies when disabling defeat collision', () => {
    expect(() => disableBossBody(undefined)).not.toThrow();
  });

  it('disables boss collision when a live body exists', () => {
    const body = { enable: true };

    disableBossBody(body);

    expect(body.enable).toBe(false);
  });
});
