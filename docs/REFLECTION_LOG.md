# Reflection Log

> Persistent memory of insights, failures, and adaptations.

## Format

```markdown
## [DATE] [TYPE]: [Title]
**Context**: What was being attempted
**Outcome**: What happened
**Insight**: What was learned  
**Adaptation**: Change made (if any)
```

---

## Log Entries

### 2026-02-09 INIT: Protocol Established

**Context**: Setting up self-evolution framework  
**Outcome**: Created SELF_EVOLUTION.md with reflexion loop  
**Insight**: Structured reflection prevents repeated mistakes  
**Adaptation**: Added reflection step to development loop

### 2026-02-09 SUCCESS: Self-Evolution Implementation

**Context**: Implementing AI agent self-improvement based on research  
**Outcome**: All tests pass, all files ≤100 lines (first draft was 116)
**Insight**: Research-backed patterns (Reflexion, STOP, Self-Refine) provide structured framework
**Adaptation**: Integrated REFLECT and ADAPT steps into main development loop

### 2026-02-09 SUCCESS: GitHub CI/CD Implementation

**Context**: Implementing GitHub Actions for automated testing and deployment  
**Outcome**: Created ci.yml (44 lines), deploy.yml (40 lines), PR template, dependabot  
**Insight**: CI enforces the same checks we run locally - lint + E2E tests  
**Adaptation**: None needed - first-time implementation

### 2026-02-09 SUCCESS: Expense Apportionment UX Research

**Context**: User clarified core feature - splitting expenses between Business/Benefits by percentage  
**Outcome**: Researched slider UX best practices, documented in ADR-008  
**Insight**: 
- Single slider (0-100%) better than dual inputs for "fuzzy" allocation
- Thumb ≥32px, generous padding, editable inline values
- Presets speed up common choices (100/0, 75/25, 50/50)
- Web fetch tools often fail (404s, paywalls) - Smashing Magazine worked
**Adaptation**: 
- Data model: category → businessPercent (0-100)
- UI: table rows → expense cards with slider
- Terminology: "Board Member Benefits" (no employees)

### 2026-02-10 SUCCESS: Auth.js Multi-Provider Authentication Design

**Context**: User requested "optimally excellent User Registration" with "most advanced security protocols for free"  
**Outcome**: Comprehensive research → ADR-009 documenting Auth.js + multi-provider OAuth + Passkeys  
**Insight**:
- Passkeys (WebAuthn) = gold standard: passwordless, phishing-resistant, FREE
- Auth.js provides 80+ OAuth providers with CloudFlare D1 adapter
- OWASP cheat sheets invaluable for security requirements (session cookies, timeouts)
- Firebase/Clerk have free tiers but with limits; Auth.js is unlimited (self-hosted)
- TDD worked: 5 failing tests → implement UI → all pass in one iteration
**Adaptation**:
- Passwordless-first strategy eliminates password hashing complexity
- Auth UI added to index.html + app.js within 100-line limits
- Test file auth.spec.js covers modal, providers, user menu flows

### 2026-02-10 SUCCESS: App Shell Architecture Implementation

**Context**: User requested "app shell" before implementing core features  
**Outcome**: Comprehensive research (Google DevRel, Smashing Magazine) → ADR-010 → 7 tests → implementation  
**Insight**:
- App shell pattern separates static UI chrome from dynamic content
- Key structure: header (banner) + aside (nav) + main + footer
- Mobile-first: hamburger menu with visibility toggle via CSS + Alpine state
- Responsive breakpoints: ≤640px mobile, 641-1024px tablet, >1024px desktop
- Existing tests broke due to UI restructure - needed navigation clicks (`[data-nav="import"]`)
- CSS visibility:hidden + opacity:0 required for Playwright `not.toBeVisible()` to pass
- Form date inputs conflicted with filter date inputs - use `form input[type="date"]` selector
**Adaptation**:
- Tests now navigate via `[data-nav="..."]` before interacting with route content
- Shell CSS in separate file (css/shell.css) for maintainability
- App state gained `menuOpen` and `route` properties

---

<!-- New entries go above this line -->

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Reflections | 6 |
| Test Failures Analyzed | 1 |
| Lint Failures Analyzed | 1 |
| Rework Episodes | 2 |
| Protocol Adaptations | 3 |

## Detected Patterns

*Patterns emerge after 3+ similar entries*

- (none yet)

## Active Adaptations

| Date | Adaptation | Source |
|------|------------|--------|
| 2026-02-09 | Reflection step added to loop | Initial setup |
