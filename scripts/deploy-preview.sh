#!/bin/bash
# Deploy current branch to Cloudflare Pages for UAT preview
BRANCH=$(git rev-parse --abbrev-ref HEAD)
rm -rf .deploy && mkdir -p .deploy
cp -r index.html css js .deploy/
npx wrangler pages deploy .deploy --project-name tsv-ledger --branch "$BRANCH" --commit-dirty=true
rm -rf .deploy
