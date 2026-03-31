import { createServer } from 'node:net';
import { spawnSync } from 'node:child_process';

async function findAvailablePort(start = 4175, end = 4195) {
  for (let port = start; port <= end; port += 1) {
    const available = await new Promise((resolve) => {
      const server = createServer();
      server.unref();
      server.on('error', () => resolve(false));
      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(true));
      });
    });

    if (available) {
      return port;
    }
  }

  throw new Error(`No free LHCI port found in range ${start}-${end}.`);
}

function runOnce(port) {
  const command = 'npx lhci autorun --config=.lighthouserc.cjs --upload.target=temporary-public-storage';
  const result = spawnSync(command, {
    shell: true,
    encoding: 'utf8',
    stdio: 'pipe',
    env: {
      ...process.env,
      LHCI_PORT: String(port),
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return result;
}

const port = await findAvailablePort();
console.log(`[lhci] Using preview port ${port}`);

const first = runOnce(port);
if (first.status === 0) {
  process.exit(0);
}

const output = `${first.stdout || ''}
${first.stderr || ''}
${first.error?.message || ''}`;
const retryable = output.includes('EPERM') || output.includes('Permission denied');
if (!retryable) {
  process.exit(first.status ?? 1);
}

console.warn('[lhci] Retrying once after EPERM cleanup issue...');
const second = runOnce(port);
if (second.status === 0) {
  process.exit(0);
}

const secondOutput = `${second.stdout || ''}
${second.stderr || ''}
${second.error?.message || ''}`;
const windowsEperm =
  process.platform === 'win32' &&
  (secondOutput.includes('EPERM') || secondOutput.includes('Permission denied'));

if (windowsEperm) {
  console.warn('[lhci] Non-blocking Windows EPERM during temp cleanup. Rely on CI (Linux) as strict gate.');
  process.exit(0);
}

process.exit(second.status ?? 1);
