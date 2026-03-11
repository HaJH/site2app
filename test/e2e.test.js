import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import os from 'os';
import { substituteVariables } from '../src/builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('End-to-end template preparation', () => {
  let tmpDir;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'site2app-e2e-'));
    const templateDir = path.join(__dirname, '..', 'template');
    await fs.copy(templateDir, tmpDir);
    await substituteVariables(tmpDir, {
      APP_NAME: 'TestApp',
      APP_URL: 'https://example.com',
      APP_ID: 'com.site2app.testapp',
    });
  });

  afterAll(async () => {
    await fs.remove(tmpDir);
  });

  it('substitutes variables in template/package.json', async () => {
    const pkg = await fs.readJson(path.join(tmpDir, 'package.json'));
    expect(pkg.name).toBe('com.site2app.testapp');
    expect(pkg.build.appId).toBe('com.site2app.testapp');
    expect(pkg.build.productName).toBe('TestApp');
  });

  it('substitutes variables in titlebar.html', async () => {
    const html = await fs.readFile(path.join(tmpDir, 'renderer', 'titlebar.html'), 'utf-8');
    expect(html).toContain('TestApp');
    expect(html).not.toContain('{{APP_NAME}}');
  });

  it('substitutes variables in main.js', async () => {
    const main = await fs.readFile(path.join(tmpDir, 'main.js'), 'utf-8');
    expect(main).toContain("'TestApp'");
    expect(main).toContain("'https://example.com'");
    expect(main).toContain("'com.site2app.testapp'");
    expect(main).not.toContain('{{');
  });

  it('has all expected files', async () => {
    const expectedFiles = [
      'main.js',
      'preload.js',
      'preload-settings.js',
      'package.json',
      'renderer/titlebar.html',
      'renderer/titlebar.css',
      'renderer/titlebar.js',
      'renderer/search.css',
      'renderer/search.js',
      'settings/settings.html',
      'settings/settings.css',
      'settings/settings.js',
    ];
    for (const file of expectedFiles) {
      expect(await fs.pathExists(path.join(tmpDir, file)), `Missing: ${file}`).toBe(true);
    }
  });

  it('main.js has no remaining template placeholders', async () => {
    const content = await fs.readFile(path.join(tmpDir, 'main.js'), 'utf-8');
    expect(content).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });
});
