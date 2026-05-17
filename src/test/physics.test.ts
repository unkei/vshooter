import { describe, expect, it } from 'vitest';
import {
  approachVelocity,
  configureManualArcadeBody,
  syncArcadeBody,
  type ArcadeBodyOwner,
} from '../game/physics';

describe('syncArcadeBody', () => {
  it('does nothing when a game object has no arcade body', () => {
    const object = {} as ArcadeBodyOwner;

    expect(() => syncArcadeBody(object)).not.toThrow();
  });

  it('updates the arcade body when it exists', () => {
    let called = false;
    const object = {
      body: {
        updateFromGameObject: () => {
          called = true;
        },
      },
    } as ArcadeBodyOwner;

    syncArcadeBody(object);

    expect(called).toBe(true);
  });
});

describe('approachVelocity', () => {
  it('ramps toward target speed without jumping immediately to full speed', () => {
    expect(approachVelocity(0, 190, 520, 900, 0.1)).toBe(52);
  });

  it('decelerates toward zero without overshooting', () => {
    expect(approachVelocity(60, 0, 520, 900, 0.1)).toBe(0);
  });
});

describe('configureManualArcadeBody', () => {
  it('prevents arcade physics from adding movement to manually positioned objects', () => {
    const calls: string[] = [];
    const body = {
      set moves(value: boolean) {
        calls.push(`moves:${value}`);
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

    configureManualArcadeBody(body);

    expect(calls).toEqual(['velocity:0,0', 'gravity:false', 'moves:false']);
  });
});
