# VShooter Agent Notes

Start by reading `docs/specs/game-design.md`.

Project intent:

- Build a Vite + TypeScript + Phaser vertical scrolling shooter.
- Prefer a system-first architecture over a one-off prototype.
- Keep Phaser scenes focused on lifecycle and screen flow.
- Put gameplay responsibilities in small managers/controllers.

Do not implement before checking the current spec and any implementation plan.
If the spec changes, update `docs/specs/game-design.md` first.
When addressing user-reported gameplay issues or tuning requests, document the
resolved behavior and regression expectation in `docs/specs/game-design.md` as
part of the same change.

For each implementation task, spawn a context-scoped subagent before editing
code when the available tools support it. Keep the subagent prompt narrow: include
only the relevant spec section, target files, expected behavior, and verification
commands. Use the subagent to inspect, plan, or review the focused slice, then
apply the final edits in the main workspace so ownership of file changes remains
clear. If subagents are unavailable or the task is a tiny documentation-only
change, note that and proceed directly.
