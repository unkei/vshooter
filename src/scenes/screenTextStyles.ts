import type Phaser from 'phaser';

export const ARCADE_HEADING_FONT_FAMILY = 'Arial Black, Impact, sans-serif';
export const UI_FONT_FAMILY = 'Arial, sans-serif';

export function arcadeHeadingTextStyle(
  color: string,
  fontSize = '42px',
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: ARCADE_HEADING_FONT_FAMILY,
    fontSize,
    color,
    stroke: '#061219',
    strokeThickness: 7,
  };
}

export type TitleLayerName = 'shadow' | 'depth' | 'top';

export function titleLayerTextStyle(
  layer: TitleLayerName,
): Phaser.Types.GameObjects.Text.TextStyle {
  const base = {
    fontFamily: ARCADE_HEADING_FONT_FAMILY,
    fontSize: '56px',
  };

  if (layer === 'shadow') {
    return {
      ...base,
      color: '#10253a',
      stroke: '#07111f',
      strokeThickness: 8,
    };
  }

  if (layer === 'depth') {
    return {
      ...base,
      color: '#1675a8',
      stroke: '#00152b',
      strokeThickness: 6,
    };
  }

  return {
    ...base,
    color: '#f8ffff',
    stroke: '#35f4ff',
    strokeThickness: 3,
  };
}
