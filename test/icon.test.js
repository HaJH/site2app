import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateIcon, convertIcon } from '../src/icon.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');

describe('validateIcon', () => {
  it('accepts 256x256 PNG', async () => {
    await expect(validateIcon(path.join(FIXTURES, 'valid-icon.png'))).resolves.not.toThrow();
  });
  it('rejects PNG smaller than 256x256', async () => {
    await expect(validateIcon(path.join(FIXTURES, 'small-icon.png'))).rejects.toThrow(/256/);
  });
  it('rejects non-existent file', async () => {
    await expect(validateIcon('/no/such/file.png')).rejects.toThrow();
  });
  it('rejects non-PNG file', async () => {
    const txtFile = path.join(FIXTURES, 'not-a-png.txt');
    await expect(validateIcon(txtFile)).rejects.toThrow();
  });
});

describe('convertIcon', () => {
  it('converts PNG to ICO on Windows', async () => {
    const result = await convertIcon(path.join(FIXTURES, 'valid-icon.png'), FIXTURES, 'win32');
    expect(result).toMatch(/\.ico$/);
  });
});
