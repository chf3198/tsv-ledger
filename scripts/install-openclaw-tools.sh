#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DST="$HOME/.copilot/scripts"
BIN="$HOME/.local/bin"
mkdir -p "$DST" "$BIN"

for f in refresh-openclaw-models.js openclaw-preflight.js openclaw-lane-log.js openclaw-optimize.js; do
  cp "$ROOT/$f" "$DST/$f"
  chmod +x "$DST/$f"
  ln -sf "$DST/$f" "$BIN/${f%.js}"
done

echo "Installed OpenClaw tools to $DST"
echo "Symlinked commands into $BIN"
