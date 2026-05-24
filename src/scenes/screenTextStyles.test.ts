import { describe, expect, it } from 'vitest';
import {
  ARCADE_HEADING_FONT_FAMILY,
  arcadeHeadingTextStyle,
  titleLayerTextStyle,
} from './screenTextStyles';

describe('screen text styles', () => {
  it('shares the same arcade heading font family and stroke language', () => {
    const clearHeading = arcadeHeadingTextStyle('#6ffcff');
    const titleTop = titleLayerTextStyle('top');

    expect(clearHeading.fontFamily).toBe(ARCADE_HEADING_FONT_FAMILY);
    expect(titleTop.fontFamily).toBe(ARCADE_HEADING_FONT_FAMILY);
    expect(clearHeading.stroke).toBe('#061219');
    expect(titleTop.strokeThickness).toBeGreaterThan(0);
  });
});
