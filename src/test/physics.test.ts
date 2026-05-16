import { describe, expect, it } from 'vitest';
import { syncArcadeBody, type ArcadeBodyOwner } from '../game/physics';

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

