import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error('Start EcoSentinel with "npm run dev" from the workspace root.');
  process.exit(1);
}
const mapsPort = Number(process.env.ECOSENTINEL_MAPS_PORT) || 5173;
const mainPort = Number(process.env.ECOSENTINEL_MAIN_PORT) || 3000;
const mainUrl = `http://127.0.0.1:${mainPort}`;
const mapsTitle = '<title>Remix Ecodsentinel sid 10</title>';

async function inspectPage(url, expectedContent) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    const content = await response.text();
    return {
      reachable: true,
      healthy: response.ok && content.includes(expectedContent),
    };
  } catch {
    return { reachable: false, healthy: false };
  }
}

const [mainPage, mapsPage, proxiedMapsPage] = await Promise.all([
  inspectPage(`${mainUrl}/`, '<title>EcoSentinel</title>'),
  inspectPage(`http://127.0.0.1:${mapsPort}/maps/`, mapsTitle),
  inspectPage(`${mainUrl}/maps/`, mapsTitle),
]);
const mainAlreadyRunning = mainPage.healthy && proxiedMapsPage.healthy;
const mapsAlreadyRunning = mapsPage.healthy;

if (mainAlreadyRunning && mapsAlreadyRunning) {
  console.log(`EcoSentinel is already running at http://localhost:${mainPort}`);
  console.log('VS Code Simple Browser: use http://localhost:' + mainPort);
  console.log('Regular browser: http://127.0.0.1:' + mainPort);
}

const portConflicts = [];
if (mainPage.reachable && !mainAlreadyRunning) {
  portConflicts.push(`port ${mainPort} is occupied by a server that is not the integrated EcoSentinel app`);
}
if (mapsPage.reachable && !mapsAlreadyRunning) {
  portConflicts.push(`port ${mapsPort} is occupied by a server that is not the EcoSentinel maps app`);
}
if (portConflicts.length > 0) {
  console.error(`${portConflicts.join('; ')}. Stop the old server or set ECOSENTINEL_MAIN_PORT and ECOSENTINEL_MAPS_PORT.`);
  process.exitCode = 1;
}

const services = [
  {
    name: 'Maps',
    cwd: path.join(workspaceRoot, 'remix-ecodsentinel-sid-10'),
    args: ['run', 'dev', '--', '--host=0.0.0.0', `--port=${mapsPort}`, '--strictPort'],
    env: { ...process.env, ECOSENTINEL_MAPS_PORT: String(mapsPort) },
  },
  {
    name: 'Main',
    cwd: path.join(workspaceRoot, 'remix-v-jash-2'),
    args: ['run', 'dev', '--', '--host=0.0.0.0', `--port=${mainPort}`, '--strictPort'],
    env: {
      ...process.env,
      VITE_MAPS_APP_URL: '/maps/',
      ECOSENTINEL_MAPS_PORT: String(mapsPort),
    },
  },
];
const servicesToStart = portConflicts.length === 0 && !(mainAlreadyRunning && mapsAlreadyRunning)
  ? services.filter((service) => service.name === 'Maps' ? !mapsAlreadyRunning : !mainAlreadyRunning)
  : [];

const children = [];
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) child.kill();
}

for (const service of servicesToStart) {
  const child = spawn(process.execPath, [npmCli, ...service.args], {
    cwd: service.cwd,
    env: service.env,
    stdio: 'inherit',
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`${service.name} failed to start: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`${service.name} stopped; shutting down the other service.`);
      stop(code ?? 1);
    }
  });
}

if (children.length > 0) {
  process.on('SIGINT', () => stop(0));
  process.on('SIGTERM', () => stop(0));

  console.log(`EcoSentinel is available at http://localhost:${mainPort}`);
  console.log(`VS Code Simple Browser: use http://localhost:${mainPort}`);
  console.log(`Regular browser: http://127.0.0.1:${mainPort}`);
}