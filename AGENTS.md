# AGENTS.md — repository baseline

## Agent startup protocol (required)

1. Load repository baseline instructions from .github/copilot-instructions.md before planning edits.
2. Use global skills from ~/.copilot/skills as the primary reusable capability layer.
3. Route workflow using these skills in order:
   - `repo-standards-router` (classify work type and gates)
   - `workflow-self-anneal` (only after failures/process mismatch)
4. Validate changes with repository gate workflows before claiming completion.

## Edit discipline

- Keep changes minimal and localized.
- Preserve existing public APIs unless scope requires intentional API changes.
- Prefer objective validation evidence over assumptions.
- Record significant process discoveries in repository workflow docs where applicable.
