export type VShooterDebugHooks = {
  defeatBoss: () => void;
  gameOver: () => void;
  spawnBoss: () => void;
  damageBoss: (amount?: number) => boolean;
  getBossVisualState: () => {
    exists: boolean;
    visible: boolean;
    alpha: number;
    depth: number;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    flashActive: boolean;
    defeatBodyVisible: boolean;
    flashOverlay: {
      visible: boolean;
      alpha: number;
      x: number;
      y: number;
    } | null;
  } | null;
  getPlayerState: () => {
    x: number;
    y: number;
  } | null;
  getActiveScene: () => string | null;
};

export type VShooterDebugStatus = {
  enabled: boolean;
  isAllowedHost: boolean;
  search: string;
};

export function shouldInstallDebugHooks(isDev: boolean, search: string): boolean {
  if (!isDev) {
    return false;
  }

  const params = new URLSearchParams(search);
  return (
    params.get('debug') === '1' ||
    params.get('debug') === 'true' ||
    params.get('vshooterDebug') === '1'
  );
}
