# OpenClaw Usage Standard

Use these commands at session start to ensure optimal OpenClaw usage.

## 1) Preflight

- `npm run openclaw:preflight`
- If needed for offline check: `npm run openclaw:preflight:dry`

## 2) Optimize lane (refresh + utilization log)

- Coding default: `npm run openclaw:optimize`
- General tasks: `npm run openclaw:optimize:general`

`openclaw:optimize` performs:
1. OpenClaw preflight (tailscale, ssh, gateway health)
2. Model refresh only if stale (>90m) or profile changed
3. Session utilization record (`lane=openclaw`)
4. 7-day utilization report and target check

## 3) Utilization policy

- Target: OpenClaw >= 60% of workload records over rolling 7 days.
- Report: `npm run openclaw:util:report`
- Record local lane when local-only work is done:
  - `npm run openclaw:util:local`

## 4) Global install

To make commands globally available on this machine:

- `bash scripts/install-openclaw-tools.sh`

Installed commands:
- `refresh-openclaw-models`
- `openclaw-preflight`
- `openclaw-lane-log`
- `openclaw-optimize`
