export const ENDING_STAFF_ROLES = [
  'DIRECTOR',
  'PROGRAM',
  'GAME DESIGN',
  'SOUND',
  'SPECIAL THANKS',
] as const;

export function endingMessageLines(): string[] {
  return [
    'Earth was protected from the alien invasion.',
    'The blue planet shines safely beneath the stars.',
  ];
}

export function buildEndingStaffLines(): string[] {
  return ENDING_STAFF_ROLES.map((role) => `${role}  unno`);
}
