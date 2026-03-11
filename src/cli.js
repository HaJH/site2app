#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import os from 'os';
import { validateIcon, convertIcon } from './icon.js';
import { generateAppId, substituteVariables } from './builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function normalizeUrl(url) {
  if (!url.includes('://')) {
    url = 'https://' + url;
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`URL must use http or https protocol, got: ${parsed.protocol}`);
  }
  return url;
}

export async function build(options) {
  const { name, icon, target = 'installer', output = './dist' } = options;
  const url = normalizeUrl(options.url);
  await validateIcon(icon);
  const appId = generateAppId(name);

  const templateDir = path.join(__dirname, '..', 'template');
  const tmpDir = path.join(os.tmpdir(), `site2app-${Date.now()}`);

  try {
    console.log(`Building "${name}" from ${url}...`);

    await fs.copy(templateDir, tmpDir);
    console.log('Template copied.');

    await substituteVariables(tmpDir, {
      APP_NAME: name,
      APP_URL: url,
      APP_ID: appId,
    });
    console.log('Variables substituted.');

    const iconPath = await convertIcon(path.resolve(icon), tmpDir, process.platform);
    await fs.copy(path.resolve(icon), path.join(tmpDir, 'icon.png'));
    console.log(`Icon processed: ${iconPath}`);

    const { execSync } = await import('child_process');
    console.log('Installing dependencies...');
    execSync('npm install --production', { cwd: tmpDir, stdio: 'inherit' });

    console.log(`Building ${target}...`);
    const builderArgs = buildElectronBuilderArgs(target, process.platform);
    execSync(`npx electron-builder ${builderArgs} --config.directories.output=output`, {
      cwd: tmpDir,
      stdio: 'inherit',
    });

    const outputDir = path.resolve(output);
    await fs.ensureDir(outputDir);
    const buildOutput = path.join(tmpDir, 'output');
    if (target !== 'dir') {
      // Remove intermediate unpacked folder, keep only the final artifact
      await fs.remove(path.join(buildOutput, 'win-unpacked')).catch(() => {});
      await fs.remove(path.join(buildOutput, 'mac')).catch(() => {});
      await fs.remove(path.join(buildOutput, 'linux-unpacked')).catch(() => {});
    }
    await fs.copy(buildOutput, outputDir, { overwrite: true });
    console.log(`\nBuild complete: ${outputDir}`);
  } finally {
    await fs.remove(tmpDir).catch(() => {});
  }
}

function buildElectronBuilderArgs(target, platform) {
  const platformFlag = platform === 'darwin' ? '--mac' : '--win';
  const targetMap = {
    dir: 'dir',
    portable: platform === 'darwin' ? 'dmg' : 'portable',
    installer: platform === 'darwin' ? 'dmg' : 'nsis',
  };
  if (target === 'installer' && platform === 'darwin') {
    console.warn('Warning: macOS does not distinguish installer from portable. Building dmg.');
  }
  const t = targetMap[target];
  return t === 'dir' ? `${platformFlag} --dir` : `${platformFlag} ${t}`;
}

const program = new Command();

program
  .name('site2app')
  .description('Wrap any URL into a standalone desktop app')
  .version('0.1.0')
  .requiredOption('--name <name>', 'App name')
  .requiredOption('--icon <path>', 'App icon path (PNG, min 256x256)')
  .requiredOption('--url <url>', 'URL to load')
  .option('--target <type>', 'Build target: dir, portable, installer', 'installer')
  .option('--output <path>', 'Output directory', './dist')
  .action(async (options) => {
    try {
      await build(options);
    } catch (err) {
      console.error(`\nError: ${err.message}`);
      process.exit(1);
    }
  });

// Only parse when run directly (not when imported in tests)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  program.parse();
}
