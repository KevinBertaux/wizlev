import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const packageJsonPath = join(rootDir, 'package.json');
const outputPath = join(distDir, 'build-info.json');

function safeExec(command) {
  try {
    return execSync(command, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function normalizeEnv(value) {
  return value && String(value).trim() !== '' ? String(value).trim() : null;
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const gitSha = normalizeEnv(process.env.COMMIT_REF) || normalizeEnv(safeExec('git rev-parse HEAD'));
const gitBranch = normalizeEnv(process.env.BRANCH) || normalizeEnv(safeExec('git branch --show-current'));

const buildInfo = {
  appName: packageJson.name,
  appVersion: packageJson.version,
  gitSha,
  gitShortSha: gitSha ? gitSha.slice(0, 7) : null,
  gitBranch,
  buildDate: new Date().toISOString(),
  deployContext: normalizeEnv(process.env.CONTEXT),
  deployId: normalizeEnv(process.env.DEPLOY_ID),
  url: normalizeEnv(process.env.URL),
  deployUrl: normalizeEnv(process.env.DEPLOY_URL),
};

mkdirSync(distDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(buildInfo, null, 2)}\n`, 'utf8');

console.log(`build-info written to ${outputPath}`);
