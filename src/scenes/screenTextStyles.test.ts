import { describe, expect, it } from 'vitest';
import {
  ARCADE_HEADING_FONT_FAMILY,
  SCORE_TEXT_FONT_FAMILY,
  arcadeHeadingTextStyle,
  scoreTextStyle,
  titleLayerTextStyle,
  titleSecondaryTextStyle,
} from './screenTextStyles';

describe('screen text styles', () => {
  it('shares the same arcade heading font family and stroke language', () => {
    const clearHeading = arcadeHeadingTextStyle('#6ffcff', '56px');
    const titleTop = titleLayerTextStyle('top');

    expect(clearHeading.fontFamily).toBe(ARCADE_HEADING_FONT_FAMILY);
    expect(titleTop.fontFamily).toBe(ARCADE_HEADING_FONT_FAMILY);
    expect(clearHeading.stroke).toBe('#061219');
    expect(titleTop.stroke).toBe(clearHeading.stroke);
    expect(titleTop.strokeThickness).toBe(clearHeading.strokeThickness);
  });

  it('uses score and bonus typography for title secondary text', () => {
    const scoreStyle = scoreTextStyle('#ffffff', '18px');
    const titleStyle = titleSecondaryTextStyle('#ffffff', '18px');

    expect(scoreStyle.fontFamily).toBe(SCORE_TEXT_FONT_FAMILY);
    expect(titleStyle.fontFamily).toBe(scoreStyle.fontFamily);
    expect(titleStyle.stroke).toBe(scoreStyle.stroke);
    expect(titleStyle.strokeThickness).toBe(scoreStyle.strokeThickness);
  });
});
