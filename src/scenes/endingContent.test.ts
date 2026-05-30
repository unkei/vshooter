import { describe, expect, it } from 'vitest';
import {
  ENDING_STAFF_ROLES,
  buildEndingStaffLines,
  endingMessageLines,
} from './endingContent';

describe('ending content', () => {
  it('announces that Earth was protected from the alien invasion', () => {
    expect(endingMessageLines().join(' ')).toContain(
      'Earth was protected from the alien invasion',
    );
  });

  it('uses unno for every staff credit name', () => {
    expect(buildEndingStaffLines()).toHaveLength(ENDING_STAFF_ROLES.length);
    expect(
      buildEndingStaffLines().every((line) => line.endsWith('unno')),
    ).toBe(true);
  });
});
