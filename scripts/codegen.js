// Loads BASE_URL from .env for local runs; in CI the env var is already set.
require('dotenv').config();
const { execSync } = require('child_process');
const url = process.env.BASE_URL;
if (!url) {
  console.error('BASE_URL is not set. Add it to .env or set it as a CI/CD environment variable.');
  process.exit(1);
}
execSync(`npx playwright codegen ${url}`, { stdio: 'inherit' });
