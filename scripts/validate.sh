#!/usr/bin/env bash
set -euo pipefail

npm test
npm run check
npm run build
npm run smoke
node bin/agent-eval-pack.js validate dist/smoke/evals.json
