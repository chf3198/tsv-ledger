# Contributing to TSV Ledger

Thank you for your interest in contributing! This guide will help you get set
up without needing access to our production secrets.

## Architecture Overview

TSV Ledger has a **local-first** design:

| Component           | Description                              | Required? |
| ------------------- | ---------------------------------------- | --------- |
| **Frontend**        | Static HTML/CSS/JS served by Pages       | Yes       |
| **LocalStorage**    | Browser storage for offline mode         | Yes       |
| **Workers API**     | OAuth + cloud sync (your own deployment) | Optional  |
| **D1 Database**     | Cloud data persistence                   | Optional  |
| **OAuth Providers** | GitHub/Google authentication             | Optional  |

**Key insight**: The app works fully offline using localStorage. You only need
OAuth and Workers if you're working on authentication or cloud sync features.

## Quick Start (No Secrets Needed)

For most contributions (UI, import parsers, allocation logic):

```bash
# Clone and install
git clone https://github.com/chf3198/tsv-ledger.git
cd tsv-ledger
npm install

# Run tests
npm test

# Start local server
npx serve . -l 3000
# Open http://localhost:3000
```

The app will use localStorage - no authentication required.

## Setting Up Your Own Backend (Optional)

If you're working on OAuth, cloud sync, or the Workers API, you'll need your
own Cloudflare and OAuth setup. **We never share production secrets.**

### Step 1: Cloudflare Account

1. Create free account at [cloudflare.com](https://dash.cloudflare.com/sign-up)
2. Install Wrangler CLI: `npm install -g wrangler`
3. Login: `wrangler login`

### Step 2: Create D1 Database

```bash
cd worker
wrangler d1 create tsv-ledger-db-dev
```

Copy the output `database_id` and update `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tsv-ledger-db-dev"
database_id = "your-database-id-here"
```

Initialize the schema:

```bash
wrangler d1 execute tsv-ledger-db-dev --file=schema.sql
```

### Step 3: Create OAuth Apps

#### GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: TSV Ledger Dev
   - **Homepage URL**: `http://localhost:3000`
   - **Callback URL**: `https://your-worker.your-subdomain.workers.dev/auth/github/callback`
4. Save the Client ID and Client Secret

#### Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Click "Create Credentials" → "OAuth client ID"
4. Configure consent screen if prompted
5. Select "Web application"
6. Add authorized redirect URI:
   `https://your-worker.your-subdomain.workers.dev/auth/google/callback`
7. Save the Client ID and Client Secret

### Step 4: Configure Secrets

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env
```

Set Workers secrets:

```bash
cd worker
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

### Step 5: Deploy Your Worker

```bash
cd worker
wrangler deploy
```

### Step 6: Update Frontend Config

In `js/auth.js`, update the API URL for local development:

```javascript
// For local development, point to your own worker:
const API_BASE = "https://your-worker.your-subdomain.workers.dev";
```

**Note**: Don't commit this change! Use it only for local testing.

## Development Workflow

We follow strict TDD and design-first practices. See
[AI_AGENT_PROTOCOL.md](docs/AI_AGENT_PROTOCOL.md) for the full workflow.

### Before You Code

1. Read [DESIGN.md](docs/DESIGN.md) to understand architecture
2. Check existing ADRs in [docs/adr/](docs/adr/)
3. Create a feature branch: `git checkout -b feat/your-feature`

### Write Tests First

```bash
# Create your test in tests/
# Run to confirm it fails
npm test

# Then implement the feature
# Run again to confirm it passes
npm test
```

### Code Standards

- **≤100 lines per file** (enforced by `npm run lint`)
- **No external dependencies** in frontend code
- **E2E tests** with Playwright
- Follow [STYLE.md](docs/STYLE.md)

### Before Submitting

```bash
# Must pass
npm test && npm run lint
```

## Pull Request Process

1. Ensure all tests pass
2. Update CHANGELOG.md under `[Unreleased]`
3. Create PR with clear description
4. Reference any related issues
5. Wait for review

### PR Title Format

Use conventional commits:

- `feat: add expense categorization`
- `fix: correct date parsing for BOA imports`
- `docs: update contributing guide`
- `test: add allocation slider tests`

## What Contributions Are Welcome?

### High Priority

- [ ] New bank statement parsers (Chase, Wells Fargo, etc.)
- [ ] Accessibility improvements
- [ ] Mobile responsiveness
- [ ] Performance optimizations

### Good First Issues

Look for issues labeled `good first issue` in GitHub.

### Documentation

- Typo fixes
- Clarifying existing docs
- Adding examples

## Questions?

- Open a [GitHub Discussion](https://github.com/chf3198/tsv-ledger/discussions)
- Check existing [Issues](https://github.com/chf3198/tsv-ledger/issues)

## Security

- **Never commit `.env` files**
- **Never commit real financial data**
- Report security issues privately via GitHub Security Advisories

---

Thank you for contributing! 🎉
