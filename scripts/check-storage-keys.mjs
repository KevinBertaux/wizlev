import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC_DIR = join(process.cwd(), 'src');
const FORBIDDEN_PATTERNS = [/manabuplay_/g, /manabuplay-vocab/g];
const ALLOWED_LITERAL_KEYS = new Set();
const STORAGE_LITERAL_REGEX = /(localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]/g;

function listFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const st = statSync(fullPath);
    if (st.isDirectory()) {
      listFiles(fullPath, results);
      continue;
    }

    if (fullPath.endsWith('.js') || fullPath.endsWith('.vue')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = listFiles(SRC_DIR);
const issues = [];

for (const filePath of files) {
  const content = readFileSync(filePath, 'utf8');

  for (const pattern of FORBIDDEN_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      const line = content.slice(0, match.index).split('\n').length;
      issues.push({ filePath, line, message: `forbidden legacy storage token ${match[0]}` });
    }
  }

  for (const match of content.matchAll(STORAGE_LITERAL_REGEX)) {
    const storageType = match[1];
    const key = match[2];
    const line = content.slice(0, match.index).split('\n').length;
    if (ALLOWED_LITERAL_KEYS.has(key)) {
      continue;
    }
    if (!key.startsWith('wizlev_')) {
      issues.push({
        filePath,
        line,
        message: `${storageType} literal key must start with wizlev_: ${key}`,
      });
    }
  }
}

if (issues.length > 0) {
  console.error('Storage key guard failed. Non-compliant storage keys detected:');
  for (const issue of issues) {
    console.error(`- ${relative(process.cwd(), issue.filePath)}:${issue.line} -> ${issue.message}`);
  }
  process.exit(1);
}

console.log('Storage key guard OK: no legacy prefixes and all direct storage literals use wizlev_.');
