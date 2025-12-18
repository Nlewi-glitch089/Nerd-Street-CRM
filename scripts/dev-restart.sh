#!/usr/bin/env bash
set -euo pipefail

echo "Running dev restart diagnostics in $(pwd)"

echo "\n1) Confirm approve.js top lines"
if [ -f "pages/api/campaigns/[id]/approve.js" ]; then
  echo "--- pages/api/campaigns/[id]/approve.js (first 40 lines) ---"
  sed -n '1,40p' pages/api/campaigns/[id]/approve.js || true
else
  echo "File pages/api/campaigns/[id]/approve.js not found"
fi

echo "\n2) Remove .next cache"
if [ -d .next ]; then
  echo "Removing .next..."
  rm -rf .next
  echo ".next removed"
else
  echo ".next does not exist"
fi

echo "\n3) Grep for old imports in source"
grep -R "from '../../../lib/auth'" -n pages || echo "No matches in pages"

echo "\n4) Grep for any lib/auth imports (showing file and line)"
grep -R "lib/auth" -n pages || true

echo "\n5) Check compiled .next (if present) for old string"
grep -R "from '../../../lib/auth'" -n .next || echo "No matches in .next"

echo "\n6) Show git status"
git status --porcelain || true

read -r -p "Start dev server now? [y/N] " start
if [[ "$start" =~ ^[Yy]$ ]]; then
  echo "Starting dev server (use Ctrl+C to stop). If Turbopack shows stale errors, consider running with webpack: npx next dev --turbo=false"
  npm run dev
else
  echo "Skipped starting dev server. Run 'npm run dev' or 'npx next dev --turbo=false' when ready."
fi
