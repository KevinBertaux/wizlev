import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_LOCALE, PUBLIC_LOCALE_PREFIX, ROUTE_NAMES, ROUTE_PATHS } from '../src/router/routes.js';

const issues = [];
const adminRouteNames = new Set([
  ROUTE_NAMES.STUDIO_OPS_LOGIN,
  ROUTE_NAMES.STUDIO_OPS_PANEL,
  ROUTE_NAMES.STUDIO_OPS_HELP,
]);

if (PUBLIC_LOCALE !== 'fr') {
  issues.push(`PUBLIC_LOCALE must be "fr", got "${PUBLIC_LOCALE}".`);
}
if (PUBLIC_LOCALE_PREFIX !== '/fr') {
  issues.push(`PUBLIC_LOCALE_PREFIX must be "/fr", got "${PUBLIC_LOCALE_PREFIX}".`);
}

for (const [key, path] of Object.entries(ROUTE_PATHS)) {
  const routeName = ROUTE_NAMES[key];
  const isAdmin = adminRouteNames.has(routeName);

  if (isAdmin) {
    if (!path.startsWith('/-/')) {
      issues.push(`${key} must stay under /-/..., got ${path}`);
    }
    continue;
  }

  if (!path.startsWith(PUBLIC_LOCALE_PREFIX)) {
    issues.push(`${key} must start with ${PUBLIC_LOCALE_PREFIX}, got ${path}`);
  }
}

const routerIndex = readFileSync(join(process.cwd(), 'src/router/index.js'), 'utf8');
const requiredLegacyRedirects = [
  "path: '/'",
  "path: '/math'",
  "path: '/math/multiplications'",
  "path: '/math/symmetry'",
  "path: '/languages'",
  "path: '/languages/english'",
  "path: '/languages/french'",
  "path: '/legal/legal-notice'",
  "path: '/legal/privacy-policy'",
  "path: '/legal/terms-of-use'",
  "path: '/legal/cookie-policy'",
  "path: `${PUBLIC_LOCALE_PREFIX}/:pathMatch(.*)*`",
  "path: '/:pathMatch(.*)*'",
];

for (const token of requiredLegacyRedirects) {
  if (!routerIndex.includes(token)) {
    issues.push(`router/index.js missing expected route token: ${token}`);
  }
}

if (issues.length > 0) {
  console.error('Route guard failed. Canonical routing contract is broken:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Route guard OK: public routes are canonical under /fr and legacy redirects are present.');
