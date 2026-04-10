---
applyTo: "**"
---

Global skills routing contract for this repository (web-app profile):

1. Run `repo-standards-router` first for task classification and gates.
2. For tasks that could benefit from remote execution or offloading, load `network-platform-resources`.
3. For OpenClaw-backed execution, load `openclaw-availability-utilization` and enforce preflight + utilization checks.
4. For runtime/UI changes, run `web-regression-governance` before final validation.
5. For GitHub governance controls, hand off to `github-ops-tree-router`.
6. Run `workflow-self-anneal` only after failures or process drift.
7. Keep changes additive and preserve existing repository instructions.
