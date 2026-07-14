import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PUBLIC_REGISTRY = 'https://registry.npmjs.org/';
const FORBIDDEN_REGISTRY_PATTERNS = [
  'applied-caas-gateway',
  'internal.api.openai.org',
  'artifactory/api/npm/npm-public',
];

const failures = [];
const notices = [];

function parseVersion(input) {
  const match = String(input).trim().match(/^(?:v)?(\d+)\.(\d+)\.(\d+)/u);
  if (!match) return null;
  return match.slice(1).map(Number);
}

function isAtLeast(actual, minimum) {
  for (let index = 0; index < 3; index += 1) {
    if (actual[index] > minimum[index]) return true;
    if (actual[index] < minimum[index]) return false;
  }
  return true;
}

function normalizeRegistry(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

function report(label, status, detail) {
  const marker = status === 'PASS' ? '✓' : status === 'WARN' ? '!' : '✗';
  console.log(`${marker} ${label}: ${status}${detail ? ` — ${detail}` : ''}`);
}

function readProjectNpmrcRegistry(projectRoot) {
  const npmrcPath = resolve(projectRoot, '.npmrc');
  if (!existsSync(npmrcPath)) return '';

  const line = readFileSync(npmrcPath, 'utf8')
    .split(/\r?\n/u)
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('registry='));

  return line ? line.slice('registry='.length).trim() : '';
}

function readEffectiveRegistry(projectRoot) {
  const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  try {
    const output = execFileSync(npmExecutable, ['config', 'get', 'registry', '--location=project'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const registry = normalizeRegistry(output);
    if (registry && registry !== 'null/') return registry;
  } catch {
    // Fall back to the project .npmrc below.
  }

  return normalizeRegistry(readProjectNpmrcRegistry(projectRoot));
}

const projectRoot = process.cwd();
const rootPackagePath = resolve(projectRoot, 'package.json');
const desktopPackagePath = resolve(projectRoot, 'apps/desktop/package.json');

if (!existsSync(rootPackagePath) || !existsSync(desktopPackagePath)) {
  failures.push('Run this command from the project root containing package.json and apps/desktop/package.json.');
  report('Project root', 'FAIL', projectRoot);
} else {
  report('Project root', 'PASS', projectRoot);
}

const nodeVersion = parseVersion(process.version);
if (!nodeVersion || !isAtLeast(nodeVersion, [22, 12, 0])) {
  failures.push(`Node.js 22.12.0 or newer is required. Current: ${process.version}`);
  report('Node.js', 'FAIL', process.version);
} else {
  report('Node.js', 'PASS', process.version);
}

const npmVersionText = process.env.npm_config_user_agent?.match(/npm\/(\d+\.\d+\.\d+)/u)?.[1] ?? '';
const npmVersion = parseVersion(npmVersionText);
if (!npmVersionText) {
  notices.push('npm version could not be read from npm_config_user_agent. Confirm manually with npm -v.');
  report('npm', 'WARN', 'Run npm -v and confirm version 10.0.0 or newer.');
} else if (!npmVersion || !isAtLeast(npmVersion, [10, 0, 0])) {
  failures.push(`npm 10.0.0 or newer is required. Current: ${npmVersionText}`);
  report('npm', 'FAIL', npmVersionText);
} else {
  report('npm', 'PASS', npmVersionText);
}

const configuredRegistry = readEffectiveRegistry(projectRoot);
if (configuredRegistry !== PUBLIC_REGISTRY) {
  failures.push(
    `npm registry must be ${PUBLIC_REGISTRY}. Current: ${configuredRegistry || '(not detected)'}`,
  );
  report('npm registry', 'FAIL', configuredRegistry || 'not detected');
} else {
  report('npm registry', 'PASS', configuredRegistry);
}

for (const fileName of ['package-lock.json', 'npm-shrinkwrap.json']) {
  const filePath = resolve(projectRoot, fileName);
  if (!existsSync(filePath)) continue;

  const contents = readFileSync(filePath, 'utf8').toLowerCase();
  const matchedPattern = FORBIDDEN_REGISTRY_PATTERNS.find((pattern) => contents.includes(pattern));
  if (matchedPattern) {
    failures.push(`${fileName} contains a forbidden internal registry reference: ${matchedPattern}`);
    report(fileName, 'FAIL', `contains ${matchedPattern}`);
  } else {
    report(fileName, 'PASS', 'contains no forbidden internal registry references');
  }
}

const proxyValues = [
  ['npm_config_proxy', process.env.npm_config_proxy],
  ['npm_config_https_proxy', process.env.npm_config_https_proxy],
  ['HTTP_PROXY', process.env.HTTP_PROXY],
  ['HTTPS_PROXY', process.env.HTTPS_PROXY],
].filter(([, value]) => Boolean(value));

for (const [name, value] of proxyValues) {
  const lowered = String(value).toLowerCase();
  const matchedPattern = FORBIDDEN_REGISTRY_PATTERNS.find((pattern) => lowered.includes(pattern));
  if (matchedPattern) {
    failures.push(`${name} points to a forbidden internal endpoint.`);
    report(name, 'FAIL', String(value));
  }
}

if (existsSync(resolve(projectRoot, 'node_modules'))) {
  report('node_modules', 'PASS', 'installed');
} else {
  notices.push('node_modules is not present yet. Run npm install after this check passes.');
  report('node_modules', 'WARN', 'not installed yet');
}

if (failures.length > 0) {
  console.error('\nEnvironment check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nDo not continue until every FAIL item is fixed.');
  process.exitCode = 1;
} else {
  console.log('\nEnvironment check passed.');
  if (notices.length > 0) {
    console.log('\nNotices:');
    for (const notice of notices) console.log(`- ${notice}`);
  }
}
