import { describe, it, expect } from 'vitest';
import { validateUrl } from '../src/cli.js';

describe('validateUrl', () => {
  it('accepts https URL', () => {
    expect(() => validateUrl('https://example.com')).not.toThrow();
  });
  it('accepts http URL', () => {
    expect(() => validateUrl('http://localhost:3000')).not.toThrow();
  });
  it('accepts local IP with port', () => {
    expect(() => validateUrl('http://192.168.0.10:13378')).not.toThrow();
  });
  it('rejects file:// protocol', () => {
    expect(() => validateUrl('file:///etc/passwd')).toThrow(/http/i);
  });
  it('rejects invalid URL', () => {
    expect(() => validateUrl('not a url')).toThrow();
  });
});
