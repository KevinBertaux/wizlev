import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED_KEYS = {
  '.env.example': [
    'VITE_ADMIN_USERNAME',
    'VITE_ADMIN_PASSWORD_HASH',
    'VITE_ADMIN_SESSION_TTL_MS',
    'VITE_ADMIN_MAX_ATTEMPTS',
    'VITE_ADMIN_BLOCK_MS',
    'VITE_ADMIN_HARD_BLOCK_MS',
    'VITE_REMOTE_CONTENT_BASE_URL',
    'VITE_ENGLISH_VOCAB_REMOTE_FOLDER',
    'VITE_FRENCH_CONJUGATION_REMOTE_FOLDER',
    'VITE_SPANISH_VOCAB_REMOTE_FOLDER',
    'VITE_SYMMETRY_REMOTE_FOLDER',
    'VITE_SYMMETRY_REMOTE_CONFIG_FILE',
  ],
  '.env.e2e': [
    'VITE_ADMIN_USERNAME',
    'VITE_ADMIN_PASSWORD_HASH',
    'VITE_ADMIN_SESSION_TTL_MS',
    'VITE_ADMIN_MAX_ATTEMPTS',
    'VITE_ADMIN_BLOCK_MS',
    'VITE_ADMIN_HARD_BLOCK_MS',
    'VITE_REMOTE_CONTENT_BASE_URL',
    'VITE_ENGLISH_VOCAB_REMOTE_FOLDER',
    'VITE_FRENCH_CONJUGATION_REMOTE_FOLDER',
    'VITE_SYMMETRY_REMOTE_FOLDER',
  ],
};

const REQUIRED_VALUES = {
  '.env.example': {
    VITE_ENGLISH_VOCAB_REMOTE_FOLDER: 'languages/en/vocabulary',
    VITE_FRENCH_CONJUGATION_REMOTE_FOLDER: 'languages/fr/conjugation',
    VITE_SPANISH_VOCAB_REMOTE_FOLDER: 'languages/es/vocabulary',
    VITE_SYMMETRY_REMOTE_FOLDER: 'math/symmetry',
  },
  '.env.e2e': {
    VITE_ENGLISH_VOCAB_REMOTE_FOLDER: 'languages/en/vocabulary',
    VITE_FRENCH_CONJUGATION_REMOTE_FOLDER: 'languages/fr/conjugation',
    VITE_SYMMETRY_REMOTE_FOLDER: 'math/symmetry',
  },
};

const FORBIDDEN_KEYS = new Set([
  'VITE_VOCAB_REMOTE_BASE_URL',
  'VITE_VOCAB_REMOTE_LANG',
  'VITE_LANGUAGES_REMOTE_BASE_URL',
  'VITE_LANGUAGES_REMOTE_LANG',
]);

function parseEnvFile(fileName) {
  const content = readFileSync(join(process.cwd(), fileName), 'utf8');
  const entries = new Map();
  const regex = /^\s*(VITE_[A-Z0-9_]+)=(.*)$/gm;
  for (const match of content.matchAll(regex)) {
    const key = match[1];
    const rawValue = match[2].trim();
    const value = rawValue.replace(/^"|"$/g, '');
    entries.set(key, value);
  }
  return entries;
}

const issues = [];
for (const [fileName, requiredKeys] of Object.entries(REQUIRED_KEYS)) {
  const entries = parseEnvFile(fileName);

  for (const forbidden of FORBIDDEN_KEYS) {
    if (entries.has(forbidden)) {
      issues.push(`${fileName} contains forbidden legacy env key: ${forbidden}`);
    }
  }

  for (const key of requiredKeys) {
    if (!entries.has(key)) {
      issues.push(`${fileName} missing required env key: ${key}`);
    }
  }

  for (const key of entries.keys()) {
    if (!requiredKeys.includes(key)) {
      issues.push(`${fileName} contains unexpected env key: ${key}`);
    }
  }

  const expectedValues = REQUIRED_VALUES[fileName] ?? {};
  for (const [key, expectedValue] of Object.entries(expectedValues)) {
    if (entries.get(key) !== expectedValue) {
      issues.push(`${fileName} expected ${key}=${expectedValue}, got ${entries.get(key) ?? '<missing>'}`);
    }
  }
}

if (issues.length > 0) {
  console.error('Env guard failed. Env templates are not aligned with the project contract:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Env guard OK: env templates match the WizLev remote/module contract.');