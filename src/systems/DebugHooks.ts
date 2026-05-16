export type VShooterDebugHooks = {
  defeatBoss: () => void;
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
