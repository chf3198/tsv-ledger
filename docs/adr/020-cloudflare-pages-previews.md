# ADR-020: Cloudflare Pages for Branch Preview Deployments

**Date**: 2026-02-26
**Status**: Accepted

## Context

GitHub Pages only deploys from main branch, requiring merge cycles for UAT iteration. Need branch preview URLs for efficient user acceptance testing before merging.

## Decision

Use Cloudflare Pages alongside GitHub Pages for preview deployments.

**Deployment URLs**:

| Environment | URL                             | Purpose  |
| ----------- | ------------------------------- | -------- |
| Production  | `tsv-ledger.pages.dev`          | Primary  |
| Backup      | `chf3198.github.io/tsv-ledger`  | Fallback |
| Preview     | `<branch>.tsv-ledger.pages.dev` | UAT      |

## UAT Workflow

```
1. Agent makes changes on feature branch
2. Agent deploys: wrangler pages deploy . --branch=feature-name
3. User gets preview URL automatically
4. User performs UAT
5. If issues → Agent fixes → redeploy → repeat
6. When approved → merge to master → auto-deploys production
```

## Worker CORS Configuration

```javascript
const allowedOrigins = [
  "https://tsv-ledger.pages.dev",
  "https://chf3198.github.io",
];

// Allow all branch previews
if (origin.endsWith(".tsv-ledger.pages.dev")) {
  allowedOrigins.push(origin);
}
```

## Consequences

### Positive

- ✅ Branch previews enable fast UAT without merge cycles
- ✅ Free tier includes unlimited previews
- ✅ Same Cloudflare account as Worker/D1
- ✅ Global CDN with edge caching

### Negative

- ⚠️ Must deploy manually (not auto on git push for previews)
- ⚠️ Worker CORS must allow preview domains
