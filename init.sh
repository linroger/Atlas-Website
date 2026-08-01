#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"

if [[ ! -d node_modules ]]; then
  npm ci
fi

npm run check
npm run lint
npm test
npm run build
