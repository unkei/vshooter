export type ArcadeBodyOwner = {
  body?: unknown;
};

export function syncArcadeBody(object: ArcadeBodyOwner | null): void {
  const body = object?.body as
    | {
        updateFromGameObject?: () => void;
      }
    | null
    | undefined;
  body?.updateFromGameObject?.();
}
