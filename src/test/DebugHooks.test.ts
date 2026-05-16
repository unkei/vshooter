import { describe, expect, it } from 'vitest';
import { shouldInstallDebugHooks } from '../systems/DebugHooks';

describe('shouldInstallDebugHooks', () => {
  it('requires both development mode and a debug query flag', () => {
    expect(shouldInstallDebugHooks(true, '?debug=1')).toBe(true);
    expect(shouldInstallDebugHooks(true, '?debug=true')).toBe(true);
    expect(shouldInstallDebugHooks(true, '?vshooterDebug=1')).toBe(true);
    expect(shouldInstallDebugHooks(true, '')).toBe(false);
    expect(shouldInstallDebugHooks(false, '?debug=1')).toBe(false);
  });
});
