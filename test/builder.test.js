import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { generateAppId, substituteVariables } from '../src/builder.js';

describe('generateAppId', () => {
  it('converts name to lowercase kebab-case ID', () => {
    expect(generateAppId('My App')).toBe('com.site2app.my-app');
  });
  it('removes special characters', () => {
    expect(generateAppId('My App!')).toBe('com.site2app.my-app');
  });
  it('removes unicode characters', () => {
    expect(generateAppId('내 앱 MyApp')).toBe('com.site2app.myapp');
  });
  it('throws on empty result', () => {
    expect(() => generateAppId('내 앱')).toThrow(/영숫자/);
  });
  it('collapses multiple hyphens', () => {
    expect(generateAppId('My  --  App')).toBe('com.site2app.my-app');
  });
  it('trims leading/trailing hyphens', () => {
    expect(generateAppId('--App--')).toBe('com.site2app.app');
  });
});

describe('substituteVariables', () => {
  let tmpDir;
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'site2app-test-'));
  });
  afterEach(async () => {
    await fs.remove(tmpDir);
  });
  it('replaces all template variables in a file', async () => {
    const filePath = path.join(tmpDir, 'test.txt');
    await fs.writeFile(filePath, '{{APP_NAME}} at {{APP_URL}} id={{APP_ID}}');
    await substituteVariables(tmpDir, {
      APP_NAME: 'TestApp',
      APP_URL: 'https://example.com',
      APP_ID: 'com.site2app.testapp',
    });
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toBe('TestApp at https://example.com id=com.site2app.testapp');
  });
  it('handles nested directories', async () => {
    const subDir = path.join(tmpDir, 'sub');
    await fs.mkdirp(subDir);
    await fs.writeFile(path.join(subDir, 'file.js'), 'name = "{{APP_NAME}}"');
    await substituteVariables(tmpDir, { APP_NAME: 'Test', APP_URL: '', APP_ID: '' });
    const content = await fs.readFile(path.join(subDir, 'file.js'), 'utf-8');
    expect(content).toBe('name = "Test"');
  });
});
