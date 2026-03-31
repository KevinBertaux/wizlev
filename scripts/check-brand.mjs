import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const TARGETS = [
  'src',
  'docs',
  'public',
  '.github',
  'README.md',
  'ROADMAP.md',
  '.env.example',
  '.env.e2e',
  'package.json',
];
const TARGET_EXTENSIONS = new Set(['.js', '.json', '.md', '.vue', '.yml', '.yaml', '.html', '.txt', '.css']);
const FORBIDDEN_PATTERNS = [
  { label: 'legacy visible brand', regex: /ManabuPlay/g },
  { label: 'legacy app slug', regex: /manabuplay/g },
  { label: 'legacy domain', regex: /manabuplay\.fr/g },
  { label: 'non-obfuscated legal email', regex: /contact@wizlev\.com/g },
  { label: 'legacy vocab env', regex: /VITE_VOCAB_REMOTE_[A-Z0-9_]+/g },
  { label: 'legacy languages env', regex: /VITE_LANGUAGES_REMOTE_[A-Z0-9_]+/g },
];

function isTargetFile(path) {
  return TARGET_EXTENSIONS.has(extname(path));
}

function collectFiles(targetPath) {
  const fullPath = join(process.cwd(), targetPath);
  const st = statSync(fullPath);
  if (st.isDirectory()) {
    const files = [];
    for (const entry of readdirSync(fullPath)) {
      const child = join(targetPath, entry);
      const childFull = join(process.cwd(), child);
      const childStat = statSync(childFull);
      if (childStat.isDirectory()) {
        files.push(...collectFiles(child));
      } else if (isTargetFile(childFull)) {
        files.push(childFull);
      }
    }
    return files;
  }

  return isTargetFile(fullPath) ? [fullPath] : [];
}

const issues = [];
for (const target of TARGETS) {
  const full = join(process.cwd(), target);
  try {
    statSync(full);
  } catch {
    continue;
  }

  for (const filePath of collectFiles(target)) {
    const content = readFileSync(filePath, 'utf8');
    for (const pattern of FORBIDDEN_PATTERNS) {
      for (const match of content.matchAll(pattern.regex)) {
        const before = content.slice(0, match.index);
        const line = before.split('\n').length;
        issues.push({
          filePath,
          line,
          label: pattern.label,
          token: match[0],
        });
      }
    }
  }
}

if (issues.length > 0) {
  console.error('Brand guard failed. Forbidden legacy/product tokens detected:');
  for (const issue of issues) {
    console.error(`- ${relative(process.cwd(), issue.filePath)}:${issue.line} -> ${issue.label}: ${issue.token}`);
  }
  process.exit(1);
}

console.log('Brand guard OK: no legacy brand/domain/env tokens found in tracked app/docs files.');
